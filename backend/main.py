from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, date, time, timedelta
import jwt
import bcrypt
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend config
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# JWT config
JWT_SECRET = os.environ.get('JWT_SECRET', 'booking-widget-secret-key-2024')
JWT_ALGORITHM = 'HS256'

# Create the main app
app = FastAPI(title="Embeddable Booking System API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    duration: int  # in minutes
    description: Optional[str] = ""
    price: Optional[float] = None

class WeeklyAvailability(BaseModel):
    day: int  # 0=Monday, 6=Sunday
    start_time: str  # "09:00"
    end_time: str  # "17:00"
    enabled: bool = True

class Business(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_name: str
    description: Optional[str] = ""
    email: EmailStr
    password_hash: str
    services: List[Service] = []
    availability: List[WeeklyAvailability] = []
    blocked_dates: List[str] = []  # List of "YYYY-MM-DD"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_id: str
    service_id: str
    service_name: str
    date: str  # "YYYY-MM-DD"
    start_time: str  # "09:00"
    end_time: str  # "09:30"
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    status: str = "confirmed"  # confirmed, cancelled
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ===================== REQUEST/RESPONSE MODELS =====================

class BusinessCreate(BaseModel):
    business_name: str
    description: Optional[str] = ""
    email: EmailStr
    password: str

class BusinessPublic(BaseModel):
    id: str
    business_name: str
    description: str
    services: List[Service]
    availability: List[WeeklyAvailability]

class ServiceCreate(BaseModel):
    name: str
    duration: int
    description: Optional[str] = ""
    price: Optional[float] = None

class AvailabilityUpdate(BaseModel):
    availability: List[WeeklyAvailability]

class BlockedDateRequest(BaseModel):
    date: str  # "YYYY-MM-DD"

class BookingCreate(BaseModel):
    business_id: str
    service_id: str
    date: str
    start_time: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    business_id: str
    business_name: str

class TimeSlot(BaseModel):
    start_time: str
    end_time: str
    available: bool

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(business_id: str) -> str:
    payload = {
        'business_id': business_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_business(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(' ')[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['business_id']
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===================== EMAIL HELPERS =====================

async def send_booking_confirmation(booking: Booking, business: dict):
    if not RESEND_API_KEY:
        logger.warning("Resend API key not configured, skipping email")
        return
    
    # Email to customer
    customer_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #18181b;">Booking Confirmed!</h1>
        <p>Hi {booking.customer_name},</p>
        <p>Your booking has been confirmed with <strong>{business['business_name']}</strong>.</p>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> {booking.service_name}</p>
            <p><strong>Date:</strong> {booking.date}</p>
            <p><strong>Time:</strong> {booking.start_time} - {booking.end_time}</p>
        </div>
        <p>If you need to cancel or reschedule, please contact us.</p>
        <p>Thank you!</p>
    </div>
    """
    
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [booking.customer_email],
            "subject": f"Booking Confirmed - {business['business_name']}",
            "html": customer_html
        })
        logger.info(f"Confirmation email sent to {booking.customer_email}")
    except Exception as e:
        logger.error(f"Failed to send customer email: {e}")
    
    # Email to business owner
    business_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #18181b;">New Booking Received!</h1>
        <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Customer:</strong> {booking.customer_name}</p>
            <p><strong>Email:</strong> {booking.customer_email}</p>
            <p><strong>Phone:</strong> {booking.customer_phone}</p>
            <p><strong>Service:</strong> {booking.service_name}</p>
            <p><strong>Date:</strong> {booking.date}</p>
            <p><strong>Time:</strong> {booking.start_time} - {booking.end_time}</p>
        </div>
    </div>
    """
    
    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [business['email']],
            "subject": f"New Booking - {booking.customer_name}",
            "html": business_html
        })
        logger.info(f"Notification email sent to {business['email']}")
    except Exception as e:
        logger.error(f"Failed to send business email: {e}")

# ===================== PUBLIC ENDPOINTS =====================

@api_router.get("/")
async def root():
    return {"message": "Embeddable Booking System API"}

@api_router.get("/businesses/{business_id}", response_model=BusinessPublic)
async def get_business(business_id: str):
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0, "password_hash": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

@api_router.get("/businesses/{business_id}/slots", response_model=List[TimeSlot])
async def get_available_slots(business_id: str, date: str, service_id: str):
    # Get business
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Check if date is blocked
    if date in business.get('blocked_dates', []):
        return []
    
    # Get service
    service = next((s for s in business.get('services', []) if s['id'] == service_id), None)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Parse date and get day of week
    try:
        booking_date = datetime.strptime(date, "%Y-%m-%d")
        day_of_week = booking_date.weekday()  # 0=Monday
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format")
    
    # Get availability for this day
    availability = next((a for a in business.get('availability', []) if a['day'] == day_of_week and a.get('enabled', True)), None)
    if not availability:
        return []
    
    # Generate time slots
    duration = service['duration']
    start_hour, start_min = map(int, availability['start_time'].split(':'))
    end_hour, end_min = map(int, availability['end_time'].split(':'))
    
    start_minutes = start_hour * 60 + start_min
    end_minutes = end_hour * 60 + end_min
    
    # Get existing bookings for this date
    existing_bookings = await db.bookings.find({
        "business_id": business_id,
        "date": date,
        "status": "confirmed"
    }, {"_id": 0}).to_list(100)
    
    booked_times = set()
    for booking in existing_bookings:
        b_start = booking['start_time']
        b_end = booking['end_time']
        b_start_h, b_start_m = map(int, b_start.split(':'))
        b_end_h, b_end_m = map(int, b_end.split(':'))
        b_start_mins = b_start_h * 60 + b_start_m
        b_end_mins = b_end_h * 60 + b_end_m
        for t in range(b_start_mins, b_end_mins, 15):
            booked_times.add(t)
    
    slots = []
    current = start_minutes
    
    while current + duration <= end_minutes:
        slot_start = f"{current // 60:02d}:{current % 60:02d}"
        slot_end_mins = current + duration
        slot_end = f"{slot_end_mins // 60:02d}:{slot_end_mins % 60:02d}"
        
        # Check if any time in this slot is already booked
        is_available = all(t not in booked_times for t in range(current, slot_end_mins, 15))
        
        slots.append(TimeSlot(start_time=slot_start, end_time=slot_end, available=is_available))
        current += 30  # 30-minute intervals
    
    return slots

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate):
    # Get business
    business = await db.businesses.find_one({"id": booking_data.business_id}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    # Get service
    service = next((s for s in business.get('services', []) if s['id'] == booking_data.service_id), None)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Check if slot is available
    slots = await get_available_slots(booking_data.business_id, booking_data.date, booking_data.service_id)
    slot = next((s for s in slots if s.start_time == booking_data.start_time and s.available), None)
    if not slot:
        raise HTTPException(status_code=400, detail="Time slot not available")
    
    # Create booking
    booking = Booking(
        business_id=booking_data.business_id,
        service_id=booking_data.service_id,
        service_name=service['name'],
        date=booking_data.date,
        start_time=slot.start_time,
        end_time=slot.end_time,
        customer_name=booking_data.customer_name,
        customer_email=booking_data.customer_email,
        customer_phone=booking_data.customer_phone
    )
    
    await db.bookings.insert_one(booking.model_dump())
    
    # Send confirmation emails (non-blocking)
    asyncio.create_task(send_booking_confirmation(booking, business))
    
    return booking

# ===================== ADMIN AUTH ENDPOINTS =====================

@api_router.post("/admin/register", response_model=LoginResponse)
async def register_business(data: BusinessCreate):
    # Check if email exists
    existing = await db.businesses.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create business with default availability (Mon-Fri 9-17)
    default_availability = [
        WeeklyAvailability(day=i, start_time="09:00", end_time="17:00", enabled=i < 5)
        for i in range(7)
    ]
    
    business = Business(
        business_name=data.business_name,
        description=data.description or "",
        email=data.email,
        password_hash=hash_password(data.password),
        availability=[a.model_dump() for a in default_availability]
    )
    
    await db.businesses.insert_one(business.model_dump())
    
    token = create_token(business.id)
    return LoginResponse(token=token, business_id=business.id, business_name=business.business_name)

@api_router.post("/admin/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    business = await db.businesses.find_one({"email": data.email}, {"_id": 0})
    if not business:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(data.password, business['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(business['id'])
    return LoginResponse(token=token, business_id=business['id'], business_name=business['business_name'])

# ===================== ADMIN PROTECTED ENDPOINTS =====================

@api_router.get("/admin/business")
async def get_admin_business(business_id: str = Depends(get_current_business)):
    business = await db.businesses.find_one({"id": business_id}, {"_id": 0, "password_hash": 0})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

@api_router.get("/admin/bookings", response_model=List[Booking])
async def get_admin_bookings(business_id: str = Depends(get_current_business)):
    bookings = await db.bookings.find({"business_id": business_id}, {"_id": 0}).sort("date", -1).to_list(1000)
    return bookings

@api_router.delete("/admin/bookings/{booking_id}")
async def cancel_booking(booking_id: str, business_id: str = Depends(get_current_business)):
    result = await db.bookings.update_one(
        {"id": booking_id, "business_id": business_id},
        {"$set": {"status": "cancelled"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking cancelled"}

@api_router.post("/admin/services", response_model=Service)
async def add_service(service_data: ServiceCreate, business_id: str = Depends(get_current_business)):
    service = Service(**service_data.model_dump())
    
    await db.businesses.update_one(
        {"id": business_id},
        {"$push": {"services": service.model_dump()}}
    )
    
    return service

@api_router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, business_id: str = Depends(get_current_business)):
    result = await db.businesses.update_one(
        {"id": business_id},
        {"$pull": {"services": {"id": service_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}

@api_router.put("/admin/availability")
async def update_availability(data: AvailabilityUpdate, business_id: str = Depends(get_current_business)):
    await db.businesses.update_one(
        {"id": business_id},
        {"$set": {"availability": [a.model_dump() for a in data.availability]}}
    )
    return {"message": "Availability updated"}

@api_router.post("/admin/blocked-dates")
async def add_blocked_date(data: BlockedDateRequest, business_id: str = Depends(get_current_business)):
    await db.businesses.update_one(
        {"id": business_id},
        {"$addToSet": {"blocked_dates": data.date}}
    )
    return {"message": "Date blocked"}

@api_router.delete("/admin/blocked-dates/{date}")
async def remove_blocked_date(date: str, business_id: str = Depends(get_current_business)):
    await db.businesses.update_one(
        {"id": business_id},
        {"$pull": {"blocked_dates": date}}
    )
    return {"message": "Date unblocked"}

# Include the router in the main app
app.include_router(api_router)

# Add CORS FIRST
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # temporarily allow all for debugging
    allow_methods=["*"],
    allow_headers=["*"],
)

# THEN include router
app.include_router(api_router)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

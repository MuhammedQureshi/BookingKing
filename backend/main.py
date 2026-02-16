from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import resend

# ===================== LOAD ENV =====================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ===================== CONFIG =====================

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

JWT_SECRET = os.environ.get("JWT_SECRET", "booking-widget-secret-key-2024")
JWT_ALGORITHM = "HS256"

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

# ===================== APP =====================

app = FastAPI(title="Embeddable Booking System API")

# ✅ CORS MUST COME BEFORE ROUTER
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://booking-king-alpha.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ===================== DATABASE =====================

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ===================== ROUTER =====================

api_router = APIRouter(prefix="/api")

# ===================== LOGGING =====================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    duration: int
    description: Optional[str] = ""
    price: Optional[float] = None

class WeeklyAvailability(BaseModel):
    day: int
    start_time: str
    end_time: str
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
    blocked_dates: List[str] = []
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    business_id: str
    service_id: str
    service_name: str
    date: str
    start_time: str
    end_time: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str
    status: str = "confirmed"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# ===================== REQUEST MODELS =====================

class BusinessCreate(BaseModel):
    business_name: str
    description: Optional[str] = ""
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    business_id: str
    business_name: str

class ServiceCreate(BaseModel):
    name: str
    duration: int
    description: Optional[str] = ""
    price: Optional[float] = None

class AvailabilityUpdate(BaseModel):
    availability: List[WeeklyAvailability]

class BlockedDateRequest(BaseModel):
    date: str

class BookingCreate(BaseModel):
    business_id: str
    service_id: str
    date: str
    start_time: str
    customer_name: str
    customer_email: EmailStr
    customer_phone: str

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
        "business_id": business_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_business(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["business_id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===================== EMAIL =====================

async def send_booking_confirmation(booking: Booking, business: dict):
    if not RESEND_API_KEY:
        return

    try:
        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [booking.customer_email],
            "subject": f"Booking Confirmed - {business['business_name']}",
            "html": f"""
                <h1>Booking Confirmed</h1>
                <p>Service: {booking.service_name}</p>
                <p>Date: {booking.date}</p>
                <p>Time: {booking.start_time} - {booking.end_time}</p>
            """
        })
    except Exception as e:
        logger.error(f"Email error: {e}")

# ===================== PUBLIC ROUTES =====================

@api_router.get("/")
async def root():
    return {"message": "Embeddable Booking System API"}

@api_router.post("/admin/register", response_model=LoginResponse)
async def register(data: BusinessCreate):
    existing = await db.businesses.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    business = Business(
        business_name=data.business_name,
        description=data.description,
        email=data.email,
        password_hash=hash_password(data.password),
    )

    await db.businesses.insert_one(business.model_dump())

    token = create_token(business.id)

    return LoginResponse(
        token=token,
        business_id=business.id,
        business_name=business.business_name,
    )

@api_router.post("/admin/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    business = await db.businesses.find_one({"email": data.email})
    if not business:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, business["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(business["id"])

    return LoginResponse(
        token=token,
        business_id=business["id"],
        business_name=business["business_name"],
    )

# ===================== PROTECTED =====================

@api_router.get("/admin/bookings", response_model=List[Booking])
async def get_admin_bookings(business_id: str = Depends(get_current_business)):
    return await db.bookings.find(
        {"business_id": business_id},
        {"_id": 0}
    ).to_list(1000)

# ===================== FINAL SETUP =====================

app.include_router(api_router)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

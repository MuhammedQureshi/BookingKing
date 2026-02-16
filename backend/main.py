from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import os
import uuid
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone

# ==========================================
# ENV
# ==========================================

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "bookingking")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
JWT_ALGORITHM = "HS256"

# ==========================================
# APP
# ==========================================

app = FastAPI(title="Embeddable Booking System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://booking-king-alpha.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# DATABASE
# ==========================================

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# ==========================================
# ROUTER
# ==========================================

api_router = APIRouter(prefix="/api")

# ==========================================
# MODELS
# ==========================================

class Service(BaseModel):
    id: str
    name: str
    duration: int
    price: Optional[float] = 0

class WeeklyAvailability(BaseModel):
    day: int
    start_time: str
    end_time: str
    enabled: bool = True

class BusinessCreate(BaseModel):
    business_name: str
    description: Optional[str] = ""
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class BookingCreate(BaseModel):
    business_id: str
    service_id: str
    date: str
    start_time: str
    end_time: str
    customer_name: str
    customer_email: EmailStr

# ==========================================
# AUTH HELPERS
# ==========================================

def hash_password(password: str):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str):
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(business_id: str):
    payload = {
        "business_id": business_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_business(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["business_id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==========================================
# HEALTH
# ==========================================

@api_router.get("/health")
async def health():
    return {"status": "ok"}

# ==========================================
# ADMIN AUTH
# ==========================================

@api_router.post("/admin/register")
async def register(data: BusinessCreate):
    if db.businesses.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    business_id = str(uuid.uuid4())

    business = {
        "id": business_id,
        "business_name": data.business_name,
        "description": data.description,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "services": [],
        "availability": [
            {"day": i, "start_time": "09:00", "end_time": "17:00", "enabled": i < 5}
            for i in range(7)
        ],
        "blocked_dates": [],
        "created_at": datetime.utcnow()
    }

    db.businesses.insert_one(business)

    token = create_token(business_id)

    return {
        "token": token,
        "business_id": business_id,
        "business_name": data.business_name
    }

@api_router.post("/admin/login")
async def login(data: LoginRequest):
    business = db.businesses.find_one({"email": data.email})

    if not business or not verify_password(data.password, business["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(business["id"])

    return {
        "token": token,
        "business_id": business["id"],
        "business_name": business["business_name"]
    }

# ==========================================
# ADMIN BUSINESS INFO
# ==========================================

@api_router.get("/admin/business")
async def get_business(business_id: str = Depends(get_current_business)):
    business = db.businesses.find_one(
        {"id": business_id},
        {"_id": 0, "password_hash": 0}
    )
    if not business:
        raise HTTPException(status_code=404, detail="Not found")
    return business

# ==========================================
# SERVICES CRUD
# ==========================================

@api_router.post("/admin/services")
async def add_service(service: Service, business_id: str = Depends(get_current_business)):
    db.businesses.update_one(
        {"id": business_id},
        {"$push": {"services": service.dict()}}
    )
    return {"message": "Service added"}

@api_router.delete("/admin/services/{service_id}")
async def delete_service(service_id: str, business_id: str = Depends(get_current_business)):
    db.businesses.update_one(
        {"id": business_id},
        {"$pull": {"services": {"id": service_id}}}
    )
    return {"message": "Service deleted"}

# ==========================================
# UPDATE AVAILABILITY
# ==========================================

@api_router.put("/admin/availability")
async def update_availability(
    availability: List[WeeklyAvailability],
    business_id: str = Depends(get_current_business)
):
    db.businesses.update_one(
        {"id": business_id},
        {"$set": {"availability": [a.dict() for a in availability]}}
    )
    return {"message": "Availability updated"}

# ==========================================
# BLOCK DATE
# ==========================================

@api_router.post("/admin/block-date")
async def block_date(date: str, business_id: str = Depends(get_current_business)):
    db.businesses.update_one(
        {"id": business_id},
        {"$addToSet": {"blocked_dates": date}}
    )
    return {"message": "Date blocked"}

# ==========================================
# PUBLIC: GET BUSINESS
# ==========================================

@api_router.get("/businesses/{business_id}")
async def public_business(business_id: str):
    business = db.businesses.find_one(
        {"id": business_id},
        {"_id": 0, "password_hash": 0}
    )
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

# ==========================================
# BOOKING CREATION (WITH CONFLICT CHECK)
# ==========================================

@api_router.post("/book")
async def create_booking(data: BookingCreate):

    # Check blocked date
    business = db.businesses.find_one({"id": data.business_id})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if data.date in business.get("blocked_dates", []):
        raise HTTPException(status_code=400, detail="Date is blocked")

    # Check conflict
    existing = db.bookings.find_one({
        "business_id": data.business_id,
        "date": data.date,
        "start_time": data.start_time
    })

    if existing:
        raise HTTPException(status_code=400, detail="Time slot already booked")

    service = next(
        (s for s in business["services"] if s["id"] == data.service_id),
        None
    )

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    booking = {
        "id": str(uuid.uuid4()),
        "business_id": data.business_id,
        "service_id": data.service_id,
        "service_name": service["name"],
        "date": data.date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "created_at": datetime.utcnow()
    }

    db.bookings.insert_one(booking)

    return {"message": "Booking confirmed"}

# ==========================================
# ADMIN GET BOOKINGS
# ==========================================

@api_router.get("/admin/bookings")
async def get_bookings(business_id: str = Depends(get_current_business)):
    return list(
        db.bookings.find(
            {"business_id": business_id},
            {"_id": 0}
        )
    )

# ==========================================
# INCLUDE ROUTER
# ==========================================

app.include_router(api_router)

# ==========================================
# SHUTDOWN
# ==========================================

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

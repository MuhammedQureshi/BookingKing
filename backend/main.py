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

# ==============================
# Environment
# ==============================

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "bookingking")
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key")
JWT_ALGORITHM = "HS256"

# ==============================
# App Initialization
# ==============================

app = FastAPI(title="Embeddable Booking System API")

# ==============================
# CORS (MUST COME FIRST)
# ==============================

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

# ==============================
# Database Setup
# ==============================

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# ==============================
# Router
# ==============================

api_router = APIRouter(prefix="/api")

# ==============================
# Models
# ==============================

class BusinessCreate(BaseModel):
    business_name: str
    description: Optional[str] = ""
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Service(BaseModel):
    id: str
    name: str
    duration: int
    price: Optional[float] = None

class Booking(BaseModel):
    id: str
    business_id: str
    service_id: str
    service_name: str
    date: str
    start_time: str
    end_time: str
    customer_name: str
    customer_email: EmailStr

# ==============================
# Helpers
# ==============================

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

# ==============================
# Health Check
# ==============================

@api_router.get("/health")
async def health():
    return {"status": "ok"}

# ==============================
# Admin Register
# ==============================

@api_router.post("/admin/register")
async def register_admin(data: BusinessCreate):
    existing = db.businesses.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    business_id = str(uuid.uuid4())

    business = {
        "id": business_id,
        "business_name": data.business_name,
        "description": data.description,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "services": [],
        "created_at": datetime.utcnow()
    }

    db.businesses.insert_one(business)

    token = create_token(business_id)

    return {
        "token": token,
        "business_id": business_id,
        "business_name": data.business_name
    }

# ==============================
# Admin Login
# ==============================

@api_router.post("/admin/login")
async def login_admin(data: LoginRequest):
    business = db.businesses.find_one({"email": data.email})

    if not business:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not verify_password(data.password, business["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(business["id"])

    return {
        "token": token,
        "business_id": business["id"],
        "business_name": business["business_name"]
    }

# ==============================
# Get Business Info (Protected)
# ==============================

@api_router.get("/admin/business")
async def get_business(business_id: str = Depends(get_current_business)):
    business = db.businesses.find_one(
        {"id": business_id},
        {"_id": 0, "password_hash": 0}
    )

    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    return business

# ==============================
# Get Bookings (Protected)
# ==============================

@api_router.get("/admin/bookings")
async def get_bookings(business_id: str = Depends(get_current_business)):
    bookings = list(
        db.bookings.find(
            {"business_id": business_id},
            {"_id": 0}
        )
    )
    return bookings

# ==============================
# Public Booking Endpoint
# ==============================

@api_router.post("/book")
async def create_booking(data: Booking):
    db.bookings.insert_one(data.dict())
    return {"message": "Booking confirmed"}

# ==============================
# Include Router
# ==============================

app.include_router(api_router)

# ==============================
# Shutdown
# ==============================

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    print("Database connection closed")

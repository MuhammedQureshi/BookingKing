from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import os
import bcrypt
import jwt
import uuid
import asyncio

# ==============================
# App Initialization
# ==============================

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

# ==============================
# Database Setup
# ==============================

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "bookingking")

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# ==============================
# JWT Config
# ==============================

JWT_SECRET = os.getenv("JWT_SECRET", "booking-widget-secret-key-2024")
JWT_ALGORITHM = "HS256"

# ==============================
# Models
# ==============================

class Service(BaseModel):
    id: str = str(uuid.uuid4())
    name: str
    duration: int
    description: Optional[str] = ""
    price: Optional[float] = None

class Business(BaseModel):
    id: str = str(uuid.uuid4())
    business_name: str
    email: EmailStr
    password_hash: str
    services: List[Service] = []
    created_at: str = datetime.now(timezone.utc).isoformat()

class Booking(BaseModel):
    id: str = str(uuid.uuid4())
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
    created_at: str = datetime.now(timezone.utc).isoformat()

# ==============================
# Auth Helpers
# ==============================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(business_id: str) -> str:
    payload = {"business_id": business_id, "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_business(authorization: str = Header(None)):
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

# ==============================
# API Router
# ==============================

api_router = APIRouter(prefix="/api")

@api_router.get("/health")
async def health():
    return {"status": "ok"}

# ------------------------------
# Admin Register
# ------------------------------
@api_router.post("/admin/register")
async def register_admin(data: dict):
    existing = db.businesses.find_one({"email": data["email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    hashed = hash_password(data["password"])
    business = Business(
        business_name=data["business_name"],
        email=data["email"],
        password_hash=hashed
    )
    db.businesses.insert_one(business.dict())
    token = create_token(business.id)
    return {"token": token, "business_id": business.id, "business_name": business.business_name}

# ------------------------------
# Admin Login
# ------------------------------
@api_router.post("/admin/login")
async def login_admin(data: dict):
    business = db.businesses.find_one({"email": data["email"]})
    if not business or not verify_password(data["password"], business["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(business["id"])
    return {"token": token, "business_id": business["id"], "business_name": business["business_name"]}

# Include Router
app.include_router(api_router)

# ==============================
# Shutdown Event
# ==============================

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from pathlib import Path
import os
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt

# ===================== ENV SETUP =====================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET", "super-secret")
JWT_ALGORITHM = "HS256"

# ===================== APP INIT =====================

app = FastAPI(title="Embeddable Booking System API")

# ✅ CORS MUST BE FIRST (after app creation)
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

# ===================== DATABASE =====================

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ===================== ROUTER =====================

api_router = APIRouter(prefix="/api")

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
        raise HTTPException(status_code=401, detail="Missing token")

    token = authorization.split(" ")[1]

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload["business_id"]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===================== HEALTH =====================

@api_router.get("/")
async def root():
    return {"status": "API running"}

# ===================== ADMIN AUTH =====================

@api_router.post("/admin/register", response_model=LoginResponse)
async def register(data: BusinessCreate):
    existing = await db.businesses.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    business = Business(
        business_name=data.business_name,
        description=data.description,
        email=data.email,
        password_hash=hash_password(data.password),
        availability=[
            WeeklyAvailability(day=i, start_time="09:00", end_time="17:00", enabled=i < 5)
            for i in range(7)
        ],
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

# ===================== ADMIN PROTECTED =====================

@api_router.get("/admin/bookings", response_model=List[Booking])
async def get_bookings(business_id: str = Depends(get_current_business)):
    return await db.bookings.find(
        {"business_id": business_id}, {"_id": 0}
    ).to_list(1000)

@api_router.get("/admin/business")
async def get_business(business_id: str = Depends(get_current_business)):
    business = await db.businesses.find_one(
        {"id": business_id}, {"_id": 0, "password_hash": 0}
    )
    if not business:
        raise HTTPException(status_code=404, detail="Not found")
    return business

# ===================== INCLUDE ROUTER (ONLY ONCE) =====================

app.include_router(api_router)

# ===================== SHUTDOWN =====================

@app.on_event("shutdown")
async def shutdown_db():
    client.close()

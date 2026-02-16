from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
import bcrypt
import jwt
import uuid
from datetime import datetime, timedelta, timezone
import os

# ----------------------
# App + CORS
# ----------------------
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

# ----------------------
# Mongo
# ----------------------
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "bookingking")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# ----------------------
# JWT
# ----------------------
JWT_SECRET = os.getenv("JWT_SECRET", "booking-widget-secret-key-2024")
JWT_ALGORITHM = "HS256"

# ----------------------
# Pydantic Models
# ----------------------
class RegisterRequest(BaseModel):
    business_name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ----------------------
# Helpers
# ----------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(business_id: str) -> str:
    payload = {"business_id": business_id, "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ----------------------
# Router
# ----------------------
api_router = APIRouter(prefix="/api")

@api_router.get("/health")
async def health():
    return {"status": "ok"}

@api_router.post("/admin/register")
async def register_admin(req: RegisterRequest):
    try:
        existing = db.businesses.find_one({"email": req.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
        
        business_id = str(uuid.uuid4())
        hashed = hash_password(req.password)
        business = {
            "id": business_id,
            "business_name": req.business_name,
            "email": req.email,
            "password_hash": hashed,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        db.businesses.insert_one(business)
        token = create_token(business_id)
        return {"token": token, "business_id": business_id, "business_name": req.business_name}
    except Exception as e:
        print("REGISTER ERROR:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.post("/admin/login")
async def login_admin(req: LoginRequest):
    try:
        business = db.businesses.find_one({"email": req.email})
        if not business or not verify_password(req.password, business["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        token = create_token(business["id"])
        return {"token": token, "business_id": business["id"], "business_name": business["business_name"]}
    except Exception as e:
        print("LOGIN ERROR:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

app.include_router(api_router)

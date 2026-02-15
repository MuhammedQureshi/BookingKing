from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import os

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
        "https://booking-king-alpha.vercel.app",  # your frontend
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
# API Router
# ==============================

api_router = APIRouter(prefix="/api")

# ------------------------------
# Example Health Check
# ------------------------------
@api_router.get("/health")
async def health():
    return {"status": "ok"}

# ------------------------------
# Admin Register
# ------------------------------
@api_router.post("/admin/register")
async def register_admin(data: dict):
    # Replace with your actual logic
    return {"message": "Admin registered successfully"}

# ------------------------------
# Admin Login
# ------------------------------
@api_router.post("/admin/login")
async def login_admin(data: dict):
    # Replace with your actual logic
    return {"message": "Admin login successful"}

# ==============================
# Include Router (ONLY ONCE)
# ==============================

app.include_router(api_router)

# ==============================
# Shutdown Event
# ==============================

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    print("Database connection closed")
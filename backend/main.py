from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import List, Optional
import os
import random
import string
from dotenv import load_dotenv

load_dotenv()

# ---------------------------
# Database setup
# ---------------------------

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/pgmt")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass


# ---------------------------
# Models
# ---------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    aadhar = Column(String, unique=True, index=True)
    password = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    meal_type = Column(String)
    date = Column(String)
    is_eating = Column(Boolean)
    veg_non_veg = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    issue = Column(String)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)


class Deadline(Base):
    __tablename__ = "deadlines"

    id = Column(Integer, primary_key=True, index=True)
    meal_type = Column(String, unique=True, index=True)
    deadline_hour = Column(Integer, default=9)
    deadline_minute = Column(Integer, default=0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ---------------------------
# Create tables
# ---------------------------

Base.metadata.create_all(bind=engine)


# ---------------------------
# Seed default deadlines
# ---------------------------

def seed_deadlines():
    db = SessionLocal()
    try:
        defaults = [
            {"meal_type": "breakfast", "deadline_hour": 9, "deadline_minute": 0},
            {"meal_type": "lunch", "deadline_hour": 9, "deadline_minute": 0},
            {"meal_type": "dinner", "deadline_hour": 19, "deadline_minute": 0},
        ]

        for d in defaults:
            existing = db.query(Deadline).filter(
                Deadline.meal_type == d["meal_type"]
            ).first()

            if not existing:
                db.add(Deadline(**d))

        db.commit()

    finally:
        db.close()


seed_deadlines()


# ---------------------------
# Seed admin
# ---------------------------

def seed_admin():
    if os.getenv("ENV", "development") != "production":
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.phone == "9999999999").first()

            if not admin:
                admin_user = User(
                    name="Admin",
                    phone="9999999999",
                    aadhar="999999999999",
                    password="ADMIN123",
                    is_admin=True,
                )

                db.add(admin_user)
                db.commit()

        finally:
            db.close()


seed_admin()


# ---------------------------
# FastAPI app
# ---------------------------

app = FastAPI(
    title="PGMT API",
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENV", "development") != "production" else None,
)


# ---------------------------
# CORS configuration
# ---------------------------

allowed_origins_env = os.getenv("ALLOWED_ORIGINS")

if allowed_origins_env:
    allowed_origins = [o.strip() for o in allowed_origins_env.split(",")]
else:
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

print("CORS allowed origins:", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# Helper functions
# ---------------------------

def generate_password(length=8):
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=length))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def is_deadline_passed(db: Session, meal_type: str) -> bool:
    deadline = db.query(Deadline).filter(Deadline.meal_type == meal_type).first()
    if not deadline:
        return False

    now = datetime.now()
    current_minutes = now.hour * 60 + now.minute
    deadline_minutes = deadline.deadline_hour * 60 + deadline.deadline_minute
    return current_minutes >= deadline_minutes


# ---------------------------
# Pydantic models
# ---------------------------

class UserSignup(BaseModel):
    name: str
    phone: str
    aadhar: str


class UserLogin(BaseModel):
    phone: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    phone: str
    aadhar: str
    password: Optional[str] = None
    is_admin: bool
    created_at: datetime


class MealCreate(BaseModel):
    user_id: int
    meal_type: str
    date: str
    is_eating: bool
    veg_non_veg: str


class MealResponse(BaseModel):
    id: int
    user_id: int
    meal_type: str
    date: str
    is_eating: bool
    veg_non_veg: str


class ServiceRequestCreate(BaseModel):
    user_id: int
    issue: str


class ServiceRequestUpdate(BaseModel):
    status: str


class ServiceRequestResponse(BaseModel):
    id: int
    user_id: int
    issue: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None


class DeadlineUpdate(BaseModel):
    meal_type: str
    deadline_hour: int
    deadline_minute: int


# ---------------------------
# Auth routes
# ---------------------------

@app.post("/api/auth/signup")
def signup(user_data: UserSignup, db: Session = Depends(get_db)):

    existing = db.query(User).filter(User.phone == user_data.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")

    existing_aadhar = db.query(User).filter(User.aadhar == user_data.aadhar).first()
    if existing_aadhar:
        raise HTTPException(status_code=400, detail="Aadhar already registered")

    password = generate_password()

    user = User(
        name=user_data.name,
        phone=user_data.phone,
        aadhar=user_data.aadhar,
        password=password,
        is_admin=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@app.post("/api/auth/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.phone == user_data.phone).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.password and user.password != user_data.password:
        raise HTTPException(status_code=401, detail="Incorrect password")

    return user


# ---------------------------
# Users
# ---------------------------

@app.get("/api/admin/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


# ---------------------------
# Meals
# ---------------------------

@app.post("/api/meals", response_model=MealResponse)
def create_meal(meal: MealCreate, db: Session = Depends(get_db)):
    if is_deadline_passed(db, meal.meal_type):
        raise HTTPException(status_code=403, detail=f"{meal.meal_type.capitalize()} deadline has passed")

    existing = db.query(Meal).filter(
        Meal.user_id == meal.user_id,
        Meal.date == meal.date,
        Meal.meal_type == meal.meal_type
    ).first()

    if existing:
        existing.is_eating = meal.is_eating
        existing.veg_non_veg = meal.veg_non_veg
        db.commit()
        db.refresh(existing)
        return existing

    new_meal = Meal(**meal.model_dump())

    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)

    return new_meal


@app.get("/api/meals/{date}", response_model=List[MealResponse])
def get_meals(date: str, db: Session = Depends(get_db)):
    return db.query(Meal).filter(Meal.date == date).all()


# ---------------------------
# Service requests
# ---------------------------

@app.post("/api/service-requests", response_model=ServiceRequestResponse)
def create_request(data: ServiceRequestCreate, db: Session = Depends(get_db)):

    req = ServiceRequest(user_id=data.user_id, issue=data.issue)

    db.add(req)
    db.commit()
    db.refresh(req)

    return req


@app.get("/api/service-requests", response_model=List[ServiceRequestResponse])
def get_requests(db: Session = Depends(get_db)):
    return db.query(ServiceRequest).all()


@app.get("/api/service-requests/user/{user_id}", response_model=List[ServiceRequestResponse])
def get_user_requests(user_id: int, db: Session = Depends(get_db)):
    return db.query(ServiceRequest).filter(ServiceRequest.user_id == user_id).all()


@app.put("/api/service-requests/{request_id}")
def update_request(request_id: int, update: ServiceRequestUpdate, db: Session = Depends(get_db)):

    req = db.query(ServiceRequest).filter(ServiceRequest.id == request_id).first()

    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = update.status

    if update.status == "Fixed":
        req.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(req)

    return req


# ---------------------------
# Admin dashboard
# ---------------------------

@app.get("/api/admin/meal-summary/{date}")
def meal_summary(date: str, db: Session = Depends(get_db)):

    meals = db.query(Meal).filter(Meal.date == date).all()

    breakfast = len([m for m in meals if m.is_eating and m.meal_type == "breakfast"])
    lunch = len([m for m in meals if m.is_eating and m.meal_type == "lunch"])
    dinner = len([m for m in meals if m.is_eating and m.meal_type == "dinner"])
    veg = len([m for m in meals if m.is_eating and m.veg_non_veg == "veg"])
    nonveg = len([m for m in meals if m.is_eating and m.veg_non_veg == "non_veg"])
    total = len([m for m in meals if m.is_eating])

    return {
        "total_eating": total,
        "breakfast": breakfast,
        "lunch": lunch,
        "dinner": dinner,
        "veg": veg,
        "non_veg": nonveg
    }


# ---------------------------
# Deadlines
# ---------------------------

@app.get("/api/deadlines")
def get_deadlines(db: Session = Depends(get_db)):
    return db.query(Deadline).all()


@app.put("/api/admin/deadlines")
def update_deadline(data: DeadlineUpdate, db: Session = Depends(get_db)):

    deadline = db.query(Deadline).filter(
        Deadline.meal_type == data.meal_type
    ).first()

    if not deadline:
        deadline = Deadline(meal_type=data.meal_type)
        db.add(deadline)

    deadline.deadline_hour = data.deadline_hour
    deadline.deadline_minute = data.deadline_minute
    deadline.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(deadline)

    return deadline


# ---------------------------
# Health check
# ---------------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------------------------
# Run server
# ---------------------------

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))

    uvicorn.run(app, host="0.0.0.0", port=port)

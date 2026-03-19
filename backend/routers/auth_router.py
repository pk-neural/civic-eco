from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
import uuid

from database import get_db
from models import User as DBUser, EcoScore as DBEcoScore
from schemas import UserCreate, UserLogin, UserResponse
from auth import get_password_hash, verify_password, create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    db_user = db.query(DBUser).filter(DBUser.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    user_id = str(uuid.uuid4())
    
    new_user = DBUser(
        id=user_id,
        email=user.email,
        hashed_password=hashed_password,
        city=user.city,
        state=user.state,
        lat=user.lat,
        lon=user.lon
    )
    db.add(new_user)
    
    # Initialize their eco score
    eco_score = DBEcoScore(user_id=user_id)
    db.add(eco_score)
    
    db.commit()
    db.refresh(new_user)
    
    # Auto login on signup (set cookie)
    access_token = create_access_token(
        data={"sub": new_user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    # HTTPOnly securely stores it so frontend JS can't read it
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False  # Set to True in production (HTTPS)
    )
    
    return new_user

@router.post("/login")
def login(user_credentials: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False
    )
    return {"message": "Logged in successfully", "user": {"id": user.id, "email": user.email, "city": user.city}}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: DBUser = Depends(get_current_user)):
    return current_user

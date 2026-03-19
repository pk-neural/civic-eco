from sqlalchemy import Boolean, Column, Float, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    city = Column(String)
    state = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    daily_inputs = relationship("DailyInput", back_populates="user")
    eco_scores = relationship("EcoScore", back_populates="user")
    badges = relationship("Badge", back_populates="user")
    waste_decisions = relationship("WasteDecision", back_populates="user")
    green_index_history = relationship("DailyGreenIndex", back_populates="user")

class DailyInput(Base):
    __tablename__ = "daily_inputs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    date = Column(String, index=True)  # YYYY-MM-DD
    timestamp = Column(String)
    ac_fan_hours = Column(Float)
    water_usage = Column(Float)
    transport_mode = Column(String)
    outdoor_exposure = Column(String)
    waste_segregation = Column(Boolean)

    user = relationship("User", back_populates="daily_inputs")

class EcoScore(Base):
    __tablename__ = "eco_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    water_credit = Column(Float, default=0.0)
    energy_credit = Column(Float, default=0.0)
    transport_credit = Column(Float, default=0.0)
    waste_credit = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    debt = Column(Float, default=0.0)

    user = relationship("User", back_populates="eco_scores")

class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    badge_id = Column(String)  # string id like "eco-starter"
    earned = Column(Boolean, default=False)

    user = relationship("User", back_populates="badges")

class WasteDecision(Base):
    __tablename__ = "waste_decisions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    item_name = Column(String)
    chosen_bin = Column(String)
    correct_bin = Column(String)
    timestamp = Column(String)

    user = relationship("User", back_populates="waste_decisions")

class DailyGreenIndex(Base):
    __tablename__ = "daily_green_indices"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    date = Column(String)
    score = Column(Float)
    trend = Column(String)

    user = relationship("User", back_populates="green_index_history")

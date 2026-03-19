from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from auth import get_current_user
from models import User, DailyInput, EcoScore, Badge, WasteDecision, DailyGreenIndex
from schemas import (
    DailyInputCreate, DailyInputResponse, EcoScoreModel, 
    BadgeModel, WasteDecisionModel, DailyGreenIndexModel
)

router = APIRouter(prefix="/data", tags=["data"])

@router.get("/daily-inputs", response_model=list[DailyInputResponse])
def get_all_daily_inputs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(DailyInput).filter(DailyInput.user_id == current_user.id).all()

@router.post("/daily-inputs", response_model=DailyInputResponse)
def create_daily_input(input_data: DailyInputCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_input = DailyInput(**input_data.dict(), user_id=current_user.id)
    db.add(new_input)
    db.commit()
    db.refresh(new_input)
    return new_input

@router.get("/today-input", response_model=DailyInputResponse)
def get_today_input(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    inp = db.query(DailyInput).filter(DailyInput.user_id == current_user.id, DailyInput.date == today).first()
    # Return 404 or None (None is cleaner for frontend translation)
    return inp

@router.get("/eco-score", response_model=EcoScoreModel)
def get_eco_score(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    score = db.query(EcoScore).filter(EcoScore.user_id == current_user.id).first()
    if not score:
        score = EcoScore(user_id=current_user.id)
        db.add(score)
        db.commit()
        db.refresh(score)
    return score

@router.post("/eco-score", response_model=EcoScoreModel)
def update_eco_score(score_data: EcoScoreModel, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    score = db.query(EcoScore).filter(EcoScore.user_id == current_user.id).first()
    if not score:
        score = EcoScore(user_id=current_user.id)
        db.add(score)
    
    for key, value in score_data.dict().items():
        setattr(score, key, value)
        
    db.commit()
    db.refresh(score)
    return score

@router.get("/badges", response_model=list[BadgeModel])
def list_badges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Badge).filter(Badge.user_id == current_user.id).all()

@router.post("/badges", response_model=list[BadgeModel])
def save_badges(badges: list[BadgeModel], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Clear old
    db.query(Badge).filter(Badge.user_id == current_user.id).delete()
    # Add new
    new_badges = [Badge(**b.dict(), user_id=current_user.id) for b in badges]
    db.add_all(new_badges)
    db.commit()
    return badges

@router.get("/waste-decisions", response_model=list[WasteDecisionModel])
def get_waste_decisions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(WasteDecision).filter(WasteDecision.user_id == current_user.id).all()

@router.post("/waste-decisions", response_model=WasteDecisionModel)
def track_waste_decision(decision: WasteDecisionModel, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_decision = WasteDecision(**decision.dict(), user_id=current_user.id)
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)
    return new_decision

@router.get("/green-index", response_model=list[DailyGreenIndexModel])
def get_green_index(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import desc
    return db.query(DailyGreenIndex).filter(DailyGreenIndex.user_id == current_user.id).order_by(desc(DailyGreenIndex.date)).all()

@router.post("/green-index", response_model=DailyGreenIndexModel)
def save_green_index(index: DailyGreenIndexModel, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(DailyGreenIndex).filter(
        DailyGreenIndex.user_id == current_user.id, 
        DailyGreenIndex.date == index.date
    ).first()
    
    if existing:
        return existing
        
    new_idx = DailyGreenIndex(**index.dict(), user_id=current_user.id)
    db.add(new_idx)
    db.commit()
    db.refresh(new_idx)
    return new_idx

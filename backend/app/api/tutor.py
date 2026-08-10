from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.models.db_models import (
    Profile, Subject, Topic, TutorSession, TutorMessage
)
from app.schemas import api_schemas
from app.api.deps import get_current_profile
from app.services.ai_service import get_ai_service

router = APIRouter()

@router.get("/sessions", response_model=List[api_schemas.TutorSessionOut])
def get_tutor_sessions(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    return db.query(TutorSession).filter(TutorSession.profile_id == profile.id).order_by(TutorSession.updated_at.desc()).all()

@router.post("/sessions", response_model=api_schemas.TutorSessionOut)
def create_tutor_session(
    session_in: api_schemas.TutorSessionCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    session = TutorSession(
        profile_id=profile.id,
        subject_id=session_in.subject_id,
        topic_id=session_in.topic_id,
        title=session_in.title
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions/{session_id}/messages", response_model=List[api_schemas.TutorMessageOut])
def get_tutor_messages(
    session_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    session = db.query(TutorSession).filter(TutorSession.id == session_id, TutorSession.profile_id == profile.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return db.query(TutorMessage).filter(TutorMessage.session_id == session_id).order_by(TutorMessage.created_at.asc()).all()

@router.post("/sessions/{session_id}/chat", response_model=api_schemas.TutorMessageOut)
def chat_with_tutor(
    session_id: int,
    chat_in: api_schemas.TutorMessageCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    session = db.query(TutorSession).filter(TutorSession.id == session_id, TutorSession.profile_id == profile.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    # 1. Save student message
    student_msg = TutorMessage(
        session_id=session_id,
        sender="student",
        message_text=chat_in.message_text,
        mode=chat_in.mode
    )
    db.add(student_msg)
    db.commit()
    db.refresh(student_msg)
    
    # 2. Get history
    history_records = db.query(TutorMessage).filter(TutorMessage.session_id == session_id).order_by(TutorMessage.created_at.asc()).all()
    history = [{"sender": r.sender, "content": r.message_text} for r in history_records]
    
    # Determine topic name
    topic_name = session.title
    difficulty = profile.current_skill_level
    
    if session.topic_id:
        topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
        if topic:
            topic_name = topic.name
            
    # 3. Call AI
    ai = get_ai_service()
    ai_response = ai.tutor_explain(topic_name, chat_in.mode, difficulty, history)
    
    # Format message content combining explanation and quiz question
    explanation = ai_response.get("explanation", "")
    question = ai_response.get("question", "")
    options = ai_response.get("options", [])
    correct_idx = ai_response.get("correct_option_idx", 0)
    
    # 4. Save tutor message
    tutor_msg = TutorMessage(
        session_id=session_id,
        sender="tutor",
        message_text=explanation,
        mode=chat_in.mode,
        interactive_state={
            "question": question,
            "options": options,
            "correct_option_idx": correct_idx
        }
    )
    
    session.updated_at = datetime.utcnow()
    db.add(tutor_msg)
    db.commit()
    db.refresh(tutor_msg)
    
    # Update profile XP for interacting with tutor!
    profile.xp += 10
    profile.level = (profile.xp // 100) + 1
    db.commit()
    
    return tutor_msg

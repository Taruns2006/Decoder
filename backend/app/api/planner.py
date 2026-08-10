from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.models.db_models import (
    Profile, Subject, Topic, StudentTopic, StudySession
)
from app.api.deps import get_current_profile
from app.services.ai_service import get_ai_service

router = APIRouter()

class SessionStatusUpdate(BaseModel):
    status: str # "completed", "skipped", "missed"

@router.get("/sessions")
def get_study_sessions(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    sessions = db.query(StudySession).filter(
        StudySession.profile_id == profile.id
    ).order_by(StudySession.date.asc(), StudySession.start_time.asc()).all()
    
    out = []
    for s in sessions:
        sub = db.query(Subject).filter(Subject.id == s.subject_id).first()
        top = db.query(Topic).filter(Topic.id == s.topic_id).first() if s.topic_id else None
        
        out.append({
            "id": s.id,
            "subject_id": s.subject_id,
            "subject_name": sub.name if sub else "Unknown Subject",
            "topic_id": s.topic_id,
            "topic_name": top.name if top else s.type.capitalize(),
            "date": s.date,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "duration_minutes": s.duration_minutes,
            "status": s.status,
            "type": s.type
        })
    return out

@router.post("/generate")
def generate_study_plan(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # 1. Fetch subjects
    subjects = db.query(Subject).filter(Subject.profile_id == profile.id).all()
    subject_names = [s.name for s in subjects]
    if not subjects:
        raise HTTPException(status_code=400, detail="Please add at least one subject to your syllabus first.")
        
    # 2. Fetch weak topics
    weak_st = db.query(StudentTopic).filter(
        StudentTopic.profile_id == profile.id,
        StudentTopic.status == "weak"
    ).all()
    
    weak_topics = []
    for ws in weak_st:
        t = db.query(Topic).filter(Topic.id == ws.topic_id).first()
        if t:
            weak_topics.append(t.name)
            
    # 3. Call AI Study Planner
    ai = get_ai_service()
    ai_sessions = ai.generate_study_plan(
        subject_names, weak_topics, [], profile.weekly_hours
    )
    
    # Delete old scheduled/skipped/missed sessions
    db.query(StudySession).filter(
        StudySession.profile_id == profile.id,
        StudySession.status != "completed"
    ).delete()
    db.commit()
    
    # 4. Save new sessions
    today = date.today()
    days_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
        "Friday": 4, "Saturday": 5, "Sunday": 6
    }
    
    saved_sessions = []
    for s in ai_sessions:
        # Find match for subject
        sub = next((subj for subj in subjects if subj.name == s["subject"]), subjects[0])
        
        # Find matching topic ID if possible
        topic_id = None
        topic = db.query(Topic).join(StudentTopic).filter(
            StudentTopic.profile_id == profile.id,
            Topic.name == s["topic"]
        ).first()
        if topic:
            topic_id = topic.id
        else:
            # pick first topic of this subject
            first_topic = db.query(Topic).join(SyllabusUnit).join(Syllabus).filter(
                Syllabus.subject_id == sub.id
            ).first()
            if first_topic:
                topic_id = first_topic.id
                
        # Calculate date for session
        day_name = s["day"]
        day_offset = days_map.get(day_name, 0)
        # Calculate next occurrence of this day
        days_ahead = day_offset - today.weekday()
        if days_ahead < 0:
            days_ahead += 7
        session_date = today + timedelta(days=days_ahead)
        
        db_s = StudySession(
            profile_id=profile.id,
            subject_id=sub.id,
            topic_id=topic_id,
            date=session_date,
            start_time=s["start_time"],
            end_time=s["end_time"],
            duration_minutes=s["duration_minutes"],
            status="scheduled",
            type=s["type"]
        )
        db.add(db_s)
        db.commit()
        db.refresh(db_s)
        saved_sessions.append(db_s)
        
    return {"status": "success", "message": f"Successfully generated {len(saved_sessions)} sessions."}

@router.post("/sessions/{session_id}/status")
def update_session_status(
    session_id: int,
    req: SessionStatusUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    session = db.query(StudySession).filter(StudySession.id == session_id, StudySession.profile_id == profile.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.status = req.status
    if req.status == "completed":
        profile.xp += int(session.duration_minutes * 0.5) # 0.5 XP per minute
        profile.level = (profile.xp // 100) + 1
        
        # update topic completion if session has a topic
        if session.topic_id:
            st = db.query(StudentTopic).filter(
                StudentTopic.profile_id == profile.id,
                StudentTopic.topic_id == session.topic_id
            ).first()
            if st and st.status == "not_started":
                st.status = "completed"
                st.last_reviewed = datetime.utcnow()
                
    db.commit()
    db.refresh(session)
    db.refresh(profile)
    return session

@router.post("/recalibrate")
def recalibrate_plan(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # Recalibrates Tide-Chart: moves remaining items forward if a session was missed
    sessions = db.query(StudySession).filter(
        StudySession.profile_id == profile.id,
        StudySession.status == "scheduled",
        StudySession.date >= date.today()
    ).all()
    
    # In demo/mock mode, we shift dates to simulate recalibration
    # Let's say we push everything 1 day forward if we missed, or re-arrange
    for s in sessions:
        s.date = s.date + timedelta(days=1)
        
    db.commit()
    return {"status": "success", "message": "Your Tide-Chart has been recalibrated.", "shifted_sessions_count": len(sessions)}

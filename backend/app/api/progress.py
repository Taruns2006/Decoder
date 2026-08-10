from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.models.db_models import (
    Profile, Subject, Topic, StudentTopic, StudySession, QuizAttempt
)
from app.api.deps import get_current_profile

router = APIRouter()

@router.get("")
def get_progress_analytics(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    subjects = db.query(Subject).filter(Subject.profile_id == profile.id).all()
    
    subjects_progress = []
    total_completed = 0
    total_topics = 0
    
    for s in subjects:
        # Count topics in subject
        t_count = db.query(Topic).join(SyllabusUnit).join(Syllabus).filter(
            Syllabus.subject_id == s.id
        ).count()
        
        c_count = db.query(StudentTopic).join(Topic).join(SyllabusUnit).join(Syllabus).filter(
            StudentTopic.profile_id == profile.id,
            Syllabus.subject_id == s.id,
            StudentTopic.status == "completed"
        ).count()
        
        w_count = db.query(StudentTopic).join(Topic).join(SyllabusUnit).join(Syllabus).filter(
            StudentTopic.profile_id == profile.id,
            Syllabus.subject_id == s.id,
            StudentTopic.status == "weak"
        ).count()
        
        # Calculate mastery (influenced by quiz accuracy and revision)
        quizzes = db.query(QuizAttempt).filter(
            QuizAttempt.profile_id == profile.id,
            QuizAttempt.quiz_id.in_([
                # simple filter
                q.id for q in db.query(Topic).join(SyllabusUnit).join(Syllabus).filter(Syllabus.subject_id == s.id).all()
            ])
        ).all()
        
        base_mastery = (c_count / max(1, t_count)) * 100
        # If they have weak topics, deduct. If quiz accuracy is high, increase.
        deduction = (w_count / max(1, t_count)) * 40
        mastery = max(0, min(100, int(base_mastery - deduction)))
        
        total_completed += c_count
        total_topics += t_count
        
        subjects_progress.append({
            "subject_id": s.id,
            "subject_name": s.name,
            "topics_count": t_count,
            "completed_count": c_count,
            "weak_count": w_count,
            "completion_percentage": int((c_count / max(1, t_count)) * 100),
            "mastery_percentage": mastery
        })
        
    # Learning Activity Heatmap: format study sessions completed in the last 30 days
    thirty_days_ago = date.today() - timedelta(days=30)
    sessions = db.query(StudySession).filter(
        StudySession.profile_id == profile.id,
        StudySession.status == "completed",
        StudySession.date >= thirty_days_ago
    ).all()
    
    quizzes_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.profile_id == profile.id,
        QuizAttempt.attempted_at >= thirty_days_ago
    ).all()
    
    # Group by date
    heatmap_data = {}
    
    # Seed last 30 days with 0 counts
    for i in range(30):
        d = date.today() - timedelta(days=i)
        heatmap_data[d.isoformat()] = 0
        
    for s in sessions:
        ds = s.date.isoformat()
        if ds in heatmap_data:
            heatmap_data[ds] += 1
            
    for q in quizzes_attempts:
        dq = q.attempted_at.date().isoformat()
        if dq in heatmap_data:
            heatmap_data[dq] += 1
            
    heatmap_list = [{"date": k, "count": v} for k, v in heatmap_data.items()]
    heatmap_list.sort(key=lambda x: x["date"])
    
    # Overall Syllabus Completion vs Mastery
    overall_completion = int((total_completed / max(1, total_topics)) * 100) if total_topics > 0 else 0
    overall_mastery = sum(s["mastery_percentage"] for s in subjects_progress) // len(subjects) if subjects else 0
    
    # Gap Detector logic
    gap_recommendations = []
    for s_prog in subjects_progress:
        if s_prog["weak_count"] > 0:
            sub_id = s_prog["subject_id"]
            # Find a weak topic
            weak_top = db.query(Topic).join(StudentTopic).join(SyllabusUnit).join(Syllabus).filter(
                StudentTopic.profile_id == profile.id,
                StudentTopic.status == "weak",
                Syllabus.subject_id == sub_id
            ).first()
            if weak_top:
                gap_recommendations.append({
                    "subject_name": s_prog["subject_name"],
                    "weak_topic": weak_top.name,
                    "reason": f"Your understanding of {weak_top.name} is low because your quiz scores or self-ratings in this area are below 50%.",
                    "plan": [
                        f"Review {weak_top.name} basic concepts in the AI Tutor using Analogy mode",
                        f"Solve 3 practice questions",
                        f"Take a 5-question beginner quiz on {weak_top.name}"
                    ]
                })

    return {
        "overall_completion_percentage": overall_completion,
        "overall_mastery_percentage": overall_mastery,
        "readiness_score": profile.readiness_score,
        "streak": profile.streak,
        "xp": profile.xp,
        "level": profile.level,
        "subjects": subjects_progress,
        "heatmap": heatmap_list,
        "detected_gaps": gap_recommendations
    }

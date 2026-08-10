from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Any
from app.core.database import get_db
from app.models.db_models import (
    Profile, Subject, Syllabus, SyllabusUnit, Topic, StudentTopic, 
    Assignment, Deadline, StudySession, QuizAttempt, Notification
)
from app.schemas import api_schemas
from app.api.deps import get_current_profile

router = APIRouter()

@router.get("/dashboard", response_model=api_schemas.DashboardOut)
def get_dashboard(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # 1. Streaks, XP, Level, Readiness
    # Note: Gamification stats are stored in the profile
    
    # 2. Syllabus completion count
    total_topics = db.query(Topic).join(SyllabusUnit).join(Syllabus).join(Subject).filter(
        Subject.profile_id == profile.id
    ).count()
    
    completed_topics = db.query(StudentTopic).filter(
        StudentTopic.profile_id == profile.id,
        StudentTopic.status == "completed"
    ).count()
    
    weak_topics = db.query(StudentTopic).filter(
        StudentTopic.profile_id == profile.id,
        StudentTopic.status == "weak"
    ).count()
    
    # 3. Weekly study hours
    one_week_ago = date.today() - timedelta(days=7)
    sessions = db.query(StudySession).filter(
        StudySession.profile_id == profile.id,
        StudySession.status == "completed",
        StudySession.date >= one_week_ago
    ).all()
    weekly_hours_studied = sum(s.duration_minutes for s in sessions) / 60.0
    
    # 4. Quiz Performance
    attempts = db.query(QuizAttempt).filter(QuizAttempt.profile_id == profile.id).all()
    if attempts:
        avg_score = sum((a.score / a.total_questions) * 100 for a in attempts) / len(attempts)
    else:
        avg_score = 0.0

    # 5. Deadlines & Exams
    now = datetime.utcnow()
    upcoming_deadlines = db.query(Assignment).filter(
        Assignment.profile_id == profile.id,
        Assignment.status != "completed",
        Assignment.due_date >= now
    ).order_by(Assignment.due_date.asc()).limit(5).all()
    
    upcoming_exams = db.query(Deadline).filter(
        Deadline.profile_id == profile.id,
        Deadline.type == "exam",
        Deadline.due_date >= now
    ).order_by(Deadline.due_date.asc()).limit(5).all()
    
    # Convert deadlines to list of dicts for serialization
    deadlines_list = []
    for d in upcoming_deadlines:
        time_left = d.due_date - now
        hours_left = max(0, int(time_left.total_seconds() / 3600))
        # Estimate risk: if due soon and estimated hours are high
        risk_score = 0
        if hours_left > 0:
            risk_score = min(100, int((d.estimated_hours / hours_left) * 100))
        else:
            risk_score = 100 if d.status != "completed" else 0
            
        risk_level = "Low"
        if risk_score > 70:
            risk_level = "High"
        elif risk_score > 35:
            risk_level = "Medium"
            
        deadlines_list.append({
            "id": d.id,
            "title": d.title,
            "due_date": d.due_date,
            "hours_left": hours_left,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "status": d.status
        })

    exams_list = []
    for e in upcoming_exams:
        days_left = (e.due_date.date() - date.today()).days
        exams_list.append({
            "id": e.id,
            "title": e.title,
            "due_date": e.due_date,
            "days_left": days_left
        })

    # 6. ATLANTIS INTELLIGENCE ENGINE (Recommendations & Priority)
    # Default priority
    today_priority = "Explore your Syllabus"
    today_priority_reason = "You haven't added any subjects to your study program yet."
    today_priority_next_action = "Go to the Syllabus tab to add your academic courses."
    insights = []
    
    # Check subjects
    subjects = db.query(Subject).filter(Subject.profile_id == profile.id).all()
    if subjects:
        today_priority = f"Review {subjects[0].name}"
        today_priority_reason = "Let's kickstart your study sessions for this term."
        today_priority_next_action = f"Start by creating study modules for {subjects[0].name}."
        
        # Check if there's any weak topics
        weak_student_topic = db.query(StudentTopic).filter(
            StudentTopic.profile_id == profile.id,
            StudentTopic.status == "weak"
        ).first()
        
        if weak_student_topic:
            topic = db.query(Topic).filter(Topic.id == weak_student_topic.topic_id).first()
            if topic:
                subject = db.query(Subject).join(Syllabus).join(SyllabusUnit).filter(
                    SyllabusUnit.id == topic.unit_id
                ).first()
                subject_name = subject.name if subject else "your syllabus"
                today_priority = f"{subject_name} — {topic.name}"
                today_priority_reason = f"Your mastery of this topic is currently marked as Weak. Revision is recommended to build back confidence."
                today_priority_next_action = "Open the AI Tutor, select Analogy or Simple mode, and clear your concepts."
                insights.append(f"Struggling with {topic.name}? Let the AI Tutor explain it using a customized learning style.")

        # Check if there are assignments due soon
        if upcoming_deadlines:
            urgent_assignment = upcoming_deadlines[0]
            time_left = urgent_assignment.due_date - now
            hours_left = int(time_left.total_seconds() / 3600)
            if hours_left < 48:
                today_priority = f"Assignment: {urgent_assignment.title}"
                today_priority_reason = f"This assignment is due in {hours_left} hours. You estimated it will take {urgent_assignment.estimated_hours} hours to complete."
                today_priority_next_action = "Break the assignment down using the AI Assignment Assistant and get started."
                insights.append(f"High risk deadline: {urgent_assignment.title} is due very soon!")

        # Check if there's an exam approaching
        if upcoming_exams:
            urgent_exam = upcoming_exams[0]
            days_left = (urgent_exam.due_date.date() - date.today()).days
            if days_left <= 7:
                # Find weak topic in this subject
                today_priority = f"Prepare for {urgent_exam.title}"
                today_priority_reason = f"Your exam is in {days_left} days. Your overall syllabus readiness for this subject requires attention."
                today_priority_next_action = "Switch to Exam Preparation Mode to generate a focused 5-day study plan."
                insights.append(f"Exam countdown: {urgent_exam.title} in {days_left} days. Time to study!")

    # Default general insights
    if not insights:
        insights.append("Keep your study streak alive by completing a 30-minute revision session today.")
        insights.append("Use the Whispering Library to ask details on tough concepts.")
    
    # Add other insights if they exist
    if streak := profile.streak:
        if streak >= 3:
            insights.append(f"Awesome! You are on a {streak}-day study streak. Keep the momentum going!")
            
    if avg_score > 0:
        if avg_score < 60:
            insights.append(f"Your average quiz score is {avg_score:.1f}%. Try taking a mini-quiz in Beginner mode to reinforce concepts.")
        else:
            insights.append(f"Great job! Your average quiz score is a solid {avg_score:.1f}%. Keep it up!")

    return {
        "today_priority": today_priority,
        "today_priority_reason": today_priority_reason,
        "today_priority_next_action": today_priority_next_action,
        "streak": profile.streak,
        "xp": profile.xp,
        "level": profile.level,
        "readiness_score": profile.readiness_score,
        "completed_topics_count": completed_topics,
        "total_topics_count": total_topics,
        "weak_topics_count": weak_topics,
        "weekly_hours_target": profile.weekly_hours,
        "weekly_hours_studied": weekly_hours_studied,
        "upcoming_deadlines": deadlines_list,
        "upcoming_exams": exams_list,
        "quiz_performance_average": avg_score,
        "insights": insights
    }

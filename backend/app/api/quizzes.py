from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from app.core.database import get_db
from app.models.db_models import (
    Profile, Subject, Topic, StudentTopic, Quiz, QuizQuestion, QuizAttempt, QuizAnswer
)
from app.api.deps import get_current_profile
from app.services.ai_service import get_ai_service

router = APIRouter()

class QuizGenerateRequest(BaseModel):
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    title: str
    difficulty: str = "Medium"
    num_questions: int = 5
    time_limit_minutes: int = 10

class QuizAnswerSubmit(BaseModel):
    question_id: int
    selected_answer: str

class QuizSubmitRequest(BaseModel):
    quiz_id: int
    answers: List[QuizAnswerSubmit]
    time_taken_seconds: int

@router.post("/generate")
def generate_quiz(
    req: QuizGenerateRequest,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    topic_name = req.title
    if req.topic_id:
        topic = db.query(Topic).filter(Topic.id == req.topic_id).first()
        if topic:
            topic_name = topic.name

    # 1. Call AI service to generate questions
    ai = get_ai_service()
    ai_questions = ai.generate_quiz(topic_name, req.difficulty, req.num_questions)
    
    # 2. Save Quiz header
    db_quiz = Quiz(
        profile_id=profile.id,
        subject_id=req.subject_id,
        topic_id=req.topic_id,
        title=req.title,
        difficulty=req.difficulty,
        num_questions=len(ai_questions),
        time_limit_minutes=req.time_limit_minutes,
        completed=False
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    
    # 3. Save Quiz Questions
    questions_out = []
    for q in ai_questions:
        db_q = QuizQuestion(
            quiz_id=db_quiz.id,
            question_text=q["question_text"],
            question_type=q["question_type"],
            options=q["options"],
            correct_answer=str(q["correct_answer"]),
            explanation=q["explanation"]
        )
        db.add(db_q)
        db.commit()
        db.refresh(db_q)
        
        # Don't return correct answers to frontend during quiz taking!
        questions_out.append({
            "id": db_q.id,
            "question_text": db_q.question_text,
            "question_type": db_q.question_type,
            "options": db_q.options
        })
        
    return {
        "quiz_id": db_quiz.id,
        "title": db_quiz.title,
        "difficulty": db_quiz.difficulty,
        "time_limit_minutes": db_quiz.time_limit_minutes,
        "questions": questions_out
    }

@router.post("/submit")
def submit_quiz(
    req: QuizSubmitRequest,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    quiz = db.query(Quiz).filter(Quiz.id == req.quiz_id, Quiz.profile_id == profile.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == req.quiz_id).all()
    q_map = {q.id: q for q in questions}
    
    score = 0
    correct_details = []
    weak_concepts = []
    
    # Submit Answers and evaluate
    # Create the attempt first
    attempt = QuizAttempt(
        quiz_id=req.quiz_id,
        profile_id=profile.id,
        score=0, # updated later
        total_questions=len(questions),
        time_taken_seconds=req.time_taken_seconds
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Match answers
    ans_map = {a.question_id: a.selected_answer for a in req.answers}
    
    for q_id, q in q_map.items():
        student_ans = ans_map.get(q_id, "")
        is_correct = (student_ans.strip().lower() == q.correct_answer.strip().lower())
        
        if is_correct:
            score += 1
        else:
            weak_concepts.append(q.question_text.split("?")[0]) # add simple hint
            
        db_ans = QuizAnswer(
            attempt_id=attempt.id,
            question_id=q_id,
            student_answer=student_ans,
            is_correct=is_correct,
            explanation_review=q.explanation
        )
        db.add(db_ans)
        
        correct_details.append({
            "question_id": q_id,
            "question_text": q.question_text,
            "student_answer": student_ans,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation
        })
        
    attempt.score = score
    attempt.weak_concepts = weak_concepts
    
    # Simple recommendation
    topic_ref = quiz.title
    if quiz.topic_id:
        topic = db.query(Topic).filter(Topic.id == quiz.topic_id).first()
        if topic:
            topic_ref = topic.name
    attempt.recommended_revision = [f"Revise fundamentals of {topic_ref} and read explanation guides."]
    
    # Mark quiz as completed
    quiz.completed = True
    
    # Adaptive system feedback: Update StudentTopic status
    accuracy = (score / len(questions)) * 100 if questions else 0
    if quiz.topic_id:
        st = db.query(StudentTopic).filter(
            StudentTopic.profile_id == profile.id,
            StudentTopic.topic_id == quiz.topic_id
        ).first()
        
        if st:
            if accuracy >= 80:
                st.status = "completed"
            elif accuracy < 50:
                st.status = "weak"
            else:
                st.status = "difficult"
            st.last_reviewed = datetime.utcnow()
            
    # Gamification updates:
    profile.xp += int(score * 15 + 10) # 15 XP per correct answer, 10 XP base
    profile.level = (profile.xp // 100) + 1
    # Recalculate readiness
    profile.readiness_score = min(100, max(10, int(profile.readiness_score * 0.9 + accuracy * 0.1)))
    
    db.commit()
    db.refresh(attempt)
    db.refresh(profile)
    
    return {
        "attempt_id": attempt.id,
        "score": score,
        "total_questions": len(questions),
        "accuracy_percentage": accuracy,
        "xp_gained": int(score * 15 + 10),
        "results": correct_details,
        "weak_concepts": weak_concepts,
        "recommended_revision": attempt.recommended_revision
    }

@router.get("/attempts")
def get_quiz_attempts(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    attempts = db.query(QuizAttempt).filter(QuizAttempt.profile_id == profile.id).order_by(QuizAttempt.attempted_at.desc()).all()
    out = []
    for a in attempts:
        quiz = db.query(Quiz).filter(Quiz.id == a.quiz_id).first()
        out.append({
            "id": a.id,
            "quiz_title": quiz.title if quiz else "Syllabus Quiz",
            "score": a.score,
            "total_questions": a.total_questions,
            "attempted_at": a.attempted_at,
            "weak_concepts": a.weak_concepts
        })
    return out

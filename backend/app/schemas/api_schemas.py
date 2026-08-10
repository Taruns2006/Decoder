from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any
from datetime import datetime, date

# Auth & User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int

class TokenData(BaseModel):
    user_id: Optional[int] = None

# Profile Schemas
class ProfileBase(BaseModel):
    name: Optional[str] = None
    student_type: Optional[str] = None  # "school" or "college"
    institution: Optional[str] = None
    course_class: Optional[str] = None
    year: Optional[str] = None
    goals: Optional[str] = None
    career_interests: Optional[List[str]] = None
    weekly_hours: Optional[float] = 10.0
    preferred_study_time: Optional[str] = None
    current_skill_level: Optional[str] = "Beginner"

class ProfileCreate(ProfileBase):
    pass

class ProfileUpdate(ProfileBase):
    readiness_score: Optional[int] = None
    streak: Optional[int] = None
    xp: Optional[int] = None
    level: Optional[int] = None

class ProfileOut(ProfileBase):
    id: int
    user_id: int
    readiness_score: int
    streak: int
    xp: int
    level: int
    created_at: datetime

    class Config:
        from_attributes = True

# Academics & Syllabus Schemas
class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    priority: Optional[int] = 3

class SubjectOut(SubjectCreate):
    id: int
    profile_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SyllabusCreate(BaseModel):
    name: str

class SyllabusOut(BaseModel):
    id: int
    subject_id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

class SyllabusUnitCreate(BaseModel):
    name: str
    sequence_order: Optional[int] = 0

class SyllabusUnitOut(BaseModel):
    id: int
    syllabus_id: int
    name: str
    sequence_order: int

    class Config:
        from_attributes = True

class TopicCreate(BaseModel):
    name: str
    importance_level: Optional[str] = "Medium"
    sequence_order: Optional[int] = 0
    parent_id: Optional[int] = None

class TopicOut(BaseModel):
    id: int
    unit_id: int
    name: str
    importance_level: str
    sequence_order: int
    parent_id: Optional[int] = None

    class Config:
        from_attributes = True

class StudentTopicUpdate(BaseModel):
    status: str  # "not_started", "completed", "weak", "difficult"
    priority: Optional[int] = 3
    personal_notes: Optional[str] = None

class StudentTopicOut(BaseModel):
    id: int
    profile_id: int
    topic_id: int
    status: str
    priority: int
    last_reviewed: Optional[datetime] = None
    personal_notes: Optional[str] = None

    class Config:
        from_attributes = True

# Tutor Session Schemas
class TutorMessageCreate(BaseModel):
    message_text: str
    mode: Optional[str] = "simple"  # beginner, simple, detailed, exam, technical, analogy

class TutorMessageOut(BaseModel):
    id: int
    session_id: int
    sender: str
    message_text: str
    mode: str
    interactive_state: Optional[Any] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TutorSessionCreate(BaseModel):
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    title: str

class TutorSessionOut(BaseModel):
    id: int
    profile_id: int
    subject_id: Optional[int] = None
    topic_id: Optional[int] = None
    title: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Dashboard Response
class DashboardOut(BaseModel):
    today_priority: Optional[str] = None
    today_priority_reason: Optional[str] = None
    today_priority_next_action: Optional[str] = None
    streak: int
    xp: int
    level: int
    readiness_score: int
    completed_topics_count: int
    total_topics_count: int
    weak_topics_count: int
    weekly_hours_target: float
    weekly_hours_studied: float
    upcoming_deadlines: List[Any] = []
    upcoming_exams: List[Any] = []
    quiz_performance_average: float = 0.0
    insights: List[str] = []

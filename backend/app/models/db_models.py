from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

# Auth & User Base
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    profile = relationship("Profile", back_populates="user", uselist=False)

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    student_type = Column(String(50), nullable=True)  # "school" or "college"
    institution = Column(String(255), nullable=True)   # School or College name
    course_class = Column(String(100), nullable=True)  # Course (e.g. B.Tech CS) or Class (e.g. Class 12)
    year = Column(String(50), nullable=True)
    goals = Column(Text, nullable=True)
    career_interests = Column(JSON, nullable=True)     # list of strings
    weekly_hours = Column(Float, default=10.0)
    preferred_study_time = Column(String(100), nullable=True) # "morning", "evening", etc.
    current_skill_level = Column(String(100), default="Beginner")
    
    # Gamification
    readiness_score = Column(Integer, default=50)
    streak = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="profile")

# Academics & Syllabus
class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Integer, default=3) # 1 (Highest) to 5 (Lowest)
    created_at = Column(DateTime, default=datetime.utcnow)

class Syllabus(Base):
    __tablename__ = "syllabi"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SyllabusUnit(Base):
    __tablename__ = "syllabus_units"
    id = Column(Integer, primary_key=True, index=True)
    syllabus_id = Column(Integer, ForeignKey("syllabi.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    sequence_order = Column(Integer, default=0)

class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("syllabus_units.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    importance_level = Column(String(50), default="Medium")  # High, Medium, Low
    sequence_order = Column(Integer, default=0)
    parent_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True) # for subtopics if self-referential

class StudentTopic(Base):
    __tablename__ = "student_topics"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="not_started") # "not_started", "completed", "weak", "difficult"
    priority = Column(Integer, default=3)
    last_reviewed = Column(DateTime, nullable=True)
    personal_notes = Column(Text, nullable=True)

# Study Planning & Deadlines
class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    active = Column(Boolean, default=True)

class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True)
    date = Column(Date, nullable=False)
    start_time = Column(String(50), nullable=True) # "18:00"
    end_time = Column(String(50), nullable=True)   # "18:45"
    duration_minutes = Column(Integer, default=45)
    status = Column(String(50), default="scheduled") # "scheduled", "completed", "skipped", "missed"
    type = Column(String(50), default="learning")    # "learning", "revision", "practice", "assignment"

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=False)
    priority = Column(Integer, default=3) # 1 (Highest) to 5 (Lowest)
    estimated_hours = Column(Float, default=2.0)
    status = Column(String(50), default="not_started") # "not_started", "in_progress", "completed", "overdue"
    risk_score = Column(Integer, default=0) # 0 to 100

class Deadline(Base):
    __tablename__ = "deadlines"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), nullable=False) # "assignment", "exam", "presentation", "other"
    title = Column(String(255), nullable=False)
    due_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)

# Quizzes
class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="Medium") # Easy, Medium, Hard
    num_questions = Column(Integer, default=5)
    time_limit_minutes = Column(Integer, default=10)
    completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), default="mcq") # "mcq", "true_false", "fill_in_blanks", "short_answer"
    options = Column(JSON, nullable=True) # list of option strings (for MCQ)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    time_taken_seconds = Column(Integer, default=0)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    weak_concepts = Column(JSON, nullable=True) # list of strings
    recommended_revision = Column(JSON, nullable=True) # list of strings

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"
    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    student_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    explanation_review = Column(Text, nullable=True)

# Documents & Notes
class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=True)
    file_type = Column(String(100), nullable=True)
    status = Column(String(50), default="uploaded") # "uploaded", "processing", "processed", "failed"
    summary = Column(Text, nullable=True)
    key_concepts = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    text_content = Column(Text, nullable=False)
    embedding = Column(JSON, nullable=True) # vector stored as list of floats (for SQLite fallback)

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(50), default="detailed") # "revision", "detailed", "exam", "cheat_sheet", "definitions"
    generated_from_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Flashcard(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True)
    front = Column(Text, nullable=False)
    back = Column(Text, nullable=False)
    source_document_id = Column(Integer, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"
    id = Column(Integer, primary_key=True, index=True)
    flashcard_id = Column(Integer, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    rating = Column(String(50), nullable=False) # "again", "hard", "good", "easy"
    next_review_at = Column(DateTime, nullable=False)
    interval_days = Column(Integer, default=1)
    ease_factor = Column(Float, default=2.5)
    reviewed_at = Column(DateTime, default=datetime.utcnow)

# AI Tutor Sessions
class TutorSession(Base):
    __tablename__ = "tutor_sessions"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class TutorMessage(Base):
    __tablename__ = "tutor_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("tutor_sessions.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(50), nullable=False) # "student", "tutor"
    message_text = Column(Text, nullable=False)
    mode = Column(String(50), default="simple") # "beginner", "simple", "detailed", "exam", "technical", "analogy"
    interactive_state = Column(JSON, nullable=True) # store current tutoring progress
    created_at = Column(DateTime, default=datetime.utcnow)

# Progress Records
class ProgressRecord(Base):
    __tablename__ = "progress_records"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    completion_percentage = Column(Float, default=0.0)
    mastery_score = Column(Float, default=0.0)
    study_time_minutes = Column(Integer, default=0)
    quiz_accuracy_percentage = Column(Float, default=0.0)
    streak_count = Column(Integer, default=0)
    record_date = Column(Date, nullable=False)

# Skills & Career Engine
class Skill(Base):
    __tablename__ = "skills"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)

class StudentSkill(Base):
    __tablename__ = "student_skills"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    proficiency_level = Column(String(50), default="beginner") # beginner, intermediate, advanced
    evidence_description = Column(Text, nullable=True)
    source = Column(String(100), default="self") # resume, quiz, project, self

class CareerGoal(Base):
    __tablename__ = "career_goals"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    target_career = Column(String(255), nullable=False) # e.g. "Software Engineer"
    target_role = Column(String(255), nullable=True)
    target_companies = Column(JSON, nullable=True)

class CareerRole(Base):
    __tablename__ = "career_roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    required_skills = Column(JSON, nullable=True) # list of skill names
    optional_skills = Column(JSON, nullable=True) # list of skill names

class SkillGap(Base):
    __tablename__ = "skill_gaps"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="missing") # missing, weak_evidence, satisfied
    priority = Column(Integer, default=3)
    recommendations = Column(JSON, nullable=True)

class Roadmap(Base):
    __tablename__ = "roadmaps"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    career_goal_id = Column(Integer, ForeignKey("career_goals.id", ondelete="CASCADE"), nullable=True)
    title = Column(String(255), nullable=False)
    target_date = Column(Date, nullable=True)

class RoadmapStep(Base):
    __tablename__ = "roadmap_steps"
    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    phase_name = Column(String(255), nullable=False) # e.g. "Phase 1 - Foundations"
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    status = Column(String(50), default="locked") # locked, in_progress, completed
    skills_to_acquire = Column(JSON, nullable=True) # list of skill names

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    required_skills = Column(JSON, nullable=True) # list of strings
    status = Column(String(50), default="recommended") # recommended, in_progress, completed
    github_url = Column(String(255), nullable=True)
    demo_url = Column(String(255), nullable=True)

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True) # if null, it is global
    category = Column(String(50), nullable=False) # course, doc, book, practice, youtube, paper, tool, dataset
    title = Column(String(255), nullable=False)
    url = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    saved = Column(Boolean, default=False)
    recommended_by_ai = Column(Boolean, default=False)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="general") # deadline, session, exam, revision, quiz, roadmap, progress
    read = Column(Boolean, default=False)
    trigger_time = Column(DateTime, default=datetime.utcnow)

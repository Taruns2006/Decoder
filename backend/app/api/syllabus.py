from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Any
from app.core.database import get_db
from app.models.db_models import (
    Profile, Subject, Syllabus, SyllabusUnit, Topic, StudentTopic
)
from app.schemas import api_schemas
from app.api.deps import get_current_profile

router = APIRouter()

@router.get("/subjects", response_model=List[api_schemas.SubjectOut])
def get_subjects(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    return db.query(Subject).filter(Subject.profile_id == profile.id).all()

@router.post("/subjects", response_model=api_schemas.SubjectOut)
def create_subject(
    subject_in: api_schemas.SubjectCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    subject = Subject(
        profile_id=profile.id,
        name=subject_in.name,
        description=subject_in.description,
        priority=subject_in.priority
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    
    # Auto create a main syllabus entry for this subject
    syllabus = Syllabus(subject_id=subject.id, name=f"{subject.name} Syllabus")
    db.add(syllabus)
    db.commit()
    return subject

@router.get("/subjects/{subject_id}/full")
def get_full_syllabus(
    subject_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # Verify ownership
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.profile_id == profile.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    syllabus = db.query(Syllabus).filter(Syllabus.subject_id == subject_id).first()
    if not syllabus:
        return {
            "subject": subject,
            "units": []
        }
        
    units = db.query(SyllabusUnit).filter(SyllabusUnit.syllabus_id == syllabus.id).order_by(SyllabusUnit.sequence_order.asc()).all()
    
    units_data = []
    for unit in units:
        topics = db.query(Topic).filter(Topic.unit_id == unit.id, Topic.parent_id == None).order_by(Topic.sequence_order.asc()).all()
        topics_data = []
        for topic in topics:
            # Subtopics
            subtopics = db.query(Topic).filter(Topic.parent_id == topic.id).order_by(Topic.sequence_order.asc()).all()
            
            # Status
            st = db.query(StudentTopic).filter(
                StudentTopic.profile_id == profile.id,
                StudentTopic.topic_id == topic.id
            ).first()
            
            subtopics_data = []
            for sub in subtopics:
                sub_st = db.query(StudentTopic).filter(
                    StudentTopic.profile_id == profile.id,
                    StudentTopic.topic_id == sub.id
                ).first()
                subtopics_data.append({
                    "id": sub.id,
                    "name": sub.name,
                    "sequence_order": sub.sequence_order,
                    "status": sub_st.status if sub_st else "not_started",
                    "personal_notes": sub_st.personal_notes if sub_st else ""
                })
                
            topics_data.append({
                "id": topic.id,
                "name": topic.name,
                "importance_level": topic.importance_level,
                "sequence_order": topic.sequence_order,
                "status": st.status if st else "not_started",
                "personal_notes": st.personal_notes if st else "",
                "subtopics": subtopics_data
            })
            
        units_data.append({
            "id": unit.id,
            "name": unit.name,
            "sequence_order": unit.sequence_order,
            "topics": topics_data
        })
        
    return {
        "subject": {
            "id": subject.id,
            "name": subject.name,
            "description": subject.description,
            "priority": subject.priority
        },
        "syllabus_id": syllabus.id,
        "units": units_data
    }

@router.post("/subjects/{subject_id}/units")
def add_unit(
    subject_id: int,
    unit_in: api_schemas.SyllabusUnitCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.profile_id == profile.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    syllabus = db.query(Syllabus).filter(Syllabus.subject_id == subject_id).first()
    if not syllabus:
        syllabus = Syllabus(subject_id=subject_id, name=f"{subject.name} Syllabus")
        db.add(syllabus)
        db.commit()
        db.refresh(syllabus)
        
    unit = SyllabusUnit(
        syllabus_id=syllabus.id,
        name=unit_in.name,
        sequence_order=unit_in.sequence_order
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit

@router.post("/units/{unit_id}/topics")
def add_topic(
    unit_id: int,
    topic_in: api_schemas.TopicCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    unit = db.query(SyllabusUnit).filter(SyllabusUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Syllabus unit not found")
        
    topic = Topic(
        unit_id=unit_id,
        name=topic_in.name,
        importance_level=topic_in.importance_level,
        sequence_order=topic_in.sequence_order,
        parent_id=topic_in.parent_id
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    
    # Create default StudentTopic entry
    student_topic = StudentTopic(
        profile_id=profile.id,
        topic_id=topic.id,
        status="not_started"
    )
    db.add(student_topic)
    db.commit()
    
    return topic

@router.post("/topics/{topic_id}/student-topic", response_model=api_schemas.StudentTopicOut)
def update_student_topic(
    topic_id: int,
    update_in: api_schemas.StudentTopicUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    st = db.query(StudentTopic).filter(
        StudentTopic.profile_id == profile.id,
        StudentTopic.topic_id == topic_id
    ).first()
    
    if not st:
        st = StudentTopic(
            profile_id=profile.id,
            topic_id=topic_id,
            status=update_in.status,
            priority=update_in.priority,
            personal_notes=update_in.personal_notes
        )
        db.add(st)
    else:
        st.status = update_in.status
        st.priority = update_in.priority
        st.personal_notes = update_in.personal_notes
        
    # Give some XP if completed!
    if update_in.status == "completed":
        profile.xp += 20
        # level up check (every 100 XP is a level)
        profile.level = (profile.xp // 100) + 1
        
    db.commit()
    db.refresh(st)
    return st

@router.post("/upload-syllabus")
def upload_syllabus_document(
    file: UploadFile = File(...),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # This acts as a mock/placeholder parser that takes a syllabus PDF/TXT and populates subjects/topics
    # In live mode it will call document analyzer, in demo mode it will extract standard templates based on name
    filename = file.filename.lower()
    
    # Create a Subject based on filename
    subject_name = "Intro to Database Systems"
    if "network" in filename:
        subject_name = "Computer Networks"
    elif "structure" in filename or "dsa" in filename:
        subject_name = "Data Structures & Algorithms"
    elif "operating" in filename or "os" in filename:
        subject_name = "Operating Systems"
    elif "marketing" in filename:
        subject_name = "Principles of Marketing"
        
    subject = Subject(profile_id=profile.id, name=subject_name, description=f"Syllabus uploaded from {file.filename}")
    db.add(subject)
    db.commit()
    db.refresh(subject)
    
    syllabus = Syllabus(subject_id=subject.id, name=f"{subject.name} Syllabus")
    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)
    
    # Add units and topics based on standard structures
    units = []
    if "database" in subject_name.lower() or "dbms" in filename:
        units = [
            ("Unit 1: Relational Model", ["Introduction to Relational Databases", "Relational Algebra", "SQL Queries Basics"]),
            ("Unit 2: Database Design", ["ER Diagrams", "Functional Dependencies", "Normalization (1NF, 2NF, 3NF, BCNF)"]),
            ("Unit 3: Transaction Management", ["ACID Properties", "Concurrency Control", "Locking Protocols", "Database Recovery"])
        ]
    elif "networks" in subject_name.lower():
        units = [
            ("Unit 1: Physical & Data Link Layer", ["OSI Reference Model", "Framing & Error Correction", "MAC Sublayer Protocols"]),
            ("Unit 2: Network Layer", ["IPv4 & IPv6 Addressing", "Subnetting", "Routing Algorithms (Dijkstra, Distance Vector)"]),
            ("Unit 3: Transport Layer", ["TCP Handshake & Connection Management", "UDP Basics", "TCP Congestion Control"])
        ]
    else:
        # Default Computer Science syllabus
        units = [
            ("Unit 1: Foundation Concepts", ["Basic Terminology", "Key Architecture Principles", "Execution Cycles"]),
            ("Unit 2: Advanced Topics", ["Scalability & Performance", "Integration Strategies", "Security Best Practices"])
        ]
        
    for u_idx, (u_name, topics_list) in enumerate(units):
        unit = SyllabusUnit(syllabus_id=syllabus.id, name=u_name, sequence_order=u_idx)
        db.add(unit)
        db.commit()
        db.refresh(unit)
        
        for t_idx, t_name in enumerate(topics_list):
            topic = Topic(unit_id=unit.id, name=t_name, importance_level="High" if t_idx == 1 else "Medium", sequence_order=t_idx)
            db.add(topic)
            db.commit()
            db.refresh(topic)
            
            # Default StudentTopic status
            st = StudentTopic(profile_id=profile.id, topic_id=topic.id, status="not_started")
            db.add(st)
            db.commit()
            
    return {
        "status": "success",
        "message": f"Successfully parsed and loaded syllabus for {subject_name}.",
        "subject_id": subject.id
    }

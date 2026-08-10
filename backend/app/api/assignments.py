from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, date
from app.core.database import get_db
from app.models.db_models import (
    Profile, Subject, Assignment, Topic
)
from app.api.deps import get_current_profile
from app.services.ai_service import get_ai_service

router = APIRouter()

class AssignmentCreate(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: int = 3
    estimated_hours: float = 2.0

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[int] = None
    estimated_hours: Optional[float] = None
    status: Optional[str] = None # "not_started", "in_progress", "completed", "overdue"

@router.get("")
def get_assignments(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    assignments = db.query(Assignment).filter(Assignment.profile_id == profile.id).all()
    
    out = []
    now = datetime.utcnow()
    for a in assignments:
        sub = db.query(Subject).filter(Subject.id == a.subject_id).first()
        
        # Calculate Risk Score
        time_left = a.due_date - now
        hours_left = max(0.1, time_left.total_seconds() / 3600)
        
        risk_score = 0
        if a.status == "completed":
            risk_score = 0
        elif hours_left <= 0:
            risk_score = 100
        else:
            # risk depends on remaining hours vs estimated effort
            risk_score = min(100, int((a.estimated_hours / hours_left) * 100))
            if a.priority == 1:
                risk_score = min(100, risk_score + 15)
                
        # Status overrides
        status_val = a.status
        if status_val != "completed" and a.due_date < now:
            status_val = "overdue"
            risk_score = 100
            
        risk_level = "Low"
        if risk_score > 70:
            risk_level = "High"
        elif risk_score > 35:
            risk_level = "Medium"
            
        out.append({
            "id": a.id,
            "subject_id": a.subject_id,
            "subject_name": sub.name if sub else "General",
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "priority": a.priority,
            "estimated_hours": a.estimated_hours,
            "status": status_val,
            "risk_score": risk_score,
            "risk_level": risk_level
        })
    return out

@router.post("")
def create_assignment(
    req: AssignmentCreate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # Verify subject exists
    sub = db.query(Subject).filter(Subject.id == req.subject_id, Subject.profile_id == profile.id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subject not found")
        
    db_a = Assignment(
        profile_id=profile.id,
        subject_id=req.subject_id,
        title=req.title,
        description=req.description,
        due_date=req.due_date,
        priority=req.priority,
        estimated_hours=req.estimated_hours,
        status="not_started"
    )
    db.add(db_a)
    db.commit()
    db.refresh(db_a)
    return db_a

@router.put("/{assignment_id}")
def update_assignment(
    assignment_id: int,
    req: AssignmentUpdate,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    a = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.profile_id == profile.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    for field, val in req.model_dump(exclude_unset=True).items():
        setattr(a, field, val)
        
    if req.status == "completed":
        profile.xp += 50 # massive XP for completing assignment!
        profile.level = (profile.xp // 100) + 1
        
    db.commit()
    db.refresh(a)
    db.refresh(profile)
    return a

@router.post("/{assignment_id}/assistant")
def assignment_assistant(
    assignment_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # AI Assignment Assistant: breaks down requirements, creates execution plan & concepts checklist
    a = db.query(Assignment).filter(Assignment.id == assignment_id, Assignment.profile_id == profile.id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    sub = db.query(Subject).filter(Subject.id == a.subject_id).first()
    sub_name = sub.name if sub else "General"
    
    # Pre-seeded mock response based on assignment title
    title_lower = a.title.lower()
    
    checklist = [
        "Read and extract core project constraints",
        "Setup workspace and environment configurations",
        "Implement data structures / schemas as specified",
        "Review and optimize code complexity",
        "Generate test assertions and document output results"
    ]
    
    tasks = [
        {"task": "Analyze constraints and plan project models", "estimated_hours": "0.5 hrs"},
        {"task": "Write implementation logic and functional components", "estimated_hours": "1.5 hrs"},
        {"task": "Run tests and verify edge cases", "estimated_hours": "1.0 hrs"}
    ]
    
    concepts = [
        f"Relational structures of {sub_name}",
        "Algorithmic correctness and edge bounds"
    ]
    
    if "normalization" in title_lower or "dbms" in title_lower or "database" in title_lower:
        checklist = [
            "Identify functional dependencies in the given tables",
            "Determine primary keys and candidate keys",
            "Apply normalization rules to satisfy 1NF, 2NF, and 3NF",
            "Draw normalized relational schemas with arrows indicating keys",
            "Write SQL assertions to prove functional dependency correctness"
        ]
        tasks = [
            {"task": "Identify dependencies & candidate keys", "estimated_hours": "1.0 hrs"},
            {"task": "Perform decomposition to 3NF", "estimated_hours": "1.0 hrs"},
            {"task": "Verify lossless-join and dependency-preserving criteria", "estimated_hours": "0.5 hrs"}
        ]
        concepts = [
            "Functional Dependency (FD)",
            "Transitive Dependency",
            "Lossless Join Decomposition",
            "3NF vs BCNF comparison"
        ]
    elif "network" in title_lower or "routing" in title_lower:
        checklist = [
            "Perform network IP range allocation calculation",
            "Configure subnets and identify network vs host boundaries",
            "Trace path using Dijkstra's algorithm step-by-step",
            "Compile packet header size vs payload analysis"
        ]
        tasks = [
            {"task": "Calculate IP subnet allocations", "estimated_hours": "1.0 hrs"},
            {"task": "Trace Dijkstra's shortest path nodes", "estimated_hours": "1.0 hrs"},
            {"task": "Compile report & topology diagrams", "estimated_hours": "0.5 hrs"}
        ]
        concepts = [
            "CIDR Block Allocation",
            "Routing Table entries",
            "Shortest Path algorithms",
            "Packet encapsulation overhead"
        ]
        
    return {
        "assignment_title": a.title,
        "subject_name": sub_name,
        "conceptual_checklist": checklist,
        "execution_steps": tasks,
        "core_concepts_to_review": concepts
    }

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, date
from app.core.database import get_db
from app.models.db_models import (
    Profile, CareerGoal, Skill, StudentSkill, SkillGap, Roadmap, RoadmapStep, Project
)
from app.api.deps import get_current_profile
from app.services.ai_service import get_ai_service

router = APIRouter()

@router.get("/roadmap")
def get_roadmap(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    roadmap = db.query(Roadmap).filter(Roadmap.profile_id == profile.id).first()
    if not roadmap:
        return {"roadmap": None, "steps": []}
        
    steps = db.query(RoadmapStep).filter(RoadmapStep.roadmap_id == roadmap.id).order_by(RoadmapStep.order_index.asc()).all()
    return {
        "roadmap": roadmap,
        "steps": steps
    }

@router.post("/roadmap/generate")
def generate_roadmap(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    goal = db.query(CareerGoal).filter(CareerGoal.profile_id == profile.id).first()
    target_role = goal.target_role if goal else "Software Engineer"
    
    # Fetch current student skills
    student_skills = db.query(StudentSkill).filter(StudentSkill.profile_id == profile.id).all()
    skill_ids = [ss.skill_id for ss in student_skills]
    skills = db.query(Skill).filter(Skill.id.in_(skill_ids)).all() if skill_ids else []
    skill_names = [s.name for s in skills]
    
    # Call AI
    ai = get_ai_service()
    ai_steps = ai.generate_roadmap(target_role, skill_names)
    
    # Save Roadmap header
    roadmap = db.query(Roadmap).filter(Roadmap.profile_id == profile.id).first()
    if not roadmap:
        roadmap = Roadmap(profile_id=profile.id, title=f"Learning Roadmap to {target_role}")
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)
        
    # Delete old steps
    db.query(RoadmapStep).filter(RoadmapStep.roadmap_id == roadmap.id).delete()
    db.commit()
    
    # Save new steps
    for idx, step in enumerate(ai_steps):
        db_step = RoadmapStep(
            roadmap_id=roadmap.id,
            phase_name=step["phase"],
            title=step["title"],
            description=step["description"],
            order_index=idx,
            status=step["status"],
            skills_to_acquire=step["skills"]
        )
        db.add(db_step)
        
    # Generate Project Recommendations based on target role
    db.query(Project).filter(
        Project.profile_id == profile.id,
        Project.status == "recommended"
    ).delete()
    db.commit()
    
    # Add two recommended projects
    p1 = Project(
        profile_id=profile.id,
        title=f"Containerized Backend API for {target_role}",
        description="Build a REST API using FastAPI. Containerize the application using Docker, setup docker-compose to orchestrate a PostgreSQL database, and write automated integration tests.",
        required_skills=["FastAPI", "Docker", "PostgreSQL", "REST APIs"],
        status="recommended"
    )
    p2 = Project(
        profile_id=profile.id,
        title=f"Interactive Dashboard UI",
        description="Design a responsive SaaS-styled analytics dashboard in React. Connect live APIs with authentication headers, implement chart visualizations with Recharts, and style with glassmorphism CSS designs.",
        required_skills=["React", "Tailwind CSS", "Recharts", "REST APIs"],
        status="recommended"
    )
    db.add(p1)
    db.add(p2)
    db.commit()
    
    return get_roadmap(profile, db)

@router.get("/projects")
def get_projects(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    return db.query(Project).filter(Project.profile_id == profile.id).all()

@router.post("/projects/{project_id}/status")
def update_project_status(
    project_id: int,
    status: str, # "recommended", "in_progress", "completed"
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    proj = db.query(Project).filter(Project.id == project_id, Project.profile_id == profile.id).first()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
        
    proj.status = status
    if status == "completed":
        profile.xp += 100 # massive project completion bonus!
        profile.level = (profile.xp // 100) + 1
        
        # add to student skills
        for skill_name in proj.required_skills:
            sk = db.query(Skill).filter(Skill.name == skill_name).first()
            if sk:
                ss = db.query(StudentSkill).filter(
                    StudentSkill.profile_id == profile.id,
                    StudentSkill.skill_id == sk.id
                ).first()
                if not ss:
                    ss = StudentSkill(
                        profile_id=profile.id,
                        skill_id=sk.id,
                        proficiency_level="advanced",
                        evidence_description=f"Developed project: {proj.title}",
                        source="project"
                    )
                    db.add(ss)
                    
    db.commit()
    db.refresh(proj)
    db.refresh(profile)
    return proj

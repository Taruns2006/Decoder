from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.db_models import (
    Profile, Skill, StudentSkill, SkillGap, CareerGoal
)
from app.api.deps import get_current_profile
from app.services.ai_service import get_ai_service

router = APIRouter()

class ResumePasteRequest(BaseModel):
    resume_text: str
    target_role: str

@router.get("/skills")
def get_student_skills(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    skills = db.query(StudentSkill).filter(StudentSkill.profile_id == profile.id).all()
    out = []
    for s in skills:
        sk = db.query(Skill).filter(Skill.id == s.skill_id).first()
        if sk:
            out.append({
                "id": s.id,
                "skill_name": sk.name,
                "category": sk.category,
                "proficiency_level": s.proficiency_level,
                "evidence_description": s.evidence_description,
                "source": s.source
            })
    return out

@router.post("/analyze")
def analyze_resume(
    req: ResumePasteRequest,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # Save target career goal
    goal = db.query(CareerGoal).filter(CareerGoal.profile_id == profile.id).first()
    if not goal:
        goal = CareerGoal(profile_id=profile.id, target_career=req.target_role, target_role=req.target_role)
        db.add(goal)
    else:
        goal.target_career = req.target_role
        goal.target_role = req.target_role
    db.commit()
    
    # Update profile interests
    profile.career_interests = [req.target_role]
    db.commit()
    
    # Call AI
    ai = get_ai_service()
    analysis = ai.analyze_resume(req.resume_text, req.target_role)
    
    # Save skills identified as present or missing
    # Let's seed some skills in database
    for skill_name in ["Python", "SQL", "FastAPI", "Docker", "React", "System Design"]:
        sk = db.query(Skill).filter(Skill.name == skill_name).first()
        if not sk:
            sk = Skill(name=skill_name, category="Software Development")
            db.add(sk)
            db.commit()
            db.refresh(sk)
            
    # For demo, match parsed strengths & missing
    # Present skills (strengths)
    for strength in ["Python", "SQL"]:
        sk = db.query(Skill).filter(Skill.name == strength).first()
        if sk:
            ss = db.query(StudentSkill).filter(
                StudentSkill.profile_id == profile.id,
                StudentSkill.skill_id == sk.id
            ).first()
            if not ss:
                ss = StudentSkill(
                    profile_id=profile.id,
                    skill_id=sk.id,
                    proficiency_level="intermediate",
                    evidence_description="Demonstrated in projects during resume review",
                    source="resume"
                )
                db.add(ss)
                
    # Missing skills (gaps)
    db.query(SkillGap).filter(SkillGap.profile_id == profile.id).delete()
    db.commit()
    
    for missing in analysis["missing_skills"]:
        # Find or create skill
        sk = db.query(Skill).filter(Skill.name == missing).first()
        if not sk:
            sk = Skill(name=missing, category="Technology Gaps")
            db.add(sk)
            db.commit()
            db.refresh(sk)
            
        gap = SkillGap(
            profile_id=profile.id,
            skill_id=sk.id,
            status="missing",
            priority=2,
            recommendations=[f"Learn {missing} fundamentals and build a small project."]
        )
        db.add(gap)
        
    db.commit()
    
    profile.xp += 40
    profile.level = (profile.xp // 100) + 1
    db.commit()
    
    return analysis

@router.post("/upload")
def upload_resume_file(
    file: UploadFile = File(...),
    target_role: str = Form(...),
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # Save file locally
    os.makedirs("./uploads", exist_ok=True)
    file_path = f"./uploads/{profile.id}_resume_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Read/mock content
    mock_resume_text = f"Resume of student. Skills: Python, SQL, Git, HTML/CSS. Education: BS Computer Science. Target role: {target_role}"
    
    req = ResumePasteRequest(resume_text=mock_resume_text, target_role=target_role)
    return analyze_resume(req, profile, db)

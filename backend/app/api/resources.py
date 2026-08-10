from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models.db_models import (
    Profile, Resource
)
from app.api.deps import get_current_profile

router = APIRouter()

@router.get("")
def get_resources(
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    # Retrieve general resources + user saved resources
    global_resources = db.query(Resource).filter(Resource.profile_id == None).all()
    user_resources = db.query(Resource).filter(Resource.profile_id == profile.id).all()
    
    # If no resources exist, seed some general ones
    if not global_resources and not user_resources:
        seeds = [
            Resource(
                category="course",
                title="Harvard CS50: Introduction to Computer Science",
                url="https://cs50.harvard.edu/",
                description="The gold standard introduction to computer science. Covers algorithms, data structures, security, and web programming."
            ),
            Resource(
                category="doc",
                title="FastAPI Official Documentation",
                url="https://fastapi.tiangolo.com/",
                description="Interactive, fast, and thorough guide on setting up REST APIs with Python."
            ),
            Resource(
                category="youtube",
                title="Kunal Kushwaha: Computer Networks Course",
                url="https://www.youtube.com/playlist?list=PL9gnSGHSqcnl3aJ_2P6tTM72yP8T4nC_P",
                description="Comprehensive, visual, and conceptual playlist covering layers, subnetting, TCP/IP, and routing."
            ),
            Resource(
                category="practice",
                title="LeetCode: 150 Interview Questions",
                url="https://leetcode.com/studyplan/top-interview-150/",
                description="A curated list of the most frequent coding problems for arrays, trees, heaps, and dynamic programming."
            )
        ]
        for s in seeds:
            db.add(s)
        db.commit()
        global_resources = db.query(Resource).filter(Resource.profile_id == None).all()
        
    return global_resources + user_resources

@router.post("/{resource_id}/save")
def toggle_save_resource(
    resource_id: int,
    profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
        
    # If resource is global, create a copy for the user with saved=True
    if res.profile_id is None:
        user_res = db.query(Resource).filter(
            Resource.profile_id == profile.id,
            Resource.title == res.title
        ).first()
        
        if user_res:
            user_res.saved = not user_res.saved
            db.commit()
            db.refresh(user_res)
            return user_res
        else:
            user_res = Resource(
                profile_id=profile.id,
                category=res.category,
                title=res.title,
                url=res.url,
                description=res.description,
                saved=True
            )
            db.add(user_res)
            db.commit()
            db.refresh(user_res)
            return user_res
            
    res.saved = not res.saved
    db.commit()
    db.refresh(res)
    return res

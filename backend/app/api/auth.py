from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.models.db_models import User, Profile
from app.schemas import api_schemas
from app.api.deps import get_current_user, get_current_profile

router = APIRouter()

@router.post("/register", response_model=api_schemas.Token)
def register(
    user_in: api_schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists."
        )
    
    # Create user
    hashed_password = get_password_hash(user_in.password)
    db_user = User(email=user_in.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create profile
    db_profile = Profile(user_id=db_user.id, name=user_in.email.split("@")[0])
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    
    # Access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=db_user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": db_user.id
    }

@router.post("/login", response_model=api_schemas.Token)
def login(
    user_in: api_schemas.UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=400, detail="Inactive user"
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id
    }

@router.get("/me", response_model=api_schemas.ProfileOut)
def read_user_me(
    current_profile: Profile = Depends(get_current_profile)
):
    return current_profile

@router.post("/onboard", response_model=api_schemas.ProfileOut)
def onboard_user(
    profile_in: api_schemas.ProfileCreate,
    current_profile: Profile = Depends(get_current_profile),
    db: Session = Depends(get_db)
):
    for field, value in profile_in.model_dump(exclude_unset=True).items():
        setattr(current_profile, field, value)
        
    # Give some starting XP on onboarding!
    current_profile.xp = 100
    current_profile.level = 1
    current_profile.readiness_score = 50
    current_profile.streak = 1
    
    db.commit()
    db.refresh(current_profile)
    return current_profile

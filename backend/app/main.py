import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api import (
    auth, students, syllabus, tutor, quizzes, 
    planner, assignments, documents, progress, 
    resume, career, resources
)

# Set up logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("atlantis")

# Initialize database tables if not existing (ideal for local/demo mode)
try:
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error initializing database tables: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ATLANTIS AI-Powered Student Intelligence & Learning Platform Backend",
    version="1.0.0"
)

# CORS Configuration
# React app runs on port 5173 by default
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler for global error catching
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An internal server error occurred. Please contact Atlantis support.",
            "error_type": type(exc).__name__
        }
    )

# Include API Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(students.router, prefix=f"{settings.API_V1_STR}/students", tags=["students"])
app.include_router(syllabus.router, prefix=f"{settings.API_V1_STR}/syllabus", tags=["syllabus"])
app.include_router(tutor.router, prefix=f"{settings.API_V1_STR}/tutor", tags=["tutor"])
app.include_router(quizzes.router, prefix=f"{settings.API_V1_STR}/quizzes", tags=["quizzes"])
app.include_router(planner.router, prefix=f"{settings.API_V1_STR}/planner", tags=["planner"])
app.include_router(assignments.router, prefix=f"{settings.API_V1_STR}/assignments", tags=["assignments"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(progress.router, prefix=f"{settings.API_V1_STR}/progress", tags=["progress"])
app.include_router(resume.router, prefix=f"{settings.API_V1_STR}/resume", tags=["resume"])
app.include_router(career.router, prefix=f"{settings.API_V1_STR}/career", tags=["career"])
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/resources", tags=["resources"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "platform": "ATLANTIS Student Intelligence & Learning Platform",
        "api_docs": "/docs",
        "mode": "demo" if settings.DEMO_MODE else "production"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

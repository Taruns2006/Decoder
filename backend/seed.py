import os
import sys
from datetime import datetime, date, timedelta

# Adjust Python path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.db_models import (
    User, Profile, Subject, Syllabus, SyllabusUnit, Topic, StudentTopic,
    Assignment, Deadline, StudySession, Quiz, QuizQuestion, QuizAttempt, QuizAnswer,
    Skill, StudentSkill, CareerGoal, Roadmap, RoadmapStep, Project, Resource, SkillGap, Notification
)

def seed_db():
    print("Re-creating all database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("Seeding users and profiles...")
        # 1. Create User
        user = User(
            email="student@atlantis.edu",
            hashed_password=get_password_hash("atlantis123"),
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # 2. Create Profile
        profile = Profile(
            user_id=user.id,
            name="Tarun",
            student_type="college",
            institution="Atlantis Institute of Technology",
            course_class="Computer Science & Engineering",
            year="Year 3",
            goals="Master cloud system design, build scalable machine learning architectures, and land a Machine Learning Engineer role.",
            career_interests=["Machine Learning Engineer", "Backend Developer", "MLOps Engineer"],
            weekly_hours=15.0,
            preferred_study_time="evening",
            current_skill_level="Intermediate",
            readiness_score=72,
            streak=5,
            xp=480,
            level=4
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
        print("Seeding subjects and syllabus structures...")
        # 3. Create Subjects
        sub1 = Subject(profile_id=profile.id, name="Intro to Database Systems", description="Relational modeling, SQL syntax, normal forms, transaction control, concurrency.", priority=1)
        sub2 = Subject(profile_id=profile.id, name="Computer Networks", description="IP routing protocols, OSI/TCP-IP models, socket configurations, flow controls.", priority=2)
        sub3 = Subject(profile_id=profile.id, name="Data Structures & Algorithms", description="Complexity bounds, lists, trees, graphs, sorting, dynamic programming.", priority=3)
        db.add(sub1)
        db.add(sub2)
        db.add(sub3)
        db.commit()
        db.refresh(sub1)
        db.refresh(sub2)
        db.refresh(sub3)
        
        # 4. Syllabi & Units
        syl1 = Syllabus(subject_id=sub1.id, name="DBMS Course Syllabus")
        syl2 = Syllabus(subject_id=sub2.id, name="CN Course Syllabus")
        syl3 = Syllabus(subject_id=sub3.id, name="DSA Course Syllabus")
        db.add(syl1)
        db.add(syl2)
        db.add(syl3)
        db.commit()
        db.refresh(syl1)
        db.refresh(syl2)
        db.refresh(syl3)
        
        # Units for DBMS
        u1 = SyllabusUnit(syllabus_id=syl1.id, name="Unit 1: Relational Foundations", sequence_order=1)
        u2 = SyllabusUnit(syllabus_id=syl1.id, name="Unit 2: Database Design & Normalization", sequence_order=2)
        u3 = SyllabusUnit(syllabus_id=syl1.id, name="Unit 3: Transactions & Concurrency", sequence_order=3)
        db.add_all([u1, u2, u3])
        
        # Units for CN
        u4 = SyllabusUnit(syllabus_id=syl2.id, name="Unit 1: Data Link & Media Access", sequence_order=1)
        u5 = SyllabusUnit(syllabus_id=syl2.id, name="Unit 2: Routing & Network Layer", sequence_order=2)
        u6 = SyllabusUnit(syllabus_id=syl2.id, name="Unit 3: Connection & Transport Layer", sequence_order=3)
        db.add_all([u4, u5, u6])
        
        # Units for DSA
        u7 = SyllabusUnit(syllabus_id=syl3.id, name="Unit 1: Trees & Balanced Trees", sequence_order=1)
        u8 = SyllabusUnit(syllabus_id=syl3.id, name="Unit 2: Graph Theory & Searches", sequence_order=2)
        u9 = SyllabusUnit(syllabus_id=syl3.id, name="Unit 3: Dynamic Programming", sequence_order=3)
        db.add_all([u7, u8, u9])
        db.commit()
        db.refresh(u1)
        db.refresh(u2)
        db.refresh(u3)
        db.refresh(u4)
        db.refresh(u5)
        db.refresh(u6)
        db.refresh(u7)
        db.refresh(u8)
        db.refresh(u9)
        
        # Topics & Subtopics
        # DBMS Topics
        t1 = Topic(unit_id=u1.id, name="Introduction to Relational Databases", importance_level="Medium", sequence_order=1)
        t2 = Topic(unit_id=u1.id, name="SQL Queries & Aggregate Functions", importance_level="High", sequence_order=2)
        t3 = Topic(unit_id=u2.id, name="Functional Dependencies & Keys", importance_level="High", sequence_order=1)
        t4 = Topic(unit_id=u2.id, name="Normalization Forms (1NF, 2NF, 3NF, BCNF)", importance_level="High", sequence_order=2)
        t5 = Topic(unit_id=u3.id, name="ACID Transactions & Schedules", importance_level="Medium", sequence_order=1)
        db.add_all([t1, t2, t3, t4, t5])
        
        # CN Topics
        t6 = Topic(unit_id=u4.id, name="OSI Layering Abstraction", importance_level="Low", sequence_order=1)
        t7 = Topic(unit_id=u5.id, name="IP Addressing & IP Subnetting", importance_level="High", sequence_order=1)
        t8 = Topic(unit_id=u5.id, name="Dijkstra Routing & Distance Vector", importance_level="High", sequence_order=2)
        t9 = Topic(unit_id=u6.id, name="TCP Handshake Connection State", importance_level="Medium", sequence_order=1)
        t10 = Topic(unit_id=u6.id, name="TCP Congestion Control Algorithms", importance_level="High", sequence_order=2)
        db.add_all([t6, t7, t8, t9, t10])
        
        # DSA Topics
        t11 = Topic(unit_id=u7.id, name="Binary Search Tree properties", importance_level="Medium", sequence_order=1)
        t12 = Topic(unit_id=u8.id, name="BFS & DFS Graph Traversals", importance_level="High", sequence_order=1)
        t13 = Topic(unit_id=u9.id, name="Recursion & Memoization", importance_level="High", sequence_order=1)
        t14 = Topic(unit_id=u9.id, name="Dynamic Programming Tabulation", importance_level="High", sequence_order=2)
        db.add_all([t11, t12, t13, t14])
        
        db.commit()
        for t in [t1, t2, t3, t4, t5, t6, t7, t8, t9, t10, t11, t12, t13, t14]:
            db.refresh(t)
            
        # 5. Seed student topic completion/weak status
        st1 = StudentTopic(profile_id=profile.id, topic_id=t1.id, status="completed", priority=3, last_reviewed=datetime.utcnow() - timedelta(days=5))
        st2 = StudentTopic(profile_id=profile.id, topic_id=t2.id, status="completed", priority=3, last_reviewed=datetime.utcnow() - timedelta(days=3))
        st3 = StudentTopic(profile_id=profile.id, topic_id=t3.id, status="completed", priority=3, last_reviewed=datetime.utcnow() - timedelta(days=2))
        st4 = StudentTopic(profile_id=profile.id, topic_id=t4.id, status="weak", priority=1, last_reviewed=datetime.utcnow() - timedelta(days=4)) # DBMS Normalization is weak
        st5 = StudentTopic(profile_id=profile.id, topic_id=t5.id, status="not_started", priority=3)
        
        st6 = StudentTopic(profile_id=profile.id, topic_id=t6.id, status="completed", priority=3, last_reviewed=datetime.utcnow() - timedelta(days=8))
        st7 = StudentTopic(profile_id=profile.id, topic_id=t7.id, status="completed", priority=2, last_reviewed=datetime.utcnow() - timedelta(days=1))
        st8 = StudentTopic(profile_id=profile.id, topic_id=t8.id, status="difficult", priority=2)
        st9 = StudentTopic(profile_id=profile.id, topic_id=t9.id, status="completed", priority=3, last_reviewed=datetime.utcnow() - timedelta(days=1))
        st10 = StudentTopic(profile_id=profile.id, topic_id=t10.id, status="weak", priority=1) # TCP Congestion is weak
        
        st11 = StudentTopic(profile_id=profile.id, topic_id=t11.id, status="completed", priority=3, last_reviewed=datetime.utcnow() - timedelta(days=6))
        st12 = StudentTopic(profile_id=profile.id, topic_id=t12.id, status="completed", priority=3, last_reviewed=datetime.utcnow() - timedelta(days=3))
        st13 = StudentTopic(profile_id=profile.id, topic_id=t13.id, status="completed", priority=3, last_reviewed=datetime.utcnow() - timedelta(days=2))
        st14 = StudentTopic(profile_id=profile.id, topic_id=t14.id, status="weak", priority=1) # DP Tabulation is weak
        db.add_all([st1, st2, st3, st4, st5, st6, st7, st8, st9, st10, st11, st12, st13, st14])
        db.commit()
        
        print("Seeding assignments and exams...")
        # 6. Assignments
        a1 = Assignment(
            profile_id=profile.id,
            subject_id=sub1.id,
            title="DBMS Normalization Project",
            description="Decompose a set of complex business tables into 3NF and BCNF. Document dependencies and prove your design is lossless and preserves all constraints.",
            due_date=datetime.utcnow() + timedelta(hours=14), # Due in 14 hours!
            priority=1,
            estimated_hours=3.0,
            status="in_progress"
        )
        a2 = Assignment(
            profile_id=profile.id,
            subject_id=sub2.id,
            title="Networks Subnetting Allocation",
            description="Design an IPv4 addressing layout allocating subnets for 6 departments with host sizes ranging from 20 to 120 hosts.",
            due_date=datetime.utcnow() + timedelta(days=3),
            priority=3,
            estimated_hours=2.0,
            status="not_started"
        )
        db.add(a1)
        db.add(a2)
        db.commit()
        
        # 7. Exams (Deadlines)
        e1 = Deadline(
            profile_id=profile.id,
            type="exam",
            title="DBMS Mid-Term Examination",
            due_date=datetime.utcnow() + timedelta(days=6),
            description="Covers Relational databases, SQL subqueries, ER modeling, and Normalization Forms (1NF-BCNF)."
        )
        db.add(e1)
        db.commit()
        
        print("Seeding historical study sessions...")
        # 8. Completed Study sessions (for graph visualizations)
        for i in range(1, 8):
            sess_date = date.today() - timedelta(days=i)
            # Create a completed session for every day
            sess = StudySession(
                profile_id=profile.id,
                subject_id=sub1.id if i % 2 == 0 else sub2.id,
                topic_id=t2.id if i % 2 == 0 else t7.id,
                date=sess_date,
                start_time="19:00",
                end_time="20:00",
                duration_minutes=60,
                status="completed",
                type="learning"
            )
            db.add(sess)
        db.commit()
        
        # 9. Scheduled future study sessions
        fs1 = StudySession(
            profile_id=profile.id,
            subject_id=sub1.id,
            topic_id=t4.id,
            date=date.today(),
            start_time="18:00",
            end_time="18:45",
            duration_minutes=45,
            status="scheduled",
            type="learning"
        )
        fs2 = StudySession(
            profile_id=profile.id,
            subject_id=sub2.id,
            topic_id=t10.id,
            date=date.today() + timedelta(days=1),
            start_time="19:00",
            end_time="19:45",
            duration_minutes=45,
            status="scheduled",
            type="revision"
        )
        db.add(fs1)
        db.add(fs2)
        db.commit()
        
        print("Seeding quiz history...")
        # 10. Completed Quizzes and attempts
        q1 = Quiz(
            profile_id=profile.id,
            subject_id=sub1.id,
            topic_id=t2.id,
            title="Aggregate Functions & Subqueries",
            difficulty="Medium",
            num_questions=3,
            time_limit_minutes=10,
            completed=True
        )
        db.add(q1)
        db.commit()
        db.refresh(q1)
        
        qq1 = QuizQuestion(quiz_id=q1.id, question_text="Which SQL clause is used to filter query groups created by the GROUP BY clause?", question_type="mcq", options=["WHERE", "HAVING", "ORDER BY", "SELECT"], correct_answer="HAVING", explanation="HAVING filters groups, whereas WHERE filters individual rows before grouping.")
        qq2 = QuizQuestion(quiz_id=q1.id, question_text="What is the result of COUNT(*) on a table containing 5 nulls and 5 values?", question_type="mcq", options=["5", "10", "0", "NULL"], correct_answer="10", explanation="COUNT(*) counts all rows in a table including null rows, whereas COUNT(column) ignores NULL values.")
        qq3 = QuizQuestion(quiz_id=q1.id, question_text="True or False: SQL aggregate functions can be nested in the WHERE clause.", question_type="true_false", options=["True", "False"], correct_answer="False", explanation="Aggregate functions cannot be nested inside the WHERE clause directly; instead, use subqueries or HAVING.")
        db.add_all([qq1, qq2, qq3])
        db.commit()
        db.refresh(qq1)
        db.refresh(qq2)
        db.refresh(qq3)
        
        attempt1 = QuizAttempt(
            quiz_id=q1.id,
            profile_id=profile.id,
            score=2, # 2/3
            total_questions=3,
            time_taken_seconds=180,
            attempted_at=datetime.utcnow() - timedelta(days=2),
            weak_concepts=["SQL Aggregate nesting"],
            recommended_revision=["Revise aggregate filter rules and aggregate nesting subqueries."]
        )
        db.add(attempt1)
        db.commit()
        db.refresh(attempt1)
        
        qa1 = QuizAnswer(attempt_id=attempt1.id, question_id=qq1.id, student_answer="HAVING", is_correct=True)
        qa2 = QuizAnswer(attempt_id=attempt1.id, question_id=qq2.id, student_answer="10", is_correct=True)
        qa3 = QuizAnswer(attempt_id=attempt1.id, question_id=qq3.id, student_answer="True", is_correct=False, explanation_review="Incorrect answer. Aggregate functions are processed after rows are fetched, so they cannot be evaluated inside WHERE.")
        db.add_all([qa1, qa2, qa3])
        db.commit()
        
        print("Seeding resume, skills and roadmap steps...")
        # 11. Skills & Career details
        s1 = Skill(name="Python", category="Languages", description="Core programming syntax, classes, decorators.")
        s2 = Skill(name="SQL", category="Databases", description="Query optimization, window functions, indexing.")
        s3 = Skill(name="FastAPI", category="Frameworks", description="Asynchronous endpoints, validation schemas, JWT dependency injection.")
        s4 = Skill(name="Docker", category="DevOps", description="Dockerfile creation, container routing, multi-stage building.")
        s5 = Skill(name="React", category="Frontend", description="Functional hooks, conditional layouts, router controls.")
        db.add_all([s1, s2, s3, s4, s5])
        db.commit()
        db.refresh(s1)
        db.refresh(s2)
        db.refresh(s3)
        db.refresh(s4)
        db.refresh(s5)
        
        ss1 = StudentSkill(profile_id=profile.id, skill_id=s1.id, proficiency_level="advanced", evidence_description="Used in 3 backend projects and ML models", source="resume")
        ss2 = StudentSkill(profile_id=profile.id, skill_id=s2.id, proficiency_level="intermediate", evidence_description="Written advanced SQL schemas and normalizations", source="quiz")
        db.add_all([ss1, ss2])
        
        # Skill Gaps
        sg1 = SkillGap(profile_id=profile.id, skill_id=s3.id, status="weak_evidence", priority=2, recommendations=["Build a microservice project in FastAPI and document integration."])
        sg2 = SkillGap(profile_id=profile.id, skill_id=s4.id, status="missing", priority=1, recommendations=["Learn container routing, Dockerfile optimization, and deploy a REST app."])
        db.add_all([sg1, sg2])
        
        # Career Goal
        goal = CareerGoal(profile_id=profile.id, target_career="Machine Learning Engineer", target_role="Machine Learning Engineer", target_companies=["Google", "OpenAI", "Stripe"])
        db.add(goal)
        db.commit()
        db.refresh(goal)
        
        # Roadmap
        roadmap = Roadmap(profile_id=profile.id, career_goal_id=goal.id, title="Machine Learning Engineer Career Path")
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)
        
        step1 = RoadmapStep(roadmap_id=roadmap.id, phase_name="Phase 1: Backend Systems", title="Develop APIs and database skills", description="Create standard REST APIs and learn how to configure relational schemas.", order_index=1, status="completed", skills_to_acquire=["Python", "SQL"])
        step2 = RoadmapStep(roadmap_id=roadmap.id, phase_name="Phase 2: Containers & Deployments", title="Build containerized services", description="Write Docker configurations and host services on scalable nodes.", order_index=2, status="in_progress", skills_to_acquire=["Docker", "FastAPI"])
        step3 = RoadmapStep(roadmap_id=roadmap.id, phase_name="Phase 3: Production ML Systems", title="Design pipelines and telemetry trackers", description="Configure Model inference APIs, deploy monitoring stacks, and learn MLOps pipeline management.", order_index=3, status="locked", skills_to_acquire=["PyTorch", "Kubernetes", "MLflow"])
        db.add_all([step1, step2, step3])
        db.commit()
        
        print("Database seeded successfully with premium demo student data!")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()

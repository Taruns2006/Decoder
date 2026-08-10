import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import google.generativeai as genai
from app.core.config import settings

class AIServiceInterface:
    def tutor_explain(self, topic: str, mode: str, difficulty: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        pass
    
    def generate_quiz(self, topic: str, difficulty: str, num_questions: int) -> List[Dict[str, Any]]:
        pass
    
    def generate_study_plan(self, subjects: List[str], weak_topics: List[str], exam_dates: List[Dict[str, Any]], weekly_hours: float) -> List[Dict[str, Any]]:
        pass
        
    def analyze_document(self, text_content: str) -> Dict[str, Any]:
        pass
        
    def analyze_resume(self, resume_text: str, target_role: str) -> Dict[str, Any]:
        pass
        
    def generate_roadmap(self, target_role: str, current_skills: List[str]) -> List[Dict[str, Any]]:
        pass

class MockAIService(AIServiceInterface):
    def tutor_explain(self, topic: str, mode: str, difficulty: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        # Return intelligent mock explanation based on mode and history length
        # This handles the interactive flow: Explain -> Question -> Evaluate response
        history_len = len(history)
        
        topic_lower = topic.lower()
        concept = "Recursion"
        if "normalization" in topic_lower or "dbms" in topic_lower:
            concept = "Normalization"
        elif "subnet" in topic_lower or "ip" in topic_lower or "network" in topic_lower:
            concept = "Subnetting"
        elif "tree" in topic_lower or "bst" in topic_lower or "search" in topic_lower:
            concept = "Binary Search Trees"
            
        # Standard responses for Recursion
        if concept == "Recursion":
            if history_len <= 1:
                if mode == "analogy-based" or mode == "analogy":
                    explanation = """### Understanding Recursion through Russian nesting dolls (Matryoshka)

Imagine you have a large Russian nesting doll. When you open it, there is another slightly smaller doll inside. If you open that one, there is another. You keep opening dolls until you find the **smallest doll** that cannot be opened anymore. 

Once you reach that smallest doll, you stop opening and start closing them back up one by one.

In programming, **Recursion** is when a function calls itself to solve smaller versions of the same problem. 
1. **The Base Case**: This is the smallest doll. It tells the function when to stop calling itself so it doesn't loop forever.
2. **The Recursive Step**: This is the act of opening a doll to find a smaller one. The function calls itself with a simpler input.

Let's look at a simple mathematical example: **Factorial** of 3 (written as 3!).
* $3! = 3 \\times 2 \\times 1 = 6$
* Recursively: $3! = 3 \\times 2!$
* $2! = 2 \\times 1!$
* $1! = 1$ (This is our **base case** where we stop!)

---
#### Mini Exercise for You:
What would happen to a recursive function if we forgot to write a **Base Case**? Try to think about it!"""
                else:
                    explanation = """### What is Recursion?

In computer science, **Recursion** is a programming technique where a function calls itself, directly or indirectly, to solve a problem. It breaks a complex problem down into simpler, smaller sub-problems.

Every recursive function consists of two essential parts:
1. **Base Case**: The condition under which the function stops calling itself. Without a base case, the function will call itself infinitely, leading to a **Stack Overflow** error.
2. **Recursive Case**: The part of the function where it calls itself, but with a *smaller* or *simpler* input that moves the program closer to the base case.

Here is a standard example in Python for calculating the Factorial of a number:
```python
def factorial(n):
    # 1. Base Case
    if n == 1:
        return 1
    # 2. Recursive Case
    else:
        return n * factorial(n - 1)
```

---
#### Mini Exercise:
Based on the code above, what would happen if we call `factorial(0)` or `factorial(-1)`? How could we make the base case safer?"""
                
                return {
                    "explanation": explanation,
                    "question": "What happens if we run a recursive function without a base case?",
                    "options": [
                        "The program runs perfectly but faster",
                        "The program crashes with a Stack Overflow error",
                        "The program pauses and asks the user for input",
                        "The program returns zero"
                    ],
                    "correct_option_idx": 1
                }
            else:
                # Student has responded
                last_student_msg = history[-1]["content"].lower() if history else ""
                if "stack" in last_student_msg or "overflow" in last_student_msg or "infinite" in last_student_msg or "loop" in last_student_msg:
                    feedback = """### Correct! 🎉
Exactly. Without a base case, the function will keep calling itself infinitely. Each call takes up memory on the **call stack**. Eventually, the system runs out of memory, and you get a **Stack Overflow** crash.

Now, let's look at another classic recursion problem: the **Fibonacci Sequence** ($0, 1, 1, 2, 3, 5, 8, 13...$).
Each number is the sum of the two preceding ones.
* $F(n) = F(n-1) + F(n-2)$
* Base cases: $F(0) = 0$, $F(1) = 1$

Here is the code:
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)
```

Let's test your understanding of how the execution works. If you call `fibonacci(4)`, it will call `fibonacci(3)` and `fibonacci(2)`. 
* `fibonacci(3)` calls `fibonacci(2)` and `fibonacci(1)`...
* Notice how `fibonacci(2)` is being calculated multiple times! 

This is highly inefficient. We call this **redundant computation**.

---
#### Next mini-exercise:
Can you think of a way to avoid recalculating the same values in recursion? (Hint: It starts with 'M' and is like writing down answers in a notebook)."""
                else:
                    feedback = """### Not quite, but good try!
Actually, without a base case, the function will call itself infinitely. Each function call pushes an active frame onto the **call stack** in memory. If we never stop, we will quickly run out of memory, which causes the program to crash with a **Stack Overflow** error.

Let's do a quick recap:
* **Recursive Case**: Moves us closer to the end (e.g. `n - 1`)
* **Base Case**: The stop condition (e.g. `if n == 1`)

Let's try a simple question: What is the base case in the following function that prints numbers from `N` down to 1?
```python
def print_countdown(n):
    if n < 1:
        return
    print(n)
    print_countdown(n - 1)
```
Where does the countdown stop?"""
                
                return {
                    "explanation": feedback,
                    "question": "What is the stopping condition (base case) in the print_countdown function above?",
                    "options": [
                        "print(n)",
                        "print_countdown(n - 1)",
                        "if n < 1: return",
                        "def print_countdown(n):"
                    ],
                    "correct_option_idx": 2
                }

        # Default fallback explanation
        return {
            "explanation": f"""### Exploring {topic}

Here is a structured explanation of **{topic}** adjusted to the **{difficulty}** academic level:

1. **Key Concept**: {topic} is a fundamental topic that forms the backbone of modern engineering and analytical systems.
2. **Real-world Application**: Utilized to structure large datasets, coordinate network packets, or optimize execution processes.
3. **Core Workflow**:
   * Setup/Initialization
   * Processing iterations
   * State verification and termination

For example, when dealing with {topic}, it is important to analyze both time complexity (how fast it runs) and space complexity (how much memory it consumes).

---
#### Interactive Check:
Would you like to solve a mini quiz question or see a code sample for {topic}?""",
            "question": f"Which of the following is most important when analyzing an algorithm for {topic}?",
            "options": [
                "The color of the code editor theme",
                "Time and Space complexity",
                "The length of the variables",
                "The operating system name"
            ],
            "correct_option_idx": 1
        }

    def generate_quiz(self, topic: str, difficulty: str, num_questions: int) -> List[Dict[str, Any]]:
        # Predefined quiz questions based on topic
        topic_lower = topic.lower()
        
        if "dbms" in topic_lower or "normal" in topic_lower or "database" in topic_lower:
            return [
                {
                    "question_text": "Which normal form is concerned with eliminating transitive dependencies?",
                    "question_type": "mcq",
                    "options": ["1NF", "2NF", "3NF", "BCNF"],
                    "correct_answer": "3NF",
                    "explanation": "A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key. Eliminating transitive dependency satisfies 3NF."
                },
                {
                    "question_text": "In a database, what does the 'C' in ACID stand for?",
                    "question_type": "mcq",
                    "options": ["Concurrency", "Consistency", "Caching", "Compilation"],
                    "correct_answer": "Consistency",
                    "explanation": "ACID stands for Atomicity, Consistency, Isolation, and Durability. Consistency ensures that a transaction takes the database from one valid state to another."
                },
                {
                    "question_text": "True or False: A primary key can contain NULL values.",
                    "question_type": "true_false",
                    "options": ["True", "False"],
                    "correct_answer": "False",
                    "explanation": "By definition, a primary key constraint uniquely identifies each record in a table, and its columns must contain unique, non-null values."
                },
                {
                    "question_text": "Which normal form requires attributes to be atomic (single-valued)?",
                    "question_type": "mcq",
                    "options": ["1NF", "2NF", "3NF", "BCNF"],
                    "correct_answer": "1NF",
                    "explanation": "First Normal Form (1NF) requires that the domain of each attribute contains only atomic (indivisible) values, and that the value of each attribute in a tuple is a single value."
                },
                {
                    "question_text": "What type of dependency occurs when a non-key attribute determines another non-key attribute?",
                    "question_type": "mcq",
                    "options": ["Partial Dependency", "Transitive Dependency", "Trivial Dependency", "Multivalued Dependency"],
                    "correct_answer": "Transitive Dependency",
                    "explanation": "A transitive dependency in a database is an indirect relationship between values in the same table that causes a functional dependency (A -> B and B -> C, therefore A -> C)."
                }
            ][:num_questions]
            
        elif "network" in topic_lower or "subnet" in topic_lower:
            return [
                {
                    "question_text": "What layer of the OSI model does routing take place in?",
                    "question_type": "mcq",
                    "options": ["Physical Layer", "Data Link Layer", "Network Layer", "Transport Layer"],
                    "correct_answer": "Network Layer",
                    "explanation": "The Network Layer (Layer 3) is responsible for packet forwarding, routing through intermediate routers, and logical addressing (IP)."
                },
                {
                    "question_text": "Which protocol is connectionless and does not guarantee packet delivery?",
                    "question_type": "mcq",
                    "options": ["TCP", "UDP", "HTTP", "FTP"],
                    "correct_answer": "UDP",
                    "explanation": "User Datagram Protocol (UDP) is a connectionless transport protocol that sends datagrams without establishing a handshake or verifying receipt, making it faster but less reliable than TCP."
                },
                {
                    "question_text": "True or False: IPv6 addresses are 128 bits long.",
                    "question_type": "true_false",
                    "options": ["True", "False"],
                    "correct_answer": "True",
                    "explanation": "IPv6 addresses are 128-bit identifiers, written in hexadecimal and separated by colons (e.g. 2001:db8::ff00:42:8329), compared to IPv4's 32-bit dotted-decimal addresses."
                }
            ][:num_questions]
            
        # Default quiz questions for algorithms / general CS
        return [
            {
                "question_text": "What is the worst-case time complexity of Quick Sort?",
                "question_type": "mcq",
                "options": ["O(N log N)", "O(N)", "O(N^2)", "O(log N)"],
                "correct_answer": "O(N^2)",
                "explanation": "Quick Sort has a worst-case time complexity of O(N^2) when the pivot selected is consistently the smallest or largest element (e.g., when the array is already sorted)."
            },
            {
                "question_text": "Which data structure operates on a Last-In-First-Out (LIFO) basis?",
                "question_type": "mcq",
                "options": ["Queue", "Stack", "Linked List", "Binary Tree"],
                "correct_answer": "Stack",
                "explanation": "A Stack is a LIFO data structure. Elements are added (pushed) and removed (popped) from the same end (the top)."
            },
            {
                "question_text": "True or False: A Binary Search Tree search operation always takes O(log N) time.",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "False",
                "explanation": "In a balanced BST, search takes O(log N) time. However, if the tree is skewed (like a linked list), it takes O(N) worst-case time."
            }
        ][:num_questions]

    def generate_study_plan(self, subjects: List[str], weak_topics: List[str], exam_dates: List[Dict[str, Any]], weekly_hours: float) -> List[Dict[str, Any]]:
        # Generates a calibrated study plan
        plan = []
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Simple scheduling heuristic
        daily_target = weekly_hours / 7.0
        duration = 45 if daily_target < 1 else 60
        
        # Match subjects and weak topics
        subject_pool = subjects if subjects else ["General Aptitude"]
        weak_pool = weak_topics if weak_topics else ["Foundation Revision"]
        
        for idx, day in enumerate(days):
            subject = subject_pool[idx % len(subject_pool)]
            topic = weak_pool[idx % len(weak_pool)]
            
            # Monday, Wednesday, Friday are learning sessions
            # Tuesday, Thursday are revision sessions
            # Saturday is quiz practice
            # Sunday is assignment/exam review
            if idx in (0, 2, 4):
                plan.append({
                    "day": day,
                    "start_time": "18:00",
                    "end_time": f"19:00" if duration == 60 else "18:45",
                    "duration_minutes": duration,
                    "subject": subject,
                    "topic": topic,
                    "type": "learning",
                    "priority": 1 if topic in weak_topics else 2
                })
            elif idx in (1, 3):
                plan.append({
                    "day": day,
                    "start_time": "18:30",
                    "end_time": "19:15",
                    "duration_minutes": 45,
                    "subject": subject,
                    "topic": f"Revision: {topic}",
                    "type": "revision",
                    "priority": 2
                })
            elif idx == 5:
                plan.append({
                    "day": day,
                    "start_time": "10:00",
                    "end_time": "11:00",
                    "duration_minutes": 60,
                    "subject": subject,
                    "topic": f"Mini Mock Quiz on {subject}",
                    "type": "practice",
                    "priority": 3
                })
            else:
                plan.append({
                    "day": day,
                    "start_time": "11:00",
                    "end_time": "12:00",
                    "duration_minutes": 60,
                    "subject": subject,
                    "topic": "Assignment & Deadline Catch-up",
                    "type": "assignment",
                    "priority": 1
                })
        return plan

    def analyze_document(self, text_content: str) -> Dict[str, Any]:
        # Return mock document intelligence extraction
        return {
            "summary": "This document covers core elements of software design, emphasizing scalability, functional design principles, database normalization, and network routing configurations. It outlines standard patterns for developing robust client-server architectures.",
            "key_concepts": [
                {"concept": "Database Normalization", "definition": "The process of organizing data in a database to reduce redundancy and improve data integrity (1NF, 2NF, 3NF)."},
                {"concept": "Relational Algebra", "definition": "A formal system consisting of a set of operations on relations, used as the query language foundation for relational databases."},
                {"concept": "Network Layers", "definition": "The division of communication protocols into distinct abstraction levels (e.g. OSI model) to enable modular hardware and software development."}
            ],
            "recommended_flashcards": [
                {"front": "What does 3NF stand for and resolve?", "back": "Third Normal Form. It removes transitive functional dependencies from relations."},
                {"front": "Name the 4 ACID properties in databases.", "back": "Atomicity, Consistency, Isolation, and Durability."}
            ],
            "study_guide_questions": [
                "Explain the difference between 2NF and 3NF.",
                "How does locking concurrency protocols prevent dirty reads?",
                "Outline the components of an ER diagram."
            ]
        }

    def analyze_resume(self, resume_text: str, target_role: str) -> Dict[str, Any]:
        return {
            "ats_score": 68,
            "strengths": [
                "Strong foundational programming skills in Python and SQL.",
                "Basic understanding of frontend design elements (HTML/CSS/JS).",
                "Clear educational credentials and degree timelines."
            ],
            "missing_skills": [
                "Docker and containerization technologies.",
                "FastAPI/Node.js web server deployments.",
                "Cloud infrastructure experience (AWS/GCP/Supabase PostgreSQL).",
                "MLOps pipeline automation (for ML engineering target)."
            ],
            "evidence_gaps": [
                {"skill": "React", "feedback": "React is mentioned in the skills matrix but there are no projects in your experience section showing practical React application."},
                {"skill": "Docker", "feedback": "Docker is missing entirely. Build a deployment-focused project to demonstrate containerization skills."}
            ],
            "recommendations": [
                "Add a portfolio project demonstrating a deployed FastAPI back-end running on Docker.",
                "Rewrite your project bullets using the XYZ formula (Accomplished [X], measured by [Y], by doing [Z]).",
                "Complete a mini-course on PostgreSQL relational design."
            ]
        }

    def generate_roadmap(self, target_role: str, current_skills: List[str]) -> List[Dict[str, Any]]:
        return [
            {
                "phase": "Phase 1: Database & Backend Core",
                "title": "Build strong database and API foundations",
                "description": "Learn advanced SQL queries, database indexing, and write performant REST APIs with FastAPI.",
                "skills": ["SQL", "PostgreSQL", "FastAPI", "REST APIs"],
                "status": "in_progress" if "SQL" in current_skills else "locked"
            },
            {
                "phase": "Phase 2: Containerization & Deployment",
                "title": "Deploy code professionally using Docker",
                "description": "Learn containerization, write Dockerfiles, configure Docker-compose and deploy to AWS EC2 or Supabase.",
                "skills": ["Docker", "Linux Shell", "AWS EC2", "CI/CD Foundations"],
                "status": "locked"
            },
            {
                "phase": "Phase 3: System Design & Scaling",
                "title": "Scale web systems to handle load",
                "description": "Understand caching strategies, message queues, horizontal scaling, load balancers, and database normalization vs denormalization.",
                "skills": ["Redis", "RabbitMQ / Kafka", "Nginx", "System Design Patterns"],
                "status": "locked"
            }
        ]

class GeminiAIService(AIServiceInterface):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash")
        self.mock_fallback = MockAIService()

    def tutor_explain(self, topic: str, mode: str, difficulty: str, history: List[Dict[str, str]]) -> Dict[str, Any]:
        # Implementation calling Gemini
        try:
            # Format chat history for prompt
            formatted_history = ""
            for msg in history:
                role = "Student" if msg["sender"] == "student" else "Tutor"
                formatted_history += f"{role}: {msg['message_text']}\n"
                
            prompt = f"""
            You are ATLANTIS AI, a brilliant personal academic tutor. 
            Explain '{topic}' to a student at the '{difficulty}' level using the '{mode}' explanation mode.
            
            Current conversation history:
            {formatted_history}
            
            Instructions:
            - Provide a highly engaging, structured explanation (use Markdown headings, bold texts, and clean layout).
            - Do not return a wall of text. Use bullet points and examples.
            - Provide a concrete example.
            - Ask ONE single, clear, multiple-choice question at the end to verify the student's understanding.
            - Provide 4 distinct options for this question.
            - Return the response in JSON format matching the schema below:
            
            Schema:
            {{
                "explanation": "Your detailed explanation text here in markdown format",
                "question": "The multiple choice question to ask the student",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correct_option_idx": 0 // 0-indexed correct option index
            }}
            
            Ensure the output is valid JSON.
            """
            
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            import json
            data = json.loads(response.text)
            return data
        except Exception as e:
            print(f"Gemini error: {e}, falling back to Mock AI Service.")
            return self.mock_fallback.tutor_explain(topic, mode, difficulty, history)

    def generate_quiz(self, topic: str, difficulty: str, num_questions: int) -> List[Dict[str, Any]]:
        try:
            prompt = f"""
            Generate a quiz on '{topic}' at a '{difficulty}' difficulty level.
            Provide {num_questions} questions.
            Support multiple question types (MCQ, True/False).
            
            Return the output in JSON format with a list of questions matching this schema:
            [
                {{
                    "question_text": "Question content",
                    "question_type": "mcq" or "true_false",
                    "options": ["Option A", "Option B", "Option C", "Option D"], // empty list if true_false
                    "correct_answer": "Exact correct option or True/False",
                    "explanation": "A detailed explanation of why this answer is correct"
                }}
            ]
            """
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            import json
            data = json.loads(response.text)
            return data
        except Exception as e:
            print(f"Gemini error: {e}, falling back to Mock.")
            return self.mock_fallback.generate_quiz(topic, difficulty, num_questions)

    def generate_study_plan(self, subjects: List[str], weak_topics: List[str], exam_dates: List[Dict[str, Any]], weekly_hours: float) -> List[Dict[str, Any]]:
        # For study plan, Gemini calls can be heavy, fallback to mock scheduling algorithm as it is more predictable for time tables,
        # but let's implement it for completeness.
        return self.mock_fallback.generate_study_plan(subjects, weak_topics, exam_dates, weekly_hours)
        
    def analyze_document(self, text_content: str) -> Dict[str, Any]:
        try:
            # Truncate text content if too large for prompt
            truncated_text = text_content[:4000]
            prompt = f"""
            Analyze the following study material text. Extract a summary, key concepts with definitions, 
            recommended flashcards (front/back), and standard study guide questions.
            
            Text content:
            {truncated_text}
            
            Return the response in JSON format matching the schema:
            {{
                "summary": "Compelling summary of the content",
                "key_concepts": [
                    {{"concept": "Concept name", "definition": "Simple definition"}}
                ],
                "recommended_flashcards": [
                    {{"front": "Flashcard front question/term", "back": "Flashcard back answer/definition"}}
                ],
                "study_guide_questions": [
                    "Question 1",
                    "Question 2"
                ]
            }}
            """
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            import json
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini error: {e}, falling back.")
            return self.mock_fallback.analyze_document(text_content)
            
    def analyze_resume(self, resume_text: str, target_role: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            Analyze this resume text against the target career role: '{target_role}'.
            Evaluate the ATS score (0 to 100), key strengths, missing skills, evidence gaps, and actionable recommendations.
            
            Resume text:
            {resume_text[:4000]}
            
            Return the response in JSON format matching the schema:
            {{
                "ats_score": 75,
                "strengths": ["Strength 1", "Strength 2"],
                "missing_skills": ["Skill 1", "Skill 2"],
                "evidence_gaps": [
                    {{"skill": "Skill name", "feedback": "Why it lacks evidence"}}
                ],
                "recommendations": ["Recommendation 1", "Recommendation 2"]
            }}
            """
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            import json
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini error: {e}, falling back.")
            return self.mock_fallback.analyze_resume(resume_text, target_role)

    def generate_roadmap(self, target_role: str, current_skills: List[str]) -> List[Dict[str, Any]]:
        try:
            prompt = f"""
            Generate a personalized career roadmap to become a '{target_role}'.
            The student currently knows: {', '.join(current_skills)}.
            Generate 3 phases. Indicate which skills are in each phase.
            
            Return the response in JSON format matching the schema:
            [
                {{
                    "phase": "Phase 1: Name",
                    "title": "Phase title",
                    "description": "Short description",
                    "skills": ["Skill A", "Skill B"],
                    "status": "in_progress" or "locked"
                }}
            ]
            """
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            import json
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini error: {e}, falling back.")
            return self.mock_fallback.generate_roadmap(target_role, current_skills)

def get_ai_service() -> AIServiceInterface:
    if settings.GEMINI_API_KEY:
        print("Using Gemini AI Service.")
        return GeminiAIService(api_key=settings.GEMINI_API_KEY)
    else:
        print("Using Mock AI Service (Local/Demo Mode).")
        return MockAIService()

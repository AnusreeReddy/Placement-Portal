# AI‑Enabled Placement Portal (TF‑IDF + Basic RAG Assistant)

## Overview

The AI‑Enabled Placement Portal is a web‑based system designed to help students discover relevant job opportunities based on their skills using intelligent recommendation techniques. The system integrates TF‑IDF based similarity matching and a basic Retrieval‑Augmented Generation (RAG) assistant to provide personalized job suggestions, skill gap analysis, and learning recommendations.

The platform supports three types of users:
- Student
- Recruiter
- Placement Officer

Each role has dedicated functionalities to streamline placement activities within an institution.

---

## Objectives

• Provide personalized job recommendations based on student skills  
• Enable recruiters to post and manage job opportunities  
• Allow placement officers to monitor placement activities  
• Implement skill‑gap detection for career improvement  
• Integrate an AI assistant for intelligent guidance  
• Suggest courses, certifications, and interview preparation resources  

---

## Features

### Student Module
• Secure registration and login (JWT authentication)  
• Profile creation and skill entry  
• Resume upload functionality  
• View available jobs  
• Apply for jobs  
• View application status  
• Personalized job recommendations using TF‑IDF  
• Ask‑AI assistant support  
• Hackathon and event recommendations  
• Login streak tracking  

### Recruiter Module
• Secure login  
• Post job opportunities  
• View applicants  
• Manage application status  
• Access student profiles  

### Placement Officer Module
• Monitor student profiles  
• Monitor job postings  
• View application statistics  
• Manage recruiters  
• Track placement activity across system  

---

## AI Components Used

### TF‑IDF Recommendation Engine

Matches student skills with job requirements using:

• TF‑IDF Vectorization  
• Cosine Similarity  

Outputs:

• Ranked job recommendations  
• Match percentage scores  

---

### RAG‑Based Ask‑AI Assistant

Implements:

• Sentence Transformers  
• FAISS similarity indexing  
• Skill comparison logic  

Provides:

• Relevant job suggestions  
• Missing skill identification  
• Course recommendations (YouTube API)  
• Certification suggestions  
• Interview preparation videos  

---

## Technology Stack

Backend:
Flask

Database:
SQLite

Authentication:
JWT (JSON Web Tokens)

Machine Learning:
TF‑IDF Vectorizer
Cosine Similarity

AI Retrieval:
Sentence Transformers
FAISS

Frontend:
HTML
CSS
JavaScript

Security:
bcrypt password hashing

APIs Used:
YouTube Data API (course & interview suggestions)

---

## Database Tables

Users
Jobs
Applications
Hackathons
Events

Relationships:

User → applies → Job  
Recruiter → posts → Job  
Application → links → User and Job  

---

## System Workflow

User Login
↓
Profile Creation
↓
Skill Extraction
↓
TF‑IDF Recommendation Engine
↓
Apply for Jobs
↓
Ask‑AI Assistant (RAG Support)
↓
Course + Certification Suggestions

---

## Security Features

• JWT‑based authentication  
• Password hashing using bcrypt  
• Role‑based access control  
• Protected API routes  

---

## Key Functional Modules

Authentication Module  
Profile Management Module  
Job Recommendation Module (TF‑IDF)  
RAG‑Based AI Assistant  
Skill Matching Module  
Application Tracking Module  
Placement Monitoring Module  

---

## Future Enhancements

• Resume parsing using NLP  
• Cloud deployment support  
• Advanced recommendation using deep learning  
• Notification system for recruiters and students  
• Analytics dashboard for placement insights  
• Large‑scale vector database integration  

---

## Conclusion

The Placement Portal successfully combines traditional text similarity techniques (TF‑IDF) with modern AI retrieval support (RAG) to create an intelligent placement assistance platform. The system improves job discovery efficiency, helps students identify missing skills, and enables placement officers to manage institutional placement activities effectively.

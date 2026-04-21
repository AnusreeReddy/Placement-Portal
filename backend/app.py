import requests
YOUTUBE_API_KEY = "AIzaSyASRdK4fmJxuubUN5Q1PPmKqPp4k0tC71E"
try:
    from sentence_transformers import SentenceTransformer
    import faiss
    model = SentenceTransformer('all-MiniLM-L6-v2')
except:
    model = None
    print("⚠️ RAG running in fallback mode")
from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import bcrypt
import os


# ================= APP CONFIG =================

app = Flask(__name__)

CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite3"
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["ALLOWED_EXTENSIONS"] = {"pdf", "doc", "docx"}

db = SQLAlchemy(app)
jwt = JWTManager(app)

if not os.path.exists("uploads"):
    os.makedirs("uploads")

def get_youtube_course(skill):

    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": f"{skill} full course",
        "key": YOUTUBE_API_KEY,
        "maxResults": 1,
        "type": "video"
    }

    try:
        res = requests.get(url, params=params).json()

        video = res["items"][0]
        title = video["snippet"]["title"]
        video_id = video["id"]["videoId"]

        link = f"https://www.youtube.com/watch?v={video_id}"

        # 🔥 CLICKABLE LINK
        return f'<a href="{link}" target="_blank">{title}</a>'

    except:
        return f"Search '{skill} course' on YouTube"
    
def get_youtube_course(skill):

    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": f"{skill} full course",
        "key": YOUTUBE_API_KEY,
        "maxResults": 1,
        "type": "video"
    }

    try:
        res = requests.get(url, params=params).json()

        video = res["items"][0]
        title = video["snippet"]["title"]
        video_id = video["id"]["videoId"]

        link = f"https://www.youtube.com/watch?v={video_id}"

        # 🔥 CLICKABLE LINK
        return f'<a href="{link}" target="_blank">{title}</a>'

    except:
        return f"Search '{skill} course' on YouTube"
    

def get_certification(skill):

    skill = skill.lower()

    # 🔥 smart mapping (not too manual, still flexible)
    if "python" in skill:
        return '<a href="https://www.coursera.org/specializations/python" target="_blank">Python Certification (Coursera)</a>'

    elif "ml" in skill or "machine learning" in skill:
        return '<a href="https://www.coursera.org/learn/machine-learning" target="_blank">Machine Learning Certification (Andrew Ng)</a>'

    elif "cloud" in skill or "aws" in skill:
        return '<a href="https://aws.amazon.com/certification/" target="_blank">AWS Certification</a>'

    elif "data" in skill:
        return '<a href="https://www.coursera.org/professional-certificates/google-data-analytics" target="_blank">Google Data Analytics Certification</a>'

    elif "web" in skill or "react" in skill:
        return '<a href="https://www.freecodecamp.org/learn/" target="_blank">Web Development Certification (freeCodeCamp)</a>'

    else:
        # 🔥 fallback (dynamic)
        return f'<a href="https://www.google.com/search?q={skill}+certification" target="_blank">Search {skill} certification</a>'
    

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]


def get_company_video(company):

    url = "https://www.googleapis.com/youtube/v3/search"

    params = {
        "part": "snippet",
        "q": f"{company} interview questions",
        "key": YOUTUBE_API_KEY,
        "maxResults": 1,
        "type": "video",
        "order": "date"   # 🔥 latest videos
    }

    try:
        res = requests.get(url, params=params).json()

        video = res["items"][0]
        video_id = video["id"]["videoId"]

        link = f"https://www.youtube.com/watch?v={video_id}"

        return f'<a href="{link}" target="_blank">🎥 {company} Interview Prep</a>'

    except:
        return f"Search {company} interview on YouTube"
    

# ================= DATABASE MODELS =================

class User(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(100))
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(200))
    role = db.Column(db.String(20))

    branch = db.Column(db.String(100))
    roll_no = db.Column(db.String(50))
    cgpa = db.Column(db.Float)
    year = db.Column(db.Integer)
    skills = db.Column(db.String(300))

    resume = db.Column(db.String(300))

    extra_fields = db.Column(db.JSON)

    last_login_date = db.Column(db.DateTime)
    streak = db.Column(db.Integer, default=0)

    verified = db.Column(db.Boolean, default=False)


class Job(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    company = db.Column(db.String(100))
    role = db.Column(db.String(100))
    stipend = db.Column(db.String(50))
    duration = db.Column(db.String(50))

    skills = db.Column(db.String(200))
    url = db.Column(db.String(300))
    deadline = db.Column(db.String(50))

    cgpa = db.Column(db.String(50))
    year = db.Column(db.String(20))
    branches = db.Column(db.String(200))
    job_type = db.Column(db.String(50))

    extra_fields = db.Column(db.JSON)

    posted_by = db.Column(db.Integer)


class Application(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(db.Integer)
    job_id = db.Column(db.Integer)

    status = db.Column(db.String(20), default="pending")

    applied_date = db.Column(db.DateTime,
                             default=datetime.utcnow)

    extra_data = db.Column(db.JSON)


class Hackathon(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200))
    description = db.Column(db.Text)

    organizer = db.Column(db.String(100))
    skills = db.Column(db.String(200))

    url = db.Column(db.String(300))
    deadline = db.Column(db.String(50))

    posted_by = db.Column(db.Integer)


class Event(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200))
    description = db.Column(db.Text)

    organizer = db.Column(db.String(100))
    skills = db.Column(db.String(200))

    url = db.Column(db.String(300))
    deadline = db.Column(db.String(50))

    posted_by = db.Column(db.Integer)


def build_index():

    jobs = Job.query.all()

    if not jobs or model is None:
        return None, jobs

    texts = [f"{job.role} {job.skills}" for job in jobs]

    embeddings = model.encode(texts)

    index = faiss.IndexFlatL2(len(embeddings[0]))
    index.add(embeddings)

    return index, jobs

# ================= HOME =================

@app.route("/")
def home():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "index.html"))


@app.route("/login")
def login_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Login", "login.html"))


@app.route("/register")
def register_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Login", "register.html"))


@app.route("/student/dashboard")
def student_dashboard_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Student", "student_dashboard.html"))


@app.route("/student/build-profile")
def student_build_profile_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Student", "build_profile.html"))


@app.route("/student/alumni")
def student_alumni_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Student", "alumni_network.html"))


@app.route("/student/applications")
def student_applications_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Student", "your_applications.html"))


@app.route("/placement/dashboard")
def placement_dashboard_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Placement", "placement_officer_dashboard.html"))


@app.route("/placement/manage-recruiters")
def placement_manage_recruiters_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Placement", "manage_recruiters.html"))


@app.route("/recruiter/dashboard")
def recruiter_dashboard_page():
    return send_file(os.path.join(os.path.dirname(__file__), "..", "frontend", "Recruiter", "recruiter_dashboard.html"))


# ================= REGISTER =================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.json

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "User exists"}), 409

    hashed = bcrypt.hashpw(
        data["password"].encode(),
        bcrypt.gensalt()
    )

    user = User(
        name=data["name"],
        email=data["email"],
        password=hashed.decode(),
        role=data["role"]
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Registered successfully"})


# ================= LOGIN =================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.json

    user = User.query.filter_by(
        email=data["email"],
        role=data["role"]
    ).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not bcrypt.checkpw(
            data["password"].encode(),
            user.password.encode()):
        return jsonify({"error": "Wrong password"}), 401


    today = datetime.utcnow().date()

    if user.last_login_date:

        last = user.last_login_date.date()

        if last == today - timedelta(days=1):
            user.streak += 1

        elif last != today:
            user.streak = 1

    else:
        user.streak = 1

    user.last_login_date = datetime.utcnow()

    db.session.commit()

    token = create_access_token(identity=str(user.id))

    return jsonify({
        "token": token,
        "role": user.role,
        "streak": user.streak
    })


# ================= PROFILE =================

@app.route("/profile", methods=["POST"])
@jwt_required()
def save_profile():

    user = User.query.get(int(get_jwt_identity()))

    data = request.json

    user.name = data.get("name", user.name)
    user.branch = data.get("branch", user.branch)
    user.roll_no = data.get("roll_no", user.roll_no)
    user.cgpa = data.get("cgpa", user.cgpa)
    user.year = data.get("year", user.year)
    user.skills = data.get("skills", user.skills)
    user.resume = data.get("resume", user.resume)

    if "extra_fields" in data:
        user.extra_fields = data["extra_fields"]

    db.session.commit()

    return jsonify({"message": "Profile saved"})


@app.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():

    user = User.query.get(int(get_jwt_identity()))

    return jsonify({
        "name": user.name,
        "branch": user.branch,
        "roll_no": user.roll_no,
        "cgpa": user.cgpa,
        "year": user.year,
        "skills": user.skills,
        "resume": user.resume,
        "extra_fields": user.extra_fields or {}
    })


@app.route("/upload-resume", methods=["POST"])
@jwt_required()
def upload_resume():

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if "resume" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["resume"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = secure_filename(file.filename)
    if "." not in filename or filename.rsplit('.', 1)[1].lower() not in app.config["ALLOWED_EXTENSIONS"]:
        return jsonify({"error": "Invalid file type"}), 400

    try:
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(save_path)
        user.resume = filename
        db.session.commit()
        return jsonify({"message": "Resume uploaded", "filename": filename})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to save resume"}), 500


@app.route("/resume/<filename>")
@jwt_required()
def get_resume(filename):

    user = User.query.get(int(get_jwt_identity()))

    # Allow recruiters to view any resume, students only their own
    if user.role == "student" and user.resume != filename:
        return jsonify({"error": "Access denied"}), 403

    try:
        return send_file(os.path.join(app.config["UPLOAD_FOLDER"], filename))
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404


# ================= JOB POST =================

@app.route("/post-job", methods=["POST"])
@jwt_required()
def post_job():

    user = User.query.get(int(get_jwt_identity()))

    if user.role != "recruiter":
        return jsonify({"error": "Recruiters only"}), 403

    data = request.json

    job = Job(**data, posted_by=user.id)

    db.session.add(job)
    db.session.commit()

    return jsonify({"message": "Job posted"})


# ================= APPLY JOB =================

@app.route("/apply-job", methods=["POST"])
@jwt_required()
def apply_job():

    user_id = int(get_jwt_identity())

    data = request.json

    if not data or "job_id" not in data:
        return jsonify({"error": "job_id is required"}), 400

    job_id = data["job_id"]

    if Application.query.filter_by(
            student_id=user_id,
            job_id=job_id).first():
        return jsonify({"error": "Already applied"}), 409

    application = Application(
        student_id=user_id,
        job_id=job_id,
        extra_data=data.get("extra_data", {})
    )

    try:
        db.session.add(application)
        db.session.commit()
        return jsonify({"message": "Applied successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



# ================= GET APPLICATIONS =================

@app.route("/my-applications")
@jwt_required()
def my_applications():

    user_id = int(get_jwt_identity())

    apps = Application.query.filter_by(
        student_id=user_id).all()

    result = []
    for a in apps:
        job = Job.query.get(a.job_id)
        if job:
            result.append({
                "id": a.id,
                "job_id": a.job_id,
                "role": job.role,
                "company": job.company,
                "status": a.status,
                "applied_date": a.applied_date.isoformat() if a.applied_date else None,
                "extra_data": a.extra_data or {}
            })

    return jsonify(result)


# ================= PLACEMENT OFFICER ENDPOINTS =================

@app.route("/placement/all-students")
@jwt_required()
def placement_all_students():

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if user.role != "placementOfficer":
        return jsonify({"error": "Access denied"}), 403

    students = User.query.filter_by(role="student").all()

    result = []
    for student in students:
        app_count = len(Application.query.filter_by(student_id=student.id).all())
        
        result.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "branch": student.branch,
            "roll_no": student.roll_no,
            "cgpa": student.cgpa,
            "year": student.year,
            "skills": student.skills,
            "resume": student.resume,
            "applications_count": app_count,
            "verified": student.verified
        })

    return jsonify(result)


@app.route("/placement/student-details/<int:student_id>")
@jwt_required()
def placement_student_details(student_id):

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if user.role != "placementOfficer":
        return jsonify({"error": "Access denied"}), 403

    student = User.query.get(student_id)
    if not student or student.role != "student":
        return jsonify({"error": "Student not found"}), 404

    applications = Application.query.filter_by(student_id=student_id).all()
    
    app_details = []
    for app in applications:
        job = Job.query.get(app.job_id)
        if job:
            app_details.append({
                "id": app.id,
                "job_id": app.job_id,
                "company": job.company,
                "role": job.role,
                "status": app.status,
                "applied_date": app.applied_date.isoformat() if app.applied_date else None,
                "extra_data": app.extra_data or {}
            })

    return jsonify({
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "branch": student.branch,
            "roll_no": student.roll_no,
            "cgpa": student.cgpa,
            "year": student.year,
            "skills": student.skills,
            "resume": student.resume,
            "verified": student.verified
        },
        "applications": app_details
    })


@app.route("/placement/all-jobs")
@jwt_required()
def placement_all_jobs():

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if user.role != "placementOfficer":
        return jsonify({"error": "Access denied"}), 403

    jobs = Job.query.all()

    result = []
    for job in jobs:
        recruiter = User.query.get(job.posted_by) if job.posted_by else None
        app_count = len(Application.query.filter_by(job_id=job.id).all())
        
        result.append({
            "id": job.id,
            "company": job.company,
            "role": job.role,
            "stipend": job.stipend,
            "duration": job.duration,
            "skills": job.skills,
            "deadline": job.deadline,
            "cgpa": job.cgpa,
            "year": job.year,
            "branches": job.branches,
            "job_type": job.job_type,
            "url": job.url,
            "posted_by": recruiter.name if recruiter else "System",
            "applications_count": app_count,
            "extra_fields": job.extra_fields or {}
        })

    return jsonify(result)


@app.route("/placement/job-applications/<int:job_id>")
@jwt_required()
def placement_job_applications(job_id):

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if user.role != "placementOfficer":
        return jsonify({"error": "Access denied"}), 403

    job = Job.query.get(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404

    applications = Application.query.filter_by(job_id=job_id).all()
    
    app_details = []
    for app in applications:
        student = User.query.get(app.student_id)
        if student:
            app_details.append({
                "id": app.id,
                "student_id": app.student_id,
                "student_name": student.name,
                "student_email": student.email,
                "student_branch": student.branch,
                "student_cgpa": student.cgpa,
                "status": app.status,
                "applied_date": app.applied_date.isoformat() if app.applied_date else None,
                "extra_data": app.extra_data or {}
            })

    return jsonify({
        "job": {
            "id": job.id,
            "company": job.company,
            "role": job.role,
            "deadline": job.deadline
        },
        "applications": app_details
    })


@app.route("/recruiter/applications")
@jwt_required()
def recruiter_applications():

    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if user.role != "recruiter":
        return jsonify({"error": "Recruiters only"}), 403

    # Get jobs posted by this recruiter
    jobs = Job.query.filter_by(posted_by=user_id).all()
    job_ids = [j.id for j in jobs]

    # Get applications for those jobs
    apps = Application.query.filter(Application.job_id.in_(job_ids)).all()

    result = []
    for app in apps:
        student = User.query.get(app.student_id)
        job = Job.query.get(app.job_id)
        result.append({
            "application_id": app.id,
            "student": {
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "branch": student.branch,
                "skills": student.skills,
                "cgpa": student.cgpa,
                "year": student.year,
                "resume": student.resume
            },
            "job": {
                "id": job.id,
                "company": job.company,
                "role": job.role
            },
            "status": app.status,
            "extra_data": app.extra_data or {},
            "applied_date": app.applied_date.isoformat()
        })

    return jsonify(result)


# ================= STREAK =================

@app.route("/streak", methods=["GET"])
@jwt_required()
def get_streak():

    user = User.query.get(int(get_jwt_identity()))

    return jsonify({"streak": user.streak})


@app.route("/streak", methods=["POST"])
@jwt_required()
def update_streak():

    user = User.query.get(int(get_jwt_identity()))

    today = datetime.utcnow().date()

    if user.last_login_date and \
            user.last_login_date.date() == today:
        return jsonify({
            "error": "Already checked today"
        })

    user.streak += 1
    user.last_login_date = datetime.utcnow()

    db.session.commit()

    return jsonify({"streak": user.streak})


# ================= TF-IDF JOB RECOMMENDER =================

@app.route("/recommended-jobs")
@jwt_required()
def recommended_jobs():

    user = User.query.get(int(get_jwt_identity()))

    if not user.skills:
        return jsonify([])

    jobs = Job.query.all()

    docs = [user.skills] + \
           [job.skills or "" for job in jobs]

    tfidf = TfidfVectorizer().fit_transform(docs)

    scores = cosine_similarity(
        tfidf[0:1],
        tfidf[1:]
    )[0]

    results = []

    for i, score in enumerate(scores):

        if score > 0.15:

            job = jobs[i]

            results.append({
                "company": job.company,
                "role": job.role,
                "match_score": round(score * 100, 2)
            })

    return jsonify(results)

@app.route("/jobs", methods=["GET"])
@jwt_required()
def get_jobs():

    jobs = Job.query.all()

    return jsonify([
        {
            "id": j.id,
            "company": j.company,
            "role": j.role,
            "skills": j.skills,
            "deadline": j.deadline,
            "cgpa": j.cgpa,
            "year": j.year,
            "branches": j.branches,
            "job_type": j.job_type,
            "url": j.url,
            "extra_fields": j.extra_fields or {}
        }
        for j in jobs
    ])

@app.route("/hackathons", methods=["GET"])
@jwt_required()
def get_hackathons():

    hackathons = Hackathon.query.all()

    return jsonify([
        {
            "id": h.id,
            "title": h.title,
            "organizer": h.organizer,
            "skills": h.skills,
            "deadline": h.deadline,
            "url": h.url
        }
        for h in hackathons
    ])

@app.route("/events", methods=["GET"])
@jwt_required()
def get_events():

    events = Event.query.all()

    return jsonify([
        {
            "id": e.id,
            "title": e.title,
            "organizer": e.organizer,
            "skills": e.skills,
            "deadline": e.deadline,
            "url": e.url
        }
        for e in events
    ])


@app.route("/ask-ai", methods=["POST"])
@jwt_required()
def ask_ai():

    data = request.json
    query = data.get("query", "").lower().strip()

    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    user_skills = (user.skills or "").lower().replace(",", " ").split()

    jobs = Job.query.all()
    if not jobs:
        return jsonify({"answer": "No jobs available"})

    ignore_words = ["jobs", "job", "roles", "role", "positions"]
    query_words = [word for word in query.split() if word not in ignore_words]

    results = []

    for job in jobs:
        skills = (job.skills or "").lower()
        role = (job.role or "").lower()
        text = f"{role} {skills}"

        score = 0

        for word in query_words:
            if word in text:
                score += 1

        # 🔥 AI BOOST
        if "ai" in query:
            if any(x in skills for x in ["ml", "machine learning", "ai"]):
                score += 3

        # 🔥 WEB BOOST
        if "web" in query:
            if any(x in skills for x in [
                "react", "html", "css", "javascript",
                "node", "nodejs", "express",
                "backend", "api"
            ]):
                score += 3

        if "python" in query and "python" in skills:
            score += 3

        if "java" in query and "java" in skills:
            score += 3

        if score > 0:
            results.append((job, score))

    results = sorted(results, key=lambda x: x[1], reverse=True)
    results = [job for job, _ in results]

    if not results:
        return jsonify({"answer": "No relevant jobs found"})

    response = "Based on your query:<br><br>"

    for job in results[:3]:

        job_skills = (job.skills or "").lower().replace(",", " ").split()

        matched = set(user_skills).intersection(job_skills)
        missing = set(job_skills) - set(user_skills)

        match_score = len(matched) / len(job_skills) if job_skills else 0

        response += f"<b>{job.role} at {job.company}</b><br>"

        # 🔥 COMPANY VIDEO
        response += get_company_video(job.company) + "<br>"

        response += f"Match: {round(match_score * 100, 2)}%<br>"

        if matched:
            response += f"✔ You have: {', '.join(matched)}<br>"

        if missing:
            response += f"❌ Missing: {', '.join(missing)}<br>"

            course_suggestions = []
            cert_suggestions = []

            for skill in list(missing)[:2]:
                course_suggestions.append(get_youtube_course(skill))
                cert_suggestions.append(get_certification(skill))

            response += f"📚 Courses: {', '.join(course_suggestions)}<br>"
            response += f"🎓 Certifications: {', '.join(cert_suggestions)}<br>"

        response += "<br>"

    return jsonify({"answer": response})


@app.route("/<path:path>")
def serve_static(path):
    file_map = {
        "style.css": os.path.join(os.path.dirname(__file__), "..", "style.css"),
        "login.js": os.path.join(os.path.dirname(__file__), "..", "frontend", "Login", "login.js"),
        "register.js": os.path.join(os.path.dirname(__file__), "..", "frontend", "Login", "register.js"),
        "student.js": os.path.join(os.path.dirname(__file__), "..", "frontend", "Student", "student.js"),
        "recruiter.js": os.path.join(os.path.dirname(__file__), "..", "frontend", "Recruiter", "recruiter.js"),
        "placement.js": os.path.join(os.path.dirname(__file__), "..", "frontend", "Placement", "placement.js"),
        "placement_officer.js": os.path.join(os.path.dirname(__file__), "..", "frontend", "Placement", "placement_officer.js"),
        "manage_recruiters.js": os.path.join(os.path.dirname(__file__), "..", "frontend", "Placement", "manage_recruiters.js")
    }

    if path in file_map:
        return send_file(file_map[path])

    return jsonify({"error": "Not found"}), 404


# ================= START SERVER =================

with app.app_context():
    db.create_all()

    # Add user profile columns if missing
    for column_definition in [
        "roll_no VARCHAR(50)",
        "cgpa FLOAT",
        "year INTEGER"
    ]:
        try:
            db.session.execute(
                f"ALTER TABLE user ADD COLUMN {column_definition}"
            )
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Add any new job columns to an existing SQLite schema if they are missing.
    for column_definition in [
        "cgpa VARCHAR(50)",
        "year VARCHAR(20)",
        "branches VARCHAR(200)",
        "job_type VARCHAR(50)"
    ]:
        try:
            db.session.execute(
                f"ALTER TABLE job ADD COLUMN {column_definition}"
            )
            db.session.commit()
        except Exception:
            db.session.rollback()

    # Add extra_data to application table
    try:
        db.session.execute(
            "ALTER TABLE application ADD COLUMN extra_data JSON"
        )
        db.session.commit()
    except Exception:
        db.session.rollback()

if __name__ == "__main__":
    app.run(debug=True)
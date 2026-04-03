import requests
YOUTUBE_API_KEY = "AIzaSyDqGt3wFJz7YfqstMko4HyB9Kv5Zh_t-EM"
try:
    from sentence_transformers import SentenceTransformer
    import faiss
    model = SentenceTransformer('all-MiniLM-L6-v2')
except:
    model = None
    print("⚠️ RAG running in fallback mode")
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
import bcrypt
from datetime import datetime, timedelta
import os
from werkzeug.utils import secure_filename

# ================= APP SETUP =================

app = Flask(__name__,
            static_folder='..',
            static_url_path='/static')
CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///db.sqlite3"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["UPLOAD_FOLDER"] = "uploads"
app.config["ALLOWED_EXTENSIONS"] = {"pdf", "doc", "docx"}

if not os.path.exists(app.config["UPLOAD_FOLDER"]):
    os.makedirs(app.config["UPLOAD_FOLDER"])

db = SQLAlchemy(app)
jwt = JWTManager(app)

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

    name = db.Column(db.String(100), nullable=False)

    email = db.Column(db.String(100), unique=True, nullable=False)

    password = db.Column(db.String(200), nullable=False)

    role = db.Column(db.String(20), nullable=False)

    branch = db.Column(db.String(100))

    skills = db.Column(db.String(300))

    resume = db.Column(db.String(300))

    last_login_date = db.Column(db.DateTime)

    streak = db.Column(db.Integer, default=0)

    verified = db.Column(db.Boolean, default=False)

    streak = db.Column(db.Integer, default=0)



class Job(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    company = db.Column(db.String(100))

    role = db.Column(db.String(100))

    stipend = db.Column(db.String(50))

    duration = db.Column(db.String(50))

    skills = db.Column(db.String(200))

    url = db.Column(db.String(300))

    deadline = db.Column(db.String(50))

    posted_by = db.Column(db.Integer, db.ForeignKey('user.id'))


class Application(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    job_id = db.Column(db.Integer, db.ForeignKey('job.id'), nullable=False)

    status = db.Column(db.String(20), default='pending')  # pending, accepted, rejected

    applied_date = db.Column(db.DateTime, default=datetime.utcnow)


class Hackathon(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200))

    description = db.Column(db.Text)

    organizer = db.Column(db.String(100))

    skills = db.Column(db.String(200))

    url = db.Column(db.String(300))

    deadline = db.Column(db.String(50))

    posted_by = db.Column(db.Integer, db.ForeignKey('user.id'))


class Event(db.Model):

    id = db.Column(db.Integer, primary_key=True)

    title = db.Column(db.String(200))

    description = db.Column(db.Text)

    organizer = db.Column(db.String(100))

    skills = db.Column(db.String(200))

    url = db.Column(db.String(300))

    deadline = db.Column(db.String(50))

    posted_by = db.Column(db.Integer, db.ForeignKey('user.id'))

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
    return jsonify({
        "message": "Placement Portal Backend Running",
        "status": "success"
    })


# ================= SERVE HTML PAGES =================

@app.route("/login")
def login_page():
    return app.send_static_file('frontend/Login/login.html')

@app.route("/register")
def register_page():
    return app.send_static_file('frontend/Login/register.html')

@app.route("/student/dashboard")
def student_dashboard():
    return app.send_static_file('frontend/Student/student_dashboard.html')

@app.route("/recruiter/dashboard")
def recruiter_dashboard():
    return app.send_static_file('frontend/Recruiter/recruiter_dashboard.html')

@app.route("/placement/dashboard")
def placement_dashboard():
    return app.send_static_file('frontend/Placement/placement_officer_dashboard.html')

@app.route("/student/build-profile")
def build_profile():
    return app.send_static_file('frontend/Student/build_profile.html')

@app.route("/student/applications")
def your_applications():
    return app.send_static_file('frontend/Student/your_applications.html')

@app.route("/student/alumni")
def alumni_network():
    return app.send_static_file('frontend/Student/alumni_network.html')

@app.route("/student/apply/<int:job_id>")
def apply_page(job_id):
    return app.send_static_file('frontend/Student/apply.html')

@app.route("/student/manual-apply")
def manual_apply():
    return app.send_static_file('frontend/Student/manual_apply.html')


# ================= SERVE CSS/JS FILES =================

@app.route("/style.css")
def style_css():
    return app.send_static_file('style.css')

@app.route("/auth.js")
def auth_js():
    return app.send_static_file('auth.js')

@app.route("/script.js")
def script_js():
    return app.send_static_file('script.js')

@app.route("/login.js")
def login_js():
    return app.send_static_file('frontend/Login/login.js')

@app.route("/register.js")
def register_js():
    return app.send_static_file('frontend/Login/register.js')

@app.route("/student.js")
def student_js():
    return app.send_static_file('frontend/Student/student.js')

@app.route("/recruiter.js")
def recruiter_js():
    return app.send_static_file('frontend/Recruiter/recruiter.js')

@app.route("/placement.js")
def placement_js():
    return app.send_static_file('frontend/Placement/placement.js')

@app.route("/manage_recruiters.js")
def manage_recruiters_js():
    return app.send_static_file('frontend/Placement/manage_recruiters.js')

@app.route("/data.js")
def placement_data_js():
    return app.send_static_file('frontend/Placement/data.js')



# ================= REGISTER =================

@app.route("/register", methods=["POST"])
def register():

    data = request.json

    required = ["name", "email", "password", "role"]

    if not all(field in data for field in required):

        return jsonify({"error": "Missing fields"}), 400


    existing = User.query.filter_by(email=data["email"]).first()

    if existing:

        return jsonify({"error": "User exists"}), 409


    hashed_pw = bcrypt.hashpw(
        data["password"].encode(),
        bcrypt.gensalt()
    )


    user = User(

        name=data["name"],

        email=data["email"],

        password=hashed_pw.decode(),

        role=data["role"]

    )


    db.session.add(user)

    db.session.commit()


    return jsonify({"message": "Registered successfully"})


# ================= LOGIN =================

@app.route("/login", methods=["POST"])
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

        user.password.encode()

    ):

        return jsonify({"error": "Wrong password"}), 401


    # Update streak
    now = datetime.utcnow().date()
    if user.last_login_date:
        last_date = user.last_login_date.date()
        if last_date == now - timedelta(days=1):
            user.streak += 1
        elif last_date != now:
            user.streak = 1
    else:
        user.streak = 1
    user.last_login_date = datetime.utcnow()

    db.session.commit()

    token = create_access_token(identity=str(user.id))


    return jsonify({

        "message": "Login success",

        "token": token,

        "role": user.role,

        "streak": user.streak

    })


# ================= SAVE PROFILE =================

@app.route("/profile", methods=["POST"])
@jwt_required()
def save_profile():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))


    data = request.json


    user.name = data.get("name", user.name)

    user.branch = data.get("branch", user.branch)

    user.skills = data.get("skills", user.skills)

    user.resume = data.get("resume", user.resume)


    db.session.commit()


    return jsonify({"message": "Profile saved"})


# ================= GET PROFILE =================

@app.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))


    return jsonify({

        "name": user.name,

        "branch": user.branch,

        "skills": user.skills,

        "resume": user.resume

    })


# ================= POST JOB =================

@app.route("/post-job", methods=["POST"])
@jwt_required()
def post_job():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can post jobs"}), 403

    data = request.json


    job = Job(

        company=data["company"],

        role=data["role"],

        stipend=data["stipend"],

        duration=data["duration"],

        skills=data["skills"],

        url=data["url"],

        deadline=data["deadline"],

        posted_by=user_id

    )


    db.session.add(job)

    db.session.commit()


    return jsonify({"message": "Job posted successfully"})


# ================= GET JOBS =================

@app.route("/jobs", methods=["GET"])
@jwt_required()
def get_jobs():

    jobs = Job.query.all()

    # Sort by deadline (assuming YYYY-MM-DD format)
    def parse_deadline(job):
        try:
            return datetime.strptime(job.deadline, "%Y-%m-%d")
        except:
            return datetime.max  # If invalid, put at end

    jobs_sorted = sorted(jobs, key=parse_deadline)

    result = []

    now = datetime.utcnow()

    for job in jobs_sorted:

        deadline_date = parse_deadline(job)

        is_past = deadline_date < now

        result.append({

            "id": job.id,

            "company": job.company,

            "role": job.role,

            "stipend": job.stipend,

            "duration": job.duration,

            "skills": job.skills,

            "url": job.url,

            "deadline": job.deadline,

            "is_past": is_past

        })


    return jsonify(result)

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity



# ================= APPLY TO JOB =================

@app.route("/apply-job", methods=["POST"])
@jwt_required()
def apply_job():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "student":

        return jsonify({"error": "Only students can apply"}), 403

    data = request.json

    job_id = data.get("job_id")

    if not job_id:

        return jsonify({"error": "Job ID required"}), 400

    job = Job.query.get(job_id)

    if not job:

        return jsonify({"error": "Job not found"}), 404

    # Check if already applied

    existing = Application.query.filter_by(student_id=user_id, job_id=job_id).first()

    if existing:

        return jsonify({"error": "Already applied"}), 409

    application = Application(student_id=user_id, job_id=job_id)

    db.session.add(application)

    db.session.commit()

    return jsonify({"message": "Applied successfully"})


# ================= GET MY APPLICATIONS =================

@app.route("/my-applications", methods=["GET"])
@jwt_required()
def get_my_applications():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "student":

        return jsonify({"error": "Only students can view applications"}), 403

    applications = Application.query.filter_by(student_id=user_id).all()

    result = []

    for app in applications:

        job = Job.query.get(app.job_id)

        result.append({

            "job_id": app.job_id,

            "company": job.company,

            "role": job.role,

            "status": app.status,

            "applied_date": app.applied_date.isoformat()

        })

    return jsonify(result)


# ================= GET JOB APPLICATIONS (FOR RECRUITERS) =================

@app.route("/job-applications/<int:job_id>", methods=["GET"])
@jwt_required()
def get_job_applications(job_id):

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can view applications"}), 403

    job = Job.query.get(job_id)

    if not job or job.posted_by != int(user_id):

        return jsonify({"error": "Job not found or not yours"}), 404

    applications = Application.query.filter_by(job_id=job_id).all()

    result = []

    for app in applications:

        student = User.query.get(app.student_id)

        result.append({

            "student_id": app.student_id,

            "student_name": student.name,

            "student_branch": student.branch,

            "student_skills": student.skills,

            "status": app.status,

            "applied_date": app.applied_date.isoformat()

        })

    return jsonify(result)


# ================= UPDATE APPLICATION STATUS =================

@app.route("/update-application", methods=["POST"])
@jwt_required()
def update_application_status():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can update status"}), 403

    data = request.json

    application_id = data.get("application_id")

    status = data.get("status")  # accepted or rejected

    if status not in ["accepted", "rejected"]:

        return jsonify({"error": "Invalid status"}), 400

    application = Application.query.get(application_id)

    if not application:

        return jsonify({"error": "Application not found"}), 404

    job = Job.query.get(application.job_id)

    if job.posted_by != int(user_id):

        return jsonify({"error": "Not your job"}), 403

    application.status = status

    db.session.commit()

    return jsonify({"message": "Status updated"})


# ================= GET STREAK =================

@app.route("/streak", methods=["GET"])
@jwt_required()
def get_streak():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    return jsonify({"streak": user.streak})


# ================= CLEANUP JOBS =================

@app.route("/cleanup-jobs", methods=["POST"])
@jwt_required()
def cleanup_jobs():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can cleanup"}), 403

    now = datetime.utcnow()

    week_ago = now - timedelta(days=7)

    deleted_count = 0

    jobs = Job.query.all()

    for job in jobs:

        try:

            deadline_date = datetime.strptime(job.deadline, "%Y-%m-%d")

            if deadline_date < week_ago:

                # Delete applications first

                Application.query.filter_by(job_id=job.id).delete()

                db.session.delete(job)

                deleted_count += 1

        except:

            pass  # Skip invalid dates

    db.session.commit()

    return jsonify({"message": f"Deleted {deleted_count} old jobs"})


# ================= UPLOAD RESUME =================

@app.route("/upload-resume", methods=["POST"])
@jwt_required()
def upload_resume():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "student":

        return jsonify({"error": "Only students can upload resumes"}), 403

    if 'resume' not in request.files:

        return jsonify({"error": "No file part"}), 400

    file = request.files['resume']

    if file.filename == '':

        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):

        filename = secure_filename(f"{user_id}_{file.filename}")

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        file.save(filepath)

        user.resume = filepath

        db.session.commit()

        return jsonify({"message": "Resume uploaded", "path": filepath})

    return jsonify({"error": "Invalid file type"}), 400


# ================= DOWNLOAD RESUME =================

@app.route("/download-resume/<int:student_id>", methods=["GET"])
@jwt_required()
def download_resume(student_id):

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can download resumes"}), 403

    student = User.query.get(student_id)

    if not student or student.role != "student":

        return jsonify({"error": "Student not found"}), 404

    if not student.resume or not os.path.exists(student.resume):

        return jsonify({"error": "Resume not found"}), 404

    from flask import send_file

    return send_file(student.resume, as_attachment=True)


# ================= VERIFY STUDENT =================

@app.route("/verify-student/<int:student_id>", methods=["POST"])
@jwt_required()
def verify_student(student_id):

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can verify"}), 403

    student = User.query.get(student_id)

    if not student or student.role != "student":

        return jsonify({"error": "Student not found"}), 404

    student.verified = not student.verified  # Toggle

    db.session.commit()

    return jsonify({"message": f"Student {'verified' if student.verified else 'unverified'}"})


# ================= POST HACKATHON =================

@app.route("/post-hackathon", methods=["POST"])
@jwt_required()
def post_hackathon():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can post hackathons"}), 403

    data = request.json

    hackathon = Hackathon(

        title=data["title"],

        description=data["description"],

        organizer=data["organizer"],

        skills=data["skills"],

        url=data["url"],

        deadline=data["deadline"],

        posted_by=user_id

    )

    db.session.add(hackathon)

    db.session.commit()

    return jsonify({"message": "Hackathon posted successfully"})


# ================= GET HACKATHONS =================

@app.route("/hackathons", methods=["GET"])
@jwt_required()
def get_hackathons():

    hackathons = Hackathon.query.all()

    def parse_deadline(h):

        try:

            return datetime.strptime(h.deadline, "%Y-%m-%d")

        except:

            return datetime.max

    hackathons_sorted = sorted(hackathons, key=parse_deadline)

    result = []

    now = datetime.utcnow()

    for h in hackathons_sorted:

        deadline_date = parse_deadline(h)

        is_past = deadline_date < now

        result.append({

            "id": h.id,

            "title": h.title,

            "description": h.description,

            "organizer": h.organizer,

            "skills": h.skills,

            "url": h.url,

            "deadline": h.deadline,

            "is_past": is_past

        })

    return jsonify(result)


# ================= POST EVENT =================

@app.route("/post-event", methods=["POST"])
@jwt_required()
def post_event():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can post events"}), 403

    data = request.json

    event = Event(

        title=data["title"],

        description=data["description"],

        organizer=data["organizer"],

        skills=data["skills"],

        url=data["url"],

        deadline=data["deadline"],

        posted_by=user_id

    )

    db.session.add(event)

    db.session.commit()

    return jsonify({"message": "Event posted successfully"})


# ================= GET EVENTS =================

@app.route("/events", methods=["GET"])
@jwt_required()
def get_events():

    events = Event.query.all()

    def parse_deadline(e):

        try:

            return datetime.strptime(e.deadline, "%Y-%m-%d")

        except:

            return datetime.max

    events_sorted = sorted(events, key=parse_deadline)

    result = []

    now = datetime.utcnow()

    for e in events_sorted:

        deadline_date = parse_deadline(e)

        is_past = deadline_date < now

        result.append({

            "id": e.id,

            "title": e.title,

            "description": e.description,

            "organizer": e.organizer,

            "skills": e.skills,

            "url": e.url,

            "deadline": e.deadline,

            "is_past": is_past

        })

    return jsonify(result)


# ================= CLEANUP HACKATHONS =================

@app.route("/cleanup-hackathons", methods=["POST"])
@jwt_required()
def cleanup_hackathons():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can cleanup"}), 403

    now = datetime.utcnow()

    week_ago = now - timedelta(days=7)

    deleted_count = 0

    hackathons = Hackathon.query.all()

    for h in hackathons:

        try:

            deadline_date = datetime.strptime(h.deadline, "%Y-%m-%d")

            if deadline_date < week_ago:

                db.session.delete(h)

                deleted_count += 1

        except:

            pass

    db.session.commit()

    return jsonify({"message": f"Deleted {deleted_count} old hackathons"})


# ================= CLEANUP EVENTS =================

@app.route("/cleanup-events", methods=["POST"])
@jwt_required()
def cleanup_events():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can cleanup"}), 403

    now = datetime.utcnow()

    week_ago = now - timedelta(days=7)

    deleted_count = 0

    events = Event.query.all()

    for e in events:

        try:

            deadline_date = datetime.strptime(e.deadline, "%Y-%m-%d")

            if deadline_date < week_ago:

                db.session.delete(e)

                deleted_count += 1

        except:

            pass

    db.session.commit()

    return jsonify({"message": f"Deleted {deleted_count} old events"})


# ================= GET STUDENTS =================

@app.route("/students", methods=["GET"])
@jwt_required()
def get_students():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if user.role != "recruiter":

        return jsonify({"error": "Only recruiters can view students"}), 403

    students = User.query.filter_by(role="student").all()


    result = []


    for s in students:

        result.append({

            "id": s.id,

            "name": s.name,

            "branch": s.branch,

            "skills": s.skills,

            "resume": s.resume,

            "email": s.email,

            "verified": s.verified

        })


    return jsonify(result)

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@app.route("/recommended-jobs", methods=["GET"])
@jwt_required()
def recommended_jobs():

    user_id = get_jwt_identity()

    user = User.query.get(int(user_id))

    if not user.skills:
        return jsonify([])

    jobs = Job.query.all()

    if not jobs:
        return jsonify([])

    job_skill_list = [job.skills or "" for job in jobs]

    documents = [user.skills] + job_skill_list

    vectorizer = TfidfVectorizer()

    tfidf_matrix = vectorizer.fit_transform(documents)

    similarity_scores = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:]
    )[0]

    recommended = []

    for index, score in enumerate(similarity_scores):

        if score > 0.15:

            job = jobs[index]

            recommended.append({

                "job_id": job.id,
                "company": job.company,
                "role": job.role,
                "skills": job.skills,
                "deadline": job.deadline,
                "match_score": round(score * 100, 2)

            })

    recommended.sort(
        key=lambda x: x["match_score"],
        reverse=True
    )

    return jsonify(recommended)



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

# ================= START SERVER =================

with app.app_context():

    db.create_all()


if __name__ == "__main__":

    app.run(debug=True)
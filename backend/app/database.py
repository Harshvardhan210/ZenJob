import sqlite3
import os
import json
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "jobs.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite database and ensures the jobs and resumes tables exist."""
    # Ensure the parent directory of DB exists
    db_dir = os.path.dirname(DB_PATH)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT,
            job_role TEXT,
            email TEXT,
            phone TEXT,
            location TEXT,
            job_type TEXT,
            work_mode TEXT,
            skills TEXT, -- Stored as JSON string list
            experience_required TEXT,
            application_link TEXT,
            additional_notes TEXT,
            image_path TEXT,
            application_status TEXT DEFAULT 'Applied',
            extracted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN application_status TEXT DEFAULT 'Applied'")
    except sqlite3.OperationalError:
        pass # Column already exists
        
    try:
        cursor.execute("ALTER TABLE jobs ADD COLUMN match_score INTEGER DEFAULT NULL")
    except sqlite3.OperationalError:
        pass # Column already exists
        
    # Create resumes table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            filepath TEXT,
            file_size INTEGER,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active INTEGER DEFAULT 0
        )
    """)
    
    conn.commit()
    conn.close()

def add_job(job_data: Dict[str, Any]) -> int:
    """Adds a new job record to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Serialize skills list to JSON string if it's a list, otherwise default to empty list JSON
    skills = job_data.get("skills", [])
    if isinstance(skills, list):
        skills_str = json.dumps(skills)
    elif isinstance(skills, str):
        # Parse it if it was sent as a comma separated string
        skills_list = [s.strip() for s in skills.split(",") if s.strip()]
        skills_str = json.dumps(skills_list)
    else:
        skills_str = json.dumps([])
        
    cursor.execute("""
        INSERT INTO jobs (
            company_name, job_role, email, phone, location, 
            job_type, work_mode, skills, experience_required, 
            application_link, additional_notes, image_path, application_status, match_score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        job_data.get("company_name"),
        job_data.get("job_role"),
        job_data.get("email"),
        job_data.get("phone"),
        job_data.get("location"),
        job_data.get("job_type"),
        job_data.get("work_mode"),
        skills_str,
        job_data.get("experience_required"),
        job_data.get("application_link"),
        job_data.get("additional_notes"),
        job_data.get("image_path"),
        job_data.get("application_status", "Applied"),
        job_data.get("match_score")
    ))
    job_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return job_id

def get_all_jobs() -> List[Dict[str, Any]]:
    """Retrieves all job records, sorted by date in descending order."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs ORDER BY extracted_at DESC")
    rows = cursor.fetchall()
    jobs = []
    for row in rows:
        job = dict(row)
        # Deserialize skills
        try:
            job["skills"] = json.loads(row["skills"]) if row["skills"] else []
        except Exception:
            job["skills"] = []
        jobs.append(job)
    conn.close()
    return jobs

def get_job_by_id(job_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single job record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
    row = cursor.fetchone()
    if row:
        job = dict(row)
        try:
            job["skills"] = json.loads(row["skills"]) if row["skills"] else []
        except Exception:
            job["skills"] = []
        conn.close()
        return job
    conn.close()
    return None

def delete_job(job_id: int) -> bool:
    """Deletes a job record from the database by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def update_job(job_id: int, job_data: Dict[str, Any]) -> bool:
    """Updates a job record in the database by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    skills = job_data.get("skills", [])
    if isinstance(skills, list):
        skills_str = json.dumps(skills)
    elif isinstance(skills, str):
        skills_list = [s.strip() for s in skills.split(",") if s.strip()]
        skills_str = json.dumps(skills_list)
    else:
        skills_str = json.dumps([])
        
    cursor.execute("""
        UPDATE jobs SET
            company_name = ?,
            job_role = ?,
            email = ?,
            phone = ?,
            location = ?,
            job_type = ?,
            work_mode = ?,
            skills = ?,
            experience_required = ?,
            application_link = ?,
            additional_notes = ?,
            image_path = ?,
            application_status = ?,
            match_score = ?
        WHERE id = ?
    """, (
        job_data.get("company_name"),
        job_data.get("job_role"),
        job_data.get("email"),
        job_data.get("phone"),
        job_data.get("location"),
        job_data.get("job_type"),
        job_data.get("work_mode"),
        skills_str,
        job_data.get("experience_required"),
        job_data.get("application_link"),
        job_data.get("additional_notes"),
        job_data.get("image_path"),
        job_data.get("application_status", "Applied"),
        job_data.get("match_score"),
        job_id
    ))
    updated = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return updated

def add_resume(resume_data: Dict[str, Any]) -> int:
    """Adds a new resume record to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO resumes (filename, filepath, file_size, is_active)
        VALUES (?, ?, ?, ?)
    """, (
        resume_data.get("filename"),
        resume_data.get("filepath"),
        resume_data.get("file_size"),
        resume_data.get("is_active", 0)
    ))
    resume_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return resume_id

def get_all_resumes() -> List[Dict[str, Any]]:
    """Retrieves all resume records, sorted by date in descending order."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resumes ORDER BY uploaded_at DESC")
    rows = cursor.fetchall()
    resumes = []
    for row in rows:
        resumes.append(dict(row))
    conn.close()
    return resumes

def get_resume_by_id(resume_id: int) -> Optional[Dict[str, Any]]:
    """Retrieves a single resume record by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,))
    row = cursor.fetchone()
    if row:
        resume = dict(row)
        conn.close()
        return resume
    conn.close()
    return None

def delete_resume(resume_id: int) -> bool:
    """Deletes a resume record from the database by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM resumes WHERE id = ?", (resume_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def set_active_resume(resume_id: int) -> bool:
    """Sets the specified resume as active and deactivates all other resumes."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # First, set all resumes to inactive
        cursor.execute("UPDATE resumes SET is_active = 0")
        # Then, set the target resume to active
        cursor.execute("UPDATE resumes SET is_active = 1 WHERE id = ?", (resume_id,))
        success = cursor.rowcount > 0
        conn.commit()
        conn.close()
        return success
    except Exception:
        conn.rollback()
        conn.close()
        return False

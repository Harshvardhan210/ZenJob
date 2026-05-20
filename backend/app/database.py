import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
import firebase_admin
from firebase_admin import firestore
import logging

logger = logging.getLogger(__name__)

# Firestore client initialization
def get_db():
    try:
        return firestore.client()
    except ValueError:
        # App is not initialized yet (missing credentials)
        logger.error("Firestore client failed to initialize. Check if firebase-adminsdk.json is present.")
        return None

def init_db():
    """No-op for Firestore, since collections are created implicitly."""
    pass

def add_job(job_data: Dict[str, Any], user_id: str) -> str:
    """Adds a new job record to the Firestore database for the user."""
    db = get_db()
    if not db: return ""
    
    skills = job_data.get("skills", [])
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(",") if s.strip()]
        
    doc_ref = db.collection('jobs').document()
    
    # Clean up data
    data = {
        "user_id": user_id,
        "company_name": job_data.get("company_name"),
        "job_role": job_data.get("job_role"),
        "email": job_data.get("email"),
        "phone": job_data.get("phone"),
        "location": job_data.get("location"),
        "job_type": job_data.get("job_type"),
        "work_mode": job_data.get("work_mode"),
        "skills": skills,
        "experience_required": job_data.get("experience_required"),
        "application_link": job_data.get("application_link"),
        "additional_notes": job_data.get("additional_notes"),
        "image_path": job_data.get("image_path"),
        "application_status": job_data.get("application_status", "Applied"),
        "match_score": job_data.get("match_score"),
        "extracted_at": datetime.now().isoformat()
    }
    
    doc_ref.set(data)
    return doc_ref.id

def get_all_jobs(user_id: str) -> List[Dict[str, Any]]:
    """Retrieves all jobs for the specific user from Firestore."""
    db = get_db()
    if not db: return []
    
    docs = db.collection('jobs').where('user_id', '==', user_id).order_by('extracted_at', direction=firestore.Query.DESCENDING).stream()
    jobs = []
    for doc in docs:
        job = doc.to_dict()
        job["id"] = doc.id
        jobs.append(job)
    return jobs

def get_job_by_id(job_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a specific job from Firestore."""
    db = get_db()
    if not db: return None
    
    doc = db.collection('jobs').document(job_id).get()
    if doc.exists:
        job = doc.to_dict()
        if job.get("user_id") == user_id:
            job["id"] = doc.id
            return job
    return None

def update_job(job_id: str, job_data: Dict[str, Any], user_id: str) -> bool:
    """Updates a job record in Firestore."""
    db = get_db()
    if not db: return False
    
    doc_ref = db.collection('jobs').document(job_id)
    doc = doc_ref.get()
    if doc.exists and doc.to_dict().get("user_id") == user_id:
        # Prepare update data, ignoring id and user_id
        update_data = {k: v for k, v in job_data.items() if k not in ["id", "user_id"]}
        doc_ref.update(update_data)
        return True
    return False

def delete_job(job_id: str, user_id: str) -> bool:
    """Deletes a job from Firestore."""
    db = get_db()
    if not db: return False
    
    doc_ref = db.collection('jobs').document(job_id)
    doc = doc_ref.get()
    if doc.exists and doc.to_dict().get("user_id") == user_id:
        doc_ref.delete()
        return True
    return False

# --- Resumes Management ---

def add_resume(resume_data: Dict[str, Any]) -> str:
    """Adds a new resume to Firestore."""
    db = get_db()
    if not db: return ""
    
    doc_ref = db.collection('resumes').document()
    data = {
        "user_id": resume_data.get("user_id"),
        "filename": resume_data.get("filename"),
        "filepath": resume_data.get("filepath"),
        "file_size": resume_data.get("file_size"),
        "is_active": resume_data.get("is_active", 0),
        "uploaded_at": datetime.now().isoformat()
    }
    doc_ref.set(data)
    return doc_ref.id

def get_all_resumes(user_id: str) -> List[Dict[str, Any]]:
    """Retrieves all resumes for a specific user."""
    db = get_db()
    if not db: return []
    
    docs = db.collection('resumes').where('user_id', '==', user_id).order_by('uploaded_at', direction=firestore.Query.DESCENDING).stream()
    resumes = []
    for doc in docs:
        r = doc.to_dict()
        r["id"] = doc.id
        resumes.append(r)
    return resumes

def get_resume_by_id(resume_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    """Gets a specific resume."""
    db = get_db()
    if not db: return None
    
    doc = db.collection('resumes').document(resume_id).get()
    if doc.exists:
        r = doc.to_dict()
        if r.get("user_id") == user_id:
            r["id"] = doc.id
            return r
    return None

def set_active_resume(resume_id: str, user_id: str) -> bool:
    """Sets a resume as active and deactivates all others for the user."""
    db = get_db()
    if not db: return False
    
    docs = db.collection('resumes').where('user_id', '==', user_id).stream()
    batch = db.batch()
    found = False
    
    for doc in docs:
        doc_ref = db.collection('resumes').document(doc.id)
        if doc.id == resume_id:
            batch.update(doc_ref, {"is_active": 1})
            found = True
        else:
            if doc.to_dict().get("is_active") == 1:
                batch.update(doc_ref, {"is_active": 0})
                
    if found:
        batch.commit()
        return True
    return False

def delete_resume(resume_id: str, user_id: str) -> bool:
    """Deletes a resume record from Firestore."""
    db = get_db()
    if not db: return False
    
    doc_ref = db.collection('resumes').document(resume_id)
    doc = doc_ref.get()
    if doc.exists and doc.to_dict().get("user_id") == user_id:
        doc_ref.delete()
        return True
    return False

def get_active_resume(user_id: str) -> Optional[Dict[str, Any]]:
    """Gets the user's active resume."""
    db = get_db()
    if not db: return None
    
    docs = db.collection('resumes').where('user_id', '==', user_id).where('is_active', '==', 1).limit(1).stream()
    for doc in docs:
        r = doc.to_dict()
        r["id"] = doc.id
        return r
    return None

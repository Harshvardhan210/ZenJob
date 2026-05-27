import os
import json
import re
from typing import Optional, List
from PIL import Image
import pytesseract
import pdfplumber
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from .models import JobExtraction

import platform

# If tesseract is not in PATH, you can set it here:
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
# On Linux/Docker, it will be in the system PATH.


def parse_job_text(text: str) -> JobExtraction:
    """
    Uses regex and rule-based logic to extract job details from raw text.
    """
    details = {
        "company_name": None,
        "job_role": None,
        "email": None,
        "phone": None,
        "location": None,
        "job_type": "Full-time",
        "work_mode": "On-site",
        "skills": [],
        "experience_required": None,
        "application_link": None,
        "additional_notes": ""
    }

    # Extract email
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    if email_match:
        details["email"] = email_match.group(0)

    # Extract phone
    phone_match = re.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
    if phone_match:
        details["phone"] = phone_match.group(0)

    # Extract URLs
    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)
    if urls:
        details["application_link"] = urls[0]

    # Heuristic for Job Role: Look for common titles
    roles = ["Developer", "Engineer", "Manager", "Designer", "Analyst", "Lead", "Consultant", "Director"]
    lines = text.split('\n')
    for line in lines:
        for r in roles:
            if r.lower() in line.lower() and len(line.strip()) < 50:
                details["job_role"] = line.strip()
                break
        if details["job_role"]: break

    # If no role found, look for "Hiring" or "Position"
    if not details["job_role"]:
        pos_match = re.search(r'(Position|Role|Hiring for|Job Title):\s*([^\n]+)', text, re.IGNORECASE)
        if pos_match:
            details["job_role"] = pos_match.group(2).strip()

    # Heuristic for Company Name: Usually near the top or near "at"
    if lines:
        # Check first 3 non-empty lines
        candidate_lines = [l.strip() for l in lines if l.strip()][:3]
        if candidate_lines:
            details["company_name"] = candidate_lines[0]

    # Work Mode / Job Type
    if "remote" in text.lower(): details["work_mode"] = "Remote"
    elif "hybrid" in text.lower(): details["work_mode"] = "Hybrid"
    
    if "part-time" in text.lower() or "part time" in text.lower(): details["job_type"] = "Part-time"
    elif "internship" in text.lower(): details["job_type"] = "Internship"
    elif "contract" in text.lower(): details["job_type"] = "Contract"

    # Skills extraction (Keyword based)
    common_skills = [
        "Python", "Java", "JavaScript", "React", "Node", "Angular", "Vue", "AWS", "Azure", "Docker", "Kubernetes",
        "SQL", "NoSQL", "MongoDB", "PostgreSQL", "Flutter", "React Native", "Android", "iOS", "Swift", "Kotlin",
        "C++", "C#", "PHP", "Laravel", "Ruby", "Rails", "Go", "Rust", "TypeScript", "HTML", "CSS", "Tailwind",
        "Figma", "Photoshop", "Adobe", "Excel", "Marketing", "SEO", "Sales", "Communication", "Teamwork"
    ]
    for skill in common_skills:
        if re.search(rf'\b{re.escape(skill)}\b', text, re.IGNORECASE):
            details["skills"].append(skill)

    # Experience
    exp_match = re.search(r'(\d+[\+\-]?\s*(years?|yrs?))', text, re.IGNORECASE)
    if exp_match:
        details["experience_required"] = exp_match.group(0)

    # Location
    # This is hard without a database, but let's look for "Location:"
    loc_match = re.search(r'Location:\s*([^\n]+)', text, re.IGNORECASE)
    if loc_match:
        details["location"] = loc_match.group(1).strip()

    details["additional_notes"] = "Extracted locally using Python (Pytesseract/Regex)."
    
    return JobExtraction(**details)

def extract_job_info_from_image(image_path: str) -> JobExtraction:
    """
    Extracts text from image using Pytesseract and parses it locally.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")
        
    try:
        image = Image.open(image_path)
        # Perform OCR
        raw_text = pytesseract.image_to_string(image)
        return parse_job_text(raw_text)
    except Exception as e:
        if "tesseract is not installed" in str(e).lower() or "tesseract_cmd" in str(e).lower():
            raise ValueError("Tesseract OCR engine not found. Please install it on your system.")
        raise ValueError(f"Local OCR failed: {str(e)}")

def extract_job_info_from_text(text: str) -> JobExtraction:
    return parse_job_text(text)

def match_resume_to_jd(resume_path: str, jd_details: dict) -> dict:
    """
    Matches a local resume (PDF) against job details using TF-IDF similarity.
    """
    # 1. Extract text from resume
    resume_text = ""
    try:
        with pdfplumber.open(resume_path) as pdf:
            for page in pdf.pages:
                resume_text += (page.extract_text() or "") + "\n"
    except Exception as e:
        print(f"Failed to parse resume PDF: {str(e)}")
        return {}

    if not resume_text.strip():
        return {}

    # 2. Combine JD fields for matching
    jd_text = f"{jd_details.get('job_role', '')} {jd_details.get('company_name', '')} {' '.join(jd_details.get('skills', []))} {jd_details.get('additional_notes', '')}"
    
    # 3. Simple TF-IDF Cosine Similarity
    try:
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([resume_text, jd_text])
        similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        match_score = int(similarity * 100)
    except Exception:
        match_score = 0

    # 4. Keyword matches
    resume_text_lower = resume_text.lower()
    matching_skills = []
    missing_skills = []
    
    for skill in jd_details.get('skills', []):
        if skill.lower() in resume_text_lower:
            matching_skills.append(skill)
        else:
            missing_skills.append(skill)

    # 5. Heuristic suggestions
    suggestions = []
    if not matching_skills:
        suggestions.append("Ensure your resume contains the exact keywords mentioned in the job description.")
    if missing_skills:
        suggestions.append(f"Try to incorporate skills like {', '.join(missing_skills[:3])} into your resume experiences.")
    if len(resume_text) < 500:
        suggestions.append("Your resume seems short; consider adding more detail to your professional experience.")

    return {
        "match_score": match_score,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "suggestions": suggestions
    }

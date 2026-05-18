import os
import json
from typing import Optional
from PIL import Image
import google.generativeai as genai
from .models import JobExtraction

def extract_job_info_from_image(image_path: str, custom_api_key: Optional[str] = None) -> JobExtraction:
    """
    Sends the uploaded poster/screenshot to Gemini API to extract 
    structured job information as a Pydantic JobExtraction model.
    """
    # 1. Retrieve the Gemini API Key
    api_key = custom_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "Gemini API Key is missing. Please configure it in the application settings (gear icon) "
            "or set the GEMINI_API_KEY environment variable on the server."
        )
        
    # 2. Configure the Gemini SDK
    genai.configure(api_key=api_key)
    
    # 3. Load the image using Pillow
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found at path: {image_path}")
        
    try:
        image = Image.open(image_path)
    except Exception as e:
        raise ValueError(f"Failed to open image file using PIL: {str(e)}")
        
    # 4. Initialize Gemini Model (gemini-2.5-flash is extremely fast, free/low-cost, and supports multimodal inputs)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    # 5. Build prompt
    prompt = (
        "You are an expert AI parser specializing in extracting structured job details from job advertisement flyers, "
        "posters, and screenshots. Analyze the attached image and extract all relevant job details.\n"
        "Be thorough and precise. If some information is not present or cannot be inferred from the image, leave it as null/empty.\n\n"
        "FIELDS TO EXTRACT:\n"
        "- company_name: Name of the company offering the job (e.g. Google, TechCorp, Acme Inc).\n"
        "- job_role: Job title or role (e.g. Software Engineer, React Developer, Marketing Lead).\n"
        "- email: Contact email address for job application if visible in poster.\n"
        "- phone: Contact phone number if visible in poster.\n"
        "- location: Job location (e.g. Remote, San Francisco, New Delhi, etc.).\n"
        "- job_type: Job type (e.g. Full-time, Part-time, Internship, Contract).\n"
        "- work_mode: Work mode (e.g. Remote, Hybrid, On-site).\n"
        "- skills: List of key skills required for the job as listed in the poster (e.g. ['React', 'Node.js', 'Python']).\n"
        "- experience_required: Experience requirements (e.g. 2+ years, Freshers).\n"
        "- application_link: Any website URL, application link, or landing page link shown.\n"
        "- additional_notes: Any other key information, requirements, or perks extracted from the poster."
    )
    
    # 6. Call the Gemini API with a robust schema-constrained config
    try:
        # Standard configuration utilizing native structured JSON output
        response = model.generate_content(
            [image, prompt],
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": JobExtraction,
            }
        )
        return JobExtraction.model_validate_json(response.text)
    except Exception as e:
        # Fallback mechanism for potential SDK version incompatibilities
        # Just request application/json output format and prompt-based structure constraint
        fallback_prompt = (
            f"{prompt}\n\nYou MUST return a JSON object matching this structure:\n"
            "{\n"
            '  "company_name": "string or null",\n'
            '  "job_role": "string or null",\n'
            '  "email": "string or null",\n'
            '  "phone": "string or null",\n'
            '  "location": "string or null",\n'
            '  "job_type": "string or null",\n'
            '  "work_mode": "string or null",\n'
            '  "skills": ["string"],\n'
            '  "experience_required": "string or null",\n'
            '  "application_link": "string or null",\n'
            '  "additional_notes": "string or null"\n'
            "}"
        )
        
        response = model.generate_content(
            [image, fallback_prompt],
            generation_config={
                "response_mime_type": "application/json",
            }
        )
        return JobExtraction.model_validate_json(response.text)

def extract_job_info_from_text(text: str, custom_api_key: Optional[str] = None) -> JobExtraction:
    """
    Sends raw job description text to the Gemini API to extract 
    structured job information as a Pydantic JobExtraction model.
    """
    # 1. Retrieve the Gemini API Key
    api_key = custom_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "Gemini API Key is missing. Please configure it in the application settings (gear icon) "
            "or set the GEMINI_API_KEY environment variable on the server."
        )
        
    # 2. Configure the Gemini SDK
    genai.configure(api_key=api_key)
    
    # 3. Initialize Gemini Model (gemini-2.5-flash is extremely fast, free/low-cost)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    # 4. Build prompt
    prompt = (
        "You are an expert AI parser specializing in extracting structured job details from raw job description texts.\n"
        "Analyze the following job description text and extract all relevant job details.\n"
        "Be thorough and precise. If some information is not present or cannot be inferred from the text, leave it as null/empty.\n\n"
        "FIELDS TO EXTRACT:\n"
        "- company_name: Name of the company offering the job (e.g. Google, TechCorp, Acme Inc).\n"
        "- job_role: Job title or role (e.g. Software Engineer, React Developer, Marketing Lead).\n"
        "- email: Contact email address for job application if visible in the text.\n"
        "- phone: Contact phone number if visible in the text.\n"
        "- location: Job location (e.g. Remote, San Francisco, New Delhi, etc.).\n"
        "- job_type: Job type (e.g. Full-time, Part-time, Internship, Contract).\n"
        "- work_mode: Work mode (e.g. Remote, Hybrid, On-site).\n"
        "- skills: List of key skills required for the job as listed in the text (e.g. ['React', 'Node.js', 'Python']).\n"
        "- experience_required: Experience requirements (e.g. 2+ years, Freshers).\n"
        "- application_link: Any website URL, application link, or landing page link shown in the text.\n"
        "- additional_notes: Any other key information, requirements, or perks extracted from the text.\n\n"
        f"JOB DESCRIPTION TEXT TO ANALYZE:\n"
        f"\"\"\"\n{text}\n\"\"\""
    )
    
    # 5. Call the Gemini API with a robust schema-constrained config
    try:
        response = model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": JobExtraction,
            }
        )
        return JobExtraction.model_validate_json(response.text)
    except Exception as e:
        # Fallback mechanism for potential SDK version incompatibilities
        fallback_prompt = (
            f"{prompt}\n\nYou MUST return a JSON object matching this structure:\n"
            "{\n"
            '  "company_name": "string or null",\n'
            '  "job_role": "string or null",\n'
            '  "email": "string or null",\n'
            '  "phone": "string or null",\n'
            '  "location": "string or null",\n'
            '  "job_type": "string or null",\n'
            '  "work_mode": "string or null",\n'
            '  "skills": ["string"],\n'
            '  "experience_required": "string or null",\n'
            '  "application_link": "string or null",\n'
            '  "additional_notes": "string or null"\n'
            "}"
        )
        
        response = model.generate_content(
            fallback_prompt,
            generation_config={
                "response_mime_type": "application/json",
            }
        )
        return JobExtraction.model_validate_json(response.text)

def match_resume_to_jd(resume_path: str, jd_details: dict, custom_api_key: Optional[str] = None) -> dict:
    """
    Uploads the active resume file to the Gemini API, matches its content
    against the extracted job details, and returns structured match results.
    """
    # 1. Retrieve the Gemini API Key
    api_key = custom_api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Missing Gemini API Key for resume matching.")
        return {}
        
    # 2. Configure the Gemini SDK
    genai.configure(api_key=api_key)
    
    # 3. Verify file exists
    if not os.path.exists(resume_path):
        print(f"Active resume file not found at: {resume_path}")
        return {}
        
    # 4. Upload file to Gemini API
    try:
        uploaded_file = genai.upload_file(resume_path)
    except Exception as e:
        print(f"Failed to upload resume to Gemini: {str(e)}")
        return {}
        
    # 5. Build prompt
    prompt = (
        "You are an expert technical recruiter and resume matching specialist.\n"
        "Analyze the attached resume against this Job Description (JD) and calculate the fit:\n\n"
        "JOB DETAILS TO MATCH AGAINST:\n"
        f"Company Name: {jd_details.get('company_name') or 'N/A'}\n"
        f"Job Role: {jd_details.get('job_role') or 'N/A'}\n"
        f"Required Skills: {jd_details.get('skills') or []}\n"
        f"Location: {jd_details.get('location') or 'N/A'}\n"
        f"Job Type: {jd_details.get('job_type') or 'N/A'}\n"
        f"Work Mode: {jd_details.get('work_mode') or 'N/A'}\n"
        f"Experience Required: {jd_details.get('experience_required') or 'N/A'}\n"
        f"Additional Notes: {jd_details.get('additional_notes') or 'N/A'}\n\n"
        "Review the candidate's resume and return a JSON matching this structure exactly:\n"
        "{\n"
        '  "match_score": 85,\n'
        '  "matching_skills": ["HTML", "JavaScript"],\n'
        '  "missing_skills": ["Zoho CRM", "Salesforce"],\n'
        '  "suggestions": ["Add Zoho CRM certification", "Highlight workflow automation projects"]\n'
        "}\n\n"
        "Ensure match_score is an integer between 0 and 100 representing how well the candidate fits the requirements.\n"
        "matching_skills should list skills from the JD that are present or well-implied in the resume.\n"
        "missing_skills should list skills from the JD that are absent or weak in the resume.\n"
        "suggestions should list actionable, specific feedback for the candidate to improve their match score."
    )
    
    # 6. Call generative model
    model = genai.GenerativeModel("gemini-2.5-flash")
    try:
        response = model.generate_content(
            [uploaded_file, prompt],
            generation_config={
                "response_mime_type": "application/json"
            }
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Failed to match resume using Gemini: {str(e)}")
        return {}
    finally:
        # 7. Clean up file on Gemini server
        try:
            uploaded_file.delete()
        except Exception:
            pass



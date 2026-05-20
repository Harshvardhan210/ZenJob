from pydantic import BaseModel, Field
from typing import Optional, List

class JobExtraction(BaseModel):
    company_name: Optional[str] = Field(None, description="Name of the company offering the job")
    job_role: Optional[str] = Field(None, description="Job title or role (e.g., Software Engineer, React Developer)")
    email: Optional[str] = Field(None, description="Contact email address for job application if visible in poster")
    phone: Optional[str] = Field(None, description="Contact phone number if visible in poster")
    location: Optional[str] = Field(None, description="Job location (e.g., Remote, San Francisco, New Delhi)")
    job_type: Optional[str] = Field(None, description="Job type (e.g., Full-time, Part-time, Internship, Contract)")
    work_mode: Optional[str] = Field(None, description="Work mode (e.g., Remote, Hybrid, On-site)")
    skills: Optional[List[str]] = Field(default_factory=list, description="Key skills required for the job as listed in the poster")
    experience_required: Optional[str] = Field(None, description="Experience requirements (e.g., 2+ years, Freshers)")
    application_link: Optional[str] = Field(None, description="Any application website URL, landing page, or source link")
    additional_notes: Optional[str] = Field(None, description="Any other key details or a summarized description extracted from the poster")
    application_status: Optional[str] = Field("Applied", description="Status of the application (e.g., Applied, Test Process, Screening, Pending response, Rejected, Selected)")
    match_score: Optional[int] = Field(None, description="Match score with active resume (0-100)")
    matching_skills: Optional[List[str]] = Field(default=None, description="List of matching skills")
    missing_skills: Optional[List[str]] = Field(default=None, description="List of missing skills")
    suggestions: Optional[List[str]] = Field(default=None, description="Suggestions to improve matching")

class JobDB(JobExtraction):
    id: str
    user_id: str
    image_path: Optional[str] = None
    extracted_at: str

class TextExtractionRequest(BaseModel):
    text: str = Field(..., description="Raw text of the job description to parse")

class UrlExtractionRequest(BaseModel):
    url: str = Field(..., description="URL of the job posting to scrape and parse")

class ResumeDB(BaseModel):
    id: str
    user_id: str
    filename: str
    filepath: str
    file_size: int
    uploaded_at: str
    is_active: int

import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, getIdToken } from 'firebase/auth';
import AuthScreen from './AuthScreen';
import LandingPage from './LandingPage';
import {
  Briefcase,
  UploadCloud,
  Settings,
  FileSpreadsheet,
  Search,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Plus,
  X,
  Check,
  MapPin,
  Mail,
  Phone,
  Globe,
  FileText,
  Info,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  Download,
  AlertTriangle,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  User
} from 'lucide-react';

// Backend URL logic: uses production URL if available, otherwise defaults to local
const DEFAULT_BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const getStatusColors = (status) => {

  switch (status) {
    case 'Selected': return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' }; // Green
    case 'Rejected': return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' }; // Red
    case 'Test Process': return { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c' }; // Orange
    case 'Screening': return { bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc' }; // Purple
    case 'Pending response': return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' }; // Yellow
    case 'Applied':
    default: return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' }; // Indigo
  }
};

const MatchAnalysisModal = ({ analysis, onClose }) => {
  if (!analysis) return null;
  const score = analysis.match_score || 0;
  const color = score > 80 ? '#34d399' : score > 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="icon-box" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Zen Analysis
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI-Powered Skill Match Verdict</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ padding: '1rem 0' }}>
          {/* Hero Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem 0 2rem' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="120" height="120" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - score / 100)}`}
                  strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: '800', color: color }}>{score}%</span>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Match</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={14} /> Matching Skills
              </h4>
              <div className="skills-tags">
                {(analysis.matching_skills || []).map(s => <span key={s} className="badge" style={{ borderColor: 'rgba(52, 211, 153, 0.2)', color: '#34d399', background: 'rgba(52, 211, 153, 0.05)' }}>{s}</span>)}
                {(!analysis.matching_skills || analysis.matching_skills.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None identified</span>}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '0.85rem', color: '#fb923c', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={14} /> Skill Gaps
              </h4>
              <div className="skills-tags">
                {(analysis.missing_skills || []).map(s => <span key={s} className="badge" style={{ borderColor: 'rgba(251, 146, 60, 0.2)', color: '#fb923c', background: 'rgba(251, 146, 60, 0.05)' }}>{s}</span>)}
                {(!analysis.missing_skills || analysis.missing_skills.length === 0) && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Perfect alignment!</span>}
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Info size={14} /> AI Suggestions
            </h4>
            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {(analysis.suggestions || []).map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
          <button className="btn btn-secondary w-full" onClick={onClose}>Close Analysis</button>
        </div>
      </div>
    </div>
  );
};

function App() {
  // --- STATE DECLARATIONS ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('app_active_section') || 'welcome';
  });
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }

  useEffect(() => {
    localStorage.setItem('app_active_section', activeSection);
  }, [activeSection]);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, exiting: false }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 400); // Match animation duration in CSS
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm });
  };
  const [backendUrl, setBackendUrl] = useState(() => {
    const saved = localStorage.getItem('backend_url');
    if (saved && saved !== 'undefined' && saved !== 'null') return saved;
    if (window.location.origin.startsWith('capacitor://') || window.location.origin.startsWith('http://localhost:80')) {
      return 'http://10.0.2.2:8000';
    }
    return DEFAULT_BACKEND_URL;
  });

  const BACKEND_URL = backendUrl;
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // Resume States
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [selectedResumeFile, setSelectedResumeFile] = useState(null);
  const [resumeUploadStatus, setResumeUploadStatus] = useState('idle'); // idle | uploading | completed | error
  const [resumeUploadError, setResumeUploadError] = useState('');
  const [resumeDragActive, setResumeDragActive] = useState(false);

  // Upload and Extraction States
  const [inputType, setInputType] = useState('image'); // 'image' | 'text' | 'url'
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | extracting | completed | error
  const [uploadError, setUploadError] = useState('');

  // Extraction Result State (for reviewing & editing)
  const [savedImagePath, setSavedImagePath] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [editedData, setEditedData] = useState({
    company_name: '',
    job_role: '',
    email: '',
    phone: '',
    location: '',
    job_type: 'Full-time',
    work_mode: 'Remote',
    skills: [],
    experience_required: '',
    application_link: '',
    additional_notes: '',
    application_status: 'Applied',
    match_score: null
  });
  const [newSkillInput, setNewSkillInput] = useState('');

  // UI Controls
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorkMode, setFilterWorkMode] = useState('All');
  const [filterJobType, setFilterJobType] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('zenjob_theme') || 'dark');
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [footerModal, setFooterModal] = useState(null); // 'privacy' | 'terms' | 'support'

  // --- EDIT MODAL STATE ---
  const [editModalJob, setEditModalJob] = useState(null); // null = closed
  const [editModalData, setEditModalData] = useState({});
  const [editModalSkillInput, setEditModalSkillInput] = useState('');
  const [isEditModalSaving, setIsEditModalSaving] = useState(false);

  // --- LIFECYCLE ---

  // Theme Sync
  useEffect(() => {
    document.body.className = theme === 'light' ? 'light-theme' : '';
    localStorage.setItem('zenjob_theme', theme);
  }, [theme]);

  const resetAppState = () => {
    setJobs([]);
    setResumes([]);
    setExtractedData(null);
    setUploadStatus('idle');
    setResumeUploadStatus('idle');
    setImagePreview(null);
    setSavedImagePath('');
    setIsEditing(false);
    setEditedData({
      company_name: '',
      job_role: '',
      email: '',
      phone: '',
      location: '',
      job_type: 'Full-time',
      work_mode: 'Remote',
      skills: [],
      experience_required: '',
      application_link: '',
      additional_notes: '',
      application_status: 'Applied',
      match_score: null
    });
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        // Initial fetches when logged in
        fetchJobs();
        fetchResumes();
      } else {
        // Clear all state when logged out
        resetAppState();
      }
    });
    return () => unsubscribe();
  }, []);


  // --- AUTH HELPERS ---
  const getAuthHeaders = async () => {
    if (!auth.currentUser) return {};
    try {
      const token = await getIdToken(auth.currentUser, /* forceRefresh */ false);
      return { 'Authorization': `Bearer ${token}` };
    } catch (e) {
      console.error('Failed to get auth token', e);
      return {};
    }
  };

  // --- API CALLS ---
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/jobs`, { headers: authHeaders });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      } else {
        console.error("Failed to fetch jobs database");
      }
    } catch (error) {
      console.error("Connection error to backend:", error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleExtract = async () => {
    setUploadStatus('uploading');
    setUploadError('');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      setUploadStatus('extracting');
      const authHeaders = await getAuthHeaders();
      // No custom header, backend will use session cookie
      const response = await fetch(`${BACKEND_URL}/api/extract`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Extraction failed");
      }
      const result = await response.json();
      setExtractedData(result);
      setSavedImagePath(result.image_path || '');
      // Seed our editor state
      setEditedData({
        company_name: result.company_name || '',
        job_role: result.job_role || '',
        email: result.email || '',
        phone: result.phone || '',
        location: result.location || '',
        job_type: result.job_type || 'Full-time',
        work_mode: result.work_mode || 'Remote',
        skills: Array.isArray(result.skills) ? result.skills : [],
        experience_required: result.experience_required || '',
        application_link: result.application_link || '',
        additional_notes: result.additional_notes || '',
        application_status: result.application_status || 'Applied',
        match_score: result.match_score || null
      });
      setUploadStatus('completed');
    } catch (error) {
      console.error(error);
      setUploadStatus('error');
      let msg = error.message || "An unexpected error occurred during OCR extraction.";
      if (error instanceof TypeError && error.message.includes('fetch')) {
        msg = `Backend unreachable at ${BACKEND_URL}. If you are on mobile, ensure your computer's local IP is configured correctly.`;
      }
      setUploadError(msg);
    }
  };
  const handleExtractText = async () => {
    if (!textInput.trim()) return;
    setUploadError('');
    try {
      setUploadStatus('extracting');
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/extract-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ text: textInput }),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Extraction failed");
      }
      const result = await response.json();
      setExtractedData(result);
      setSavedImagePath('');
      // Seed our editor state
      setEditedData({
        company_name: result.company_name || '',
        job_role: result.job_role || '',
        email: result.email || '',
        phone: result.phone || '',
        location: result.location || '',
        job_type: result.job_type || 'Full-time',
        work_mode: result.work_mode || 'Remote',
        skills: Array.isArray(result.skills) ? result.skills : [],
        experience_required: result.experience_required || '',
        application_link: result.application_link || '',
        additional_notes: result.additional_notes || '',
        application_status: result.application_status || 'Applied',
        match_score: result.match_score || null
      });
      setUploadStatus('completed');
    } catch (error) {
      console.error(error);
      setUploadStatus('error');
      let msg = error.message || "An unexpected error occurred during text extraction.";
      if (error instanceof TypeError && error.message.includes('fetch')) {
        msg = `Backend unreachable at ${BACKEND_URL}. If you are on mobile, ensure your computer's local IP is configured correctly.`;
      }
      setUploadError(msg);
    }
  };
  const handleExtractUrl = async () => {
    if (!urlInput.trim()) return;
    setUploadError('');
    try {
      setUploadStatus('extracting');
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/extract-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ url: urlInput }),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Extraction failed");
      }
      const result = await response.json();
      setExtractedData(result);
      setSavedImagePath('');
      // Seed our editor state
      setEditedData({
        company_name: result.company_name || '',
        job_role: result.job_role || '',
        email: result.email || '',
        phone: result.phone || '',
        location: result.location || '',
        job_type: result.job_type || 'Full-time',
        work_mode: result.work_mode || 'Remote',
        skills: Array.isArray(result.skills) ? result.skills : [],
        experience_required: result.experience_required || '',
        application_link: result.application_link || '',
        additional_notes: result.additional_notes || '',
        application_status: result.application_status || 'Applied',
        match_score: result.match_score || null
      });
      setUploadStatus('completed');
    } catch (error) {
      console.error(error);
      setUploadStatus('error');
      let msg = error.message || "An unexpected error occurred during URL extraction.";
      if (error instanceof TypeError && error.message.includes('fetch')) {
        msg = `Backend unreachable at ${BACKEND_URL}. If you are on mobile, ensure your computer's local IP is configured correctly.`;
      }
      setUploadError(msg);
    }
  };

  const handleUpdateBackendUrl = () => {
    const newUrl = window.prompt("Enter Backend API URL (e.g. http://192.168.1.5:8000):", BACKEND_URL);
    if (newUrl && newUrl.trim()) {
      setBackendUrl(newUrl.trim());
      localStorage.setItem('backend_url', newUrl.trim());
      showToast("Gateway configuration updated.", "success");
    }
  };
  const handleSaveJob = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const authHeaders = await getAuthHeaders();
      let url, method;

      if (isEditing && editedData.id) {
        url = `${BACKEND_URL}/api/jobs/${editedData.id}`;
        method = 'PUT';
      } else {
        url = `${BACKEND_URL}/api/jobs?image_path=${encodeURIComponent(savedImagePath)}`;
        method = 'POST';
      }

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(editedData)
      });
      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'save'} job application`);
      }
      // Reset extraction pane
      setSelectedFile(null);
      setImagePreview(null);
      setExtractedData(null);
      setUploadStatus('idle');
      setIsEditing(false);
      // Refresh list
      fetchJobs();
    } catch (error) {
      showToast("Error: " + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // --- EDIT MODAL HANDLERS ---
  const openEditModal = (job) => {
    setEditModalData({
      id: job.id,
      company_name: job.company_name || '',
      job_role: job.job_role || '',
      email: job.email || '',
      phone: job.phone || '',
      location: job.location || '',
      job_type: job.job_type || 'Full-time',
      work_mode: job.work_mode || 'Remote',
      skills: Array.isArray(job.skills) ? [...job.skills] : [],
      experience_required: job.experience_required || '',
      application_link: job.application_link || '',
      additional_notes: job.additional_notes || '',
      application_status: job.application_status || 'Applied',
    });
    setEditModalSkillInput('');
    setEditModalJob(job);
  };

  const closeEditModal = () => {
    setEditModalJob(null);
    setEditModalData({});
    setEditModalSkillInput('');
  };

  const handleEditModalSave = async (e) => {
    e.preventDefault();
    setIsEditModalSaving(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/jobs/${editModalData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(editModalData)
      });
      if (!response.ok) throw new Error('Failed to update job');
      const updated = await response.json();
      setJobs(prev => prev.map(j => j.id === updated.id ? updated : j));
      showToast('Job updated successfully!', 'success');
      closeEditModal();
    } catch (error) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      setIsEditModalSaving(false);
    }
  };

  const handleDeleteJob = (id) => {
    showConfirm("Delete this job posting? Its stored image will also be removed.", async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/api/jobs/${id}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        if (response.ok) {
          showToast('Job deleted successfully', 'success');
          fetchJobs();
        } else {
          const err = await response.json();
          showToast("Error deleting job: " + err.detail, 'error');
        }
      } catch (error) {
        showToast('Network error: Could not complete job deletion', 'error');
      }
    });
  };
  const handleStatusChange = async (job, newStatus) => {
    try {
      const authHeaders = await getAuthHeaders();
      const updatedJobPayload = {
        company_name: job.company_name,
        job_role: job.job_role,
        email: job.email,
        phone: job.phone,
        location: job.location,
        job_type: job.job_type,
        work_mode: job.work_mode,
        skills: job.skills || [],
        experience_required: job.experience_required,
        application_link: job.application_link,
        additional_notes: job.additional_notes,
        application_status: newStatus
      };
      const url = `${BACKEND_URL}/api/jobs/${job.id}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(updatedJobPayload)
      });
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      setJobs(prevJobs => prevJobs.map(j => j.id === job.id ? { ...j, application_status: newStatus } : j));
      // If modal is open for this job, update it too
      if (showDetailModal && showDetailModal.id === job.id) {
        setShowDetailModal(prev => ({ ...prev, application_status: newStatus }));
      }
    } catch (error) {
      showToast('Error updating status: ' + error.message, 'error');
    }
  };
  const handleExportExcel = async () => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/export`, { headers: authHeaders });
      if (!response.ok) {
        throw new Error("Could not fetch the generated Excel report");
      }
      // Download Blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Parse dynamic filename from headers if possible
      const disposition = response.headers.get('content-disposition');
      let filename = `ZenJob_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showToast('Excel export failed: ' + error.message, 'error');
    }
  };
  // --- RESUME OPERATIONS ---
  const fetchResumes = async () => {
    setLoadingResumes(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/resumes`, { headers: authHeaders });
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      } else {
        console.error("Failed to fetch resumes database");
      }
    } catch (error) {
      console.error("Connection error to backend:", error);
    } finally {
      setLoadingResumes(false);
    }
  };
  const handleResumeUpload = async (fileToUpload) => {
    if (!fileToUpload) return;
    setResumeUploadStatus('uploading');
    setResumeUploadError('');
    const formData = new FormData();
    formData.append('file', fileToUpload);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/resumes`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setResumes(prev => {
          // If the new one is active, deactivate others
          if (data.is_active) {
            return [...prev.map(r => ({ ...r, is_active: 0 })), data];
          }
          return [...prev, data];
        });
        setResumeUploadStatus('success');
        showToast("Resume uploaded successfully!", "success");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }
    } catch (error) {
      setResumeUploadStatus('error');
      setResumeUploadError(error.message);
      showToast("Upload failed: " + error.message, "error");
    }
  };
  const handleMakeResumeActive = async (resumeId) => {
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/resumes/${resumeId}/active`, {
        method: 'POST',
        headers: authHeaders
      });
      if (response.ok) {
        const updated = await response.json();
        setResumes(prev => prev.map(r => ({
          ...r,
          is_active: r.id === updated.id ? 1 : 0
        })));
        showToast("Active resume updated!", "success");
      } else {
        const err = await response.json();
        throw new Error(err.detail || "Failed to set active resume");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };
  const handleAnalyzeMatch = async (jobId) => {
    setIsAnalyzing(true);
    setActiveAnalysis(null);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}/analyze`, {
        method: 'POST',
        headers: authHeaders,
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setActiveAnalysis(data);
      } else {
        showToast(data.detail || "Analysis failed. Ensure you have an active resume.", "error");
      }
    } catch (error) {
      showToast("Connection error: " + error.message, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleDeleteResume = (resumeId) => {
    showConfirm("Delete this resume? The file will be permanently removed from disk.", async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${BACKEND_URL}/api/resumes/${resumeId}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        if (response.ok) {
          showToast('Resume deleted', 'success');
          setResumes(prev => prev.filter(r => r.id !== resumeId));
        } else {
          const err = await response.json();
          showToast('Error: ' + err.detail, 'error');
        }
      } catch (error) {
        showToast('Network error: Could not delete resume', 'error');
      }
    });
  };
  const handleResumeDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setResumeDragActive(true);
    } else if (e.type === "dragleave") {
      setResumeDragActive(false);
    }
  };
  const handleResumeDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setResumeDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop().toLowerCase();
      if (['pdf', 'doc', 'docx'].includes(ext)) {
        setSelectedResumeFile(file);
        handleResumeUpload(file);
      } else {
        showToast('Please upload a valid document file (PDF, DOC, or DOCX)', 'error');
      }
    }
  };
  const handleResumeFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedResumeFile(file);
      handleResumeUpload(file);
    }
  };
  // --- FILE DRAG & DROP HANDLING ---
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
        setUploadStatus('idle');
      } else {
        showToast('Please upload an image file (PNG, JPG, WEBP, etc.)', 'error');
      }
    }
  };
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadStatus('idle');
    }
  };
  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setTextInput('');
    setUrlInput('');
    setExtractedData(null);
    setUploadStatus('idle');
    setIsEditing(false);
  };
  const startManualAdd = () => {
    setExtractedData({ manual: true });
    setEditedData({
      company_name: '',
      job_role: '',
      email: '',
      phone: '',
      location: '',
      job_type: 'Full-time',
      work_mode: 'Remote',
      skills: [],
      experience_required: '',
      application_link: '',
      additional_notes: '',
      application_status: 'Applied',
      match_score: null
    });
    setSavedImagePath('');
    setIsEditing(false);
    setUploadStatus('idle');
    setActiveSection('manual');
  };
  // --- SKILL TAGS ACTIONS ---
  const addSkill = () => {
    if (newSkillInput.trim() && !editedData.skills.includes(newSkillInput.trim())) {
      setEditedData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkillInput.trim()]
      }));
      setNewSkillInput('');
    }
  };
  const removeSkill = (skillToRemove) => {
    setEditedData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove)
    }));
  };
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };
  // --- SEARCH AND FILTER FILTERING ---
  const filteredJobs = jobs.filter(job => {
    const searchString = `${job.company_name} ${job.job_role} ${job.location} ${(job.skills || []).join(' ')}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesWorkMode = filterWorkMode === 'All' || job.work_mode === filterWorkMode;
    const matchesJobType = filterJobType === 'All' || job.job_type === filterJobType;
    return matchesSearch && matchesWorkMode && matchesJobType;
  });
  if (authLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: '#818cf8' }}><RefreshCw size={32} className="spin" /></div>;
  }
  if (!user || isRegistering) {
    if (showLanding) {
      return (
        <LandingPage
          onGetStarted={() => setShowLanding(false)}
          theme={theme}
          setTheme={setTheme}
          setFooterModal={setFooterModal}
          backendUrl={BACKEND_URL}
        />
      );
    }
    return <AuthScreen setIsRegistering={setIsRegistering} onBack={() => setShowLanding(true)} />;
  }
  if (activeSection === 'welcome') {
    return (
      <div className="app-wrapper welcome-screen" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)' }}>
        <div className="glass-panel fade-in" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '3rem 2rem', position: 'relative', overflow: 'hidden' }}>
          <div className="glow-effect" style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div className="icon-box" style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={40} style={{ color: '#a78bfa' }} />
              </div>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem', letterSpacing: '-0.02em' }}>ZenJob</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Your cyber-luxe portal for AI-powered job application tracking, resume matching, and automated insight extraction.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
              All job data extraction and resume matching are powered by secure server-side AI.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', justifyContent: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)' }}
              onClick={() => setActiveSection('dashboard')}
            >
              <Sparkles size={20} />
              Initiate Dashboard Portal
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`app-wrapper${theme === 'light' ? ' light-theme' : ''}`}>
      {/* GLOBAL TOAST STACK */}
      <div className="toast-stack">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : ''}`}
          >
            <div className="toast-icon">
              {t.type === 'error' ? <AlertTriangle size={20} /> :
                t.type === 'warning' ? <Info size={20} /> :
                  t.type === 'info' ? <Info size={20} /> :
                    <Check size={20} />}
            </div>
            <div className="toast-content">
              <div className="toast-message">{t.message}</div>
            </div>
            <button
              className="toast-close"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(t.id);
              }}
            >
              <X size={16} />
            </button>
            <div className="toast-progress-container">
              <div
                className="toast-progress-bar"
                style={{ animation: 'progress-drain 4s linear forwards' }}
              />
            </div>
          </div>
        ))}
      </div>
      {/* CUSTOM CONFIRM DIALOG */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
          <div className="glass-panel fade-in" style={{ maxWidth: '380px', width: '90%', padding: '1.75rem', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} style={{ color: '#f87171' }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.35rem' }}>Confirm Action</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{confirmModal.message}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem' }} onClick={() => setConfirmModal(null)}>Cancel</button>
              <button className="btn" style={{ padding: '0.5rem 1.1rem', fontSize: '0.875rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }} onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* JOB EDIT MODAL */}
      {editModalJob && (
        <div className="modal-overlay" onClick={closeEditModal} style={{ zIndex: 2500 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="icon-box" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Edit Job Details
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{editModalJob.company_name} · {editModalJob.job_role}</p>
                </div>
              </div>
              <button className="btn-close" onClick={closeEditModal}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem 0' }}>
              <form onSubmit={handleEditModalSave} className="form-grid">
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" required className="form-control" placeholder="e.g. Google, TechLabs"
                    value={editModalData.company_name}
                    onChange={e => setEditModalData(p => ({ ...p, company_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Job Role / Title</label>
                  <input type="text" required className="form-control" placeholder="e.g. React Developer"
                    value={editModalData.job_role}
                    onChange={e => setEditModalData(p => ({ ...p, job_role: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" className="form-control" placeholder="hr@company.com"
                    value={editModalData.email}
                    onChange={e => setEditModalData(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input type="text" className="form-control" placeholder="+1 (555) 0199"
                    value={editModalData.phone}
                    onChange={e => setEditModalData(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" className="form-control" placeholder="e.g. New Delhi"
                    value={editModalData.location}
                    onChange={e => setEditModalData(p => ({ ...p, location: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Experience Required</label>
                  <input type="text" className="form-control" placeholder="e.g. 2+ years"
                    value={editModalData.experience_required}
                    onChange={e => setEditModalData(p => ({ ...p, experience_required: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Job Type</label>
                  <select className="form-control" value={editModalData.job_type}
                    onChange={e => setEditModalData(p => ({ ...p, job_type: e.target.value }))}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Work Mode</label>
                  <select className="form-control" value={editModalData.work_mode}
                    onChange={e => setEditModalData(p => ({ ...p, work_mode: e.target.value }))}>
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Application Status</label>
                  <select className="form-control" value={editModalData.application_status}
                    onChange={e => setEditModalData(p => ({ ...p, application_status: e.target.value }))}>
                    <option value="Applied">Applied</option>
                    <option value="Test Process">Test Process</option>
                    <option value="Screening">Screening</option>
                    <option value="Pending response">Pending response</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Selected">Selected</option>
                  </select>
                </div>
                <div className="form-group span-2">
                  <label>Application Website / Link</label>
                  <input type="text" className="form-control" placeholder="https://jobs.company.com/apply"
                    value={editModalData.application_link}
                    onChange={e => setEditModalData(p => ({ ...p, application_link: e.target.value }))} />
                </div>
                <div className="form-group span-2">
                  <label>Skills Required (Enter to add)</label>
                  <div className="skills-input-container">
                    <input type="text" className="form-control" placeholder="e.g. React, Python"
                      value={editModalSkillInput}
                      onChange={e => setEditModalSkillInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const s = editModalSkillInput.trim();
                          if (s && !editModalData.skills.includes(s)) {
                            setEditModalData(p => ({ ...p, skills: [...p.skills, s] }));
                          }
                          setEditModalSkillInput('');
                        }
                      }} />
                    <button type="button" className="btn btn-secondary" onClick={() => {
                      const s = editModalSkillInput.trim();
                      if (s && !editModalData.skills.includes(s)) {
                        setEditModalData(p => ({ ...p, skills: [...p.skills, s] }));
                      }
                      setEditModalSkillInput('');
                    }}><Plus size={18} /></button>
                  </div>
                  <div className="skills-tags" style={{ marginTop: '0.5rem' }}>
                    {editModalData.skills.map(skill => (
                      <span key={skill} className="skill-tag">
                        <span>{skill}</span>
                        <button type="button" className="remove-tag-btn"
                          onClick={() => setEditModalData(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="form-group span-2">
                  <label>Additional Notes / Summary</label>
                  <textarea rows="3" className="form-control" placeholder="Add any extra job requirements..."
                    value={editModalData.additional_notes}
                    onChange={e => setEditModalData(p => ({ ...p, additional_notes: e.target.value }))} />
                </div>

                <div className="modal-footer span-2" style={{ marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                  <button type="submit" disabled={isEditModalSaving} className="btn btn-primary" style={{ minWidth: '140px' }}>
                    <Check size={18} />
                    <span>{isEditModalSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER LEGAL & SUPPORT MODAL */}
      {footerModal && (
        <div className="modal-overlay" onClick={() => setFooterModal(null)} style={{ zIndex: 3500 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: '#818cf8' }}>
                  {footerModal === 'privacy' ? <Eye size={22} /> : <FileText size={22} />}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, textTransform: 'capitalize' }}>{footerModal} Policy</h3>
              </div>
              <button className="btn-close" onClick={() => setFooterModal(null)}><X size={20} /></button>
            </div>
            <div className="modal-body" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              {footerModal === 'privacy' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p>Your privacy is paramount at ZenJob. This describes how we handle your career data.</p>
                  <section>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>1. Data Extraction</h4>
                    <p>When you upload job flyers or paste descriptions, our AI server extracts technical requirements. This data is stored securely in your private career dashboard.</p>
                  </section>
                  <section>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>2. Resume Analysis</h4>
                    <p>Resume matching happens purely on our secure servers. Your CV is never shared with third parties or used for training public AI models without explicit consent.</p>
                  </section>
                  <section>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>3. Your Controls</h4>
                    <p>You can delete any job posting or resume at any time. Deletion is permanent and removes the data from our active databases and file storage.</p>
                  </section>
                </div>
              )}
              {footerModal === 'terms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p>By using the ZenJob High-Performance Career Portal, you agree to these operating parameters.</p>
                  <section>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>1. AI Disclaimer</h4>
                    <p>AI extraction and matching scores are probabilistic. While highly accurate, users should verify critical contact information and job details before applying.</p>
                  </section>
                  <section>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>2. Usage Limits</h4>
                    <p>This portal is for personal career tracking only. Automated scraping or bulk-loading data from this interface is prohibited to ensure peak performance for all collectors.</p>
                  </section>
                  <section>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>3. Data Integrity</h4>
                    <p>Users are responsible for the legality of the job advertisements they track. ZenJob provides the infrastructure; you provide the pursuit.</p>
                  </section>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary w-full" onClick={() => setFooterModal(null)}>Close Overlay</button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="brand" style={{ padding: '0 0.5rem', marginBottom: '1rem' }}>
          <Briefcase className="brand-icon" size={28} />
          <span>ZenJob</span>
        </div>
        {/* USER PROFILE SECTION */}
        {user && (
          <div className="sidebar-profile">
            <div className="profile-avatar">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <User size={20} />)}
            </div>
            <div className="profile-info">
              <div className="profile-name">
                {user.displayName || 'Collector User'}
              </div>
              <div className="profile-email">
                {user.email}
              </div>
            </div>
          </div>
        )}
        <nav className="sidebar-nav">
          <div className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
            <Layers className="icon" size={20} />
            <span>Dashboard</span>
          </div>
          <div className={`nav-item ${activeSection === 'extractor' ? 'active' : ''}`} onClick={() => setActiveSection('extractor')}>
            <Sparkles className="icon" size={20} />
            <span>AI Extractor</span>
          </div>
          <div className={`nav-item ${activeSection === 'manual' ? 'active' : ''}`} onClick={startManualAdd}>
            <Plus className="icon" size={20} />
            <span>Add Manually</span>
          </div>
          <div className={`nav-item ${activeSection === 'resumes' ? 'active' : ''}`} onClick={() => { setActiveSection('resumes'); fetchResumes(); }}>
            <FileText className="icon" size={20} />
            <span>My Resumes</span>
          </div>
          <div className={`nav-item ${activeSection === 'about' ? 'active' : ''}`} onClick={() => setActiveSection('about')}>
            <Info className="icon" size={20} />
            <span>About</span>
          </div>
          <div style={{ flex: 1 }}></div>
          <div className="nav-item logout-item" onClick={() => { setShowLanding(true); signOut(auth); }}>
            <LogOut className="icon" size={20} />
            <span>Sign Out</span>
          </div>
          <div className="nav-item theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="icon" size={20} /> : <Moon className="icon" size={20} />}
            <span>{theme === 'dark' ? 'Day Mode' : 'Night Mode'}</span>
          </div>
        </nav>
      </aside>
      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* SECTION: EXTRACTOR */}
        {activeSection === 'extractor' && (
          <section className="upload-grid fade-in">
            {/* Left Side: Upload Poster */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="form-title" style={{ marginBottom: 0 }}>
                  {inputType === 'image' ? <UploadCloud size={22} style={{ color: '#6366f1' }} /> : inputType === 'text' ? <FileText size={22} style={{ color: '#6366f1' }} /> : <Globe size={22} style={{ color: '#6366f1' }} />}
                  <span>{inputType === 'image' ? 'Upload Poster' : inputType === 'text' ? 'Paste Job Description' : 'Enter Job URL'}</span>
                </h2>
                <div className="type-toggle" style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.25rem', borderRadius: '8px' }}>
                  <button
                    className={`btn ${inputType === 'image' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: inputType === 'image' ? '' : 'transparent' }}
                    onClick={() => { setInputType('image'); setUploadStatus('idle'); }}
                  >
                    Image
                  </button>
                  <button
                    className={`btn ${inputType === 'text' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: inputType === 'text' ? '' : 'transparent' }}
                    onClick={() => { setInputType('text'); setUploadStatus('idle'); }}
                  >
                    Text
                  </button>
                  <button
                    className={`btn ${inputType === 'url' ? 'btn-primary' : ''}`}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', background: inputType === 'url' ? '' : 'transparent' }}
                    onClick={() => { setInputType('url'); setUploadStatus('idle'); }}
                  >
                    URL
                  </button>
                </div>
              </div>
              {inputType === 'image' ? (
                <div
                  className={`upload-zone ${dragActive ? 'dragging' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  {imagePreview ? (
                    <div className="preview-container">
                      <img src={imagePreview} alt="Job Poster Preview" className="preview-image" />
                      <button className="clear-btn" onClick={clearImage} title="Remove image">
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', width: '100%', height: '100%' }}>
                      <UploadCloud className="upload-icon" size={48} />
                      <span className="upload-title">Drag & drop job image</span>
                      <span className="upload-desc">Supports screenshot, PNG, JPG or WEBP job flyers</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: '1.5rem', pointerEvents: 'none' }}
                      >
                        Browse Files
                      </button>
                    </label>
                  )}
                  {/* Extractor Loader Screen */}
                  {(uploadStatus === 'uploading' || uploadStatus === 'extracting') && (
                    <div className="loader-overlay">
                      <div className="spinner"></div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill"></div>
                      </div>
                      <div className="loader-status">
                        {uploadStatus === 'uploading' ? 'Uploading screenshot...' : 'Gemini AI parsing details...'}
                      </div>
                    </div>
                  )}
                </div>
              ) : inputType === 'text' ? (
                <div className="text-input-zone" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px', position: 'relative' }}>
                  <textarea
                    className="form-control"
                    style={{ flexGrow: 1, resize: 'none', height: '100%', minHeight: '300px', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}
                    placeholder="Paste the raw job description text here..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  {/* Loader overlay for text */}
                  {(uploadStatus === 'uploading' || uploadStatus === 'extracting') && (
                    <div className="loader-overlay">
                      <div className="spinner"></div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill"></div>
                      </div>
                      <div className="loader-status">
                        Gemini AI parsing details...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="url-input-zone" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px', position: 'relative' }}>
                  <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                    <p style={{ color: '#9ca3af', fontSize: '0.9rem', textAlign: 'center' }}>Enter a public job posting URL (e.g. from Indeed, LinkedIn public page, or company career site) to automatically extract job details.</p>
                    <input
                      type="url"
                      className="form-control"
                      style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', fontSize: '1.05rem', textAlign: 'center' }}
                      placeholder="https://example.com/careers/job-id"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                    />
                  </div>
                  {/* Loader overlay for url */}
                  {(uploadStatus === 'uploading' || uploadStatus === 'extracting') && (
                    <div className="loader-overlay">
                      <div className="spinner"></div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill"></div>
                      </div>
                      <div className="loader-status">
                        Scraping page and parsing details...
                      </div>
                    </div>
                  )}
                </div>
              )}
              {inputType === 'image' && selectedFile && uploadStatus === 'idle' && (
                <button className="btn btn-primary" onClick={handleExtract} style={{ width: '100%', height: '3.2rem', fontSize: '1.05rem' }}>
                  <Sparkles size={18} />
                  <span>Extract Job Information</span>
                </button>
              )}
              {inputType === 'text' && textInput.trim() && uploadStatus === 'idle' && (
                <button className="btn btn-primary" onClick={handleExtractText} style={{ width: '100%', height: '3.2rem', fontSize: '1.05rem' }}>
                  <Sparkles size={18} />
                  <span>Extract Job Information</span>
                </button>
              )}
              {inputType === 'url' && urlInput.trim() && uploadStatus === 'idle' && (
                <button className="btn btn-primary" onClick={handleExtractUrl} style={{ width: '100%', height: '3.2rem', fontSize: '1.05rem' }}>
                  <Sparkles size={18} />
                  <span>Extract Job Information</span>
                </button>
              )}
              {uploadStatus === 'error' && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '1rem', color: '#fca5a5', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <strong>Extraction Error:</strong>
                  <div>{uploadError}</div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={inputType === 'image' ? handleExtract : inputType === 'text' ? handleExtractText : handleExtractUrl}>
                      Retry Parsing
                    </button>
                    <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} onClick={handleUpdateBackendUrl}>
                      Update URL
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Right Side: Edit Form Overlay */}
            <div className="glass-panel">
              <h2 className="form-title">
                <Edit3 size={22} style={{ color: '#8b5cf6' }} />
                <span>Extracted Information Review</span>
              </h2>
              {extractedData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                  {/* CIRCULAR PROGRESS BAR MATCH PERCENTAGE CARD */}
                  {extractedData.match_score !== undefined && extractedData.match_score !== null && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Circular Progress Bar */}
                        <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                          <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                            {/* Background circle */}
                            <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                            {/* Foreground progress circle */}
                            <circle cx="50" cy="50" r="40"
                              stroke={extractedData.match_score >= 80 ? '#34d399' : extractedData.match_score >= 50 ? '#fbbf24' : '#f87171'}
                              strokeWidth="8"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 40}
                              strokeDashoffset={2 * Math.PI * 40 * (1 - extractedData.match_score / 100)}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                            />
                          </svg>
                          {/* Percent label */}
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{extractedData.match_score}%</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Match</span>
                          </div>
                        </div>
                        {/* Quick Match stats */}
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={16} style={{ color: '#8b5cf6' }} />
                            <span>Resume Match Analysis</span>
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Evaluated against your currently active CV.
                          </p>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            {extractedData.matching_skills && extractedData.matching_skills.length > 0 && (
                              <span className="badge badge-selected" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                                {extractedData.matching_skills.length} Skills Matched
                              </span>
                            )}
                            {extractedData.missing_skills && extractedData.missing_skills.length > 0 && (
                              <span className="badge badge-rejected" style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {extractedData.missing_skills.length} Gaps Found
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Collapsible Match Analysis */}
                      <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setShowMatchDetails(!showMatchDetails)}
                          style={{ background: 'none', border: 'none', width: '100%', color: '#a5b4fc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0, outline: 'none' }}
                        >
                          <span style={{ fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Layers size={14} style={{ color: '#8b5cf6' }} />
                            <span>{showMatchDetails ? "Hide Match Analysis Report" : "View Match Analysis Report"}</span>
                          </span>
                          <span style={{ fontSize: '0.75rem' }}>{showMatchDetails ? "▲" : "▼"}</span>
                        </button>
                        {showMatchDetails && (
                          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            {/* Matching Skills */}
                            <div>
                              <h5 style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Matching Skills</h5>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {extractedData.matching_skills && extractedData.matching_skills.length > 0 ? (
                                  extractedData.matching_skills.map(s => <span key={s} className="badge-skill-sm" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.2)', fontSize: '0.7rem' }}>{s}</span>)
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>None detected</span>
                                )}
                              </div>
                            </div>
                            {/* Missing Skills */}
                            <div>
                              <h5 style={{ color: '#fca5a5', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Gaps / Missing Skills</h5>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {extractedData.missing_skills && extractedData.missing_skills.length > 0 ? (
                                  extractedData.missing_skills.map(s => <span key={s} className="badge-skill-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.7rem' }}>{s}</span>)
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Perfect match (none missing)</span>
                                )}
                              </div>
                            </div>
                            {/* Suggestions */}
                            <div style={{ gridColumn: 'span 2' }}>
                              <h5 style={{ color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Improvement Suggestions</h5>
                              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {extractedData.suggestions && extractedData.suggestions.length > 0 ? (
                                  extractedData.suggestions.map((s, idx) => <li key={idx}>{s}</li>)
                                ) : (
                                  <li>No suggestions available. Perfect match!</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <form onSubmit={handleSaveJob} className="form-grid">
                    <div className="form-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="e.g. Google, TechLabs"
                        value={editedData.company_name}
                        onChange={e => setEditedData({ ...editedData, company_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Job Role / Title</label>
                      <input
                        type="text"
                        required
                        className="form-control"
                        placeholder="e.g. React Developer, HR Executive"
                        value={editedData.job_role}
                        onChange={e => setEditedData({ ...editedData, job_role: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="hr@company.com"
                        value={editedData.email}
                        onChange={e => setEditedData({ ...editedData, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+1 (555) 0199"
                        value={editedData.phone}
                        onChange={e => setEditedData({ ...editedData, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. San Francisco, New Delhi"
                        value={editedData.location}
                        onChange={e => setEditedData({ ...editedData, location: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Job Type</label>
                      <select
                        className="form-control"
                        value={editedData.job_type}
                        onChange={e => setEditedData({ ...editedData, job_type: e.target.value })}
                      >
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Internship">Internship</option>
                        <option value="Contract">Contract</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Work Mode</label>
                      <select
                        className="form-control"
                        value={editedData.work_mode}
                        onChange={e => setEditedData({ ...editedData, work_mode: e.target.value })}
                      >
                        <option value="Remote">Remote</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="On-site">On-site</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Application Status</label>
                      <select
                        className="form-control"
                        value={editedData.application_status}
                        onChange={e => setEditedData({ ...editedData, application_status: e.target.value })}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Test Process">Test Process</option>
                        <option value="Screening">Screening</option>
                        <option value="Pending response">Pending response</option>
                        <option value="Rejected">Rejected</option>
                        <option value="Selected">Selected</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Experience Required</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 2+ years, Freshers welcome"
                        value={editedData.experience_required}
                        onChange={e => setEditedData({ ...editedData, experience_required: e.target.value })}
                      />
                    </div>
                    <div className="form-group span-2">
                      <label>Application Website / Link</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://jobs.company.com/apply"
                        value={editedData.application_link}
                        onChange={e => setEditedData({ ...editedData, application_link: e.target.value })}
                      />
                    </div>
                    <div className="form-group span-2">
                      <label>Skills Required (Press Enter to add)</label>
                      <div className="skills-input-container">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. React, Python"
                          value={newSkillInput}
                          onChange={e => setNewSkillInput(e.target.value)}
                          onKeyDown={handleSkillKeyDown}
                        />
                        <button type="button" className="btn btn-secondary" onClick={addSkill}>
                          <Plus size={18} />
                        </button>
                      </div>
                      <div className="skills-tags">
                        {editedData.skills.map(skill => (
                          <span key={skill} className="skill-tag">
                            <span>{skill}</span>
                            <button type="button" className="remove-tag-btn" onClick={() => removeSkill(skill)}>
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="form-group span-2">
                      <label>Additional Notes / Summary</label>
                      <textarea
                        rows="3"
                        className="form-control"
                        placeholder="Add any extra job requirements or details..."
                        value={editedData.additional_notes}
                        onChange={e => setEditedData({ ...editedData, additional_notes: e.target.value })}
                      />
                    </div>
                    <div className="span-2" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <button type="submit" disabled={isSaving} className="btn btn-success" style={{ flexGrow: 2, height: '3rem' }}>
                        <Check size={18} />
                        <span>{isSaving ? "Saving..." : "Save to Dashboard"}</span>
                      </button>
                      {isEditing && (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleAnalyzeMatch(editedData.id)}
                          disabled={isAnalyzing}
                          style={{ flexGrow: 1, height: '3rem' }}
                        >
                          {isAnalyzing ? <RefreshCw className="spin" size={18} /> : <Sparkles size={18} />}
                          <span>Match Analysis</span>
                        </button>
                      )}
                      <button type="button" className="btn btn-secondary" onClick={clearImage} style={{ flexGrow: 1, height: '3rem' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#6b7280', textAlign: 'center' }}>
                  <Sparkles size={40} style={{ color: 'rgba(139, 92, 246, 0.3)', marginBottom: '1rem' }} />
                  <div style={{ fontWeight: 500, fontSize: '1.05rem', color: '#9ca3af' }}>Ready for parsing</div>
                  <div style={{ fontSize: '0.85rem', maxWidth: '280px', marginTop: '0.25rem' }}>
                    Upload an image or paste text on the left and click "Extract" to load structural parsing details.
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* SECTION: MANUAL ENTRY */}
        {activeSection === 'manual' && (
          <section className="fade-in">
            <div className="glass-panel" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
                <Plus size={24} style={{ color: '#8b5cf6' }} />
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Manual Job Entry</h2>
              </div>
              <form className="form-grid" onSubmit={handleSaveJob}>
                {/* Form fields same as extractor but shown directly */}
                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Google, Waymo"
                    value={editedData.company_name}
                    onChange={e => setEditedData({ ...editedData, company_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Job Role / Title</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Frontend Engineer"
                    value={editedData.job_role}
                    onChange={e => setEditedData({ ...editedData, job_role: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="hr@company.com"
                    value={editedData.email}
                    onChange={e => setEditedData({ ...editedData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+1 234 567 890"
                    value={editedData.phone}
                    onChange={e => setEditedData({ ...editedData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. San Francisco, Remote"
                    value={editedData.location}
                    onChange={e => setEditedData({ ...editedData, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Job Type</label>
                  <select
                    className="form-control"
                    value={editedData.job_type}
                    onChange={e => setEditedData({ ...editedData, job_type: e.target.value })}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Work Mode</label>
                  <select
                    className="form-control"
                    value={editedData.work_mode}
                    onChange={e => setEditedData({ ...editedData, work_mode: e.target.value })}
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Application Status</label>
                  <select
                    className="form-control"
                    value={editedData.application_status}
                    onChange={e => setEditedData({ ...editedData, application_status: e.target.value })}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Test Process">Test Process</option>
                    <option value="Screening">Screening</option>
                    <option value="Pending response">Pending response</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Selected">Selected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Experience Required</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 2+ years"
                    value={editedData.experience_required}
                    onChange={e => setEditedData({ ...editedData, experience_required: e.target.value })}
                  />
                </div>
                <div className="form-group span-2">
                  <label>Application Website / Link</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="https://jobs.company.com/apply"
                    value={editedData.application_link}
                    onChange={e => setEditedData({ ...editedData, application_link: e.target.value })}
                  />
                </div>
                <div className="form-group span-2">
                  <label>Skills Required (Enter to add)</label>
                  <div className="skills-input-container">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. React, Python"
                      value={newSkillInput}
                      onChange={e => setNewSkillInput(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                    />
                    <button type="button" className="btn btn-secondary" onClick={addSkill}>
                      <Plus size={18} />
                    </button>
                  </div>
                  <div className="skills-tags">
                    {editedData.skills.map(skill => (
                      <span key={skill} className="skill-tag">
                        <span>{skill}</span>
                        <button type="button" className="remove-tag-btn" onClick={() => removeSkill(skill)}>
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="form-group span-2">
                  <label>Additional Notes / Summary</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Add any extra job requirements..."
                    value={editedData.additional_notes}
                    onChange={e => setEditedData({ ...editedData, additional_notes: e.target.value })}
                  />
                </div>
                <div className="span-2" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" disabled={isSaving} className="btn btn-primary" style={{ flexGrow: 2, height: '3.5rem' }}>
                    <Check size={20} />
                    <span>{isSaving ? "Saving..." : "Save to Dashboard"}</span>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setActiveSection('dashboard')} style={{ flexGrow: 1, height: '3.5rem' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* SECTION: DASHBOARD */}
        {activeSection === 'dashboard' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            <div className="stats-grid">
              <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                <div className="stat-icon-wrapper"><Briefcase size={24} /></div>
                <div className="stat-content">
                  <h3>Total Collected</h3>
                  <p>{jobs.length}</p>
                </div>
              </div>
              <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                <div className="stat-icon-wrapper"><Globe size={24} /></div>
                <div className="stat-content">
                  <h3>Remote Jobs</h3>
                  <p>{jobs.filter(j => j.work_mode === 'Remote').length}</p>
                </div>
              </div>
              <div className="stat-card glass-panel" style={{ padding: '1.5rem', borderRadius: '20px' }}>
                <div className="stat-icon-wrapper"><Clock size={24} /></div>
                <div className="stat-content">
                  <h3>Recent Additions</h3>
                  <p>{jobs.filter(j => {
                    if (!j.extracted_at) return false;
                    const d = new Date(j.extracted_at);
                    const now = new Date();
                    return (now - d) < 7 * 24 * 60 * 60 * 1000;
                  }).length}</p>
                </div>
              </div>
            </div>
            {/* 3. COLLECTED APPLICATIONS DASHBOARD */}
            <section className="glass-panel">
              <div className="dashboard-header">
                <div>
                  <h2 className="dashboard-title">Extracted Job Postings</h2>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    List of all job applications collected from screenshots
                  </div>
                </div>
                <div className="dashboard-actions">
                  {/* Search Box */}
                  <div className="search-container">
                    <Search className="search-icon" size={18} />
                    <input
                      type="text"
                      className="form-control search-input"
                      placeholder="Search company, role, skills..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {/* Filters */}
                  <select
                    className="form-control filter-select"
                    value={filterWorkMode}
                    onChange={e => setFilterWorkMode(e.target.value)}
                  >
                    <option value="All">All Modes</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                  <select
                    className="form-control filter-select"
                    value={filterJobType}
                    onChange={e => setFilterJobType(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                  {jobs.length > 0 && (
                    <button className="btn btn-primary" onClick={handleExportExcel} style={{ padding: '0.75rem 1.25rem' }}>
                      <FileSpreadsheet size={18} />
                      <span>Export Excel</span>
                    </button>
                  )}
                </div>
              </div>
              {loadingJobs ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', gap: '1rem' }}>
                  <div className="spinner"></div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading jobs database...</div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="empty-state">
                  <Briefcase className="empty-icon" />
                  <div className="empty-title">No Job Postings Found</div>
                  <div className="empty-desc">
                    {jobs.length === 0
                      ? "You haven't uploaded or saved any job application screenshots yet. Upload one above!"
                      : "No job postings matched your current search filters."}
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="jobs-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Job Title</th>
                        <th>Location</th>
                        <th>Job Type</th>
                        <th>Work Mode</th>
                        <th>Required Skills</th>
                        <th>Contact Email</th>
                        <th>Status</th>
                        <th>Date Applied</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map(job => (
                        <tr key={job.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{job.company_name}</td>
                          <td>{job.job_role}</td>
                          <td>
                            {job.location ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <MapPin size={14} style={{ color: '#8b5cf6' }} />
                                <span>{job.location}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>{job.job_type}</td>
                          <td>
                            <span className={`badge badge-${(job.work_mode || 'Remote').toLowerCase().replace(' ', '')}`}>
                              {job.work_mode}
                            </span>
                          </td>
                          <td>
                            <div className="table-skills">
                              {Array.isArray(job.skills) && job.skills.slice(0, 3).map(skill => (
                                <span key={skill} className="badge-skill-sm">{skill}</span>
                              ))}
                              {Array.isArray(job.skills) && job.skills.length > 3 && (
                                <span className="badge-skill-sm" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc' }}>
                                  +{job.skills.length - 3} more
                                </span>
                              )}
                              {(!job.skills || job.skills.length === 0) && (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </div>
                          </td>
                          <td>
                            {job.email ? (
                              <a href={`mailto:${job.email}`} style={{ color: 'var(--text-link, #a5b4fc)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Mail size={14} />
                                <span>{job.email}</span>
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            <select
                              className={`badge`}
                              style={{
                                background: getStatusColors(job.application_status).bg,
                                color: getStatusColors(job.application_status).text,
                                border: `1px solid ${getStatusColors(job.application_status).text}40`,
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                              value={job.application_status || 'Applied'}
                              onChange={(e) => handleStatusChange(job, e.target.value)}
                            >
                              <option value="Applied" style={{ background: '#1f2937', color: 'white' }}>Applied</option>
                              <option value="Test Process" style={{ background: '#1f2937', color: 'white' }}>Test Process</option>
                              <option value="Screening" style={{ background: '#1f2937', color: 'white' }}>Screening</option>
                              <option value="Pending response" style={{ background: '#1f2937', color: 'white' }}>Pending response</option>
                              <option value="Rejected" style={{ background: '#1f2937', color: 'white' }}>Rejected</option>
                              <option value="Selected" style={{ background: '#1f2937', color: 'white' }}>Selected</option>
                            </select>
                          </td>
                          <td>
                            {job.extracted_at ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                                <Calendar size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                  {(() => {
                                    const d = new Date(job.extracted_at.replace(' ', 'T'));
                                    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                  })()}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem', borderRadius: '8px' }}
                                onClick={() => openEditModal(job)}
                                title="Edit Details"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem', borderRadius: '8px', color: '#f87171' }}
                                onClick={() => handleDeleteJob(job.id)}
                                title="Delete Posting"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
        {/* SECTION: ABOUT */}
        {activeSection === 'about' && (
          <div className="fade-in glass-panel" style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="icon-box" style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={32} />
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
                ZenJob
              </h1>
              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Your Cyber-Luxe Career Navigator</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-input)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Sparkles size={18} style={{ color: '#8b5cf6' }} />
                  AI-Powered Extraction
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Leverage advanced Gemini AI to instantly extract structured job details from screenshots, raw text, or URLs. No more manual data entry.
                </p>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-input)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Layers size={18} style={{ color: '#8b5cf6' }} />
                  Smart Resume Matching
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Automatically compare job descriptions against your uploaded resumes to determine skill fit, calculate match scores, and get actionable improvement tips.
                </p>
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(139, 92, 246, 0.2)', background: 'var(--bg-input)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Info size={20} style={{ color: '#8b5cf6' }} />
                How it Works
              </h3>
              <ul style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1.5rem' }}>
                <li><strong>1. Upload</strong>: Capture a job poster or paste a job link.</li>
                <li><strong>2. Analyze</strong>: Our server-side AI processes the data securely using stored environment keys.</li>
                <li><strong>3. Manage</strong>: Edit details, track statuses, and export your job hunting progress to Excel.</li>
                <li><strong>4. Match</strong>: Set an active CV and see how you stack up against requirements instantly.</li>
              </ul>
            </div>
          </div>
        )}
        {/* SECTION: MY RESUMES */}
        {activeSection === 'resumes' && (
          <section className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 className="dashboard-title" style={{ fontSize: '1.75rem', margin: 0 }}>
                  My Resumes
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  Upload and manage your CVs/resumes. Set your active resume for job application tracking.
                </p>
              </div>
            </div>
            <div className="resume-grid">
              {/* Left Panel: Upload Zone */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
                  <UploadCloud size={20} style={{ color: '#8b5cf6' }} />
                  <span>Upload Resume</span>
                </h3>
                <div
                  className={`upload-zone ${resumeDragActive ? 'dragging' : ''}`}
                  onDragEnter={handleResumeDrag}
                  onDragOver={handleResumeDrag}
                  onDragLeave={handleResumeDrag}
                  onDrop={handleResumeDrop}
                  style={{ minHeight: '220px', border: resumeDragActive ? '2px dashed #8b5cf6' : '1px dashed var(--border-glass)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', position: 'relative' }}
                >
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%', height: '100%', padding: '2rem' }}>
                    <FileText className="upload-icon" size={44} style={{ color: '#6b7280', marginBottom: '1rem' }} />
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', textAlign: 'center' }}>Drag & drop your resume file</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', textAlign: 'center' }}>Supports PDF, DOC, or DOCX formats</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Max size: 5MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={handleResumeFileSelect}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ marginTop: '1.25rem', pointerEvents: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    >
                      Browse Files
                    </button>
                  </label>
                  {/* Uploading loader */}
                  {resumeUploadStatus === 'uploading' && (
                    <div className="loader-overlay" style={{ borderRadius: '12px' }}>
                      <div className="spinner"></div>
                      <div className="loader-status" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                        Uploading resume file...
                      </div>
                    </div>
                  )}
                </div>
                {resumeUploadStatus === 'completed' && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '0.75rem', color: '#a7f3d0', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Check size={16} style={{ color: '#34d399' }} />
                    <span>Resume uploaded successfully!</span>
                  </div>
                )}
                {resumeUploadStatus === 'error' && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '0.75rem', color: '#fca5a5', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <strong>Upload Error:</strong>
                    <div>{resumeUploadError}</div>
                  </div>
                )}
              </div>
              {/* Right Panel: Resumes List */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
                  <Layers size={20} style={{ color: '#8b5cf6' }} />
                  <span>Uploaded Resumes</span>
                </h3>
                {loadingResumes ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                    <div className="spinner"></div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading resumes...</div>
                  </div>
                ) : resumes.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', textAlign: 'center', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
                    <FileText size={36} style={{ color: 'rgba(156, 163, 175, 0.2)', marginBottom: '0.75rem' }} />
                    <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'var(--text-primary)' }}>No Resumes Uploaded Yet</div>
                    <div style={{ fontSize: '0.8rem', maxWidth: '280px', marginTop: '0.25rem' }}>
                      Drag and drop a PDF or Word document on the left to add your first resume.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {resumes.map(resume => {
                      const fileSizeFormatted = resume.file_size > 1024 * 1024
                        ? `${(resume.file_size / (1024 * 1024)).toFixed(2)} MB`
                        : `${(resume.file_size / 1024).toFixed(1)} KB`;
                      const uploadDate = new Date(resume.uploaded_at ? resume.uploaded_at.replace(" ", "T") : new Date()).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      });
                      return (
                        <div
                          key={resume.id}
                          className="glass-panel"
                          style={{
                            padding: '1.25rem',
                            borderRadius: '12px',
                            border: resume.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-glass)',
                            background: resume.is_active ? 'rgba(16, 185, 129, 0.02)' : 'rgba(255,255,255,0.01)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              background: resume.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: resume.is_active ? '#34d399' : '#a5b4fc',
                              flexShrink: 0
                            }}>
                              <FileText size={20} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                fontSize: '0.95rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '350px'
                              }} title={resume.filename}>
                                {resume.filename}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', gap: '0.75rem' }}>
                                <span>{fileSizeFormatted}</span>
                                <span>•</span>
                                <span>{uploadDate}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                            {resume.is_active ? (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                color: '#34d399',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 8px #34d399' }}></span>
                                Active CV
                              </span>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                onClick={() => handleMakeResumeActive(resume.id)}
                              >
                                Make Active
                              </button>
                            )}
                            <a
                              href={`${BACKEND_URL}${resume.filepath}`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary btn-icon-only"
                              title="View Document"
                              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Eye size={15} />
                            </a>
                            <a
                              href={`${BACKEND_URL}${resume.filepath}`}
                              download={resume.filename}
                              className="btn btn-secondary btn-icon-only"
                              title="Download File"
                              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Download size={15} />
                            </a>
                            <button
                              className="btn btn-danger btn-icon-only"
                              title="Delete Resume"
                              onClick={() => handleDeleteResume(resume.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )
        }
        <footer style={{ padding: '3rem 2rem', borderTop: '1px solid var(--border-glass)', marginTop: '4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Briefcase size={20} style={{ color: '#818cf8' }} />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>ZenJob</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span>v2.1.0-luxe</span>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Status</span>
                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
                  Uplink Active
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem' }}>
              <a href="https://x.com/harshvardhant42" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Twitter</a>
              <a href="https://www.linkedin.com/in/harsh-vardhantiwari/" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>LinkedIn</a>
              <a href="https://github.com/Harshvardhan210/MagicCounter" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>GitHub</a>

              <span style={{ opacity: 0.3 }}>|</span>
              {['privacy', 'terms'].map(key => (
                <button key={key} onClick={() => setFooterModal(key)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', padding: 0, textTransform: 'capitalize', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.target.style.color = '#a5b4fc'}
                  onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                >{key.charAt(0).toUpperCase() + key.slice(1)}</button>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '2.5rem', opacity: 0.5 }}>
            © {new Date().getFullYear()} ZenJob. Built for High-Performance Career Tracking.
          </div>
        </footer>
      </main >
      {/* 5. JOB DETAILS MODAL */}
      {
        showDetailModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
              <div className="modal-header">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <Briefcase size={20} style={{ color: '#6366f1' }} />
                  <span>Job Specification Details</span>
                </h3>
                <button className="clear-btn" style={{ position: 'static' }} onClick={() => setShowDetailModal(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body job-detail-layout">
                {showDetailModal.image_path && (
                  <div className="detail-img-container">
                    <img
                      src={`${BACKEND_URL}${showDetailModal.image_path}`}
                      alt="Original Job Advertisement Poster"
                      className="detail-img"
                    />
                  </div>
                )}
                <div className="detail-grid">
                  {showDetailModal.match_score !== undefined && showDetailModal.match_score !== null && (
                    <div className="detail-item" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255, 255, 255, 0.015)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '0.75rem 1rem' }}>
                      <div style={{ position: 'relative', width: '50px', height: '50px', flexShrink: 0 }}>
                        <svg width="50" height="50" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="transparent" />
                          <circle cx="50" cy="50" r="40"
                            stroke={showDetailModal.match_score >= 80 ? '#34d399' : showDetailModal.match_score >= 50 ? '#fbbf24' : '#f87171'}
                            strokeWidth="12"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - showDetailModal.match_score / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>{showDetailModal.match_score}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="detail-label" style={{ margin: 0 }}>Resume compatibility match</span>
                        <span className="detail-val" style={{ fontSize: '0.85rem', color: '#c7d2fe', fontWeight: 600 }}>This job matches {showDetailModal.match_score}% of your active CV's skill profile.</span>
                      </div>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">Company</span>
                    <span className="detail-val" style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>{showDetailModal.company_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Job Role</span>
                    <span className="detail-val" style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>{showDetailModal.job_role}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-val">{showDetailModal.location || 'Not Specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Work Mode & Type</span>
                    <span className="detail-val">{showDetailModal.job_type} — {showDetailModal.work_mode}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Application Status</span>
                    <span className="detail-val" style={{
                      fontWeight: 600,
                      color: getStatusColors(showDetailModal.application_status).text
                    }}>{showDetailModal.application_status || 'Applied'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Experience Required</span>
                    <span className="detail-val">{showDetailModal.experience_required || 'Not Specified'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Date Collected</span>
                    <span className="detail-val" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} style={{ color: '#9ca3af' }} />
                      <span>{new Date(showDetailModal.extracted_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-val">
                      {showDetailModal.email ? (
                        <a href={`mailto:${showDetailModal.email}`} style={{ color: '#a5b4fc', textDecoration: 'none' }}>
                          {showDetailModal.email}
                        </a>
                      ) : 'Not Listed'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone contact</span>
                    <span className="detail-val">{showDetailModal.phone || 'Not Listed'}</span>
                  </div>
                  {showDetailModal.application_link && (
                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                      <span className="detail-label">Application Website / Link</span>
                      <span className="detail-val">
                        <a
                          href={showDetailModal.application_link.startsWith('http') ? showDetailModal.application_link : `https://${showDetailModal.application_link}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <Globe size={14} />
                          <span style={{ wordBreak: 'break-all' }}>{showDetailModal.application_link}</span>
                        </a>
                      </span>
                    </div>
                  )}
                  <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                    <span className="detail-label">Required Skills</span>
                    <div className="skills-tags" style={{ marginTop: '0.25rem' }}>
                      {Array.isArray(showDetailModal.skills) && showDetailModal.skills.map(skill => (
                        <span key={skill} className="skill-tag" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#d1d5db' }}>{skill}</span>
                      ))}
                      {(!showDetailModal.skills || showDetailModal.skills.length === 0) && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>None Listed</span>
                      )}
                    </div>
                  </div>
                  {showDetailModal.additional_notes && (
                    <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                      <span className="detail-label">Additional notes / Summary</span>
                      <span className="detail-val" style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', whiteSpace: 'pre-line', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {showDetailModal.additional_notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(null)}>
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )
      }
      <MatchAnalysisModal analysis={activeAnalysis} onClose={() => setActiveAnalysis(null)} />
    </div>
  );
}
export default App;

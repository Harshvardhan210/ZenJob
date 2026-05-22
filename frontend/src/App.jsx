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
  LogOut,
  User
} from 'lucide-react';

const BACKEND_URL = 'http://127.0.0.1:8000';

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
  const [apiKey, setApiKey] = useState(() => {
    const saved = localStorage.getItem('gemini_api_key');
    return (saved && saved !== 'undefined' && saved !== 'null') ? saved : '';
  });
  const [backendUrl, setBackendUrl] = useState(() => {
    const saved = localStorage.getItem('backend_url');
    if (saved && saved !== 'undefined' && saved !== 'null') return saved;
    if (window.location.origin.startsWith('capacitor://') || window.location.origin.startsWith('http://localhost:80')) {
      return 'http://10.0.2.2:8000';
    }
    return 'http://127.0.0.1:8000';
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorkMode, setFilterWorkMode] = useState('All');
  const [filterJobType, setFilterJobType] = useState('All');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [tempBackendUrl, setTempBackendUrl] = useState(backendUrl);

  // --- LIFECYCLE ---

  const resetAppState = () => {
    setJobs([]);
    setResumes([]);
    setExtractedData(null);
    setUploadStatus('idle');
    setResumeUploadStatus('idle');
    setImagePreview(null);
    setSavedImagePath('');
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

  useEffect(() => {
    if (activeSection === 'settings') {
      setTempApiKey(apiKey);
      setTempBackendUrl(backendUrl);
      setTestResult(null);
    }
  }, [activeSection, apiKey, backendUrl]);

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

  const checkApiKey = () => {
    if (!apiKey) {
      showToast("Gemini API Key is required for AI features. Redirecting to settings...", "warning");
      setActiveSection('settings');
      return false;
    }
    return true;
  };

  const handleTestApiKey = async () => {
    if (!tempApiKey.trim()) {
      setTestResult({ success: false, message: "Please enter an API Key first." });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const response = await fetch(`${tempBackendUrl}/api/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gemini-Key': tempApiKey
        }
      });
      const data = await response.json();
      if (response.ok && data.valid) {
        setTestResult({ success: true, message: data.message || "API Key is valid and active!" });
      } else {
        setTestResult({ success: false, message: data.detail || "Validation failed." });
      }
    } catch (error) {
      setTestResult({ success: false, message: "Could not connect to validation server." });
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleExtract = async () => {
    if (!checkApiKey()) return;

    setUploadStatus('uploading');
    setUploadError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadStatus('extracting');

      const authHeaders = await getAuthHeaders();
      const headers = { ...authHeaders };
      headers['X-Gemini-Key'] = apiKey;

      const response = await fetch(`${BACKEND_URL}/api/extract`, {
        method: 'POST',
        headers: headers,
        body: formData
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
      setUploadError(error.message || "An unexpected error occurred during OCR extraction.");
    }
  };

  const handleExtractText = async () => {
    if (!textInput.trim()) return;
    if (!checkApiKey()) return;

    setUploadError('');
    try {
      setUploadStatus('extracting');

      const authHeaders = await getAuthHeaders();
      const headers = { 'Content-Type': 'application/json', ...authHeaders };
      headers['X-Gemini-Key'] = apiKey;

      const response = await fetch(`${BACKEND_URL}/api/extract-text`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ text: textInput })
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
      setUploadError(error.message || "An unexpected error occurred during text extraction.");
    }
  };

  const handleExtractUrl = async () => {
    if (!urlInput.trim()) return;
    if (!checkApiKey()) return;

    setUploadError('');
    try {
      setUploadStatus('extracting');

      const authHeaders = await getAuthHeaders();
      const headers = { 'Content-Type': 'application/json', ...authHeaders };
      headers['X-Gemini-Key'] = apiKey;

      const response = await fetch(`${BACKEND_URL}/api/extract-url`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ url: urlInput })
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
      setUploadError(error.message || "An unexpected error occurred during URL extraction.");
    }
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const authHeaders = await getAuthHeaders();
      const url = `${BACKEND_URL}/api/jobs?image_path=${encodeURIComponent(savedImagePath)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(editedData)
      });

      if (!response.ok) {
        throw new Error("Failed to save job application to dashboard");
      }

      // Reset extraction pane
      setSelectedFile(null);
      setImagePreview(null);
      setExtractedData(null);
      setUploadStatus('idle');

      // Refresh list
      fetchJobs();
    } catch (error) {
      showToast("Error: " + error.message, 'error');
    } finally {
      setIsSaving(false);
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      // Refresh list
      fetchResumes();
      setSelectedResumeFile(null);
      setResumeUploadStatus('completed');
      setTimeout(() => setResumeUploadStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setResumeUploadStatus('error');
      setResumeUploadError(error.message || "An unexpected error occurred during resume upload.");
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
        showToast('Resume set as active', 'success');
        fetchResumes();
      } else {
        const err = await response.json();
        showToast('Error: ' + err.detail, 'error');
      }
    } catch (error) {
      showToast('Network error: Could not activate resume', 'error');
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
          fetchResumes();
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

  const saveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', tempApiKey);
    setApiKey(tempApiKey);
    setShowSettingsModal(false);
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
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }
    return <AuthScreen setIsRegistering={setIsRegistering} />;
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

            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem', letterSpacing: '-0.02em' }}>JobCollector</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
              Your cyber-luxe portal for AI-powered job application tracking, resume matching, and automated insight extraction.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left', marginBottom: '2.5rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.5rem' }}>Quick Setup</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Gemini API Key (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div className="input-group" style={{ flex: 1, margin: 0 }}>
                    <div className="input-icon"><Settings size={16} /></div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Paste your key here..."
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      if (!tempApiKey.trim()) { showToast("Please enter an API Key first", "warning"); return; }
                      setIsTestingKey(true);
                      try {
                        const res = await fetch(`${BACKEND_URL}/api/validate-key`, { method: 'POST', headers: { 'X-Gemini-Key': tempApiKey } });
                        const data = await res.json();
                        if (res.ok && data.valid) {
                          setApiKey(tempApiKey);
                          localStorage.setItem('gemini_api_key', tempApiKey);
                          showToast("API Key validated and saved successfully!", "success");
                        } else {
                          showToast(data.detail || "Invalid API Key", "error");
                        }
                      } catch (err) {
                        showToast("Connection failed", "error");
                      } finally {
                        setIsTestingKey(false);
                      }
                    }}
                    disabled={isTestingKey}
                  >
                    {isTestingKey ? <RefreshCw size={18} className="spin" /> : <Check size={18} />}
                    Verify
                  </button>
                </div>
                {apiKey && <div style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}><Check size={12} /> Active Key Detected</div>}
              </div>
            </div>

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
    <div className="app-wrapper">
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
                <div style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem', marginBottom: '0.35rem' }}>Confirm Action</div>
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
          <div className={`nav-item ${activeSection === 'resumes' ? 'active' : ''}`} onClick={() => { setActiveSection('resumes'); fetchResumes(); }}>
            <FileText className="icon" size={20} />
            <span>My Resumes</span>
          </div>
          <div className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => { setTempApiKey(apiKey); setActiveSection('settings'); }}>
            <Settings className="icon" size={20} />
            <span>Settings</span>
          </div>

          <div style={{ flex: 1 }}></div>

          {/* AI STATUS BADGE */}
          <div className={`ai-status-badge ${apiKey ? 'active' : 'inactive'}`}>
            <div className="status-dot-wrapper">
              <div className="status-dot"></div>
              <span className="status-label">AI Engine</span>
            </div>
            <div className="status-text">
              {apiKey ? 'API Key Active' : 'Key Required'}
            </div>
          </div>

          <div className="nav-item" onClick={() => { setShowLanding(true); signOut(auth); }} style={{ color: '#f87171' }}>
            <LogOut className="icon" size={20} />
            <span>Sign Out</span>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">

        {/* API KEY WARNING BANNER */}
        {!apiKey && (
          <div className="glass-panel" style={{ borderLeft: '4px solid #8b5cf6', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Info style={{ color: '#8b5cf6' }} size={20} />
              <div style={{ fontSize: '0.9rem', color: '#d1d5db' }}>
                <strong>API Key Required</strong>: Paste your Gemini API key in settings to unlock automatic AI layout analysis and information parsing.
              </div>
            </div>
            <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => { setTempApiKey(apiKey); setActiveSection('settings'); }}>
              Set Key Now
            </button>
          </div>
        )}

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
                  <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', alignSelf: 'flex-start' }} onClick={inputType === 'image' ? handleExtract : inputType === 'text' ? handleExtractText : handleExtractUrl}>
                    Retry Parsing
                  </button>
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
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{extractedData.match_score}%</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Match</span>
                          </div>
                        </div>

                        {/* Quick Match stats */}
                        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                      <button type="submit" disabled={isSaving} className="btn btn-success" style={{ flexGrow: 1, height: '3rem' }}>
                        <Check size={18} />
                        <span>{isSaving ? "Saving..." : "Save to Dashboard"}</span>
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={clearImage}>
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
                        <th>Match</th>
                        <th>Status</th>
                        <th>Date Applied</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.map(job => (
                        <tr key={job.id}>
                          <td style={{ fontWeight: 600, color: 'white' }}>{job.company_name}</td>
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
                              <a href={`mailto:${job.email}`} style={{ color: '#a5b4fc', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <Mail size={14} />
                                <span>{job.email}</span>
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td>
                            {job.match_score !== undefined && job.match_score !== null ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  background: job.match_score >= 80 ? '#34d399' : job.match_score >= 50 ? '#fbbf24' : '#f87171',
                                  display: 'inline-block',
                                  boxShadow: `0 0 6px ${job.match_score >= 80 ? '#34d399' : job.match_score >= 50 ? '#fbbf24' : '#f87171'}`
                                }}></span>
                                <span style={{ fontWeight: 600, color: 'white', fontSize: '0.85rem' }}>{job.match_score}%</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>
                          <td>
                            {job.extracted_at ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                                <Calendar size={13} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
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
                            <div className="action-cell">
                              <button
                                className="btn btn-secondary btn-icon-only"
                                title="View Details"
                                onClick={() => setShowDetailModal(job)}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                className="btn btn-danger btn-icon-only"
                                title="Delete Job"
                                onClick={() => handleDeleteJob(job.id)}
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

        {/* SECTION: SETTINGS */}
        {activeSection === 'settings' && (
          <div className="fade-in glass-panel" style={{ maxWidth: '600px', margin: '0 auto', width: '100%', padding: '2rem' }}>
            <h2 className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>
              <Settings size={26} style={{ color: '#8b5cf6' }} />
              <span>API Settings</span>
            </h2>

            <form onSubmit={(e) => {
              e.preventDefault();
              localStorage.setItem('gemini_api_key', tempApiKey);
              setApiKey(tempApiKey);
              localStorage.setItem('backend_url', tempBackendUrl);
              setBackendUrl(tempBackendUrl);
              alert("Settings saved successfully!");
            }}>
              <div className="form-group" style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#d1d5db' }}>Google Gemini API Key</label>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    placeholder="Enter your AI Gemini API Key (e.g. AIzaSy...)"
                    value={tempApiKey}
                    onChange={e => setTempApiKey(e.target.value)}
                    style={{ width: '100%', paddingRight: '3rem', fontSize: '0.95rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      outline: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.25rem'
                    }}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>

                <div className="settings-info" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  The key will be stored securely in your browser's local storage and used directly to communicate with the Google Gemini API for OCR scanning and Resume compatibility matching.
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                <label style={{ fontSize: '1rem', fontWeight: 600, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={18} /> How to get a Gemini API Key
                </label>
                <ol style={{ margin: 0, paddingLeft: '1.5rem', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>Google AI Studio</a>.</li>
                  <li>Sign in with your Google account.</li>
                  <li>Click on <strong>"Create API key"</strong>.</li>
                  <li>Copy the key and paste it into the field above, then click <strong>Save Changes</strong>.</li>
                </ol>
              </div>

              {/* Key validation feedback */}
              {testResult && (
                <div className="fade-in" style={{
                  marginBottom: '2rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: `1px solid ${testResult.success ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  background: testResult.success ? 'rgba(52, 211, 153, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                  color: testResult.success ? '#34d399' : '#fca5a5',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'start',
                  gap: '0.5rem'
                }}>
                  {testResult.success ? <Check size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} /> : <Info size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />}
                  <div>
                    <strong style={{ display: 'block', fontWeight: 700, marginBottom: '0.15rem' }}>
                      {testResult.success ? 'Validation Successful' : 'Validation Failed'}
                    </strong>
                    <span>{testResult.message}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  disabled={isTestingKey}
                  onClick={handleTestApiKey}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '2.8rem' }}
                >
                  {isTestingKey ? (
                    <>
                      <div className="spinner-sm" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                      <span>Testing Key...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ flexGrow: 1, height: '2.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Check size={16} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SECTION: MY RESUMES */}
        {activeSection === 'resumes' && (
          <section className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
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
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'white' }}>
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
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e5e7eb', textAlign: 'center' }}>Drag & drop your resume file</span>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.25rem', textAlign: 'center' }}>Supports PDF, DOC, or DOCX formats</span>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>Max size: 5MB</span>
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
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'white' }}>
                  <Layers size={20} style={{ color: '#8b5cf6' }} />
                  <span>Uploaded Resumes</span>
                </h3>

                {loadingResumes ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                    <div className="spinner"></div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading resumes...</div>
                  </div>
                ) : resumes.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: '#6b7280', textAlign: 'center', border: '1px dashed var(--border-glass)', borderRadius: '12px' }}>
                    <FileText size={36} style={{ color: 'rgba(156, 163, 175, 0.2)', marginBottom: '0.75rem' }} />
                    <div style={{ fontWeight: 500, fontSize: '0.95rem', color: '#9ca3af' }}>No Resumes Uploaded Yet</div>
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
                                color: 'white',
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
        )}
      </main>

      {/* 5. JOB DETAILS MODAL */}
      {showDetailModal && (
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
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>{showDetailModal.match_score}%</span>
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
                  <span className="detail-val" style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{showDetailModal.company_name}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Job Role</span>
                  <span className="detail-val" style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>{showDetailModal.job_role}</span>
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
                    <span className="detail-val" style={{ background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', whiteSpace: 'pre-line', fontSize: '0.9rem', color: '#d1d5db', lineHeight: 1.5 }}>
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
      )}
    </div>
  );
}

export default App;

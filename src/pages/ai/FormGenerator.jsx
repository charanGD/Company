import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';
import Spinner from '../../components/ui/Spinner';
import {
  Wand2, Code2, Copy, Check, RefreshCw, FileCode, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const FALLBACK_FORM = `import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiPost } from '../api/client';
import toast from 'react-hot-toast';

export default function GrievanceForm() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    issueType: '',
    description: '',
    attachmentUrl: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const ISSUE_TYPES = [
    'Privacy Complaint',
    'Data Correction Request',
    'Data Deletion Request',
    'Consent Withdrawal',
    'Security Incident',
    'Other',
  ];

  function validate() {
    const e = {};
    if (!formData.name.trim()) e.name = 'Full name is required.';
    if (!formData.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) e.email = 'Invalid email format.';
    if (!formData.issueType) e.issueType = 'Please select an issue type.';
    if (!formData.description.trim()) e.description = 'Description is required.';
    else if (formData.description.length < 20) e.description = 'Description must be at least 20 characters.';
    else if (formData.description.length > 2000) e.description = 'Description must be under 2000 characters.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await apiPost('/api/tickets', {
        ...formData,
        isTest: false,
      });
      toast.success('Grievance submitted successfully!');
      setFormData({ name: '', email: '', issueType: '', description: '', attachmentUrl: '' });
    } catch (err) {
      console.error(err);
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8 glass-card space-y-6">
      <h2 className="text-2xl font-bold gradient-text">Submit a Grievance</h2>

      {/* Full Name */}
      <div className="form-group">
        <label className="form-label">Full Name *</label>
        <input
          id="grievance-name"
          className={\`form-input \${errors.name ? 'error' : ''}\`}
          placeholder="Your full name"
          value={formData.name}
          onChange={handleChange('name')}
        />
        {errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <input
          id="grievance-email"
          type="email"
          className={\`form-input \${errors.email ? 'error' : ''}\`}
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange('email')}
        />
        {errors.email && <p className="form-error">{errors.email}</p>}
      </div>

      {/* Issue Type */}
      <div className="form-group">
        <label className="form-label">Issue Type *</label>
        <select
          id="grievance-issue-type"
          className={\`form-select \${errors.issueType ? 'error' : ''}\`}
          value={formData.issueType}
          onChange={handleChange('issueType')}
        >
          <option value="">Select issue type…</option>
          {ISSUE_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {errors.issueType && <p className="form-error">{errors.issueType}</p>}
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">
          Description * ({formData.description.length}/2000)
        </label>
        <textarea
          id="grievance-description"
          className={\`form-textarea \${errors.description ? 'error' : ''}\`}
          rows={5}
          placeholder="Describe your privacy concern in detail…"
          value={formData.description}
          onChange={handleChange('description')}
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      {/* Attachment URL */}
      <div className="form-group">
        <label className="form-label">Attachment URL (optional)</label>
        <input
          id="grievance-attachment"
          type="url"
          className="form-input"
          placeholder="https://drive.google.com/..."
          value={formData.attachmentUrl}
          onChange={handleChange('attachmentUrl')}
        />
      </div>

      <button
        type="submit"
        id="grievance-submit"
        disabled={submitting}
        className="btn-primary w-full justify-center py-3"
      >
        {submitting ? 'Submitting…' : 'Submit Grievance'}
      </button>
    </form>
  );
}`;

export default function FormGenerator() {
  const [inputDesc, setInputDesc] = useState('');
  const [generated, setGenerated] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!inputDesc.trim()) {
      toast.error('Please describe your app or paste an existing component.');
      return;
    }
    setLoading(true);
    setGenerated('');

    try {
      if (!GEMINI_KEY) {
        await new Promise(r => setTimeout(r, 2000));
        setGenerated(FALLBACK_FORM);
        toast.success('Form generated! (simulated — add VITE_GEMINI_API_KEY for AI)');
        return;
      }

      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are a React developer specializing in DPDP Act privacy compliance.
Generate a complete, production-ready React grievance submission form component.

Requirements:
1. Use React functional component with hooks
2. Style with CSS classes (form-group, form-label, form-input, form-select, form-textarea, form-error, btn-primary — these are pre-defined)
3. Integrate with Firebase Firestore (import { db } from '../firebase')
4. Use useAuth hook (import { useAuth } from '../hooks/useAuth')
5. Fields: name, email, issueType (dropdown), description (textarea with 2000 char limit), attachmentUrl (optional)
6. Status default: "Open", assignedTo default: "DPO"
7. Validate all required fields with error messages
8. On success: show toast and reset form
9. Use react-hot-toast for notifications
10. DPDP issue types: Privacy Complaint, Data Correction Request, Data Deletion Request, Consent Withdrawal, Security Incident, Other

Context about the app:
${inputDesc}

Return ONLY the complete React component code, no markdown fences, no explanation. Start with imports.
`;

      const response = await model.generateContent(prompt);
      setGenerated(response.response.text().trim().replace(/^```[a-z]*\n?/, '').replace(/```$/, ''));
      toast.success('Grievance form generated!');
    } catch (err) {
      console.error(err);
      setGenerated(FALLBACK_FORM);
      toast('Generated with fallback template', { icon: '⚠️' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-violet-500/15 border border-violet-500/30">
              <Wand2 size={24} className="text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Form Generator</h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Describe your app and get a DPDP-compliant grievance form component instantly
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <FileCode size={18} className="text-violet-400" />
                App Description
              </h2>

              <textarea
                className="form-textarea font-mono text-sm"
                style={{ minHeight: '300px' }}
                placeholder={`Describe your app or paste an existing component...

Examples:
• "E-commerce platform selling electronics. Uses Firebase Auth and Firestore. Has user profiles and order history."
• Paste an existing React component to customize the form for your project's style
• "Healthcare data app with patient records. Needs HIPAA + DPDP compliant form with file upload."

The AI will generate a tailored grievance form with:
✓ All required DPDP fields
✓ Validation & error handling
✓ Firebase Firestore integration
✓ react-hot-toast notifications
✓ Accessible, responsive design`}
                value={inputDesc}
                onChange={e => setInputDesc(e.target.value)}
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)]">
                  {!GEMINI_KEY && <span className="text-amber-400">No API key — template will be generated</span>}
                </p>
                <button
                  className="btn-primary"
                  onClick={handleGenerate}
                  disabled={loading}
                  id="generate-form-btn"
                >
                  {loading ? <Spinner size={16} color="white" /> : <Sparkles size={16} />}
                  {loading ? 'Generating…' : 'Generate Form'}
                </button>
              </div>
            </div>

            {/* Output */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Code2 size={18} className="text-violet-400" />
                  Generated Component
                </h2>
                {generated && (
                  <button
                    onClick={handleCopy}
                    id="copy-generated-form"
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </button>
                )}
              </div>

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-16">
                  <Spinner size={36} />
                  <p className="text-sm text-[var(--text-muted)] mt-4">Generating your component…</p>
                </div>
              )}

              {!loading && !generated && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-[var(--text-muted)]">
                  <Wand2 size={48} className="mb-4 opacity-30" />
                  <p className="text-sm">Your generated React component<br />will appear here</p>
                </div>
              )}

              {!loading && generated && (
                <div className="code-block" style={{ maxHeight: '520px', overflowY: 'auto', fontSize: '12px' }}>
                  {generated}
                </div>
              )}
            </div>
          </div>

          {/* Usage guide */}
          <div className="glass-card p-6 mt-6">
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
              <RefreshCw size={14} className="text-violet-400" /> How to use the generated component
            </h3>
            <ol className="space-y-2 text-sm text-[var(--text-muted)]">
              <li><span className="text-[var(--accent)] font-semibold">1.</span> Copy the generated code above.</li>
              <li><span className="text-[var(--accent)] font-semibold">2.</span> Save it as <code className="text-emerald-400 bg-[var(--bg-primary)] px-1 rounded">src/pages/SubmitGrievance.jsx</code> in your project.</li>
              <li><span className="text-[var(--accent)] font-semibold">3.</span> Ensure <code className="text-emerald-400 bg-[var(--bg-primary)] px-1 rounded">firebase.js</code> exports <code className="text-emerald-400 bg-[var(--bg-primary)] px-1 rounded">db</code> from Firestore.</li>
              <li><span className="text-[var(--accent)] font-semibold">4.</span> Add the route <code className="text-emerald-400 bg-[var(--bg-primary)] px-1 rounded">/submit-grievance</code> in App.jsx wrapped with PrivateRoute.</li>
              <li><span className="text-[var(--accent)] font-semibold">5.</span> Enable <code className="text-emerald-400 bg-[var(--bg-primary)] px-1 rounded">grievance_tickets</code> collection in Firestore security rules.</li>
            </ol>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

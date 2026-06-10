import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';
import Spinner from '../../components/ui/Spinner';
import {
  Shield, Scan, CheckCircle2, XCircle, AlertTriangle,
  FileCode, ClipboardList, ChevronRight, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const INITIAL_RESULT = {
  privacyPolicy: null,
  dpoContact: null,
  grievanceForm: null,
  contactPage: null,
  footerContact: null,
  score: null,
  recommendations: [],
  raw: '',
};

function StatusRow({ label, value, icon: Icon }) {
  if (value === null) return null;
  const ok = value === true;
  return (
    <div className="compliance-item">
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-[var(--text-muted)]" />
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      </div>
      <div className={`flex items-center gap-1.5 text-sm font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
        {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        {ok ? 'Found' : 'Not Found'}
      </div>
    </div>
  );
}

export default function ComplianceScanner() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(INITIAL_RESULT);
  const [scanned, setScanned] = useState(false);

  async function runScan() {
    if (!code.trim()) {
      toast.error('Please paste your source code first.');
      return;
    }
    setLoading(true);
    setScanned(false);

    try {
      if (!GEMINI_KEY) {
        // Simulate scan when no API key
        await new Promise(r => setTimeout(r, 1800));
        const simulated = simulateScan(code);
        setResult(simulated);
        setScanned(true);
        toast.success('Scan complete (simulated — add VITE_GEMINI_API_KEY for real AI)');
        return;
      }

      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are a DPDP Act Section 8(10) compliance auditor.
Analyze the following React source code for DPDP compliance indicators.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "privacyPolicy": true/false,
  "dpoContact": true/false,
  "grievanceForm": true/false,
  "contactPage": true/false,
  "footerContact": true/false,
  "score": <integer 0-100>,
  "recommendations": ["string1", "string2", ...]
}

Detection criteria:
- privacyPolicy: Is there a Privacy Policy page or route (/privacy, /privacy-policy)?
- dpoContact: Is there DPO name/email/contact visible anywhere (component or string)?
- grievanceForm: Is there a grievance submission form or route (/submit-grievance, /grievance)?
- contactPage: Is there a Contact page or route (/contact)?
- footerContact: Does the footer contain contact info or DPO details?
- score: Based on all checks (each item worth 20 points)
- recommendations: Specific, actionable strings for each missing item

Source code to analyze:
---
${code.slice(0, 30000)}
---
`;

      const response = await model.generateContent(prompt);
      const text = response.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI returned unexpected format');
      const parsed = JSON.parse(jsonMatch[0]);
      setResult({ ...INITIAL_RESULT, ...parsed });
      setScanned(true);
      toast.success('Compliance scan complete!');
    } catch (err) {
      console.error(err);
      const simulated = simulateScan(code);
      setResult(simulated);
      setScanned(true);
      toast('Scan complete (simulated fallback)', { icon: '⚠️' });
    } finally {
      setLoading(false);
    }
  }

  function simulateScan(src) {
    const lower = src.toLowerCase();
    const privacyPolicy = lower.includes('privacy') || lower.includes('privacypolicy');
    const dpoContact = lower.includes('dpo') || lower.includes('grievance officer');
    const grievanceForm = lower.includes('grievance') || lower.includes('submit-grievance') || lower.includes('submitgrievance');
    const contactPage = lower.includes('contact');
    const footerContact = lower.includes('footer') && (lower.includes('email') || lower.includes('dpo'));
    const trueCount = [privacyPolicy, dpoContact, grievanceForm, contactPage, footerContact].filter(Boolean).length;
    const score = trueCount * 20;
    const recommendations = [];
    if (!privacyPolicy) recommendations.push('Add a dedicated /privacy-policy route and page with full DPDP content.');
    if (!dpoContact) recommendations.push('Include DPO name, email, and phone in a visible location (Privacy Policy + Footer).');
    if (!grievanceForm) recommendations.push('Implement a /submit-grievance form with Firestore integration.');
    if (!contactPage) recommendations.push('Create a Contact page with organisational contact details.');
    if (!footerContact) recommendations.push('Add DPO contact information to the site footer on all pages.');
    return { privacyPolicy, dpoContact, grievanceForm, contactPage, footerContact, score, recommendations, raw: '' };
  }

  const scoreColor = result.score >= 80 ? 'text-emerald-400' : result.score >= 50 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30">
              <Scan size={24} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Compliance Scanner</h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Paste your React source code to detect DPDP Act 8(10) compliance gaps
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="glass-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <FileCode size={18} className="text-indigo-400" />
                  Source Code Input
                </h2>
                <button
                  onClick={() => { setCode(''); setResult(INITIAL_RESULT); setScanned(false); }}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={12} /> Clear
                </button>
              </div>

              <textarea
                className="form-textarea font-mono text-xs"
                style={{ minHeight: '380px', resize: 'vertical' }}
                placeholder={`Paste your React source code here...

Examples:
• App.jsx (routing)
• Footer.jsx
• PrivacyPolicy.jsx
• Any component file

The scanner will detect DPDP compliance signals including:
- Privacy Policy page/route
- DPO contact information
- Grievance submission form
- Contact page
- Footer contact info`}
                value={code}
                onChange={e => setCode(e.target.value)}
              />

              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)]">
                  {code.length.toLocaleString()} characters
                  {!GEMINI_KEY && <span className="ml-2 text-amber-400">(Simulated mode — no API key)</span>}
                </p>
                <button
                  className="btn-primary"
                  onClick={runScan}
                  disabled={loading}
                  id="run-compliance-scan"
                >
                  {loading ? <Spinner size={16} color="white" /> : <Scan size={16} />}
                  {loading ? 'Scanning…' : 'Run Compliance Scan'}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="glass-card p-6 flex flex-col gap-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <ClipboardList size={18} className="text-indigo-400" />
                Compliance Report
              </h2>

              {!scanned && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-16 text-[var(--text-muted)]">
                  <Shield size={48} className="mb-4 opacity-30" />
                  <p className="text-sm">Paste source code and click<br /><strong className="text-[var(--text-secondary)]">Run Compliance Scan</strong> to see results</p>
                </div>
              )}

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center py-16">
                  <Spinner size={40} />
                  <p className="text-sm text-[var(--text-muted)] mt-4">Analyzing code…</p>
                </div>
              )}

              {scanned && !loading && (
                <>
                  {/* Score */}
                  <div className="flex items-center gap-6 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                    <div className={`compliance-score ${scoreColor}`}>{result.score}</div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Compliance Score</p>
                      <div className="w-48 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${result.score >= 80 ? 'bg-emerald-400' : result.score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${result.score}%` }}
                        />
                      </div>
                      <p className={`text-xs font-semibold mt-1 ${scoreColor}`}>
                        {result.score >= 80 ? 'Compliant ✓' : result.score >= 50 ? 'Partially Compliant' : 'Non-Compliant ✗'}
                      </p>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div>
                    <StatusRow label="Privacy Policy Page" value={result.privacyPolicy} icon={Shield} />
                    <StatusRow label="DPO Contact Information" value={result.dpoContact} icon={CheckCircle2} />
                    <StatusRow label="Grievance Submission Form" value={result.grievanceForm} icon={FileCode} />
                    <StatusRow label="Contact Page" value={result.contactPage} icon={ClipboardList} />
                    <StatusRow label="Footer Contact Info" value={result.footerContact} icon={Shield} />
                  </div>

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                        <AlertTriangle size={14} className="text-amber-400" /> Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                            <ChevronRight size={14} className="text-amber-400 mt-0.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.recommendations.length === 0 && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                      <CheckCircle2 size={16} /> All DPDP compliance checks passed!
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

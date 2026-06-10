import { useState } from 'react';
import { collection, addDoc, getDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/Layout/Navbar';
import Sidebar from '../../components/Layout/Sidebar';
import Footer from '../../components/Layout/Footer';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';
import {
  FlaskConical, Play, CheckCircle2, XCircle, RefreshCw,
  ClipboardList, Send, Database, Route, FileText, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const ISSUE_TYPES = [
  'Privacy Complaint',
  'Data Correction Request',
  'Data Deletion Request',
  'Consent Withdrawal',
  'Security Incident',
  'Other',
];

const MOCK_NAMES = ['Aarav Sharma', 'Priya Nair', 'Rohan Mehta', 'Sneha Gupta', 'Kiran Patel'];
const MOCK_DESCS = [
  'My personal data including phone number and email was shared with third-party vendors without my explicit consent. I request immediate deletion of my data from all external databases.',
  'I noticed incorrect date of birth and address in my profile. I request correction of these details as per Section 8(1)(b) of DPDP Act.',
  'I withdraw my consent for marketing emails and data processing for targeted advertising. Please confirm deletion within 30 days.',
  'My account data appears to have been compromised. I received phishing emails using my registered details. This is a potential security incident.',
  'I want to exercise my right to erasure under DPDP Act Section 8(7). Please delete all my personal data from your systems.',
];

function LogLine({ status, message, timestamp }) {
  const icon = status === 'success'
    ? <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
    : status === 'error'
    ? <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
    : <Clock size={14} className="text-amber-400 shrink-0 mt-0.5" />;

  return (
    <div className="flex items-start gap-2 py-1.5">
      {icon}
      <span className="text-xs text-[var(--text-secondary)] flex-1">{message}</span>
      <span className="text-xs text-[var(--text-muted)] whitespace-nowrap ml-2">{timestamp}</span>
    </div>
  );
}

function CheckRow({ label, passed, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Icon size={15} className="text-[var(--text-muted)]" />
        {label}
      </div>
      {passed === null
        ? <span className="text-xs text-[var(--text-muted)]">—</span>
        : passed
        ? <CheckCircle2 size={16} className="text-emerald-400" />
        : <XCircle size={16} className="text-red-400" />
      }
    </div>
  );
}

export default function TicketTester() {
  const { user } = useAuth();
  const [mockData, setMockData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [checks, setChecks] = useState({
    firestoreWrite: null,
    firestoreRead: null,
    statusOpen: null,
    assignedToDPO: null,
    auditLogged: null,
  });
  const [ticketId, setTicketId] = useState(null);
  const [testComplete, setTestComplete] = useState(false);

  function now() {
    return new Date().toLocaleTimeString('en-IN', { hour12: false });
  }

  function addLog(status, message) {
    setLogs(prev => [...prev, { status, message, timestamp: now() }]);
  }

  function generateMock() {
    const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
    const issueType = ISSUE_TYPES[Math.floor(Math.random() * ISSUE_TYPES.length)];
    const description = MOCK_DESCS[Math.floor(Math.random() * MOCK_DESCS.length)];
    const emailHandle = name.toLowerCase().replace(' ', '.').replace(/[^a-z.]/g, '');
    const mock = {
      name,
      email: `${emailHandle}@test.example.com`,
      issueType,
      description,
      attachmentUrl: '',
      userId: user?.uid || 'test-user',
      status: 'Open',
      assignedTo: 'DPO',
      isTest: true,
    };
    setMockData(mock);
    setLogs([]);
    setChecks({ firestoreWrite: null, firestoreRead: null, statusOpen: null, assignedToDPO: null, auditLogged: null });
    setTicketId(null);
    setTestComplete(false);
    toast.success('Mock ticket generated!');
  }

  async function runTest() {
    if (!mockData) {
      toast.error('Generate a mock ticket first.');
      return;
    }
    setRunning(true);
    setLogs([]);
    setChecks({ firestoreWrite: null, firestoreRead: null, statusOpen: null, assignedToDPO: null, auditLogged: null });
    setTestComplete(false);

    addLog('info', 'Starting DPDP grievance submission test…');
    await delay(400);

    // Step 1: Write to Firestore
    addLog('info', 'Writing test ticket to grievance_tickets collection…');
    let docId = null;
    try {
      const docRef = await addDoc(collection(db, 'grievance_tickets'), {
        ...mockData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      docId = docRef.id;
      setTicketId(docId);
      setChecks(c => ({ ...c, firestoreWrite: true }));
      addLog('success', `Ticket written to Firestore. Document ID: ${docId}`);
    } catch (err) {
      setChecks(c => ({ ...c, firestoreWrite: false }));
      addLog('error', `Firestore write failed: ${err.message}`);
      setRunning(false);
      setTestComplete(true);
      return;
    }

    await delay(600);

    // Step 2: Read back
    addLog('info', 'Reading back the written document to verify…');
    try {
      const snap = await getDoc(doc(db, 'grievance_tickets', docId));
      if (!snap.exists()) throw new Error('Document not found after write');
      const data = snap.data();
      setChecks(c => ({ ...c, firestoreRead: true }));
      addLog('success', 'Document read successfully from Firestore.');

      // Step 3: Verify status = Open
      const statusOk = data.status === 'Open';
      setChecks(c => ({ ...c, statusOpen: statusOk }));
      addLog(statusOk ? 'success' : 'error', `Status check: "${data.status}" ${statusOk ? '✓' : '✗ (expected "Open")'}`);

      // Step 4: Verify assignedTo = DPO
      await delay(300);
      const assignedOk = data.assignedTo === 'DPO';
      setChecks(c => ({ ...c, assignedToDPO: assignedOk }));
      addLog(assignedOk ? 'success' : 'error', `Assignment check: "${data.assignedTo}" ${assignedOk ? '✓' : '✗ (expected "DPO")'}`);
    } catch (err) {
      setChecks(c => ({ ...c, firestoreRead: false }));
      addLog('error', `Read-back failed: ${err.message}`);
    }

    await delay(500);

    // Step 5: Write audit log
    addLog('info', 'Writing audit log entry…');
    try {
      await addDoc(collection(db, 'audit_logs'), {
        ticketId: docId,
        action: 'Test ticket created by TicketTester utility',
        performedBy: user?.email || 'tester',
        timestamp: serverTimestamp(),
      });
      setChecks(c => ({ ...c, auditLogged: true }));
      addLog('success', 'Audit log entry written to audit_logs collection.');
    } catch (err) {
      setChecks(c => ({ ...c, auditLogged: false }));
      addLog('error', `Audit log write failed: ${err.message}`);
    }

    await delay(400);
    addLog('success', 'Test run complete. Review results above.');
    setTestComplete(true);
    setRunning(false);
    toast.success('Test complete!');
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function reset() {
    setMockData(null);
    setLogs([]);
    setChecks({ firestoreWrite: null, firestoreRead: null, statusOpen: null, assignedToDPO: null, auditLogged: null });
    setTicketId(null);
    setTestComplete(false);
  }

  const allPassed = testComplete && Object.values(checks).every(v => v === true);

  return (
    <div className="page-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <FlaskConical size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Ticket Testing Utility</h1>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Generate and submit a mock grievance ticket to verify end-to-end DPDP compliance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls + Mock Data */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              {/* Buttons */}
              <div className="glass-card p-5 flex flex-col gap-3">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Controls</h2>
                <button
                  className="btn-secondary w-full justify-center"
                  onClick={generateMock}
                  disabled={running}
                  id="generate-mock-ticket"
                >
                  <RefreshCw size={15} /> Generate Mock Ticket
                </button>
                <button
                  className="btn-primary w-full justify-center"
                  onClick={runTest}
                  disabled={running || !mockData}
                  id="run-ticket-test"
                >
                  {running ? <Spinner size={15} color="white" /> : <Play size={15} />}
                  {running ? 'Running Test…' : 'Submit & Verify'}
                </button>
                <button
                  className="btn-danger w-full justify-center"
                  onClick={reset}
                  disabled={running}
                  id="reset-ticket-test"
                >
                  <RefreshCw size={15} /> Reset
                </button>
              </div>

              {/* Verification Checklist */}
              <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Verification Checks</h2>
                <CheckRow label="Firestore Write" passed={checks.firestoreWrite} icon={Database} />
                <CheckRow label="Firestore Read-back" passed={checks.firestoreRead} icon={Database} />
                <CheckRow label="Status = Open" passed={checks.statusOpen} icon={ClipboardList} />
                <CheckRow label="Assigned to DPO" passed={checks.assignedToDPO} icon={Route} />
                <CheckRow label="Audit Log Written" passed={checks.auditLogged} icon={FileText} />

                {testComplete && (
                  <div className={`mt-4 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${allPassed ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                    {allPassed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {allPassed ? 'All checks passed!' : 'Some checks failed'}
                  </div>
                )}

                {ticketId && (
                  <p className="text-xs text-[var(--text-muted)] mt-3 break-all">
                    <span className="text-[var(--text-secondary)] font-medium">Ticket ID: </span>
                    {ticketId}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Mock Data + Logs */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Mock Ticket Preview */}
              <div className="glass-card p-5">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Send size={14} /> Mock Ticket Data
                </h2>
                {!mockData ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    <FlaskConical size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Click "Generate Mock Ticket" to create test data</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    {[
                      ['Name', mockData.name],
                      ['Email', mockData.email],
                      ['Issue Type', mockData.issueType],
                      ['Status', <Badge status={mockData.status} />],
                      ['Assigned To', mockData.assignedTo],
                      ['Is Test', <span className="text-amber-400 font-semibold">true</span>],
                    ].map(([label, val]) => (
                      <div key={label} className="flex gap-3">
                        <span className="text-[var(--text-muted)] w-24 shrink-0">{label}</span>
                        <span className="text-[var(--text-primary)] font-medium">{val}</span>
                      </div>
                    ))}
                    <div className="flex gap-3">
                      <span className="text-[var(--text-muted)] w-24 shrink-0">Description</span>
                      <span className="text-[var(--text-secondary)] text-xs leading-relaxed">{mockData.description}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Log */}
              <div className="glass-card p-5 flex-1">
                <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText size={14} /> Delivery Log
                </h2>
                {logs.length === 0 ? (
                  <div className="text-center py-6 text-[var(--text-muted)]">
                    <p className="text-xs">Logs will appear here during test execution</p>
                  </div>
                ) : (
                  <div className="space-y-0.5 divide-y divide-[var(--border)]">
                    {logs.map((l, i) => (
                      <LogLine key={i} {...l} />
                    ))}
                  </div>
                )}
                {running && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-muted)]">
                    <Spinner size={12} /> Running verification…
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import SubmitGrievance from './pages/SubmitGrievance';
import TicketDetail from './pages/TicketDetail';
import PrivacyPolicy from './pages/PrivacyPolicy';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTicketDetail from './pages/admin/AdminTicketDetail';

import ComplianceScanner from './pages/ai/ComplianceScanner';
import FormGenerator from './pages/ai/FormGenerator';
import TicketTester from './pages/ai/TicketTester';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '10px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#1e293b' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
            }}
          />

          <Routes>
            {/* Public */}
            <Route path="/" element={<Login />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />

            {/* Authenticated (any logged-in user) */}
            <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/submit-grievance" element={<PrivateRoute><SubmitGrievance /></PrivateRoute>} />
            <Route path="/ticket/:id" element={<PrivateRoute><TicketDetail /></PrivateRoute>} />

            {/* Admin / DPO only */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/ticket/:id" element={<AdminRoute><AdminTicketDetail /></AdminRoute>} />

            {/* AI Utilities (Admin only) */}
            <Route path="/ai/scanner" element={<AdminRoute><ComplianceScanner /></AdminRoute>} />
            <Route path="/ai/generator" element={<AdminRoute><FormGenerator /></AdminRoute>} />
            <Route path="/ai/tester" element={<AdminRoute><TicketTester /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
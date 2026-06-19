import { createContext, useContext, useState, useEffect } from 'react';
import { getStoredToken } from '../api/client';

export const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { id, username, email, display_name, role }
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on page load
  useEffect(() => {
    const token = getStoredToken();
    if (!token) { setLoading(false); return; }

    // Verify token is still valid by calling /api/auth/me
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setUser(data);
        else {
          // Token expired or invalid — clear it
          localStorage.removeItem('dpdp_token');
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('dpdp_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Login — calls POST /api/auth/login, stores JWT in localStorage
   */
  const login = async (username, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const { token, user: userData } = await res.json();
    localStorage.setItem('dpdp_token', token);
    setUser(userData);
    return userData;
  };

  /**
   * Logout — clears localStorage and resets state
   */
  const logout = () => {
    localStorage.removeItem('dpdp_token');
    setUser(null);
  };

  const role = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

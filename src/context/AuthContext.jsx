import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'bm_token';
const USER_KEY = 'bm_user';

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Validate token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    const decoded = parseJwt(storedToken);
    // Check expiration
    if (!decoded || (decoded.exp && decoded.exp * 1000 < Date.now())) {
      logout();
      setLoading(false);
      return;
    }

    // Verify token with backend /auth/me
    api.get('/auth/me')
      .then((res) => {
        if (res.data && res.data.success) {
          const profile = res.data.data.user;
          setUser(profile);
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
        }
      })
      .catch(() => {
        // If /auth/me fails (401 or network), client interceptor or catch handles logout
        logout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [logout]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.success) {
      const { token: receivedToken, user: receivedUser } = res.data.data;
      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const role = user?.role || (token ? parseJwt(token)?.role : null);

  const value = {
    token,
    user,
    role,
    isAuthenticated: Boolean(token),
    isAdmin: role === 'admin',
    isViewer: role === 'viewer',
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

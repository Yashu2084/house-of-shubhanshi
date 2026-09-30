'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Requirement 17 & 24: /api/auth/me identifies user and sets authLoading = false
  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      const currentUser = (res && res.user) || (res && res.data && res.data.user) || null;
      setUser(currentUser);
      return currentUser;
    } catch (err) {
      // 401 unauthenticated is expected when not logged in
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Requirement 17: Immediately call GET /api/auth/me after successful login
  const login = async (email, password, rememberMe = false) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, rememberMe });
      if (res && res.success) {
        // Immediately verify backend session cookie via /api/auth/me
        const meRes = await api.get('/auth/me');
        const verifiedUser = (meRes && (meRes.user || (meRes.data && meRes.data.user)))
          || (res.data && res.data.user)
          || res.user;
        setUser(verifiedUser);
        return verifiedUser;
      }
      throw new Error(res?.message || 'Email or password is incorrect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Requirement 19: Customer Signup followed by immediate session verification
  const signup = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', payload);
      if (res && res.success) {
        // Immediately verify backend session cookie via /api/auth/me
        const meRes = await api.get('/auth/me');
        const verifiedUser = (meRes && (meRes.user || (meRes.data && meRes.data.user)))
          || (res.data && res.data.user)
          || res.user;
        setUser(verifiedUser);
        return verifiedUser;
      }
      throw new Error(res?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        login,
        signup,
        logout,
        refreshUser,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

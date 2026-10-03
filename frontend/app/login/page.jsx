'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your registered email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(email, password, rememberMe);

      // Route according to authenticated role
      if (loggedUser && loggedUser.role === 'ADMIN') {
        router.push(redirectTarget || '/admin');
      } else {
        router.push(redirectTarget || '/profile');
      }
    } catch (err) {
      console.error('Login error:', err);
      // Clean, user-facing error message without database details or stack traces
      setError(err.message || 'Email or password is incorrect. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <span className="section-tag">ACCOUNT ACCESS</span>
        <h1 className="auth-title">SIGN IN</h1>
        <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
        <p className="auth-subtitle">
          Welcome back. Enter your email to view your orders, saved pieces, and dress reservations.
        </p>
      </div>

      {error && (
        <div className="auth-alert error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="loginEmail">Email Address</label>
          <input
            type="email"
            id="loginEmail"
            className="form-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label className="form-label" htmlFor="loginPassword">Password</label>
            <a
              href="https://wa.me/919560011351?text=Hello%20House%20of%20Shubhanshi,%20I%20need%20help%20recovering%20my%20account%20password."
              target="_blank"
              rel="noopener noreferrer"
              className="form-help-link"
              style={{ fontSize: '0.75rem', color: 'var(--gold-dark)' }}
            >
              Forgot Password?
            </a>
          </div>
          <input
            type="password"
            id="loginPassword"
            className="form-input"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div className="form-checkbox-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0 16px' }}>
          <input
            type="checkbox"
            id="rememberMe"
            className="form-checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="rememberMe" className="form-checkbox-label" style={{ fontSize: '0.82rem', color: 'var(--text-brown)', cursor: 'pointer' }}>
            Remember me on this device
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-gold auth-submit-btn"
          disabled={loading}
          style={{ width: '100%', padding: '16px', letterSpacing: '0.12em' }}
        >
          {loading ? 'SIGNING IN...' : 'SIGN IN'}
        </button>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-brown)' }}>
          <span>Don&apos;t have an account yet? </span>
          <Link
            href={`/signup${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
            className="auth-link"
            style={{ color: 'var(--gold-dark)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Create an Account
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="auth-main-wrap" style={{ paddingTop: '140px', minHeight: '85vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ maxWidth: '520px', padding: '20px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>}>
          <LoginFormContent />
        </Suspense>
      </div>
    </main>
  );
}

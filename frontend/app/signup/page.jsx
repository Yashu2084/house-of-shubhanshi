'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const { signup } = useAuth();
  const { showToast } = useCart();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      setError('Please provide your full legal name (minimum 2 characters).');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }
    if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone.trim())) {
      setError('Please enter a valid contact phone number.');
      return;
    }
    if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters and include at least one letter and one number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your entries.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Enforce role: 'CUSTOMER' (never permit client to elevate to admin)
      const user = await signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        dob: dob || null,
        password,
        confirmPassword
      });

      showToast(`Welcome to House of Shubhanshi, ${user.name}.`);
      router.push(redirectTarget || '/customer');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <span className="section-tag">PRIVATE ATELIER CLIENTELE</span>
        <h1 className="auth-title">CREATE PRIVATE ACCOUNT</h1>
        <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
        <p className="auth-subtitle">
          Begin your private bespoke chronicle. Reserve heirloom couture rentals, enjoy made-to-measure fittings, and view order delivery tracking.
        </p>
      </div>

      {error && (
        <div className="auth-alert error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="signupName">Full Legal Name *</label>
          <input
            type="text"
            id="signupName"
            className="form-input"
            placeholder="e.g. Princess Shubha Singh"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="signupEmail">Email Address *</label>
          <input
            type="email"
            id="signupEmail"
            className="form-input"
            placeholder="patron@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="signupPhone">Contact Phone *</label>
            <input
              type="tel"
              id="signupPhone"
              className="form-input"
              placeholder="+91 9560011351"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signupDob">Date of Birth</label>
            <input
              type="date"
              id="signupDob"
              className="form-input"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="signupPassword">Password *</label>
            <input
              type="password"
              id="signupPassword"
              className="form-input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signupConfirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="signupConfirmPassword"
              className="form-input"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
        </div>

        <p className="form-hint" style={{ fontSize: '0.74rem', color: 'var(--text-brown)', margin: '4px 0 16px' }}>
          By creating an account, you agree to House of Shubhanshi&apos;s Private Salon terms and rental care charters.
        </p>

        <button
          type="submit"
          className="btn btn-gold auth-submit-btn"
          disabled={loading}
          style={{ width: '100%', padding: '16px', letterSpacing: '0.12em' }}
        >
          {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
        </button>

        <div className="auth-footer" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--text-brown)' }}>
          <span>Already hold a private membership? </span>
          <Link
            href={`/login${redirectTarget ? `?redirect=${encodeURIComponent(redirectTarget)}` : ''}`}
            className="auth-link"
            style={{ color: 'var(--gold-dark)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Sign In Here
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function SignupPage() {
  return (
    <main className="auth-main-wrap" style={{ paddingTop: '140px', minHeight: '85vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="container" style={{ maxWidth: '580px', padding: '20px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>}>
          <SignupFormContent />
        </Suspense>
      </div>
    </main>
  );
}

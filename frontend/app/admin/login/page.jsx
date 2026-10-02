'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, loading: authLoading, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && isAdmin) {
        router.push('/admin');
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email.trim().toLowerCase(), password);
      if (res && res.success) {
        const loggedUser = res.data?.user || res.user;
        if (loggedUser?.role === 'ADMIN') {
          router.push('/admin');
        } else {
          setError('Access Restricted: This account does not possess Atelier Administrator credentials.');
        }
      } else {
        setError(res?.message || 'Invalid administrator email or password.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDFBF7', padding: '120px 20px 60px' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '40px 32px', boxShadow: '0 16px 40px rgba(59, 29, 20, 0.08)' }}>
        
        {/* Atelier Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '8px' }}>✦</div>
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--gold-dark)', fontWeight: 600 }}>
            ATELIER GOVERNANCE &bull; PRIVATE ACCESS
          </span>
          <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', marginTop: '6px', fontWeight: 500 }}>
            ADMINISTRATOR PORTAL
          </h1>
          <div className="gold-divider" style={{ margin: '14px auto', maxWidth: '160px' }}>
            <span className="gold-divider-diamond"></span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-brown)', lineHeight: 1.5 }}>
            Sign in to manage House of Shubhanshi collections, vault inventory, client orders, and WhatsApp enquiries.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.08)', border: '1px solid #DC2626', color: '#991B1B', padding: '12px 16px', fontSize: '0.82rem', marginBottom: '20px', lineHeight: 1.4 }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brown-dark)', fontWeight: 600, marginBottom: '6px' }}>
              ADMINISTRATOR EMAIL
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@houseofshubhanshi.com"
              style={{ width: '100%', padding: '12px 14px', fontSize: '0.9rem', border: '1px solid var(--gold-border)', background: 'var(--white)', color: 'var(--brown-dark)', outline: 'none' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--brown-dark)', fontWeight: 600, marginBottom: '6px' }}>
              SECRET PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{ width: '100%', padding: '12px 14px', fontSize: '0.9rem', border: '1px solid var(--gold-border)', background: 'var(--white)', color: 'var(--brown-dark)', outline: 'none' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-gold"
            style={{ width: '100%', padding: '14px', marginTop: '6px', fontSize: '0.8rem', letterSpacing: '0.18em' }}
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER ATELIER DASHBOARD →'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid rgba(201, 160, 74, 0.2)', paddingTop: '16px' }}>
          <Link href="/login" style={{ fontSize: '0.76rem', color: 'var(--text-brown)', textDecoration: 'none' }}>
            Switch to Patron / Customer Login &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';
import { formatDisplayDate, brandInfo } from '../../lib/utils';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout, refreshUser } = useAuth();
  const { showToast } = useCart();

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDob(user.dob || '');
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setProfileMsg({ text: 'Please provide your full name.', type: 'error' });
      return;
    }
    if (!email.trim()) {
      setProfileMsg({ text: 'Please provide a valid email address.', type: 'error' });
      return;
    }

    try {
      setProfileSaving(true);
      setProfileMsg({ text: '', type: '' });

      const res = await api.put('/auth/profile', {
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : null,
        dob: dob || null
      });

      if (res && res.success) {
        setProfileMsg({ text: 'Profile information updated successfully.', type: 'success' });
        showToast('Your profile has been updated.');
        setIsEditing(false);
        refreshUser();
      } else {
        throw new Error(res?.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileMsg({ text: err.message || 'Could not update profile. Please try again.', type: 'error' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordMsg({ text: 'Please provide both your current and new password.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordMsg({ text: '', type: '' });

      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (res && res.success) {
        setPasswordMsg({ text: 'Password successfully updated.', type: 'success' });
        showToast('Password updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      } else {
        throw new Error(res?.message || 'Failed to update password.');
      }
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Failed to update password.', type: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (authLoading || (!isAuthenticated && !user)) {
    return (
      <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--gold)' }}>✦</p>
        <p style={{ color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: '0.85rem' }}>
          Opening your private profile...
        </p>
      </main>
    );
  }

  const memberSince = user?.createdAt ? formatDisplayDate(user.createdAt) : null;
  const initials = (user?.name || 'HS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <main style={{ paddingTop: '130px', minHeight: '85vh', paddingBottom: '90px', backgroundColor: '#FDFBF7' }}>
      <div className="container" style={{ maxWidth: '880px', padding: '0 20px' }}>
        
        {/* Profile Luxury Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #3B1D14, #2A140D)',
            color: 'var(--gold)',
            fontFamily: 'var(--font-serif)',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '2px solid var(--gold)',
            boxShadow: '0 8px 24px rgba(59, 29, 20, 0.12)',
            letterSpacing: '1px'
          }}>
            {initials}
          </div>

          <span className="section-tag" style={{ color: 'var(--gold)', letterSpacing: '0.18em' }}>
            PRIVATE CLIENT PROFILE
          </span>
          <h1 className="font-serif" style={{ fontSize: 'clamp(1.9rem, 3.8vw, 2.6rem)', color: 'var(--brown-dark)', margin: '6px 0 8px', fontWeight: 500 }}>
            {user?.name}
          </h1>
          <div className="gold-divider" style={{ margin: '0 auto 12px' }}><span className="gold-divider-diamond"></span></div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-brown)' }}>
            Your saved personal profile automatically pre-fills your WhatsApp purchase and rental enquiries.
            {memberSince && (
              <span style={{ display: 'block', marginTop: '4px', fontStyle: 'italic', color: 'var(--gold-dark)' }}>
                Patron since {memberSince}
              </span>
            )}
          </p>
        </div>

        {/* Profile Card */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--gold-border)',
          borderRadius: '4px',
          padding: 'clamp(24px, 4vw, 44px)',
          boxShadow: '0 10px 30px rgba(59, 29, 20, 0.05)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(201, 160, 74, 0.2)',
            paddingBottom: '16px',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 className="font-serif" style={{ fontSize: '1.35rem', color: 'var(--brown-dark)', margin: 0 }}>
                PERSONAL INFORMATION
              </h2>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-brown)' }}>
                Saved securely in the House of Shubhanshi database
              </span>
            </div>

            {!isEditing ? (
              <button
                type="button"
                className="btn btn-gold-outline-dark"
                onClick={() => setIsEditing(true)}
                style={{ padding: '8px 20px', fontSize: '0.78rem', letterSpacing: '0.1em' }}
              >
                EDIT PROFILE
              </button>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setIsEditing(false);
                  setName(user?.name || '');
                  setEmail(user?.email || '');
                  setPhone(user?.phone || '');
                  setDob(user?.dob || '');
                  setProfileMsg({ text: '', type: '' });
                }}
                style={{
                  background: 'none',
                  border: '1px solid #ccc',
                  padding: '8px 18px',
                  fontSize: '0.78rem',
                  color: 'var(--text-brown)',
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
            )}
          </div>

          {profileMsg.text && (
            <div className={`auth-alert ${profileMsg.type}`} style={{ marginBottom: '20px' }}>
              {profileMsg.text}
            </div>
          )}

          {!isEditing ? (
            /* View-Only Mode */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              <div style={{ background: '#FAF7F2', padding: '16px 20px', borderRadius: '3px', borderLeft: '3px solid var(--gold)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Full Name
                </span>
                <div style={{ fontSize: '1.05rem', color: 'var(--brown-dark)', fontWeight: 600, marginTop: '4px' }}>
                  {user?.name || '—'}
                </div>
              </div>

              <div style={{ background: '#FAF7F2', padding: '16px 20px', borderRadius: '3px', borderLeft: '3px solid var(--gold)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Email Address
                </span>
                <div style={{ fontSize: '1.05rem', color: 'var(--brown-dark)', fontWeight: 600, marginTop: '4px', wordBreak: 'break-all' }}>
                  {user?.email || '—'}
                </div>
              </div>

              <div style={{ background: '#FAF7F2', padding: '16px 20px', borderRadius: '3px', borderLeft: '3px solid var(--gold)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Phone / WhatsApp Number
                </span>
                <div style={{ fontSize: '1.05rem', color: 'var(--brown-dark)', fontWeight: 600, marginTop: '4px' }}>
                  {user?.phone || 'Not added yet'}
                </div>
              </div>

              <div style={{ background: '#FAF7F2', padding: '16px 20px', borderRadius: '3px', borderLeft: '3px solid var(--gold)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Date of Birth
                </span>
                <div style={{ fontSize: '1.05rem', color: 'var(--brown-dark)', fontWeight: 600, marginTop: '4px' }}>
                  {user?.dob ? formatDisplayDate(user.dob) : 'Not specified'}
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="profileName">Full Name *</label>
                  <input
                    type="text"
                    id="profileName"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profileEmail">Email Address *</label>
                  <input
                    type="email"
                    id="profileEmail"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profilePhone">Phone / WhatsApp Number</label>
                  <input
                    type="tel"
                    id="profilePhone"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="profileDob">Date of Birth</label>
                  <input
                    type="date"
                    id="profileDob"
                    className="form-input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px', marginTop: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={profileSaving}
                  style={{ padding: '12px 28px', fontSize: '0.85rem', letterSpacing: '0.1em' }}
                >
                  {profileSaving ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
                </button>
                <button
                  type="button"
                  className="btn btn-gold-outline-dark"
                  onClick={() => setIsEditing(false)}
                  style={{ padding: '12px 20px', fontSize: '0.85rem' }}
                >
                  CANCEL
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security / Change Password Accordion Card */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--gold-border)',
          borderRadius: '4px',
          padding: 'clamp(20px, 3.5vw, 36px)',
          boxShadow: '0 8px 24px rgba(59, 29, 20, 0.04)',
          marginBottom: '32px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            <div>
              <h2 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', margin: 0 }}>
                ACCOUNT SECURITY &amp; PASSWORD
              </h2>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-brown)' }}>
                Keep your private login credentials protected
              </span>
            </div>
            <button
              type="button"
              className="btn btn-gold-outline-dark"
              style={{ padding: '6px 16px', fontSize: '0.74rem' }}
            >
              {showPasswordSection ? 'HIDE' : 'CHANGE PASSWORD'}
            </button>
          </div>

          {showPasswordSection && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(201, 160, 74, 0.2)' }}>
              {passwordMsg.text && (
                <div className={`auth-alert ${passwordMsg.type}`} style={{ marginBottom: '18px' }}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="currentPassword">Current Password</label>
                  <input
                    type="password"
                    id="currentPassword"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">New Password (Min 8 Characters)</label>
                  <input
                    type="password"
                    id="newPassword"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="form-input"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={passwordSaving}
                  style={{ alignSelf: 'flex-start', padding: '12px 24px', fontSize: '0.84rem', letterSpacing: '0.08em' }}
                >
                  {passwordSaving ? 'UPDATING...' : 'UPDATE PASSWORD'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Direct WhatsApp Concierge Assistance */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201, 160, 74, 0.08), rgba(59, 29, 20, 0.04))',
          border: '1px solid var(--gold-border)',
          borderRadius: '4px',
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.14em', color: 'var(--gold-dark)', textTransform: 'uppercase', fontWeight: 600 }}>
              ATELIER CONCIERGE SERVICE
            </span>
            <h3 className="font-serif" style={{ fontSize: '1.2rem', color: 'var(--brown-dark)', margin: '4px 0 2px' }}>
              Direct WhatsApp Assistance
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-brown)', margin: 0 }}>
              Need styling advice, custom alterations, or immediate garment reservation assistance?
            </p>
          </div>

          <a
            href={`https://wa.me/919560011351?text=${encodeURIComponent(`Hello House of Shubhanshi,\n\nI am contacting you from my profile (${user?.name || 'Patron'}). I would like assistance with an enquiry.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-gold"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', fontSize: '0.82rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            CHAT ON WHATSAPP
          </a>
        </div>

        {/* Quick Navigation Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(201, 160, 74, 0.2)'
        }}>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn btn-gold-outline-dark" style={{ fontSize: '0.8rem', padding: '10px 18px' }}>
              EXPLORE SHOP
            </Link>
            <Link href="/cart" className="btn btn-gold-outline-dark" style={{ fontSize: '0.8rem', padding: '10px 18px' }}>
              MY SELECTION
            </Link>
            <Link href="/policies" className="btn btn-gold-outline-dark" style={{ fontSize: '0.8rem', padding: '10px 18px' }}>
              POLICIES
            </Link>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              background: 'none',
              border: 'none',
              color: '#991B1B',
              fontSize: '0.82rem',
              letterSpacing: '0.1em',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>&rarr;</span> SIGN OUT
          </button>
        </div>

      </div>
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  formatPrice,
  brandInfo,
  createSelectionWhatsAppMessage,
  getWhatsAppUrl
} from '../../lib/utils';
import CartItem from '../../components/CartItem';

export default function CartPage() {
  const { items, garmentsSubtotal, depositsTotal, grandTotal, clearCart, showToast } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Patron details for the WhatsApp enquiry
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Confirmation state
  const [enquiryReady, setEnquiryReady] = useState(false);
  const [preparedWhatsappUrl, setPreparedWhatsappUrl] = useState('');

  // Pre-fill user data when auth user is available
  useEffect(() => {
    if (user) {
      if (!customerName && user.name) setCustomerName(user.name);
      if (!phone && user.phone) setPhone(user.phone);
      if (!email && user.email) setEmail(user.email);
    }
  }, [user]);

  // Handle WhatsApp Submission
  const handleContinueOnWhatsApp = (e) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim()) {
      setFormError('Please enter your full name so our concierge can address you.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please provide your WhatsApp contact number.');
      return;
    }

    const message = createSelectionWhatsAppMessage({
      items,
      customerName: customerName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      garmentsSubtotal,
      depositsTotal,
      grandTotal
    });

    const url = getWhatsAppUrl(message);
    setPreparedWhatsappUrl(url);
    setEnquiryReady(true);

    // Open WhatsApp
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    showToast('Your WhatsApp enquiry has been generated.');
  };

  // EMPTY SELECTION VIEW
  if (items.length === 0 && !enquiryReady) {
    return (
      <main style={{ paddingTop: '140px', minHeight: '80vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
        <div className="container" style={{ padding: '20px' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="section-tag">BESPOKE ORDER DESK</span>
            <h1 className="section-title">YOUR SELECTION</h1>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(30px, 5vw, 60px)', maxWidth: '620px', margin: '30px auto', textAlign: 'center', boxShadow: '0 10px 30px rgba(59, 29, 20, 0.06)' }}>
            <div style={{ fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '14px' }}>✦</div>
            <h2 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-dark)', marginBottom: '12px', fontWeight: 500 }}>
              YOUR SELECTION LIST IS EMPTY
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-brown)', lineHeight: 1.7, marginBottom: '28px' }}>
              Explore our handcrafted Indian wear collection to add garments for bespoke purchase or reserve an atelier rental for upcoming celebrations.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link href="/shop" className="btn btn-gold">
                EXPLORE COLLECTION
              </Link>
              <a
                href={brandInfo.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold-outline-dark"
                aria-label="Connect with Concierge on WhatsApp"
              >
                CONNECT ON WHATSAPP
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ENQUIRY PREPARED CONFIRMATION VIEW
  if (enquiryReady) {
    return (
      <main style={{ paddingTop: '140px', minHeight: '85vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
        <div className="container" style={{ maxWidth: '720px', padding: '20px' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(32px, 5vw, 54px)', textAlign: 'center', boxShadow: '0 12px 36px rgba(59, 29, 20, 0.08)' }}>
            
            <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: 'rgba(201, 160, 74, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>

            <span className="section-tag" style={{ color: 'var(--gold)' }}>WHATSAPP ENQUIRY PREPARED</span>
            <h1 className="font-serif" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', color: 'var(--brown-dark)', margin: '8px 0 16px' }}>
              Your Selection is Ready on WhatsApp
            </h1>
            <div className="gold-divider" style={{ margin: '0 auto 20px' }}><span className="gold-divider-diamond"></span></div>

            <p style={{ fontSize: '0.94rem', color: 'var(--text-brown)', lineHeight: 1.7, marginBottom: '24px' }}>
              We have generated a pre-filled enquiry message with all your selected garments, lengths, and rental periods. Send the message on WhatsApp to finalize sizing, custom alterations, and payment with our team.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
              {preparedWhatsappUrl && (
                <a
                  href={preparedWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', fontSize: '0.9rem', letterSpacing: '0.08em' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  OPEN IN WHATSAPP
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setEnquiryReady(false);
                }}
                className="btn btn-gold-outline-dark"
                style={{ fontSize: '0.82rem', padding: '10px 20px', marginTop: '6px' }}
              >
                CLEAR SELECTION &amp; START FRESH
              </button>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link href="/shop" className="btn btn-gold-outline-dark" style={{ fontSize: '0.82rem', padding: '10px 18px' }}>
                  EXPLORE MORE PIECES
                </Link>
                {isAuthenticated && (
                  <Link href="/profile" className="btn btn-gold-outline-dark" style={{ fontSize: '0.82rem', padding: '10px 18px' }}>
                    MY PROFILE
                  </Link>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-brown)', marginTop: '28px', fontStyle: 'italic' }}>
              Direct WhatsApp Concierge: +91 9560011351 &bull; Hours: 10:00 AM – 8:00 PM IST
            </p>
          </div>
        </div>
      </main>
    );
  }

  // MAIN SELECTION / REQUEST LIST VIEW
  return (
    <main style={{ paddingTop: '140px', minHeight: '80vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
      <div className="container" style={{ padding: '20px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-tag">BESPOKE ORDER DESK</span>
          <h1 className="section-title">YOUR SELECTION</h1>
          <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          <p className="section-subtitle">
            &ldquo;Review your chosen heirlooms and continue to WhatsApp to finalize bespoke measurements &amp; reservation.&rdquo;
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '36px', textAlign: 'left', maxWidth: '1140px', margin: '0 auto' }}>
          
          {/* Left Column: Items in Selection */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '14px' }}>
              <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)' }}>
                SELECTED PIECES ({items.length})
              </h2>
              <button
                type="button"
                onClick={clearCart}
                style={{ background: 'none', border: 'none', color: 'var(--text-brown)', fontSize: '0.76rem', letterSpacing: '0.08em', cursor: 'pointer', textDecoration: 'underline' }}
              >
                CLEAR ALL
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map((item) => (
                <CartItem key={item.cartItemId || item.productId} item={item} />
              ))}
            </div>

            <div style={{ marginTop: '28px', paddingTop: '18px', borderTop: '1px solid #f5efeb' }}>
              <Link href="/shop" style={{ fontSize: '0.82rem', color: 'var(--gold-dark)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.06em' }}>
                ← ADD MORE PIECES TO SELECTION
              </Link>
            </div>
          </div>

          {/* Right Column: Patron Details & Continue to WhatsApp */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)', height: 'fit-content' }}>
            <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', marginBottom: '16px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '14px' }}>
              REQUEST SUMMARY
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-brown)' }}>Garments Subtotal:</span>
              <span style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>{formatPrice(garmentsSubtotal)}</span>
            </div>

            {depositsTotal > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#065F46' }}>
                  <span>Security Deposit (Refundable):</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(depositsTotal)}</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-brown)', margin: '-4px 0 10px', fontStyle: 'italic' }}>
                  * Security deposits are 100% refunded within 48 hours following garment return &amp; atelier inspection.
                </p>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-brown)' }}>White-Glove Insured Delivery:</span>
              <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>COMPLIMENTARY</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '22px', paddingTop: '14px', borderTop: '1px solid rgba(201, 160, 74, 0.2)', fontSize: '1.15rem' }}>
              <span className="font-serif" style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>Estimated Total:</span>
              <span className="font-serif" style={{ fontWeight: 700, color: 'var(--brown-deep)' }}>{formatPrice(grandTotal)}</span>
            </div>

            {/* Form to review/pre-fill customer info */}
            <div style={{ background: 'var(--ivory)', border: '1px solid var(--gold-border)', padding: '18px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.76rem', letterSpacing: '0.12em', color: 'var(--gold-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
                  PATRON PARTICULARS
                </span>
                {isAuthenticated ? (
                  <span style={{ fontSize: '0.7rem', color: '#065F46', background: '#D1FAE5', padding: '2px 8px', borderRadius: '3px', fontWeight: 600 }}>
                    Profile Linked
                  </span>
                ) : (
                  <Link href="/login" style={{ fontSize: '0.72rem', color: 'var(--gold-dark)', textDecoration: 'underline' }}>
                    Sign in to load profile
                  </Link>
                )}
              </div>

              {formError && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '8px 12px', fontSize: '0.78rem', marginBottom: '12px', borderRadius: '2px' }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleContinueOnWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Shubha Sharma"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gold-border)', background: 'var(--white)', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    WhatsApp Phone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9560011351"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gold-border)', background: 'var(--white)', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. patron@example.com"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gold-border)', background: 'var(--white)', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    Delivery Destination / City (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. New Delhi / South City"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gold-border)', background: 'var(--white)', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    Special Notes / Styling Request (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Need delivery before Saturday, size query, etc."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gold-border)', background: 'var(--white)', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                {/* Information Banner */}
                <div style={{ marginTop: '4px', fontSize: '0.74rem', color: 'var(--text-brown)', lineHeight: 1.5, fontStyle: 'italic' }}>
                  ✦ House of Shubhanshi coordinates orders exclusively via WhatsApp. No on-site online payment is charged.
                </div>

                {/* Primary CTA */}
                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{
                    width: '100%',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    fontSize: '0.92rem',
                    letterSpacing: '0.1em',
                    marginTop: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  CONTINUE ON WHATSAPP
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

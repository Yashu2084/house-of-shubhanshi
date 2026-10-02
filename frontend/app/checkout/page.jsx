'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, brandInfo } from '../../lib/utils';
import api from '../../lib/api';

const WHATSAPP_NUMBER = '919560011351';
const DISPLAY_PHONE = '9560011351';

export default function CheckoutPage() {
  const { items, garmentsSubtotal, depositsTotal, grandTotal, clearCart, showToast } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [whatsappError, setWhatsappError] = useState('');

  // Confirmation state after WhatsApp enquiry is generated
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [createdOrderRef, setCreatedOrderRef] = useState('');
  const [lastWhatsappUrl, setLastWhatsappUrl] = useState('');

  // Pre-fill user data once auth loads
  React.useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!email) setEmail(user.email || '');
      if (!phone) setPhone(user.phone || '');
    }
  }, [user]);

  if (items.length === 0 && !enquirySuccess) {
    return (
      <main style={{ paddingTop: '140px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <div className="container" style={{ padding: '40px 20px' }}>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', marginBottom: '12px' }}>
            YOUR BAG IS EMPTY
          </h2>
          <p style={{ color: 'var(--text-brown)', marginBottom: '24px' }}>
            Add your desired couture creations or atelier rentals to proceed to checkout.
          </p>
          <Link href="/shop" className="btn btn-gold">
            EXPLORE THE COLLECTION
          </Link>
        </div>
      </main>
    );
  }

  // Generate dynamic, human-crafted WhatsApp message based on actual cart items
  const generateWhatsAppMessage = (orderNumber = '') => {
    const buyItems = items.filter(i => i.purchaseType !== 'RENT');
    const rentItems = items.filter(i => i.purchaseType === 'RENT');

    let text = `Hello House of Shubhanshi,\n\nI would like to enquire about the following order:\n\n`;

    if (buyItems.length > 0) {
      text += `--- PURCHASE PIECES ---\n`;
      buyItems.forEach((it, idx) => {
        const sizeStr = it.size ? ` (Size: ${it.size})` : '';
        const qtyStr = it.quantity > 1 ? ` x${it.quantity}` : '';
        text += `${idx + 1}. ${it.name}${sizeStr}${qtyStr} — ₹${Number(it.price * (it.quantity || 1)).toLocaleString('en-IN')}\n`;
      });
      text += `\n`;
    }

    if (rentItems.length > 0) {
      text += `--- RENTAL RESERVATIONS ---\n`;
      rentItems.forEach((it, idx) => {
        const sizeStr = it.size ? ` (Size: ${it.size})` : '';
        text += `${idx + 1}. ${it.name}${sizeStr}\n`;
        text += `   • Duration: ${it.rentalDays} Days\n`;
        if (it.rentalStartDate && it.rentalEndDate) {
          text += `   • Dates: ${it.rentalStartDate} to ${it.rentalEndDate}\n`;
        }
        text += `   • Hire Fee: ₹${Number(it.rentalPrice || 0).toLocaleString('en-IN')}\n`;
        if (it.securityDeposit > 0) {
          text += `   • Security Deposit (Refundable): ₹${Number(it.securityDeposit).toLocaleString('en-IN')}\n`;
        }
      });
      text += `\n`;
    }

    text += `Garments Total: ₹${Number(garmentsSubtotal).toLocaleString('en-IN')}\n`;
    if (depositsTotal > 0) {
      text += `Refundable Security Deposit: ₹${Number(depositsTotal).toLocaleString('en-IN')}\n`;
    }
    text += `Estimated Total: ₹${Number(grandTotal).toLocaleString('en-IN')}\n\n`;

    text += `Customer Details:\n`;
    text += `• Name: ${name.trim()}\n`;
    text += `• Phone: ${phone.trim()}\n`;
    if (email.trim()) {
      text += `• Email: ${email.trim()}\n`;
    }
    text += `• Delivery Address: ${shippingAddress.trim()}\n`;

    if (notes.trim()) {
      text += `• Special Notes: ${notes.trim()}\n`;
    }

    if (orderNumber) {
      text += `\nOrder Reference: #${orderNumber}\n`;
    }

    text += `\nPlease share the further instructions for completing my order.\n\nThank you.`;
    return text;
  };

  const handleWhatsAppCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setWhatsappError('');

    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide a valid contact phone number.');
      return;
    }
    if (!shippingAddress.trim()) {
      setError('Please provide your complete delivery address.');
      return;
    }

    try {
      setSubmitting(true);

      let orderNumber = `HS${Math.floor(10000 + Math.random() * 90000)}`;

      // 1. Persist order in PostgreSQL if backend is reachable
      try {
        const orderItemsPayload = items.map(i => ({
          productId: i.productId,
          productName: i.purchaseType === 'RENT' ? `${i.name} (Rental - ${i.rentalDays} Days)` : i.name,
          quantity: i.quantity || 1,
          price: i.purchaseType === 'RENT' ? i.rentalPrice : i.price,
          purchaseType: i.purchaseType || 'BUY',
          rentalDays: i.rentalDays || null,
          rentalStartDate: i.rentalStartDate || null,
          rentalEndDate: i.rentalEndDate || null
        }));

        const res = await api.post('/orders', {
          items: orderItemsPayload,
          shippingAddress: shippingAddress.trim(),
          phone: phone.trim(),
          paymentMethod: 'WHATSAPP_ENQUIRY',
          status: 'WHATSAPP_ENQUIRY',
          notes: notes.trim() || undefined
        });

        if (res && res.data && res.data.orderNumber) {
          orderNumber = res.data.orderNumber;
        }
      } catch (orderErr) {
        console.warn('Backend order recording notice (proceeding with direct WhatsApp enquiry):', orderErr.message);
      }

      setCreatedOrderRef(orderNumber);

      // 2. Generate pre-filled message and WhatsApp URL
      const message = generateWhatsAppMessage(orderNumber);
      const encodedMsg = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMsg}`;
      setLastWhatsappUrl(whatsappUrl);

      // 3. Clear Bag
      clearCart();
      setEnquirySuccess(true);

      // 4. Open WhatsApp
      const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = whatsappUrl;
      } else {
        const opened = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          setWhatsappError(`Popup was blocked. Please click the button below to open WhatsApp, or contact us directly at ${DISPLAY_PHONE}.`);
        }
      }

      showToast('WhatsApp enquiry generated.');
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Unable to prepare WhatsApp enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS CONFIRMATION VIEW
  if (enquirySuccess) {
    return (
      <main style={{ paddingTop: '140px', minHeight: '85vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
        <div className="container" style={{ maxWidth: '720px', padding: '20px' }}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(32px, 5vw, 54px)', textAlign: 'center', boxShadow: '0 12px 36px rgba(59, 29, 20, 0.08)' }}>
            
            <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: 'rgba(201, 160, 74, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </div>

            <span className="section-tag" style={{ color: 'var(--gold)' }}>WHATSAPP ENQUIRY READY</span>
            <h1 className="font-serif" style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', color: 'var(--brown-dark)', margin: '8px 0 16px' }}>
              Your enquiry is ready on WhatsApp.
            </h1>
            <div className="gold-divider" style={{ margin: '0 auto 20px' }}><span className="gold-divider-diamond"></span></div>

            <p style={{ fontSize: '1rem', color: 'var(--text-brown)', lineHeight: 1.7, marginBottom: '20px' }}>
              Please send the pre-filled message on WhatsApp to complete your order discussion with our atelier concierge.
            </p>

            {createdOrderRef && (
              <div style={{ display: 'inline-block', background: 'var(--ivory)', border: '1px solid var(--gold-border)', padding: '8px 18px', borderRadius: '4px', fontSize: '0.9rem', color: 'var(--brown-dark)', fontWeight: 600, marginBottom: '24px' }}>
                Enquiry Reference: <span style={{ color: 'var(--gold-dark)' }}>#{createdOrderRef}</span>
              </div>
            )}

            {whatsappError && (
              <div className="auth-alert error" style={{ textAlign: 'left', marginBottom: '20px' }}>
                {whatsappError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', marginTop: '10px' }}>
              {lastWhatsappUrl && (
                <a
                  href={lastWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', fontSize: '0.9rem', letterSpacing: '0.08em' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  OPEN WHATSAPP NOW
                </a>
              )}

              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
                <Link href="/shop" className="btn btn-gold-outline-dark" style={{ fontSize: '0.82rem', padding: '10px 20px' }}>
                  EXPLORE MORE CREATIONS
                </Link>
                {isAuthenticated && (
                  <Link href="/customer" className="btn btn-gold-outline-dark" style={{ fontSize: '0.82rem', padding: '10px 20px' }}>
                    VIEW MY ATELIER CLOSET
                  </Link>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-brown)', marginTop: '28px', fontStyle: 'italic' }}>
              Need immediate help? Reach our team directly via voice or message at +91 {DISPLAY_PHONE}.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: '140px', minHeight: '85vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
      <div className="container" style={{ maxWidth: '1100px', padding: '20px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="section-tag">BESPOKE ORDER COMPLETION</span>
          <h1 className="section-title">ENQUIRE &amp; RESERVE</h1>
          <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          <p className="section-subtitle">
            Confirm your details below to continue on WhatsApp with our atelier team.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          
          {/* Left Column: Client Details Form */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)', boxShadow: '0 4px 20px rgba(59, 29, 20, 0.04)' }}>
            <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', marginBottom: '20px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '12px' }}>
              CLIENT &amp; DELIVERY PARTICULARS
            </h2>

            {error && (
              <div className="auth-alert error" role="alert" style={{ marginBottom: '18px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleWhatsAppCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
              
              <div className="form-group">
                <label className="form-label" htmlFor="checkoutName">Full Name *</label>
                <input
                  type="text"
                  id="checkoutName"
                  className="form-input"
                  placeholder="e.g. Shubha Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkoutPhone">WhatsApp / Contact Phone *</label>
                <input
                  type="tel"
                  id="checkoutPhone"
                  className="form-input"
                  placeholder="e.g. 9560011351"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkoutEmail">Email Address (Optional)</label>
                <input
                  type="email"
                  id="checkoutEmail"
                  className="form-input"
                  placeholder="e.g. shubha@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkoutAddress">Delivery Address / Destination City *</label>
                <textarea
                  id="checkoutAddress"
                  className="form-input"
                  rows="3"
                  placeholder="House/Apartment number, street, city, state, and pincode..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="checkoutNotes">Styling, Sizing, or Date Notes (Optional)</label>
                <input
                  type="text"
                  id="checkoutNotes"
                  className="form-input"
                  placeholder="e.g. Need delivery before Saturday, size adjustments, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Notice explaining WhatsApp Enquiry */}
              <div style={{ background: 'var(--ivory)', borderLeft: '3px solid var(--gold)', padding: '14px 16px', margin: '6px 0 10px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--brown-dark)', margin: 0, lineHeight: 1.6 }}>
                  <strong>How WhatsApp Checkout Works:</strong> Clicking the button below opens WhatsApp with your pre-filled order details ready to send. Our team will verify garment availability, sizing, and payment instructions directly with you.
                </p>
              </div>

              {/* Primary Luxury CTA Button */}
              <button
                type="submit"
                className="btn btn-gold"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '0.94rem',
                  letterSpacing: '0.12em',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                {submitting ? 'PREPARING WHATSAPP ENQUIRY...' : 'CONTINUE ON WHATSAPP'}
              </button>
            </form>
          </div>

          {/* Right Column: Order Review */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)', height: 'fit-content', boxShadow: '0 4px 20px rgba(59, 29, 20, 0.04)' }}>
            <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', marginBottom: '20px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '12px' }}>
              ORDER SUMMARY ({items.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {items.map((item) => {
                const isRental = item.purchaseType === 'RENT';
                return (
                  <div key={item.cartItemId || item.productId} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #f5efeb', paddingBottom: '12px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '56px', height: '64px', objectFit: 'contain', background: 'var(--ivory)', border: '1px solid var(--gold-border)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.62rem', letterSpacing: '0.1em', padding: '1px 5px', borderRadius: '2px', background: isRental ? 'rgba(6, 95, 70, 0.1)' : 'rgba(201, 160, 74, 0.15)', color: isRental ? '#065F46' : 'var(--gold-dark)', fontWeight: 600 }}>
                          {isRental ? 'RENTAL' : 'BUY'}
                        </span>
                        <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{item.name}</div>
                      </div>
                      
                      {isRental ? (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-brown)', marginTop: '3px' }}>
                          Duration: {item.rentalDays} Days ({item.rentalStartDate} &rarr; {item.rentalEndDate})
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-brown)', marginTop: '3px' }}>
                          Purchase &bull; Qty: {item.quantity} {item.size ? `&bull; Size: ${item.size}` : ''}
                        </div>
                      )}

                      <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--gold-dark)', marginTop: '3px' }}>
                        {formatPrice(isRental ? item.rentalPrice : item.price * (item.quantity || 1))}
                        {isRental && item.securityDeposit > 0 && ` + ${formatPrice(item.securityDeposit)} Deposit`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-brown)' }}>Garments Total:</span>
              <span style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>{formatPrice(garmentsSubtotal)}</span>
            </div>

            {depositsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: '#065F46' }}>
                <span>Security Deposit (Refundable):</span>
                <span style={{ fontWeight: 600 }}>{formatPrice(depositsTotal)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-brown)' }}>Delivery:</span>
              <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>COMPLIMENTARY</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(201, 160, 74, 0.2)', fontSize: '1.2rem' }}>
              <span className="font-serif" style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>Grand Total:</span>
              <span className="font-serif" style={{ fontWeight: 700, color: 'var(--brown-deep)' }}>{formatPrice(grandTotal)}</span>
            </div>

            <div style={{ marginTop: '20px', padding: '12px', background: 'var(--ivory)', border: '1px solid var(--gold-border)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-brown)' }}>
              No online card or UPI payment required now. Our team will verify and coordinate your order directly over WhatsApp.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../lib/utils';
import api from '../../lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, garmentsSubtotal, depositsTotal, grandTotal, clearCart, showToast } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [phone, setPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PAID');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (items.length === 0) {
    return (
      <main style={{ paddingTop: '140px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <h2 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', marginBottom: '12px' }}>
          YOUR BAG IS EMPTY
        </h2>
        <p style={{ color: 'var(--text-brown)', marginBottom: '24px' }}>
          Add your desired couture creations or atelier rentals to proceed to checkout.
        </p>
        <Link href="/shop" className="btn btn-gold">
          EXPLORE SHOP
        </Link>
      </main>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('Please provide a complete delivery address.');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide a valid contact phone number.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

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
        shippingAddress,
        phone,
        paymentMethod
      });

      if (res && res.success) {
        clearCart();
        showToast(`Order #${res.data?.orderNumber || ''} successfully placed!`);
        router.push('/customer');
      } else {
        throw new Error(res?.message || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      setError(err.message || 'Failed to process order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ paddingTop: '140px', minHeight: '85vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
      <div className="container" style={{ maxWidth: '1050px', padding: '20px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="section-tag">BESPOKE ORDER COMPLETION</span>
          <h1 className="section-title">FINAL ATELIER CHECKOUT</h1>
          <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          
          {/* Left Column: Client Details & Shipping Form */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)' }}>
            <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', marginBottom: '20px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '12px' }}>
              CLIENT &amp; DELIVERY PARTICULARS
            </h2>

            {!isAuthenticated && !authLoading ? (
              <div style={{ background: 'var(--ivory)', borderLeft: '3px solid var(--gold)', padding: '16px', marginBottom: '24px' }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--brown-dark)', lineHeight: 1.6, marginBottom: '14px' }}>
                  To secure your dress reservations and enable real-time delivery tracking, please sign in or register your private atelier account.
                </p>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Link href="/login?redirect=/checkout" className="btn btn-gold" style={{ padding: '10px 18px', fontSize: '0.8rem' }}>
                    SIGN IN TO ACCOUNT
                  </Link>
                  <Link href="/signup?redirect=/checkout" className="btn btn-gold-outline-dark" style={{ padding: '10px 18px', fontSize: '0.8rem' }}>
                    CREATE PRIVATE ACCOUNT
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {error && (
                  <div className="auth-alert error" style={{ margin: '0 0 10px' }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Client Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={user?.name || ''}
                    disabled
                    style={{ background: '#FDFBF7' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Client Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={user?.email || ''}
                    disabled
                    style={{ background: '#FDFBF7' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="checkoutPhone">Contact Phone *</label>
                  <input
                    type="tel"
                    id="checkoutPhone"
                    className="form-input"
                    placeholder="+91 9560011351"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="checkoutAddress">Delivery Suite / Full Address *</label>
                  <textarea
                    id="checkoutAddress"
                    className="form-input"
                    rows="3"
                    placeholder="Enter complete building, street, landmark, city and pincode..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="checkoutPayment">Payment Preference</label>
                  <select
                    id="checkoutPayment"
                    className="form-input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="PAID">Card / UPI / NetBanking (Instant Confirmation)</option>
                    <option value="COD">Cash on Delivery / Concierge Delivery</option>
                    <option value="PENDING">Direct Bank Transfer / Private Invoice</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={submitting}
                  style={{ width: '100%', marginTop: '12px', padding: '16px', letterSpacing: '0.12em' }}
                >
                  {submitting
                    ? 'TRANSMITTING ORDER & LOCKING RESERVATIONS...'
                    : `PLACE ORDER • ${formatPrice(grandTotal)}`}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Order Review */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)', height: 'fit-content' }}>
            <h2 className="font-serif" style={{ fontSize: '1.45rem', color: 'var(--brown-dark)', marginBottom: '20px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '12px' }}>
              ORDER REVIEW ({items.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              {items.map((item) => {
                const isRental = item.purchaseType === 'RENT';
                return (
                  <div key={item.cartItemId || item.productId} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #f5efeb', paddingBottom: '12px' }}>
                    <img src={item.image} alt={item.name} style={{ width: '56px', height: '64px', objectFit: 'contain', background: 'var(--ivory)', border: '1px solid var(--gold-border)' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--brown-dark)' }}>{item.name}</div>
                      {isRental ? (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-brown)' }}>
                          Rental &bull; {item.rentalDays} Days ({item.rentalStartDate} &rarr; {item.rentalEndDate})
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-brown)' }}>
                          Purchase &bull; Qty: {item.quantity}
                        </div>
                      )}
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--gold-dark)', marginTop: '2px' }}>
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
              <span style={{ color: 'var(--text-brown)' }}>White-Glove Delivery:</span>
              <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>COMPLIMENTARY</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(201, 160, 74, 0.2)', fontSize: '1.2rem' }}>
              <span className="font-serif" style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>Grand Total:</span>
              <span className="font-serif" style={{ fontWeight: 700, color: 'var(--brown-deep)' }}>{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice, brandInfo } from '../../lib/utils';
import CartItem from '../../components/CartItem';

export default function CartPage() {
  const { items, garmentsSubtotal, depositsTotal, grandTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (items.length === 0) {
    return (
      <main style={{ paddingTop: '140px', minHeight: '80vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
        <div className="container" style={{ padding: '20px' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="section-tag">BESPOKE ORDER DESK</span>
            <h1 className="section-title">YOUR CURATED BAG</h1>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(30px, 5vw, 60px)', maxWidth: '620px', margin: '30px auto', textAlign: 'center', boxShadow: '0 10px 30px rgba(59, 29, 20, 0.06)' }}>
            <div style={{ fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '14px' }}>✦</div>
            <h2 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-dark)', marginBottom: '12px', fontWeight: 500 }}>
              YOUR BAG AWAITS YOUR SELECTION
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-brown)', lineHeight: 1.7, marginBottom: '28px' }}>
              Explore our signature creations for permanent acquisition or reserve an atelier dress rental for your upcoming celebrations.
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
                CONNECT WITH CONCIERGE
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: '140px', minHeight: '80vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
      <div className="container" style={{ padding: '20px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="section-tag">BESPOKE ORDER DESK</span>
          <h1 className="section-title">YOUR CURATED BAG</h1>
          <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          <p className="section-subtitle">
            &ldquo;Each piece tailored to your exact measurements with uncompromised devotion.&rdquo;
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', textAlign: 'left', maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Cart Items List */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '14px' }}>
              <h2 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-dark)' }}>
                SELECTED HEIRLOOMS ({items.length})
              </h2>
              <button
                type="button"
                onClick={clearCart}
                style={{ background: 'none', border: 'none', color: 'var(--text-brown)', fontSize: '0.76rem', letterSpacing: '0.08em', cursor: 'pointer', textDecoration: 'underline' }}
              >
                CLEAR BAG
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {items.map((item) => (
                <CartItem key={item.cartItemId || item.productId} item={item} />
              ))}
            </div>
          </div>

          {/* Cart Summary & Checkout Link */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)', height: 'fit-content' }}>
            <h2 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-dark)', marginBottom: '16px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '14px' }}>
              BESPOKE SUMMARY
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-brown)' }}>Garment Subtotal:</span>
              <span style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>{formatPrice(garmentsSubtotal)}</span>
            </div>

            {depositsTotal > 0 && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem', color: '#065F46' }}>
                  <span>Security Deposit (100% Refundable):</span>
                  <span style={{ fontWeight: 600 }}>{formatPrice(depositsTotal)}</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-brown)', margin: '-4px 0 10px', fontStyle: 'italic' }}>
                  * Security deposits are refunded within 48 hours following garment return &amp; atelier inspection.
                </p>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-brown)' }}>White-Glove Insured Delivery:</span>
              <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>COMPLIMENTARY</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', paddingTop: '14px', borderTop: '1px solid rgba(201, 160, 74, 0.2)', fontSize: '1.15rem' }}>
              <span className="font-serif" style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>Total Amount Payable:</span>
              <span className="font-serif" style={{ fontWeight: 700, color: 'var(--brown-deep)' }}>{formatPrice(grandTotal)}</span>
            </div>

            <Link
              href="/checkout"
              className="btn btn-gold"
              style={{ width: '100%', textAlign: 'center', display: 'block', padding: '16px' }}
            >
              PROCEED TO CHECKOUT &bull; {formatPrice(grandTotal)}
            </Link>

            {!isAuthenticated && (
              <p style={{ fontSize: '0.76rem', color: 'var(--text-brown)', textAlign: 'center', marginTop: '12px' }}>
                You can sign in or create your private account during checkout.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

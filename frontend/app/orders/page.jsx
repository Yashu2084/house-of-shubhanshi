'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { formatPrice, formatDisplayDate } from '../../lib/utils';
import OrderTimeline from '../../components/OrderTimeline';

function OrdersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const singleOrderId = searchParams.get('id');

  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
      return;
    }

    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated, authLoading, router]);

  async function loadOrders() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/orders');
      if (res && res.success) {
        setOrders(res.data || []);
      } else {
        throw new Error(res?.message || 'Failed to retrieve orders');
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Unable to connect to archive.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-brown)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--gold)', marginBottom: '8px' }}>✦</p>
        <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
          Retrieving your bespoke orders from the House archive...
        </p>
      </div>
    );
  }

  const displayedOrders = singleOrderId
    ? orders.filter(o => o.id === singleOrderId || o.orderNumber === singleOrderId)
    : orders;

  return (
    <div>
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
        <span className="section-tag">ATELIER CHRONICLE &bull; FULFILLMENT STATUS</span>
        <h1 className="section-title">YOUR BESPOKE ORDERS</h1>
        <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
        <p className="section-subtitle">
          &ldquo;Follow the journey of each handcrafted silhouette from needlework to your personal closet.&rdquo;
        </p>
      </div>

      {singleOrderId && (
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/orders" className="btn btn-gold-outline-dark" style={{ padding: '8px 18px', fontSize: '0.8rem' }}>
            &larr; VIEW ALL ORDERS
          </Link>
        </div>
      )}

      {error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#991B1B' }}>
          <p>{error}</p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(30px, 5vw, 60px)', maxWidth: '620px', margin: '30px auto', textAlign: 'center', boxShadow: '0 10px 30px rgba(59, 29, 20, 0.06)' }}>
          <div style={{ fontSize: '2.2rem', color: 'var(--gold)', marginBottom: '14px' }}>✦</div>
          <h2 className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-dark)', marginBottom: '12px', fontWeight: 500 }}>
            YOU HAVEN&apos;T PLACED AN ORDER YET
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-brown)', lineHeight: 1.7, marginBottom: '28px' }}>
            Explore our curated collections of heirloom bridal silks, zardozi kurtas, and artisanal drapes.
          </p>
          <Link href="/shop" className="btn btn-gold">
            EXPLORE ATELIER COLLECTION
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {displayedOrders.map((order) => {
            const hasRental = order.items && order.items.some(i => i.purchaseType === 'RENT');
            return (
              <div key={order.id} className="dash-panel" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 3.5vw, 36px)', boxShadow: '0 8px 24px rgba(59, 29, 20, 0.04)' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '14px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', letterSpacing: '0.16em', color: 'var(--gold)', textTransform: 'uppercase' }}>
                      ORDER IDENTIFIER
                    </span>
                    <h3 className="font-serif" style={{ fontSize: '1.35rem', color: 'var(--brown-dark)', marginTop: '2px' }}>
                      #{order.orderNumber}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-brown)' }}>
                      Placed on {formatDisplayDate(order.createdAt)}
                    </span>
                    <div style={{ marginTop: '4px' }}>
                      <span className={`badge-status badge-status-${(order.status || 'received').toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <OrderTimeline status={order.status} isRental={hasRental} />

                {/* Items in order */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '20px 0' }}>
                  {order.items && order.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ivory)', padding: '12px 16px', borderLeft: '3px solid var(--gold)' }}>
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--brown-dark)' }}>
                          {item.productName || item.product?.name || 'Atelier Creation'}
                        </div>
                        {item.purchaseType === 'RENT' && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-brown)', marginTop: '2px' }}>
                            Rental Duration: {item.rentalDays} Days ({item.rentalStartDate} &rarr; {item.rentalEndDate})
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--brown-deep)' }}>
                          {formatPrice(item.price * (item.quantity || 1))}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-brown)' }}>
                          Qty: {item.quantity || 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderTop: '1px solid rgba(201, 160, 74, 0.2)', paddingTop: '14px' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-brown)' }}>
                    <span>Delivery Address: </span>
                    <strong style={{ color: 'var(--brown-dark)' }}>{order.shippingAddress || 'On file'}</strong>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontFamily: 'var(--font-serif)', color: 'var(--brown-deep)', fontWeight: 700 }}>
                    Total: {formatPrice(order.totalAmount)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <main style={{ paddingTop: '140px', minHeight: '85vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
      <div className="container" style={{ maxWidth: '900px', padding: '20px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>}>
          <OrdersListContent />
        </Suspense>
      </div>
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';
import { formatPrice, formatDisplayDate } from '../../lib/utils';
import OrderTimeline from '../../components/OrderTimeline';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, logout, refreshUser } = useAuth();
  const { showToast } = useCart();

  const [activeSection, setActiveSection] = useState('overview'); // overview, orders, rentals, spending, profile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/customer');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);
      const [analyticsRes, ordersRes, rentalsRes] = await Promise.all([
        api.get('/orders/analytics').catch(() => null),
        api.get('/orders').catch(() => null),
        api.get('/customer/rentals').catch(() => null)
      ]);

      if (analyticsRes && analyticsRes.success) setAnalytics(analyticsRes.data);
      if (ordersRes && ordersRes.success) setOrders(ordersRes.data || []);
      if (rentalsRes && rentalsRes.success) setRentals(rentalsRes.data || []);
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileMsg('');
      const res = await api.patch('/customer/profile', {
        name: profileName,
        phone: profilePhone
      });
      if (res && res.success) {
        showToast('Private profile updated successfully.');
        setProfileMsg('Profile updated successfully.');
        refreshUser();
      }
    } catch (err) {
      console.error('Profile update failed:', err);
      setProfileMsg(err.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  if (authLoading || (!isAuthenticated && !user)) {
    return (
      <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--gold)' }}>✦</p>
        <p style={{ color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading your customer dashboard...
        </p>
      </main>
    );
  }

  const firstName = (user?.name || 'Patron').split(' ')[0].toUpperCase();

  return (
    <main style={{ paddingTop: '110px', minHeight: '85vh', backgroundColor: '#FDFBF7' }}>
      <div className="dashboard-layout-wrap" style={{ display: 'flex', minHeight: '80vh' }}>
        
        {/* Mobile Toggle Button */}
        <button
          type="button"
          className="mobile-dash-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 90, background: 'var(--brown-dark)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '50px', padding: '10px 18px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.08em', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
        >
          {sidebarOpen ? '✕ CLOSE MENU' : '✦ DASHBOARD MENU'}
        </button>

        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '280px', background: 'var(--white)', borderRight: '1px solid var(--gold-border)', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase' }}>
              PRIVATE PATRON
            </span>
            <h3 className="font-serif sidebar-user-name" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', margin: '4px 0 2px' }}>
              {user?.name}
            </h3>
            <p className="sidebar-user-email" style={{ fontSize: '0.78rem', color: 'var(--text-brown)' }}>
              {user?.email}
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'overview' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'overview' ? 600 : 400 }}
            >
              ✦ Atelier Overview
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveSection('orders'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'orders' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'orders' ? 600 : 400 }}
            >
              ✦ Bespoke Orders ({orders.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'rentals' ? 'active' : ''}`}
              onClick={() => { setActiveSection('rentals'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'rentals' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'rentals' ? 600 : 400 }}
            >
              ✦ Dress Rentals ({rentals.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'spending' ? 'active' : ''}`}
              onClick={() => { setActiveSection('spending'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'spending' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'spending' ? 600 : 400 }}
            >
              ✦ Spending &amp; Deposits
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={() => { setActiveSection('profile'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'profile' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'profile' ? 600 : 400 }}
            >
              ✦ Profile Settings
            </button>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--gold-border)' }}>
            <button
              type="button"
              onClick={logout}
              style={{ background: 'none', border: 'none', color: '#991B1B', fontSize: '0.82rem', letterSpacing: '0.08em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              &rarr; SIGN OUT
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <div style={{ flex: 1, padding: 'clamp(20px, 4vw, 48px)', maxWidth: '1200px' }}>
          
          {/* Section: Overview */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ marginBottom: '32px' }}>
                <span className="section-tag">PRIVATE WARDROBE PORTFOLIO</span>
                <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: 'var(--brown-dark)', margin: '4px 0 8px' }}>
                  WELCOME BACK, {firstName}
                </h1>
                <p style={{ color: 'var(--text-brown)', fontSize: '0.88rem' }}>
                  Your private portal for bespoke Indian luxury couture acquisitions and dress rentals.
                </p>
              </div>

              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '36px' }}>
                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Total Spent</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {formatPrice(analytics?.totalSpent || 0)}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gold-dark)' }}>Lifetime Atelier Devotion</span>
                </div>

                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Total Orders</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {analytics?.totalOrders || orders.length}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-brown)' }}>Bespoke Acquisitions</span>
                </div>

                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Active Orders</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {analytics?.activeOrders || 0}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#065F46' }}>In Crafting &bull; In Transit</span>
                </div>

                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', borderRadius: '2px' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Active Rentals</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {rentals.filter(r => r.status === 'ACTIVE' || r.status === 'RESERVED').length}
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gold-dark)' }}>Curated Garments Reserved</span>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(20px, 3vw, 32px)', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '18px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '12px' }}>
                  <h2 className="font-serif" style={{ fontSize: '1.35rem', color: 'var(--brown-dark)' }}>
                    RECENT COMMISSIONS
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveSection('orders')}
                    style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    VIEW ALL ({orders.length}) &rarr;
                  </button>
                </div>

                {orders.length === 0 ? (
                  <p style={{ color: 'var(--text-brown)', fontSize: '0.88rem' }}>No orders placed yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ivory)', padding: '14px 18px', borderLeft: '3px solid var(--gold)' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--brown-dark)', fontSize: '0.95rem' }}>
                            Order #{order.orderNumber}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-brown)', marginTop: '2px' }}>
                            {formatDisplayDate(order.createdAt)} &bull; {order.items?.length || 1} Item(s)
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: 'var(--brown-deep)' }}>
                            {formatPrice(order.totalAmount)}
                          </div>
                          <span className={`badge-status badge-status-${(order.status || 'received').toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Orders */}
          {activeSection === 'orders' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">COMMISSIONS &amp; HISTORICAL PURCHASES</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: '4px 0 8px' }}>
                  YOUR BESPOKE ORDERS
                </h1>
              </div>

              {orders.length === 0 ? (
                <div style={{ background: 'var(--white)', padding: '40px', border: '1px solid var(--gold-border)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-brown)', marginBottom: '16px' }}>No orders found in your client archive.</p>
                  <Link href="/shop" className="btn btn-gold">EXPLORE SHOP</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {orders.map((order) => (
                    <div key={order.id} style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--gold)', letterSpacing: '0.1em' }}>ORDER #{order.orderNumber}</span>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-brown)' }}>Placed on {formatDisplayDate(order.createdAt)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge-status badge-status-${(order.status || 'received').toLowerCase().replace(/_/g, '-')}`}>
                            {order.status}
                          </span>
                          <div style={{ fontWeight: 700, color: 'var(--brown-deep)', marginTop: '4px' }}>
                            {formatPrice(order.totalAmount)}
                          </div>
                        </div>
                      </div>

                      <OrderTimeline status={order.status} isRental={order.items?.some(i => i.purchaseType === 'RENT')} />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                        {order.items?.map(it => (
                          <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', background: 'var(--ivory)', padding: '8px 12px' }}>
                            <span>{it.productName || it.product?.name} (x{it.quantity})</span>
                            <span style={{ fontWeight: 600 }}>{formatPrice(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Rentals */}
          {activeSection === 'rentals' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">ATELIER RENTAL CONCIERGE</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: '4px 0 8px' }}>
                  YOUR DRESS RENTALS
                </h1>
                <p style={{ color: 'var(--text-brown)', fontSize: '0.88rem' }}>
                  Manage reserved dates, active garment care, and refundable security deposit statuses.
                </p>
              </div>

              {rentals.length === 0 ? (
                <div style={{ background: 'var(--white)', padding: '40px', border: '1px solid var(--gold-border)', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-brown)', marginBottom: '16px' }}>You currently have no active or historical dress rentals.</p>
                  <Link href="/shop" className="btn btn-gold">EXPLORE RENTABLE PIECES</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {rentals.map((rental) => (
                    <div key={rental.id} style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '12px', marginBottom: '14px' }}>
                        <div>
                          <h3 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)' }}>
                            {rental.product?.name || 'Atelier Garment'}
                          </h3>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-brown)', marginTop: '2px' }}>
                            Reserved Period: <strong>{rental.startDate}</strong> &rarr; <strong>{rental.endDate}</strong> ({rental.rentalDays} Days)
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge-status badge-status-${(rental.status || 'reserved').toLowerCase().replace(/_/g, '-')}`}>
                            {rental.status}
                          </span>
                          <div style={{ fontSize: '0.78rem', color: rental.depositStatus === 'REFUNDED' ? '#065F46' : 'var(--gold-dark)', fontWeight: 600, marginTop: '4px' }}>
                            Deposit ({formatPrice(rental.securityDeposit)}): {rental.depositStatus}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                        <span>Rental Hire Fee: <strong>{formatPrice(rental.rentalPrice)}</strong></span>
                        <span>Total Paid: <strong>{formatPrice(rental.totalPrice)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Spending */}
          {activeSection === 'spending' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">FINANCIAL LEDGER &bull; PATRON SPENDING</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: '4px 0 8px' }}>
                  SPENDING &amp; DEPOSITS
                </h1>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-brown)' }}>TOTAL LIFETIME SPENT</span>
                    <div className="font-serif" style={{ fontSize: '2rem', color: 'var(--brown-deep)', fontWeight: 700 }}>
                      {formatPrice(analytics?.totalSpent || 0)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-brown)' }}>ACTIVE SECURITY DEPOSITS HELD</span>
                    <div className="font-serif" style={{ fontSize: '2rem', color: 'var(--gold-dark)', fontWeight: 700 }}>
                      {formatPrice(rentals.filter(r => r.depositStatus === 'HELD').reduce((s, r) => s + (r.securityDeposit || 0), 0))}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.82rem', color: 'var(--text-brown)', lineHeight: 1.7, borderTop: '1px solid #f5efeb', paddingTop: '16px' }}>
                  ✦ Security deposits for rental pieces are automatically refunded to your original payment method within 48 hours of return inspection.
                </p>
              </div>
            </div>
          )}

          {/* Section: Profile */}
          {activeSection === 'profile' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">PERSONAL PARTICULAR PRIVILEGES</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: '4px 0 8px' }}>
                  CLIENT PROFILE SETTINGS
                </h1>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '32px', maxWidth: '600px' }}>
                {profileMsg && (
                  <div className={`auth-alert ${profileMsg.includes('success') ? 'success' : 'error'}`} style={{ marginBottom: '18px' }}>
                    {profileMsg}
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address (Read-Only)</label>
                    <input
                      type="email"
                      className="form-input"
                      value={user?.email || ''}
                      disabled
                      style={{ background: '#FDFBF7' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-gold"
                    disabled={profileSaving}
                    style={{ marginTop: '8px', padding: '14px' }}
                  >
                    {profileSaving ? 'SAVING CHANGES...' : 'UPDATE PATRON PROFILE'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}

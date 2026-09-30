'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';
import { formatPrice, formatDisplayDate } from '../../lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
  const { showToast } = useCart();

  const [activeSection, setActiveSection] = useState('overview'); // overview, orders, products, collections, rentals, customers, analytics
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = create
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  // Product Form state
  const [prodForm, setProdForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 45000,
    collectionId: '',
    category: 'COUTURE',
    fabric: '',
    color: '',
    size: 'S, M, L',
    image: '/assets/images/collection/noor-set.jpg',
    stock: 5,
    isRentable: true,
    rentalBasePrice: 4500,
    rentalPricePerDay: 1200,
    rentalDeposit: 10000,
    minimumRentalDays: 1,
    maximumRentalDays: 30,
    rentalAvailableStock: 2,
    isActive: true
  });

  // Collection Form state
  const [colForm, setColForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '/assets/images/collection/noor-set.jpg',
    isActive: true
  });

  // Route protection
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login?redirect=/admin');
      } else if (!isAdmin) {
        router.push('/customer');
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const loadAllAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        overviewRes,
        ordersRes,
        productsRes,
        collectionsRes,
        rentalsRes,
        customersRes,
        analyticsRes
      ] = await Promise.all([
        api.get('/admin/overview').catch(() => null),
        api.get('/admin/orders').catch(() => null),
        api.get('/products?includeInactive=true').catch(() => null),
        api.get('/collections?includeInactive=true').catch(() => null),
        api.get('/admin/rentals').catch(() => null),
        api.get('/admin/customers').catch(() => null),
        api.get('/admin/analytics/sales?range=30d').catch(() => null)
      ]);

      if (overviewRes && overviewRes.success) setOverview(overviewRes.data);
      if (ordersRes && ordersRes.success) setOrders(ordersRes.data || []);
      if (productsRes && productsRes.success) setProducts(productsRes.data || []);
      if (collectionsRes && collectionsRes.success) setCollections(collectionsRes.data || []);
      if (rentalsRes && rentalsRes.success) {
        setRentals(rentalsRes.data?.rentals || rentalsRes.data || []);
      }
      if (customersRes && customersRes.success) setCustomers(customersRes.data || []);
      if (analyticsRes && analyticsRes.success) setAnalytics(analyticsRes.data);

    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin, loadAllAdminData]);

  // Order status update
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      if (res && res.success) {
        showToast(`Order status updated to ${newStatus}`);
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Rental status update
  const handleRentalStatusUpdate = async (rentalId, newStatus) => {
    try {
      const res = await api.patch(`/admin/rentals/${rentalId}/status`, { status: newStatus });
      if (res && res.success) {
        showToast(`Rental status updated to ${newStatus}`);
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update rental status');
    }
  };

  // Rental deposit update
  const handleRentalDepositUpdate = async (rentalId, newDepositStatus) => {
    try {
      const res = await api.patch(`/admin/rentals/${rentalId}/deposit`, { depositStatus: newDepositStatus });
      if (res && res.success) {
        showToast(`Deposit status updated to ${newDepositStatus}`);
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update deposit status');
    }
  };

  // Product Save (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, prodForm);
        showToast(`"${prodForm.name}" updated successfully.`);
      } else {
        await api.post('/products', prodForm);
        showToast(`"${prodForm.name}" added to atelier vault.`);
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      loadAllAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId, name) => {
    if (!window.confirm(`Are you sure you want to deactivate or remove "${name}"?`)) return;
    try {
      await api.delete(`/products/${productId}`);
      showToast(`Piece "${name}" removed from active catalog.`);
      loadAllAdminData();
    } catch (err) {
      alert(err.message || 'Failed to remove piece');
    }
  };

  // Open Edit Product
  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    setProdForm({
      name: prod.name || '',
      slug: prod.slug || '',
      description: prod.description || '',
      price: prod.price || 0,
      collectionId: prod.collectionId || '',
      category: prod.category || 'COUTURE',
      fabric: prod.fabric || '',
      color: prod.color || '',
      size: prod.size || '',
      image: prod.image || '/assets/images/collection/noor-set.jpg',
      stock: prod.stock || 1,
      isRentable: !!prod.isRentable,
      rentalBasePrice: prod.rentalBasePrice || 0,
      rentalPricePerDay: prod.rentalPricePerDay || 0,
      rentalDeposit: prod.rentalDeposit || 0,
      minimumRentalDays: prod.minimumRentalDays || 1,
      maximumRentalDays: prod.maximumRentalDays || 30,
      rentalAvailableStock: prod.rentalAvailableStock || 1,
      isActive: prod.isActive !== undefined ? prod.isActive : true
    });
    setProductModalOpen(true);
  };

  // Collection Save (Create or Update)
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        await api.put(`/collections/${editingCollection.id}`, colForm);
        showToast(`Collection "${colForm.name}" updated.`);
      } else {
        await api.post('/collections', colForm);
        showToast(`Collection "${colForm.name}" created.`);
      }
      setCollectionModalOpen(false);
      setEditingCollection(null);
      loadAllAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save collection');
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--gold)' }}>✦</p>
        <p style={{ color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Verifying administrator credentials...
        </p>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: '110px', minHeight: '85vh', backgroundColor: '#FDFBF7' }}>
      <div className="dashboard-layout-wrap" style={{ display: 'flex', minHeight: '80vh' }}>
        
        {/* Mobile Toggle */}
        <button
          type="button"
          className="mobile-dash-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 90, background: 'var(--brown-dark)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '50px', padding: '10px 18px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.08em', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}
        >
          {sidebarOpen ? '✕ CLOSE' : '✦ CONTROL ROOM'}
        </button>

        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: '280px', background: 'var(--white)', borderRight: '1px solid var(--gold-border)', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div>
            <span style={{ fontSize: '0.7rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600 }}>
              HOUSE CONTROL ROOM
            </span>
            <h3 className="font-serif sidebar-user-name" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', margin: '4px 0 2px' }}>
              Atelier Administrator
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
              ✦ Orders ({orders.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveSection('products'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'products' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'products' ? 600 : 400 }}
            >
              ✦ Products &amp; Vault ({products.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'collections' ? 'active' : ''}`}
              onClick={() => { setActiveSection('collections'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'collections' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'collections' ? 600 : 400 }}
            >
              ✦ Collections ({collections.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'rentals' ? 'active' : ''}`}
              onClick={() => { setActiveSection('rentals'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'rentals' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'rentals' ? 600 : 400 }}
            >
              ✦ Rental Reservations ({rentals.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'customers' ? 'active' : ''}`}
              onClick={() => { setActiveSection('customers'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'customers' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'customers' ? 600 : 400 }}
            >
              ✦ Patrons &amp; Clients ({customers.length})
            </button>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'analytics' ? 'active' : ''}`}
              onClick={() => { setActiveSection('analytics'); setSidebarOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.86rem', color: activeSection === 'analytics' ? 'var(--gold-dark)' : 'var(--brown-dark)', fontWeight: activeSection === 'analytics' ? 600 : 400 }}
            >
              ✦ Sales Analytics
            </button>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--gold-border)' }}>
            <button
              type="button"
              onClick={logout}
              style={{ background: 'none', border: 'none', color: '#991B1B', fontSize: '0.82rem', letterSpacing: '0.08em', cursor: 'pointer' }}
            >
              &rarr; SIGN OUT
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <div style={{ flex: 1, padding: 'clamp(20px, 4vw, 48px)', maxWidth: '1280px', overflowX: 'auto' }}>
          
          {/* Section: Overview */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
                <div>
                  <span className="section-tag">EXECUTIVE METRICS &bull; REAL-TIME POSTGRESQL</span>
                  <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', color: 'var(--brown-dark)', margin: '4px 0' }}>
                    ATELIER OVERVIEW
                  </h1>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={() => {
                      setEditingProduct(null);
                      setProdForm({
                        name: '',
                        slug: '',
                        description: '',
                        price: 50000,
                        collectionId: collections[0]?.id || '',
                        category: 'COUTURE',
                        fabric: 'Pure Silk',
                        color: 'Terracotta',
                        size: 'S, M, L',
                        image: '/assets/images/collection/shubh-lehenga.jpg',
                        stock: 5,
                        isRentable: true,
                        rentalBasePrice: 4500,
                        rentalPricePerDay: 1200,
                        rentalDeposit: 10000,
                        minimumRentalDays: 1,
                        maximumRentalDays: 30,
                        rentalAvailableStock: 2,
                        isActive: true
                      });
                      setProductModalOpen(true);
                    }}
                    style={{ padding: '10px 18px', fontSize: '0.8rem' }}
                  >
                    + ADD NEW PIECE
                  </button>
                  <button
                    type="button"
                    className="btn btn-gold-outline-dark"
                    onClick={() => {
                      setEditingCollection(null);
                      setColForm({
                        name: '',
                        slug: '',
                        description: '',
                        image: '/assets/images/collection/noor-set.jpg',
                        isActive: true
                      });
                      setCollectionModalOpen(true);
                    }}
                    style={{ padding: '10px 18px', fontSize: '0.8rem' }}
                  >
                    + NEW COLLECTION
                  </button>
                </div>
              </div>

              {/* Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '18px', marginBottom: '36px' }}>
                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Gross Sales</span>
                  <div className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {formatPrice(overview?.totalSales || 0)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)' }}>Verified Order Volume</span>
                </div>

                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Commissions</span>
                  <div className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {overview?.totalOrders || orders.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>Total Placed Orders</span>
                </div>

                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Active Vault Pieces</span>
                  <div className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {products.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#065F46' }}>In Online Catalog</span>
                </div>

                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Active Patrons</span>
                  <div className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {customers.length || overview?.totalCustomers || 1}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)' }}>Registered Private Clients</span>
                </div>

                <div className="dash-stat-card" style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>Dress Rentals</span>
                  <div className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {rentals.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)' }}>Active &bull; Reserved</span>
                </div>
              </div>

              {/* Recent Orders Table */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', marginBottom: '32px' }}>
                <h3 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--brown-dark)', marginBottom: '16px' }}>
                  LATEST CLIENT COMMISSIONS
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Order #</th>
                        <th style={{ padding: '10px' }}>Date</th>
                        <th style={{ padding: '10px' }}>Client</th>
                        <th style={{ padding: '10px' }}>Items</th>
                        <th style={{ padding: '10px' }}>Total</th>
                        <th style={{ padding: '10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 6).map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>#{order.orderNumber}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-brown)' }}>{formatDisplayDate(order.createdAt)}</td>
                          <td style={{ padding: '12px 10px' }}>{order.user?.name || order.phone || 'Private Patron'}</td>
                          <td style={{ padding: '12px 10px' }}>{order.items?.length || 1} item(s)</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{formatPrice(order.totalAmount)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className={`badge-status badge-status-${(order.status || 'received').toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Orders Management */}
          {activeSection === 'orders' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">FULFILLMENT &amp; LOGISTICS</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                  ORDER STATUS MANAGEMENT
                </h1>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Order #</th>
                        <th style={{ padding: '10px' }}>Client</th>
                        <th style={{ padding: '10px' }}>Phone / Shipping</th>
                        <th style={{ padding: '10px' }}>Amount</th>
                        <th style={{ padding: '10px' }}>Status Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                            #{order.orderNumber}
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>{formatDisplayDate(order.createdAt)}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>{order.user?.name || 'Patron'}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>{order.user?.email}</div>
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '0.8rem', maxWidth: '240px' }}>
                            <div>{order.phone}</div>
                            <div style={{ color: 'var(--text-brown)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {order.shippingAddress}
                            </div>
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>
                            {formatPrice(order.totalAmount)}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              value={order.status}
                              onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                              style={{ padding: '6px 10px', border: '1px solid var(--gold-border)', background: 'var(--ivory)', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              <option value="RECEIVED">RECEIVED</option>
                              <option value="DISPATCHED">DISPATCHED</option>
                              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Products Management */}
          {activeSection === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
                <div>
                  <span className="section-tag">CATALOG &bull; VAULT INVENTORY</span>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                    PRODUCT VAULT MANAGEMENT
                  </h1>
                </div>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductModalOpen(true);
                  }}
                  style={{ padding: '10px 18px', fontSize: '0.8rem' }}
                >
                  + ADD PIECE
                </button>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Piece</th>
                        <th style={{ padding: '10px' }}>Category</th>
                        <th style={{ padding: '10px' }}>Purchase Price</th>
                        <th style={{ padding: '10px' }}>Rental Price</th>
                        <th style={{ padding: '10px' }}>Rental Stock</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((prod) => (
                        <tr key={prod.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={prod.image} alt={prod.name} style={{ width: '48px', height: '56px', objectFit: 'contain', background: 'var(--ivory)', border: '1px solid var(--gold-border)' }} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{prod.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>{prod.fabric}</div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{prod.category}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{formatPrice(prod.price)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            {prod.isRentable ? `${formatPrice(prod.rentalBasePrice)} base` : 'Not Rentable'}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {prod.isRentable ? `${prod.rentalAvailableStock || 1} units` : '-'}
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => openEditProduct(prod)}
                                style={{ background: 'none', border: '1px solid var(--gold-border)', padding: '4px 8px', fontSize: '0.76rem', cursor: 'pointer' }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', fontSize: '0.76rem', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Rentals Management */}
          {activeSection === 'rentals' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">RESERVATION DESK &bull; SECURITY DEPOSITS</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                  RENTAL RESERVATIONS &amp; DEPOSITS
                </h1>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Garment</th>
                        <th style={{ padding: '10px' }}>Patron</th>
                        <th style={{ padding: '10px' }}>Reserved Dates</th>
                        <th style={{ padding: '10px' }}>Rental Fee</th>
                        <th style={{ padding: '10px' }}>Deposit Status</th>
                        <th style={{ padding: '10px' }}>Status Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentals.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{r.product?.name || 'Garment'}</td>
                          <td style={{ padding: '12px 10px' }}>{r.user?.name || 'Client'}</td>
                          <td style={{ padding: '12px 10px', fontSize: '0.8rem' }}>
                            {r.startDate} &rarr; {r.endDate} ({r.rentalDays}d)
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{formatPrice(r.rentalPrice)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              value={r.depositStatus || 'HELD'}
                              onChange={(e) => handleRentalDepositUpdate(r.id, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '0.78rem', border: '1px solid var(--gold-border)', background: 'var(--ivory)' }}
                            >
                              <option value="HELD">HELD ({formatPrice(r.securityDeposit)})</option>
                              <option value="REFUNDED">REFUNDED</option>
                              <option value="FORFEITED">FORFEITED</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              value={r.status || 'RESERVED'}
                              onChange={(e) => handleRentalStatusUpdate(r.id, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '0.78rem', border: '1px solid var(--gold-border)', background: 'var(--ivory)' }}
                            >
                              <option value="RESERVED">RESERVED</option>
                              <option value="ACTIVE">ACTIVE</option>
                              <option value="RETURN_PENDING">RETURN PENDING</option>
                              <option value="RETURNED">RETURNED</option>
                              <option value="OVERDUE">OVERDUE</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Collections */}
          {activeSection === 'collections' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '24px' }}>
                <div>
                  <span className="section-tag">CURATIONS &bull; CAPSULES</span>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                    ATELIER CURATED EDITIONS
                  </h1>
                </div>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => {
                    setEditingCollection(null);
                    setCollectionModalOpen(true);
                  }}
                  style={{ padding: '10px 18px', fontSize: '0.8rem' }}
                >
                  + ADD COLLECTION
                </button>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Name</th>
                        <th style={{ padding: '10px' }}>Slug</th>
                        <th style={{ padding: '10px' }}>Description</th>
                        <th style={{ padding: '10px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collections.map((col) => (
                        <tr key={col.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{col.name}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-brown)' }}>{col.slug}</td>
                          <td style={{ padding: '12px 10px', maxWidth: '300px' }}>{col.description}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className="badge-status badge-status-active" style={{ fontSize: '0.7rem' }}>ACTIVE</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Customers */}
          {activeSection === 'customers' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">PATRON ROLL &bull; CLIENT DIRECTORY</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                  REGISTERED PRIVATE CLIENTELE
                </h1>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Client</th>
                        <th style={{ padding: '10px' }}>Email</th>
                        <th style={{ padding: '10px' }}>Phone</th>
                        <th style={{ padding: '10px' }}>Role</th>
                        <th style={{ padding: '10px' }}>Joined Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{c.name}</td>
                          <td style={{ padding: '12px 10px' }}>{c.email}</td>
                          <td style={{ padding: '12px 10px' }}>{c.phone || '-'}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className="badge-status badge-status-active" style={{ fontSize: '0.68rem' }}>{c.role}</span>
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-brown)' }}>{formatDisplayDate(c.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Section: Analytics */}
          {activeSection === 'analytics' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">FINANCIAL DISPATCHES &bull; RUNWAY METRICS</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                  SALES &amp; REVENUE ANALYTICS
                </h1>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '28px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>TOTAL RECORDED SALES</span>
                    <div className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-deep)', fontWeight: 700 }}>
                      {formatPrice(analytics?.totalSales || overview?.totalSales || 0)}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>AVERAGE ORDER VALUE</span>
                    <div className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--gold-dark)', fontWeight: 700 }}>
                      {formatPrice(analytics?.averageOrderValue || 0)}
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', lineHeight: 1.7 }}>
                  ✦ All transactions and deposits are recorded in the PostgreSQL database. Security deposits are tracked independently and held in escrow until rental garment returns are inspected by master karigars.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {productModalOpen && (
        <div className="modal-backdrop open" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '640px', padding: '30px' }}>
            <button type="button" className="modal-close-btn" onClick={() => setProductModalOpen(false)}>&times;</button>
            <h2 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-dark)', marginBottom: '16px' }}>
              {editingProduct ? 'EDIT ATELIER PIECE' : 'ADD NEW ATELIER PIECE'}
            </h2>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '6px' }}>
              <div className="form-group">
                <label className="form-label">Garment Name *</label>
                <input type="text" className="form-input" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-input" rows="2" value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} required></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹) *</label>
                  <input type="number" className="form-input" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" className="form-input" value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Fabric</label>
                  <input type="text" className="form-input" value={prodForm.fabric} onChange={(e) => setProdForm({ ...prodForm, fabric: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input type="text" className="form-input" value={prodForm.color} onChange={(e) => setProdForm({ ...prodForm, color: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Image Asset URL *</label>
                <input type="text" className="form-input" value={prodForm.image} onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })} required />
              </div>

              {/* Rental Parameters */}
              <div style={{ background: 'var(--ivory)', padding: '14px', border: '1px solid var(--gold-border)', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input type="checkbox" id="modalRentable" checked={prodForm.isRentable} onChange={(e) => setProdForm({ ...prodForm, isRentable: e.target.checked })} />
                  <label htmlFor="modalRentable" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brown-dark)', cursor: 'pointer' }}>
                    Available for Dress Rental
                  </label>
                </div>

                {prodForm.isRentable && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Rental Base Price (₹)</label>
                      <input type="number" className="form-input" value={prodForm.rentalBasePrice} onChange={(e) => setProdForm({ ...prodForm, rentalBasePrice: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Per Day Additional (₹)</label>
                      <input type="number" className="form-input" value={prodForm.rentalPricePerDay} onChange={(e) => setProdForm({ ...prodForm, rentalPricePerDay: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Security Deposit (₹)</label>
                      <input type="number" className="form-input" value={prodForm.rentalDeposit} onChange={(e) => setProdForm({ ...prodForm, rentalDeposit: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Rental Stock</label>
                      <input type="number" className="form-input" value={prodForm.rentalAvailableStock} onChange={(e) => setProdForm({ ...prodForm, rentalAvailableStock: parseInt(e.target.value, 10) || 1 })} />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-gold" style={{ marginTop: '12px', padding: '14px' }}>
                SAVE PIECE TO ATELIER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Collection Add/Edit Modal */}
      {collectionModalOpen && (
        <div className="modal-backdrop open" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '500px', padding: '30px' }}>
            <button type="button" className="modal-close-btn" onClick={() => setCollectionModalOpen(false)}>&times;</button>
            <h2 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-dark)', marginBottom: '16px' }}>
              {editingCollection ? 'EDIT COLLECTION' : 'NEW ATELIER COLLECTION'}
            </h2>

            <form onSubmit={handleSaveCollection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Collection Name *</label>
                <input type="text" className="form-input" value={colForm.name} onChange={(e) => setColForm({ ...colForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" value={colForm.description} onChange={(e) => setColForm({ ...colForm, description: e.target.value })}></textarea>
              </div>
              <button type="submit" className="btn btn-gold" style={{ marginTop: '10px', padding: '14px' }}>
                SAVE COLLECTION
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}

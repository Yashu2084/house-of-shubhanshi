'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Navigation tab: overview, orders, whatsapp, rentals, products, collections, customers, analytics, settings
  const [activeSection, setActiveSection] = useState('overview');
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
  const [analyticsRange, setAnalyticsRange] = useState('30d');

  // Filters & Search
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);

  // File Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const productFileInputRef = useRef(null);
  const collectionFileInputRef = useRef(null);

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Product Form state
  const [prodForm, setProdForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: 4499,
    compareAtPrice: '',
    collectionId: '',
    category: 'Suit Sets',
    fabric: 'Silk Blend & Organza',
    color: 'Purple',
    size: 'S, M, L, XL',
    image: '/images/products/purple-suit-set.webp',
    stock: 5,
    isRentable: true,
    rentalBasePrice: 1199,
    rentalPricePerDay: 350,
    rentalDeposit: 2500,
    minimumRentalDays: 2,
    maximumRentalDays: 14,
    rentalAvailableStock: 2,
    isActive: true,
    featured: false
  });

  // Collection Form state
  const [colForm, setColForm] = useState({
    name: '',
    slug: '',
    description: '',
    image: '/images/future/future-01.webp',
    isActive: true
  });

  // Route protection: Only users with verified role === 'ADMIN' can view
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/admin/login');
      } else if (!isAdmin) {
        router.push('/customer');
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  const loadAllAdminData = useCallback(async (currentRange = analyticsRange) => {
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
        api.get(`/admin/sales?range=${currentRange}`).catch(() => null)
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
  }, [analyticsRange]);

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin, loadAllAdminData]);

  // Handle analytics range change
  const handleRangeChange = async (range) => {
    setAnalyticsRange(range);
    try {
      const res = await api.get(`/admin/sales?range=${range}`);
      if (res && res.success) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error('Failed to update analytics range:', err);
    }
  };

  // Image File Upload Handler
  const handleImageUpload = (e, formType = 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('Image file size must be less than 12MB');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result;
      try {
        const res = await api.post('/admin/upload', {
          imageBase64: base64,
          filename: file.name
        });
        if (res && res.success && res.data) {
          const finalUrl = res.data.url || res.data.dataUri;
          if (formType === 'product') {
            setProdForm(prev => ({ ...prev, image: finalUrl }));
          } else {
            setColForm(prev => ({ ...prev, image: finalUrl }));
          }
          showToast('Image uploaded and optimized to WebP successfully!');
        }
      } catch (uploadErr) {
        console.warn('Backend file write failed, using secure base64 data URI fallback:', uploadErr);
        if (formType === 'product') {
          setProdForm(prev => ({ ...prev, image: base64 }));
        } else {
          setColForm(prev => ({ ...prev, image: base64 }));
        }
        showToast('Image attached successfully.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

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
        showToast(`Rental reservation updated to ${newStatus}`);
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
        showToast(`Security deposit status updated to ${newDepositStatus}`);
        loadAllAdminData();
      }
    } catch (err) {
      alert(err.message || 'Failed to update deposit status');
    }
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...prodForm,
        price: parseFloat(prodForm.price) || 0,
        compareAtPrice: prodForm.compareAtPrice ? parseFloat(prodForm.compareAtPrice) : null,
        stock: parseInt(prodForm.stock, 10) || 0,
        rentalBasePrice: parseFloat(prodForm.rentalBasePrice) || 0,
        rentalPricePerDay: parseFloat(prodForm.rentalPricePerDay) || 0,
        rentalDeposit: parseFloat(prodForm.rentalDeposit) || 0,
        rentalAvailableStock: parseInt(prodForm.rentalAvailableStock, 10) || 1,
        minimumRentalDays: parseInt(prodForm.minimumRentalDays, 10) || 1,
        maximumRentalDays: parseInt(prodForm.maximumRentalDays, 10) || 14
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showToast(`"${prodForm.name}" updated successfully.`);
      } else {
        await api.post('/products', payload);
        showToast(`"${prodForm.name}" added to Atelier vault.`);
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
    if (!window.confirm(`Are you sure you want to deactivate "${name}" from the active catalog?`)) return;
    try {
      await api.delete(`/products/${productId}`);
      showToast(`Piece "${name}" deactivated from catalog.`);
      loadAllAdminData();
    } catch (err) {
      alert(err.message || 'Failed to deactivate piece');
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
      compareAtPrice: prod.compareAtPrice || '',
      collectionId: prod.collectionId || '',
      category: prod.category || 'Suit Sets',
      fabric: prod.fabric || '',
      color: prod.color || '',
      size: prod.size || 'S, M, L, XL',
      image: prod.image || '/images/products/purple-suit-set.webp',
      stock: prod.stock !== undefined ? prod.stock : 5,
      isRentable: !!prod.isRentable,
      rentalBasePrice: prod.rentalBasePrice || 0,
      rentalPricePerDay: prod.rentalPricePerDay || 0,
      rentalDeposit: prod.rentalDeposit || 0,
      minimumRentalDays: prod.minimumRentalDays || 2,
      maximumRentalDays: prod.maximumRentalDays || 14,
      rentalAvailableStock: prod.rentalAvailableStock || 1,
      isActive: prod.isActive !== undefined ? prod.isActive : true,
      featured: !!prod.featured
    });
    setProductModalOpen(true);
  };

  // Save Collection (Create or Update)
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

  // Change Admin Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordMsg({ text: '', type: '' });
      const res = await api.post('/admin/change-password', {
        currentPassword,
        newPassword
      });
      if (res && res.success) {
        setPasswordMsg({ text: 'Password successfully updated! Please store your new credentials safely.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Administrator password updated successfully.');
      }
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Failed to update password. Please check your current password.', type: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Filtered orders & whatsapp enquiries
  const whatsappOrders = orders.filter(o => 
    o.status === 'WHATSAPP_ENQUIRY' || o.status === 'PENDING_WHATSAPP_CONFIRMATION'
  );

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase();
      const numMatch = (o.orderNumber || '').toLowerCase().includes(q);
      const nameMatch = (o.user?.name || o.shippingAddress || '').toLowerCase().includes(q);
      const phoneMatch = (o.phone || '').toLowerCase().includes(q);
      return numMatch || nameMatch || phoneMatch;
    }
    return true;
  });

  const filteredProducts = products.filter(p => {
    if (productCategoryFilter !== 'ALL' && p.category !== productCategoryFilter) return false;
    return true;
  });

  if (authLoading || !isAdmin) {
    return (
      <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: '#FDFBF7' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--gold)' }}>✦</p>
        <p style={{ color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.85rem' }}>
          Verifying administrator credentials...
        </p>
      </main>
    );
  }

  return (
    <main style={{ paddingTop: '100px', minHeight: '85vh', backgroundColor: '#FDFBF7' }}>
      <div className="dashboard-layout-wrap" style={{ display: 'flex', minHeight: '82vh' }}>
        
        {/* Mobile Sidebar Toggle Button */}
        <button
          type="button"
          className="mobile-dash-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 900,
            background: 'var(--brown-dark)',
            color: 'var(--gold)',
            border: '1px solid var(--gold)',
            borderRadius: '50px',
            padding: '12px 20px',
            cursor: 'pointer',
            fontSize: '0.82rem',
            letterSpacing: '0.12em',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{sidebarOpen ? '✕' : '✦'}</span>
          <span>{sidebarOpen ? 'CLOSE MENU' : 'ATELIER MENU'}</span>
        </button>

        {/* Sidebar Navigation */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`} style={{
          width: '280px',
          background: 'var(--white)',
          borderRight: '1px solid var(--gold-border)',
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          flexShrink: 0
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>✦</span>
              <span style={{ fontSize: '0.68rem', letterSpacing: '0.22em', color: 'var(--gold-dark)', textTransform: 'uppercase', fontWeight: 600 }}>
                ATELIER CONTROL ROOM
              </span>
            </div>
            <h3 className="font-serif sidebar-user-name" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', margin: '2px 0' }}>
              House of Shubhanshi
            </h3>
            <p className="sidebar-user-email" style={{ fontSize: '0.76rem', color: 'var(--text-brown)', wordBreak: 'break-all' }}>
              {user?.email}
            </p>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              type="button"
              className={`sidebar-link ${activeSection === 'overview' ? 'active' : ''}`}
              onClick={() => { setActiveSection('overview'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'overview' ? 'rgba(201, 160, 74, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'overview' ? '3px solid var(--gold)' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'overview' ? 'var(--brown-dark)' : 'var(--text-brown)',
                fontWeight: activeSection === 'overview' ? 600 : 400
              }}
            >
              ✦ Atelier Overview
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeSection === 'whatsapp' ? 'active' : ''}`}
              onClick={() => { setActiveSection('whatsapp'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'whatsapp' ? 'rgba(37, 211, 102, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'whatsapp' ? '3px solid #25D366' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'whatsapp' ? '#0D6832' : 'var(--brown-dark)',
                fontWeight: activeSection === 'whatsapp' ? 600 : 500,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>💬 WhatsApp Enquiries</span>
              {whatsappOrders.length > 0 && (
                <span style={{
                  background: '#25D366',
                  color: '#fff',
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {whatsappOrders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeSection === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveSection('orders'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'orders' ? 'rgba(201, 160, 74, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'orders' ? '3px solid var(--gold)' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'orders' ? 'var(--brown-dark)' : 'var(--text-brown)',
                fontWeight: activeSection === 'orders' ? 600 : 400
              }}
            >
              📦 All Orders ({orders.length})
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeSection === 'rentals' ? 'active' : ''}`}
              onClick={() => { setActiveSection('rentals'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'rentals' ? 'rgba(201, 160, 74, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'rentals' ? '3px solid var(--gold)' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'rentals' ? 'var(--brown-dark)' : 'var(--text-brown)',
                fontWeight: activeSection === 'rentals' ? 600 : 400
              }}
            >
              👗 Rental Reservations ({rentals.length})
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeSection === 'products' ? 'active' : ''}`}
              onClick={() => { setActiveSection('products'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'products' ? 'rgba(201, 160, 74, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'products' ? '3px solid var(--gold)' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'products' ? 'var(--brown-dark)' : 'var(--text-brown)',
                fontWeight: activeSection === 'products' ? 600 : 400
              }}
            >
              ✨ Products Vault ({products.length})
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeSection === 'collections' ? 'active' : ''}`}
              onClick={() => { setActiveSection('collections'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'collections' ? 'rgba(201, 160, 74, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'collections' ? '3px solid var(--gold)' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'collections' ? 'var(--brown-dark)' : 'var(--text-brown)',
                fontWeight: activeSection === 'collections' ? 600 : 400
              }}
            >
              🏷 Collections ({collections.length})
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeSection === 'customers' ? 'active' : ''}`}
              onClick={() => { setActiveSection('customers'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'customers' ? 'rgba(201, 160, 74, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'customers' ? '3px solid var(--gold)' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'customers' ? 'var(--brown-dark)' : 'var(--text-brown)',
                fontWeight: activeSection === 'customers' ? 600 : 400
              }}
            >
              👥 Patrons &amp; Clients ({customers.length})
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeSection === 'analytics' ? 'active' : ''}`}
              onClick={() => { setActiveSection('analytics'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'analytics' ? 'rgba(201, 160, 74, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'analytics' ? '3px solid var(--gold)' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'analytics' ? 'var(--brown-dark)' : 'var(--text-brown)',
                fontWeight: activeSection === 'analytics' ? 600 : 400
              }}
            >
              📈 Sales Analytics
            </button>

            <button
              type="button"
              className={`sidebar-link ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => { setActiveSection('settings'); setSidebarOpen(false); }}
              style={{
                textAlign: 'left',
                background: activeSection === 'settings' ? 'rgba(201, 160, 74, 0.12)' : 'none',
                border: 'none',
                borderLeft: activeSection === 'settings' ? '3px solid var(--gold)' : '3px solid transparent',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '0.84rem',
                color: activeSection === 'settings' ? 'var(--brown-dark)' : 'var(--text-brown)',
                fontWeight: activeSection === 'settings' ? 600 : 400
              }}
            >
              ⚙ Settings &amp; Security
            </button>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--gold-border)' }}>
            <button
              type="button"
              onClick={logout}
              style={{
                background: 'none',
                border: 'none',
                color: '#991B1B',
                fontSize: '0.8rem',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600
              }}
            >
              &rarr; SIGN OUT OF ATELIER
            </button>
          </div>
        </aside>

        {/* Content Pane */}
        <div style={{ flex: 1, padding: 'clamp(20px, 3.5vw, 40px)', maxWidth: '1240px', overflowX: 'auto' }}>
          
          {/* =========================================================================
             SECTION: OVERVIEW
             ========================================================================= */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '14px', marginBottom: '28px' }}>
                <div>
                  <span className="section-tag">EXECUTIVE METRICS &bull; REAL-TIME POSTGRESQL</span>
                  <h1 className="font-serif" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', color: 'var(--brown-dark)', margin: '4px 0' }}>
                    ATELIER OVERVIEW
                  </h1>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={() => {
                      setEditingProduct(null);
                      setProdForm({
                        name: '',
                        slug: '',
                        description: '',
                        price: 4999,
                        compareAtPrice: '',
                        collectionId: collections[0]?.id || '',
                        category: 'Suit Sets',
                        fabric: 'Silk Blend & Organza',
                        color: 'Purple',
                        size: 'S, M, L, XL',
                        image: '/images/products/purple-suit-set.webp',
                        stock: 5,
                        isRentable: true,
                        rentalBasePrice: 1199,
                        rentalPricePerDay: 350,
                        rentalDeposit: 2500,
                        minimumRentalDays: 2,
                        maximumRentalDays: 14,
                        rentalAvailableStock: 2,
                        isActive: true,
                        featured: false
                      });
                      setProductModalOpen(true);
                    }}
                    style={{ padding: '10px 18px', fontSize: '0.78rem' }}
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
                        image: '/images/future/future-01.webp',
                        isActive: true
                      });
                      setCollectionModalOpen(true);
                    }}
                    style={{ padding: '10px 18px', fontSize: '0.78rem' }}
                  >
                    + NEW COLLECTION
                  </button>
                </div>
              </div>

              {/* 8 Executive Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL SALES</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {formatPrice(overview?.totalSales || 0)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)' }}>Verified Order Volume</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL ORDERS</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {overview?.totalOrders || orders.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>Client Orders</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid #25D366', padding: '20px', backgroundColor: 'rgba(37, 211, 102, 0.04)' }}>
                  <span style={{ fontSize: '0.68rem', color: '#0D6832', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>WHATSAPP ENQUIRIES</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: '#0D6832', fontWeight: 700, margin: '6px 0 2px' }}>
                    {whatsappOrders.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#0D6832' }}>Awaiting Confirmation</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL RENTALS</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {overview?.rentals?.total || rentals.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)' }}>Reservations Logged</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL CUSTOMERS</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {customers.length || overview?.totalCustomers || 0}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>Registered Patrons</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>TOTAL PRODUCTS</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {products.length}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#065F46' }}>In Atelier Vault</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PENDING ORDERS</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: '#B45309', fontWeight: 700, margin: '6px 0 2px' }}>
                    {overview?.pendingOrders || 0}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#B45309' }}>Requiring Action</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>PENDING RENTALS</span>
                  <div className="font-serif" style={{ fontSize: '1.6rem', color: '#B45309', fontWeight: 700, margin: '6px 0 2px' }}>
                    {overview?.pendingRentals || 0}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#B45309' }}>Active / Reserved</span>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--brown-dark)' }}>
                    RECENT ORDERS &amp; ENQUIRIES
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveSection('orders')}
                    style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    View All &rarr;
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Order #</th>
                        <th style={{ padding: '10px' }}>Date</th>
                        <th style={{ padding: '10px' }}>Patron</th>
                        <th style={{ padding: '10px' }}>Items</th>
                        <th style={{ padding: '10px' }}>Total</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 8).map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>#{order.orderNumber}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-brown)' }}>{formatDisplayDate(order.createdAt)}</td>
                          <td style={{ padding: '12px 10px' }}>{order.user?.name || order.shippingAddress?.split(',')[0] || 'Private Client'}</td>
                          <td style={{ padding: '12px 10px' }}>{order.items?.length || 1} piece(s)</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{formatPrice(order.totalAmount)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className={`badge-status badge-status-${(order.status || 'received').toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {order.phone && (
                              <a
                                href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  background: '#25D366',
                                  color: '#fff',
                                  padding: '4px 10px',
                                  fontSize: '0.72rem',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: 600
                                }}
                              >
                                💬 WhatsApp
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             SECTION: DEDICATED WHATSAPP ENQUIRIES
             ========================================================================= */}
          {activeSection === 'whatsapp' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag" style={{ color: '#0D6832' }}>CONCIERGE &bull; WHATSAPP ENQUIRIES</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                  WHATSAPP ENQUIRY INBOX
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-brown)', marginTop: '4px' }}>
                  Orders placed through the website requiring client conversation, bespoke measurements, and date verification.
                </p>
              </div>

              {whatsappOrders.length === 0 ? (
                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '40px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-brown)' }}>No pending WhatsApp enquiries at this time. All enquiries are confirmed!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {whatsappOrders.map((order) => {
                    const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
                    const hasRental = order.items?.some(i => i.purchaseType === 'RENT');
                    return (
                      <div key={order.id} style={{
                        background: 'var(--white)',
                        border: '1px solid #25D366',
                        padding: '24px',
                        boxShadow: '0 4px 16px rgba(37, 211, 102, 0.08)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid rgba(201, 160, 74, 0.2)', paddingBottom: '14px', marginBottom: '16px' }}>
                          <div>
                            <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--gold-dark)', textTransform: 'uppercase' }}>
                              ENQUIRY #{order.orderNumber} &bull; {formatDisplayDate(order.createdAt)}
                            </span>
                            <h3 className="font-serif" style={{ fontSize: '1.35rem', color: 'var(--brown-dark)', margin: '4px 0' }}>
                              {order.user?.name || order.shippingAddress?.split(',')[0] || 'Patron'} ({order.phone})
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-brown)' }}>
                              Shipping Address: <strong style={{ color: 'var(--brown-dark)' }}>{order.shippingAddress}</strong>
                            </p>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brown-deep)' }}>
                              {formatPrice(order.totalAmount)}
                            </div>
                            <span className="badge-status badge-status-whatsapp-enquiry" style={{ marginTop: '4px' }}>
                              💬 WHATSAPP ENQUIRY
                            </span>
                          </div>
                        </div>

                        {/* Items in enquiry */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0' }}>
                          {order.items?.map(it => (
                            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ivory)', padding: '10px 14px', fontSize: '0.86rem' }}>
                              <div>
                                <span style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>{it.productName || it.product?.name} (x{it.quantity})</span>
                                {it.purchaseType === 'RENT' && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--gold-dark)', marginTop: '2px' }}>
                                    Rental Duration: {it.rentalDays} Days ({it.rentalStartDate} &rarr; {it.rentalEndDate})
                                  </div>
                                )}
                              </div>
                              <span style={{ fontWeight: 600 }}>{formatPrice(it.price * (it.quantity || 1))}</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello! Thank you for reaching out to House of Shubhanshi regarding your order #${order.orderNumber}. We are delighted to assist you with sizing, fitting, and delivery.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn"
                              style={{
                                background: '#25D366',
                                color: '#fff',
                                padding: '10px 20px',
                                fontSize: '0.76rem',
                                border: 'none'
                              }}
                            >
                              💬 OPEN WHATSAPP CHAT
                            </a>
                          )}

                          <button
                            type="button"
                            className="btn btn-gold"
                            onClick={() => handleOrderStatusUpdate(order.id, 'CONFIRMED')}
                            style={{ padding: '10px 20px', fontSize: '0.76rem' }}
                          >
                            ✓ MARK AS CONFIRMED
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOrderStatusUpdate(order.id, 'CANCELLED')}
                            style={{
                              background: 'none',
                              border: '1px solid #DC2626',
                              color: '#991B1B',
                              padding: '10px 18px',
                              fontSize: '0.76rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✕ CANCEL ENQUIRY
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
             SECTION: ALL ORDERS MANAGEMENT
             ========================================================================= */}
          {activeSection === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <span className="section-tag">LOGISTICS &amp; FULFILLMENT</span>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                    ALL CLIENT COMMISSIONS ({filteredOrders.length})
                  </h1>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Search by order #, patron, phone..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.84rem', border: '1px solid var(--gold-border)', background: 'var(--white)', minWidth: '220px' }}
                  />

                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{ padding: '8px 12px', fontSize: '0.84rem', border: '1px solid var(--gold-border)', background: 'var(--white)' }}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="WHATSAPP_ENQUIRY">WhatsApp Enquiry</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="DISPATCHED">Dispatched</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Order #</th>
                        <th style={{ padding: '10px' }}>Client</th>
                        <th style={{ padding: '10px' }}>Phone / Shipping</th>
                        <th style={{ padding: '10px' }}>Amount</th>
                        <th style={{ padding: '10px' }}>Current Status</th>
                        <th style={{ padding: '10px' }}>Update Status</th>
                        <th style={{ padding: '10px' }}>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>#{order.orderNumber}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 600 }}>{order.user?.name || 'Private Client'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-brown)' }}>{order.user?.email || 'Guest Patron'}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>{order.phone || 'On file'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-brown)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {order.shippingAddress}
                            </div>
                          </td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{formatPrice(order.totalAmount)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span className={`badge-status badge-status-${(order.status || 'received').toLowerCase().replace(/_/g, '-')}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              value={order.status}
                              onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '0.78rem', border: '1px solid var(--gold-border)', background: 'var(--white)' }}
                            >
                              <option value="WHATSAPP_ENQUIRY">💬 WhatsApp Enquiry</option>
                              <option value="CONFIRMED">✓ Confirmed</option>
                              <option value="DISPATCHED">📦 Dispatched</option>
                              <option value="OUT_FOR_DELIVERY">🚚 Out for Delivery</option>
                              <option value="DELIVERED">✨ Delivered</option>
                              <option value="CANCELLED">✕ Cancelled</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {order.phone && (
                              <a
                                href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ background: '#25D366', color: '#fff', padding: '4px 8px', fontSize: '0.7rem', textDecoration: 'none', fontWeight: 600 }}
                              >
                                💬 WhatsApp
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             SECTION: PRODUCTS VAULT
             ========================================================================= */}
          {activeSection === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <span className="section-tag">CATALOG &amp; CURATION</span>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                    ATELIER PIECES &amp; VAULT ({filteredProducts.length})
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
                        price: 4999,
                        compareAtPrice: '',
                        collectionId: collections[0]?.id || '',
                        category: 'Suit Sets',
                        fabric: 'Silk Blend & Organza',
                        color: 'Purple',
                        size: 'S, M, L, XL',
                        image: '/images/products/purple-suit-set.webp',
                        stock: 5,
                        isRentable: true,
                        rentalBasePrice: 1199,
                        rentalPricePerDay: 350,
                        rentalDeposit: 2500,
                        minimumRentalDays: 2,
                        maximumRentalDays: 14,
                        rentalAvailableStock: 2,
                        isActive: true,
                        featured: false
                      });
                      setProductModalOpen(true);
                    }}
                    style={{ padding: '10px 18px', fontSize: '0.78rem' }}
                  >
                    + ADD NEW PIECE
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Image</th>
                        <th style={{ padding: '10px' }}>Piece Name</th>
                        <th style={{ padding: '10px' }}>Category</th>
                        <th style={{ padding: '10px' }}>Purchase Price</th>
                        <th style={{ padding: '10px' }}>Rent Options</th>
                        <th style={{ padding: '10px' }}>Stock</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '10px' }}>
                            <img
                              src={prod.image}
                              alt={prod.name}
                              style={{ width: '48px', height: '64px', objectFit: 'cover', border: '1px solid var(--gold-border)' }}
                            />
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>{prod.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--gold-dark)' }}>/{prod.slug}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>{prod.category || 'Atelier'}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{formatPrice(prod.price)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            {prod.isRentable ? (
                              <span style={{ fontSize: '0.72rem', color: '#065F46', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', fontWeight: 600 }}>
                                RENT: ₹{prod.rentalBasePrice}/dep ₹{prod.rentalDeposit}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>Buy Only</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 10px' }}>{prod.stock} in stock</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '2px 6px',
                              background: prod.isActive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                              color: prod.isActive ? '#065F46' : '#991B1B',
                              fontWeight: 600
                            }}>
                              {prod.isActive ? 'ACTIVE' : 'ARCHIVED'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => openEditProduct(prod)}
                                style={{ background: 'none', border: '1px solid var(--gold)', color: 'var(--brown-dark)', padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                style={{ background: 'none', border: '1px solid #DC2626', color: '#991B1B', padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
                              >
                                {prod.isActive ? 'Deactivate' : 'Delete'}
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

          {/* =========================================================================
             SECTION: RENTAL RESERVATIONS
             ========================================================================= */}
          {activeSection === 'rentals' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">BESPOKE ATELIER LOANS &bull; DATE RESERVATIONS</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                  RENTAL RESERVATION TIMELINE ({rentals.length})
                </h1>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Dress / Garment</th>
                        <th style={{ padding: '10px' }}>Patron</th>
                        <th style={{ padding: '10px' }}>Dates &amp; Duration</th>
                        <th style={{ padding: '10px' }}>Fee / Deposit</th>
                        <th style={{ padding: '10px' }}>Status</th>
                        <th style={{ padding: '10px' }}>Deposit Action</th>
                        <th style={{ padding: '10px' }}>Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rentals.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{r.product?.name || 'Atelier Garment'}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>{r.user?.name || 'Private Patron'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-brown)' }}>{r.user?.phone || ''}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>{r.startDate} &rarr; {r.endDate}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gold-dark)' }}>{r.rentalDays} days loan</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div>Fee: {formatPrice(r.rentalPrice)}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-brown)' }}>Deposit: {formatPrice(r.securityDeposit)}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <select
                              value={r.status}
                              onChange={(e) => handleRentalStatusUpdate(r.id, e.target.value)}
                              style={{ padding: '4px 8px', fontSize: '0.76rem', border: '1px solid var(--gold-border)', background: 'var(--white)' }}
                            >
                              <option value="RESERVED">Reserved</option>
                              <option value="ACTIVE">Active Rental</option>
                              <option value="RETURN_PENDING">Return Pending</option>
                              <option value="RETURNED">Returned &amp; Inspected</option>
                              <option value="OVERDUE">Overdue</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <button
                              type="button"
                              onClick={() => handleRentalDepositUpdate(r.id, r.depositStatus === 'HELD' ? 'REFUNDED' : 'HELD')}
                              style={{
                                background: r.depositStatus === 'HELD' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid var(--gold)',
                                color: r.depositStatus === 'HELD' ? '#B45309' : '#065F46',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                cursor: 'pointer'
                              }}
                            >
                              {r.depositStatus === 'HELD' ? 'Hold Deposit' : 'Deposit Refunded ✓'}
                            </button>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            {r.user?.phone && (
                              <a
                                href={`https://wa.me/${r.user.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ background: '#25D366', color: '#fff', padding: '4px 8px', fontSize: '0.7rem', textDecoration: 'none', fontWeight: 600 }}
                              >
                                💬 WhatsApp
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             SECTION: COLLECTIONS MANAGEMENT
             ========================================================================= */}
          {activeSection === 'collections' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <span className="section-tag">CURATION EDITIONS</span>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                    ATELIER COLLECTIONS ({collections.length})
                  </h1>
                </div>

                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => {
                    setEditingCollection(null);
                    setColForm({
                      name: '',
                      slug: '',
                      description: '',
                      image: '/images/future/future-01.webp',
                      isActive: true
                    });
                    setCollectionModalOpen(true);
                  }}
                  style={{ padding: '10px 18px', fontSize: '0.78rem' }}
                >
                  + NEW COLLECTION
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {collections.map((col) => {
                  const pieceCount = products.filter(p => p.collectionId === col.id).length;
                  return (
                    <div key={col.id} style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', overflow: 'hidden' }}>
                      <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                        <img
                          src={col.image || '/images/future/future-01.webp'}
                          alt={col.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--brown-dark)', color: 'var(--gold)', fontSize: '0.68rem', padding: '2px 8px', letterSpacing: '0.1em' }}>
                          {pieceCount} PIECES
                        </span>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <h3 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', marginBottom: '6px' }}>{col.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-brown)', lineHeight: 1.5, marginBottom: '16px' }}>{col.description || 'Curated luxury edit.'}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: col.isActive ? '#065F46' : '#991B1B', fontWeight: 600 }}>
                            {col.isActive ? '● ACTIVE' : '○ HIDDEN'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCollection(col);
                              setColForm({
                                name: col.name || '',
                                slug: col.slug || '',
                                description: col.description || '',
                                image: col.image || '/images/future/future-01.webp',
                                isActive: col.isActive !== undefined ? col.isActive : true
                              });
                              setCollectionModalOpen(true);
                            }}
                            style={{ background: 'none', border: '1px solid var(--gold)', color: 'var(--brown-dark)', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
             SECTION: PATRONS & CLIENTS
             ========================================================================= */}
          {activeSection === 'customers' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">PRIVATE CLIENTELE</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                  REGISTERED PATRONS ({customers.length})
                </h1>
              </div>

              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                        <th style={{ padding: '10px' }}>Client Name</th>
                        <th style={{ padding: '10px' }}>Email</th>
                        <th style={{ padding: '10px' }}>Phone</th>
                        <th style={{ padding: '10px' }}>Orders</th>
                        <th style={{ padding: '10px' }}>Lifetime Spend</th>
                        <th style={{ padding: '10px' }}>Member Since</th>
                        <th style={{ padding: '10px' }}>Direct Contact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 10px', fontWeight: 600, color: 'var(--brown-dark)' }}>{c.name}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-brown)' }}>{c.email}</td>
                          <td style={{ padding: '12px 10px' }}>{c.phone || 'On file'}</td>
                          <td style={{ padding: '12px 10px' }}>{c.ordersCount || 0} order(s)</td>
                          <td style={{ padding: '12px 10px', fontWeight: 600 }}>{formatPrice(c.totalSpent || 0)}</td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-brown)' }}>{formatDisplayDate(c.createdAt)}</td>
                          <td style={{ padding: '12px 10px' }}>
                            {c.phone && (
                              <a
                                href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ background: '#25D366', color: '#fff', padding: '4px 8px', fontSize: '0.7rem', textDecoration: 'none', fontWeight: 600 }}
                              >
                                💬 WhatsApp
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             SECTION: SALES ANALYTICS
             ========================================================================= */}
          {activeSection === 'analytics' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <span className="section-tag">FINANCIAL DISPATCHES &bull; RUNWAY METRICS</span>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                    SALES &amp; REVENUE ANALYTICS
                  </h1>
                </div>

                {/* Range Filter Buttons */}
                <div style={{ display: 'flex', border: '1px solid var(--gold-border)' }}>
                  {['today', '7d', '30d', 'year', 'all'].map((rng) => (
                    <button
                      key={rng}
                      type="button"
                      onClick={() => handleRangeChange(rng)}
                      style={{
                        padding: '6px 14px',
                        background: analyticsRange === rng ? 'var(--brown-dark)' : 'var(--white)',
                        color: analyticsRange === rng ? 'var(--gold)' : 'var(--brown-dark)',
                        border: 'none',
                        borderRight: '1px solid var(--gold-border)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: analyticsRange === rng ? 600 : 400
                      }}
                    >
                      {rng === '7d' ? 'This Week' : rng === '30d' ? 'This Month' : rng === 'year' ? 'This Year' : rng === 'today' ? 'Today' : 'All Time'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>TOTAL SALES IN RANGE</span>
                  <div className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-deep)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {formatPrice(analytics?.totalRevenue || 0)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)' }}>{analytics?.orderCount || 0} Total Orders</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>PERMANENT PURCHASES</span>
                  <div className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {formatPrice(analytics?.purchaseRevenue || 0)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#065F46' }}>Retail Vault Sales</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>RENTAL REVENUE</span>
                  <div className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--gold-dark)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {formatPrice(analytics?.rentalRevenue || 0)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gold-dark)' }}>{analytics?.rentalCount || 0} Rental Orders</span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-brown)', textTransform: 'uppercase' }}>AVERAGE ORDER VALUE</span>
                  <div className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {formatPrice(analytics?.averageOrderValue || 0)}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)' }}>Per Transaction</span>
                </div>
              </div>

              {/* Timeline Table */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <h3 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', marginBottom: '16px' }}>
                  REVENUE BREAKDOWN OVER TIME
                </h3>
                {analytics?.chartData && analytics.chartData.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--gold-border)', color: 'var(--text-brown)' }}>
                          <th style={{ padding: '8px' }}>Period</th>
                          <th style={{ padding: '8px' }}>Orders</th>
                          <th style={{ padding: '8px' }}>Sales Volume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.chartData.map((d, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f5efeb' }}>
                            <td style={{ padding: '10px 8px', fontWeight: 600 }}>{d.label}</td>
                            <td style={{ padding: '10px 8px' }}>{d.orders} orders</td>
                            <td style={{ padding: '10px 8px', fontWeight: 600 }}>{formatPrice(d.sales)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-brown)', fontSize: '0.85rem' }}>No orders found within the selected date window.</p>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
             SECTION: SETTINGS & ACCOUNT SECURITY
             ========================================================================= */}
          {activeSection === 'settings' && (
            <div style={{ maxWidth: '720px' }}>
              <div style={{ marginBottom: '24px' }}>
                <span className="section-tag">GOVERNANCE &bull; ACCESS SECURITY</span>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)' }}>
                  ADMINISTRATOR SETTINGS
                </h1>
              </div>

              {/* Profile Card */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '28px', marginBottom: '24px' }}>
                <h3 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', marginBottom: '14px' }}>
                  ADMINISTRATOR ACCOUNT
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)', display: 'block' }}>ACCOUNT HOLDER</span>
                    <strong style={{ color: 'var(--brown-dark)' }}>{user?.name || 'House of Shubhanshi Atelier'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)', display: 'block' }}>EMAIL ADDRESS</span>
                    <strong style={{ color: 'var(--brown-dark)' }}>{user?.email}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)', display: 'block' }}>SYSTEM ROLE</span>
                    <span style={{ color: '#065F46', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', fontWeight: 600, fontSize: '0.74rem' }}>
                      VERIFIED ADMINISTRATOR
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-brown)', display: 'block' }}>WHATSAPP CONCIERGE LINE</span>
                    <strong style={{ color: 'var(--brown-dark)' }}>+91 9560011351</strong>
                  </div>
                </div>
              </div>

              {/* Change Password Form */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '28px', marginBottom: '24px' }}>
                <h3 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', marginBottom: '8px' }}>
                  UPDATE SECRET PASSWORD
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-brown)', marginBottom: '18px' }}>
                  Ensure your credentials remain strictly private. The new password will take effect immediately.
                </p>

                {passwordMsg.text && (
                  <div style={{
                    padding: '12px 16px',
                    fontSize: '0.82rem',
                    marginBottom: '18px',
                    background: passwordMsg.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                    color: passwordMsg.type === 'success' ? '#065F46' : '#991B1B',
                    border: passwordMsg.type === 'success' ? '1px solid #10B981' : '1px solid #DC2626'
                  }}>
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '6px' }}>
                      Current Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gold-border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '6px' }}>
                      New Password (Min. 8 characters) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gold-border)' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '6px' }}>
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--gold-border)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn btn-gold"
                    style={{ alignSelf: 'flex-start', padding: '12px 24px', marginTop: '6px' }}
                  >
                    {passwordSaving ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD →'}
                  </button>
                </form>
              </div>

              {/* Owner Handover Guide */}
              <div style={{ background: 'var(--ivory)', border: '1px solid var(--gold-border)', padding: '24px' }}>
                <h4 className="font-serif" style={{ fontSize: '1.1rem', color: 'var(--brown-dark)', marginBottom: '8px' }}>
                  ✦ OWNER HANDOVER INSTRUCTIONS
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-brown)', lineHeight: 1.6 }}>
                  You have full autonomous management over the House of Shubhanshi digital storefront. You can upload new photography directly from your phone or computer, add or edit lehengas and suit sets, adjust purchase and rental fees, track incoming WhatsApp enquiries, and inspect verified client spending records.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* =========================================================================
         PRODUCT ADD / EDIT MODAL (WITH LIVE IMAGE UPLOAD)
         ========================================================================= */}
      {productModalOpen && (
        <div className="modal-backdrop open" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '680px', padding: '32px', background: 'var(--white)', border: '1px solid var(--gold-border)' }}>
            <button type="button" className="modal-close-btn" onClick={() => setProductModalOpen(false)}>&times;</button>
            
            <h2 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-dark)', marginBottom: '16px' }}>
              {editingProduct ? 'EDIT ATELIER PIECE' : 'ADD NEW PIECE TO VAULT'}
            </h2>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '72vh', overflowY: 'auto', paddingRight: '6px' }}>
              
              <div className="form-group">
                <label className="form-label">Garment / Ensemble Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. Royal Maroon Silk Anarkali Set"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Describe the silhouette, karigari, embroidery, and dupatta detailing..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Price (₹) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Compare At Price (₹, optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={prodForm.compareAtPrice}
                    onChange={(e) => setProdForm({ ...prodForm, compareAtPrice: e.target.value })}
                    placeholder="e.g. 7999"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                  >
                    <option value="Suit Sets">Suit Sets</option>
                    <option value="Lehengas">Lehengas</option>
                    <option value="Anarkalis">Anarkalis</option>
                    <option value="Sarees">Sarees</option>
                    <option value="Kurta Sets">Kurta Sets</option>
                    <option value="Couture">Couture</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Collection</label>
                  <select
                    className="form-input"
                    value={prodForm.collectionId}
                    onChange={(e) => setProdForm({ ...prodForm, collectionId: e.target.value })}
                  >
                    <option value="">No Collection Assigned</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Fabric</label>
                  <input
                    type="text"
                    className="form-input"
                    value={prodForm.fabric}
                    onChange={(e) => setProdForm({ ...prodForm, fabric: e.target.value })}
                    placeholder="e.g. Crepe Silk Blend"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input
                    type="text"
                    className="form-input"
                    value={prodForm.color}
                    onChange={(e) => setProdForm({ ...prodForm, color: e.target.value })}
                    placeholder="e.g. Earth Brown"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Available Sizes</label>
                  <input
                    type="text"
                    className="form-input"
                    value={prodForm.size}
                    onChange={(e) => setProdForm({ ...prodForm, size: e.target.value })}
                    placeholder="e.g. S, M, L, XL"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vault Stock Available</label>
                  <input
                    type="number"
                    className="form-input"
                    value={prodForm.stock}
                    onChange={(e) => setProdForm({ ...prodForm, stock: e.target.value })}
                  />
                </div>
              </div>

              {/* IMAGE UPLOAD & PREVIEW */}
              <div style={{ background: 'var(--ivory)', padding: '16px', border: '1px solid var(--gold-border)' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                  PIECE PHOTOGRAPHY &amp; ASSET
                </label>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  {prodForm.image && (
                    <img
                      src={prodForm.image}
                      alt="Preview"
                      style={{ width: '64px', height: '80px', objectFit: 'cover', border: '1px solid var(--gold-border)' }}
                    />
                  )}

                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      ref={productFileInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, 'product')}
                    />

                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => productFileInputRef.current?.click()}
                      style={{
                        background: 'var(--white)',
                        border: '1px solid var(--gold)',
                        color: 'var(--brown-dark)',
                        padding: '8px 14px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      📁 {uploadingImage ? 'OPTIMIZING & UPLOADING...' : 'UPLOAD PHOTO FROM COMPUTER'}
                    </button>

                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={prodForm.image}
                        onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                        placeholder="or paste image URL"
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RENTAL PARAMETERS */}
              <div style={{ background: 'var(--ivory)', padding: '16px', border: '1px solid var(--gold-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="checkbox"
                    id="modalRentable"
                    checked={prodForm.isRentable}
                    onChange={(e) => setProdForm({ ...prodForm, isRentable: e.target.checked })}
                  />
                  <label htmlFor="modalRentable" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brown-dark)', cursor: 'pointer' }}>
                    Available for Dress Rental / Reservation
                  </label>
                </div>

                {prodForm.isRentable && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Rental Base Price (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={prodForm.rentalBasePrice}
                        onChange={(e) => setProdForm({ ...prodForm, rentalBasePrice: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Per Day Additional (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={prodForm.rentalPricePerDay}
                        onChange={(e) => setProdForm({ ...prodForm, rentalPricePerDay: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Security Deposit (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={prodForm.rentalDeposit}
                        onChange={(e) => setProdForm({ ...prodForm, rentalDeposit: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Available Rental Stock</label>
                      <input
                        type="number"
                        className="form-input"
                        value={prodForm.rentalAvailableStock}
                        onChange={(e) => setProdForm({ ...prodForm, rentalAvailableStock: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* VISIBILITY & FEATURED */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="modalActive"
                    checked={prodForm.isActive}
                    onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })}
                  />
                  <label htmlFor="modalActive" style={{ fontSize: '0.85rem', color: 'var(--brown-dark)', cursor: 'pointer' }}>
                    Visible in Online Catalog
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="modalFeatured"
                    checked={prodForm.featured}
                    onChange={(e) => setProdForm({ ...prodForm, featured: e.target.checked })}
                  />
                  <label htmlFor="modalFeatured" style={{ fontSize: '0.85rem', color: 'var(--brown-dark)', cursor: 'pointer' }}>
                    Featured on Homepage
                  </label>
                </div>
              </div>

              <button type="submit" className="btn btn-gold" style={{ marginTop: '10px', padding: '14px' }}>
                {editingProduct ? 'UPDATE PIECE' : 'SAVE TO ATELIER VAULT'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
         COLLECTION ADD / EDIT MODAL
         ========================================================================= */}
      {collectionModalOpen && (
        <div className="modal-backdrop open" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ maxWidth: '520px', padding: '32px', background: 'var(--white)', border: '1px solid var(--gold-border)' }}>
            <button type="button" className="modal-close-btn" onClick={() => setCollectionModalOpen(false)}>&times;</button>
            
            <h2 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--brown-dark)', marginBottom: '16px' }}>
              {editingCollection ? 'EDIT COLLECTION' : 'NEW ATELIER COLLECTION'}
            </h2>

            <form onSubmit={handleSaveCollection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Collection Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={colForm.name}
                  onChange={(e) => setColForm({ ...colForm, name: e.target.value })}
                  placeholder="e.g. Wedding Couture 2026"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={colForm.description}
                  onChange={(e) => setColForm({ ...colForm, description: e.target.value })}
                  placeholder="Editorial description of this curation..."
                />
              </div>

              {/* Cover Image Upload */}
              <div style={{ background: 'var(--ivory)', padding: '14px', border: '1px solid var(--gold-border)' }}>
                <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                  COLLECTION COVER IMAGE
                </label>
                
                <input
                  type="file"
                  ref={collectionFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleImageUpload(e, 'collection')}
                />

                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => collectionFileInputRef.current?.click()}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--gold)',
                    color: 'var(--brown-dark)',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  📁 UPLOAD COVER PHOTO
                </button>

                <input
                  type="text"
                  className="form-input"
                  value={colForm.image}
                  onChange={(e) => setColForm({ ...colForm, image: e.target.value })}
                  placeholder="or image path"
                  style={{ marginTop: '8px', fontSize: '0.8rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="colActive"
                  checked={colForm.isActive}
                  onChange={(e) => setColForm({ ...colForm, isActive: e.target.checked })}
                />
                <label htmlFor="colActive" style={{ fontSize: '0.85rem', color: 'var(--brown-dark)', cursor: 'pointer' }}>
                  Collection Visible to Public
                </label>
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

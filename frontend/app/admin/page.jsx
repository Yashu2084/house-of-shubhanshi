'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import api from '../../lib/api';
import { formatPrice, formatDisplayDate, brandInfo } from '../../lib/utils';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
  const { showToast } = useCart();

  // Navigation tab: overview, products, collections, customers, settings
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data states
  const [overview, setOverview] = useState(null);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Filters & Search
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [customerSearch, setCustomerSearch] = useState('');

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type: 'product' | 'collection', id, name }

  // Image Upload states
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
  const initialProductForm = {
    name: '',
    slug: '',
    description: '',
    price: 4999,
    collectionId: '',
    category: 'Suit Sets',
    fabric: 'Silk Blend & Organza',
    color: 'Terracotta',
    size: 'S, M, L, XL',
    image: '/images/products/purple-suit-set.webp',
    isRentable: true,
    rentalBasePrice: 1499,
    rentalDeposit: 2500,
    lengths: 'Standard (42"), Petite (39"), Tall (45"), Custom Length',
    customLengthAvailable: true,
    isActive: true,
    featured: false
  };
  const [prodForm, setProdForm] = useState(initialProductForm);

  // Collection Form state
  const initialCollectionForm = {
    name: '',
    slug: '',
    description: '',
    image: '/images/future/future-01.webp',
    isActive: true
  };
  const [colForm, setColForm] = useState(initialCollectionForm);

  // Protect Admin Route
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/admin/login');
      } else if (!isAdmin) {
        router.push('/profile');
      }
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // Load Admin Data
  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, productsRes, collectionsRes, customersRes] = await Promise.all([
        api.get('/admin/overview').catch(() => null),
        api.get('/products?includeInactive=true').catch(() => null),
        api.get('/collections?includeInactive=true').catch(() => null),
        api.get('/admin/customers').catch(() => null)
      ]);

      if (overviewRes && overviewRes.success) setOverview(overviewRes.data);
      if (productsRes && productsRes.success) setProducts(productsRes.data || []);
      if (collectionsRes && collectionsRes.success) setCollections(collectionsRes.data || []);
      if (customersRes && customersRes.success) setCustomers(customersRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loadAdminData]);

  // Handle local image file upload with WebP compression
  const handleImageUpload = (e, formType = 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Image file size must be less than 15MB');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async () => {
      let base64 = reader.result;

      // Optimize large photos
      if (file.size > 2 * 1024 * 1024) {
        try {
          base64 = await new Promise((resolve) => {
            const img = document.createElement('img');
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.naturalWidth || img.width;
              let height = img.naturalHeight || img.height;
              const maxDim = 1800;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.88));
            };
            img.onerror = () => resolve(reader.result);
            img.src = reader.result;
          });
        } catch (canvasErr) {
          // Fallback to original base64
        }
      }

      try {
        const res = await api.post('/admin/upload', {
          imageBase64: base64,
          filename: file.name
        });

        if (res && res.success && res.data?.url) {
          if (formType === 'product') {
            setProdForm(prev => ({ ...prev, image: res.data.url }));
          } else {
            setColForm(prev => ({ ...prev, image: res.data.url }));
          }
          showToast('Image uploaded and processed successfully.');
        } else {
          // Direct fallback to data URI if serverless storage unavailable
          if (formType === 'product') {
            setProdForm(prev => ({ ...prev, image: base64 }));
          } else {
            setColForm(prev => ({ ...prev, image: base64 }));
          }
          showToast('Image attached.');
        }
      } catch (err) {
        // Fallback to data URI directly
        if (formType === 'product') {
          setProdForm(prev => ({ ...prev, image: base64 }));
        } else {
          setColForm(prev => ({ ...prev, image: base64 }));
        }
        showToast('Image attached.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Open Product Modal (New or Edit)
  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProdForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: product.price || 0,
        collectionId: product.collectionId || '',
        category: product.category || 'Suit Sets',
        fabric: product.fabric || '',
        color: product.color || '',
        size: product.size || 'S, M, L, XL',
        image: product.image || '/images/products/purple-suit-set.webp',
        isRentable: !!product.isRentable,
        rentalBasePrice: product.rentalBasePrice || 0,
        rentalDeposit: product.rentalDeposit || 0,
        lengths: Array.isArray(product.lengths) ? product.lengths.join(', ') : (product.lengths || 'Standard (42"), Petite (39"), Tall (45"), Custom Length'),
        customLengthAvailable: product.customLengthAvailable !== false,
        isActive: product.isActive !== false,
        featured: !!product.featured
      });
    } else {
      setEditingProduct(null);
      setProdForm(initialProductForm);
    }
    setProductModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!prodForm.name.trim()) {
      alert('Product name is required');
      return;
    }

    const lengthsArray = typeof prodForm.lengths === 'string'
      ? prodForm.lengths.split(',').map(s => s.trim()).filter(Boolean)
      : prodForm.lengths;

    const payload = {
      ...prodForm,
      name: prodForm.name.trim(),
      slug: prodForm.slug.trim() || prodForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      price: parseFloat(prodForm.price) || 0,
      rentalBasePrice: prodForm.isRentable ? (parseFloat(prodForm.rentalBasePrice) || 0) : 0,
      rentalDeposit: prodForm.isRentable ? (parseFloat(prodForm.rentalDeposit) || 0) : 0,
      lengths: lengthsArray,
      customLengthAvailable: !!prodForm.customLengthAvailable,
      isActive: !!prodForm.isActive,
      featured: !!prodForm.featured
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showToast(`"${payload.name}" updated successfully.`);
      } else {
        await api.post('/products', payload);
        showToast(`"${payload.name}" created successfully.`);
      }
      setProductModalOpen(false);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    }
  };

  // Toggle Product Active / Discontinued
  const toggleProductActive = async (prod) => {
    try {
      await api.put(`/products/${prod.id}`, { isActive: !prod.isActive });
      showToast(`"${prod.name}" status updated to ${!prod.isActive ? 'Active' : 'Discontinued'}.`);
      loadAdminData();
    } catch (err) {
      alert('Failed to update product availability');
    }
  };

  // Toggle Product Featured
  const toggleProductFeatured = async (prod) => {
    try {
      await api.put(`/products/${prod.id}`, { featured: !prod.featured });
      showToast(`"${prod.name}" featured status updated.`);
      loadAdminData();
    } catch (err) {
      alert('Failed to update featured status');
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'product') {
        await api.delete(`/products/${deleteConfirm.id}`);
        showToast(`"${deleteConfirm.name}" removed from catalog.`);
      } else if (deleteConfirm.type === 'collection') {
        await api.delete(`/collections/${deleteConfirm.id}`);
        showToast(`Collection "${deleteConfirm.name}" deleted.`);
      }
      setDeleteConfirm(null);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  // Open Collection Modal
  const openCollectionModal = (collection = null) => {
    if (collection) {
      setEditingCollection(collection);
      setColForm({
        name: collection.name || '',
        slug: collection.slug || '',
        description: collection.description || '',
        image: collection.image || '/images/future/future-01.webp',
        isActive: collection.isActive !== false
      });
    } else {
      setEditingCollection(null);
      setColForm(initialCollectionForm);
    }
    setCollectionModalOpen(true);
  };

  // Save Collection
  const handleSaveCollection = async (e) => {
    e.preventDefault();
    if (!colForm.name.trim()) {
      alert('Collection name is required');
      return;
    }

    const payload = {
      ...colForm,
      name: colForm.name.trim(),
      slug: colForm.slug.trim() || colForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      isActive: !!colForm.isActive
    };

    try {
      if (editingCollection) {
        await api.put(`/collections/${editingCollection.id}`, payload);
        showToast(`Collection "${payload.name}" updated.`);
      } else {
        await api.post('/collections', payload);
        showToast(`Collection "${payload.name}" created.`);
      }
      setCollectionModalOpen(false);
      loadAdminData();
    } catch (err) {
      alert(err.message || 'Failed to save collection');
    }
  };

  // Change Admin Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (!currentPassword) {
      setPasswordMsg({ text: 'Please enter your current password.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (res && res.success) {
        setPasswordMsg({ text: 'Password successfully updated.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Admin password changed.');
      } else {
        setPasswordMsg({ text: res?.message || 'Failed to update password.', type: 'error' });
      }
    } catch (err) {
      setPasswordMsg({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = productSearch === '' ||
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.fabric?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered Customers
  const filteredCustomers = customers.filter(c => {
    return customerSearch === '' ||
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch);
  });

  // Available unique categories
  const categoriesList = ['ALL', ...new Set(products.map(p => p.category).filter(Boolean))];

  if (loading) {
    return (
      <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--gold)' }}>✦</p>
        <p style={{ color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Loading House of Shubhanshi Website Manager...
        </p>
      </main>
    );
  }

  return (
    <div className="admin-page-container" style={{ minHeight: '100vh', backgroundColor: '#fcfaf7', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Admin Header Bar */}
      <header style={{ height: '70px', background: 'var(--brown-dark)', color: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid rgba(201, 160, 74, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.4rem' }}
            aria-label="Toggle Navigation"
          >
            ☰
          </button>
          <Link href="/" style={{ textDecoration: 'none', color: 'var(--gold)', fontFamily: 'var(--font-serif)', fontSize: '1.15rem', letterSpacing: '0.12em', fontWeight: 600 }}>
            HOUSE OF SHUBHANSHI
          </Link>
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.14em', padding: '3px 8px', background: 'rgba(201, 160, 74, 0.2)', color: 'var(--gold)', borderRadius: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
            WEBSITE CONTENT MANAGER
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span style={{ fontSize: '0.82rem', color: '#e5d7cc' }}>
            Curator: <strong style={{ color: 'var(--gold)' }}>{user?.name || 'Administrator'}</strong>
          </span>
          <Link href="/shop" target="_blank" style={{ fontSize: '0.78rem', color: 'var(--gold)', textDecoration: 'none', border: '1px solid var(--gold-border)', padding: '5px 12px', borderRadius: '2px' }}>
            VIEW STOREFRONT ↗
          </Link>
          <button
            type="button"
            onClick={logout}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: '0.78rem', padding: '5px 12px', cursor: 'pointer', borderRadius: '2px' }}
          >
            SIGN OUT
          </button>
        </div>
      </header>

      {/* Main Admin Content Body */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Sidebar Navigation */}
        <aside
          style={{
            width: '260px',
            backgroundColor: 'var(--white)',
            borderRight: '1px solid var(--gold-border)',
            padding: '24px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ padding: '0 20px 14px', borderBottom: '1px solid #f2e9e2', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.16em', color: 'var(--text-brown)', textTransform: 'uppercase', fontWeight: 700 }}>
              CONTENT &amp; SHOWROOM
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            style={{
              padding: '12px 20px',
              textAlign: 'left',
              border: 'none',
              background: activeSection === 'overview' ? 'rgba(201, 160, 74, 0.12)' : 'transparent',
              color: activeSection === 'overview' ? 'var(--brown-dark)' : 'var(--text-brown)',
              fontWeight: activeSection === 'overview' ? 700 : 500,
              borderLeft: activeSection === 'overview' ? '4px solid var(--gold)' : '4px solid transparent',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            ✦ Website Activity
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('products')}
            style={{
              padding: '12px 20px',
              textAlign: 'left',
              border: 'none',
              background: activeSection === 'products' ? 'rgba(201, 160, 74, 0.12)' : 'transparent',
              color: activeSection === 'products' ? 'var(--brown-dark)' : 'var(--text-brown)',
              fontWeight: activeSection === 'products' ? 700 : 500,
              borderLeft: activeSection === 'products' ? '4px solid var(--gold)' : '4px solid transparent',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            ✦ Clothing Items ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('collections')}
            style={{
              padding: '12px 20px',
              textAlign: 'left',
              border: 'none',
              background: activeSection === 'collections' ? 'rgba(201, 160, 74, 0.12)' : 'transparent',
              color: activeSection === 'collections' ? 'var(--brown-dark)' : 'var(--text-brown)',
              fontWeight: activeSection === 'collections' ? 700 : 500,
              borderLeft: activeSection === 'collections' ? '4px solid var(--gold)' : '4px solid transparent',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            ✦ Collections ({collections.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('customers')}
            style={{
              padding: '12px 20px',
              textAlign: 'left',
              border: 'none',
              background: activeSection === 'customers' ? 'rgba(201, 160, 74, 0.12)' : 'transparent',
              color: activeSection === 'customers' ? 'var(--brown-dark)' : 'var(--text-brown)',
              fontWeight: activeSection === 'customers' ? 700 : 500,
              borderLeft: activeSection === 'customers' ? '4px solid var(--gold)' : '4px solid transparent',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            ✦ Registered Patrons ({customers.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('settings')}
            style={{
              padding: '12px 20px',
              textAlign: 'left',
              border: 'none',
              background: activeSection === 'settings' ? 'rgba(201, 160, 74, 0.12)' : 'transparent',
              color: activeSection === 'settings' ? 'var(--brown-dark)' : 'var(--text-brown)',
              fontWeight: activeSection === 'settings' ? 700 : 500,
              borderLeft: activeSection === 'settings' ? '4px solid var(--gold)' : '4px solid transparent',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            ✦ Security &amp; Settings
          </button>

          {/* Concierge Info Box */}
          <div style={{ margin: 'auto 16px 16px', padding: '14px', background: 'var(--ivory)', border: '1px solid var(--gold-border)', borderRadius: '2px', fontSize: '0.74rem', color: 'var(--text-brown)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--brown-dark)', display: 'block', marginBottom: '4px' }}>WhatsApp Concierge</strong>
            Orders are completed through WhatsApp at <strong>+91 9560011351</strong>.
          </div>
        </aside>

        {/* Workspace Area */}
        <main style={{ flex: 1, padding: '32px clamp(20px, 4vw, 48px)', overflowY: 'auto' }}>
          
          {/* ============================================================ */}
          {/* TAB 1: WEBSITE OVERVIEW / ACTIVITY */}
          {/* ============================================================ */}
          {activeSection === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: 0 }}>
                    Website Activity &amp; Catalog
                  </h1>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', margin: '4px 0 0' }}>
                    Monitor active pieces, audience views, and website collections without fake sales analytics.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openProductModal(null)}
                  className="btn btn-gold"
                  style={{ fontSize: '0.82rem', padding: '10px 18px' }}
                >
                  + ADD CLOTHING ITEM
                </button>
              </div>

              {/* Lightweight Non-Financial Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '36px' }}>
                
                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px', borderRadius: '3px', boxShadow: '0 2px 10px rgba(59, 29, 20, 0.03)' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-brown)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Active Products
                  </span>
                  <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--brown-dark)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {products.filter(p => p.isActive).length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-dark)' }}>
                    Total catalog: {products.length} items
                  </span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px', borderRadius: '3px', boxShadow: '0 2px 10px rgba(59, 29, 20, 0.03)' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-brown)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Collections
                  </span>
                  <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--brown-dark)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {collections.filter(c => c.isActive).length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-dark)' }}>
                    Active on website
                  </span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px', borderRadius: '3px', boxShadow: '0 2px 10px rgba(59, 29, 20, 0.03)' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-brown)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Registered Patrons
                  </span>
                  <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--brown-dark)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {customers.length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-dark)' }}>
                    Profiles saved
                  </span>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '20px', borderRadius: '3px', boxShadow: '0 2px 10px rgba(59, 29, 20, 0.03)' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-brown)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Featured Pieces
                  </span>
                  <div style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--brown-dark)', fontWeight: 700, margin: '6px 0 2px' }}>
                    {products.filter(p => p.featured).length}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold-dark)' }}>
                    Highlighted on storefront
                  </span>
                </div>
              </div>

              {/* MOST VIEWED ARTICLES / PRODUCTS SECTION */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', borderRadius: '3px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f2e9e2', paddingBottom: '12px' }}>
                  <div>
                    <h2 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', margin: 0 }}>
                      Most Viewed Products
                    </h2>
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-brown)', margin: '2px 0 0' }}>
                      Real client discovery views recorded on website product detail pages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection('products')}
                    style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    View All Products &rarr;
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--ivory)', borderBottom: '1px solid var(--gold-border)' }}>
                        <th style={{ padding: '10px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Product Name</th>
                        <th style={{ padding: '10px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Category</th>
                        <th style={{ padding: '10px 14px', color: 'var(--brown-dark)', fontWeight: 600, textAlign: 'center' }}>Views</th>
                        <th style={{ padding: '10px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Date Added</th>
                        <th style={{ padding: '10px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Availability</th>
                        <th style={{ padding: '10px 14px', color: 'var(--brown-dark)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...products]
                        .sort((a, b) => (b.views || 0) - (a.views || 0))
                        .slice(0, 7)
                        .map((prod) => (
                          <tr key={prod.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--brown-dark)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={prod.image} alt={prod.name} style={{ width: '36px', height: '44px', objectFit: 'contain', background: 'var(--ivory)', border: '1px solid var(--gold-border)' }} />
                                <span>{prod.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-brown)' }}>{prod.category}</td>
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              <span style={{ background: 'rgba(201, 160, 74, 0.15)', color: 'var(--brown-deep)', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.82rem' }}>
                                👁 {prod.views || 0}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-brown)', fontSize: '0.78rem' }}>
                              {formatDisplayDate(prod.createdAt) || 'Active Catalog'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: '2px', fontWeight: 600, background: prod.isActive ? '#D1FAE5' : '#FEE2E2', color: prod.isActive ? '#065F46' : '#991B1B' }}>
                                {prod.isActive ? 'AVAILABLE' : 'DISCONTINUED'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => openProductModal(prod)}
                                style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', marginRight: '10px' }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleProductActive(prod)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-brown)', cursor: 'pointer', fontSize: '0.78rem' }}
                              >
                                {prod.isActive ? 'Hide' : 'Show'}
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: PRODUCT & CLOTHING ITEM MANAGEMENT */}
          {/* ============================================================ */}
          {activeSection === 'products' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: 0 }}>
                    Clothing Items &amp; Catalog
                  </h1>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', margin: '4px 0 0' }}>
                    Manage product details, pricing, available lengths, bespoke options, and availability.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openProductModal(null)}
                  className="btn btn-gold"
                  style={{ fontSize: '0.82rem', padding: '10px 18px' }}
                >
                  + ADD NEW CLOTHING ITEM
                </button>
              </div>

              {/* Filters Bar */}
              <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '14px' }}>
                <input
                  type="text"
                  placeholder="Search by name, fabric, category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ flex: 1, minWidth: '220px', padding: '8px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                />
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  style={{ padding: '8px 14px', border: '1px solid #d4c5b9', background: 'var(--white)', fontSize: '0.86rem', outline: 'none' }}
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
                  ))}
                </select>
              </div>

              {/* Products Table */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', borderRadius: '3px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--ivory)', borderBottom: '1px solid var(--gold-border)' }}>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Item</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Category &amp; Fabric</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Pricing</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Lengths</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600, textAlign: 'center' }}>Views</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Featured</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={prod.image} alt={prod.name} style={{ width: '44px', height: '54px', objectFit: 'contain', background: 'var(--ivory)', border: '1px solid var(--gold-border)' }} />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--brown-dark)' }}>{prod.name}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-brown)' }}>{prod.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 500, color: 'var(--brown-dark)' }}>{prod.category}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-brown)' }}>{prod.fabric || '—'}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--brown-deep)' }}>{formatPrice(prod.price)}</div>
                          {prod.isRentable && (
                            <div style={{ fontSize: '0.74rem', color: '#065F46' }}>
                              Rent: {formatPrice(prod.rentalBasePrice)}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '0.76rem', color: 'var(--text-brown)', maxWidth: '180px' }}>
                          {Array.isArray(prod.lengths) ? prod.lengths.join(', ') : (prod.lengths || 'Standard (42")')}
                          {prod.customLengthAvailable && (
                            <div style={{ color: 'var(--gold-dark)', fontWeight: 600, marginTop: '2px' }}>✦ Custom Allowed</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{ background: 'rgba(201, 160, 74, 0.15)', color: 'var(--brown-deep)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600, fontSize: '0.78rem' }}>
                            👁 {prod.views || 0}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            type="button"
                            onClick={() => toggleProductFeatured(prod)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: prod.featured ? 'var(--gold)' : '#ccc' }}
                            title={prod.featured ? 'Featured on storefront (click to toggle)' : 'Not featured (click to feature)'}
                          >
                            {prod.featured ? '★' : '☆'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            type="button"
                            onClick={() => toggleProductActive(prod)}
                            style={{
                              fontSize: '0.7rem',
                              padding: '3px 8px',
                              borderRadius: '2px',
                              fontWeight: 600,
                              background: prod.isActive ? '#D1FAE5' : '#FEE2E2',
                              color: prod.isActive ? '#065F46' : '#991B1B',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            {prod.isActive ? 'ACTIVE' : 'DISCONTINUED'}
                          </button>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => openProductModal(prod)}
                            style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', marginRight: '10px' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ type: 'product', id: prod.id, name: prod.name })}
                            style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: COLLECTION MANAGEMENT */}
          {/* ============================================================ */}
          {activeSection === 'collections' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: 0 }}>
                    Collections &amp; Categories
                  </h1>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', margin: '4px 0 0' }}>
                    Curate editorial collections, banners, and lookbook groupings for the website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openCollectionModal(null)}
                  className="btn btn-gold"
                  style={{ fontSize: '0.82rem', padding: '10px 18px' }}
                >
                  + ADD NEW COLLECTION
                </button>
              </div>

              {/* Collections Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {collections.map((col) => (
                  <div key={col.id} style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', borderRadius: '3px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '180px', overflow: 'hidden', background: 'var(--ivory)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={col.image} alt={col.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                        <h3 className="font-serif" style={{ fontSize: '1.15rem', color: 'var(--brown-dark)', margin: 0 }}>
                          {col.name}
                        </h3>
                        <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '2px', fontWeight: 600, background: col.isActive ? '#D1FAE5' : '#FEE2E2', color: col.isActive ? '#065F46' : '#991B1B' }}>
                          {col.isActive ? 'ACTIVE' : 'HIDDEN'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-brown)', lineHeight: 1.5, margin: '0 0 16px', flex: 1 }}>
                        {col.description || 'No description provided.'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #f5efeb', paddingTop: '10px' }}>
                        <button
                          type="button"
                          onClick={() => openCollectionModal(col)}
                          style={{ background: 'none', border: 'none', color: 'var(--gold-dark)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm({ type: 'collection', id: col.id, name: col.name })}
                          style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: REGISTERED PATRONS */}
          {/* ============================================================ */}
          {activeSection === 'customers' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: 0 }}>
                  Registered Patrons &amp; Profiles
                </h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', margin: '4px 0 0' }}>
                  Patrons with saved accounts for pre-filling WhatsApp enquiries. Click WhatsApp to message directly.
                </p>
              </div>

              {/* Search */}
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Search patrons by name, email, or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', border: '1px solid var(--gold-border)', background: 'var(--white)', fontSize: '0.86rem', outline: 'none' }}
                />
              </div>

              {/* Patrons Table */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', borderRadius: '3px', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--ivory)', borderBottom: '1px solid var(--gold-border)' }}>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Patron Name</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Email Address</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Phone Number</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Date of Birth</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600 }}>Patron Since</th>
                      <th style={{ padding: '12px 14px', color: 'var(--brown-dark)', fontWeight: 600, textAlign: 'right' }}>Direct Concierge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((cust) => {
                      const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
                      const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}` : null;
                      return (
                        <tr key={cust.id} style={{ borderBottom: '1px solid #f5efeb' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--brown-dark)' }}>
                            {cust.name}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-brown)' }}>{cust.email}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--brown-dark)' }}>{cust.phone || '—'}</td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-brown)', fontSize: '0.78rem' }}>
                            {cust.dob ? formatDisplayDate(cust.dob) : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', color: 'var(--text-brown)', fontSize: '0.78rem' }}>
                            {formatDisplayDate(cust.createdAt) || 'Active'}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                            {waLink ? (
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: 'rgba(6, 95, 70, 0.1)',
                                  color: '#065F46',
                                  border: '1px solid #A7F3D0',
                                  padding: '4px 10px',
                                  borderRadius: '2px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  textDecoration: 'none'
                                }}
                              >
                                WhatsApp Patron ↗
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#999' }}>No phone</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: SECURITY & SETTINGS */}
          {/* ============================================================ */}
          {activeSection === 'settings' && (
            <div style={{ maxWidth: '680px' }}>
              <div style={{ marginBottom: '28px' }}>
                <h1 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', margin: 0 }}>
                  Security &amp; Storefront Settings
                </h1>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-brown)', margin: '4px 0 0' }}>
                  Update your administrator credentials and review store configurations.
                </p>
              </div>

              {/* Change Password Card */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', borderRadius: '3px', marginBottom: '24px' }}>
                <h2 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', margin: '0 0 16px', borderBottom: '1px solid #f2e9e2', paddingBottom: '10px' }}>
                  Change Administrator Password
                </h2>

                {passwordMsg.text && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '2px',
                      fontSize: '0.82rem',
                      marginBottom: '16px',
                      background: passwordMsg.type === 'success' ? '#D1FAE5' : '#FEE2E2',
                      border: `1px solid ${passwordMsg.type === 'success' ? '#A7F3D0' : '#FCA5A5'}`,
                      color: passwordMsg.type === 'success' ? '#065F46' : '#991B1B'
                    }}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                      Current Password *
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                      New Password (min 8 characters) *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="btn btn-gold"
                    style={{ alignSelf: 'flex-start', marginTop: '6px', fontSize: '0.84rem', padding: '10px 20px' }}
                  >
                    {passwordSaving ? 'SAVING...' : 'UPDATE PASSWORD'}
                  </button>
                </form>
              </div>

              {/* Brand Config Card */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', borderRadius: '3px' }}>
                <h2 className="font-serif" style={{ fontSize: '1.25rem', color: 'var(--brown-dark)', margin: '0 0 16px', borderBottom: '1px solid #f2e9e2', paddingBottom: '10px' }}>
                  Storefront &amp; Concierge Details
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-brown)', display: 'inline-block', width: '160px' }}>Brand Name:</span>
                    <strong>House of Shubhanshi</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-brown)', display: 'inline-block', width: '160px' }}>WhatsApp Number:</span>
                    <strong>+91 9560011351</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-brown)', display: 'inline-block', width: '160px' }}>Concierge Email:</span>
                    <strong>Houseofshubhanshi@gmail.com</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-brown)', display: 'inline-block', width: '160px' }}>Instagram:</span>
                    <strong>@houseofshubhanshi</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-brown)', display: 'inline-block', width: '160px' }}>Business Model:</span>
                    <span>Atelier Showcase &bull; WhatsApp Consultation &amp; Bespoke Order Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ============================================================ */}
      {/* PRODUCT ADD/EDIT MODAL */}
      {/* ============================================================ */}
      {productModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30, 16, 12, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setProductModalOpen(false);
          }}
        >
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--gold-border)',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              borderRadius: '3px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f2e9e2', paddingBottom: '14px' }}>
              <h2 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--brown-dark)', margin: 0 }}>
                {editingProduct ? `Edit Clothing Item: ${editingProduct.name}` : 'Add New Clothing Item'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-brown)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="e.g. Royal Terracotta Zari Anarkali"
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    Category
                  </label>
                  <input
                    type="text"
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    placeholder="e.g. Suit Sets, Sarees, Lehengas"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    Collection
                  </label>
                  <select
                    value={prodForm.collectionId}
                    onChange={(e) => setProdForm({ ...prodForm, collectionId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none', background: 'var(--white)' }}
                  >
                    <option value="">None / General Collection</option>
                    {collections.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                    Fabric Information
                  </label>
                  <input
                    type="text"
                    value={prodForm.fabric}
                    onChange={(e) => setProdForm({ ...prodForm, fabric: e.target.value })}
                    placeholder="e.g. Pure Chanderi Silk, Handloom Organza"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                  />
                </div>
              </div>

              {/* RENTAL OPTIONS */}
              <div style={{ background: 'var(--ivory)', border: '1px solid var(--gold-border)', padding: '14px', borderRadius: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--brown-dark)', fontSize: '0.84rem' }}>
                  <input
                    type="checkbox"
                    checked={prodForm.isRentable}
                    onChange={(e) => setProdForm({ ...prodForm, isRentable: e.target.checked })}
                  />
                  Enable Atelier Rental Option for this piece
                </label>

                {prodForm.isRentable && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-brown)', marginBottom: '3px' }}>
                        Rental Hire Base Price (₹)
                      </label>
                      <input
                        type="number"
                        value={prodForm.rentalBasePrice}
                        onChange={(e) => setProdForm({ ...prodForm, rentalBasePrice: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d4c5b9', fontSize: '0.84rem', outline: 'none', background: 'var(--white)' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-brown)', marginBottom: '3px' }}>
                        Security Deposit (Refundable ₹)
                      </label>
                      <input
                        type="number"
                        value={prodForm.rentalDeposit}
                        onChange={(e) => setProdForm({ ...prodForm, rentalDeposit: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d4c5b9', fontSize: '0.84rem', outline: 'none', background: 'var(--white)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* LENGTHS & CUSTOM LENGTH CONFIGURATION */}
              <div style={{ background: 'var(--ivory)', border: '1px solid var(--gold-border)', padding: '14px', borderRadius: '2px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                  Available Lengths (comma-separated):
                </label>
                <input
                  type="text"
                  value={prodForm.lengths}
                  onChange={(e) => setProdForm({ ...prodForm, lengths: e.target.value })}
                  placeholder='e.g. Standard (42"), Petite (39"), Tall (45"), Custom Length'
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #d4c5b9', fontSize: '0.84rem', outline: 'none', background: 'var(--white)' }}
                />

                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--brown-dark)' }}>
                    <input
                      type="checkbox"
                      checked={prodForm.customLengthAvailable}
                      onChange={(e) => setProdForm({ ...prodForm, customLengthAvailable: e.target.checked })}
                    />
                    Allow clients to specify custom tailored length (e.g. 43.5 inches)
                  </label>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  placeholder="Details on zari work, drape, craftsmanship, occasion suitability..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                />
              </div>

              {/* PRODUCT IMAGE UPLOAD OR URL */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                  Product Image
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={productFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'product')}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => productFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="btn btn-gold-outline-dark"
                    style={{ fontSize: '0.78rem', padding: '8px 14px' }}
                  >
                    {uploadingImage ? 'UPLOADING...' : 'UPLOAD IMAGE FILE'}
                  </button>
                  <input
                    type="text"
                    value={prodForm.image}
                    onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                    placeholder="/images/products/suit.webp or https://..."
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid #d4c5b9', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>
                {prodForm.image && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={prodForm.image} alt="Preview" style={{ width: '50px', height: '60px', objectFit: 'contain', border: '1px solid var(--gold-border)', background: 'var(--ivory)' }} />
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-brown)' }}>Current image preview</span>
                  </div>
                )}
              </div>

              {/* VISIBILITY & FEATURED TOGGLES */}
              <div style={{ display: 'flex', gap: '24px', margin: '4px 0 10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--brown-dark)' }}>
                  <input
                    type="checkbox"
                    checked={prodForm.isActive}
                    onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })}
                  />
                  Active on Storefront (Available for Discovery)
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--brown-dark)' }}>
                  <input
                    type="checkbox"
                    checked={prodForm.featured}
                    onChange={(e) => setProdForm({ ...prodForm, featured: e.target.checked })}
                  />
                  Feature on Homepage Showcase
                </label>
              </div>

              {/* SAVE / CANCEL BUTTONS */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #f2e9e2', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  style={{ background: 'none', border: '1px solid #d4c5b9', padding: '10px 18px', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{ padding: '10px 24px', fontSize: '0.84rem' }}
                >
                  {editingProduct ? 'UPDATE CLOTHING ITEM' : 'ADD TO CATALOG'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* COLLECTION ADD/EDIT MODAL */}
      {/* ============================================================ */}
      {collectionModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30, 16, 12, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setCollectionModalOpen(false);
          }}
        >
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--gold-border)',
              width: '100%',
              maxWidth: '560px',
              padding: '28px',
              borderRadius: '3px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f2e9e2', paddingBottom: '14px' }}>
              <h2 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--brown-dark)', margin: 0 }}>
                {editingCollection ? `Edit Collection: ${editingCollection.name}` : 'Add New Collection'}
              </h2>
              <button
                type="button"
                onClick={() => setCollectionModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-brown)' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCollection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={colForm.name}
                  onChange={(e) => setColForm({ ...colForm, name: e.target.value })}
                  placeholder="e.g. Royal Heritage 2026"
                  required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  rows="3"
                  value={colForm.description}
                  onChange={(e) => setColForm({ ...colForm, description: e.target.value })}
                  placeholder="Story and inspiration behind this collection..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4c5b9', fontSize: '0.86rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brown-dark)', marginBottom: '4px' }}>
                  Collection Banner Image
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="file"
                    ref={collectionFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'collection')}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => collectionFileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="btn btn-gold-outline-dark"
                    style={{ fontSize: '0.78rem', padding: '8px 14px' }}
                  >
                    {uploadingImage ? 'UPLOADING...' : 'UPLOAD IMAGE'}
                  </button>
                  <input
                    type="text"
                    value={colForm.image}
                    onChange={(e) => setColForm({ ...colForm, image: e.target.value })}
                    placeholder="/images/future/... or URL"
                    style={{ flex: 1, padding: '8px 10px', border: '1px solid #d4c5b9', fontSize: '0.82rem', outline: 'none' }}
                  />
                </div>
                {colForm.image && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={colForm.image} alt="Collection Preview" style={{ width: '100%', height: '110px', objectFit: 'cover', border: '1px solid var(--gold-border)' }} />
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', color: 'var(--brown-dark)' }}>
                  <input
                    type="checkbox"
                    checked={colForm.isActive}
                    onChange={(e) => setColForm({ ...colForm, isActive: e.target.checked })}
                  />
                  Active on Website
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #f2e9e2', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setCollectionModalOpen(false)}
                  style={{ background: 'none', border: '1px solid #d4c5b9', padding: '10px 18px', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-gold"
                  style={{ padding: '10px 24px', fontSize: '0.84rem' }}
                >
                  {editingCollection ? 'UPDATE COLLECTION' : 'CREATE COLLECTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {deleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30, 16, 12, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--white)',
              border: '1px solid var(--gold-border)',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              borderRadius: '3px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '1.8rem', color: '#991B1B', marginBottom: '12px' }}>⚠</div>
            <h3 className="font-serif" style={{ fontSize: '1.3rem', color: 'var(--brown-dark)', margin: '0 0 10px' }}>
              Confirm Deletion
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-brown)', lineHeight: 1.6, marginBottom: '22px' }}>
              Are you sure you want to remove <strong>&ldquo;{deleteConfirm.name}&rdquo;</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{ padding: '10px 18px', background: 'none', border: '1px solid #d4c5b9', cursor: 'pointer', fontSize: '0.84rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{ padding: '10px 20px', background: '#991B1B', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600 }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

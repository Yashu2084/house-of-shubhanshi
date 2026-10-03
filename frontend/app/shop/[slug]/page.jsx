'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import {
  formatPrice,
  brandInfo,
  createSingleProductWhatsAppMessage,
  getWhatsAppUrl
} from '../../../lib/utils';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { useLightbox } from '../../../components/ImageLightbox';
import RentalSelector from '../../../components/RentalSelector';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('BUY');
  const [rentalConfig, setRentalConfig] = useState(null);
  const [selectedLength, setSelectedLength] = useState('Standard (42")');
  const [customLengthInput, setCustomLengthInput] = useState('');

  const { addItem, showToast } = useCart();
  const { user } = useAuth();
  const { openLightbox } = useLightbox();

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        setLoading(true);
        let found = null;
        try {
          const res = await api.get(`/products/${slug}`);
          if (res && res.success && res.data) {
            found = res.data;
          }
        } catch (e) {
          // Fallback search
        }

        if (!found) {
          const listRes = await api.get('/products');
          if (listRes && listRes.success && Array.isArray(listRes.data)) {
            found = listRes.data.find(p => p.id === slug || p.slug === slug);
          }
        }

        setProduct(found);
        if (found && Array.isArray(found.lengths) && found.lengths.length > 0) {
          setSelectedLength(found.lengths[0]);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (loading) {
    return (
      <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', color: 'var(--gold)' }}>✦</p>
        <p style={{ color: 'var(--text-brown)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Loading outfit details...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <h2 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', marginBottom: '14px' }}>
          OUTFIT NOT FOUND
        </h2>
        <p style={{ color: 'var(--text-brown)', marginBottom: '24px' }}>
          The requested piece is currently unavailable or has been archived.
        </p>
        <Link href="/shop" className="btn btn-gold">
          RETURN TO SHOP
        </Link>
      </main>
    );
  }

  const isRentable = !!product.isRentable;
  const formattedPrice = formatPrice(product.price);

  const availableLengths = (Array.isArray(product.lengths) && product.lengths.length > 0)
    ? product.lengths
    : ['Standard (42")', 'Petite (39")', 'Tall (45")', 'Custom Length'];

  const isCustomLengthSelected = selectedLength.toLowerCase().includes('custom');

  // Add piece to user's Request List / Selection
  const handleAddToSelection = () => {
    const isRental = mode === 'RENT';
    if (isRental) {
      if (!rentalConfig) return;
      if (!rentalConfig.isAvailable) {
        alert('Selected dates are currently unavailable. Please choose another date range.');
        return;
      }
      addItem(product, 1, rentalConfig, {
        length: selectedLength,
        customLength: isCustomLengthSelected ? customLengthInput : ''
      });
      showToast(`"${product.name}" rental added to your selection.`);
    } else {
      addItem(product, 1, null, {
        length: selectedLength,
        customLength: isCustomLengthSelected ? customLengthInput : ''
      });
      showToast(`"${product.name}" added to your selection.`);
    }
  };

  // Direct WhatsApp Enquiry for single product
  const handleContinueOnWhatsApp = () => {
    const isRental = mode === 'RENT';
    if (isRental && rentalConfig && !rentalConfig.isAvailable) {
      alert('Selected dates are currently unavailable. Please choose another date range.');
      return;
    }

    const msg = createSingleProductWhatsAppMessage({
      productName: product.name,
      requestType: isRental ? `Rental (${rentalConfig?.rentalDays || 3} Days)` : 'Purchase',
      price: isRental ? (rentalConfig?.rentalPrice || product.rentalBasePrice) : product.price,
      rentalDuration: isRental ? (rentalConfig?.rentalDays || 3) : undefined,
      rentalStartDate: isRental ? rentalConfig?.rentalStartDate : undefined,
      rentalEndDate: isRental ? rentalConfig?.rentalEndDate : undefined,
      length: selectedLength,
      customLength: isCustomLengthSelected ? customLengthInput : undefined,
      customerName: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || ''
    });

    const url = getWhatsAppUrl(msg);
    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <main style={{ paddingTop: '130px', minHeight: '85vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
      <div className="container">
        {/* Breadcrumb */}
        <nav style={{ fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-brown)', marginBottom: '28px' }}>
          <Link href="/" style={{ color: 'var(--brown-dark)' }}>Home</Link> &bull;{' '}
          <Link href="/shop" style={{ color: 'var(--brown-dark)' }}>Shop</Link> &bull;{' '}
          <span style={{ color: 'var(--gold-dark)', fontWeight: 600 }}>{product.name}</span>
        </nav>

        {/* Product Layout Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px', alignItems: 'start' }}>
          
          {/* Garment Image Showcase */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: '24px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '100%', minHeight: '440px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={product.image}
                alt={product.name}
                style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', cursor: 'zoom-in' }}
                onClick={() => openLightbox(product.image, product.name)}
                title="Click to inspect garment drape & embroidery"
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-brown)', fontStyle: 'italic', marginTop: '12px' }}>
              ✦ Click image to inspect complete garment and embroidery
            </p>
          </div>

          {/* Garment Details & Actions */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 4vw, 40px)' }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600 }}>
              {product.category || 'OCCASION WEAR'}
            </span>
            <h1 className="font-serif" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', color: 'var(--brown-dark)', margin: '8px 0 12px' }}>
              {product.name}
            </h1>

            {/* Switcher if rentable */}
            {isRentable && (
              <div className="rental-mode-switcher" style={{ marginBottom: '24px' }}>
                <button
                  type="button"
                  className={`rental-mode-btn ${mode === 'BUY' ? 'active' : ''}`}
                  onClick={() => setMode('BUY')}
                >
                  ✦ BUY OUTFIT
                </button>
                <button
                  type="button"
                  className={`rental-mode-btn ${mode === 'RENT' ? 'active' : ''}`}
                  onClick={() => setMode('RENT')}
                >
                  ✧ RENT (2–14 DAYS)
                </button>
              </div>
            )}

            {/* Price display */}
            <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--brown-deep)', fontWeight: 600, marginBottom: '16px' }}>
              {mode === 'BUY'
                ? formattedPrice
                : formatPrice(rentalConfig?.rentalPrice || product.rentalBasePrice) + ' Rental Hire'}
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-brown)', lineHeight: 1.8, marginBottom: '24px' }}>
              {product.description}
            </p>

            {/* LENGTH SELECTOR */}
            <div style={{ marginBottom: '24px', background: 'var(--ivory)', border: '1px solid var(--gold-border)', padding: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brown-dark)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Select Garment Length:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: isCustomLengthSelected ? '12px' : '0' }}>
                {availableLengths.map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setSelectedLength(len)}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.8rem',
                      border: selectedLength === len ? '1.5px solid var(--gold)' : '1px solid #d4c5b9',
                      background: selectedLength === len ? 'var(--gold)' : 'var(--white)',
                      color: selectedLength === len ? '#fff' : 'var(--brown-dark)',
                      fontWeight: selectedLength === len ? 600 : 400,
                      cursor: 'pointer',
                      borderRadius: '2px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {len}
                  </button>
                ))}
              </div>

              {/* Custom Length Input field */}
              {isCustomLengthSelected && (
                <div style={{ marginTop: '10px' }}>
                  <label htmlFor="customLengthInput" style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-brown)', marginBottom: '4px' }}>
                    Enter Custom Length (in inches, e.g. 43.5 inches):
                  </label>
                  <input
                    id="customLengthInput"
                    type="text"
                    value={customLengthInput}
                    onChange={(e) => setCustomLengthInput(e.target.value)}
                    placeholder="e.g. 43.5 inches / custom floor length"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '0.86rem',
                      border: '1px solid var(--gold-border)',
                      background: 'var(--white)',
                      outline: 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Garment Details Specs */}
            <div className="modal-details-list" style={{ marginBottom: '28px' }}>
              {product.fabric && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Fabric</span>
                  <span className="modal-detail-val">{product.fabric}</span>
                </div>
              )}
              {product.color && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Color</span>
                  <span className="modal-detail-val">{product.color}</span>
                </div>
              )}
              {product.size && (
                <div className="modal-detail-item">
                  <span className="modal-detail-label">Sizes</span>
                  <span className="modal-detail-val">{product.size}</span>
                </div>
              )}
              <div className="modal-detail-item">
                <span className="modal-detail-label">Delivery</span>
                <span className="modal-detail-val">Dispatched in 2–4 Business Days</span>
              </div>
            </div>

            {/* If Rent mode: show RentalSelector dates and pricing */}
            {mode === 'RENT' && (
              <div style={{ marginBottom: '24px' }}>
                <RentalSelector
                  product={product}
                  onConfigChange={setRentalConfig}
                />
              </div>
            )}

            {/* Primary & Secondary Call to Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Primary Action: Continue on WhatsApp */}
              <button
                type="button"
                className="btn btn-gold"
                onClick={handleContinueOnWhatsApp}
                disabled={mode === 'RENT' && rentalConfig && !rentalConfig.isAvailable}
                style={{
                  width: '100%',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  fontSize: '0.94rem',
                  letterSpacing: '0.1em',
                  cursor: 'pointer'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                CONTINUE ON WHATSAPP
              </button>

              {/* Secondary Action: Add to Selection */}
              <button
                type="button"
                className="btn btn-gold-outline-dark"
                onClick={handleAddToSelection}
                disabled={mode === 'RENT' && rentalConfig && !rentalConfig.isAvailable}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '0.88rem',
                  letterSpacing: '0.08em',
                  cursor: 'pointer'
                }}
              >
                + ADD TO SELECTION LIST
              </button>
            </div>

            <p style={{ fontSize: '0.76rem', color: 'var(--text-brown)', marginTop: '16px', textAlign: 'center', fontStyle: 'italic' }}>
              ✦ No online card or UPI payment taken. Purchases &amp; bespoke orders are finalized directly on WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

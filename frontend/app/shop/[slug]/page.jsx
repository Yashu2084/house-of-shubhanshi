'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '../../../lib/api';
import { formatPrice, brandInfo } from '../../../lib/utils';
import { useCart } from '../../../context/CartContext';
import { useLightbox } from '../../../components/ImageLightbox';
import RentalSelector from '../../../components/RentalSelector';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('BUY');
  const [rentalConfig, setRentalConfig] = useState(null);
  const { addItem } = useCart();
  const { openLightbox } = useLightbox();

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        setLoading(true);
        // Try fetching single product or all products to find match
        let found = null;
        try {
          const res = await api.get(`/products/${slug}`);
          if (res && res.success && res.data) {
            found = res.data;
          }
        } catch (e) {
          // If direct endpoint not found by slug, search in /products
        }

        if (!found) {
          const listRes = await api.get('/products');
          if (listRes && listRes.success && Array.isArray(listRes.data)) {
            found = listRes.data.find(p => p.id === slug || p.slug === slug);
          }
        }

        setProduct(found);
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
          Opening atelier garment portfolio...
        </p>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ paddingTop: '150px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <h2 className="font-serif" style={{ fontSize: '1.8rem', color: 'var(--brown-dark)', marginBottom: '14px' }}>
          GARMENT NOT FOUND
        </h2>
        <p style={{ color: 'var(--text-brown)', marginBottom: '24px' }}>
          The requested creation is either vaulted or no longer available.
        </p>
        <Link href="/shop" className="btn btn-gold">
          RETURN TO SHOP
        </Link>
      </main>
    );
  }

  const isRentable = !!product.isRentable;
  const formattedPrice = formatPrice(product.price);

  const handleBuy = () => {
    addItem(product, 1, null);
  };

  const handleRent = () => {
    if (!rentalConfig) return;
    if (!rentalConfig.isAvailable) {
      alert('Selected dates are currently unavailable. Please choose another date range.');
      return;
    }
    addItem(product, 1, rentalConfig);
  };

  const whatsappInquireText = encodeURIComponent(
    `Hello House of Shubhanshi, I would like to inquire about "${product.name}" (${formattedPrice}).`
  );

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
              ✦ Click image to inspect complete silhouette and handcrafted embroidery
            </p>
          </div>

          {/* Garment Details & Actions */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--gold-border)', padding: 'clamp(24px, 4vw, 40px)' }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 600 }}>
              {product.category || 'HANDCRAFTED COUTURE'}
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
                  ✦ BUY PIECE (PERMANENT)
                </button>
                <button
                  type="button"
                  className={`rental-mode-btn ${mode === 'RENT' ? 'active' : ''}`}
                  onClick={() => setMode('RENT')}
                >
                  ✧ RENT PIECE (1–7+ DAYS)
                </button>
              </div>
            )}

            {mode === 'BUY' ? (
              <div>
                <div style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif)', color: 'var(--brown-deep)', fontWeight: 600, marginBottom: '16px' }}>
                  {formattedPrice}
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-brown)', lineHeight: 1.8, marginBottom: '24px' }}>
                  {product.description}
                </p>

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
                    <span className="modal-detail-val">Bespoke Handcrafting (3–4 Weeks)</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-gold" onClick={handleBuy} style={{ flex: 1, minWidth: '200px' }}>
                    ADD TO BAG &bull; {formattedPrice}
                  </button>
                  <a
                    href={`${brandInfo.whatsappUrl}?text=${whatsappInquireText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold-outline"
                    style={{ flex: 1, minWidth: '200px', textAlign: 'center' }}
                  >
                    INQUIRE VIA WHATSAPP
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <RentalSelector
                  product={product}
                  onConfigChange={setRentalConfig}
                />
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={handleRent}
                  disabled={rentalConfig && !rentalConfig.isAvailable}
                  style={{ width: '100%', marginTop: '20px', padding: '16px' }}
                >
                  RESERVE ATELIER RENTAL &bull; {formatPrice(rentalConfig?.totalRentalCost || product.rentalBasePrice)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

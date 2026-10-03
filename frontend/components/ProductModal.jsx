'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  formatPrice,
  brandInfo,
  createSingleProductWhatsAppMessage,
  getWhatsAppUrl
} from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLightbox } from './ImageLightbox';
import RentalSelector from './RentalSelector';

export default function ProductModal({ product, onClose }) {
  const { addItem, showToast } = useCart();
  const { user } = useAuth();
  const { openLightbox } = useLightbox();
  const [mode, setMode] = useState('BUY'); // 'BUY' or 'RENT'
  const [rentalConfig, setRentalConfig] = useState(null);

  const availableLengths = (Array.isArray(product?.lengths) && product.lengths.length > 0)
    ? product.lengths
    : ['Standard (42")', 'Petite (39")', 'Tall (45")', 'Custom Length'];

  const [selectedLength, setSelectedLength] = useState(availableLengths[0] || 'Standard (42")');
  const [customLengthInput, setCustomLengthInput] = useState('');

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow || '';
      document.body.style.removeProperty('overflow');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!product) return null;

  const formattedPrice = formatPrice(product.price);
  const isRentable = !!product.isRentable;
  const isCustomLengthSelected = selectedLength.toLowerCase().includes('custom');

  const handleAddToSelection = () => {
    const isRental = mode === 'RENT';
    if (isRental) {
      if (!rentalConfig) return;
      if (!rentalConfig.isAvailable) {
        alert('Selected dates are currently unavailable. Please choose another date.');
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
    onClose();
  };

  const handleContinueOnWhatsApp = () => {
    const isRental = mode === 'RENT';
    if (isRental && rentalConfig && !rentalConfig.isAvailable) {
      alert('Selected dates are currently unavailable. Please choose another date.');
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
    onClose();
  };

  return (
    <div
      className="modal-backdrop open"
      id="productModal"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card">
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          &times;
        </button>

        <div className="modal-media">
          <img
            src={product.image}
            alt={product.name}
            onClick={() => openLightbox(product.image, product.name)}
            style={{ cursor: 'zoom-in' }}
            title="Click to view full garment silhouette"
          />
        </div>

        <div className="modal-body">
          <span className="modal-tag">{product.category || 'OCCASION WEAR'}</span>
          <h3 className="modal-title font-serif">{product.name}</h3>

          {isRentable && (
            <div className="rental-mode-switcher">
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

          {/* Pricing */}
          <div className="modal-price" style={{ margin: '8px 0 12px' }}>
            {mode === 'BUY'
              ? formattedPrice
              : formatPrice(rentalConfig?.rentalPrice || product.rentalBasePrice) + ' Rental Hire'}
          </div>

          <p className="modal-desc">{product.description}</p>

          {/* LENGTH SELECTION */}
          <div style={{ marginBottom: '16px', background: 'var(--ivory)', border: '1px solid var(--gold-border)', padding: '12px 14px' }}>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--brown-dark)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Select Length:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {availableLengths.map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => setSelectedLength(len)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    border: selectedLength === len ? '1.5px solid var(--gold)' : '1px solid #d4c5b9',
                    background: selectedLength === len ? 'var(--gold)' : 'var(--white)',
                    color: selectedLength === len ? '#fff' : 'var(--brown-dark)',
                    fontWeight: selectedLength === len ? 600 : 400,
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  {len}
                </button>
              ))}
            </div>

            {isCustomLengthSelected && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  value={customLengthInput}
                  onChange={(e) => setCustomLengthInput(e.target.value)}
                  placeholder="Enter custom length (e.g. 43.5 inches)"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    border: '1px solid var(--gold-border)',
                    background: 'var(--white)',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Garment Details */}
          <div className="modal-details-list">
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

          {/* RENTAL CONFIG */}
          {mode === 'RENT' && (
            <div style={{ marginTop: '14px', marginBottom: '14px' }}>
              <RentalSelector
                product={product}
                onConfigChange={setRentalConfig}
              />
            </div>
          )}

          {/* ACTIONS */}
          <div className="modal-actions" style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-gold"
              onClick={handleContinueOnWhatsApp}
              disabled={mode === 'RENT' && rentalConfig && !rentalConfig.isAvailable}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              CONTINUE ON WHATSAPP
            </button>

            <button
              type="button"
              className="btn btn-gold-outline-dark"
              onClick={handleAddToSelection}
              disabled={mode === 'RENT' && rentalConfig && !rentalConfig.isAvailable}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.84rem'
              }}
            >
              + ADD TO SELECTION LIST
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

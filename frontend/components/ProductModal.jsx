'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPrice, brandInfo } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useLightbox } from './ImageLightbox';
import RentalSelector from './RentalSelector';

export default function ProductModal({ product, onClose }) {
  const { addItem } = useCart();
  const { openLightbox } = useLightbox();
  const [mode, setMode] = useState('BUY'); // 'BUY' or 'RENT'
  const [rentalConfig, setRentalConfig] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const formattedPrice = formatPrice(product.price);
  const isRentable = !!product.isRentable;

  const handleBuyAdd = () => {
    addItem(product, 1, null);
    onClose();
  };

  const handleRentAdd = () => {
    if (!rentalConfig) return;
    if (!rentalConfig.isAvailable) {
      alert('Selected dates are currently unavailable. Please choose another date.');
      return;
    }
    addItem(product, 1, rentalConfig);
    onClose();
  };

  const whatsappInquireText = encodeURIComponent(
    `Hello House of Shubhanshi, I would like to inquire about "${product.name}" (${formattedPrice}).`
  );

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

          {mode === 'BUY' ? (
            <div id="buyModeContainer">
              <div className="modal-price">{formattedPrice}</div>
              <p className="modal-desc">{product.description}</p>

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

              <div className="modal-actions" style={{ marginTop: '18px' }}>
                <button
                  type="button"
                  className="btn btn-gold modal-add-to-bag"
                  onClick={handleBuyAdd}
                >
                  ADD TO BAG &bull; {formattedPrice}
                </button>
                <a
                  href={`${brandInfo.whatsappUrl}?text=${whatsappInquireText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold-outline modal-enquire-whatsapp"
                >
                  INQUIRE VIA WHATSAPP
                </a>
              </div>
            </div>
          ) : (
            <div id="rentModeContainer">
              <RentalSelector
                product={product}
                onConfigChange={setRentalConfig}
              />
              <div className="modal-actions" style={{ marginTop: '18px' }}>
                <button
                  type="button"
                  className="btn btn-gold modal-add-to-bag"
                  onClick={handleRentAdd}
                  disabled={rentalConfig && !rentalConfig.isAvailable}
                >
                  RESERVE ATELIER RENTAL &bull; {formatPrice(rentalConfig?.totalRentalCost || product.rentalBasePrice)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

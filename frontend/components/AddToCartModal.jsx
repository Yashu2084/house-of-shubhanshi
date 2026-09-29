'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../lib/utils';

export default function AddToCartModal() {
  const { modalItem, isModalOpen, closeModal } = useCart();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  if (!isModalOpen || !modalItem) return null;

  const isRental = !!modalItem.isRental;
  const headerText = isRental ? 'RENTAL ADDED TO CART' : 'ADDED TO CART';
  const priceDisplay = isRental
    ? formatPrice(modalItem.rentalPrice)
    : formatPrice(modalItem.price);

  const metaText = isRental
    ? `${modalItem.rentalDays} Days • Deposit: ${formatPrice(modalItem.securityDeposit || 0)} (Refundable)`
    : (modalItem.category || 'Atelier Garment');

  return (
    <div
      className={`cart-popup-backdrop ${isModalOpen ? 'open' : ''}`}
      id="cartConfirmationModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="cart-popup-card" role="dialog" aria-modal="true" aria-labelledby="cartPopupTitle">
        <button
          type="button"
          className="cart-popup-close-x"
          onClick={closeModal}
          aria-label="Close confirmation dialog"
        >
          &times;
        </button>

        <div className="cart-popup-header">
          <span className="cart-popup-check">✓</span>
          <span id="cartPopupTitle">{headerText}</span>
        </div>

        <div className="cart-popup-body">
          <img src={modalItem.image} alt={modalItem.name} className="cart-popup-thumb" />
          <div className="cart-popup-info">
            <h4 className="cart-popup-title">{modalItem.name}</h4>
            <div className="cart-popup-meta">{metaText}</div>
            <div className="cart-popup-price">{priceDisplay}</div>
          </div>
        </div>

        <div className="cart-popup-actions">
          <Link href="/cart" className="btn btn-gold cart-popup-view-btn" onClick={closeModal}>
            VIEW CART
          </Link>
          <button
            type="button"
            className="btn btn-gold-outline-dark cart-popup-continue-btn"
            onClick={closeModal}
          >
            CONTINUE SHOPPING
          </button>
        </div>
      </div>
    </div>
  );
}

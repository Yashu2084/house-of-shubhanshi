'use client';

import React, { useState } from 'react';
import { formatPrice } from '../lib/utils';
import { useCart } from '../context/CartContext';
import { useLightbox } from './ImageLightbox';

export default function CartItem({ item }) {
  const { removeItem, updateQuantity } = useCart();
  const { openLightbox } = useLightbox();
  const [isRemoving, setIsRemoving] = useState(false);

  const isRental = item.purchaseType === 'RENT';
  const itemId = item.cartItemId || item.productId;

  const handleRemove = (e) => {
    e.preventDefault();
    setIsRemoving(true);
    setTimeout(() => {
      removeItem(itemId);
    }, 300);
  };

  return (
    <div className={`cart-item-row ${isRemoving ? 'removing' : ''}`} data-id={itemId}>
      <img
        src={item.image}
        alt={item.name}
        className="cart-item-thumb"
        onClick={() => openLightbox(item.image, item.name)}
        style={{ cursor: 'zoom-in' }}
        title="Click to view garment"
      />

      <div className="cart-item-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.68rem', letterSpacing: '0.16em', color: 'var(--gold)', textTransform: 'uppercase' }}>
            {item.category || 'ATELIER PIECE'}
          </span>
          {isRental ? (
            <span className="badge-status badge-status-reserved" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
              RENTAL &bull; {item.rentalDays} DAYS
            </span>
          ) : (
            <span className="badge-status badge-status-active" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
              PURCHASE
            </span>
          )}
        </div>

        <h3 className="font-serif" style={{ fontSize: '1.15rem', color: 'var(--brown-dark)', margin: '4px 0' }}>
          {item.name}
        </h3>

        {isRental ? (
          <>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-brown)', marginBottom: '6px', background: 'var(--ivory)', padding: '6px 10px', borderLeft: '2px solid var(--gold)' }}>
              Dates: <strong>{item.rentalStartDate}</strong> &rarr; <strong>{item.rentalEndDate}</strong> ({item.rentalDays} Days)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--brown-deep)' }}>
                Hire Fee: {formatPrice(item.rentalPrice)}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--gold-dark)', fontWeight: 600 }}>
                + {formatPrice(item.securityDeposit)} Security Deposit (Refundable)
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--brown-deep)' }}>
            {formatPrice(item.price)}
          </div>
        )}
      </div>

      <div className="cart-item-controls-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
        {!isRental ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn-qty-minus"
              onClick={() => updateQuantity(itemId, -1)}
              style={{ width: '28px', height: '28px', border: '1px solid var(--gold-border)', background: 'var(--ivory)', cursor: 'pointer' }}
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span style={{ fontSize: '0.88rem', fontWeight: 600, width: '22px', textAlign: 'center' }}>
              {item.quantity}
            </span>
            <button
              type="button"
              className="btn-qty-plus"
              onClick={() => updateQuantity(itemId, 1)}
              style={{ width: '28px', height: '28px', border: '1px solid var(--gold-border)', background: 'var(--ivory)', cursor: 'pointer' }}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-brown)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            1 Unit
          </span>
        )}

        <button
          type="button"
          className="cart-remove-btn"
          onClick={handleRemove}
          aria-label={`Remove ${item.name} from bag`}
          title="Remove piece"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

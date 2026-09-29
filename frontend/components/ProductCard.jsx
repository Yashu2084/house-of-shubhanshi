'use client';

import React from 'react';
import Link from 'next/link';
import { formatPrice } from '../lib/utils';
import { useLightbox } from './ImageLightbox';

export default function ProductCard({ product, index = 0, onQuickView }) {
  const { openLightbox } = useLightbox();

  if (!product) return null;

  const formattedPrice = formatPrice(product.price);
  const badgeNum = (index + 1).toString().padStart(2, '0');
  const slug = product.slug || product.id;

  const handleImageClick = (e) => {
    e.stopPropagation();
    openLightbox(product.image, product.name);
  };

  return (
    <article className="product-card reveal-up reveal-active" data-id={product.id}>
      <div className="product-image-wrap scale-hover">
        <span className="product-number-badge">{badgeNum}</span>
        {product.isRentable && (
          <span className="badge-rent-avail">RENT AVAILABLE</span>
        )}
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          loading="lazy"
          onClick={handleImageClick}
          style={{ cursor: 'zoom-in' }}
          title="Click to inspect garment drape & embroidery"
        />
        <button
          className="product-quick-view"
          type="button"
          onClick={() => onQuickView ? onQuickView(product) : null}
        >
          VIEW PIECE
        </button>
      </div>

      <div className="product-info">
        <span className="product-category">{product.category || 'BESPOKE ATELIER'}</span>
        <h3 className="product-name font-serif">
          <Link href={`/shop/${slug}`}>{product.name}</Link>
        </h3>
        <p className="product-desc line-clamp-2">{product.description}</p>
        <div className="product-price">
          {formattedPrice}
          {product.isRentable && (
            <span style={{ fontSize: '0.74rem', color: 'var(--gold-dark)', fontWeight: 'normal', marginLeft: '8px' }}>
              | Rent from {formatPrice(product.rentalBasePrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

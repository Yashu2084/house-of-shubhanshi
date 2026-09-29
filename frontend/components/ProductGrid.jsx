'use client';

import React from 'react';
import ProductCard from './ProductCard';

export default function ProductGrid({
  products = [],
  collections = [],
  selectedCollection = 'all',
  onSelectCollection,
  onQuickView
}) {
  return (
    <div>
      {/* Collection Filter Buttons */}
      {collections.length > 0 && (
        <div className="collection-filters" id="collectionFilterWrap">
          <button
            type="button"
            className={`filter-btn ${selectedCollection === 'all' ? 'active' : ''}`}
            onClick={() => onSelectCollection && onSelectCollection('all')}
          >
            ALL PIECES
          </button>
          {collections.map((col) => (
            <button
              key={col.id}
              type="button"
              className={`filter-btn ${selectedCollection === col.id ? 'active' : ''}`}
              onClick={() => onSelectCollection && onSelectCollection(col.id)}
            >
              {col.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="collection-grid">
        {products.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-brown)' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--brown-dark)' }}>
              No pieces currently available in this curation.
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              Explore our other collections or contact our bespoke concierge.
            </p>
          </div>
        ) : (
          products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              onQuickView={onQuickView}
            />
          ))
        )}
      </div>
    </div>
  );
}

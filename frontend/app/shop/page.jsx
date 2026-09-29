'use client';

import React, { useState, useEffect } from 'react';
import ProductGrid from '../../components/ProductGrid';
import ProductModal from '../../components/ProductModal';
import api from '../../lib/api';

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadShopData() {
      try {
        setLoading(true);
        const [prodRes, colRes] = await Promise.all([
          api.get('/products'),
          api.get('/collections')
        ]);

        if (prodRes && prodRes.success) {
          setProducts(prodRes.data || []);
        }
        if (colRes && colRes.success) {
          setCollections(colRes.data || []);
        }
      } catch (err) {
        console.error('Failed to load shop catalog:', err);
        setError('Unable to load atelier vault pieces. Please ensure the backend server is active.');
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, []);

  const filteredProducts = selectedCollection === 'all'
    ? products
    : products.filter(p => p.collectionId === selectedCollection);

  return (
    <main style={{ paddingTop: '130px', minHeight: '80vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
      <div className="container">
        {/* Page Header */}
        <div className="section-header reveal-init reveal-active" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="section-tag">ATELIER CATALOG &amp; RENTAL SALON</span>
          <h1 className="section-title">THE HOUSE OF SHUBHANSHI</h1>
          <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          <p className="section-subtitle">
            &ldquo;Acquire timeless heirlooms for permanent devotion, or reserve bespoke rentals for private celebrations.&rdquo;
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-brown)' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '12px' }}>✦</p>
            <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Unfolding the House of Shubhanshi atelier archive...
            </p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#991B1B' }}>
            <p>{error}</p>
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            collections={collections}
            selectedCollection={selectedCollection}
            onSelectCollection={setSelectedCollection}
            onQuickView={(p) => setSelectedProduct(p)}
          />
        )}
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}

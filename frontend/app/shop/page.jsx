'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGrid from '../../components/ProductGrid';
import ProductModal from '../../components/ProductModal';
import api from '../../lib/api';

function ShopContent() {
  const searchParams = useSearchParams();
  const collectionParam = searchParams.get('collection');

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
        const cacheBust = Date.now();
        const [prodRes, colRes] = await Promise.all([
          api.get(`/products?_t=${cacheBust}`),
          api.get(`/collections?_t=${cacheBust}`)
        ]);

        if (prodRes && prodRes.success) {
          setProducts(prodRes.data || []);
        }
        if (colRes && colRes.success) {
          const cols = colRes.data || [];
          setCollections(cols);

          if (collectionParam) {
            const matched = cols.find(c => c.id === collectionParam || c.slug === collectionParam);
            if (matched) {
              setSelectedCollection(matched.id);
            } else {
              setSelectedCollection(collectionParam);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load shop catalog:', err);
        setError('Unable to load atelier vault pieces. Please ensure the backend server is active.');
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, [collectionParam]);

  const filteredProducts = selectedCollection === 'all'
    ? products
    : products.filter(p => {
        if (!p) return false;
        if (p.collectionId === selectedCollection) return true;
        if (p.collection && (p.collection.id === selectedCollection || p.collection.slug === selectedCollection)) return true;
        const matchedCol = collections.find(c => c.id === selectedCollection || c.slug === selectedCollection);
        if (matchedCol && (p.collectionId === matchedCol.id || p.collectionId === matchedCol.slug)) return true;
        return false;
      });

  return (
    <main style={{ paddingTop: '130px', minHeight: '80vh', paddingBottom: '80px', backgroundColor: 'var(--ivory)' }}>
      <div className="container">
        {/* Page Header */}
        <div className="section-header reveal-init reveal-active" style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="section-tag">COLLECTION &amp; RENTALS</span>
          <h1 className="section-title">THE HOUSE OF SHUBHANSHI</h1>
          <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          <p className="section-subtitle">
            Thoughtfully designed Indian occasion wear available to purchase or rent for your celebrations.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-brown)' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '12px' }}>✦</p>
            <p style={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Loading the collection...
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

export default function ShopPage() {
  return (
    <Suspense fallback={
      <main style={{ paddingTop: '130px', minHeight: '80vh', textAlign: 'center', backgroundColor: 'var(--ivory)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', color: 'var(--gold)', marginTop: '40px' }}>✦</p>
        <p style={{ color: 'var(--text-brown)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
          Loading the collection...
        </p>
      </main>
    }>
      <ShopContent />
    </Suspense>
  );
}

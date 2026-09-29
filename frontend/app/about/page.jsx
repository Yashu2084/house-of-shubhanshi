import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'About the House — House of Shubhanshi | Heritage & Atelier',
  description: 'Discover the heritage chronicle of House of Shubhanshi. Celebrating generational karigars, indigenous royal silks, and modern architectural drapes.'
};

export default function AboutPage() {
  return (
    <main style={{ backgroundColor: 'var(--brown-deep)', paddingTop: '140px', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--ivory)' }}>
      <div className="container-narrow" style={{ padding: '60px 20px' }}>
        <span className="section-tag" style={{ color: 'var(--gold)' }}>HERITAGE &amp; ATELIER</span>
        <h1 className="section-title light" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.2rem)', marginBottom: '18px' }}>
          OUR CHRONICLE
        </h1>
        <div className="gold-divider">
          <span className="gold-divider-diamond"></span>
        </div>
        <p className="section-subtitle light" style={{ maxWidth: '720px', margin: '0 auto 36px', lineHeight: 1.8 }}>
          &ldquo;We are penning the full chronicle of House of Shubhanshi&mdash;a celebration of generational karigars, indigenous royal silks, and modern architectural drapes.&rdquo;
        </p>

        <div style={{ maxWidth: '640px', margin: '0 auto 40px', fontSize: '0.94rem', color: 'var(--ivory-muted, rgba(253, 251, 247, 0.85))', lineHeight: 1.9 }}>
          <p style={{ marginBottom: '16px' }}>
            Rooted in Varanasi, Chanderi, and Bengal looms, our atelier exists to preserve the living craft of Indian needlework: authentic marodi, intricate dabka, hand-beaten antique badla, and gossamer zari tissues.
          </p>
          <p>
            Whether bespoke wedding couture created over hundreds of devoted artisan hours, or a shared celebration through our atelier rental closet, every garment carries an enduring soul.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/shop" className="btn btn-gold">
            EXPLORE THE ATELIER PIECES
          </Link>
          <Link href="/#story" className="btn btn-gold-outline">
            VIEW OUR STORY
          </Link>
        </div>
      </div>
    </main>
  );
}

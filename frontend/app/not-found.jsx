import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found — House of Shubhanshi',
  description: 'The requested piece or salon could not be located in the atelier archive.'
};

export default function NotFound() {
  return (
    <main
      style={{
        paddingTop: '160px',
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: 'var(--ivory)',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'var(--white)',
          border: '1px solid var(--gold-border)',
          padding: 'clamp(30px, 5vw, 60px)',
          maxWidth: '560px',
          boxShadow: '0 10px 30px rgba(59, 29, 20, 0.06)'
        }}
      >
        <div style={{ fontSize: '2.4rem', color: 'var(--gold)', marginBottom: '14px' }}>✦</div>
        <span className="section-tag">ARCHIVE 404</span>
        <h1
          className="font-serif"
          style={{
            fontSize: '1.8rem',
            color: 'var(--brown-dark)',
            margin: '8px 0 14px'
          }}
        >
          THE PAGE YOU&apos;RE LOOKING FOR COULDN&apos;T BE FOUND
        </h1>
        <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--text-brown)',
            lineHeight: 1.7,
            marginBottom: '28px'
          }}
        >
          The atelier creation or private chamber you sought has either been vaulted or relocated in our archives.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-gold">
            BACK TO HOME
          </Link>
          <Link href="/shop" className="btn btn-gold-outline-dark">
            EXPLORE ARCHIVE
          </Link>
        </div>
      </div>
    </main>
  );
}

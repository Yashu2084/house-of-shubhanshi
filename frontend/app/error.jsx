'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error('Atelier Error Caught:', error);
  }, [error]);

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
        <span className="section-tag">ATELIER NOTICE</span>
        <h1
          className="font-serif"
          style={{
            fontSize: '1.8rem',
            color: 'var(--brown-dark)',
            margin: '8px 0 14px'
          }}
        >
          AN UNEXPECTED PAUSE
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
          We encountered an unexpected moment while presenting this archive piece. Our master technicians have been notified.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-gold"
            onClick={() => reset()}
          >
            TRY AGAIN
          </button>
          <Link href="/" className="btn btn-gold-outline-dark">
            RETURN TO ATELIER HOME
          </Link>
        </div>
      </div>
    </main>
  );
}

import React from 'react';

export default function Loading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        backgroundColor: 'var(--ivory)',
        color: 'var(--brown-dark)'
      }}
    >
      <div
        style={{
          fontSize: '2.5rem',
          color: 'var(--gold)',
          animation: 'spin 3s linear infinite',
          marginBottom: '16px'
        }}
      >
        ✦
      </div>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          letterSpacing: '0.12em',
          color: 'var(--brown-dark)',
          textTransform: 'uppercase'
        }}
      >
        House of Shubhanshi
      </p>
      <span
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          color: 'var(--gold-dark)',
          marginTop: '6px'
        }}
      >
        WEAR THE DREAM &bull; LOADING ATELIER...
      </span>
    </div>
  );
}

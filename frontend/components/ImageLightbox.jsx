'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LightboxContext = createContext(null);

export function LightboxProvider({ children }) {
  const [lightboxData, setLightboxData] = useState(null);

  const openLightbox = useCallback((src, alt) => {
    if (!src) return;
    setLightboxData({ src, alt });
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxData(null);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
      document.body.style.removeProperty('overflow');
      document.documentElement.style.overflow = '';
      document.documentElement.style.removeProperty('overflow');
    }
  }, []);

  useEffect(() => {
    if (!lightboxData) {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
        document.body.style.removeProperty('overflow');
        document.documentElement.style.overflow = '';
        document.documentElement.style.removeProperty('overflow');
      }
      return;
    }

    const prevBodyOverflow = document.body.style.overflow;
    const prevDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = prevBodyOverflow || '';
        document.body.style.removeProperty('overflow');
        document.documentElement.style.overflow = prevDocOverflow || '';
        document.documentElement.style.removeProperty('overflow');
      }
    };
  }, [lightboxData, closeLightbox]);

  return (
    <LightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}
      {lightboxData && (
        <div
          className="image-lightbox open active"
          id="imageLightbox"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLightbox();
          }}
        >
          <div
            className="lightbox-backdrop"
            onClick={closeLightbox}
            aria-hidden="true"
          />
          <div className="lightbox-dialog lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close-btn"
              onClick={closeLightbox}
              aria-label="Close Lightbox"
            >
              &times;
            </button>
            <img
              className="lightbox-image"
              src={lightboxData.src}
              alt={lightboxData.alt || 'Garment Full View'}
            />
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  );
}

export function useLightbox() {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error('useLightbox must be used within a LightboxProvider');
  }
  return context;
}

export default LightboxProvider;

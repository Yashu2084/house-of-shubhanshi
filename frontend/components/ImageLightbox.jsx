'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const LightboxContext = createContext(null);

export function LightboxProvider({ children }) {
  const [lightboxData, setLightboxData] = useState(null);

  const openLightbox = (src, alt) => {
    setLightboxData({ src, alt });
  };

  const closeLightbox = () => {
    setLightboxData(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && lightboxData) {
        closeLightbox();
      }
    };
    if (lightboxData) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxData]);

  return (
    <LightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}
      {lightboxData && (
        <div className="image-lightbox active" id="imageLightbox" role="dialog" aria-modal="true">
          <div className="lightbox-backdrop" onClick={closeLightbox}></div>
          <div className="lightbox-content">
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

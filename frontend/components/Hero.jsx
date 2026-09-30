'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';

export default function Hero() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Autoplay restrictions or low power mode caught cleanly without UI flicker
        console.info('Hero video autoplay deferred by browser policy; showing poster cleanly.', error);
      });
    }
  }, []);

  return (
    <section className="hero-section" id="hero">
      {/* Full Viewport Background Video with Poster Fallback */}
      <video
        ref={videoRef}
        className="hero-video-bg"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/images/hero/hero-poster.webp"
        aria-hidden="true"
      >
        <source src="/assets/video/hero-desktop.mp4" type="video/mp4" media="(min-width: 769px)" />
        <source src="/assets/video/hero-mobile.mp4" type="video/mp4" />
      </video>

      {/* Warm Brown Subtle Tint Overlay */}
      <div className="hero-overlay"></div>

      {/* Hero Content */}
      <div className="hero-content">
        <span className="hero-tag reveal-init reveal-active">HOUSE OF SHUBHANSHI</span>
        <h1 className="hero-title reveal-init delay-1 reveal-active">WEAR THE DREAM</h1>
        <p className="hero-tagline reveal-init delay-2 reveal-active" style={{ maxWidth: '640px', margin: '0 auto 28px', fontSize: 'clamp(1rem, 1.8vw, 1.25rem)', lineHeight: 1.6, color: '#FDFBF7' }}>
          Thoughtfully designed Indian wear, made to feel as beautiful as it looks.
        </p>

        <div className="hero-cta-group reveal-init delay-3 reveal-active">
          <Link href="/shop" className="btn btn-gold">
            EXPLORE THE COLLECTION <span className="btn-arrow">&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <a href="#collection" className="hero-scroll-indicator" aria-label="Scroll to collection">
        <span>EXPLORE</span>
        <span className="scroll-arrow">&darr;</span>
      </a>
    </section>
  );
}

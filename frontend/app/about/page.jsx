import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'About Us — House of Shubhanshi | Indian Occasion Wear',
  description: 'Learn about House of Shubhanshi. Thoughtfully designed Indian festive and wedding wear made for celebration, comfort, and effortless elegance.'
};

export default function AboutPage() {
  return (
    <main style={{ backgroundColor: 'var(--brown-deep)', paddingTop: '140px', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--ivory)' }}>
      <div className="container-narrow" style={{ padding: '60px 20px' }}>
        <span className="section-tag" style={{ color: 'var(--gold)' }}>OUR PHILOSOPHY</span>
        <h1 className="section-title light" style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', marginBottom: '18px' }}>
          OUR STORY
        </h1>
        <div className="gold-divider">
          <span className="gold-divider-diamond"></span>
        </div>
        <p className="section-subtitle light" style={{ maxWidth: '680px', margin: '0 auto 32px', lineHeight: 1.7, fontSize: '1.15rem' }}>
          &ldquo;Rooted in Indian design, made for the way we celebrate today.&rdquo;
        </p>

        <div style={{ maxWidth: '640px', margin: '0 auto 40px', fontSize: '0.96rem', color: 'rgba(253, 251, 247, 0.9)', lineHeight: 1.9 }}>
          <p style={{ marginBottom: '18px' }}>
            House of Shubhanshi was founded to bring thoughtful, beautiful Indian occasion wear to modern wardrobes. We believe that festive dressing should be exciting and comfortable — clothes that feel as good as they look in person and in photos.
          </p>
          <p style={{ marginBottom: '18px' }}>
            Each ensemble is designed with clean cuts, balanced proportions, and fine detailing along necklines, borders, and dupattas. From graceful anarkalis to flared lehengas and tailored suit sets, our focus is on effortless movement and lasting quality.
          </p>
          <p>
            Whether you want to invest in a keepsake outfit to wear for years or rent a statement look for an upcoming celebration, House of Shubhanshi is here to help you dress with quiet confidence.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/shop" className="btn btn-gold">
            EXPLORE THE COLLECTION
          </Link>
          <Link href="/#story" className="btn btn-gold-outline">
            VIEW DESIGN HIGHLIGHTS
          </Link>
        </div>
      </div>
    </main>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Hero from '../components/Hero';
import ProductModal from '../components/ProductModal';
import { useLightbox } from '../components/ImageLightbox';
import api from '../lib/api';

const FEATURED_PRODUCTS_FALLBACK = [
  {
    id: 'prod_01',
    name: 'The Noor Set',
    category: 'RAW SILK & ORGANZA',
    price: 48500,
    isRentable: true,
    rentalBasePrice: 4500,
    rentalPricePerDay: 1200,
    rentalDeposit: 10000,
    minimumRentalDays: 1,
    maximumRentalDays: 30,
    rentalAvailableStock: 2,
    image: '/assets/images/collection/noor-set.jpg',
    description: 'An ode to luminous celebrations. Handcrafted raw silk kurta paired with delicate zardozi embroidery and gossamer organza dupatta.',
    fabric: 'Pure Raw Silk & Organza',
    color: 'Warm Ivory with Antique Gold',
    size: 'Custom Tailored / S, M, L, XL'
  },
  {
    id: 'prod_02',
    name: 'The Shubh Lehenga',
    category: 'ROYAL VELVET COUTURE',
    price: 82000,
    isRentable: true,
    rentalBasePrice: 7500,
    rentalPricePerDay: 1800,
    rentalDeposit: 15000,
    minimumRentalDays: 2,
    maximumRentalDays: 30,
    rentalAvailableStock: 1,
    image: '/assets/images/collection/shubh-lehenga.jpg',
    description: 'Deep terracotta velvet with 320 hours of heirloom marodi and salma sitara needlework, paired with architectural choli and sheer tissue veil.',
    fabric: 'Micro-Velvet & Tissue Silk',
    color: 'Deep Terracotta & Antique Gold',
    size: 'Bespoke Tailoring'
  },
  {
    id: 'prod_03',
    name: 'The Zariya Edit',
    category: 'METALLIC TISSUE SAREE',
    price: 36000,
    isRentable: true,
    rentalBasePrice: 3200,
    rentalPricePerDay: 800,
    rentalDeposit: 8000,
    minimumRentalDays: 1,
    maximumRentalDays: 30,
    rentalAvailableStock: 3,
    image: '/assets/images/collection/zariya-edit.jpg',
    description: 'Antique gold metallic tissue weave with hand-embroidered resham and badla accents. Drapes with liquid grace for high-octane celebratory soirees.',
    fabric: 'Pure Tissue Silk Saree',
    color: 'Metallic Antique Gold',
    size: '5.5 Meters + 1m Blouse'
  },
  {
    id: 'prod_04',
    name: 'The Aabha Collection',
    category: 'CHANDERI ANARKALI',
    price: 64000,
    isRentable: true,
    rentalBasePrice: 5500,
    rentalPricePerDay: 1400,
    rentalDeposit: 12000,
    minimumRentalDays: 1,
    maximumRentalDays: 30,
    rentalAvailableStock: 2,
    image: '/assets/images/collection/aabha-collection.jpg',
    description: 'Flared kalidar anarkali in pure chanderi with vintage rose gold gota patti, fine sequin borders, and handcrafted potli tassels.',
    fabric: 'Handwoven Chanderi Silk',
    color: 'Dusty Rose & Antique Zari',
    size: 'Custom Tailored'
  }
];

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState(FEATURED_PRODUCTS_FALLBACK);
  const { openLightbox } = useLightbox();

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get('/products');
        if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFeaturedProducts(res.data.slice(0, 4));
        }
      } catch (e) {
        // Fallback already pre-populated
      }
    }
    loadProducts();
  }, []);

  return (
    <main>
      {/* 1. HERO SECTION */}
      <Hero />

      {/* 2. CLOTH COLLECTION */}
      <section className="collection-section" id="collection">
        <div className="container">
          <div className="section-header reveal-init reveal-active">
            <span className="section-tag">CURATED ATELIER PIECES</span>
            <h2 className="section-title">THE COLLECTION</h2>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
            <p className="section-subtitle">&ldquo;Crafted for those who wear their story.&rdquo;</p>
          </div>

          <div className="collection-grid">
            {featuredProducts.map((prod, index) => {
              const badgeNum = (index + 1).toString().padStart(2, '0');
              return (
                <article key={prod.id} className="product-card reveal-init reveal-active" data-id={prod.id}>
                  <div className="product-image-wrap scale-hover">
                    <span className="product-number-badge">{badgeNum}</span>
                    {prod.isRentable && (
                      <span className="badge-rent-avail">RENT AVAILABLE</span>
                    )}
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="product-image"
                      loading="lazy"
                      onClick={() => openLightbox(prod.image, prod.name)}
                      style={{ cursor: 'zoom-in' }}
                      title="Click to view garment"
                    />
                    <button
                      className="product-quick-view"
                      type="button"
                      onClick={() => setSelectedProduct(prod)}
                    >
                      VIEW PIECE
                    </button>
                  </div>
                  <div className="product-info">
                    <span className="product-category">{prod.category || 'RAW SILK & ORGANZA'}</span>
                    <h3 className="product-name font-serif">{prod.name}</h3>
                    <p className="product-desc line-clamp-2">{prod.description}</p>
                    <div className="product-price">
                      ₹{Number(prod.price).toLocaleString('en-IN')}
                      {prod.isRentable && (
                        <span style={{ fontSize: '0.74rem', color: 'var(--gold-dark)', fontWeight: 'normal', marginLeft: '8px' }}>
                          | Rent from ₹{Number(prod.rentalBasePrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="collection-cta-wrap reveal-init reveal-active" style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link href="/shop" className="btn btn-gold-outline-dark">
              VIEW ALL COLLECTIONS <span className="btn-arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. OUR STORY */}
      <section className="story-section" id="story">
        <div className="container">
          <div className="story-grid">
            <div className="story-image-wrap reveal-init reveal-active">
              <div className="story-arch">
                <img
                  src="/assets/images/story/our-story.jpg"
                  alt="Atelier Craftsmanship - House of Shubhanshi"
                  loading="lazy"
                  onClick={() => openLightbox('/assets/images/story/our-story.jpg', 'Atelier Craftsmanship')}
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
              <div className="story-arch-badge">
                <span className="badge-year">2026</span>
                <span className="badge-label">HERITAGE ATELIER</span>
              </div>
            </div>

            <div className="story-content reveal-init delay-1 reveal-active">
              <span className="section-tag">ATELIER &amp; PHILOSOPHY</span>
              <h2 className="section-title light">OUR STORY</h2>
              <div className="gold-accent-line"></div>

              <h3 className="story-lead">&ldquo;Rooted in tradition. Designed for tomorrow.&rdquo;</h3>

              <p className="story-paragraph">
                House of Shubhanshi was conceived out of an enduring devotion to Indian couture craftsmanship. In a world of transient micro-trends, we seek refuge in the slow, sacred rhythm of master looms and generational karigari.
              </p>

              <p className="story-paragraph">
                Each silhouette is an architectural conversation between India&apos;s imperial textile legacy and the modern woman&apos;s quiet majesty. From the rhythmic hand-beating of raw zari to the delicate draping of tissue silks, every thread is imbued with devotion, heritage, and uncompromising grace.
              </p>

              <div className="story-signature">
                <Link href="/about" className="btn btn-gold-outline">
                  DISCOVER OUR STORY <span className="btn-arrow">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FUTURE DESIGNS */}
      <section className="future-section" id="future">
        <div className="container">
          <div className="section-header reveal-init reveal-active">
            <span className="section-tag">VISION &amp; RUNWAY</span>
            <h2 className="section-title">THE FUTURE OF SHUBHANSHI</h2>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
            <p className="section-subtitle">&ldquo;Tradition is our foundation. Imagination is our future.&rdquo;</p>
          </div>

          <div className="future-collage">
            <div className="future-card featured reveal-init reveal-active">
              <div className="future-img-wrap" style={{ minHeight: '480px' }}>
                <img
                  src="/assets/images/future/future-01.jpg"
                  alt="Future Silhouette Concept"
                  loading="lazy"
                  onClick={() => openLightbox('/assets/images/future/future-01.jpg', 'Sculptural Draping')}
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
              <div className="future-card-content">
                <span className="future-card-tag">NEW SILHOUETTES</span>
                <h3 className="future-card-title">Sculptural Draping</h3>
                <p className="future-card-desc">Redefining traditional drapes into avant-garde evening silhouettes for the global Indian patron.</p>
              </div>
            </div>

            <div className="future-card reveal-init delay-1 reveal-active">
              <div className="future-img-wrap">
                <img
                  src="/assets/images/future/future-02.jpg"
                  alt="Antique Gold Thread Weave"
                  loading="lazy"
                  onClick={() => openLightbox('/assets/images/future/future-02.jpg', 'Organic Metallic Zari')}
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
              <div className="future-card-content">
                <span className="future-card-tag">SLOW TEXTILES</span>
                <h3 className="future-card-title">Organic Metallic Zari</h3>
                <p className="future-card-desc">Reviving lost imperial metallurgical spinning techniques for featherlight luxury.</p>
              </div>
            </div>

            <div className="future-manifest-card reveal-init delay-2 reveal-active">
              <p className="future-manifest-text">
                &ldquo;We do not design garments for a single season. We craft memories meant to be passed down through generations.&rdquo;
              </p>
              <span className="future-manifest-author">&mdash; Shubhanshi Atelier Manifesto</span>
            </div>

            <div className="future-card reveal-init delay-3 reveal-active">
              <div className="future-img-wrap">
                <img
                  src="/assets/images/future/future-03.jpg"
                  alt="Atelier Moodboard & Sketches"
                  loading="lazy"
                  onClick={() => openLightbox('/assets/images/future/future-03.jpg', 'The Design Room')}
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
              <div className="future-card-content">
                <span className="future-card-tag">BEHIND THE SEAMS</span>
                <h3 className="future-card-title">The Design Room</h3>
                <p className="future-card-desc">Where sketchbooks, raw pigments, and poetic inspirations converge into couture.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STORIES BEHIND PIECES */}
      <section className="pieces-section" id="pieces">
        <div className="container">
          <div className="section-header reveal-init reveal-active">
            <span className="section-tag">PHILOSOPHY &amp; JOURNEY</span>
            <h2 className="section-title light">THE STORY BEHIND THE PIECES</h2>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
            <p className="section-subtitle light">&ldquo;Every garment is an heirloom in the making.&rdquo;</p>
          </div>

          <div className="pieces-container">
            {/* Chapter 01 */}
            <article className="piece-row reveal-init reveal-active">
              <div className="piece-visual">
                <img
                  src="/assets/images/pieces/piece-01-beginning.jpg"
                  alt="Chapter 01 - The Beginning"
                  loading="lazy"
                  onClick={() => openLightbox('/assets/images/pieces/piece-01-beginning.jpg', 'Chapter 01 - The Beginning')}
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
              <div className="piece-text">
                <div className="piece-num">01</div>
                <h3 className="piece-title">THE BEGINNING</h3>
                <p className="piece-body">
                  Every thread begins with an idea. Sourced from the finest native silk cultivators across Varanasi and Chanderi, the raw yarn is spun with intention and unhurried reverence for nature.
                </p>
                <blockquote className="piece-quote">
                  &ldquo;Before the needle meets the fabric, the dream is already woven into the warp and weft.&rdquo;
                </blockquote>
              </div>
            </article>

            {/* Chapter 02 */}
            <article className="piece-row reverse reveal-init reveal-active">
              <div className="piece-visual">
                <img
                  src="/assets/images/pieces/piece-02-craft.jpg"
                  alt="Chapter 02 - The Craft"
                  loading="lazy"
                  onClick={() => openLightbox('/assets/images/pieces/piece-02-craft.jpg', 'Chapter 02 - The Craft')}
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
              <div className="piece-text">
                <div className="piece-num">02</div>
                <h3 className="piece-title">THE CRAFT</h3>
                <p className="piece-body">
                  Every detail carries the hands and heritage behind it. Generations of master karigars spend hundreds of hours hand-carving wooden blocks, beating antique metal wires, and executing microscopic zardozi stitches that catch the light like liquid gold.
                </p>
                <blockquote className="piece-quote">
                  &ldquo;Our artisans do not simply sew; they preserve a living civilization of Indian textile artistry.&rdquo;
                </blockquote>
              </div>
            </article>

            {/* Chapter 03 */}
            <article className="piece-row reveal-init reveal-active">
              <div className="piece-visual">
                <img
                  src="/assets/images/pieces/piece-03-dream.jpg"
                  alt="Chapter 03 - The Dream"
                  loading="lazy"
                  onClick={() => openLightbox('/assets/images/pieces/piece-03-dream.jpg', 'Chapter 03 - The Dream')}
                  style={{ cursor: 'zoom-in' }}
                />
              </div>
              <div className="piece-text">
                <div className="piece-num">03</div>
                <h3 className="piece-title">THE DREAM</h3>
                <p className="piece-body">
                  Designed not simply to be worn, but remembered. When you drape a House of Shubhanshi ensemble, you don a tapestry of poetry, celebration, and royal poise—a quiet confidence meant for the most celebrated chapters of your life.
                </p>
                <blockquote className="piece-quote">
                  &ldquo;Wear your heritage with pride. Wear the dream.&rdquo;
                </blockquote>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 6. BRAND PROMISE / THE SHUBHANSHI STANDARD */}
      <section className="standard-section" id="standard">
        <div className="container">
          <div className="section-header reveal-init reveal-active">
            <span className="section-tag">OUR PROMISE</span>
            <h2 className="section-title">THE SHUBHANSHI STANDARD</h2>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
            <p className="section-subtitle">&ldquo;The hallmark of conscious Indian luxury.&rdquo;</p>
          </div>

          <div className="standards-grid">
            <div className="standard-card reveal-init delay-1 reveal-active">
              <div className="standard-numeral">01</div>
              <h3 className="standard-title">MADE IN INDIA</h3>
              <p className="standard-desc">Celebrating centuries of indigenous textile excellence and artisan communities.</p>
            </div>

            <div className="standard-card reveal-init delay-2 reveal-active">
              <div className="standard-numeral">02</div>
              <h3 className="standard-title">PURE CRAFT</h3>
              <p className="standard-desc">Thoughtfully created with obsessive attention to hand embroidery and artisanal finishing.</p>
            </div>

            <div className="standard-card reveal-init delay-3 reveal-active">
              <div className="standard-numeral">03</div>
              <h3 className="standard-title">PREMIUM FABRICS</h3>
              <p className="standard-desc">Handpicked pure silks, royal velvets, and handspun chanderi of unmatched character.</p>
            </div>

            <div className="standard-card reveal-init delay-4 reveal-active">
              <div className="standard-numeral">04</div>
              <h3 className="standard-title">TIMELESS DESIGN</h3>
              <p className="standard-desc">Silhouettes envisioned beyond fleeting seasons to become cherished family heirlooms.</p>
            </div>

            <div className="standard-card reveal-init delay-5 reveal-active">
              <div className="standard-numeral">05</div>
              <h3 className="standard-title">BESPOKE CARE</h3>
              <p className="standard-desc">Every piece is tailored to celebrate you, made to be loved, worn, and remembered.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CINEMATIC CTA */}
      <section className="final-cta-section">
        <img
          src="/assets/images/hero/final-cta-bg.jpg"
          alt="House of Shubhanshi Luxury Couture"
          className="final-cta-bg"
          loading="lazy"
        />
        <div className="final-cta-overlay"></div>

        <div className="final-cta-content reveal-init reveal-active">
          <span className="section-tag">STEP INTO THE ATELIER</span>
          <h2 className="final-cta-title">WEAR THE DREAM</h2>
          <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          <p className="final-cta-sub">
            &ldquo;Discover the House of Shubhanshi and find your signature heirloom piece.&rdquo;
          </p>

          <div className="final-cta-actions">
            <Link href="/shop" className="btn btn-gold">
              SHOP THE COLLECTION <span className="btn-arrow">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Quick View Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  );
}

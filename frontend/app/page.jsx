'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Hero from '../components/Hero';
import ProductModal from '../components/ProductModal';
import { useLightbox } from '../components/ImageLightbox';
import api from '../lib/api';

const FEATURED_PRODUCTS_FALLBACK = [
  {
    id: 'prod_real_purple',
    name: 'Purple Embroidered Kurta Set',
    slug: 'purple-embroidered-kurta-set',
    category: 'Suit Sets',
    price: 4499,
    isRentable: true,
    rentalBasePrice: 1199,
    rentalPricePerDay: 350,
    rentalDeposit: 2500,
    minimumRentalDays: 2,
    maximumRentalDays: 14,
    rentalAvailableStock: 3,
    image: '/images/products/purple-suit-set.webp',
    description: 'Deep purple straight-fit kurta set with delicate gold embroidery along the collar, placket, and cuffs. Accompanied by a matching sheer dupatta with fine scallop-edge detailing.',
    fabric: 'Silk Blend & Organza',
    color: 'Purple',
    size: 'S, M, L, XL'
  },
  {
    id: 'prod_real_brown',
    name: 'Earth Brown Flared Lehenga Set',
    slug: 'earth-brown-flared-lehenga-set',
    category: 'Lehengas',
    price: 5599,
    isRentable: true,
    rentalBasePrice: 1499,
    rentalPricePerDay: 450,
    rentalDeposit: 3000,
    minimumRentalDays: 2,
    maximumRentalDays: 14,
    rentalAvailableStock: 3,
    image: '/images/products/brown-lehenga-set.webp',
    description: 'Rich earthy brown flared lehenga skirt paired with a statement halter neck blouse adorned with ornate golden cutwork embroidery.',
    fabric: 'Crepe Silk Blend',
    color: 'Brown',
    size: 'S, M, L, XL'
  },
  {
    id: 'prod_real_green',
    name: 'Emerald Green Flared Anarkali Set',
    slug: 'emerald-green-flared-anarkali-set',
    category: 'Anarkalis',
    price: 6699,
    isRentable: true,
    rentalBasePrice: 1799,
    rentalPricePerDay: 550,
    rentalDeposit: 3500,
    minimumRentalDays: 2,
    maximumRentalDays: 14,
    rentalAvailableStock: 3,
    image: '/images/products/green-anarkali-set.webp',
    description: 'Flared emerald green anarkali silhouette accented with soft gathers, paired with a royal blue contrast dupatta finished with an antique gold border.',
    fabric: 'Georgette Silk Blend',
    color: 'Emerald Green',
    size: 'S, M, L, XL'
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
          setFeaturedProducts(res.data.slice(0, 6));
        }
      } catch (e) {
        // Fallback already pre-populated with real collection
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
            <span className="section-tag">NEW ARRIVALS</span>
            <h2 className="section-title">THE NEW COLLECTION</h2>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
            <p className="section-subtitle">Thoughtfully designed Indian wear for weddings, celebrations, and festive gatherings.</p>
          </div>

          <div className="collection-grid">
            {featuredProducts.map((prod, index) => {
              const badgeNum = (index + 1).toString().padStart(2, '0');
              const slug = prod.slug || prod.id;
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
                      style={{ cursor: 'zoom-in', objectFit: 'contain' }}
                      title="Click to view full image"
                    />
                    <button
                      className="product-quick-view"
                      type="button"
                      onClick={() => setSelectedProduct(prod)}
                    >
                      QUICK VIEW
                    </button>
                  </div>
                  <div className="product-info">
                    <span className="product-category">{prod.category || 'OCCASION WEAR'}</span>
                    <h3 className="product-name font-serif">
                      <Link href={`/shop/${slug}`}>{prod.name}</Link>
                    </h3>
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
              VIEW ALL DESIGNS <span className="btn-arrow">&rarr;</span>
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
                <Image
                  src="/assets/images/story/our-story.webp"
                  alt="House of Shubhanshi Design Story"
                  width={600}
                  height={800}
                  sizes="(max-width: 768px) 100vw, 500px"
                  loading="lazy"
                  decoding="async"
                  className="story-arch-img"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="story-arch-badge">
                <span className="badge-year">2026</span>
                <span className="badge-label">INDIAN DESIGN</span>
              </div>
            </div>

            <div className="story-content reveal-init delay-1 reveal-active">
              <span className="section-tag">WHO WE ARE</span>
              <h2 className="section-title light">OUR STORY</h2>
              <div className="gold-accent-line"></div>

              <h3 className="story-lead">&ldquo;Rooted in Indian craft, made for the way we dress today.&rdquo;</h3>

              <p className="story-paragraph">
                House of Shubhanshi was created with a clear purpose: to design occasion wear that feels effortless, flattering, and genuinely special to wear. We focus on clean silhouettes, rich festive palettes, and fine detailing that stands out without feeling overwhelming.
              </p>

              <p className="story-paragraph">
                Every piece is made to feel special — whether you&apos;re dressing up for a family wedding, an intimate celebration, or simply want an outfit that makes you feel confident the moment you put it on. With flexible options to buy or rent, great Indian fashion is now easier to enjoy.
              </p>

              <div className="story-signature">
                <Link href="/about" className="btn btn-gold-outline">
                  READ OUR STORY <span className="btn-arrow">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BEHIND THE DESIGNS */}
      <section className="future-section" id="future">
        <div className="container">
          <div className="section-header reveal-init reveal-active">
            <span className="section-tag">DESIGN VISION</span>
            <h2 className="section-title">BEHIND THE DESIGNS</h2>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
            <p className="section-subtitle">Comfortable fits, rich Indian color palettes, and versatile occasion wear.</p>
          </div>

          <div className="future-collage">
            <div className="future-card featured reveal-init reveal-active">
              <div className="future-img-wrap">
                <Image
                  src="/assets/images/future/future-01.webp"
                  alt="Celebration Silhouettes"
                  width={600}
                  height={800}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 450px"
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="future-card-content">
                <span className="future-card-tag">SILHOUETTES</span>
                <h3 className="future-card-title">Celebration-Ready Cuts</h3>
                <p className="future-card-desc">Flattering flared silhouettes and straight-fit cuts tailored for easy movement through festive gatherings.</p>
              </div>
            </div>

            <div className="future-card reveal-init delay-1 reveal-active">
              <div className="future-img-wrap">
                <Image
                  src="/assets/images/future/future-02.webp"
                  alt="Rich Tones & Details"
                  width={800}
                  height={600}
                  sizes="(max-width: 768px) 100vw, 400px"
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="future-card-content">
                <span className="future-card-tag">DETAILS</span>
                <h3 className="future-card-title">Rich Tones &amp; Accents</h3>
                <p className="future-card-desc">Jewel tones, warm earthy browns, and contrast dupattas finished with delicate border embroidery.</p>
              </div>
            </div>

            <div className="future-manifest-card reveal-init delay-2 reveal-active">
              <p className="future-manifest-text">
                &ldquo;Every piece is made to feel special — whether you&apos;re dressing up for a celebration or simply want to feel your best.&rdquo;
              </p>
              <span className="future-manifest-author">&mdash; House of Shubhanshi</span>
            </div>

            <div className="future-card reveal-init delay-3 reveal-active">
              <div className="future-img-wrap">
                <Image
                  src="/assets/images/future/future-03.webp"
                  alt="The Design Process"
                  width={800}
                  height={600}
                  sizes="(max-width: 768px) 100vw, 400px"
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="future-card-content">
                <span className="future-card-tag">VERSATILITY</span>
                <h3 className="future-card-title">Day to Evening Wear</h3>
                <p className="future-card-desc">Styles you can wear simply for afternoon ceremonies or glam up with jewelry for the evening reception.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STORIES BEHIND THE PIECES */}
      <section className="pieces-section" id="pieces">
        <div className="container">
          <div className="section-header reveal-init reveal-active">
            <span className="section-tag">HOW WE CREATE</span>
            <h2 className="section-title light">HOW WE CREATE EACH PIECE</h2>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
            <p className="section-subtitle light">Thoughtful design from initial sketch to the moment you wear it.</p>
          </div>

          <div className="pieces-container">
            {/* Chapter 01 */}
            <article className="piece-row reveal-init reveal-active">
              <div className="piece-visual">
                <Image
                  src="/assets/images/pieces/piece-01-beginning.webp"
                  alt="The Beginning - Thoughtful Design"
                  width={600}
                  height={800}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="piece-text">
                <div className="piece-num">01</div>
                <h3 className="piece-title">THOUGHTFUL DESIGN</h3>
                <p className="piece-body">
                  Every design begins with the silhouette. We look for fits that drape naturally, feel lightweight, and stay comfortable across long celebrations.
                </p>
                <blockquote className="piece-quote">
                  &ldquo;A great outfit starts with how comfortable you feel inside it.&rdquo;
                </blockquote>
              </div>
            </article>

            {/* Chapter 02 */}
            <article className="piece-row reverse reveal-init reveal-active">
              <div className="piece-visual">
                <Image
                  src="/assets/images/pieces/piece-02-craft.webp"
                  alt="The Details"
                  width={600}
                  height={800}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="piece-text">
                <div className="piece-num">02</div>
                <h3 className="piece-title">REFINED DETAILING</h3>
                <p className="piece-body">
                  From scallop-edge dupattas to fine thread accents along the collar and cuffs, we focus on subtle finishing that catches the light naturally without feeling heavy.
                </p>
                <blockquote className="piece-quote">
                  &ldquo;Details should speak gently, adding grace to every movement.&rdquo;
                </blockquote>
              </div>
            </article>

            {/* Chapter 03 */}
            <article className="piece-row reveal-init reveal-active">
              <div className="piece-visual">
                <Image
                  src="/assets/images/pieces/piece-03-dream.webp"
                  alt="Your Celebration"
                  width={600}
                  height={800}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div className="piece-text">
                <div className="piece-num">03</div>
                <h3 className="piece-title">YOUR CELEBRATION</h3>
                <p className="piece-body">
                  Clothes are meant to be worn, celebrated in, and remembered. Whether you choose to purchase an outfit for keeps or rent it for an upcoming weekend wedding, wear what brings you joy.
                </p>
                <blockquote className="piece-quote">
                  &ldquo;Made for moments that matter.&rdquo;
                </blockquote>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 6. BRAND PROMISE */}
      <section className="standard-section" id="standard">
        <div className="container">
          <div className="section-header reveal-init reveal-active">
            <span className="section-tag">OUR PROMISE</span>
            <h2 className="section-title">THE SHUBHANSHI PROMISE</h2>
            <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
            <p className="section-subtitle">Thoughtful Indian fashion with quality, fit, and convenience at its core.</p>
          </div>

          <div className="standards-grid">
            <div className="standard-card reveal-init delay-1 reveal-active">
              <div className="standard-numeral">01</div>
              <h3 className="standard-title">AUTHENTIC DESIGN</h3>
              <p className="standard-desc">Thoughtfully designed Indian outfits created with modern proportions and flattering fits.</p>
            </div>

            <div className="standard-card reveal-init delay-2 reveal-active">
              <div className="standard-numeral">02</div>
              <h3 className="standard-title">QUALITY FABRICS</h3>
              <p className="standard-desc">Carefully selected fabrics that offer fluid drape, rich color depth, and lasting wear.</p>
            </div>

            <div className="standard-card reveal-init delay-3 reveal-active">
              <div className="standard-numeral">03</div>
              <h3 className="standard-title">BUY OR RENT</h3>
              <p className="standard-desc">Enjoy the flexibility of owning your favorite pieces or renting them for specific celebrations.</p>
            </div>

            <div className="standard-card reveal-init delay-4 reveal-active">
              <div className="standard-numeral">04</div>
              <h3 className="standard-title">ALL-DAY COMFORT</h3>
              <p className="standard-desc">Outfits created to move with you comfortably from morning rituals to late-night dinners.</p>
            </div>

            <div className="standard-card reveal-init delay-5 reveal-active">
              <div className="standard-numeral">05</div>
              <h3 className="standard-title">CONCIERGE HELP</h3>
              <p className="standard-desc">Direct WhatsApp assistance whenever you need guidance with sizing, delivery dates, or styling.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="final-cta-section">
        <img
          src="/assets/images/hero/final-cta-bg.jpg"
          alt="House of Shubhanshi Celebration Wear"
          className="final-cta-bg"
          loading="lazy"
        />
        <div className="final-cta-overlay"></div>

        <div className="final-cta-content reveal-init reveal-active">
          <span className="section-tag">EXPLORE THE COLLECTION</span>
          <h2 className="final-cta-title">READY FOR YOUR NEXT OCCASION?</h2>
          <div className="gold-divider"><span className="gold-divider-diamond"></span></div>
          <p className="final-cta-sub">
            Explore our newest arrivals and find the perfect outfit for your upcoming celebrations.
          </p>

          <div className="final-cta-actions">
            <Link href="/shop" className="btn btn-gold">
              SHOP THE NEW COLLECTION <span className="btn-arrow">&rarr;</span>
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

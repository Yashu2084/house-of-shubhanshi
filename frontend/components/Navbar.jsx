'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalCount } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      if (!isHomePage) {
        setIsScrolled(true);
        return;
      }
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  }, [pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => {
      const next = !prev;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <>
      <header className={`site-header ${isScrolled || !isHomePage ? 'scrolled' : ''}`} id="siteHeader">
        <div className="container">
          <div className="header-inner">
            {/* Desktop Left Navigation */}
            <nav className="nav-group nav-left" aria-label="Primary Left Navigation">
              <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>
                ABOUT
              </Link>
              <Link href="/shop" className={`nav-link ${pathname.startsWith('/shop') ? 'active' : ''}`}>
                SHOP
              </Link>
            </nav>

            {/* Brand Logo Center */}
            <div className="header-logo-container">
              <Link href="/" className="brand-logo-link" aria-label="House of Shubhanshi Home">
                <img
                  src="/assets/logo/house-of-shubhanshi-logo.png"
                  alt="House of Shubhanshi — Wear the Dream"
                  className="brand-logo-img"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/logo/house-of-shubhanshi-logo.svg';
                  }}
                />
              </Link>
            </div>

            {/* Desktop Right Navigation */}
            <nav className="nav-group nav-right" aria-label="Primary Right Navigation">
              {isAuthenticated ? (
                <>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      className={`nav-link font-serif ${pathname.startsWith('/admin') ? 'active' : ''}`}
                      style={{ color: 'var(--gold)', fontWeight: 600 }}
                      title="Atelier Control Room"
                    >
                      ADMIN
                    </Link>
                  ) : (
                    <Link
                      href="/customer"
                      className={`nav-link ${pathname.startsWith('/customer') ? 'active' : ''}`}
                      title="My Account"
                    >
                      MY ACCOUNT
                    </Link>
                  )}
                  <Link href="/cart" className={`nav-link cart-link ${pathname === '/cart' ? 'active' : ''}`} aria-label="Shopping Bag">
                    CART <span className="cart-count">{totalCount}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="nav-link nav-logout-btn"
                    aria-label="Sign Out"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    LOGOUT
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={`nav-link ${pathname === '/login' ? 'active' : ''}`}>
                    LOGIN
                  </Link>
                  <Link href="/signup" className={`nav-link nav-btn-signup ${pathname === '/signup' ? 'active' : ''}`}>
                    SIGN UP
                  </Link>
                  <Link href="/cart" className={`nav-link cart-link ${pathname === '/cart' ? 'active' : ''}`} aria-label="Shopping Bag">
                    CART <span className="cart-count">{totalCount}</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Hamburger Toggle */}
            <button
              className={`mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              type="button"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <aside className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`} id="mobileDrawer" aria-hidden={!mobileMenuOpen}>
        <nav className="mobile-drawer-nav">
          <Link href="/" className={`mobile-drawer-link ${pathname === '/' ? 'active' : ''}`} onClick={closeMobileMenu}>
            HOME
          </Link>
          <Link href="/about" className={`mobile-drawer-link ${pathname === '/about' ? 'active' : ''}`} onClick={closeMobileMenu}>
            ABOUT
          </Link>
          <Link href="/shop" className={`mobile-drawer-link ${pathname.startsWith('/shop') ? 'active' : ''}`} onClick={closeMobileMenu}>
            SHOP
          </Link>
          <Link href="/cart" className={`mobile-drawer-link ${pathname === '/cart' ? 'active' : ''}`} onClick={closeMobileMenu}>
            CART (<span className="cart-count">{totalCount}</span>)
          </Link>

          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className={`mobile-drawer-link ${pathname.startsWith('/admin') ? 'active' : ''}`}
                  style={{ color: 'var(--gold)' }}
                  onClick={closeMobileMenu}
                >
                  ADMIN ATELIER
                </Link>
              ) : (
                <Link
                  href="/customer"
                  className={`mobile-drawer-link ${pathname.startsWith('/customer') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  MY ACCOUNT
                </Link>
              )}
              <Link
                href="/orders"
                className={`mobile-drawer-link ${pathname.startsWith('/orders') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                ORDERS &amp; TRACKING
              </Link>
              <button
                type="button"
                className="mobile-drawer-link"
                style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%', color: 'inherit' }}
                onClick={() => {
                  closeMobileMenu();
                  logout();
                }}
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={`mobile-drawer-link ${pathname === '/login' ? 'active' : ''}`} onClick={closeMobileMenu}>
                LOGIN
              </Link>
              <Link href="/signup" className={`mobile-drawer-link ${pathname === '/signup' ? 'active' : ''}`} onClick={closeMobileMenu}>
                SIGN UP
              </Link>
            </>
          )}
        </nav>

        <div className="mobile-drawer-footer">
          <p className="font-serif">HOUSE OF SHUBHANSHI</p>
          <span className="gold-divider-diamond" style={{ display: 'inline-block', margin: '8px auto' }}></span>
          <p>WEAR THE DREAM</p>
        </div>
      </aside>
    </>
  );
}

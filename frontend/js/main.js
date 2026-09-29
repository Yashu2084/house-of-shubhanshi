/**
 * HOUSE OF SHUBHANSHI — OFFICIAL BRAND CONFIGURATION
 */
const brandInfo = {
  name: "House of Shubhanshi",
  tagline: "Wear the Dream",
  email: "Houseofshubhanshi@gmail.com",
  phone: "+91 9560011351",
  phoneTel: "+919560011351",
  instagram: "@houseofshubhanshi",
  instagramUrl: "https://www.instagram.com/houseofshubhanshi/",
  whatsappUrl: "https://wa.me/919560011351"
};

document.addEventListener('DOMContentLoaded', () => {
  initHeroVideo();
  initHeaderScroll();
  initMobileDrawer();
  initScrollReveals();
  initProductModal();
  initProductCardLightbox();
  initNewsletter();
  initSmoothScroll();
});

/* --------------------------------------------------------------------------
   0. HERO VIDEO AUTOPLAY & PERFORMANCE RESILIENCE
   -------------------------------------------------------------------------- */
function initHeroVideo() {
  const video = document.querySelector('.hero-video');
  if (!video) return;

  const handleVideoFallback = () => {
    video.style.display = 'none';
    const heroBg = document.querySelector('.hero-background');
    if (heroBg) {
      heroBg.classList.add('video-fallback-active');
      heroBg.style.backgroundImage = "url('assets/images/hero/hero-poster.webp')";
      heroBg.style.backgroundSize = 'cover';
      heroBg.style.backgroundPosition = 'center';
    }
  };

  video.addEventListener('error', handleVideoFallback);

  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      // Browser autoplay policy, low power mode, or battery saver caught cleanly without UI flicker
      console.info('Hero video autoplay deferred by browser policy; showing poster cleanly.', error);
      handleVideoFallback();
    });
  }
}


/* --------------------------------------------------------------------------
   1. STICKY HEADER TRANSITION ON SCROLL
   -------------------------------------------------------------------------- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header, .navbar');
  if (!header) return;

  const hasHero = !!document.querySelector('.hero-section');

  const handleScroll = () => {
    // If not a hero page (about, shop, cart, login, dashboards, etc.), keep scrolled permanently
    if (!hasHero) {
      header.classList.add('scrolled');
      return;
    }

    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Trigger once on load
}

/* --------------------------------------------------------------------------
   2. MOBILE DRAWER NAVIGATION
   -------------------------------------------------------------------------- */
function initMobileDrawer() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');

  if (!toggleBtn || !drawer) return;

  const openMenu = () => {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    toggleBtn.classList.add('active');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = () => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    toggleBtn.classList.remove('active');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  };

  const toggleMenu = () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  toggleBtn.addEventListener('click', toggleMenu);

  // Event delegation: closes drawer on click of any mobile drawer link
  drawer.addEventListener('click', (e) => {
    const link = e.target.closest('.mobile-drawer-link');
    if (link) {
      closeMenu();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* --------------------------------------------------------------------------
   3. SCROLL REVEAL ANIMATIONS (INTERSECTION OBSERVER)
   -------------------------------------------------------------------------- */
function initScrollReveals() {
  const revealElements = document.querySelectorAll('.reveal-init, .reveal-up, .reveal-left, .reveal-right, .image-reveal, .text-reveal, .reveal');
  if (!revealElements.length) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.12
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));
}

/* --------------------------------------------------------------------------
   4. PRODUCT QUICK VIEW MODAL
   -------------------------------------------------------------------------- */
const productData = {
  '1': {
    tag: 'HANDCRAFTED COUTURE',
    title: 'The Noor Set',
    price: '₹48,500',
    image: 'assets/images/collection/noor-set.jpg',
    desc: 'An ode to luminous celebrations. Tailored from handspun raw mulberry silk, featuring elaborate dabka, nakshi, and zardozi threadwork along the scalloped neckline and cuffs. Paired with a gossamer organza dupatta kissed with antique gold badla sprigs.',
    details: [
      { label: 'Craft', val: 'Zardozi & Hand Zari' },
      { label: 'Fabric', val: 'Pure Raw Silk & Organza' },
      { label: 'Color', val: 'Warm Ivory with Antique Gold' },
      { label: 'Delivery', val: 'Made to Order (3–4 Weeks)' }
    ]
  },
  '2': {
    tag: 'ROYAL BRIDAL HEIRLOOM',
    title: 'The Shubh Lehenga',
    price: '₹82,000',
    image: 'assets/images/collection/shubh-lehenga.jpg',
    desc: 'The defining silhouette of the House. A deep terracotta velvet ceremonial lehenga handwoven by master karigars with over 320 hours of intricate marodi and salma sitara needlework. The sweeping ghera is balanced by an architectural choli and sheer tissue veil.',
    details: [
      { label: 'Craft', val: 'Marodi & Salma Sitara' },
      { label: 'Fabric', val: 'Micro-Velvet & Tissue Silk' },
      { label: 'Color', val: 'Deep Terracotta & Antique Gold' },
      { label: 'Delivery', val: 'Bespoke Tailoring (5–6 Weeks)' }
    ]
  },
  '3': {
    tag: 'HERITAGE DRAPE',
    title: 'The Zariya Edit',
    price: '₹36,000',
    image: 'assets/images/collection/zariya-edit.jpg',
    desc: 'Lightweight opulence woven on traditional pit looms. Crafted from genuine antique gold metallic tissue with hand-embroidered resham and badla border accents. Drapes with liquid grace for high-octane celebratory soirees.',
    details: [
      { label: 'Craft', val: 'Pit-Loom Metallic Zari Weave' },
      { label: 'Fabric', val: 'Pure Tissue Silk Saree' },
      { label: 'Length', val: '5.5 Meters + 1m Blouse Piece' },
      { label: 'Delivery', val: 'Dispatches in 7 Days' }
    ]
  },
  '4': {
    tag: 'ROYAL RESHAM EDITION',
    title: 'The Aabha Collection',
    price: '₹64,000',
    image: 'assets/images/collection/aabha-collection.jpg',
    desc: 'Regal flared anarkali ensemble in pure chanderi, adorned with delicate rose gold gota patti, fine sequin borders, and handcrafted potli tassels. Accompanied by silk churidar and a bespoke tissue chanderi dupatta.',
    details: [
      { label: 'Craft', val: 'Gota Patti & Resham Work' },
      { label: 'Fabric', val: 'Handwoven Chanderi Silk' },
      { label: 'Silhouette', val: 'Flared Kalidar Anarkali' },
      { label: 'Delivery', val: 'Made to Order (3 Weeks)' }
    ]
  }
};

let cartCount = 0;

function initProductModal() {
  const modalBackdrop = document.querySelector('.modal-backdrop');
  const modalCloseBtn = document.querySelector('.modal-close-btn');
  const quickViewBtns = document.querySelectorAll('.product-quick-view, .product-card-clickable');
  
  if (!modalBackdrop) return;

  const modalImg = modalBackdrop.querySelector('.modal-media img');
  const modalTag = modalBackdrop.querySelector('.modal-tag');
  const modalTitle = modalBackdrop.querySelector('.modal-title');
  const modalPrice = modalBackdrop.querySelector('.modal-price');
  const modalDesc = modalBackdrop.querySelector('.modal-desc');
  const modalDetailsContainer = modalBackdrop.querySelector('.modal-details-list');
  const addToBagBtn = modalBackdrop.querySelector('.modal-add-to-bag');
  const enquireBtn = modalBackdrop.querySelector('.modal-enquire-whatsapp');

  let currentProductId = null;

  const openModal = (id) => {
    const data = productData[id];
    if (!data) return;
    currentProductId = id;

    modalImg.src = data.image;
    modalImg.alt = data.title;
    modalTag.textContent = data.tag;
    modalTitle.textContent = data.title;
    modalPrice.textContent = data.price;
    modalDesc.textContent = data.desc;

    // Render details
    modalDetailsContainer.innerHTML = data.details.map(d => `
      <div class="modal-detail-item">
        <span class="modal-detail-label">${d.label}</span>
        <span class="modal-detail-val">${d.val}</span>
      </div>
    `).join('');

    // Configure WhatsApp inquiry
    if (enquireBtn) {
      const msg = encodeURIComponent(`Hello House of Shubhanshi, I would like to inquire about "${data.title}" (${data.price}).`);
      enquireBtn.href = `${brandInfo.whatsappUrl}?text=${msg}`;
      enquireBtn.target = '_blank';
      enquireBtn.rel = 'noopener noreferrer';
      enquireBtn.setAttribute('aria-label', `Inquire about ${data.title} on WhatsApp`);
    }

    modalBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modalBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  quickViewBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.product-card');
      const id = card ? card.dataset.id : '1';
      openModal(id);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) {
      closeModal();
    }
  });

  if (modalImg) {
    modalImg.style.cursor = 'zoom-in';
    modalImg.title = 'Click to inspect full garment';
    modalImg.addEventListener('click', () => {
      openImageLightbox(modalImg.src, modalImg.alt);
    });
  }

  // Add to Bag action
  if (addToBagBtn) {
    addToBagBtn.addEventListener('click', () => {
      const data = productData[currentProductId];
      if (window.HouseCart && data) {
        const priceNum = parseInt(data.price.replace(/[^\d]/g, ''), 10) || 0;
        const prodIdMap = {
          '1': 'prod_01',
          '2': 'prod_02',
          '3': 'prod_03',
          '4': 'prod_04'
        };
        window.HouseCart.addItem({
          id: prodIdMap[currentProductId] || 'prod_01',
          name: data.title,
          price: priceNum,
          image: data.image,
          category: data.tag
        });
      } else {
        cartCount++;
        const cartCountBadges = document.querySelectorAll('.cart-count');
        cartCountBadges.forEach(badge => {
          badge.textContent = cartCount;
        });
        showToast(`"${data ? data.title : 'Piece'}" added to your bespoke bag.`);
      }
      closeModal();
    });
  }
}

/* --------------------------------------------------------------------------
   4B. FULL-DRESS IMAGE LIGHTBOX & ZOOM INSPECTION
   -------------------------------------------------------------------------- */
function openImageLightbox(src, alt) {
  let lightbox = document.getElementById('imageLightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'imageLightbox';
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-backdrop"></div>
      <div class="lightbox-content">
        <button class="lightbox-close-btn" aria-label="Close Lightbox">&times;</button>
        <img class="lightbox-image" src="" alt="Garment Inspection">
      </div>
    `;
    document.body.appendChild(lightbox);

    const close = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    lightbox.querySelector('.lightbox-backdrop').addEventListener('click', close);
    lightbox.querySelector('.lightbox-close-btn').addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) close();
    });
  }

  const imgEl = lightbox.querySelector('.lightbox-image');
  imgEl.src = src;
  imgEl.alt = alt || 'Garment Full View';
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}
window.openImageLightbox = window.openImageLightbox || openImageLightbox;

function initProductCardLightbox() {
  const productImgs = document.querySelectorAll('.product-card .product-image');
  productImgs.forEach(img => {
    img.style.cursor = 'zoom-in';
    img.title = 'Click to inspect full garment';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openImageLightbox(img.src, img.alt);
    });
  });
}


/* --------------------------------------------------------------------------
   5. NEWSLETTER SUBSCRIPTION & TOAST NOTIFICATION
   -------------------------------------------------------------------------- */
function initNewsletter() {
  const forms = document.querySelectorAll('.newsletter-form');
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.newsletter-input');
      const email = input ? input.value.trim() : '';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (email && emailRegex.test(email)) {
        showToast('Welcome to the House of Shubhanshi. You are now subscribed to our private chronicle.');
        form.reset();
      } else {
        showToast('Please provide a valid email address.');
      }
    });
  });
}

function showToast(message) {
  let toast = document.querySelector('.toast-notice');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast-notice';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<span class="toast-icon">✦</span> <span>${message}</span>`;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4200);
}

/* --------------------------------------------------------------------------
   6. SMOOTH SCROLLING FOR ANCHOR LINKS
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

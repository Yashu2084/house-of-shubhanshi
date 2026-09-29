/**
 * ==============================================================================
 * HOUSE OF SHUBHANSHI — AUTHENTICATION CLIENT CONTROLLER
 * Single origin architecture: Uses central relative /api endpoints
 * ==============================================================================
 */

const API_BASE = window.API_BASE_URL || '/api';

/**
 * Toast Notification Utility
 */
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

/**
 * Check Active User Session
 */
async function getAuthUser() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data.user : null;
  } catch (e) {
    return null;
  }
}

/**
/**
 * Highlight Active Page Link across Desktop and Mobile navigation
 */
function highlightActiveNavLink() {
  const currentPath = window.location.pathname.toLowerCase();
  const page = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';
  
  const allLinks = document.querySelectorAll('.nav-link, .mobile-drawer-link');
  allLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (!href) return;
    const targetPage = href.split('#')[0].split('?')[0].toLowerCase();
    
    if (page === targetPage) {
      link.classList.add('active');
    } else if ((page === '' || page === 'index.html') && (targetPage === 'index.html' || targetPage === '/')) {
      if (link.classList.contains('mobile-drawer-link')) {
        link.classList.add('active');
      }
    }
  });
}

/**
 * Update Header Navigation Authentication State across all pages
 */
async function updateNavAuthState() {
  const user = await getAuthUser();
  const navLeft = document.querySelector('.nav-group.nav-left');
  const navRight = document.querySelector('.nav-group.nav-right');
  const mobileNav = document.querySelector('.mobile-drawer-nav');

  // Ensure Desktop Left Navigation always displays ABOUT and SHOP
  if (navLeft) {
    navLeft.innerHTML = `
      <a href="about.html" class="nav-link">ABOUT</a>
      <a href="shop.html" class="nav-link">SHOP</a>
    `;
  }

  if (!navRight) return;

  const cartCountEl = document.querySelector('.cart-count');
  const cartBadge = cartCountEl ? cartCountEl.textContent.trim() : '0';

  if (user) {
    if (user.role === 'ADMIN') {
      // Logged in as ADMIN:
      // ABOUT, SHOP (left) | ADMIN, CART, LOGOUT (right)
      navRight.innerHTML = `
        <a href="admin-dashboard.html" class="nav-link font-serif" style="color: var(--gold); font-weight: 600;" title="Atelier Control Room">ADMIN</a>
        <a href="cart.html" class="nav-link cart-link" aria-label="Shopping Bag">
          CART <span class="cart-count">${cartBadge}</span>
        </a>
        <button type="button" id="navLogoutBtn" class="nav-link nav-logout-btn" aria-label="Sign Out">
          LOGOUT
        </button>
      `;

      if (mobileNav) {
        mobileNav.innerHTML = `
          <a href="index.html" class="mobile-drawer-link">HOME</a>
          <a href="about.html" class="mobile-drawer-link">ABOUT</a>
          <a href="shop.html" class="mobile-drawer-link">SHOP</a>
          <a href="admin-dashboard.html" class="mobile-drawer-link" style="color: var(--gold);">ADMIN</a>
          <a href="cart.html" class="mobile-drawer-link">CART (<span class="cart-count">${cartBadge}</span>)</a>
          <a href="#" id="mobileLogoutBtn" class="mobile-drawer-link">LOGOUT</a>
        `;
      }
    } else {
      // Logged in as CUSTOMER:
      // ABOUT, SHOP (left) | MY ACCOUNT, CART, LOGOUT (right)
      navRight.innerHTML = `
        <a href="customer-dashboard.html" class="nav-link" title="My Account">
          MY ACCOUNT
        </a>
        <a href="cart.html" class="nav-link cart-link" aria-label="Shopping Bag">
          CART <span class="cart-count">${cartBadge}</span>
        </a>
        <button type="button" id="navLogoutBtn" class="nav-link nav-logout-btn" aria-label="Sign Out">
          LOGOUT
        </button>
      `;

      if (mobileNav) {
        mobileNav.innerHTML = `
          <a href="index.html" class="mobile-drawer-link">HOME</a>
          <a href="about.html" class="mobile-drawer-link">ABOUT</a>
          <a href="shop.html" class="mobile-drawer-link">SHOP</a>
          <a href="customer-dashboard.html" class="mobile-drawer-link">MY ACCOUNT</a>
          <a href="cart.html" class="mobile-drawer-link">CART (<span class="cart-count">${cartBadge}</span>)</a>
          <a href="#" id="mobileLogoutBtn" class="mobile-drawer-link">LOGOUT</a>
        `;
      }
    }

    // Attach logout event listeners to all logout triggers
    const logoutBtns = document.querySelectorAll('#navLogoutBtn, #mobileLogoutBtn, .nav-logout-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await performLogout();
      });
    });

  } else {
    // NOT logged in (Guest):
    // ABOUT, SHOP (left) | LOGIN, SIGN UP, CART (right)
    navRight.innerHTML = `
      <a href="login.html" class="nav-link">LOGIN</a>
      <a href="signup.html" class="nav-link nav-btn-signup">SIGN UP</a>
      <a href="cart.html" class="nav-link cart-link" aria-label="Shopping Bag">
        CART <span class="cart-count">${cartBadge}</span>
      </a>
    `;

    if (mobileNav) {
      mobileNav.innerHTML = `
        <a href="index.html" class="mobile-drawer-link">HOME</a>
        <a href="about.html" class="mobile-drawer-link">ABOUT</a>
        <a href="shop.html" class="mobile-drawer-link">SHOP</a>
        <a href="login.html" class="mobile-drawer-link">LOGIN</a>
        <a href="signup.html" class="mobile-drawer-link">SIGN UP</a>
        <a href="cart.html" class="mobile-drawer-link">CART (<span class="cart-count">${cartBadge}</span>)</a>
      `;
    }
  }

  // Sync cart badge count with stored cart items
  if (window.HouseCart && typeof window.HouseCart.updateCartBadges === 'function') {
    window.HouseCart.updateCartBadges();
  }

  // Highlight active page
  highlightActiveNavLink();
}

/**
 * Real Logout: Calls Backend POST /api/auth/logout and Updates Navbar
 */
async function performLogout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.error(e);
  }
  showToast('You have been securely signed out.');
  await updateNavAuthState();
  
  const currentPath = window.location.pathname.toLowerCase();
  if (
    currentPath.includes('admin') || 
    currentPath.includes('customer') || 
    currentPath.includes('dashboard') ||
    currentPath.includes('orders')
  ) {
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 400);
  }
}

/**
 * Handle Signup Form
 */
function initSignupForm() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  const alertBox = document.getElementById('authAlert');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (alertBox) alertBox.className = 'auth-alert';

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone ? form.phone.value.trim() : '';
    const dob = form.dob ? form.dob.value : '';
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    // Frontend validations
    if (!name || name.length < 2) {
      return showAlert('Full name is required (at least 2 characters).');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showAlert('Please enter a valid email address.');
    }
    if (phone && !/^\+?[0-9\s\-()]{7,20}$/.test(phone)) {
      return showAlert('Please enter a valid contact phone number.');
    }
    if (!password || password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return showAlert('Password must be at least 8 characters and include at least one letter and one number.');
    }
    if (password !== confirmPassword) {
      return showAlert('Passwords do not match. Please verify your entries.');
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'CREATING ACCOUNT...';

      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, phone, dob, password, confirmPassword })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || (data.errors ? Object.values(data.errors).join(', ') : 'Signup failed'));
      }

      const user = (data.data && data.data.user) ? data.data.user : (data.user || { name: 'Member' });
      showToast(`Welcome to House of Shubhanshi, ${user.name}.`);
      if (alertBox) {
        alertBox.className = 'auth-alert success';
        alertBox.textContent = 'Membership created successfully. Redirecting to your atelier closet...';
      }

      setTimeout(() => {
        window.location.href = 'customer-dashboard.html';
      }, 1000);

    } catch (err) {
      showAlert(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'CREATE ACCOUNT';
    }
  });

  function showAlert(msg) {
    if (!alertBox) {
      showToast(msg);
      return;
    }
    alertBox.className = 'auth-alert error';
    alertBox.textContent = msg;
  }
}

/**
 * Handle Login Form
 */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const alertBox = document.getElementById('authAlert');
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;
    if (alertBox) alertBox.className = 'auth-alert';

    const email = form.email.value.trim();
    const password = form.password.value;
    const rememberMe = form.rememberMe ? form.rememberMe.checked : false;

    if (!email || !password) {
      return showAlert('Please enter your email and password.');
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'SIGNING IN...';

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      const user = (data.data && data.data.user) ? data.data.user : (data.user || {});
      showToast(`Welcome back, ${user.name || 'Member'}.`);

      setTimeout(() => {
        if (user.role === 'ADMIN') {
          window.location.href = 'admin-dashboard.html';
        } else {
          // If customer came from checkout, redirect to cart or dashboard
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get('redirect');
          window.location.href = redirect || 'customer-dashboard.html';
        }
      }, 800);

    } catch (err) {
      showAlert(err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SIGN IN';
    }
  });

  function showAlert(msg) {
    if (!alertBox) {
      showToast(msg);
      return;
    }
    alertBox.className = 'auth-alert error';
    alertBox.textContent = msg;
  }
}

/**
 * Password Visibility Toggle
 */
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'HIDE';
      } else {
        input.type = 'password';
        btn.textContent = 'SHOW';
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavAuthState();
  initSignupForm();
  initLoginForm();
  initPasswordToggles();
});

// Export globally for other modules
window.HouseAuth = {
  getAuthUser,
  performLogout,
  updateNavAuthState,
  showToast,
  API_BASE
};

/**
 * E-Commerce Platform - Client Application
 * Full-featured dynamic JavaScript frontend connecting to Spring Boot REST APIs
 */

const API_BASE = '/api';

const state = {
  token: localStorage.getItem('ecom_token') || null,
  user: JSON.parse(localStorage.getItem('ecom_user') || 'null'),
  categories: [],
  products: [],
  cart: { items: [], subtotal: 0, totalAmount: 0, totalItems: 0 },
  selectedCategory: null,
  searchQuery: '',
  sortBy: 'id',
  sortDir: 'desc',
  page: 0,
  totalPages: 1,
  activeProductModal: null,
  adminView: 'metrics'
};

// ==========================================================================
// API Helper
// ==========================================================================
async function api(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401 && state.token) {
        logout();
        showToast('Session expired. Please sign in again.', 'error');
      }
      throw new Error(data.message || 'Request failed');
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// ==========================================================================
// Toast Notifications
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `<span style="font-weight:700;">${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  updateUserNav();
  await loadCategories();
  await loadProducts();
  if (state.token) {
    await loadCart();
  }
  setupEventListeners();
});

function setupEventListeners() {
  // Search with debounce
  let searchTimeout = null;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        state.searchQuery = e.target.value;
        state.page = 0;
        loadProducts();
      }, 350);
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'price-asc') {
        state.sortBy = 'price';
        state.sortDir = 'asc';
      } else if (val === 'price-desc') {
        state.sortBy = 'price';
        state.sortDir = 'desc';
      } else if (val === 'rating') {
        state.sortBy = 'rating';
        state.sortDir = 'desc';
      } else {
        state.sortBy = 'id';
        state.sortDir = 'desc';
      }
      loadProducts();
    });
  }
}

// ==========================================================================
// User Authentication & Session
// ==========================================================================
function updateUserNav() {
  const authBtn = document.getElementById('authBtn');
  const userMenu = document.getElementById('userMenu');
  const userGreeting = document.getElementById('userGreeting');
  const adminTabBtn = document.getElementById('adminTabBtn');

  if (state.user && state.token) {
    if (authBtn) authBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    if (userGreeting) userGreeting.textContent = state.user.fullName.split(' ')[0];
    if (adminTabBtn) {
      adminTabBtn.style.display = state.user.role === 'ROLE_ADMIN' ? 'inline-flex' : 'none';
    }
  } else {
    if (authBtn) authBtn.style.display = 'inline-flex';
    if (userMenu) userMenu.style.display = 'none';
    if (adminTabBtn) adminTabBtn.style.display = 'none';
  }
}

function openAuthModal(mode = 'login') {
  const modal = document.getElementById('authModal');
  switchAuthTab(mode);
  modal.classList.add('open');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
  }
}

function quickFillDemo(role) {
  if (role === 'admin') {
    document.getElementById('loginEmail').value = 'admin@store.com';
    document.getElementById('loginPassword').value = 'Admin@123';
  } else {
    document.getElementById('loginEmail').value = 'customer@store.com';
    document.getElementById('loginPassword').value = 'Customer@123';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    state.token = res.data.token;
    state.user = {
      id: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      role: res.data.role
    };

    localStorage.setItem('ecom_token', state.token);
    localStorage.setItem('ecom_user', JSON.stringify(state.user));

    updateUserNav();
    closeAuthModal();
    await loadCart();
    showToast(`Welcome back, ${state.user.fullName}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const phone = document.getElementById('regPhone').value;

  try {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, phone })
    });

    state.token = res.data.token;
    state.user = {
      id: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      role: res.data.role
    };

    localStorage.setItem('ecom_token', state.token);
    localStorage.setItem('ecom_user', JSON.stringify(state.user));

    updateUserNav();
    closeAuthModal();
    await loadCart();
    showToast('Account created successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function logout() {
  state.token = null;
  state.user = null;
  state.cart = { items: [], subtotal: 0, totalAmount: 0, totalItems: 0 };
  localStorage.removeItem('ecom_token');
  localStorage.removeItem('ecom_user');
  updateUserNav();
  renderCart();
  showToast('You have been logged out', 'info');
  showSection('store');
}

// ==========================================================================
// Categories & Product Catalog
// ==========================================================================
async function loadCategories() {
  try {
    const res = await api('/categories');
    state.categories = res.data;
    renderCategories();
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

function renderCategories() {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  let html = `<button class="pill-btn ${state.selectedCategory === null ? 'active' : ''}" onclick="selectCategory(null)">All Categories</button>`;
  state.categories.forEach(cat => {
    const isActive = state.selectedCategory === cat.id ? 'active' : '';
    html += `<button class="pill-btn ${isActive}" onclick="selectCategory(${cat.id})">${cat.name}</button>`;
  });
  container.innerHTML = html;
}

function selectCategory(catId) {
  state.selectedCategory = catId;
  state.page = 0;
  renderCategories();
  loadProducts();
}

async function loadProducts() {
  const grid = document.getElementById('productsGrid');
  if (grid) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">Loading products...</div>';
  }

  try {
    let url = `/products?page=${state.page}&size=12&sortBy=${state.sortBy}&sortDir=${state.sortDir}`;
    if (state.selectedCategory) {
      url += `&categoryId=${state.selectedCategory}`;
    }
    if (state.searchQuery && state.searchQuery.trim()) {
      url += `&keyword=${encodeURIComponent(state.searchQuery.trim())}`;
    }

    const res = await api(url);
    state.products = res.data.content;
    state.totalPages = res.data.totalPages;
    renderProducts();
  } catch (err) {
    if (grid) grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger);">Failed to load products: ${err.message}</div>`;
  }
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  if (state.products.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-secondary);">
        <h3>No products found</h3>
        <p style="margin-top: 0.5rem; font-size: 0.9rem;">Try searching for different keywords or clear category filters.</p>
        <button class="nav-btn btn-primary" style="margin-top: 1rem;" onclick="selectCategory(null)">View All Catalog</button>
      </div>`;
    return;
  }

  grid.innerHTML = state.products.map(p => {
    const ratingStars = '★'.repeat(Math.round(p.rating || 5)) + '☆'.repeat(5 - Math.round(p.rating || 5));
    const isOut = p.stockQuantity <= 0;
    const isLow = p.stockQuantity > 0 && p.stockQuantity < 10;

    return `
      <div class="product-card">
        <div class="card-image-wrap" onclick="openProductModal(${p.id})" style="cursor: pointer;">
          <img src="${p.imageUrl}" alt="${p.name}" loading="lazy" />
          ${p.featured ? '<span class="card-badge featured-badge">★ Featured</span>' : ''}
          ${isOut ? '<span class="card-badge" style="background:var(--danger)">Out of Stock</span>' : ''}
          ${isLow ? `<span class="card-badge" style="background:var(--warning)">Only ${p.stockQuantity} Left</span>` : ''}
        </div>
        <div class="card-body">
          <span class="product-category">${p.categoryName || 'General'}</span>
          <h3 class="product-title" onclick="openProductModal(${p.id})">${p.name}</h3>
          <div class="product-rating">
            <span>${ratingStars}</span>
            <span class="rating-count">(${p.numReviews || 0})</span>
          </div>
          <div class="card-footer">
            <span class="product-price">$${parseFloat(p.price).toFixed(2)}</span>
            <button class="btn-add-cart" ${isOut ? 'disabled style="opacity:0.5; cursor:not-allowed"' : ''} onclick="addToCart(${p.id}, 1)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
              Add
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Product Quick View Modal
// ==========================================================================
async function openProductModal(id) {
  try {
    const res = await api(`/products/${id}`);
    const p = res.data;
    state.activeProductModal = p;

    const modal = document.getElementById('productModal');
    const content = document.getElementById('productModalContent');

    const ratingStars = '★'.repeat(Math.round(p.rating || 5)) + '☆'.repeat(5 - Math.round(p.rating || 5));
    const isOut = p.stockQuantity <= 0;

    content.innerHTML = `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;">
        <div style="border-radius: var(--radius-md); overflow:hidden; border:1px solid var(--border-color);">
          <img src="${p.imageUrl}" alt="${p.name}" style="width:100%; height:280px; object-fit:cover; display:block;" />
        </div>
        <div>
          <span class="product-category">${p.categoryName || 'General'}</span>
          <h2 style="font-size: 1.35rem; font-weight:700; margin: 0.35rem 0 0.5rem;">${p.name}</h2>
          <div class="product-rating" style="margin-bottom: 0.75rem;">
            <span>${ratingStars}</span>
            <span class="rating-count">(${p.numReviews || 0} reviews)</span>
          </div>
          <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary); margin-bottom: 1rem;">
            $${parseFloat(p.price).toFixed(2)}
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.25rem; line-height: 1.6;">
            ${p.description}
          </p>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
            <span>SKU: <strong>${p.sku || 'N/A'}</strong></span>
            <span>Stock: <strong style="color:${isOut ? 'var(--danger)' : 'var(--success)'}">${isOut ? 'Sold Out' : p.stockQuantity + ' Available'}</strong></span>
          </div>
          <div style="display:flex; gap:0.75rem; align-items:center;">
            <input type="number" id="modalQty" min="1" max="${p.stockQuantity}" value="1" class="form-control" style="width:80px; text-align:center;" ${isOut ? 'disabled' : ''} />
            <button class="btn-checkout" style="flex:1;" ${isOut ? 'disabled style="opacity:0.5; cursor:not-allowed"' : ''} onclick="addToCartFromModal()">
              Add to Shopping Cart
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('open');
  } catch (err) {
    showToast('Failed to load product details', 'error');
  }
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
  state.activeProductModal = null;
}

function addToCartFromModal() {
  if (!state.activeProductModal) return;
  const qtyInput = document.getElementById('modalQty');
  const qty = parseInt(qtyInput ? qtyInput.value : 1, 10);
  addToCart(state.activeProductModal.id, qty);
  closeProductModal();
}

// ==========================================================================
// Shopping Cart Operations
// ==========================================================================
async function loadCart() {
  if (!state.token) return;
  try {
    const res = await api('/cart');
    state.cart = res.data;
    renderCart();
  } catch (err) {
    console.error('Error loading cart', err);
  }
}

async function addToCart(productId, quantity = 1) {
  if (!state.token) {
    openAuthModal('login');
    showToast('Please sign in to add items to your cart', 'info');
    return;
  }

  try {
    const res = await api('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity })
    });
    state.cart = res.data;
    renderCart();
    showToast('Added to cart', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function updateCartQty(itemId, quantity) {
  if (quantity < 1) {
    return removeCartItem(itemId);
  }
  try {
    const res = await api(`/cart/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
    state.cart = res.data;
    renderCart();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeCartItem(itemId) {
  try {
    const res = await api(`/cart/items/${itemId}`, {
      method: 'DELETE'
    });
    state.cart = res.data;
    renderCart();
    showToast('Item removed from cart', 'info');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderCart() {
  const badge = document.getElementById('cartBadge');
  if (badge) {
    badge.textContent = state.cart.totalItems || 0;
    badge.style.display = state.cart.totalItems > 0 ? 'flex' : 'none';
  }

  const list = document.getElementById('cartItemsList');
  const subtotalEl = document.getElementById('cartSubtotal');
  const shippingEl = document.getElementById('cartShipping');
  const taxEl = document.getElementById('cartTax');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');

  if (!list) return;

  if (!state.cart.items || state.cart.items.length === 0) {
    list.innerHTML = `
      <div style="text-align:center; padding: 3rem 1rem; color: var(--text-muted);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:0.75rem; opacity:0.6;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <p>Your shopping cart is empty</p>
      </div>`;
    if (subtotalEl) subtotalEl.textContent = '$0.00';
    if (shippingEl) shippingEl.textContent = '$0.00';
    if (taxEl) taxEl.textContent = '$0.00';
    if (totalEl) totalEl.textContent = '$0.00';
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }

  list.innerHTML = state.cart.items.map(item => `
    <div class="cart-item">
      <img src="${item.productImageUrl}" alt="${item.productName}" class="cart-item-img" />
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.productName}</h4>
        <div class="cart-item-price">$${parseFloat(item.unitPrice).toFixed(2)} each</div>
        <div class="cart-item-stepper">
          <button class="stepper-btn" onclick="updateCartQty(${item.id}, ${item.quantity - 1})">-</button>
          <span class="stepper-qty">${item.quantity}</span>
          <button class="stepper-btn" onclick="updateCartQty(${item.id}, ${item.quantity + 1})">+</button>
          <button class="btn-remove-item" onclick="removeCartItem(${item.id})">Remove</button>
        </div>
      </div>
      <div style="font-weight:700; font-size:0.9rem;">
        $${parseFloat(item.subtotal).toFixed(2)}
      </div>
    </div>
  `).join('');

  if (subtotalEl) subtotalEl.textContent = `$${parseFloat(state.cart.subtotal).toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = state.cart.shippingFee == 0 ? 'FREE' : `$${parseFloat(state.cart.shippingFee).toFixed(2)}`;
  if (taxEl) taxEl.textContent = `$${parseFloat(state.cart.estimatedTax).toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${parseFloat(state.cart.totalAmount).toFixed(2)}`;
  if (checkoutBtn) checkoutBtn.disabled = false;
}

function toggleCartDrawer() {
  const drawer = document.getElementById('cartDrawerBackdrop');
  if (drawer.classList.contains('open')) {
    drawer.classList.remove('open');
  } else {
    drawer.classList.add('open');
    loadCart();
  }
}

// ==========================================================================
// Checkout Flow
// ==========================================================================
function openCheckoutModal() {
  if (!state.token) {
    openAuthModal('login');
    return;
  }
  if (!state.cart.items || state.cart.items.length === 0) {
    showToast('Your cart is empty', 'warning');
    return;
  }
  toggleCartDrawer(); // Close drawer
  document.getElementById('checkoutSubtotal').textContent = `$${parseFloat(state.cart.subtotal).toFixed(2)}`;
  document.getElementById('checkoutShipping').textContent = state.cart.shippingFee == 0 ? 'FREE' : `$${parseFloat(state.cart.shippingFee).toFixed(2)}`;
  document.getElementById('checkoutTax').textContent = `$${parseFloat(state.cart.estimatedTax).toFixed(2)}`;
  document.getElementById('checkoutTotal').textContent = `$${parseFloat(state.cart.totalAmount).toFixed(2)}`;
  document.getElementById('checkoutModal').classList.add('open');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('open');
}

async function handleCheckout(e) {
  e.preventDefault();
  const street = document.getElementById('chkStreet').value;
  const city = document.getElementById('chkCity').value;
  const stateVal = document.getElementById('chkState').value;
  const zipCode = document.getElementById('chkZip').value;
  const country = document.getElementById('chkCountry').value;
  const paymentMethod = document.getElementById('chkPaymentMethod').value;

  try {
    const res = await api('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({ street, city, state: stateVal, zipCode, country, paymentMethod })
    });

    closeCheckoutModal();
    await loadCart();
    showToast(`Order ${res.data.orderNumber} placed successfully!`, 'success');
    openOrdersModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// Customer Orders History & Journey
// ==========================================================================
async function openOrdersModal() {
  if (!state.token) {
    openAuthModal('login');
    return;
  }

  const modal = document.getElementById('ordersModal');
  const container = document.getElementById('ordersListContainer');
  container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted)">Loading your orders...</div>';
  modal.classList.add('open');

  try {
    const res = await api('/orders');
    const orders = res.data;

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-secondary)">
          <p>You haven't placed any orders yet.</p>
          <button class="nav-btn btn-primary" style="margin-top:1rem" onclick="closeOrdersModal()">Start Shopping</button>
        </div>`;
      return;
    }

    container.innerHTML = orders.map(ord => {
      const itemsHtml = ord.items.map(it => `
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding: 0.35rem 0; border-bottom:1px dashed rgba(255,255,255,0.05);">
          <span>${it.productName} × <strong>${it.quantity}</strong></span>
          <span>$${parseFloat(it.subtotal).toFixed(2)}</span>
        </div>
      `).join('');

      const canCancel = ord.status === 'PAID' || ord.status === 'PENDING';

      return `
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.25rem; margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.6rem;">
            <div>
              <strong style="color:var(--text-primary); font-size:0.95rem;">${ord.orderNumber}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted);">${new Date(ord.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <span class="status-badge status-${ord.status}">${ord.status}</span>
            </div>
          </div>
          <div style="margin-bottom:0.75rem;">
            ${itemsHtml}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem; font-weight:700; margin-top:0.5rem; padding-top:0.5rem;">
            <span>Total: $${parseFloat(ord.totalAmount).toFixed(2)}</span>
            <div style="display:flex; gap:0.5rem;">
              ${canCancel ? `<button class="nav-btn" style="color:var(--danger); border-color:rgba(239,68,68,0.3); font-size:0.75rem; padding:0.25rem 0.6rem;" onclick="cancelOrder('${ord.orderNumber}')">Cancel Order</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger); text-align:center;">Failed to load orders: ${err.message}</div>`;
  }
}

function closeOrdersModal() {
  document.getElementById('ordersModal').classList.remove('open');
}

async function cancelOrder(orderNumber) {
  if (!confirm(`Are you sure you want to cancel order ${orderNumber}?`)) return;
  try {
    await api(`/orders/${orderNumber}/cancel`, { method: 'PUT' });
    showToast(`Order ${orderNumber} cancelled successfully`, 'success');
    openOrdersModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// Admin Portal & Management
// ==========================================================================
function showSection(section) {
  const storeSection = document.getElementById('storeSection');
  const adminSection = document.getElementById('adminSection');

  if (section === 'admin') {
    if (!state.user || state.user.role !== 'ROLE_ADMIN') {
      showToast('Admin privilege required', 'error');
      return;
    }
    storeSection.style.display = 'none';
    adminSection.style.display = 'block';
    loadAdminMetrics();
    loadAdminOrders();
    loadAdminProducts();
  } else {
    storeSection.style.display = 'block';
    adminSection.style.display = 'none';
  }
}

async function loadAdminMetrics() {
  try {
    const res = await api('/admin/metrics');
    const m = res.data;
    document.getElementById('adminMetricRevenue').textContent = `$${parseFloat(m.totalRevenue).toFixed(2)}`;
    document.getElementById('adminMetricOrders').textContent = m.totalOrders;
    document.getElementById('adminMetricProducts').textContent = m.totalProducts;
    document.getElementById('adminMetricCustomers').textContent = m.totalCustomers;
    document.getElementById('adminMetricLowStock').textContent = m.lowStockCount;
  } catch (err) {
    console.error('Error loading admin metrics', err);
  }
}

async function loadAdminProducts() {
  const tableBody = document.getElementById('adminProductsTableBody');
  if (!tableBody) return;
  try {
    const res = await api('/products?size=50');
    tableBody.innerHTML = res.data.content.map(p => `
      <tr>
        <td><strong>#${p.id}</strong></td>
        <td>
          <div style="display:flex; align-items:center; gap:0.6rem;">
            <img src="${p.imageUrl}" style="width:36px; height:36px; border-radius:4px; object-fit:cover;" />
            <div>
              <div style="font-weight:600;">${p.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${p.sku || 'No SKU'}</div>
            </div>
          </div>
        </td>
        <td>${p.categoryName || 'General'}</td>
        <td>$${parseFloat(p.price).toFixed(2)}</td>
        <td>
          <span style="font-weight:600; color:${p.stockQuantity < 10 ? 'var(--warning)' : 'inherit'}">
            ${p.stockQuantity}
          </span>
        </td>
        <td>
          <button class="nav-btn" style="color:var(--danger); padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="adminDeleteProduct(${p.id})">Deactivate</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="6" style="color:var(--danger)">Failed to load products</td></tr>`;
  }
}

async function loadAdminOrders() {
  const tableBody = document.getElementById('adminOrdersTableBody');
  if (!tableBody) return;
  try {
    const res = await api('/admin/orders');
    tableBody.innerHTML = res.data.content.map(o => `
      <tr>
        <td><strong>${o.orderNumber}</strong></td>
        <td>
          <div>${o.customerName || 'N/A'}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${o.customerEmail || ''}</div>
        </td>
        <td>$${parseFloat(o.totalAmount).toFixed(2)}</td>
        <td>
          <select class="custom-select" style="padding:0.25rem 0.5rem; font-size:0.8rem;" onchange="adminUpdateOrderStatus('${o.orderNumber}', this.value)">
            <option value="PENDING" ${o.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
            <option value="PAID" ${o.status === 'PAID' ? 'selected' : ''}>PAID</option>
            <option value="PROCESSING" ${o.status === 'PROCESSING' ? 'selected' : ''}>PROCESSING</option>
            <option value="SHIPPED" ${o.status === 'SHIPPED' ? 'selected' : ''}>SHIPPED</option>
            <option value="DELIVERED" ${o.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
            <option value="CANCELLED" ${o.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
          </select>
        </td>
        <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      </tr>
    `).join('');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="5" style="color:var(--danger)">Failed to load orders</td></tr>`;
  }
}

async function adminUpdateOrderStatus(orderNumber, status) {
  try {
    await api(`/admin/orders/${orderNumber}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(`Order status updated to ${status}`, 'success');
    loadAdminMetrics();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function adminDeleteProduct(id) {
  if (!confirm(`Are you sure you want to deactivate product #${id}?`)) return;
  try {
    await api(`/admin/products/${id}`, { method: 'DELETE' });
    showToast(`Product #${id} deactivated`, 'info');
    loadAdminProducts();
    loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openAddProductModal() {
  const select = document.getElementById('newProdCategory');
  if (select) {
    select.innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  document.getElementById('addProductModal').classList.add('open');
}

function closeAddProductModal() {
  document.getElementById('addProductModal').classList.remove('open');
}

async function handleAddProduct(e) {
  e.preventDefault();
  const name = document.getElementById('newProdName').value;
  const categoryId = parseInt(document.getElementById('newProdCategory').value, 10);
  const price = parseFloat(document.getElementById('newProdPrice').value);
  const stockQuantity = parseInt(document.getElementById('newProdStock').value, 10);
  const sku = document.getElementById('newProdSku').value;
  const imageUrl = document.getElementById('newProdImage').value;
  const description = document.getElementById('newProdDesc').value;
  const featured = document.getElementById('newProdFeatured').checked;

  try {
    await api('/admin/products', {
      method: 'POST',
      body: JSON.stringify({ name, categoryId, price, stockQuantity, sku, imageUrl, description, featured })
    });

    closeAddProductModal();
    showToast(`Product "${name}" created successfully!`, 'success');
    loadAdminProducts();
    loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==========================================================================
// Interactive API Documentation Modal
// ==========================================================================
async function openApiDocsModal() {
  const modal = document.getElementById('apiDocsModal');
  const container = document.getElementById('apiDocsContainer');
  container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--text-muted);">Loading API Documentation...</div>';
  modal.classList.add('open');

  try {
    const res = await api('/docs/spec');
    const paths = res.paths;

    let html = `
      <div style="margin-bottom:1.5rem; padding:1rem; background:rgba(99,102,241,0.1); border-radius:var(--radius-md); border:1px solid rgba(99,102,241,0.3);">
        <h3 style="font-size:1.1rem; color:var(--text-primary); margin-bottom:0.25rem;">${res.info.title} (v${res.info.version})</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary);">${res.info.description}</p>
      </div>
      <div style="display:flex; flex-direction:column; gap:0.75rem;">
    `;

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const methodUpper = method.toUpperCase();
        const color = methodUpper === 'GET' ? '#10b981' : methodUpper === 'POST' ? '#6366f1' : methodUpper === 'PUT' ? '#f59e0b' : '#ef4444';

        html += `
          <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.75rem 1rem; display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span style="background:${color}22; color:${color}; font-weight:700; font-size:0.75rem; padding:0.2rem 0.5rem; border-radius:4px; min-width:55px; text-align:center;">${methodUpper}</span>
              <code style="font-family:monospace; font-size:0.875rem; color:var(--text-primary);">${path}</code>
            </div>
            <div style="font-size:0.8rem; color:var(--text-secondary); text-align:right;">
              ${details.summary || ''}
            </div>
          </div>
        `;
      }
    }

    html += '</div>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger)">Failed to load documentation: ${err.message}</div>`;
  }
}

function closeApiDocsModal() {
  document.getElementById('apiDocsModal').classList.remove('open');
}

// Generate 100 UNIQUE Products
const categories = ["Tech", "Audio", "Wearables", "Accessories", "Cameras", "Home"];
const products = [];
for (let i = 1; i <= 100; i++) {
  const cat = categories[i % categories.length];
  products.push({
    id: i,
    name: `${cat} Premium ${i}`,
    price: (Math.random() * 500 + 49.99).toFixed(2),
    image: `https://picsum.photos/seed/shop_full_${i}/600/400`,
    category: cat
  });
}

let cart = JSON.parse(localStorage.getItem('shop_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let activeCategory = 'all';

document.addEventListener('DOMContentLoaded', () => {
  renderProducts(products);
  updateCartUI();
  initAuth();
  updateAuthUI();
  initTheme();
  initFilters();
});

// AUTH SYSTEM
function initAuth() {
  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');

  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const email = f.get('email');
    
    if (users.find(u => u.email === email)) return showToast('Email already registered!', 'danger');

    users.push({
      name: f.get('name'),
      email: email,
      password: f.get('password'),
      joined: new Date().toLocaleDateString()
    });
    localStorage.setItem('users', JSON.stringify(users));
    showToast('Account created! Please login.');
    bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === f.get('email') && u.password === f.get('password'));

    if (user) {
      currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      updateAuthUI();
      showToast(`Welcome back, ${user.name}!`);
      bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    } else {
      showToast('Invalid credentials!', 'danger');
    }
  });
}

function updateAuthUI() {
  const container = document.getElementById('authContainer');
  if (currentUser) {
    container.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-primary rounded-pill dropdown-toggle fw-bold" data-bs-toggle="dropdown">
          <i class="fas fa-user-circle me-2"></i>${currentUser.name.split(' ')[0]}
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow border-0 p-2 mt-2">
          <li><a class="dropdown-item py-2 rounded" href="#" data-bs-toggle="modal" data-bs-target="#profileModal"><i class="fas fa-id-card me-2"></i>Profile</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item py-2 rounded text-danger" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
        </ul>
      </div>
    `;
  } else {
    container.innerHTML = `
      <button class="btn btn-outline-primary ms-2 rounded-pill" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>
      <button class="btn btn-primary ms-2 rounded-pill" data-bs-toggle="modal" data-bs-target="#signupModal">Sign Up</button>
    `;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateAuthUI();
  showToast('Logged out');
}

// SHOP LOGIC
function renderProducts(items) {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = items.map(p => `
    <div class="col-sm-6 col-lg-4 col-xl-3 animate-in">
      <div class="card product-card shadow-sm h-100">
        <div class="product-img-wrapper">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <span class="badge position-absolute top-0 end-0 m-3 bg-white text-dark shadow-sm rounded-pill">$${p.price}</span>
        </div>
        <div class="card-body d-flex flex-column p-4">
          <span class="badge badge-primary-soft align-self-start mb-2">${p.category}</span>
          <h6 class="fw-bold mb-3 text-truncate">${p.name}</h6>
          <button onclick="addToCart(${p.id})" class="btn btn-primary mt-auto py-2 small">
            <i class="fas fa-cart-plus me-2"></i>Add to Bag
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function initFilters() {
  document.querySelectorAll('#categoryFilters button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#categoryFilters button').forEach(b => b.classList.replace('btn-primary', 'btn-outline-primary'));
      btn.classList.replace('btn-outline-primary', 'btn-primary');
      activeCategory = btn.dataset.filter;
      filterProducts();
    });
  });
  document.getElementById('searchInput').addEventListener('input', filterProducts);
}

function filterProducts() {
  const term = document.getElementById('searchInput').value.toLowerCase();
  const filtered = products.filter(p => {
    const matchesCat = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
    return matchesCat && matchesSearch;
  });
  renderProducts(filtered);
}

// CART LOGIC
function addToCart(id) {
  const p = products.find(x => x.id === id);
  const exists = cart.find(item => item.id === id);
  if (exists) exists.quantity++;
  else cart.push({ ...p, quantity: 1 });
  
  saveCart();
  updateCartUI();
  showToast(`${p.name} added to cart!`);
}

function updateCartUI() {
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  const countEl = document.getElementById('cartCount');
  
  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  countEl.textContent = totalQty;

  if (cart.length === 0) {
    container.innerHTML = '<div class="text-center py-5 opacity-50"><i class="fas fa-shopping-basket fa-3x mb-3"></i><p>Your cart is empty</p></div>';
    totalEl.textContent = '$0.00';
    return;
  }

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="me-3">
      <div class="flex-grow-1">
        <h6 class="fw-bold mb-0 small">${item.name}</h6>
        <small class="text-muted">$${item.price} x ${item.quantity}</small>
      </div>
      <button onclick="removeFromCart(${item.id})" class="btn btn-sm btn-link text-danger p-0"><i class="fas fa-times"></i></button>
    </div>
  `).join('');

  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
  totalEl.textContent = `$${total.toFixed(2)}`;
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() { localStorage.setItem('shop_cart', JSON.stringify(cart)); }

// THEME LOGIC
function initTheme() {
  const saved = localStorage.getItem('shop_theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', saved);
  updateThemeIcon(saved);

  document.getElementById('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-bs-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', next);
    localStorage.setItem('shop_theme', next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  if(icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// UI UTILS
function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `position-fixed bottom-0 start-50 translate-middle-x mb-4 shadow-lg p-3 rounded-pill z-3 animate-in bg-${type === 'success' ? 'dark' : 'danger'} text-white`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle text-success' : 'exclamation-circle'} me-2"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.getElementById('contactForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  showToast('Message sent! We will contact you soon.');
  e.target.reset();
});

// CHECKOUT LOGIC
document.getElementById('checkoutBtn')?.addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'danger');
    return;
  }
  
  if (!currentUser) {
    showToast('Please login to checkout!', 'danger');
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
    return;
  }

  showToast(`Order placed successfully! Thank you, ${currentUser.name}.`);
  cart = [];
  saveCart();
  updateCartUI();
  
  const cartOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('cartOffcanvas'));
  cartOffcanvas?.hide();
});


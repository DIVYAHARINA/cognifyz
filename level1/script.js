// Generate 100 products with UNIQUE images
const categories = ["Tech", "Audio", "Wearables", "Accessories"];
const products = [];
for (let i = 1; i <= 100; i++) {
  const cat = categories[i % categories.length];
  products.push({
    id: i,
    name: `${cat} Item ${i}`,
    price: (Math.random() * 400 + 19).toFixed(2),
    // Unique images for all 100 products
    image: `https://picsum.photos/seed/item_${i}/600/400`,
    category: cat
  });
}

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderProducts(products);
  updateCartUI();
  initDarkMode();
  initAuth();
  updateAuthUI();
});

// AUTH LOGIC
function initAuth() {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = signupForm.querySelector('[name="name"]').value;
    const email = signupForm.querySelector('[name="email"]').value;
    const password = signupForm.querySelector('[name="password"]').value;

    let users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.email === email)) {
      alert('User already exists!');
      return;
    }

    users.push({ name, email, password, joined: new Date().toLocaleDateString() });
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Signup successful! Please login.');
    bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.querySelector('[name="email"]').value;
    const password = loginForm.querySelector('[name="password"]').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      updateAuthUI();
      alert(`Welcome, ${user.name}!`);
      bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
    } else {
      alert('Invalid email or password!');
    }
  });
}

function updateAuthUI() {
  const authContainer = document.getElementById('authContainer');
  if (currentUser) {
    // Hide login/signup buttons and show profile dropdown
    authContainer.innerHTML = `
      <div class="dropdown">
        <button class="btn btn-outline-primary rounded-pill dropdown-toggle px-3" data-bs-toggle="dropdown">
          <i class="fas fa-user me-2"></i>${currentUser.name.split(' ')[0]}
        </button>
        <ul class="dropdown-menu dropdown-menu-end shadow border-0 p-2">
          <li><a class="dropdown-item rounded" href="#" data-bs-toggle="modal" data-bs-target="#profileModal">My Profile</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item rounded text-danger" href="#" onclick="logout()">Logout</a></li>
        </ul>
      </div>
    `;
    const pName = document.getElementById('profileName');
    const pEmail = document.getElementById('profileEmail');
    const pJoined = document.getElementById('profileJoined');
    if(pName) pName.textContent = currentUser.name;
    if(pEmail) pEmail.textContent = currentUser.email;
    if(pJoined) pJoined.textContent = currentUser.joined;
  } else {
    // Show login/signup buttons if NOT logged in
    authContainer.innerHTML = `
      <button class="btn btn-outline-primary d-none d-md-block ms-2 rounded-pill px-3" data-bs-toggle="modal" data-bs-target="#loginModal">Login</button>
      <button class="btn btn-primary d-none d-md-block ms-2 rounded-pill px-3" data-bs-toggle="modal" data-bs-target="#signupModal">Sign Up</button>
    `;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateAuthUI();
}

// Render Products
function renderProducts(productsToRender) {
  const grid = document.getElementById('productGrid');
  if(!grid) return;
  grid.innerHTML = productsToRender.map(product => `
    <div class="col-sm-6 col-md-4 col-lg-3">
      <div class="card product-card shadow-sm">
        <div class="product-image-container">
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="card-body p-3">
          <span class="badge bg-secondary mb-2 small">${product.category}</span>
          <h6 class="card-title fw-bold text-truncate">${product.name}</h6>
          <p class="text-primary fw-bold mb-3">$${product.price}</p>
          <button onclick="addToCart(${product.id})" class="btn btn-primary w-100 btn-sm">
            <i class="fas fa-cart-plus me-2"></i>Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Add to Cart
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existingItem = cart.find(item => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  
  const toast = document.createElement('div');
  toast.className = 'position-fixed bottom-0 end-0 p-3';
  toast.style.zIndex = '1060';
  toast.innerHTML = `
    <div class="toast show align-items-center text-white bg-success border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          ${product.name} added to cart!
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Update Cart UI
function updateCartUI() {
  const cartItems = document.getElementById('cartItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const emptyMsg = document.getElementById('emptyCartMsg');

  if(cartCount) cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
  
  if (cart.length === 0) {
    if(cartItems) cartItems.innerHTML = '';
    if(emptyMsg) emptyMsg.classList.remove('d-none');
    if(cartTotal) cartTotal.textContent = '$0.00';
    return;
  }

  if(emptyMsg) emptyMsg.classList.add('d-none');
  if(cartItems) cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="flex-grow-1">
        <h6 class="mb-0 fw-bold small">${item.name}</h6>
        <small class="text-muted">$${item.price} x ${item.quantity}</small>
      </div>
      <button onclick="removeFromCart(${item.id})" class="btn btn-sm btn-outline-danger px-1 py-0">
        <i class="fas fa-trash small"></i>
      </button>
    </div>
  `).join('');

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if(cartTotal) cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Remove from Cart
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Search Functionality
document.getElementById('productSearch')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm) || 
    p.category.toLowerCase().includes(searchTerm)
  );
  renderProducts(filtered);
});

// Contact Form
document.getElementById('contactForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Thank you for your message! We will get back to you soon.');
  e.target.reset();
});

// Dark Mode
function initDarkMode() {
  const toggle = document.getElementById('darkModeToggle');
  if(!toggle) return;
  
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-bs-theme', savedTheme);
  updateThemeIcon(savedTheme);

  toggle.addEventListener('click', () => {
    const currentTheme = document.body.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.body.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('darkModeToggle')?.querySelector('i');
  if(!icon) return;
  if (theme === 'dark') {
    icon.classList.replace('fa-moon', 'fa-sun');
  } else {
    icon.classList.replace('fa-sun', 'fa-moon');
  }
}

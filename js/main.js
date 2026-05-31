/* ═══════════════════════════════════════════
   JAZY'S HOUSE — Cart & Store Logic
   ═══════════════════════════════════════════ */

const CART_KEY = 'jazyshouse_cart';

/* ── PRODUCT CATALOG (African Handmade) ── */
const products = [
  // WOMEN'S CLOTHING
  { id: 'w1', name: 'Ankara Print Maxi Dress', category: 'women', price: 85, image: '👗', badge: 'BESTSELLER', badgeClass: '' },
  { id: 'w2', name: 'Kente Wrap Skirt', category: 'women', price: 65, image: '👘', badge: null, badgeClass: '' },
  { id: 'w3', name: 'Hand-Dyed Bogolan Top', category: 'women', price: 55, image: '👚', badge: 'NEW', badgeClass: 'new' },
  { id: 'w4', name: 'Dashiki Tunic Dress', category: 'women', price: 70, image: '👗', badge: null, badgeClass: '' },
  { id: 'w5', name: 'Wax Print Palazzo Pants', category: 'women', price: 60, image: '👖', badge: 'SALE', badgeClass: 'sale' },
  { id: 'w6', name: 'Kitenge Blazer Jacket', category: 'women', price: 95, image: '🧥', badge: 'LIMITED', badgeClass: '' },
  { id: 'w7', name: 'Aso Oke Statement Blouse', category: 'women', price: 75, image: '👔', badge: 'NEW', badgeClass: 'new' },
  { id: 'w8', name: 'Mudcloth Print Jumpsuit', category: 'women', price: 90, image: '👗', badge: null, badgeClass: '' },

  // MEN'S CLOTHING
  { id: 'm1', name: 'Kente Print Button-Up Shirt', category: 'men', price: 65, image: '👔', badge: 'BESTSELLER', badgeClass: '' },
  { id: 'm2', name: 'Handwoven Agbada Set', category: 'men', price: 150, image: '🪡', badge: 'PREMIUM', badgeClass: '' },
  { id: 'm3', name: 'Dashiki Classic Fit', category: 'men', price: 50, image: '👕', badge: null, badgeClass: '' },
  { id: 'm4', name: 'Ankara Print Bomber Jacket', category: 'men', price: 110, image: '🧥', badge: 'NEW', badgeClass: 'new' },
  { id: 'm5', name: 'Mudcloth Cargo Trousers', category: 'men', price: 75, image: '👖', badge: null, badgeClass: '' },
  { id: 'm6', name: 'Bogolan Print Short Sleeve', category: 'men', price: 45, image: '👕', badge: 'SALE', badgeClass: 'sale' },

  // KIDS
  { id: 'k1', name: 'Mini Ankara Dress', category: 'kids', price: 35, image: '👗', badge: 'NEW', badgeClass: 'new' },
  { id: 'k2', name: 'Kids Dashiki Set', category: 'kids', price: 40, image: '👕', badge: null, badgeClass: '' },
  { id: 'k3', name: 'Toddler Kente Romper', category: 'kids', price: 30, image: '👶', badge: 'BESTSELLER', badgeClass: '' },
  { id: 'k4', name: 'Children\'s Wax Print Shirt', category: 'kids', price: 28, image: '👔', badge: null, badgeClass: '' },
  { id: 'k5', name: 'Junior Mudcloth Joggers', category: 'kids', price: 32, image: '👖', badge: 'LIMITED', badgeClass: '' },
  { id: 'k6', name: 'Baby Ankara Headwrap Set', category: 'kids', price: 22, image: '🧢', badge: null, badgeClass: '' },

  // HANDMADE ACCESSORIES
  { id: 'a1', name: 'Ankara Tote Bag', category: 'accessories', price: 45, image: '👜', badge: 'BESTSELLER', badgeClass: '' },
  { id: 'a2', name: 'Beaded Maasai Necklace', category: 'accessories', price: 38, image: '📿', badge: 'HANDMADE', badgeClass: '' },
  { id: 'a3', name: 'Kente Print Headwrap', category: 'accessories', price: 25, image: '🧣', badge: null, badgeClass: '' },
  { id: 'a4', name: 'Cowrie Shell Earrings', category: 'accessories', price: 30, image: '✨', badge: 'NEW', badgeClass: 'new' },
  { id: 'a5', name: 'Handwoven Raffia Clutch', category: 'accessories', price: 55, image: '👛', badge: 'ARTISAN', badgeClass: '' },
  { id: 'a6', name: 'Brass Cuff Bracelet Set', category: 'accessories', price: 42, image: '💫', badge: null, badgeClass: '' },
  { id: 'a7', name: 'Wax Print Scrunchie Set (3)', category: 'accessories', price: 18, image: '🎀', badge: 'SALE', badgeClass: 'sale' },
  { id: 'a8', name: 'Ankara Pocket Square', category: 'accessories', price: 20, image: '🧶', badge: null, badgeClass: '' },
];

/* ── CATERING MENU (African Cuisine) ── */
const cateringMenu = [
  { id: 'c1', name: 'Taste of Africa Platter', desc: 'Jollof rice, suya skewers, puff-puff, plantain — a complete African feast', price: 'from £22/pp', image: '🍛' },
  { id: 'c2', name: 'Braai Experience', desc: 'South African-style barbecue — boerewors, grilled meats, chakalaka, pap', price: 'from £28/pp', image: '🥩' },
  { id: 'c3', name: 'West African Banquet', desc: 'Egusi soup, fufu, jollof, fried rice, moin moin — full spread', price: 'from £30/pp', image: '🍲' },
  { id: 'c4', name: 'East African Feast', desc: 'Nyama choma, ugali, samosas, kachumbari, chapati station', price: 'from £25/pp', image: '🍖' },
  { id: 'c5', name: 'African Dessert Table', desc: 'Chin chin, puff-puff tower, malva pudding, koeksisters, bissap shots', price: 'from £15/pp', image: '🍩' },
  { id: 'c6', name: 'Full Event Catering', desc: 'End-to-end African catering — custom menu, staff, setup, full service', price: 'Custom quote', image: '🎉' },
];

/* ── CART ── */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const cart = getCart();
  const existing = cart.find(i => i.id === productId);
  if (existing) { existing.qty += 1; }
  else { cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 }); }
  saveCart(cart);
  showToast(`${product.name} added to cart ✨`);
}

function removeFromCart(productId) {
  saveCart(getCart().filter(i => i.id !== productId));
}

function updateQty(productId, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(productId); return; }
  saveCart(cart);
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function updateCartUI() {
  const count = cartCount();
  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

/* ── RENDER PRODUCTS ── */
function renderProducts(filter = 'all') {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
  grid.innerHTML = filtered.map(p => `
    <div class="product-card fade-up">
      <div class="product-image">
        ${p.image}
        ${p.badge ? `<span class="product-badge ${p.badgeClass}">${p.badge}</span>` : ''}
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">£${p.price}</div>
        <button class="add-to-cart" onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    </div>
  `).join('');
}

/* ── RENDER CATERING ── */
function renderCatering() {
  const grid = document.getElementById('catering-grid');
  if (!grid) return;
  grid.innerHTML = cateringMenu.map(c => `
    <div class="catering-card fade-up">
      <div class="catering-img">${c.image}</div>
      <div class="catering-info">
        <h3>${c.name}</h3>
        <p>${c.desc}</p>
        <div class="price">${c.price}</div>
      </div>
    </div>
  `).join('');
}

/* ── RENDER CART ── */
function renderCart() {
  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!itemsEl || !totalEl) return;
  const cart = getCart();
  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="empty-cart"><div class="icon">🛒</div><p>Your cart is empty</p><p style="font-size:0.8rem;color:var(--text-light);">Explore our handmade collection!</p></div>';
    totalEl.textContent = '£0';
    return;
  }
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">${item.image}</div>
      <div class="cart-item-details">
        <h4>${item.name}</h4>
        <div class="item-price">£${item.price} × ${item.qty} = £${item.price * item.qty}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
          <button onclick="updateQty('${item.id}', -1)" style="background:var(--border);border:none;color:var(--text);width:26px;height:26px;cursor:pointer;border-radius:6px;font-weight:700;">−</button>
          <span style="font-size:0.85rem;font-weight:600;">${item.qty}</span>
          <button onclick="updateQty('${item.id}', 1)" style="background:var(--border);border:none;color:var(--text);width:26px;height:26px;cursor:pointer;border-radius:6px;font-weight:700;">+</button>
          <button class="cart-item-remove" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join('');
  totalEl.textContent = `£${cartTotal()}`;
}

/* ── CART PANEL ── */
function openCart() {
  renderCart();
  document.getElementById('cart-overlay').classList.add('open');
  document.getElementById('cart-panel').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-panel').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── TOAST ── */
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:var(--accent);color:white;padding:14px 28px;font-family:var(--font-body);font-size:0.8rem;font-weight:600;letter-spacing:1px;z-index:3000;border-radius:8px;transition:all 0.3s;opacity:0;pointer-events:none;box-shadow:0 8px 25px rgba(192,86,61,0.4);';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2500);
}

/* ── MOBILE MENU ── */
function toggleMobileMenu() {
  document.getElementById('nav-links').classList.toggle('open');
}

/* ── CATEGORY TABS ── */
function switchCategory(tab, filter) {
  document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  renderProducts(filter);
}

/* ── NEWSLETTER ── */
function subscribeNewsletter(event) {
  event.preventDefault();
  const email = document.getElementById('newsletter-email').value;
  if (email) {
    showToast('Welcome to Jazy\'s House! 🧡 10% off your first order');
    document.getElementById('newsletter-email').value = '';
  }
}

/* ── CHECKOUT ── */
function checkout() {
  const cart = getCart();
  if (cart.length === 0) { showToast('Your cart is empty 🛒'); return; }
  const items = cart.map(i => `${i.name} ×${i.qty} — £${i.price * i.qty}`).join('\n');
  alert(`🛍️ Jazy's House — Order Summary\n\n${items}\n\nTotal: £${cartTotal()}\n\n💳 Payment: Stripe / PayPal coming soon\n📧 We'll email your confirmation`);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
  renderProducts();
  renderCatering();
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
});

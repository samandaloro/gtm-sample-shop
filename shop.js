// ============================================================
//  Fake shop data + cart logic (localStorage based)
//  No backend. Everything runs in the browser.
// ============================================================

const PRODUCTS = [
  { id: 'SKU-001', name: 'Cloud Runner Sneakers', brand: 'Nimbus',   price: 89.0,  emoji: '👟', category: 'Footwear',    desc: 'Featherlight everyday sneakers with a responsive foam sole.' },
  { id: 'SKU-002', name: 'Aero Water Bottle',      brand: 'Hydra',    price: 24.0,  emoji: '🍶', category: 'Accessories', desc: 'Insulated 24oz bottle that keeps drinks cold for 18 hours.' },
  { id: 'SKU-003', name: 'Trailhead Backpack',     brand: 'Summit',   price: 129.0, emoji: '🎒', category: 'Bags',        desc: '30L weatherproof pack with a padded laptop sleeve.' },
  { id: 'SKU-004', name: 'Pulse Wireless Earbuds', brand: 'Wavelength', price: 149.0, emoji: '🎧', category: 'Electronics', desc: 'Active noise cancelling earbuds with 30h battery life.' },
  { id: 'SKU-005', name: 'Ember Scented Candle',   brand: 'Hearth',   price: 18.0,  emoji: '🕯️', category: 'Home',        desc: 'Hand-poured soy candle — cedarwood and warm amber.' },
  { id: 'SKU-006', name: 'Meridian Sunglasses',    brand: 'Solstice', price: 65.0,  emoji: '🕶️', category: 'Accessories', desc: 'Polarized UV400 lenses in a lightweight acetate frame.' }
];

const CURRENCY = 'USD';

function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

// ---- Cart (localStorage) ----
function getCart() {
  try { return JSON.parse(localStorage.getItem('cart')) || []; }
  catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function addToCart(id, qty = 1) {
  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  if (existing) existing.qty += qty;
  else cart.push({ id, qty });
  saveCart(cart);
  track('add_to_cart', { items: [toItem(getProduct(id), qty)] });
}

function removeFromCart(id) {
  const removed = getCart().find(item => item.id === id);
  saveCart(getCart().filter(item => item.id !== id));
  if (removed) track('remove_from_cart', { items: [toItem(getProduct(id), removed.qty)] });
}

function cartItems() {
  return getCart().map(item => toItem(getProduct(item.id), item.qty));
}

function cartTotal() {
  return getCart().reduce((sum, item) => sum + getProduct(item.id).price * item.qty, 0);
}

function cartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function clearCart() {
  localStorage.removeItem('cart');
  updateCartCount();
}

function updateCartCount() {
  const el = document.getElementById('cart-count');
  if (el) el.textContent = cartCount();
}

function money(n) {
  return '$' + n.toFixed(2);
}

// ---- Tracking (GTM dataLayer, GA4 ecommerce schema) ----
// Every event carries an event_id. Send the same value from the browser
// Meta Pixel tag (eventID) and the server-side Conversions API tag so Meta
// can deduplicate the two copies of each event.
window.dataLayer = window.dataLayer || [];

function newEventId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now() + '-' + Math.random().toString(36).slice(2);
}

function toItem(p, qty = 1) {
  return {
    item_id: p.id,
    item_name: p.name,
    item_brand: p.brand,
    item_category: p.category,
    price: p.price,
    quantity: qty
  };
}

function itemsValue(items) {
  return Math.round(items.reduce((sum, i) => sum + i.price * i.quantity, 0) * 100) / 100;
}

// track('add_to_cart', { items })                       -> ecommerce event
// track('purchase', { items, ecommerce: {...}, user_data, eventId })
function track(event, { items, ecommerce = {}, eventId = newEventId(), ...rest } = {}) {
  const payload = { event, event_id: eventId, ...rest };
  if (items) {
    dataLayer.push({ ecommerce: null }); // clear the previous ecommerce object
    payload.ecommerce = { currency: CURRENCY, value: itemsValue(items), items, ...ecommerce };
  }
  dataLayer.push(payload);
  console.log('[dataLayer]', event, payload);
}

document.addEventListener('DOMContentLoaded', updateCartCount);

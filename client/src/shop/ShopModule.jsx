import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BottomNav } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const HOLO = 'linear-gradient(135deg,#4facfe,#00f2fe,#f3a0ff,#ff85a2)';
const CARD_STYLE = {
  background: '#fff',
  borderRadius: 20,
  border: '1.5px solid rgba(79,172,254,0.15)',
  boxShadow: '0 4px 20px rgba(79,172,254,0.08)',
  overflow: 'hidden',
  transition: 'all 0.2s',
};

const CATEGORIES = [
  { label: 'Todos',       value: '' },
  { label: 'Playeras',    value: 'shirts' },
  { label: 'Pantalones',  value: 'pants' },
  { label: 'Vestidos',    value: 'dresses' },
  { label: 'Zapatos',     value: 'shoes' },
  { label: 'Accesorios',  value: 'accessories' },
  { label: 'Chamarras',   value: 'outerwear' },
];

// ── Producto Card ────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart, onClick }) {
  const [hovered, setHovered] = useState(false);
  const img = product.images?.[0] || product.image || '';

  return (
    <div
      onClick={() => onClick(product)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...CARD_STYLE,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered
          ? '0 8px 32px rgba(79,172,254,0.18), 0 0 0 1.5px rgba(243,160,255,0.3)'
          : '0 4px 20px rgba(79,172,254,0.08)',
      }}
    >
      <div style={{ position: 'relative', height: 180, background: 'linear-gradient(135deg,rgba(79,172,254,0.06),rgba(243,160,255,0.06))' }}>
        {img ? (
          <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🛍️</div>
        )}
        {product.stock === 0 && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>
            Agotado
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        {product.seller?.username && (
          <div style={{ fontSize: 10, color: '#4facfe', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🏪 {product.seller.firstName || product.seller.username}
          </div>
        )}
        <div style={{ fontWeight: 700, fontSize: 14, color: '#0a0a14', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(10,10,20,0.45)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: 18, background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ${product.price}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onAddToCart(product); }}
            disabled={product.stock === 0}
            style={{
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
              background: product.stock === 0 ? 'rgba(0,0,0,0.06)' : HOLO,
              color: '#fff', fontSize: 12, fontWeight: 700,
              boxShadow: product.stock === 0 ? 'none' : '0 2px 10px rgba(79,172,254,0.3)',
            }}
          >
            + Carrito
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lista de productos ───────────────────────────────────────────────
function ProductList({ products, cart, onAddToCart, onViewProduct }) {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => {
    const matchCat = !category || p.category === category;
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const cartCount = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: 100, fontFamily: "'Outfit',sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1.5px solid rgba(79,172,254,0.1)', padding: '16px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tienda Kronos</div>
            <div style={{ fontSize: 12, color: 'rgba(10,10,20,0.45)' }}>{products.length} productos disponibles</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/shop/my-orders')}
              style={{ padding: '8px 14px', borderRadius: 20, border: '1.5px solid rgba(79,172,254,0.2)', background: '#fff', fontSize: 12, fontWeight: 600, color: '#4facfe', cursor: 'pointer' }}>
              Mis Órdenes
            </button>
            <button onClick={() => navigate('/shop/cart')}
              style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: HOLO, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(79,172,254,0.3)', position: 'relative' }}>
              🛒 {cartCount > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#ff85a2', color: '#fff', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>}
              Carrito
            </button>
          </div>
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar productos..."
          style={{ width: '100%', padding: '10px 16px', borderRadius: 20, border: '1.5px solid rgba(79,172,254,0.2)', background: 'rgba(79,172,254,0.04)', fontSize: 13, outline: 'none', color: '#0a0a14', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(cat => (
            <button key={cat.value} onClick={() => setCategory(cat.value)}
              style={{ padding: '6px 14px', borderRadius: 20, border: '1.5px solid', whiteSpace: 'nowrap', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
                borderColor: category === cat.value ? 'transparent' : 'rgba(79,172,254,0.2)',
                background: category === cat.value ? HOLO : '#fff',
                color: category === cat.value ? '#fff' : 'rgba(10,10,20,0.5)',
              }}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: '20px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(10,10,20,0.35)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>No hay productos</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 16 }}>
            {filtered.map(p => (
              <ProductCard key={p._id} product={p} onAddToCart={onAddToCart} onClick={onViewProduct} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detalle de producto ──────────────────────────────────────────────
function ProductDetail({ products, onAddToCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = products.find(p => p._id === id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48 }}>😕</div>
        <div style={{ fontWeight: 700, color: '#0a0a14', marginTop: 12 }}>Producto no encontrado</div>
        <button onClick={() => navigate('/shop')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 20, background: HOLO, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Volver</button>
      </div>
    </div>
  );

  const img = product.images?.[0] || product.image || '';

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Outfit',sans-serif", paddingBottom: 100 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1.5px solid rgba(79,172,254,0.1)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0a0a14' }}>Detalle del producto</span>
      </div>

      <div style={{ height: 280, background: 'linear-gradient(135deg,rgba(79,172,254,0.08),rgba(243,160,255,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {img ? <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 80 }}>🛍️</span>}
      </div>

      <div style={{ padding: '24px 20px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: '#0a0a14', marginBottom: 6 }}>{product.name}</div>
        <div style={{ fontSize: 28, fontWeight: 900, background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 16 }}>${product.price}</div>
        <div style={{ fontSize: 14, color: 'rgba(10,10,20,0.6)', lineHeight: 1.6, marginBottom: 24 }}>{product.description}</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: 'rgba(10,10,20,0.5)', fontWeight: 600 }}>Cantidad:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(79,172,254,0.06)', borderRadius: 20, padding: '4px 12px', border: '1.5px solid rgba(79,172,254,0.15)' }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#4facfe', fontWeight: 700 }}>−</button>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0a0a14', minWidth: 20, textAlign: 'center' }}>{qty}</span>
            <button onClick={() => setQty(q => q + 1)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#4facfe', fontWeight: 700 }}>+</button>
          </div>
        </div>

        <button
          onClick={() => { for (let i = 0; i < qty; i++) onAddToCart(product); setAdded(true); setTimeout(() => setAdded(false), 2000); }}
          disabled={product.stock === 0}
          style={{ width: '100%', padding: '16px', borderRadius: 20, border: 'none', background: product.stock === 0 ? 'rgba(0,0,0,0.08)' : HOLO, color: '#fff', fontWeight: 800, fontSize: 16, cursor: product.stock === 0 ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(79,172,254,0.3)', fontFamily: 'inherit' }}>
          {added ? '✓ Agregado al carrito' : product.stock === 0 ? 'Agotado' : '🛒 Agregar al carrito'}
        </button>
      </div>
    </div>
  );
}

// ── Carrito ──────────────────────────────────────────────────────────
function Cart({ cart, setCart }) {
  const navigate = useNavigate();
  const total = cart.reduce((a, b) => a + b.price * b.quantity, 0);

  const update = (id, qty) => {
    if (qty <= 0) setCart(cart.filter(i => i.productId !== id));
    else setCart(cart.map(i => i.productId === id ? { ...i, quantity: qty } : i));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Outfit',sans-serif", paddingBottom: 100 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1.5px solid rgba(79,172,254,0.1)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0a0a14' }}>Carrito ({cart.length})</span>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🛒</div>
            <div style={{ fontWeight: 700, color: '#0a0a14', fontSize: 18 }}>Tu carrito está vacío</div>
            <button onClick={() => navigate('/shop')} style={{ marginTop: 20, padding: '12px 28px', borderRadius: 20, background: HOLO, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Explorar tienda</button>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.productId} style={{ ...CARD_STYLE, marginBottom: 12, display: 'flex', gap: 14, padding: 14 }}>
                <div style={{ width: 70, height: 70, borderRadius: 14, background: 'rgba(79,172,254,0.08)', flexShrink: 0, overflow: 'hidden' }}>
                  {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🛍️</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0a0a14', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${(item.price * item.quantity).toFixed(2)}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <button onClick={() => update(item.productId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(79,172,254,0.3)', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#4facfe', fontSize: 16 }}>−</button>
                    <span style={{ fontWeight: 700, color: '#0a0a14' }}>{item.quantity}</span>
                    <button onClick={() => update(item.productId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1.5px solid rgba(79,172,254,0.3)', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#4facfe', fontSize: 16 }}>+</button>
                    <button onClick={() => update(item.productId, 0)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ef4444', fontSize: 16, cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              </div>
            ))}

            <div style={{ ...CARD_STYLE, padding: 20, marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(10,10,20,0.5)', fontSize: 14 }}>Subtotal</span>
                <span style={{ fontWeight: 700, color: '#0a0a14' }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: 'rgba(10,10,20,0.5)', fontSize: 14 }}>Envío</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>Gratis</span>
              </div>
              <div style={{ borderTop: '1.5px solid rgba(79,172,254,0.1)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#0a0a14' }}>Total</span>
                <span style={{ fontWeight: 900, fontSize: 22, background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${total.toFixed(2)}</span>
              </div>
              <button onClick={() => navigate('/shop/checkout')}
                style={{ width: '100%', padding: 16, borderRadius: 20, border: 'none', background: HOLO, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,172,254,0.3)', fontFamily: 'inherit' }}>
                Proceder al pago →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Checkout ─────────────────────────────────────────────────────────
function Checkout({ cart }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({ name: user?.firstName || '', email: user?.email || '', address: '', city: '', zip: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const total = cart.reduce((a, b) => a + b.price * b.quantity, 0);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/orders`, {
        items: cart.map(i => ({ product: i.productId, quantity: i.quantity, price: i.price })),
        total,
        shippingAddress: form,
      }, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.removeItem('cart');
      setDone(true);
    } catch { }
    setLoading(false);
  };

  if (done) return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: 24, background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 8 }}>¡Orden confirmada!</div>
        <div style={{ color: 'rgba(10,10,20,0.5)', marginBottom: 24 }}>Tu pedido ha sido procesado exitosamente</div>
        <button onClick={() => navigate('/shop')} style={{ padding: '12px 32px', borderRadius: 20, background: HOLO, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(79,172,254,0.3)' }}>
          Seguir comprando
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Outfit',sans-serif", paddingBottom: 100 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1.5px solid rgba(79,172,254,0.1)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0a0a14' }}>Finalizar compra</span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '20px 20px' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#0a0a14', marginBottom: 14 }}>Datos de envío</div>

        {[
          { key: 'name', label: 'Nombre completo', placeholder: 'Tu nombre' },
          { key: 'email', label: 'Email', placeholder: 'tu@email.com', type: 'email' },
          { key: 'address', label: 'Dirección', placeholder: 'Calle y número' },
          { key: 'city', label: 'Ciudad', placeholder: 'Ciudad' },
          { key: 'zip', label: 'Código postal', placeholder: '00000' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(10,10,20,0.5)', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input
              type={f.type || 'text'}
              value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              required
              style={{ width: '100%', padding: '12px 16px', borderRadius: 14, border: '1.5px solid rgba(79,172,254,0.2)', background: 'rgba(79,172,254,0.03)', fontSize: 14, outline: 'none', color: '#0a0a14', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        ))}

        <div style={{ ...CARD_STYLE, padding: 20, marginTop: 8, marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0a0a14', marginBottom: 12 }}>Resumen del pedido</div>
          {cart.map(i => (
            <div key={i.productId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
              <span style={{ color: 'rgba(10,10,20,0.6)' }}>{i.name} x{i.quantity}</span>
              <span style={{ fontWeight: 700, color: '#0a0a14' }}>${(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1.5px solid rgba(79,172,254,0.1)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800 }}>Total</span>
            <span style={{ fontWeight: 900, fontSize: 18, background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${total.toFixed(2)}</span>
          </div>
        </div>

        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: 16, borderRadius: 20, border: 'none', background: loading ? 'rgba(0,0,0,0.08)' : HOLO, color: '#fff', fontWeight: 800, fontSize: 16, cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 20px rgba(79,172,254,0.3)', fontFamily: 'inherit' }}>
          {loading ? 'Procesando...' : '✓ Confirmar orden'}
        </button>
      </form>
    </div>
  );
}

// ── Mis órdenes ──────────────────────────────────────────────────────
function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } });
        setOrders(data.orders || data || []);
      } catch { }
      setLoading(false);
    };
    fetch();
  }, []);

  const STATUS = {
    pending:    { label: 'Pendiente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    processing: { label: 'En proceso', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    shipped:    { label: 'Enviado',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    delivered:  { label: 'Entregado',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    cancelled:  { label: 'Cancelado',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'Outfit',sans-serif", paddingBottom: 100 }}>
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1.5px solid rgba(79,172,254,0.1)' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>←</button>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#0a0a14' }}>Mis Órdenes</span>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(10,10,20,0.35)' }}>Cargando...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 700, color: '#0a0a14', fontSize: 18 }}>Sin órdenes aún</div>
            <button onClick={() => navigate('/shop')} style={{ marginTop: 20, padding: '12px 28px', borderRadius: 20, background: HOLO, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Ir a la tienda</button>
          </div>
        ) : orders.map(order => {
          const st = STATUS[order.status] || STATUS.pending;
          return (
            <div key={order._id} style={{ ...CARD_STYLE, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(10,10,20,0.4)', fontWeight: 600 }}>#{order._id?.slice(-8).toUpperCase()}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 20 }}>{st.label}</span>
              </div>
              {(order.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'rgba(10,10,20,0.6)' }}>{item.product?.name || 'Producto'} x{item.quantity}</span>
                  <span style={{ fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1.5px solid rgba(79,172,254,0.1)', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'rgba(10,10,20,0.4)' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                <span style={{ fontWeight: 800, background: HOLO, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>${order.total?.toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────
export default function ShopModule() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/products`)
      .then(r => setProducts(r.data.products || r.data || []))
      .catch(() => {});
  }, []);

  const saveCart = c => { setCart(c); localStorage.setItem('cart', JSON.stringify(c)); };

  const addToCart = product => {
    const existing = cart.find(i => i.productId === product._id);
    if (existing) saveCart(cart.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i));
    else saveCart([...cart, { productId: product._id, name: product.name, price: product.price, image: product.images?.[0] || '', quantity: 1 }]);
  };

  return (
    <Routes>
      <Route path="/" element={<ProductList products={products} cart={cart} onAddToCart={addToCart} onViewProduct={p => navigate(`/shop/product/${p._id}`)} />} />
      <Route path="/product/:id" element={<ProductDetail products={products} onAddToCart={addToCart} />} />
      <Route path="/cart" element={<Cart cart={cart} setCart={saveCart} />} />
      <Route path="/checkout" element={<Checkout cart={cart} />} />
      <Route path="/my-orders" element={<MyOrders />} />
    </Routes>
  );
}

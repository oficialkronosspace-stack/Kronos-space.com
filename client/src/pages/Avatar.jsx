import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { GlassCard } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RARITY_COLORS = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

const RARITY_LABELS = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};

const CATEGORY_LABELS = {
  hair: 'Cabello',
  skin: 'Piel',
  accessory: 'Accesorio',
  outfit: 'Outfit',
  background: 'Fondo',
};

const CATEGORIES = ['hair', 'accessory', 'outfit', 'background', 'skin'];

function AvatarCanvas({ avatar }) {
  if (!avatar) return null;

  const bgItem = avatar.equippedItems?.find(e => e.category === 'background');
  const hairItem = avatar.equippedItems?.find(e => e.category === 'hair');
  const accessoryItem = avatar.equippedItems?.find(e => e.category === 'accessory');
  const outfitItem = avatar.equippedItems?.find(e => e.category === 'outfit');

  const bgColor = bgItem ? '#1a0a2e' : (avatar.backgroundColor || '#7c3aed');
  const bgEmoji = bgItem?.itemId?.imageEmoji || null;

  return (
    <div style={{
      width: 200,
      height: 200,
      borderRadius: 24,
      background: bgEmoji
        ? `radial-gradient(ellipse at center, #1a0a2e 0%, #ffffff 100%)`
        : bgColor,
      border: '2px solid rgba(124,58,237,0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 32px rgba(124,58,237,0.3)',
      margin: '0 auto',
    }}>
      {bgEmoji && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 80,
          opacity: 0.3,
        }}>
          {bgEmoji}
        </div>
      )}

      {/* Hair on top */}
      {hairItem?.itemId?.imageEmoji && (
        <div style={{ fontSize: 32, position: 'absolute', top: 16, zIndex: 3 }}>
          {hairItem.itemId.imageEmoji}
        </div>
      )}

      {/* Face / skin */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: avatar.skinColor || '#FDBCB4',
        border: '3px solid rgba(255,255,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        position: 'relative',
        zIndex: 2,
        marginTop: hairItem ? 20 : 0,
      }}>
        😊
      </div>

      {/* Accessory overlay */}
      {accessoryItem?.itemId?.imageEmoji && (
        <div style={{ fontSize: 26, position: 'absolute', top: 38, right: 42, zIndex: 4 }}>
          {accessoryItem.itemId.imageEmoji}
        </div>
      )}

      {/* Outfit below face */}
      {outfitItem?.itemId?.imageEmoji && (
        <div style={{ fontSize: 36, marginTop: 4, position: 'relative', zIndex: 2 }}>
          {outfitItem.itemId.imageEmoji}
        </div>
      )}
    </div>
  );
}

export default function AvatarPage() {
  useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('avatar');
  const [avatar, setAvatar] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const showMsg = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchAvatar = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/avatar`, { headers });
      setAvatar(data.data);
    } catch (err) {
      showMsg('Error cargando avatar', true);
    }
  }, []);

  const fetchTokens = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/wallet`, { headers });
      setTokenBalance(data.cash?.kroTokens ?? data.kroTokens ?? 0);
    } catch {}
  }, []);

  const fetchShop = useCallback(async () => {
    setShopLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/avatar/shop`, { headers });
      setShopItems(data.data || []);
    } catch (err) {
      showMsg('Error cargando tienda', true);
    } finally {
      setShopLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAvatar(), fetchTokens()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === 'shop' && shopItems.length === 0) {
      fetchShop();
    }
  }, [activeTab]);

  const handleBuy = async (itemId) => {
    setActionLoading(itemId);
    try {
      const { data } = await axios.post(`${API_URL}/avatar/buy`, { itemId }, { headers });
      showMsg(data.message || 'Comprado!');
      setTokenBalance(data.tokensRemaining);
      await fetchAvatar();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error al comprar', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEquip = async (itemId) => {
    setActionLoading(itemId);
    try {
      const { data } = await axios.post(`${API_URL}/avatar/equip`, { itemId }, { headers });
      showMsg(data.message || 'Equipado!');
      setAvatar(data.data);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error al equipar', true);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnequip = async (itemId) => {
    setActionLoading(itemId);
    try {
      const { data } = await axios.post(`${API_URL}/avatar/unequip`, { itemId }, { headers });
      showMsg(data.message || 'Desequipado');
      setAvatar(data.data);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error', true);
    } finally {
      setActionLoading(null);
    }
  };

  const isOwned = (itemId) => {
    if (!avatar) return false;
    return avatar.ownedItems?.some(
      owned => (owned._id || owned).toString() === itemId.toString()
    );
  };

  const isEquipped = (itemId) => {
    if (!avatar) return false;
    return avatar.equippedItems?.some(
      e => (e.itemId?._id || e.itemId).toString() === itemId.toString()
    );
  };

  const filteredItems = filterCategory === 'all'
    ? shopItems
    : shopItems.filter(item => item.category === filterCategory);

  const styles = {
    page: {
      minHeight: '100vh',
      background: '#ffffff',
      color: '#fff',
      fontFamily: "'Outfit', sans-serif",
      paddingTop: 72,
      paddingBottom: 80,
    },
    header: {
      padding: '24px 20px 0',
      maxWidth: 600,
      margin: '0 auto',
    },
    title: {
      fontSize: 26,
      fontWeight: 800,
      background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      margin: 0,
    },
    tabs: {
      display: 'flex',
      gap: 0,
      margin: '20px 20px 0',
      maxWidth: 600,
      marginLeft: 'auto',
      marginRight: 'auto',
      background: 'rgba(79,172,254,0.04)',
      borderRadius: 12,
      padding: 4,
    },
    tab: (active) => ({
      flex: 1,
      padding: '10px 16px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 600,
      fontSize: 14,
      transition: 'all 0.2s',
      background: active ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : 'transparent',
      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
    }),
    content: {
      padding: '20px',
      maxWidth: 600,
      margin: '0 auto',
    },
    tokenBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: 'rgba(124,58,237,0.2)',
      border: '1px solid rgba(124,58,237,0.4)',
      borderRadius: 20,
      padding: '6px 14px',
      fontSize: 14,
      fontWeight: 700,
      color: '#a78bfa',
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: 'rgba(10,10,20,0.5)',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 12,
      marginTop: 20,
    },
    equippedRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: 'rgba(79,172,254,0.04)',
      borderRadius: 10,
      marginBottom: 8,
    },
    unequipBtn: {
      padding: '4px 12px',
      borderRadius: 8,
      border: '1px solid rgba(239,68,68,0.4)',
      background: 'rgba(239,68,68,0.1)',
      color: '#f87171',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 600,
    },
    shopGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: 12,
      marginTop: 8,
    },
    itemCard: {
      background: 'rgba(79,172,254,0.04)',
      borderRadius: 14,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      border: '1px solid rgba(79,172,254,0.12)',
      transition: 'transform 0.15s',
    },
    rarityBadge: (rarity) => ({
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 10,
      fontWeight: 700,
      background: `${RARITY_COLORS[rarity]}22`,
      color: RARITY_COLORS[rarity],
      border: `1px solid ${RARITY_COLORS[rarity]}44`,
    }),
    filterRow: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 4,
      marginBottom: 12,
    },
    filterChip: (active) => ({
      padding: '5px 12px',
      borderRadius: 20,
      border: `1px solid ${active ? '#7c3aed' : 'rgba(255,255,255,0.12)'}`,
      background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
      color: active ? '#a78bfa' : 'rgba(255,255,255,0.5)',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }),
    actionBtn: (variant) => ({
      width: '100%',
      padding: '7px 0',
      borderRadius: 8,
      border: variant === 'equip' ? '1px solid rgba(6,182,212,0.4)' : 'none',
      cursor: 'pointer',
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 700,
      fontSize: 12,
      background: variant === 'buy'
        ? 'linear-gradient(135deg,#7c3aed,#06b6d4)'
        : variant === 'equip'
          ? 'rgba(6,182,212,0.2)'
          : 'rgba(255,255,255,0.06)',
      color: variant === 'equipped' ? 'rgba(255,255,255,0.4)' : '#fff',
    }),
    msgBox: (isError) => ({
      position: 'fixed',
      bottom: 90,
      left: '50%',
      transform: 'translateX(-50%)',
      background: isError ? 'rgba(239,68,68,0.9)' : 'rgba(6,182,212,0.9)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: 10,
      fontWeight: 700,
      fontSize: 14,
      zIndex: 999,
      backdropFilter: 'blur(8px)',
      whiteSpace: 'nowrap',
    }),
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 16 }}>Cargando avatar...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {msg && <div style={styles.msgBox(msg.isError)}>{msg.text}</div>}

      <div style={styles.header}>
        <h1 style={styles.title}>Mi Avatar</h1>
        <p style={{ color: 'rgba(10,10,20,0.5)', fontSize: 14, margin: '6px 0 0' }}>
          Personaliza tu identidad en Kronos
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'avatar')} onClick={() => setActiveTab('avatar')}>
          🧑 Mi Avatar
        </button>
        <button style={styles.tab(activeTab === 'shop')} onClick={() => setActiveTab('shop')}>
          🛍️ Tienda
        </button>
      </div>

      <div style={styles.content}>
        {/* Token balance */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div style={styles.tokenBadge}>
            🪙 {tokenBalance.toLocaleString()} KRO
          </div>
        </div>

        {/* MY AVATAR TAB */}
        {activeTab === 'avatar' && (
          <>
            <GlassCard style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                <AvatarCanvas avatar={avatar} />
                <div style={{ fontSize: 13, color: 'rgba(10,10,20,0.5)', textAlign: 'center' }}>
                  Equipa items desde la tienda para personalizar tu look
                </div>
              </div>
            </GlassCard>

            <div style={styles.sectionTitle}>Items equipados</div>

            {avatar?.equippedItems?.length === 0 ? (
              <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 14, textAlign: 'center', padding: 20 }}>
                No tienes items equipados
              </div>
            ) : (
              avatar?.equippedItems?.map((e) => {
                const item = e.itemId;
                if (!item || !item.name) return null;
                return (
                  <div key={item._id} style={styles.equippedRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 24 }}>{item.imageEmoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: RARITY_COLORS[item.rarity] }}>
                          {CATEGORY_LABELS[item.category]} · {RARITY_LABELS[item.rarity]}
                        </div>
                      </div>
                    </div>
                    {!item.isDefault && (
                      <button
                        style={styles.unequipBtn}
                        disabled={actionLoading === item._id}
                        onClick={() => handleUnequip(item._id)}
                      >
                        {actionLoading === item._id ? '...' : 'Quitar'}
                      </button>
                    )}
                  </div>
                );
              })
            )}

            {avatar?.ownedItems?.length > 0 && (
              <>
                <div style={{ ...styles.sectionTitle, marginTop: 24 }}>Items en inventario</div>
                {avatar.ownedItems
                  .filter(item => item && item.name)
                  .filter(item => !avatar.equippedItems?.some(
                    e => (e.itemId?._id || e.itemId).toString() === item._id.toString()
                  ))
                  .map(item => (
                    <div key={item._id} style={styles.equippedRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 24 }}>{item.imageEmoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: RARITY_COLORS[item.rarity] }}>
                            {CATEGORY_LABELS[item.category]}
                          </div>
                        </div>
                      </div>
                      <button
                        style={{ ...styles.unequipBtn, borderColor: 'rgba(6,182,212,0.4)', background: 'rgba(6,182,212,0.1)', color: '#67e8f9' }}
                        disabled={actionLoading === item._id}
                        onClick={() => handleEquip(item._id)}
                      >
                        {actionLoading === item._id ? '...' : 'Equipar'}
                      </button>
                    </div>
                  ))
                }
              </>
            )}
          </>
        )}

        {/* SHOP TAB */}
        {activeTab === 'shop' && (
          <>
            {/* Category filter */}
            <div style={styles.filterRow}>
              <button style={styles.filterChip(filterCategory === 'all')} onClick={() => setFilterCategory('all')}>
                Todos
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  style={styles.filterChip(filterCategory === cat)}
                  onClick={() => setFilterCategory(cat)}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {shopLoading ? (
              <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 40 }}>
                Cargando tienda...
              </div>
            ) : (
              <div style={styles.shopGrid}>
                {filteredItems.map(item => {
                  const owned = isOwned(item._id);
                  const equipped = isEquipped(item._id);
                  const loading = actionLoading === item._id;

                  return (
                    <GlassCard key={item._id} padding={12} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 44, lineHeight: 1 }}>{item.imageEmoji}</div>
                      <div style={{ fontWeight: 700, fontSize: 13, textAlign: 'center' }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span style={styles.rarityBadge(item.rarity)}>{RARITY_LABELS[item.rarity]}</span>
                        <span style={{ fontSize: 11, color: 'rgba(10,10,20,0.5)' }}>
                          {CATEGORY_LABELS[item.category]}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>
                        {item.price === 0 ? 'Gratis' : `🪙 ${item.price}`}
                      </div>

                      {equipped ? (
                        <button style={styles.actionBtn('equipped')} disabled>
                          Equipado ✓
                        </button>
                      ) : owned ? (
                        <button
                          style={styles.actionBtn('equip')}
                          disabled={loading}
                          onClick={() => handleEquip(item._id)}
                        >
                          {loading ? '...' : 'Equipar'}
                        </button>
                      ) : (
                        <button
                          style={styles.actionBtn('buy')}
                          disabled={loading || tokenBalance < item.price}
                          onClick={() => handleBuy(item._id)}
                        >
                          {loading ? '...' : tokenBalance < item.price ? 'Sin tokens' : 'Comprar'}
                        </button>
                      )}
                    </GlassCard>
                  );
                })}

                {filteredItems.length === 0 && (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 40 }}>
                    No hay items en esta categoría
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>    </div>
  );
}

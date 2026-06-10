import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GlassCard, HoloText } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ── Virtual Card Component ────────────────────────────────────────────────────
function VirtualCardDisplay({ card, onFreeze }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!card) return null;

  const masked = card.cardNumber.split(' ').map((g, i) => i < 3 ? '••••' : g).join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 360, margin: '0 auto', marginBottom: 24 }}>
      {/* Card */}
      <div style={{
        background: card.frozen
          ? 'linear-gradient(135deg,#374151,#1f2937)'
          : 'linear-gradient(180deg,#2c2f32 0%,#1a1c1e 100%)',
        borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 20px 60px rgba(124,58,237,0.4)',
        position: 'relative', overflow: 'hidden', minHeight: 200,
      }}>
        {/* Background pattern */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.08 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px solid #fff', top: i * 20 - 60, right: i * 20 - 80 }} />
          ))}
        </div>

        {/* Frozen overlay */}
        {card.frozen && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 36, marginBottom: 4 }}>🔒</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>TARJETA CONGELADA</div>
            </div>
          </div>
        )}

        {/* Network & chip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, position: 'relative', zIndex: 1 }}>
          <div style={{ color: '#c9ced4', fontSize: 18, fontWeight: 900, letterSpacing: 2 }}>KRONOS</div>
          <div style={{ color: '#c9ced4', fontSize: 14, fontWeight: 700, opacity: 0.9 }}>{card.network}</div>
        </div>

        {/* Chip */}
        <div style={{ width: 44, height: 34, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', borderRadius: 6, marginBottom: 24, position: 'relative', zIndex: 1, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(0,0,0,0.2)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.2)' }} />
        </div>

        {/* Card number */}
        <div style={{ color: '#c9ced4', fontSize: 18, letterSpacing: 4, fontFamily: 'monospace', marginBottom: 20, position: 'relative', zIndex: 1 }}>
          {showDetails ? card.cardNumber : masked}
        </div>

        {/* Name, expiry, CVV */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ color: 'rgba(201,206,212,0.65)', fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>TITULAR</div>
            <div style={{ color: '#c9ced4', fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>{card.cardholderName}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(201,206,212,0.65)', fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>VÁLIDA HASTA</div>
            <div style={{ color: '#c9ced4', fontSize: 13, fontFamily: 'monospace' }}>{card.expiry}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'rgba(201,206,212,0.65)', fontSize: 9, letterSpacing: 1, marginBottom: 2 }}>CVV</div>
            <div style={{ color: '#c9ced4', fontSize: 13, fontFamily: 'monospace' }}>{showDetails ? card.cvv : '•••'}</div>
          </div>
        </div>
      </div>

      {/* Card actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <button onClick={() => setShowDetails(s => !s)}
          style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(79,172,254,0.07)', color: '#c9ced4', border: '1px solid rgba(190,200,212,0.15)', fontSize: 13, cursor: 'pointer' }}>
          {showDetails ? '🙈 Ocultar' : '👁️ Ver detalles'}
        </button>
        <button onClick={onFreeze}
          style={{ flex: 1, padding: '10px', borderRadius: 12, background: card.frozen ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: card.frozen ? '#10b981' : '#ef4444', border: `1px solid ${card.frozen ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, fontSize: 13, cursor: 'pointer' }}>
          {card.frozen ? '✅ Activar' : '🔒 Congelar'}
        </button>
      </div>
    </div>
  );
}

// ── Send Money Modal ──────────────────────────────────────────────────────────
function SendModal({ balance, onClose, onSuccess }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('search');

  useEffect(() => {
    if (!search.trim() || step !== 'search') { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await axios.get(`${API_URL}/search/users`, { params: { q: search, limit: 6 } });
        setResults(r.data.users || []);
      } catch { setResults([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [search, step]);

  const handleSend = async () => {
    if (!selected || !amount || Number(amount) <= 0) return;
    if (Number(amount) > balance) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/wallet/transfer`, {
        toUserId: selected._id,
        amount: Number(amount),
        description: note || undefined
      });
      onSuccess(res.data.message);
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [10, 25, 50, 100, 200];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <GlassCard style={{ width: '100%', maxWidth: 480, borderRadius: '20px 20px 0 0', paddingBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ color: '#c9ced4', fontSize: 17, fontWeight: 700 }}>Enviar dinero</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(201,206,212,0.50)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {step === 'search' && (
          <>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..."
              style={{ width: '100%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(190,200,212,0.15)', borderRadius: 12, padding: '10px 14px', color: '#c9ced4', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box', fontFamily: 'inherit' }} />
            {results.map(u => (
              <div key={u._id} onClick={() => { setSelected(u); setStep('amount'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', cursor: 'pointer', borderRadius: 10 }}>
                <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.username}&background=random&color=fff&size=40`} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <div style={{ color: '#c9ced4', fontWeight: 600, fontSize: 14 }}>{u.firstName} {u.lastName}</div>
                  <div style={{ color: 'rgba(201,206,212,0.50)', fontSize: 12 }}>@{u.username}</div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'rgba(201,206,212,0.35)', fontSize: 18 }}>→</span>
              </div>
            ))}
          </>
        )}

        {step === 'amount' && selected && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px', background: 'rgba(190,200,212,0.04)', borderRadius: 12 }}>
              <img src={selected.avatar || `https://ui-avatars.com/api/?name=${selected.username}&background=random&color=fff&size=40`} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} />
              <div>
                <div style={{ color: '#c9ced4', fontWeight: 600 }}>{selected.firstName} {selected.lastName}</div>
                <div style={{ color: 'rgba(201,206,212,0.50)', fontSize: 12 }}>@{selected.username}</div>
              </div>
              <button onClick={() => { setSelected(null); setStep('search'); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'rgba(201,206,212,0.50)', cursor: 'pointer', fontSize: 13 }}>Cambiar</button>
            </div>

            {/* Amount input */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span style={{ color: 'rgba(201,206,212,0.50)', fontSize: 28, fontWeight: 300 }}>$</span>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00" min="0" max={balance} step="0.01"
                  style={{ background: 'none', border: 'none', color: '#c9ced4', fontSize: 48, fontWeight: 700, width: 180, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ color: 'rgba(201,206,212,0.35)', fontSize: 12 }}>Disponible: ${balance.toFixed(2)}</div>
            </div>

            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, justifyContent: 'center' }}>
              {quickAmounts.filter(a => a <= balance).map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  style={{ padding: '6px 14px', borderRadius: 20, background: amount === String(a) ? 'linear-gradient(180deg,#2c2f32 0%,#1a1c1e 100%)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}>
                  ${a}
                </button>
              ))}
            </div>

            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Nota (opcional)"
              style={{ width: '100%', background: 'rgba(79,172,254,0.07)', border: '1px solid rgba(190,200,212,0.15)', borderRadius: 12, padding: '10px 14px', color: '#c9ced4', fontSize: 14, outline: 'none', marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit' }} />

            <button onClick={handleSend} disabled={loading || !amount || Number(amount) <= 0 || Number(amount) > balance}
              style={{ width: '100%', padding: '14px', borderRadius: 14, background: amount && Number(amount) > 0 && Number(amount) <= balance ? 'linear-gradient(180deg,#2c2f32 0%,#1a1c1e 100%)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {loading ? 'Enviando...' : `Enviar $${amount || '0'}`}
            </button>
          </>
        )}
      </GlassCard>
    </div>
  );
}

// ── Deposit Modal ─────────────────────────────────────────────────────────────
function DepositModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const presets = [50, 100, 200, 500];

  const handleDeposit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/wallet/deposit`, { amount: Number(amount) });
      onSuccess(res.data.message);
      onClose();
    } catch (e) {
      alert(e.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <GlassCard style={{ width: '100%', maxWidth: 480, borderRadius: '20px 20px 0 0', paddingBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ color: '#c9ced4', fontSize: 17, fontWeight: 700 }}>Recargar saldo</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(201,206,212,0.50)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ color: 'rgba(201,206,212,0.50)', fontSize: 28 }}>$</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="1" max="10000"
              style={{ background: 'none', border: 'none', color: '#c9ced4', fontSize: 48, fontWeight: 700, width: 180, textAlign: 'center', outline: 'none', fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
          {presets.map(p => (
            <button key={p} onClick={() => setAmount(String(p))}
              style={{ padding: '6px 14px', borderRadius: 20, background: amount === String(p) ? 'linear-gradient(180deg,#2c2f32 0%,#1a1c1e 100%)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}>
              ${p}
            </button>
          ))}
        </div>
        <div style={{ color: 'rgba(201,206,212,0.35)', fontSize: 11, textAlign: 'center', marginBottom: 16 }}>Demo: el dinero se añade sin cobro real</div>
        <button onClick={handleDeposit} disabled={loading || !amount || Number(amount) <= 0}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: amount && Number(amount) > 0 ? 'linear-gradient(180deg,#2c2f32 0%,#1a1c1e 100%)' : 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Recargando...' : `Recargar $${amount || '0'}`}
        </button>
      </GlassCard>
    </div>
  );
}

// ── Daily Reward Card ─────────────────────────────────────────────────────────
function DailyRewardCard({ onClaimed }) {
  const [reward, setReward] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/wallet/daily-reward`).then(r => setReward(r.data)).catch(() => {});
  }, []);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await axios.post(`${API_URL}/wallet/daily-reward`);
      setReward({ claimed: true, streakDays: res.data.streakDays, reward: res.data.reward });
      setClaimed(true);
      onClaimed();
      setTimeout(() => setClaimed(false), 3000);
    } catch (e) {
      const msg = e.response?.data?.message;
      if (msg) setReward(r => ({ ...r, message: msg }));
    } finally {
      setClaiming(false);
    }
  };

  if (!reward) return null;

  const streakDays = reward.streakDays || 0;
  const amount = reward.reward || Math.min(10 + streakDays * 2, 50);
  const canClaim = !reward.claimed;

  return (
    <GlassCard style={{ marginBottom: 16, background: canClaim ? 'linear-gradient(135deg,rgba(168,85,247,0.18),rgba(6,182,212,0.1))' : 'rgba(255,255,255,0.04)', border: canClaim ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>{canClaim ? '🎁' : '✅'}</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#c9ced4', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
            {canClaim ? `Recompensa diaria — +${amount} KRO` : 'Recompensa reclamada'}
          </div>
          <div style={{ color: 'rgba(201,206,212,0.50)', fontSize: 12 }}>
            {streakDays > 0 ? `🔥 Racha de ${streakDays} día${streakDays !== 1 ? 's' : ''}` : 'Primer día — ¡comienza tu racha!'}
          </div>
          {/* Streak dots */}
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < (streakDays % 7) ? 'linear-gradient(135deg,#a855f7,#06b6d4)' : 'rgba(255,255,255,0.12)' }} />
            ))}
          </div>
        </div>
        <button
          onClick={handleClaim}
          disabled={!canClaim || claiming}
          style={{ padding: '10px 18px', borderRadius: 28, fontWeight: 700, fontSize: 13, border: 'none', cursor: canClaim ? 'pointer' : 'default', background: canClaim ? 'linear-gradient(135deg,#a855f7,#06b6d4)' : 'rgba(255,255,255,0.06)', color: '#fff', opacity: canClaim ? 1 : 0.5, transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
          {claimed ? '¡Listo! 🎉' : claiming ? '...' : canClaim ? 'Reclamar' : 'Mañana'}
        </button>
      </div>
    </GlassCard>
  );
}

// ── Main Wallet Page ──────────────────────────────────────────────────────────
export default function Wallet() {
  const [data, setData] = useState(null);
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('wallet');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');

  const fetchWallet = async () => {
    try {
      const [walletRes, cardRes] = await Promise.all([
        axios.get(`${API_URL}/wallet`),
        axios.get(`${API_URL}/wallet/card`)
      ]);
      setData(walletRes.data);
      setCard(cardRes.data.data);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWallet(); }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleFreeze = async () => {
    try {
      const res = await axios.post(`${API_URL}/wallet/card/freeze`);
      setCard(c => ({ ...c, frozen: res.data.frozen }));
      showToast(res.data.message);
    } catch { }
  };

  const txIcon = { deposit: '⬇️', withdrawal: '⬆️', transfer_in: '📥', transfer_out: '📤', payment: '🛍️', refund: '↩️' };
  const txColor = { deposit: '#10b981', withdrawal: '#ef4444', transfer_in: '#10b981', transfer_out: '#ef4444', payment: '#f59e0b', refund: '#06b6d4' };

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', paddingBottom: 100 }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(180deg,#2c2f32 0%,#1a1c1e 100%)', color: '#15171a', padding: '10px 24px', borderRadius: 28, fontSize: 14, fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>
        <HoloText size={26} style={{ marginBottom: 20 }}>Wallet</HoloText>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(201,206,212,0.50)', padding: 60 }}>Cargando wallet...</div>
        ) : (
          <>
            {/* Balance principal */}
            <GlassCard style={{ textAlign: 'center', marginBottom: 20, padding: '32px 24px', background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.08))' }}>
              <div style={{ color: 'rgba(201,206,212,0.50)', fontSize: 13, marginBottom: 6, letterSpacing: 1 }}>SALDO DISPONIBLE</div>
              <div style={{ color: '#c9ced4', fontSize: 52, fontWeight: 900, letterSpacing: -2, marginBottom: 4 }}>
                ${(data?.cash?.balance || 0).toFixed(2)}
              </div>
              <div style={{ color: 'rgba(201,206,212,0.35)', fontSize: 12 }}>{data?.cash?.currency || 'USD'}</div>

              {data?.kro && (
                <div style={{ marginTop: 16, padding: '10px 20px', background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: 12, display: 'inline-block' }}>
                  <span style={{ color: '#a78bfa', fontSize: 14, fontWeight: 700, textShadow: '0 0 12px rgba(139,92,246,0.35)' }}>
                    {parseFloat(data.kro.tokenBalance || 0).toFixed(0)} KRO
                  </span>
                  <span style={{ color: 'rgba(201,206,212,0.35)', fontSize: 12 }}> tokens</span>
                </div>
              )}
            </GlassCard>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
              {[
                { icon: '📤', label: 'Enviar', action: () => setModal('send'), color: '#c9ced4' },
                { icon: '📥', label: 'Recargar', action: () => setModal('deposit'), color: '#10b981' },
                { icon: '💳', label: 'Mi Tarjeta', action: () => setTab('card'), color: '#f59e0b' },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action}
                  style={{ padding: '16px 8px', borderRadius: 16, background: `${btn.color}18`, border: `1px solid ${btn.color}30`, color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 24 }}>{btn.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{btn.label}</span>
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[{ id: 'wallet', label: '📊 Actividad' }, { id: 'card', label: '💳 Tarjeta' }, { id: 'kro', label: '⭐ KRO' }].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ flex: 1, padding: '9px', borderRadius: 12, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === t.id ? 'linear-gradient(180deg,#2c2f32 0%,#1a1c1e 100%)' : 'rgba(255,255,255,0.06)', color: '#fff' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ACTIVITY TAB */}
            {tab === 'wallet' && (
              <div>
                <div style={{ color: 'rgba(201,206,212,0.50)', fontSize: 11, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Movimientos recientes</div>
                {!data?.cash?.transactions?.length ? (
                  <div style={{ textAlign: 'center', color: 'rgba(201,206,212,0.35)', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>💸</div>
                    <div>Sin movimientos aún</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Recarga tu saldo para empezar</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {data.cash.transactions.map((tx, i) => (
                      <GlassCard key={tx._id || i} style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${txColor[tx.type]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                            {txIcon[tx.type] || '💰'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#c9ced4', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tx.description || tx.type}
                            </div>
                            <div style={{ color: 'rgba(201,206,212,0.35)', fontSize: 11 }}>
                              {new Date(tx.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ color: txColor[tx.type], fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                            {['transfer_in', 'deposit', 'refund'].includes(tx.type) ? '+' : '-'}${tx.amount.toFixed(2)}
                          </div>
                        </div>
                      </GlassCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CARD TAB */}
            {tab === 'card' && (
              <div>
                <VirtualCardDisplay card={card} onFreeze={handleFreeze} />
                <GlassCard>
                  <div style={{ color: 'rgba(201,206,212,0.50)', fontSize: 12, marginBottom: 12 }}>Detalles de la tarjeta</div>
                  {[
                    { label: 'Red', value: card?.network || 'VISA' },
                    { label: 'Estado', value: card?.frozen ? '🔒 Congelada' : '✅ Activa' },
                    { label: 'Límite de gasto', value: `$${card?.spendingLimit || 500}` },
                    { label: 'Total gastado', value: `$${(card?.totalSpent || 0).toFixed(2)}` },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: 'rgba(201,206,212,0.50)', fontSize: 13 }}>{item.label}</span>
                      <span style={{ color: '#c9ced4', fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}

            {/* KRO TAB */}
            {tab === 'kro' && (
              <div>
                {data?.kro ? (
                  <>
                    {/* Daily Reward Card */}
                    <DailyRewardCard onClaimed={fetchWallet} />

                    <GlassCard style={{ marginBottom: 12 }}>
                      {[
                        { label: '⭐ Balance KRO', value: `${parseFloat(data.kro.tokenBalance || 0).toFixed(2)} KRO` },
                        { label: '🔒 En staking', value: `${parseFloat(data.kro.stakedTokens || 0).toFixed(2)} KRO` },
                        { label: '🎁 Recompensas pendientes', value: `${parseFloat(data.kro.pendingRewards || 0).toFixed(4)} KRO` },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ color: 'rgba(201,206,212,0.50)', fontSize: 14 }}>{item.label}</span>
                          <span style={{ color: '#a78bfa', fontSize: 14, fontWeight: 700, textShadow: '0 0 12px rgba(139,92,246,0.35)' }}>{item.value}</span>
                        </div>
                      ))}
                    </GlassCard>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <a href="/tokens" style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'linear-gradient(135deg,#a78bfa 0%,#8b5cf6 45%,#6d4bd0 100%)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxShadow: '0 12px 30px -10px rgba(139,92,246,0.45)' }}>
                        ⭐ Gestionar KRO
                      </a>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: 'rgba(201,206,212,0.35)', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>⭐</div>
                    <div>Wallet KRO no inicializada</div>
                    <button onClick={async () => { await axios.post(`${API_URL}/tokens/wallet/init`); fetchWallet(); }}
                      style={{ marginTop: 16, padding: '10px 24px', borderRadius: 20, background: 'linear-gradient(135deg,#a78bfa 0%,#8b5cf6 45%,#6d4bd0 100%)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 12px 30px -10px rgba(139,92,246,0.45)' }}>
                      Inicializar KRO Wallet
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {modal === 'send' && <SendModal balance={data?.cash?.balance || 0} onClose={() => setModal(null)} onSuccess={msg => { showToast(msg); fetchWallet(); }} />}
      {modal === 'deposit' && <DepositModal onClose={() => setModal(null)} onSuccess={msg => { showToast(msg); fetchWallet(); }} />}
    </div>
  );
}

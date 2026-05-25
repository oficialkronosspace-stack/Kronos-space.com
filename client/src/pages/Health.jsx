import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { GlassCard, HoloText } from '../components/kronos';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MOODS = [
  { value: 'great',   emoji: '😄', label: 'Genial' },
  { value: 'good',    emoji: '🙂', label: 'Bien' },
  { value: 'okay',    emoji: '😐', label: 'Regular' },
  { value: 'bad',     emoji: '😕', label: 'Mal' },
  { value: 'terrible',emoji: '😢', label: 'Terrible' },
];

function formatDateHeader() {
  return new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = '#7c3aed' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ width: '100%', height: 6, background: 'rgba(79,172,254,0.07)', borderRadius: 6, overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: pct >= 100 ? 'linear-gradient(90deg,#10b981,#06b6d4)' : `linear-gradient(90deg,${color},#06b6d4)`,
        borderRadius: 6,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ emoji, label, value, onChange, goal, unit, color, min = 0, max = 99999 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  // Sync draft when value changes externally (e.g. on load)
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = Math.max(min, Math.min(max, parseInt(draft) || 0));
    onChange(n);
    setDraft(String(n));
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
  };

  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : null;

  return (
    <GlassCard
      style={{ cursor: 'pointer', transition: 'transform 0.15s', padding: '18px 16px' }}
      onClick={() => { if (!editing) { setEditing(true); setDraft(String(value)); } }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {emoji}
        </div>
        <div>
          <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 11, letterSpacing: 0.5 }}>{label.toUpperCase()}</div>
          {editing ? (
            <input
              autoFocus
              type="number"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKey}
              min={min}
              max={max}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${color}`,
                color: '#fff',
                fontSize: 24,
                fontWeight: 800,
                width: 100,
                outline: 'none',
                fontFamily: 'inherit',
                padding: '2px 0',
              }}
            />
          ) : (
            <div style={{ color: '#0a0a14', fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>
              {value.toLocaleString()}
              <span style={{ color: 'rgba(10,10,20,0.35)', fontSize: 12, fontWeight: 400, marginLeft: 4 }}>{unit}</span>
            </div>
          )}
        </div>
      </div>

      {goal && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ color: 'rgba(10,10,20,0.35)', fontSize: 11 }}>Meta: {goal.toLocaleString()} {unit}</span>
            <span style={{ color: pct >= 100 ? '#10b981' : color, fontSize: 11, fontWeight: 700 }}>{pct}%</span>
          </div>
          <ProgressBar value={value} max={goal} color={color} />
        </>
      )}
    </GlassCard>
  );
}

// ── Weekly Bar Chart ──────────────────────────────────────────────────────────
function WeeklyChart({ history }) {
  if (!history || history.length === 0) return null;

  const maxSteps = Math.max(...history.map(d => d.steps || 0), 1);
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <GlassCard style={{ marginBottom: 16 }}>
      <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
        📈 Pasos — Últimos 7 días
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
        {history.slice(-7).map((entry, i) => {
          const pct = maxSteps > 0 ? (entry.steps || 0) / maxSteps : 0;
          const height = Math.max(4, Math.round(pct * 72));
          const reached = (entry.steps || 0) >= 10000;
          const dateObj = new Date(entry.date);
          const dayLabel = days[dateObj.getDay()];
          const isToday = i === history.slice(-7).length - 1;

          return (
            <div key={entry._id || i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: '100%',
                height,
                borderRadius: '4px 4px 0 0',
                background: reached
                  ? 'linear-gradient(180deg,#10b981,#06b6d4)'
                  : isToday
                    ? 'linear-gradient(180deg,#7c3aed,#a855f7)'
                    : 'rgba(255,255,255,0.12)',
                transition: 'height 0.3s ease',
                position: 'relative',
              }}>
                {reached && (
                  <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 10 }}>⭐</div>
                )}
              </div>
              <div style={{ color: isToday ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: isToday ? 700 : 400 }}>
                {dayLabel}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 10, marginTop: 10, textAlign: 'right' }}>
        ⭐ = meta 10,000 alcanzada
      </div>
    </GlassCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Health() {
  const [log, setLog] = useState({ steps: 0, calories: 0, waterGlasses: 0, workoutMinutes: 0, mood: 'okay', notes: '' });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'info' });
  const [tokensEarned, setTokensEarned] = useState(0);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'info' }), 3500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        axios.get(`${API_URL}/health/today`),
        axios.get(`${API_URL}/health/history?days=7`),
      ]);
      const d = todayRes.data.data;
      setLog({
        steps: d.steps || 0,
        calories: d.calories || 0,
        waterGlasses: d.waterGlasses || 0,
        workoutMinutes: d.workoutMinutes || 0,
        mood: d.mood || 'okay',
        notes: d.notes || '',
        tokensEarned: d.tokensEarned || 0,
      });
      setTokensEarned(d.tokensEarned || 0);
      setHistory(histRes.data.data || []);
    } catch (err) {
      // silenced
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const setMetric = (key, val) => setLog(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.post(`${API_URL}/health/log`, {
        steps: log.steps,
        calories: log.calories,
        waterGlasses: log.waterGlasses,
        workoutMinutes: log.workoutMinutes,
        mood: log.mood,
        notes: log.notes,
      });
      const awarded = res.data.tokensAwarded || 0;
      if (awarded > 0) {
        setTokensEarned(10);
        showToast(`+${awarded} tokens ganados por tu meta de pasos`, 'success');
      } else {
        showToast('Registro guardado correctamente', 'success');
      }
      // refresh history
      const histRes = await axios.get(`${API_URL}/health/history?days=7`);
      setHistory(histRes.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toastColors = {
    success: { bg: 'linear-gradient(135deg,#10b981,#06b6d4)', shadow: 'rgba(16,185,129,0.4)' },
    error:   { bg: 'linear-gradient(135deg,#ef4444,#f97316)', shadow: 'rgba(239,68,68,0.4)' },
    info:    { bg: 'linear-gradient(135deg,#7c3aed,#06b6d4)', shadow: 'rgba(124,58,237,0.4)' },
  };
  const tc = toastColors[toast.type] || toastColors.info;

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', paddingBottom: 100 }}>
      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          background: tc.bg, color: '#fff',
          padding: '10px 24px', borderRadius: 28,
          fontSize: 14, fontWeight: 600, zIndex: 9999,
          boxShadow: `0 8px 32px ${tc.shadow}`,
          whiteSpace: 'nowrap', maxWidth: '90vw', textAlign: 'center',
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px' }}>
        {/* Header */}
        <HoloText size={26} style={{ marginBottom: 4 }}>Health & Fitness</HoloText>
        <div style={{ color: 'rgba(10,10,20,0.35)', fontSize: 13, marginBottom: 20, textTransform: 'capitalize' }}>
          {formatDateHeader()}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(10,10,20,0.35)', padding: 60 }}>
            Cargando tu registro de salud...
          </div>
        ) : (
          <>
            {/* Token reward banner */}
            {(tokensEarned > 0 || log.steps >= 10000) && (
              <div style={{
                background: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,182,212,0.15))',
                border: '1px solid rgba(16,185,129,0.4)',
                borderRadius: 16, padding: '14px 18px',
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 28 }}>🏆</span>
                <div>
                  <div style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>
                    +10 tokens ganados hoy
                  </div>
                  <div style={{ color: 'rgba(10,10,20,0.5)', fontSize: 12 }}>
                    Meta de 10,000 pasos alcanzada
                  </div>
                </div>
              </div>
            )}

            {/* Metrics grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <MetricCard
                emoji="👟"
                label="Pasos"
                value={log.steps}
                onChange={v => setMetric('steps', v)}
                goal={10000}
                unit="pasos"
                color="#7c3aed"
                min={0}
                max={100000}
              />
              <MetricCard
                emoji="🔥"
                label="Calorías"
                value={log.calories}
                onChange={v => setMetric('calories', v)}
                unit="kcal"
                color="#f59e0b"
                min={0}
                max={10000}
              />
              <MetricCard
                emoji="💧"
                label="Agua"
                value={log.waterGlasses}
                onChange={v => setMetric('waterGlasses', v)}
                goal={8}
                unit="vasos"
                color="#06b6d4"
                min={0}
                max={30}
              />
              <MetricCard
                emoji="⏱️"
                label="Ejercicio"
                value={log.workoutMinutes}
                onChange={v => setMetric('workoutMinutes', v)}
                unit="min"
                color="#10b981"
                min={0}
                max={1440}
              />
            </div>

            {/* Mood selector */}
            <GlassCard style={{ marginBottom: 16 }}>
              <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                ¿Cómo te sientes hoy?
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                {MOODS.map(m => {
                  const active = log.mood === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => setMetric('mood', m.value)}
                      style={{
                        flex: 1,
                        padding: '10px 4px',
                        borderRadius: 14,
                        background: active ? 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(6,182,212,0.25))' : 'rgba(255,255,255,0.05)',
                        border: active ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.07)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transform: active ? 'scale(1.06)' : 'scale(1)',
                      }}>
                      <span style={{ fontSize: 22 }}>{m.emoji}</span>
                      <span style={{ color: active ? '#0a0a14' : 'rgba(10,10,20,0.5)', fontSize: 10, fontWeight: active ? 700 : 400 }}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </GlassCard>

            {/* Notes */}
            <GlassCard style={{ marginBottom: 16 }}>
              <div style={{ color: '#0a0a14', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
                📝 Notas del día
              </div>
              <textarea
                value={log.notes}
                onChange={e => setMetric('notes', e.target.value)}
                placeholder="Cómo fue tu entrenamiento, cómo te sentiste..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(79,172,254,0.04)',
                  border: '1px solid rgba(79,172,254,0.15)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  color: '#0a0a14',
                  fontSize: 13,
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                }}
              />
            </GlassCard>

            {/* Weekly chart */}
            <WeeklyChart history={history} />

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: 16,
                background: saving ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                color: '#fff',
                border: 'none',
                fontSize: 16,
                fontWeight: 700,
                cursor: saving ? 'default' : 'pointer',
                boxShadow: saving ? 'none' : '0 6px 24px rgba(124,58,237,0.35)',
                transition: 'all 0.2s',
              }}>
              {saving ? 'Guardando...' : '💾 Guardar registro'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

# ScriptDrop ⚡

Generador de scripts virales para TikTok y Reels con IA.

## Stack
- React + Vite + Tailwind CSS
- Supabase (auth + base de datos)
- Anthropic API (generación con IA)
- Vercel (deploy)

## Setup local

1. Clona el repo:
```bash
git clone https://github.com/donovan-hue/scriptdrop.git
cd scriptdrop
npm install
```

2. Crea `.env.local` en la raíz:
```
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

3. Corre la app:
```bash
npm run dev
```

4. Abre `http://localhost:5173`

## Fases completadas
- [x] Fase 1 — Definición
- [x] Fase 2 — Setup técnico + estructura
- [x] Fase 3 — Auth + Supabase
- [x] Fase 4 — Generador de scripts con IA
- [ ] Fase 5 — Pagos con Stripe
- [ ] Fase 6 — UI/UX final
- [ ] Fase 7 — Deploy a Vercel

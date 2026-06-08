# ✅ Checklist de variables de entorno — KRONOS en producción

Qué valor va en cada dashboard. Marca cada casilla cuando lo pegues.

> **Regla de oro:** los secretos NUNCA van en Git. `render.yaml` ya declara los
> nombres con `sync: false`; tú solo pegas el **valor** en el dashboard.
>
> **Orden recomendado:** primero despliega ambos servicios (aunque fallen), copia
> sus URLs reales, y luego rellena `CLIENT_URL`, `SERVER_URL`, `REACT_APP_API_URL`
> y `REACT_APP_SOCKET_URL` (se necesitan mutuamente).

---

## 🟦 RENDER — Backend (servicio `kronos-api` → pestaña *Environment*)

### Críticas (sin esto NO arranca o falla algo central)
- [ ] `MONGODB_URI` — connection string de MongoDB Atlas (incluye user:pass y `/kronos`)
- [ ] `JWT_SECRET` — texto aleatorio largo (genera: `openssl rand -base64 48`)
- [ ] `CLIENT_URL` — tu URL de Vercel con `https://` y **sin** barra final
- [ ] `SERVER_URL` — la URL pública de este servicio en Render (`https://kronos-api-...onrender.com`)

### Pagos / Suscripciones (necesarias si cobras)
- [ ] `STRIPE_SECRET_KEY` — `sk_live_...` (o `sk_test_...` para pruebas)
- [ ] `STRIPE_WEBHOOK_SECRET` — `whsec_...` (del endpoint de webhook en Stripe)
- [ ] `STRIPE_SOCIAL_PREMIUM_PRICE_ID` — `price_...`
- [ ] `STRIPE_SCRIPTS_ESTANDAR_PRICE_ID` — `price_...`
- [ ] `STRIPE_SCRIPTS_PREMIUM_PRICE_ID` — `price_...`
- [ ] `STRIPE_SCRIPTS_PRO_PRICE_ID` — `price_...`
- [ ] `STRIPE_MEDIA_ESTANDAR_PRICE_ID` — `price_...`
- [ ] `STRIPE_MEDIA_PREMIUM_PRICE_ID` — `price_...`
- [ ] `STRIPE_MEDIA_PRO_PRICE_ID` — `price_...`
- [ ] `STRIPE_PLUS_PRICE_ID` / `STRIPE_PRO_PRICE_ID` / `STRIPE_BUSINESS_PRICE_ID` — solo si usas el modelo legacy de 3 tiers

### Multimedia (Cloudinary) — necesaria para subir fotos/videos
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

### Email (Nodemailer / Gmail) — para registro, recuperar contraseña, etc.
- [ ] `EMAIL_USER` — tu correo de Gmail
- [ ] `EMAIL_PASSWORD` — **App Password** de Gmail (16 letras, sin espacios)
- [ ] `EMAIL_FROM` — ej. `KRONOS <no-reply@tudominio.com>`
- ℹ️ `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE` ya tienen valor fijo en `render.yaml`.

### Opcionales (la app funciona sin ellas; la feature queda desactivada)
- [ ] `SEED_SECRET` — para el endpoint admin de siembra de datos
- [ ] `REDIS_URL` — sin esto el cache usa memoria (no persistente)
- [ ] `OPENAI_API_KEY` — IA generativa (scripts, etc.)
- [ ] `DEEPL_API_KEY` — traducción
- [ ] `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` — push (genera: `npx web-push generate-vapid-keys`)
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — login con Google
- [ ] `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` — login con Facebook
- [ ] `INFURA_API_KEY` / `SEPOLIA_RPC_URL` / `PRIVATE_KEY` / `KRONOS_TOKEN_ADDRESS` — token KRO / Web3

---

## ⬛ VERCEL — Frontend (Project → Settings → *Environment Variables*)

> Todas llevan prefijo `REACT_APP_`. Apuntan al backend de Render.

- [ ] `REACT_APP_API_URL` — URL de Render **terminada en `/api`** (ej. `https://kronos-api-...onrender.com/api`)
- [ ] `REACT_APP_SOCKET_URL` — la misma URL de Render **SIN** `/api`
- [ ] `REACT_APP_STRIPE_PUBLIC_KEY` — `pk_live_...` (o `pk_test_...`)
- [ ] `REACT_APP_CLOUDINARY_CLOUD_NAME` — mismo cloud name que en el backend
- [ ] `REACT_APP_CLOUDINARY_UPLOAD_PRESET` — preset *unsigned* creado en Cloudinary

---

## 🔎 Verificación final
1. Render: el log de arranque debe mostrar `[ENV] MONGODB_URI: OK` y `✓ MongoDB Connected`.
2. Abre `https://<tu-backend>.onrender.com/api/health` → debe responder `{"status":"ok","db":"connected"}`.
3. En Stripe, el webhook debe apuntar a `https://<tu-backend>.onrender.com/api/checkout/webhook` (o la ruta de subscription).
4. Vuelve a correr la auditoría: `node agents/kairos.js --report`.

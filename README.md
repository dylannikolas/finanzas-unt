# FinanzasUNT 💸

App móvil (PWA) para control de finanzas universitarias.

## Stack
- **React + Vite** — UI
- **Tailwind CSS** — Estilos
- **Supabase** — Base de datos PostgreSQL + Auth
- **Recharts** — Gráficos
- **Zustand** — Estado global
- **vite-plugin-pwa** — Instalable en celular
- **xlsx** — Exportación a Excel

---

## 🚀 Setup paso a paso

### 1. Clonar e instalar dependencias
```bash
git clone <tu-repo>
cd finanzas-unt
npm install
```

### 2. Crear proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com) → New Project
2. Copia tu **Project URL** y **anon public key**
3. En **SQL Editor**, ejecuta todo el contenido de `supabase/schema.sql`

### 3. Configurar variables de entorno
```bash
cp .env.example .env.local
```
Edita `.env.local` con tus credenciales:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

### 4. Activar Google Auth (opcional)
En Supabase: **Authentication → Providers → Google** → activar y pegar credenciales de Google Cloud Console.

### 5. Correr en desarrollo
```bash
npm run dev
```
Abre `http://localhost:5173`

### 6. Build y deploy en Vercel
```bash
npm run build
```
O conecta el repo a Vercel y configura las env vars ahí.

---

## 📱 Instalar en el celular
1. Abre la URL de tu app en **Chrome para Android**
2. Toca los tres puntos → **Agregar a pantalla de inicio**
3. Listo — ya tienes el ícono en tu celular

---

## 🗄️ Estructura del proyecto
```
src/
├── components/
│   ├── layout/BottomNav.jsx
│   └── ui/index.js
├── hooks/useAuth.js
├── lib/
│   ├── supabase.js
│   └── exportar.js
├── screens/
│   ├── Login.jsx
│   ├── Home.jsx
│   ├── Registro.jsx
│   ├── NuevaOperacion.jsx
│   ├── Deudas.jsx
│   └── Analisis.jsx
├── store/useStore.js
├── App.jsx
└── main.jsx
supabase/
└── schema.sql      ← Ejecutar en Supabase SQL Editor
```

---

## 🔐 Seguridad implementada
- **Row Level Security (RLS)** en todas las tablas — cada usuario solo ve sus datos
- **Supabase Auth** — login con email/contraseña o Google
- **Variables de entorno** — credenciales fuera del código
- **Soft delete** — las transacciones eliminadas se marcan, no se borran
- **HTTPS automático** en Vercel

---

## ✨ Features
| Feature | Estado |
|---|---|
| Registro de ingresos y egresos | ✅ |
| Saldo por método de pago (Efectivo, YAPE, Tarjeta) | ✅ |
| Módulo de préstamos con abonos parciales | ✅ |
| Historial filtrable y buscable | ✅ |
| Dashboard con gráficos (pie, barras, línea) | ✅ |
| Análisis automático con insights | ✅ |
| Indicador de salud financiera | ✅ |
| Exportar CSV y Excel | ✅ |
| Transacciones recurrentes | ✅ |
| PWA instalable en Android | ✅ |
| Autenticación con Google | ✅ |
| Soft delete | ✅ |

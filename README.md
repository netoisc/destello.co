# ✦ Destello ✦

**Invitaciones que brillan y desaparecen.**

Una aplicación web cósmica para crear invitaciones a eventos que se autodestruyen después de 24 horas.

## 🚀 Deploy en 60 segundos

### 1. Setup de Supabase (2 minutos)

**Opción A: Usando Supabase CLI (Recomendado)**

1. Instala Supabase CLI si no lo tienes:
   ```bash
   npm install -g supabase
   ```

2. Inicia sesión en Supabase:
   ```bash
   supabase login
   ```

3. Link tu proyecto:
   ```bash
   supabase link --project-ref tu-project-ref
   ```

4. Aplica las migraciones:
   ```bash
   supabase db push
   ```

5. Configura Storage (ver `SUPABASE_CLI.md` para más detalles)

**Opción B: Sin CLI (Dashboard)**

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo
2. En el SQL Editor, copia y ejecuta el contenido de `supabase/migrations/20240101000000_initial_schema.sql`
3. Crea un bucket de Storage llamado `audio` (público)
4. Ve a Settings > API y copia:
   - Project URL
   - `anon` `public` key

**📖 Para más detalles:**
- Con CLI: `SUPABASE_CLI.md`
- Sin CLI: `SUPABASE_SETUP.md`

### 2. Configuración del proyecto (20 segundos)

1. Clona o descarga este proyecto
2. Instala dependencias:
   ```bash
   npm install
   ```
3. Crea `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
4. Edita `.env.local` y agrega tus credenciales de Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```

### 3. Deploy a Vercel (10 segundos)

1. Instala Vercel CLI si no lo tienes:
   ```bash
   npm i -g vercel
   ```
2. Deploy:
   ```bash
   vercel
   ```
3. Cuando te pregunte por variables de entorno, agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Listo! ✨ Tu app está viva en Vercel (100% gratis)

## 🎨 Características

- **Creador de eventos**: Slider de 4 pasos con diseño mobile-first
- **Invitaciones cósmicas**: Pantallas de entrada animadas con destellos
- **Sistema de códigos**: Mercurio (co-anfitriones) y Venus (invitados)
- **Ruleta 3D**: Efecto Big Bang con countdown para "ME APUNTO"
- **Visualización 3D**: Esfera interactiva del sistema solar en tiempo real
- **Auto-destrucción**: Los eventos se borran automáticamente 24h después

## 📁 Estructura del proyecto

```
destello/
├── app/
│   ├── create/              # Página de creación de eventos
│   ├── e/[eventId]/         # Rutas de invitaciones
│   │   ├── mercurio/        # Co-anfitriones (sin código)
│   │   ├── venus/           # Invitados normales
│   │   ├── venus/[codigo6]/ # Invitados con código Mercurio
│   │   └── sphere/          # Visualización 3D
│   ├── api/cleanup/         # Endpoint para limpieza automática
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── cosmic-entry.tsx     # Pantalla de entrada cósmica
│   └── roulette.tsx         # Ruleta 3D con Big Bang
├── lib/
│   ├── supabase.ts          # Cliente de Supabase
│   └── utils.ts             # Utilidades
├── supabase-schema.sql      # Schema de la base de datos
└── vercel.json              # Configuración de cron jobs
```

## 🎯 Rutas

- `/` - Página de inicio
- `/create` - Creador de eventos (4 pasos)
- `/e/[eventId]/mercurio` - Invitación para co-anfitriones
- `/e/[eventId]/venus` - Invitación para invitados normales
- `/e/[eventId]/venus/[codigo6]` - Invitación con código
- `/e/[eventId]/sphere` - Visualización 3D del sistema solar

## 🛠️ Stack Tecnológico

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Framer Motion** (animaciones)
- **Three.js** + **@react-three/fiber** (visualización 3D)
- **Supabase** (PostgreSQL + Storage)
- **Vercel** (hosting gratuito)

## 🔧 Desarrollo local

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

## 🗄️ Base de datos

El schema incluye:
- `events` - Información de eventos
- `invitations` - Invitaciones (Mercurio/Venus)
- `responses` - Respuestas de invitados

Los eventos expiran automáticamente 24 horas después de su fecha. Un cron job en Vercel limpia eventos expirados cada 6 horas.

## 📱 Mobile-First

La aplicación está optimizada para móviles:
- Scroll vertical con snap en móvil
- Scroll horizontal en desktop
- Animaciones fluidas
- Diseño responsivo

## 🌌 Estética Cósmica

- Fondo negro profundo con partículas
- Tipografía Satoshi/Inter
- Efectos de brillo y destellos
- Colores cálidos (Sol tenue, Mercurio brillante, Venus en órbita)

## 📄 Licencia

MIT

---

**Creado con ✦ por un diseñador full-stack cósmico**


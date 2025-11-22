# 🔧 Configurar .env.local para Local vs Remoto

## Para usar Base de Datos LOCAL (Docker)

### Paso 1: Iniciar Supabase local

```bash
supabase start
```

### Paso 2: Copiar credenciales

Después de ejecutar `supabase start`, verás algo como esto en la terminal:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

### Paso 3: Crear .env.local

Crea un archivo `.env.local` en la raíz del proyecto con:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copia el anon key de arriba>
```

**Ejemplo completo:**

```bash
# .env.local para desarrollo local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### Paso 4: Aplicar migraciones localmente

```bash
supabase db reset
```

Esto aplicará todas las migraciones de `supabase/migrations/` a tu base local.

### Paso 5: Reiniciar tu app

```bash
npm run dev
```

## Para usar Base de Datos REMOTA (Supabase Cloud)

### Paso 1: Obtener credenciales remotas

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public** key

### Paso 2: Crear .env.local

```bash
# .env.local para producción/remoto
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_remoto_aqui
```

### Paso 3: Aplicar migraciones al remoto

```bash
supabase link --project-ref tu-project-ref
supabase db push
```

## Cambiar entre Local y Remoto

Simplemente edita `.env.local` y cambia las credenciales:

**Para LOCAL:**
```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key de supabase start>
```

**Para REMOTO:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu anon key remoto>
```

Luego reinicia tu servidor:
```bash
npm run dev
```

## Verificar qué estás usando

Puedes verificar en la consola del navegador:
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

- Si muestra `http://127.0.0.1:54321` → Estás usando LOCAL
- Si muestra `https://...supabase.co` → Estás usando REMOTO

## Nota Importante

- **`.env.local`** está en `.gitignore` (no se sube a git)
- Cada desarrollador puede tener su propio `.env.local`
- Para producción (Vercel), configura las variables de entorno en el dashboard de Vercel


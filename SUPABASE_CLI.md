# 🚀 Guía de Setup con Supabase CLI

Esta guía te ayudará a configurar tu base de datos usando Supabase CLI, que permite trabajar con migraciones versionadas y sincronizar tu base de datos local y remota.

## 📋 Requisitos Previos

1. **Supabase CLI instalado**: Si no lo tienes, instálalo:
   ```bash
   npm install -g supabase
   # o
   brew install supabase/tap/supabase
   ```

2. **Iniciar sesión en Supabase**:
   ```bash
   supabase login
   ```

## 🏗️ Estructura del Proyecto

El proyecto sigue la convención de Supabase CLI:

```
supabase/
├── migrations/
│   └── 20240101000000_initial_schema.sql  # Migración inicial
├── seed.sql                                # Datos de prueba (opcional)
└── config.toml                             # Configuración de Supabase
```

## 🚀 Setup Inicial

### 1. Link tu proyecto remoto (si ya tienes uno en Supabase)

```bash
supabase link --project-ref tu-project-ref
```

Obtén tu `project-ref` desde la URL de tu proyecto Supabase: `https://supabase.com/dashboard/project/[project-ref]`

### 2. Inicializar Supabase localmente (opcional)

Si quieres trabajar localmente:

```bash
supabase start
```

**⚠️ IMPORTANTE:** `supabase start` crea una **base de datos completamente local** usando Docker. **NO usa tu proyecto remoto de Supabase.**

**Qué hace `supabase start`:**
- ✅ Crea una nueva base de datos PostgreSQL LOCAL en Docker
- ✅ Ejecuta todas las migraciones de `supabase/migrations/` automáticamente
- ✅ Crea un proyecto Supabase completamente nuevo e independiente
- ❌ NO se conecta a tu proyecto remoto
- ❌ NO usa datos existentes del proyecto remoto

**Después de ejecutar `supabase start` verás:**
```
API URL: http://127.0.0.1:54321
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Para usar la base local:**
1. Crea un archivo `.env.local` con las credenciales locales:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key que muestra supabase start>
   ```
2. Recarga tu app: `npm run dev`
3. Accede al Studio local en http://localhost:54323

**Para trabajar con tu proyecto remoto:**
- NO ejecutes `supabase start` si quieres usar tu proyecto remoto
- En su lugar, simplemente usa las credenciales remotas en `.env.local`
- O linkea con `supabase link` y luego `supabase db push` para aplicar migraciones

### 3. Aplicar migraciones a tu proyecto remoto

Para aplicar las migraciones a tu base de datos remota:

```bash
supabase db push
```

Esto ejecutará todas las migraciones que aún no se hayan aplicado.

## 📦 Trabajar con Migraciones

### Crear una nueva migración

```bash
supabase migration new nombre_de_la_migracion
```

Esto creará un archivo con timestamp: `supabase/migrations/YYYYMMDDHHMMSS_nombre_de_la_migracion.sql`

### Ver estado de migraciones

```bash
supabase migration list
```

### Aplicar migraciones locales a remoto

```bash
supabase db push
```

### Obtener cambios del remoto

Si hiciste cambios directamente en Supabase y quieres sincronizar:

```bash
supabase db pull
```

Esto creará una nueva migración con los cambios del remoto.

### Resetear base de datos local

```bash
supabase db reset
```

Esto elimina todos los datos locales y vuelve a aplicar todas las migraciones desde cero, incluyendo `seed.sql`.

## 🔄 Workflow Recomendado

1. **Hacer cambios en el schema**:
   ```bash
   # Edita directamente los archivos en supabase/migrations/
   # o crea una nueva migración
   supabase migration new mi_cambio
   ```

2. **Probar localmente** (si usas Supabase local):
   ```bash
   supabase db reset  # Aplicar todas las migraciones
   ```

3. **Aplicar a remoto**:
   ```bash
   supabase db push
   ```

## 📝 Migraciones Incluidas

### `20240101000000_initial_schema.sql`
Crea todas las tablas base:
- `events` - Información de eventos
- `invitations` - Invitaciones (Mercurio/Venus)
- `responses` - Respuestas de invitados
- Índices, funciones, triggers y políticas RLS

## 🗄️ Storage Setup

Después de aplicar las migraciones, necesitas configurar el Storage para audio:

### Opción 1: Desde Supabase Dashboard

1. Ve a **Storage** en el dashboard
2. Click en **New bucket**
3. Nombre: `audio`
4. Marca como **público**
5. Agrega políticas de lectura/escritura públicas

### Opción 2: Desde SQL (en Supabase SQL Editor)

```sql
-- Crear bucket de audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

-- Política de escritura pública
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio');
```

## ✅ Verificación

Después de aplicar las migraciones, verifica que todo esté correcto:

```sql
-- Ver todas las tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver estructura de events
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

## 🐛 Solución de Problemas

### Error: "migration already exists"

Si una migración ya fue aplicada y la intentas aplicar de nuevo, Supabase CLI la omitirá automáticamente. Si quieres forzar una migración:

```bash
supabase db push --include-all
```

### Error: "Could not find column"

Si ves errores sobre columnas faltantes, verifica que todas las migraciones se hayan aplicado:

```bash
supabase migration list
```

### Resetear todo

Si necesitas empezar de cero en tu proyecto remoto:

```bash
# ⚠️ CUIDADO: Esto eliminará todos los datos
supabase db reset --linked
```

## 📚 Comandos Útiles

```bash
# Ver logs de Supabase local
supabase status

# Detener Supabase local
supabase stop

# Ver diferencias entre local y remoto
supabase db diff

# Generar tipos TypeScript desde la base de datos
supabase gen types typescript --linked > types/database.types.ts
```

## 🎉 ¡Listo!

Ahora puedes trabajar con Supabase CLI usando migraciones versionadas. Cada cambio en tu schema se rastrea como una migración, lo que hace fácil colaborar y mantener historial de cambios.


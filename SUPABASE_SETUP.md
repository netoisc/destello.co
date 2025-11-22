# 🗄️ Guía de Setup de Supabase para Destello

Esta guía te ayudará a configurar tu base de datos Supabase desde cero o actualizar el esquema existente.

## 📋 Verificar si ya tienes Supabase configurado

Si ya creaste las tablas anteriormente, probablemente solo necesites verificar que todo esté bien. Si es la primera vez, sigue todos los pasos.

## 🚀 Setup Inicial (Primera vez)

### Paso 1: Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Click en "New Project"
4. Llena el formulario:
   - **Name**: `destello` (o el nombre que prefieras)
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Region**: Elige la región más cercana a tus usuarios
   - **Pricing Plan**: Free (gratis)

5. Espera 2-3 minutos mientras se crea el proyecto

### Paso 2: Ejecutar el esquema SQL

1. En el dashboard de Supabase, ve a **SQL Editor** (ícono de terminal en el menú lateral)
2. Click en **New Query**
3. Abre el archivo `supabase-schema.sql` de este proyecto
4. Copia **TODO** el contenido del archivo
5. Pega el contenido en el SQL Editor
6. Click en **Run** (o presiona `Ctrl+Enter` / `Cmd+Enter`)
7. Deberías ver "Success. No rows returned"

### Paso 3: Crear el Storage Bucket para Audio

1. Ve a **Storage** en el menú lateral de Supabase
2. Click en **New bucket**
3. Configuración:
   - **Name**: `audio`
   - **Public bucket**: ✅ **Activa** (debe estar marcado)
   - **File size limit**: `10 MB` (o el tamaño que prefieras)
   - **Allowed MIME types**: `audio/webm,audio/mp4,audio/mpeg,audio/ogg`
4. Click en **Create bucket**

### Paso 4: Configurar políticas de Storage

1. En el bucket `audio` que acabas de crear, ve a **Policies**
2. Click en **New policy** o busca el botón para agregar políticas
3. Crea una política de lectura pública:

```sql
-- Policy para lectura pública de audio
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

-- Policy para escritura pública de audio
CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio');
```

**Alternativa más fácil**: En la interfaz de Supabase Storage:
- Ve a tu bucket `audio`
- Click en **Policies** → **New Policy**
- Selecciona **For full customization**, pega lo siguiente y ajusta:

```sql
-- Para SELECT (lectura)
(bucket_id = 'audio')

-- Para INSERT (escritura)
(bucket_id = 'audio')
```

### Paso 5: Obtener las credenciales de API

1. Ve a **Settings** → **API** en el menú lateral
2. Encuentra estas dos secciones:
   - **Project URL**: Copia la URL (algo como `https://xxxxx.supabase.co`)
   - **Project API keys**: Copia la clave `anon` `public` (no la `service_role`)

3. Crea un archivo `.env.local` en la raíz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

## 🔄 Actualizar esquema existente

Si ya tienes Supabase configurado y solo necesitas actualizar el esquema:

### Verificar qué tablas existen

Ejecuta esto en el SQL Editor para ver qué tablas tienes:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Si las tablas ya existen

El esquema actual es compatible con lo que tenemos. Solo verifica:

1. ✅ Que el campo `descripcion` en `events` no tenga `NOT NULL` (ya debería estar como `TEXT`)
2. ✅ Que exista el bucket `audio` en Storage
3. ✅ Que las políticas de Storage estén configuradas

### Si necesitas agregar algo nuevo

Si ves algún error, ejecuta estas consultas individuales en el SQL Editor:

```sql
-- Verificar estructura de events
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'events';

-- Si descripcion tiene NOT NULL, hacerla opcional:
ALTER TABLE events ALTER COLUMN descripcion DROP NOT NULL;

-- Verificar que limite_total y cantidad_mercurio existan:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('limite_total', 'cantidad_mercurio');
```

## ✅ Verificación final

Ejecuta estas consultas para verificar que todo esté bien:

```sql
-- Ver todas las tablas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Deberías ver: events, invitations, responses

-- Ver estructura de events
\d events
-- O con SQL:
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'events';

-- Verificar que el bucket de audio existe (en Storage, no SQL)
-- Ve a Storage y verifica que veas el bucket "audio"
```

## 🐛 Solución de problemas

### Error: "Could not find the 'cantidad_mercurio' column"
**Si ves este error al crear eventos**, significa que la tabla `events` no tiene todas las columnas necesarias.

**Solución rápida:**
1. Ve a SQL Editor en Supabase
2. Copia y ejecuta el contenido del archivo `add-missing-columns.sql`
3. Esto agregará las columnas faltantes (`cantidad_mercurio` y `limite_total`)
4. Intenta crear un evento de nuevo

### Error: "relation already exists"
- Las tablas ya existen, está bien. Solo verifica que tengan la estructura correcta.
- Si falta alguna columna, ejecuta `add-missing-columns.sql`

### Error: "permission denied"
- Asegúrate de estar usando el SQL Editor, no otro cliente.

### El audio no se sube
- Verifica que el bucket `audio` existe
- Verifica que el bucket sea **público**
- Verifica las políticas de Storage (SELECT e INSERT deben estar permitidas)

### No puedo leer los eventos
- Verifica las políticas RLS en la tabla `events`
- Ejecuta: `SELECT * FROM events LIMIT 1;` en el SQL Editor para probar

### Verificar estructura de tabla
Ejecuta esto para ver qué columnas tiene tu tabla:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

Deberías ver estas columnas:
- `id` (TEXT)
- `nombre` (TEXT)
- `descripcion` (TEXT)
- `audio_url` (TEXT)
- `limite_total` (INTEGER)
- `cantidad_mercurio` (INTEGER)
- `fecha` (TIMESTAMPTZ)
- `lugar` (TEXT)
- `que_traer` (TEXT[])
- `expires_at` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

## 📝 Notas importantes

- **RLS está activado**: Las políticas actuales permiten acceso público (lectura y escritura). En producción, deberías restringir esto.
- **Storage público**: El bucket de audio es público para que los usuarios puedan escuchar las grabaciones. Considera esto en producción.
- **Auto-delete**: Los eventos se eliminan automáticamente 24 horas después de la fecha del evento (configurado en `expires_at`).

## 🎉 ¡Listo!

Una vez completados estos pasos, tu Supabase estará configurado y listo para usar con Destello.

Recarga tu aplicación y prueba crear un evento. Si todo funciona, deberías poder:
1. Crear eventos ✅
2. Subir audio ✅
3. Generar invitaciones ✅
4. Ver los eventos creados ✅


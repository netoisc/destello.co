-- Add banners support to events
-- Agrega la columna banners a la tabla events y configura el bucket de storage

-- Agregar columna banners a la tabla events (array de URLs de imágenes)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS banners TEXT[] DEFAULT NULL;

-- Storage: Banners bucket
-- Crea el bucket de banners y configura las políticas de acceso

-- Crear bucket de banners (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners', 
  'banners', 
  true, 
  3145728, -- 3MB máximo por imagen (límite reducido por plan gratuito)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública para el bucket banners
CREATE POLICY "Public Banners Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Política de escritura pública para el bucket banners
CREATE POLICY "Public Banners Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners');

-- Política de eliminación pública para el bucket banners
CREATE POLICY "Public Banners Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners');


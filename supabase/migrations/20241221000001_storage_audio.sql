-- Storage: Audio bucket
-- Crea el bucket de audio y configura las políticas de acceso

-- Crear bucket de audio (público)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('audio', 'audio', true, 52428800, ARRAY['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'])
ON CONFLICT (id) DO NOTHING;

-- Política de lectura pública para el bucket audio
CREATE POLICY "Public Audio Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

-- Política de escritura pública para el bucket audio
CREATE POLICY "Public Audio Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio');

-- Política de eliminación pública para el bucket audio (opcional, para limpiar archivos viejos)
CREATE POLICY "Public Audio Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio');


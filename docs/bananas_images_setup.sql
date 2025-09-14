-- =================================================================
-- BANANAS IMAGES - Setup completo para Supabase
-- =================================================================
-- Execute este arquivo completo no SQL Editor do Supabase Dashboard
-- 
-- Features:
-- ✅ Tabela bananas_images
-- ✅ Índices para performance
-- ✅ RLS (Row Level Security) habilitado
-- ✅ Políticas de acesso público para leitura
-- ✅ Políticas de inserção liberadas
-- ✅ Triggers automáticos
-- ✅ Storage bucket policies (se necessário)
-- =================================================================

-- 1. CRIAR TABELA PRINCIPAL
-- =================================================================
CREATE TABLE IF NOT EXISTS bananas_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Dados principais
    prompt TEXT NOT NULL,
    original_image_url_1 TEXT NOT NULL,
    original_image_url_2 TEXT NOT NULL,
    generated_image_url TEXT,
    
    -- Status e métricas
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed', 'error')),
    processing_time_ms INTEGER,
    generated_image_size INTEGER,
    error_message TEXT,
    
    -- Tracking (opcional)
    user_ip VARCHAR(45),
    user_agent TEXT
);

-- 2. CRIAR ÍNDICES PARA PERFORMANCE
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_bananas_images_created_at ON bananas_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bananas_images_status ON bananas_images(status);
CREATE INDEX IF NOT EXISTS idx_bananas_images_user_ip ON bananas_images(user_ip);
CREATE INDEX IF NOT EXISTS idx_bananas_images_prompt ON bananas_images USING gin(to_tsvector('portuguese', prompt));

-- 3. TRIGGER PARA AUTO-UPDATE
-- =================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bananas_images_updated_at ON bananas_images;
CREATE TRIGGER update_bananas_images_updated_at 
    BEFORE UPDATE ON bananas_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- =================================================================
ALTER TABLE bananas_images ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS - LEITURA PÚBLICA
-- =================================================================
-- Permite que qualquer pessoa veja todas as imagens (público)
DROP POLICY IF EXISTS "bananas_images_select_policy" ON bananas_images;
CREATE POLICY "bananas_images_select_policy" ON bananas_images
    FOR SELECT 
    USING (true);  -- Acesso público total para leitura

-- 6. POLÍTICAS RLS - INSERÇÃO LIBERADA
-- =================================================================
-- Permite que qualquer pessoa crie novos registros (para API funcionar)
DROP POLICY IF EXISTS "bananas_images_insert_policy" ON bananas_images;
CREATE POLICY "bananas_images_insert_policy" ON bananas_images
    FOR INSERT 
    WITH CHECK (true);  -- Qualquer um pode inserir

-- 7. POLÍTICAS RLS - ATUALIZAÇÃO LIBERADA
-- =================================================================
-- Permite que qualquer pessoa atualize registros (para API funcionar)
DROP POLICY IF EXISTS "bananas_images_update_policy" ON bananas_images;
CREATE POLICY "bananas_images_update_policy" ON bananas_images
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);  -- Qualquer um pode atualizar

-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =================================================================
COMMENT ON TABLE bananas_images IS 'Tabela para armazenar gerações de imagens com duas imagens de entrada via IA';
COMMENT ON COLUMN bananas_images.id IS 'ID único do registro';
COMMENT ON COLUMN bananas_images.created_at IS 'Data/hora de criação do registro';
COMMENT ON COLUMN bananas_images.updated_at IS 'Data/hora da última atualização';
COMMENT ON COLUMN bananas_images.prompt IS 'Prompt/descrição fornecido pelo usuário';
COMMENT ON COLUMN bananas_images.original_image_url_1 IS 'URL da primeira imagem original enviada';
COMMENT ON COLUMN bananas_images.original_image_url_2 IS 'URL da segunda imagem original enviada';
COMMENT ON COLUMN bananas_images.generated_image_url IS 'URL da imagem final gerada pela IA';
COMMENT ON COLUMN bananas_images.status IS 'Status: processing, success, failed, error';
COMMENT ON COLUMN bananas_images.processing_time_ms IS 'Tempo total de processamento em milissegundos';
COMMENT ON COLUMN bananas_images.generated_image_size IS 'Tamanho da imagem gerada em bytes';
COMMENT ON COLUMN bananas_images.error_message IS 'Mensagem de erro se status = failed/error';
COMMENT ON COLUMN bananas_images.user_ip IS 'IP do usuário que fez a requisição';
COMMENT ON COLUMN bananas_images.user_agent IS 'User-Agent do browser do usuário';

-- 9. STORAGE BUCKET POLICIES (se usar Supabase Storage)
-- =================================================================
-- Caso as imagens sejam armazenadas no bucket "fotos" do Supabase Storage
-- Descomente e ajuste conforme necessário:

-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('fotos', 'fotos', true) 
-- ON CONFLICT (id) DO NOTHING;

-- DROP POLICY IF EXISTS "fotos_bucket_select_policy" ON storage.objects;
-- CREATE POLICY "fotos_bucket_select_policy" ON storage.objects
--     FOR SELECT 
--     USING (bucket_id = 'fotos');

-- DROP POLICY IF EXISTS "fotos_bucket_insert_policy" ON storage.objects;
-- CREATE POLICY "fotos_bucket_insert_policy" ON storage.objects
--     FOR INSERT 
--     WITH CHECK (bucket_id = 'fotos');

-- 10. VERIFICAÇÃO FINAL
-- =================================================================
-- Verificar se tudo foi criado corretamente
SELECT 
    'Tabela criada com sucesso!' as status,
    count(*) as total_registros
FROM bananas_images;

SELECT 
    'Políticas RLS ativas:' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'bananas_images';

-- =================================================================
-- FIM DO SETUP
-- =================================================================
-- 
-- ✅ Para testar:
-- 1. Execute este arquivo completo no Supabase SQL Editor
-- 2. Acesse http://localhost:3001/bananas-image
-- 3. Faça upload de duas imagens e teste a geração
-- 4. Acesse http://localhost:3001/bananas-image/list para ver o histórico
-- 
-- 🔧 Para debug:
-- SELECT * FROM bananas_images ORDER BY created_at DESC LIMIT 10;
-- 
-- 📊 Para estatísticas:
-- SELECT status, count(*) FROM bananas_images GROUP BY status;
-- =================================================================
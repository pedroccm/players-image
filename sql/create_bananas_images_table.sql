-- Criar tabela bananas_images no Supabase
-- Execute este SQL no editor SQL do Supabase Dashboard

CREATE TABLE IF NOT EXISTS bananas_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prompt do usuário
    prompt TEXT NOT NULL,
    
    -- URLs das duas imagens originais
    original_image_url_1 TEXT NOT NULL,
    original_image_url_2 TEXT NOT NULL,
    
    -- URL da imagem gerada
    generated_image_url TEXT,
    
    -- Status do processamento
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed', 'error')),
    
    -- Informações de processamento
    processing_time_ms INTEGER,
    generated_image_size INTEGER,
    
    -- Informações de erro
    error_message TEXT,
    
    -- Tracking do usuário (opcional)
    user_ip VARCHAR(45),
    user_agent TEXT
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_bananas_images_created_at ON bananas_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bananas_images_status ON bananas_images(status);
CREATE INDEX IF NOT EXISTS idx_bananas_images_user_ip ON bananas_images(user_ip);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bananas_images_updated_at 
    BEFORE UPDATE ON bananas_images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - opcional, configure conforme necessário
-- ALTER TABLE bananas_images ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE bananas_images IS 'Tabela para armazenar gerações de imagens com duas imagens de entrada';
COMMENT ON COLUMN bananas_images.prompt IS 'Prompt/descrição fornecido pelo usuário';
COMMENT ON COLUMN bananas_images.original_image_url_1 IS 'URL da primeira imagem original';
COMMENT ON COLUMN bananas_images.original_image_url_2 IS 'URL da segunda imagem original';
COMMENT ON COLUMN bananas_images.generated_image_url IS 'URL da imagem gerada pela IA';
COMMENT ON COLUMN bananas_images.status IS 'Status do processamento: processing, success, failed, error';
COMMENT ON COLUMN bananas_images.processing_time_ms IS 'Tempo de processamento em milissegundos';
COMMENT ON COLUMN bananas_images.generated_image_size IS 'Tamanho da imagem gerada em bytes';
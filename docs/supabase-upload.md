# Upload de Imagens no Supabase

Este documento detalha como o sistema realiza o upload de imagens para o Supabase Storage e retorna a URL pública das imagens.

## Configuração

O sistema utiliza a biblioteca `@supabase/supabase-js` para interagir com o Supabase.

### Variáveis de Ambiente Necessárias

- `NEXT_PUBLIC_SUPABASE_URL` - URL do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase

## Função Principal: `uploadImageToSupabase`

**Localização**: `src/lib/supabase.ts:8`

### Parâmetros

- `imageBase64` (string): Imagem em formato base64
- `fileName` (string, opcional): Nome do arquivo. Se não fornecido, será gerado automaticamente como `ai-generated-${timestamp}.png`

### Processo de Upload

1. **Conversão Base64 para Blob**

   ```typescript
   const base64Response = await fetch(`data:image/png;base64,${imageBase64}`)
   const blob = await base64Response.blob()
   ```

2. **Geração do Nome do Arquivo**

   ```typescript
   const finalFileName = fileName || `ai-generated-${Date.now()}.png`
   ```

3. **Upload para o Supabase Storage**

   - **Bucket**: `fotos`
   - **Configurações**:
     - `contentType`: "image/png"
     - `upsert`: true (sobrescreve se já existir)

   ```typescript
   const { data, error } = await supabase.storage
     .from("fotos")
     .upload(finalFileName, blob, {
       contentType: "image/png",
       upsert: true,
     })
   ```

4. **Obtenção da URL Pública**

   ```typescript
   const { data: publicUrlData } = supabase.storage
     .from("fotos")
     .getPublicUrl(data.path)

   return publicUrlData.publicUrl
   ```

### Retorno

A função retorna a URL pública da imagem no formato:

```
https://[projeto].supabase.co/storage/v1/object/public/fotos/[nome-do-arquivo]
```

## APIs que Utilizam o Upload

### 1. `/api/images/upload`

**Arquivo**: `src/app/api/images/upload/route.ts:28`

- Upload direto de imagens

### 2. `/api/images/generate`

**Arquivo**: `src/app/api/images/generate/route.ts:31,46`

- Upload de imagens geradas por IA
- Pode fazer upload de duas imagens (image1 e image2)

### 3. `/api/chat-image/upload`

**Arquivo**: `src/app/api/chat-image/upload/route.ts:24`

- Upload de imagens no contexto de chat

### 4. `/api/images/upload-test`

**Arquivo**: `src/app/api/images/upload-test/route.ts:42,82`

- Endpoint de teste para validar upload

## Tratamento de Erros

Todos os erros são capturados e logados:

```typescript
console.error("Error uploading image to Supabase:", error)
throw error
```

## Logs de Debug

O sistema inclui logs detalhados para debug:

- Conversão de base64 para blob
- Tamanho do blob criado
- Nome do arquivo sendo usado
- Resultado do upload no Supabase

## Função Auxiliar: `convertFileToBase64`

**Localização**: `src/lib/supabase.ts:49`

Converte um objeto `File` para string base64:

```typescript
const arrayBuffer = await file.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)
const base64 = buffer.toString("base64")
```

## Considerações de Segurança

- As imagens são públicas uma vez enviadas
- O bucket "fotos" permite leitura pública
- Não há validação de tipo de arquivo além do `contentType`
- O sistema permite sobrescrita de arquivos (`upsert: true`)

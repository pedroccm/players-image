// Background Function para processos longos (até 15min no Netlify Pro)
const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")
const { readdir } = require("fs/promises")

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

exports.handler = async (event) => {
  console.log("=== BACKGROUND FUNCTION STARTED ===")

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    }
  }

  try {
    const { teamName, teamId } = JSON.parse(event.body || "{}")

    console.log(`🏆 Processing team: ${teamName} (ID: ${teamId})`)

    if (!teamName && !teamId) {
      throw new Error("Team name or ID is required")
    }

    // 1. Buscar logo do time
    const teamLogoUrl = await findTeamLogo(teamId || teamName)
    if (!teamLogoUrl) {
      throw new Error(`Team logo not found for ${teamId || teamName}`)
    }

    // 2. Selecionar background aleatório
    const selectedBackground = await getRandomBackground(teamId || teamName)
    if (!selectedBackground) {
      throw new Error("No backgrounds available")
    }

    // 3. Verificar se já existe no Supabase
    const normalizedTeamName = teamName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[áàâã]/g, "a")
      .replace(/[éê]/g, "e")
      .replace(/[íî]/g, "i")
      .replace(/[óôõ]/g, "o")
      .replace(/[úû]/g, "u")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9_-]/g, "")

    const bgName = selectedBackground.replace(/\.[^/.]+$/, "")
    const supabasePath = `${normalizedTeamName}/${bgName}.png`

    console.log(`📁 Checking Supabase path: ${supabasePath}`)

    // Verificar se já existe
    try {
      const publicUrl = supabase.storage
        .from("fotos")
        .getPublicUrl(supabasePath)
      const testResponse = await fetch(publicUrl.data.publicUrl, {
        method: "HEAD",
      })

      if (testResponse.ok) {
        console.log(`⚡ Background already exists, reusing`)
        return {
          statusCode: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            success: true,
            team_name: teamName,
            urls: [publicUrl.data.publicUrl],
          }),
        }
      }
    } catch {
      console.log(`🔍 Background not found, will generate`)
    }

    // 4. Gerar nova imagem com AIML API
    const result = await generateWithAIML(
      teamLogoUrl,
      selectedBackground,
      supabasePath,
      teamName
    )

    console.log("✅ Background processing completed:", result)

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify(result),
    }
  } catch (error) {
    console.error("❌ Background function error:", error)

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        success: false,
        error: error.message || "Background processing failed",
      }),
    }
  }
}

// Função para encontrar logo do time usando URL pública
async function findTeamLogo(teamIdentifier) {
  try {
    console.log(`🔍 Procurando logo para time: ${teamIdentifier}`)

    // Primeiro tentar busca direta
    const directMatch = `${teamIdentifier}.png`
    let logoUrl = `https://players-image.netlify.app/escudos_2025/${directMatch}`

    console.log(`🌐 Testando URL direta: ${logoUrl}`)

    try {
      const response = await fetch(logoUrl, { method: "HEAD" })
      if (response.ok) {
        console.log(`✅ Logo encontrado (busca direta): ${logoUrl}`)
        return logoUrl
      }
    } catch (error) {
      console.log(`❌ URL direta não encontrada: ${logoUrl}`)
    }

    // Fallback: normalizar nome do time para busca
    const normalizedTeamName = teamIdentifier
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[áàâã]/g, "a")
      .replace(/[éê]/g, "e")
      .replace(/[íî]/g, "i")
      .replace(/[óôõ]/g, "o")
      .replace(/[úû]/g, "u")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9_-]/g, "")

    const normalizedUrl = `https://players-image.netlify.app/escudos_2025/${normalizedTeamName}.png`
    console.log(`🌐 Testando URL normalizada: ${normalizedUrl}`)

    try {
      const response = await fetch(normalizedUrl, { method: "HEAD" })
      if (response.ok) {
        console.log(`✅ Logo encontrado (busca normalizada): ${normalizedUrl}`)
        return normalizedUrl
      }
    } catch (error) {
      console.log(`❌ URL normalizada não encontrada: ${normalizedUrl}`)
    }

    console.log(`❌ Logo não encontrado para: ${teamIdentifier}`)
    return null
  } catch (error) {
    console.error("❌ Error finding team logo:", error)
    return null
  }
}

// Cache de backgrounds já usados por time para evitar duplicatas
const usedBackgroundsCache = new Map()

// Função para selecionar background aleatório usando URLs públicas
async function getRandomBackground(teamIdentifier) {
  try {
    // Lista real de backgrounds disponíveis (bg1.png até bg52.png)
    const availableBackgrounds = []
    for (let i = 1; i <= 52; i++) {
      availableBackgrounds.push(`bg${i}.png`)
    }

    // Obter backgrounds já usados para este time
    if (!usedBackgroundsCache.has(teamIdentifier)) {
      usedBackgroundsCache.set(teamIdentifier, new Set())
    }
    const usedBackgrounds = usedBackgroundsCache.get(teamIdentifier)

    // Filtrar backgrounds não usados
    const availableFiles = availableBackgrounds.filter(
      (file) => !usedBackgrounds.has(file)
    )

    // Se todos foram usados, resetar cache para este time
    if (availableFiles.length === 0) {
      console.log(
        `🔄 Resetando cache de backgrounds para ${teamIdentifier} - todos foram usados`
      )
      usedBackgrounds.clear()
      availableFiles.push(...availableBackgrounds)
    }

    // Selecionar aleatoriamente dos disponíveis
    const randomIndex = Math.floor(Math.random() * availableFiles.length)
    const selectedFile = availableFiles[randomIndex]

    // Marcar como usado
    usedBackgrounds.add(selectedFile)

    console.log(
      `🎲 Background selecionado para ${teamIdentifier}: ${selectedFile}`
    )
    console.log(
      `📊 Backgrounds usados: ${usedBackgrounds.size}/${availableBackgrounds.length}`
    )

    return selectedFile
  } catch (error) {
    console.error("❌ Error getting random background:", error)
    return null
  }
}

// Função principal para gerar com AIML
async function generateWithAIML(
  logoPath,
  backgroundPath,
  supabasePath,
  teamName
) {
  const API_KEY = process.env.AIML_API_KEY
  if (!API_KEY) {
    throw new Error("AIML_API_KEY not configured")
  }

  try {
    // Gerar imagem com IA
    const generatedImageUrl = await generateBackgroundWithAI(
      logoPath,
      backgroundPath,
      teamName
    )

    // Upload para Supabase
    const finalUrl = await uploadToSupabase(generatedImageUrl, supabasePath)

    return {
      success: true,
      team_name: teamName,
      urls: [finalUrl],
    }
  } catch (error) {
    console.error("❌ Error in generateWithAIML:", error)
    throw error
  }
}

// Função para gerar imagem com IA
async function generateBackgroundWithAI(
  teamLogoUrl,
  backgroundFile,
  teamName
) {
  const API_KEY = process.env.AIML_API_KEY
  if (!API_KEY) {
    throw new Error("AIML_API_KEY not configured")
  }

  try {
    // URLs públicas para downloads
    const backgroundUrl = `https://players-image.netlify.app/bgs/${backgroundFile}`

    console.log(`🌐 Baixando logo de: ${teamLogoUrl}`)
    console.log(`🌐 Baixando background de: ${backgroundUrl}`)

    // Baixar arquivos via fetch
    const [logoResponse, backgroundResponse] = await Promise.all([
      fetch(teamLogoUrl),
      fetch(backgroundUrl)
    ])

    if (!logoResponse.ok) {
      throw new Error(`Failed to fetch logo: ${logoResponse.status}`)
    }
    if (!backgroundResponse.ok) {
      throw new Error(`Failed to fetch background: ${backgroundResponse.status}`)
    }

    const logoBuffer = await logoResponse.arrayBuffer()
    const backgroundBuffer = await backgroundResponse.arrayBuffer()

    // Criar FormData
    const formData = new FormData()

    // Adicionar arquivos como Blob
    formData.append("model", "openai/gpt-image-1")
    formData.append(
      "image",
      new Blob([backgroundBuffer], { type: "image/png" }),
      backgroundFile
    )
    formData.append(
      "image",
      new Blob([logoBuffer], { type: "image/png" }),
      "logo.png"
    )
    formData.append(
      "prompt",
      "Quero esse fundo com a mesma forma e estilo porém com as cores desse escudo, coloque o logo com opacidade 50% para parecer integrado ao fundo"
    )
    formData.append("size", "1024x1536")

    console.log("🌐 Chamando AIML API...")

    const response = await fetch("https://api.aimlapi.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      body: formData,
      signal: AbortSignal.timeout(120000), // 2 minutos
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AIML API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log("📊 AIML API response:", result)

    if (result.data && result.data[0] && result.data[0].url) {
      return result.data[0].url
    } else {
      throw new Error("Invalid response from AIML API")
    }
  } catch (error) {
    console.error("❌ Error calling AIML API:", error)
    throw error
  }
}

// Função para upload no Supabase
async function uploadToSupabase(imageUrl, supabasePath) {
  try {
    // Baixar imagem
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()

    console.log(`📤 Uploading to Supabase: ${supabasePath}`)

    // Upload para Supabase
    const { error } = await supabase.storage
      .from("fotos")
      .upload(supabasePath, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      })

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`)
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from("fotos")
      .getPublicUrl(supabasePath)

    console.log(`🔗 Upload concluído: ${publicUrlData.publicUrl}`)

    return publicUrlData.publicUrl
  } catch (error) {
    console.error("❌ Error uploading to Supabase:", error)
    throw error
  }
}

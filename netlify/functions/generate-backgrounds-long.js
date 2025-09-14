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
    const teamLogoPath = await findTeamLogo(teamId || teamName)
    if (!teamLogoPath) {
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
      teamLogoPath,
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

// Função para encontrar logo do time
async function findTeamLogo(teamIdentifier) {
  try {
    // No Netlify, process.cwd() pode apontar para diretório diferente
    // Usar caminho relativo à função ou absoluto baseado na estrutura
    const logoDir = path.join(__dirname, "..", "..", "public", "escudos_2025")

    console.log(`🔧 Debug paths:`)
    console.log(`   __dirname: ${__dirname}`)
    console.log(`   process.cwd(): ${process.cwd()}`)
    console.log(`   logoDir: ${logoDir}`)

    const files = await readdir(logoDir)

    // Filtrar apenas arquivos PNG
    const pngFiles = files.filter((file) => file.endsWith(".png"))

    console.log(`🔍 Procurando logo PNG para: ${teamIdentifier}`)
    console.log(`📁 Arquivos PNG disponíveis: ${pngFiles.length}`)

    // Tentar busca direta primeiro (caso seja um ID como "america_de_pedrinhas")
    const directMatch = `${teamIdentifier}.png`
    if (pngFiles.includes(directMatch)) {
      const logoPath = path.join(logoDir, directMatch)
      console.log(`✅ Logo PNG encontrado (busca direta): ${logoPath}`)
      return logoPath
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

    console.log(`🔍 Nome normalizado (fallback): ${normalizedTeamName}`)

    // Buscar arquivo PNG que corresponda
    for (const file of pngFiles) {
      const fileNameWithoutExt = file.replace(/\.[^/.]+$/, "").toLowerCase()
      console.log(
        `🔍 Comparando: ${fileNameWithoutExt} === ${normalizedTeamName}`
      )

      if (fileNameWithoutExt === normalizedTeamName) {
        const logoPath = path.join(logoDir, file)
        console.log(`✅ Logo PNG encontrado (busca normalizada): ${logoPath}`)
        return logoPath
      }
    }

    console.log(`❌ Logo PNG não encontrado para: ${teamIdentifier}`)
    console.log(
      `📝 Tentativas: busca direta (${directMatch}) e normalizada (${normalizedTeamName})`
    )
    console.log(
      `📝 Arquivos PNG disponíveis: ${pngFiles.slice(0, 10).join(", ")}...`
    )
    return null
  } catch (error) {
    console.error("❌ Error finding team logo:", error)
    return null
  }
}

// Cache de backgrounds já usados por time para evitar duplicatas
const usedBackgroundsCache = new Map()

// Função para selecionar background aleatório
async function getRandomBackground(teamIdentifier) {
  try {
    const bgsDir = path.join(__dirname, "..", "..", "public", "bgs")
    const files = await readdir(bgsDir)

    // Filtrar apenas arquivos de imagem
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file)
    )

    if (imageFiles.length === 0) {
      return null
    }

    // Obter backgrounds já usados para este time
    if (!usedBackgroundsCache.has(teamIdentifier)) {
      usedBackgroundsCache.set(teamIdentifier, new Set())
    }
    const usedBackgrounds = usedBackgroundsCache.get(teamIdentifier)

    // Filtrar backgrounds não usados
    const availableFiles = imageFiles.filter(
      (file) => !usedBackgrounds.has(file)
    )

    // Se todos foram usados, resetar cache para este time
    if (availableFiles.length === 0) {
      console.log(
        `🔄 Resetando cache de backgrounds para ${teamIdentifier} - todos foram usados`
      )
      usedBackgrounds.clear()
      availableFiles.push(...imageFiles)
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
      `📊 Backgrounds usados: ${usedBackgrounds.size}/${imageFiles.length}`
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
  teamLogoPath,
  backgroundFile,
  teamName
) {
  const API_KEY = process.env.AIML_API_KEY
  if (!API_KEY) {
    throw new Error("AIML_API_KEY not configured")
  }

  try {
    // Ler arquivos
    const backgroundPath = path.join(
      __dirname,
      "..",
      "..",
      "public",
      "bgs",
      backgroundFile
    )
    const logoBuffer = fs.readFileSync(teamLogoPath)
    const backgroundBuffer = fs.readFileSync(backgroundPath)

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

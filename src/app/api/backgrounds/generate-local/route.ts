import { readFileSync } from "fs"
import { readdir } from "fs/promises"
import { join } from "path"

import { createClient } from "@supabase/supabase-js"

import type { NextRequest } from "next/server"

// Configuração do Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cache de backgrounds já usados por time para evitar duplicatas
const usedBackgroundsCache = new Map<string, Set<string>>()

// Função principal extraída para reutilização
export async function generateBackgroundForTeam(request: NextRequest) {
  console.log("=== BACKGROUNDS GENERATE LOCAL API CALLED ===")

  try {
    const { teamName, teamId } = await request.json()

    console.log(
      "🏆 Generating backgrounds locally for team:",
      teamName,
      "ID:",
      teamId
    )

    if (!teamName && !teamId) {
      return Response.json(
        { success: false, error: "Team name or ID is required" },
        { status: 400 }
      )
    }

    // 1. Buscar logo do time usando ID se disponível, senão usar nome
    const teamLogoPath = await findTeamLogo(teamId || teamName)
    if (!teamLogoPath) {
      return Response.json(
        {
          success: false,
          error: `Team logo not found for ${teamId || teamName}`,
        },
        { status: 404 }
      )
    }

    // 2. Selecionar 1 background aleatório (garantindo unicidade por time)
    const selectedBackground = await getRandomBackground(teamId || teamName)
    if (!selectedBackground) {
      return Response.json(
        { success: false, error: "No backgrounds available" },
        { status: 404 }
      )
    }

    // 3. Verificar se já existe no Supabase (cache)
    const bgName = selectedBackground.replace(/\.[^/.]+$/, "") // Remove extensão

    // Normalizar nome do time para path do Supabase (sem acentos, espaços, etc.)
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

    const supabasePath = `${normalizedTeamName}/${bgName}.png`

    console.log(`📁 Path normalizado para Supabase: ${supabasePath}`)

    try {
      const publicUrl = supabase.storage
        .from("fotos")
        .getPublicUrl(supabasePath)

      // Testar se existe fazendo requisição HEAD
      const testResponse = await fetch(publicUrl.data.publicUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
      })

      if (testResponse.ok) {
        console.log(`⚡ Background ${bgName} já existe, reutilizando`)
        return Response.json({
          success: true,
          team_name: teamName,
          count: 1,
          urls: [publicUrl.data.publicUrl],
        })
      }
    } catch {
      console.log(`🔍 Background ${bgName} não existe, será gerado`)
    }

    // 4. Gerar nova imagem usando AIML API
    const generatedImageUrl = await generateBackgroundWithAI(
      teamLogoPath,
      selectedBackground,
      teamName
    )

    // 5. Upload para Supabase
    const finalUrl = await uploadToSupabase(generatedImageUrl, supabasePath)

    return Response.json({
      success: true,
      team_name: teamName,
      count: 1,
      urls: [finalUrl],
    })
  } catch (error) {
    console.error("❌ Error generating backgrounds locally:", error)

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate backgrounds",
      },
      { status: 500 }
    )
  }
}

// Função para encontrar logo do time
async function findTeamLogo(teamIdentifier: string): Promise<string | null> {
  try {
    const logoDir = join(process.cwd(), "public", "escudos_2025")
    const files = await readdir(logoDir)

    // Filtrar apenas arquivos PNG
    const pngFiles = files.filter((file) => file.endsWith(".png"))

    console.log(`🔍 Procurando logo PNG para: ${teamIdentifier}`)
    console.log(`📁 Arquivos PNG disponíveis: ${pngFiles.length}`)

    // Tentar busca direta primeiro (caso seja um ID como "america_de_pedrinhas")
    const directMatch = `${teamIdentifier}.png`
    if (pngFiles.includes(directMatch)) {
      const logoPath = join(logoDir, directMatch)
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
        const logoPath = join(logoDir, file)
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

// Função para pegar background aleatório (garantindo unicidade por time)
async function getRandomBackground(
  teamIdentifier: string
): Promise<string | null> {
  try {
    const bgsDir = join(process.cwd(), "public", "bgs")
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
    const usedBackgrounds = usedBackgroundsCache.get(teamIdentifier)!

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

// Função para gerar imagem com IA
async function generateBackgroundWithAI(
  teamLogoPath: string,
  backgroundFile: string,
  _teamName: string
): Promise<string> {
  const API_KEY = process.env.AIML_API_KEY
  if (!API_KEY) {
    throw new Error("AIML_API_KEY not configured")
  }

  try {
    // Ler arquivos
    const backgroundPath = join(process.cwd(), "public", "bgs", backgroundFile)
    const logoBuffer = readFileSync(teamLogoPath)
    const backgroundBuffer = readFileSync(backgroundPath)

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
      signal: AbortSignal.timeout(120000), // 2 minutos (background function)
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
async function uploadToSupabase(
  imageUrl: string,
  supabasePath: string
): Promise<string> {
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

// Export POST handler que chama a função principal
export async function POST(request: NextRequest) {
  return generateBackgroundForTeam(request)
}

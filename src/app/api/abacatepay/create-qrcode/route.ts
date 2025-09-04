import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY
const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v1"

if (!ABACATEPAY_API_KEY) {
  throw new Error("ABACATEPAY_API_KEY is not defined in environment variables")
}

export async function POST(request: NextRequest) {
  console.log("🔥 === ABACATEPAY CREATE QR CODE API CALLED ===")
  
  try {
    const { userName } = await request.json()
    console.log("👤 Creating QR Code for user:", userName)

    const requestBody = {
      amount: 300, // R$ 3,00 em centavos
      description: `Pagamento Player.CX - ${userName}`,
      expiresIn: 900, // 15 minutos
    }
    
    console.log("📋 Request body:", requestBody)
    console.log("🔑 Using API key:", ABACATEPAY_API_KEY.substring(0, 10) + "...")

    const response = await fetch(`${ABACATEPAY_BASE_URL}/pixQrCode/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("📡 AbacatePay response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ AbacatePay error response:", errorText)
      throw new Error(`Failed to create PIX QR Code: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log("✅ AbacatePay success response:", data)

    return NextResponse.json({
      success: true,
      data: data.data,
    })
  } catch (error) {
    console.error("❌ Error creating PIX QR Code:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create PIX QR Code",
      },
      { status: 500 }
    )
  }
}

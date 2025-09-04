import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

const ABACATEPAY_API_KEY = "abc_dev_0rYdNbzadtdtd24Ks4SQMxsk"
const ABACATEPAY_BASE_URL = "https://api.abacatepay.com"

export async function POST(request: NextRequest) {
  try {
    const { userName } = await request.json()

    const response = await fetch(`${ABACATEPAY_BASE_URL}/pixQrCode/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 300, // R$ 3,00 em centavos
        description: `Pagamento Player.CX - ${userName}`,
        expiresIn: 900, // 15 minutos
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to create PIX QR Code")
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.data,
    })
  } catch (error) {
    console.error("Error creating PIX QR Code:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create PIX QR Code",
      },
      { status: 500 }
    )
  }
}

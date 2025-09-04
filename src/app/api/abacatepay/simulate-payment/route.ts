import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY
const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v1"

if (!ABACATEPAY_API_KEY) {
  throw new Error("ABACATEPAY_API_KEY is not defined in environment variables")
}

export async function POST(request: NextRequest) {
  console.log("🔥 === ABACATEPAY SIMULATE PAYMENT API CALLED ===")

  try {
    const { paymentId } = await request.json()
    console.log("💳 Simulating payment for ID:", paymentId)

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: "Payment ID is required" },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${ABACATEPAY_BASE_URL}/pixQrCode/simulate-payment?id=${paymentId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: {},
        }),
      }
    )

    console.log("📡 AbacatePay simulate response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ AbacatePay simulate error response:", errorText)
      throw new Error(
        `Failed to simulate PIX payment: ${response.status} - ${errorText}`
      )
    }

    const data = await response.json()
    console.log("✅ AbacatePay simulate success response:", data)

    return NextResponse.json({
      success: true,
      data: data.data,
    })
  } catch (error) {
    console.error("❌ Error simulating PIX payment:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to simulate PIX payment",
      },
      { status: 500 }
    )
  }
}

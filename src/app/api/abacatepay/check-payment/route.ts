import { NextResponse } from "next/server"

import type { NextRequest } from "next/server"

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY
const ABACATEPAY_BASE_URL = "https://api.abacatepay.com/v1"

if (!ABACATEPAY_API_KEY) {
  throw new Error("ABACATEPAY_API_KEY is not defined in environment variables")
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pixId = searchParams.get("id")

    if (!pixId) {
      return NextResponse.json(
        { success: false, error: "PIX ID is required" },
        { status: 400 }
      )
    }

    const response = await fetch(
      `${ABACATEPAY_BASE_URL}/pixQrCode/check?id=${pixId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ABACATEPAY_API_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error("Failed to check PIX payment status")
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.data,
    })
  } catch (error) {
    console.error("Error checking PIX payment status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check PIX payment status",
      },
      { status: 500 }
    )
  }
}

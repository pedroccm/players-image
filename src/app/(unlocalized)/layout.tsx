import {
  Host_Grotesk,
  Lato,
  Sofia_Sans_Extra_Condensed,
} from "next/font/google"

import { cn } from "@/lib/utils"

import "../globals.css"

import { Providers } from "@/providers"

import type { Metadata } from "next"
import type { ReactNode } from "react"

import { Toaster as Sonner } from "@/components/ui/sonner"
import { Toaster } from "@/components/ui/toaster"

// Define metadata for the application
// More info: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
export const metadata: Metadata = {
  title: {
    template: "%s | Shadboard",
    default: "Shadboard",
  },
  description: "",
  metadataBase: new URL(process.env.BASE_URL as string),
}

// Define fonts for the application
// More info: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
const latoFont = Lato({
  subsets: ["latin"],
  weight: ["100", "300", "400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-lato",
})

const hostGroteskFont = Host_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-host-grotesk",
})

const sofiaSansExtraCondensedFont = Sofia_Sans_Extra_Condensed({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-sofia-sans-extra-condensed",
})

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "[&:lang(en)]:font-lato", // Set font styles based on the language
          "bg-background text-foreground antialiased overscroll-none", // Set background, text, , anti-aliasing styles, and overscroll behavior
          latoFont.variable, // Include Lato font variable
          hostGroteskFont.variable, // Include Host Grotesk font variable
          sofiaSansExtraCondensedFont.variable // Include Sofia Sans Extra Condensed font variable
        )}
      >
        <Providers locale="en" direction="ltr" session={null}>
          {children}
          <Toaster />
          <Sonner />
        </Providers>
      </body>
    </html>
  )
}

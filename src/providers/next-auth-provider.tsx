"use client"

import { SessionProvider } from "next-auth/react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import type { SessionProviderProps } from "next-auth/react"

export const NextAuthProvider = ({
  children,
  ...props
}: SessionProviderProps) => {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <>{children}</>
  }
  
  // Skip NextAuth for specific routes that don't need authentication
  const skipAuthRoutes = ['/chat-image', '/form-image', '/photo-mix']
  const shouldSkipAuth = skipAuthRoutes.some(route => pathname?.startsWith(route))
  
  if (shouldSkipAuth) {
    return <>{children}</>
  }

  return (
    <SessionProvider refetchOnWindowFocus={false} {...props}>
      {children}
    </SessionProvider>
  )
}

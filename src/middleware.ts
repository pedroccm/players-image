import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

import type { NextRequest } from "next/server"

import { isGuestRoute, isPublicRoute } from "@/lib/auth-routes"
import {
  ensureLocalizedPathname,
  getLocaleFromPathname,
  getPreferredLocale,
  isPathnameMissingLocale,
} from "@/lib/i18n"
import { ensureRedirectPathname, ensureWithoutPrefix } from "@/lib/utils"

function redirect(pathname: string, request: NextRequest) {
  const { search, hash } = request.nextUrl
  let resolvedPathname = pathname

  if (isPathnameMissingLocale(pathname)) {
    const preferredLocale = getPreferredLocale(request)
    resolvedPathname = ensureLocalizedPathname(pathname, preferredLocale)
  }
  if (search) {
    resolvedPathname += search
  }
  if (hash) {
    resolvedPathname += hash
  }

  const redirectUrl = new URL(resolvedPathname, request.url).toString()
  return NextResponse.redirect(redirectUrl)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log("MIDDLEWARE:", pathname)

  // Skip middleware for chat-image, form-image, banana-image and photo-mix routes
  if (
    pathname.startsWith("/chat-image") ||
    pathname.startsWith("/form-image") ||
    pathname.startsWith("/banana-image") ||
    pathname.startsWith("/photo-mix")
  ) {
    console.log("SKIPPING MIDDLEWARE FOR:", pathname)
    return NextResponse.next()
  }

  const locale = getLocaleFromPathname(pathname)
  const pathnameWithoutLocale = ensureWithoutPrefix(pathname, `/${locale}`)
  const isNotPublic = !isPublicRoute(pathnameWithoutLocale)

  // Handle authentication for protected and guest routes
  if (isNotPublic) {
    const token = await getToken({ req: request })
    const isAuthenticated = !!token
    const isGuest = isGuestRoute(pathnameWithoutLocale)
    const isProtected = !isGuest

    // Redirect authenticated users away from guest routes
    if (isAuthenticated && isGuest) {
      return redirect(process.env.HOME_PATHNAME || "/", request)
    }

    // Redirect unauthenticated users from protected routes to sign-in
    if (!isAuthenticated && isProtected) {
      let redirectPathname = "/sign-in"

      // Maintain the original path for redirection
      if (pathnameWithoutLocale !== "") {
        redirectPathname = ensureRedirectPathname(redirectPathname, pathname)
      }

      return redirect(redirectPathname, request)
    }
  }

  // Redirect to localized URL if the pathname is missing a locale
  if (!locale) {
    return redirect(pathname, request)
  }

  /**
   * NOTE
   * If your homepage is not '/', you need to configure a redirect
   * in next.config.mjs using the redirects() function,
   * and set the HOME_PATHNAME environment variable accordingly.
   *
   * See https://nextjs.org/docs/app/building-your-application/routing/redirecting#redirects-in-nextconfigjs
   */

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Explicitly exclude chat-image, form-image, banana-image, photo-mix and their subpaths
    "/((?!api|_next|favicon.ico|sitemap.xml|robots.txt|images|docs|escudos_2025|chat-image|form-image|banana-image|photo-mix).*)",
  ],
}

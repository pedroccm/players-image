import type { NextAuthOptions } from "next-auth"

import CredentialsProvider from "next-auth/providers/credentials"

// Extend NextAuth's Session and User interfaces to include custom properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string | null
      name: string
      avatar: string | null
      status: string
    }
  }

  interface User {
    id: string
    email: string | null
    name: string
    avatar: string | null
    status: string
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string | null
    name: string
    avatar: string | null
    status: string
  }
}

// Configuration for NextAuth with demo authentication
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      // Demo authentication - accepts any credentials
      async authorize(credentials) {
        if (!credentials) return null

        // Demo user for demonstration purposes
        return {
          id: "demo-user-1",
          email: credentials.email,
          name: "Demo User",
          avatar: "https://github.com/shadcn.png",
          status: "online",
        }
      },
    }),
  ],
  pages: {
    signIn: "/sign-in", // Custom sign-in page
  },
  session: {
    strategy: "jwt", // Use JWT strategy for sessions
    maxAge: 30 * 24 * 60 * 60, // Set session expiration to 30 days
    // More info on session strategies: https://next-auth.js.org/getting-started/options#session
  },
  callbacks: {
    // Callback to add custom user properties to JWT
    // Learn more: https://next-auth.js.org/configuration/callbacks#jwt-callback
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.avatar = user.avatar
        token.email = user.email
        token.status = user.status
      }

      return token
    },
    // Callback to include JWT properties in the session object
    // Learn more: https://next-auth.js.org/configuration/callbacks#session-callback
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.avatar = token.avatar
        session.user.email = token.email
        session.user.status = token.status
      }

      return session
    },
  },
}

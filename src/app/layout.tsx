import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SessionProvider } from "@/components/session-provider" 
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WaHeA - Warm Heart of Malawi",
  description: "Modern e-commerce platform connecting vendors and customers across Malawi",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        <SessionProvider>
          <AuthProvider>
            <CartProvider>
              <SiteHeader />
          
                <main className="min-h-screen">{children}</main>
          
              <SiteFooter />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}

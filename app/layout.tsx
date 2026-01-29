import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { HeaderWrapper } from "@/components/header-wrapper"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { Footer } from "@/components/footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PhotoSpots",
  description: "Interactive map for placing photos",
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning={true}>
      <body className={inter.className}>
        <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <div className="flex flex-col min-h-screen">
              <HeaderWrapper />
              <div className="flex-1 flex flex-col">
          {children}
              </div>
              <Footer />
            </div>
            <Toaster />
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

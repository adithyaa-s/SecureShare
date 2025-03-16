import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SecureShare - End-to-End Encrypted File Sharing",
  description: "Secure file sharing with end-to-end encryption",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} retro-bg`}>{children}</body>
    </html>
  )
}


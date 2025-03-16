import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Shield, Users, FileText } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b-2 border-white">
        <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Shield className="h-6 w-6 text-white" />
            <span>SecureShare</span>
          </div>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <Link href="/login" className="text-sm font-medium hover:underline">
              Login
            </Link>
            <Link href="/register" className="text-sm font-medium hover:underline">
              Register
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Secure File Sharing with End-to-End Encryption
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl">
                  Share your files securely with military-grade encryption, robust authentication, and complete privacy.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="retro-button">
                  <Link href="/register">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="retro-button">
                  <Link href="/learn-more">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2 border-white bg-black">
                <CardHeader>
                  <Shield className="h-10 w-10 text-white mb-2" />
                  <CardTitle>End-to-End Encryption</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your files are encrypted before they leave your device and can only be decrypted by intended
                    recipients.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 border-white bg-black">
                <CardHeader>
                  <Users className="h-10 w-10 text-white mb-2" />
                  <CardTitle>Secure Authentication</CardTitle>
                  <CardDescription className="text-gray-400">
                    Multi-factor authentication and secure session management protect your account.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-2 border-white bg-black">
                <CardHeader>
                  <FileText className="h-10 w-10 text-white mb-2" />
                  <CardTitle>File Access Control</CardTitle>
                  <CardDescription className="text-gray-400">
                    Set permissions, expiration dates, and access limits for shared files.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t-2 border-white py-6">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p className="text-sm text-gray-400">© 2025 SecureShare. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6">
            <Link href="/terms" className="text-sm hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm hover:underline">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}


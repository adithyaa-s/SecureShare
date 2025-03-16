"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Shield, User, LogOut, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DashboardHeader() {
  const router = useRouter()
  const { toast } = useToast()
  const [userName, setUserName] = useState("User") // In a real app, fetch this from your auth state
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    // Show welcome message when component mounts
    setShowWelcome(true)

    // Get username from localStorage if available
    const storedName = localStorage.getItem("userName")
    if (storedName) {
      setUserName(storedName)
    }

    // Show welcome toast
    toast({
      title: `Welcome back, ${storedName || "User"}!`,
      description: "Your secure file sharing dashboard is ready.",
    })
  }, [toast])

  const handleLogout = () => {
    // Clear auth token
    localStorage.removeItem("authToken")

    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    })

    router.push("/login")
  }

  return (
    <header className="retro-header">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Shield className="h-6 w-6 text-white" />
          <span className={showWelcome ? "welcome-animation" : ""}>SecureShare</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:underline">
            Dashboard
          </Link>
          <Link href="/dashboard/activity" className="text-sm font-medium hover:underline">
            Activity
          </Link>
        </nav>
        <div className="ml-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="retro-button">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}


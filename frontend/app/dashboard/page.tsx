"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUploader } from "@/components/file-uploader"
import { FileList } from "@/components/file-list"
import { SharedFileList } from "@/components/shared-file-list"
import { DashboardHeader } from "@/components/dashboard-header"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState([])
  const [sharedFiles, setSharedFiles] = useState([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("authToken")
    if (!token) {
      router.push("/login")
      return
    }

    // Fetch user's files
    const fetchFiles = async () => {
      try {
        // In a real app, this would call your FastAPI backend
        const response = await fetch("/api/files", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch files")
        }

        const data = await response.json()
        setFiles(data.files || [])
        setSharedFiles(data.shared_files || [])
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your files. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [router, toast])

  const handleFileUpload = async (file) => {
    // This would be implemented to handle file encryption and upload
    // In a real app, this would call your FastAPI backend
    toast({
      title: "File upload started",
      description: "Your file is being encrypted and uploaded...",
    })

    // Simulate file upload
    setTimeout(() => {
      setFiles((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          uploaded_at: new Date().toISOString(),
          encrypted: true,
        },
      ])

      toast({
        title: "File uploaded",
        description: "Your file has been encrypted and uploaded successfully.",
      })
    }, 2000)
  }

  const handleFileShare = async (fileId, email) => {
    // This would be implemented to handle file sharing
    // In a real app, this would call your FastAPI backend
    toast({
      title: "File shared",
      description: `File has been securely shared with ${email}.`,
    })
  }

  const handleFileDelete = async (fileId) => {
    // This would be implemented to handle file deletion
    // In a real app, this would call your FastAPI backend
    setFiles((prev) => prev.filter((file) => file.id !== fileId))

    toast({
      title: "File deleted",
      description: "Your file has been permanently deleted.",
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6">
        <h1 className="text-3xl font-bold mb-6">Your Secure Files</h1>

        <Tabs defaultValue="my-files" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my-files">My Files</TabsTrigger>
            <TabsTrigger value="shared-with-me">Shared With Me</TabsTrigger>
            <TabsTrigger value="upload">Upload New File</TabsTrigger>
          </TabsList>

          <TabsContent value="my-files">
            <Card>
              <CardHeader>
                <CardTitle>My Encrypted Files</CardTitle>
                <CardDescription>
                  These files are encrypted and only accessible by you and those you share with.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileList files={files} isLoading={isLoading} onShare={handleFileShare} onDelete={handleFileDelete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shared-with-me">
            <Card>
              <CardHeader>
                <CardTitle>Files Shared With Me</CardTitle>
                <CardDescription>These files have been securely shared with you by other users.</CardDescription>
              </CardHeader>
              <CardContent>
                <SharedFileList files={sharedFiles} isLoading={isLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload New File</CardTitle>
                <CardDescription>Files are encrypted in your browser before being uploaded.</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUploader onUpload={handleFileUpload} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


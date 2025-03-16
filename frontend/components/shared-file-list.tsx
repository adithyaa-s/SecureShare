"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Lock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { socket } from "@/lib/socket"

interface SharedFile {
  id: string
  name: string
  size: number
  shared_at: string
  shared_by: string
  encrypted: boolean
}

interface SharedFileListProps {
  files: SharedFile[]
  isLoading: boolean
}

export function SharedFileList({ files, isLoading }: SharedFileListProps) {
  const { toast } = useToast()

  useEffect(() => {
    // Listen for new shared files
    socket.on("file-shared-with-you", (data) => {
      if (data.recipient === localStorage.getItem("userEmail")) {
        toast({
          title: "New file shared with you",
          description: `${data.sharedBy} has shared "${data.fileName}" with you.`,
        })
      }
    })

    return () => {
      socket.off("file-shared-with-you")
    }
  }, [toast])

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      // In a real app, this would call your API to download and decrypt the file
      const token = localStorage.getItem("authToken")

      // Create a download link
      const response = await fetch(`/api/files/shared/${fileId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Download failed")
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "File downloaded",
        description: `"${fileName}" has been downloaded and decrypted.`,
      })
    } catch (error) {
      console.error("Download failed:", error)
      toast({
        title: "Download failed",
        description: "There was a problem downloading your file.",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 border-2 border-white">
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 bg-white/20" />
              <Skeleton className="h-3 w-24 bg-white/20" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-9 bg-white/20" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-white">
        <User className="mx-auto h-12 w-12 text-white mb-4" />
        <h3 className="text-lg font-medium">No shared files</h3>
        <p className="text-sm text-gray-400 mt-2">When someone shares a file with you, it will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-4 border-2 border-white hover:bg-white/5">
          <div>
            <div className="font-medium">{file.name}</div>
            <div className="text-sm text-gray-400">
              {formatFileSize(file.size)} • Shared by {file.shared_by} on{" "}
              {new Date(file.shared_at).toLocaleDateString()}
              {file.encrypted && (
                <span className="ml-2 inline-flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Encrypted
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              title="Download"
              className="retro-button"
              onClick={() => handleDownload(file.id, file.name)}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}


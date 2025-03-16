"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Share, Trash2, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { socket } from "@/lib/socket"

interface File {
  id: string
  name: string
  size: number
  uploaded_at: string
  encrypted: boolean
}

interface FileListProps {
  files: File[]
  isLoading: boolean
  onShare: (fileId: string, email: string) => Promise<void>
  onDelete: (fileId: string) => Promise<void>
}

export function FileList({ files, isLoading, onShare, onDelete }: FileListProps) {
  const [shareEmail, setShareEmail] = useState("")
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string>("")
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Listen for file share notifications
    socket.on("file-shared", (data) => {
      toast({
        title: "New file shared with you",
        description: `${data.sharedBy} has shared "${data.fileName}" with you.`,
      })
    })

    return () => {
      socket.off("file-shared")
    }
  }, [toast])

  const handleShareClick = (fileId: string, fileName: string) => {
    setSelectedFileId(fileId)
    setSelectedFileName(fileName)
    setIsShareDialogOpen(true)
  }

  const handleDeleteClick = (fileId: string, fileName: string) => {
    setSelectedFileId(fileId)
    setSelectedFileName(fileName)
    setIsDeleteDialogOpen(true)
  }

  const handleShareSubmit = async () => {
    if (selectedFileId && shareEmail) {
      try {
        await onShare(selectedFileId, shareEmail)

        // Show success toast
        toast({
          title: "File shared successfully",
          description: `"${selectedFileName}" has been shared with ${shareEmail}.`,
        })

        // Emit socket event for real-time notification
        socket.emit("share-file", {
          fileId: selectedFileId,
          fileName: selectedFileName,
          sharedWith: shareEmail,
          sharedBy: localStorage.getItem("userName") || "User",
        })

        setShareEmail("")
        setIsShareDialogOpen(false)
      } catch (error) {
        toast({
          title: "Sharing failed",
          description: "There was a problem sharing your file.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteSubmit = async () => {
    if (selectedFileId) {
      try {
        await onDelete(selectedFileId)

        toast({
          title: "File deleted",
          description: `"${selectedFileName}" has been permanently deleted.`,
        })

        setIsDeleteDialogOpen(false)
      } catch (error) {
        toast({
          title: "Deletion failed",
          description: "There was a problem deleting your file.",
          variant: "destructive",
        })
      }
    }
  }

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      // In a real app, this would call your API to download and decrypt the file
      const token = localStorage.getItem("authToken")

      // Create a download link
      const response = await fetch(`/api/files/${fileId}/download`, {
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
              <Skeleton className="h-9 w-9 bg-white/20" />
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
        <Lock className="mx-auto h-12 w-12 text-white mb-4" />
        <h3 className="text-lg font-medium">No files yet</h3>
        <p className="text-sm text-gray-400 mt-2">Upload your first file to get started with secure file sharing.</p>
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
              {formatFileSize(file.size)} • {new Date(file.uploaded_at).toLocaleDateString()}
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
            <Button
              variant="outline"
              size="icon"
              title="Share"
              className="retro-button"
              onClick={() => handleShareClick(file.id, file.name)}
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Delete"
              className="retro-button"
              onClick={() => handleDeleteClick(file.id, file.name)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-black border-2 border-white">
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>
              The file will be securely shared with the recipient. They will receive an email with access instructions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Recipient Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="retro-input"
              />
            </div>
          </div>
          <DialogFooter className="share-animation">
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)} className="retro-button">
              Cancel
            </Button>
            <Button onClick={handleShareSubmit} className="retro-button">
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-black border-2 border-white">
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="retro-button">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSubmit}
              className="retro-button bg-white text-black hover:bg-gray-200"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


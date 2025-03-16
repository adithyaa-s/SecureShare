"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { socket } from "@/lib/socket"

interface FileUploaderProps {
  onUpload: (file: File) => Promise<void>
}

export function FileUploader({ onUpload }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Listen for upload progress updates from socket
    socket.on("upload-progress", (data) => {
      if (selectedFile && data.fileName === selectedFile.name) {
        setUploadProgress(data.progress)
      }
    })

    return () => {
      socket.off("upload-progress")
    }
  }, [selectedFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setIsComplete(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
      setIsComplete(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    // Emit socket event to start tracking upload
    socket.emit("start-upload", { fileName: selectedFile.name })

    try {
      await onUpload(selectedFile)
      setIsComplete(true)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Show success toast
      toast({
        title: "File uploaded successfully!",
        description: `${selectedFile.name} has been encrypted and uploaded.`,
      })

      // Emit socket event to notify other users
      socket.emit("file-uploaded", {
        fileName: selectedFile.name,
        size: selectedFile.size,
        uploadedBy: localStorage.getItem("userName") || "User",
      })
    } catch (error) {
      console.error("Upload failed:", error)
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file.",
        variant: "destructive",
      })
    } finally {
      setUploadProgress(100)
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 1000)
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-white rounded-none p-6 text-center ${
          isDragging ? "bg-white/10" : ""
        } ${isUploading ? "file-upload-animation" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-white mb-4" />
        <h3 className="text-lg font-medium mb-2">
          {isDragging ? "Drop your file here" : "Drag and drop your file here"}
        </h3>
        <p className="text-sm text-gray-400 mb-4">or click to browse from your computer</p>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} id="file-upload" />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="retro-button"
        >
          Select File
        </Button>
      </div>

      {selectedFile && (
        <div className="bg-black border-2 border-white p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="text-sm font-medium">{selectedFile.name}</div>
              <div className="text-xs text-gray-400 ml-2">({Math.round(selectedFile.size / 1024)} KB)</div>
            </div>
            {!isUploading && (
              <Button variant="ghost" size="icon" onClick={clearSelectedFile} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2 bg-gray-800" />
              <div className="text-xs text-gray-400 text-right">{uploadProgress}%</div>
            </div>
          )}

          {!isUploading && !isComplete && (
            <Button onClick={handleUpload} className="w-full mt-2 retro-button">
              Upload and Encrypt
            </Button>
          )}

          {isComplete && (
            <div className="flex items-center text-green-500 mt-2">
              <Check className="h-4 w-4 mr-2" />
              <span className="text-sm">Upload complete</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


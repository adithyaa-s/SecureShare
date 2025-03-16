import { NextResponse } from "next/server"

// In a real app, this would connect to your FastAPI backend
export async function GET(request: Request) {
  try {
    // Check authorization
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Mock data for demonstration
    const files = [
      {
        id: "1",
        name: "confidential-report.pdf",
        size: 2540000,
        uploaded_at: new Date().toISOString(),
        encrypted: true,
      },
      {
        id: "2",
        name: "financial-data.xlsx",
        size: 1250000,
        uploaded_at: new Date(Date.now() - 86400000).toISOString(),
        encrypted: true,
      },
    ]

    const shared_files = [
      {
        id: "3",
        name: "project-proposal.docx",
        size: 1800000,
        shared_at: new Date(Date.now() - 172800000).toISOString(),
        shared_by: "jane.doe@example.com",
        encrypted: true,
      },
    ]

    return NextResponse.json({ files, shared_files })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


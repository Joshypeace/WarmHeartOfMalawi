import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("images") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    // Validate files
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Invalid file type. Only JPG, PNG, and WebP are allowed." },
          { status: 400 }
        )
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File too large. Maximum size is 10MB." },
          { status: 400 }
        )
      }
    }

    // Create uploads directory
    const uploadsDir = join(process.cwd(), "public/uploads/products")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const imageUrls: string[] = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const originalName = file.name.toLowerCase().replace(/\s+/g, "-")
      const filename = `${timestamp}-${randomString}-${originalName}`
      const filepath = join(uploadsDir, filename)

      // Write file to filesystem
      await writeFile(filepath, buffer)
      
      // Store relative URL for database
      imageUrls.push(`/uploads/products/${filename}`)
    }

    return NextResponse.json({ 
      success: true,
      imageUrls 
    })

  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    )
  }
}
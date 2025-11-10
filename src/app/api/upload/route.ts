// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is a vendor
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    })

    if (!user || (user.role !== 'VENDOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: "Access denied. Vendor role required." }, { status: 403 })
    }

    const formData = await request.formData()
    const files = formData.getAll("images") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 })
    }

    // Validate files
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB total for all files
    const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const MAX_FILES = 10 // Maximum files per upload

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Too many files. Maximum ${MAX_FILES} files allowed per upload.` },
        { status: 400 }
      )
    }

    let totalSize = 0
    const validatedFiles: File[] = []

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only JPG, PNG, and WebP are allowed.` },
          { status: 400 }
        )
      }
      
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Maximum size is 10MB.` },
          { status: 400 }
        )
      }

      totalSize += file.size
      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json(
          { error: "Total upload size exceeds 50MB limit." },
          { status: 400 }
        )
      }

      validatedFiles.push(file)
    }

    // Create uploads directory with vendor-specific subfolder
    const vendorId = session.user.id
    const uploadsDir = join(process.cwd(), "public/uploads/products", vendorId)
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    const imageUrls: string[] = []

    for (const file of validatedFiles) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const originalName = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "-")
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filename = `${timestamp}-${randomString}.${fileExtension}`
      const filepath = join(uploadsDir, filename)

      try {
        // Write file to filesystem
        await writeFile(filepath, buffer)
        
        // Store relative URL for database
        imageUrls.push(`/uploads/products/${vendorId}/${filename}`)
      } catch (writeError) {
        console.error(`Failed to write file ${filename}:`, writeError)
        return NextResponse.json(
          { error: `Failed to save file: ${file.name}` },
          { status: 500 }
        )
      }
    }

    console.log(`Uploaded ${imageUrls.length} images for vendor ${vendorId}`)

    return NextResponse.json({ 
      success: true,
      message: `Successfully uploaded ${imageUrls.length} images`,
      imageUrls,
      totalSize: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    })

  } catch (error) {
    console.error("Upload error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    )
  }
}

// Optional: Add GET method to check upload status/limits
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      limits: {
        maxFileSize: "10MB",
        maxTotalSize: "50MB",
        maxFiles: 10,
        allowedTypes: ["JPG", "PNG", "WebP"]
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get upload info" },
      { status: 500 }
    )
  }
}
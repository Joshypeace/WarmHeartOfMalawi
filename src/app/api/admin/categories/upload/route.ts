// app/api/admin/categories/upload/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Authentication check - admin only
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is admin
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`)
    const sessionData = await response.json()
    
    if (sessionData.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only JPG, PNG, WebP, and SVG are allowed." 
      }, { status: 400 })
    }

    // Validate file size (max 2MB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: "File too large. Maximum size is 2MB." 
      }, { status: 400 })
    }

    // Create uploads directory for categories
    const uploadsDir = join(process.cwd(), "public/uploads/categories")
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const originalName = file.name.toLowerCase().replace(/\s+/g, "-")
    const fileExtension = originalName.split('.').pop()
    const filename = `category-${timestamp}-${randomString}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    // Write file to filesystem
    await writeFile(filepath, buffer)
    
    // Return relative URL for database
    const imageUrl = `/uploads/categories/${filename}`

    return NextResponse.json({ 
      success: true,
      message: "Image uploaded successfully",
      imageUrl 
    })

  } catch (error) {
    console.error("Category image upload error:", error)
    return NextResponse.json({ 
      error: "Failed to upload image" 
    }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
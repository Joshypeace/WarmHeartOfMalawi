// app/api/vendors/districts/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Get districts from approved vendors
    const districts = await prisma.vendorShop.findMany({
      where: {
        isApproved: true,
        isRejected: false
      },
      select: {
        district: true
      },
      distinct: ['district']
    })

    // Extract and filter districts
    const uniqueDistricts = districts
      .map(d => d.district)
      .filter((d): d is string => !!d && d.trim() !== '')
      .sort()

    return NextResponse.json({
      success: true,
      data: uniqueDistricts
    })

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to load districts"
      },
      { status: 500 }
    )
  }
}
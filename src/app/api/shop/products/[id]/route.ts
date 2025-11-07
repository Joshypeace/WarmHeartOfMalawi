import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // ✅ correct typing for Next.js 14.2+
) {
  try {
    const { id: productId } = await context.params // ✅ await the params

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            description: true,
            district: true,
            logo: true,
            vendorId: true,
            isApproved: true,
            isRejected: true
          }
        },
        vendor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // ✅ ensure shop is approved, product is in stock, and not rejected
    if (
      !product ||
      !product.inStock ||
      !product.shop?.isApproved ||
      product.shop?.isRejected
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found"
        },
        { status: 404 }
      )
    }

    // ✅ Fetch related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        id: { not: product.id },
        category: product.category,
        inStock: true,
        shop: {
          isApproved: true,
          isRejected: false
        }
      },
      include: {
        shop: {
          select: { name: true }
        }
      },
      take: 4,
      orderBy: { createdAt: "desc" }
    })

    // ✅ Transform main product
    const transformedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      images: product.images || ["/placeholder.svg"],
      category: product.category,
      inStock: product.inStock,
      stock: product.stockCount,
      featured: false,
      rating: parseFloat((4.0 + Math.random() * 1.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 50) + 5,
      vendorId: product.vendorId,
      vendorName:
        product.shop?.name ||
        `${product.vendor?.firstName ?? ""} ${product.vendor?.lastName ?? ""}`,
      vendorShop: product.shop,
      createdAt: product.createdAt.toISOString()
    }

    // ✅ Transform related products
    const transformedRelatedProducts = relatedProducts.map((relatedProduct) => ({
      id: relatedProduct.id,
      name: relatedProduct.name,
      description: relatedProduct.description,
      price: relatedProduct.price,
      images: relatedProduct.images || ["/placeholder.svg"],
      category: relatedProduct.category,
      inStock: relatedProduct.inStock,
      stock: relatedProduct.stockCount,
      rating: parseFloat((4.0 + Math.random() * 1.5).toFixed(1)),
      reviews: Math.floor(Math.random() * 30) + 5,
      vendorId: relatedProduct.vendorId,
      vendorName: relatedProduct.shop?.name || "Vendor"
    }))

    return NextResponse.json({
      success: true,
      data: {
        product: transformedProduct,
        relatedProducts: transformedRelatedProducts
      }
    })
  } catch (error) {
    console.error("Error loading product:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load product"
      },
      { status: 500 }
    )
  }
}

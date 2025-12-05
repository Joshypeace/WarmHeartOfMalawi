// app/vendor/products/[id]/edit/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Upload, Trash2, Plus, Minus, Loader2, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import React from "react"

interface Product {
  id: string
  name: string
  description: string
  price: number
  images: string[]
  category: string
  categoryId?: string
  inStock: boolean
  stockCount: number
  featured: boolean
  rating: number | null
  reviews: number | null
  brand: string | null
  size: string | null
  color: string | null
  material: string | null
}

interface ManagedCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
  productCount: number
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_IMAGES = 10

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  
  // Image states
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  
  // Managed categories state
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  
  // Properly unwrap the params Promise
  const resolvedParams = React.use(params)
  const { id } = resolvedParams

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category: "",
    stockCount: 0,
    inStock: true,
    featured: false,
    brand: "",
    size: "",
    color: "",
    material: "",
  })

  // Separate states for sizes and colors arrays
  const [sizes, setSizes] = useState<string[]>([""])
  const [colors, setColors] = useState<string[]>([""])

  // Fetch managed categories
  useEffect(() => {
    const fetchManagedCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/admin/categories')
        const result = await response.json()
        
        if (result.success) {
          setManagedCategories(result.data.categories)
        } else {
          console.error('Failed to fetch categories:', result.error)
          setManagedCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setManagedCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchManagedCategories()
  }, [])

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/vendor/products/${id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch product')
        }

        const data = await response.json()
        
        if (data.success && data.data) {
          const productData = data.data.product
          setProduct(productData)
          
          // Use categoryId if available, otherwise fallback to category name
          const categoryValue = productData.categoryId || productData.category
          
          // Parse sizes and colors from comma-separated strings to arrays
          const sizeArray = productData.size ? productData.size.split(",").map((s: string) => s.trim()) : [""]
          const colorArray = productData.color ? productData.color.split(",").map((c: string) => c.trim()) : [""]
          
          setFormData({
            name: productData.name,
            description: productData.description,
            price: productData.price,
            category: categoryValue,
            stockCount: productData.stockCount,
            inStock: productData.inStock,
            featured: productData.featured || false,
            brand: productData.brand || "",
            size: productData.size || "",
            color: productData.color || "",
            material: productData.material || "",
          })
          
          // Set existing images
          setImagePreviews(productData.images || [])
          
          // Set the arrays for sizes and colors
          setSizes(sizeArray.length > 0 ? sizeArray : [""])
          setColors(colorArray.length > 0 ? colorArray : [""])
        } else {
          throw new Error(data.error || 'Product not found')
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id, toast])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  // Size management functions
  const addSize = () => {
    setSizes(prev => [...prev, ""])
  }

  const removeSize = (index: number) => {
    if (sizes.length > 1) {
      setSizes(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateSize = (index: number, value: string) => {
    setSizes(prev => {
      const newSizes = [...prev]
      newSizes[index] = value
      return newSizes
    })
  }

  // Color management functions
  const addColor = () => {
    setColors(prev => [...prev, ""])
  }

  const removeColor = (index: number) => {
    if (colors.length > 1) {
      setColors(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateColor = (index: number, value: string) => {
    setColors(prev => {
      const newColors = [...prev]
      newColors[index] = value
      return newColors
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: File[] = []
    const newPreviews: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload only JPG, PNG, or WebP images.",
          variant: "destructive",
        })
        continue
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Please upload images smaller than 10MB.",
          variant: "destructive",
        })
        continue
      }

      newImages.push(file)
      
      const previewUrl = URL.createObjectURL(file)
      newPreviews.push(previewUrl)
    }

    const totalImages = imagePreviews.length + newPreviews.length
    if (totalImages > MAX_IMAGES) {
      const allowedNewImages = MAX_IMAGES - imagePreviews.length
      toast({
        title: "Too many images",
        description: `You can upload up to ${MAX_IMAGES} images maximum. ${allowedNewImages} more allowed.`,
        variant: "destructive",
      })
      return
    }

    setImages(prev => [...prev, ...newImages])
    setImagePreviews(prev => [...prev, ...newPreviews])

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    // Check if it's a new file or existing URL
    if (index < imagePreviews.length) {
      const preview = imagePreviews[index]
      // If it's a blob URL (new file), revoke it
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
      
      // Remove from images if it was a new file
      if (index < images.length) {
        setImages(prev => prev.filter((_, i) => i !== index))
      }
      
      // Remove from previews
      setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    
    if (files.length > 0) {
      const fakeEvent = {
        target: {
          files: e.dataTransfer.files
        }
      } as React.ChangeEvent<HTMLInputElement>
      
      handleFileSelect(fakeEvent)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const uploadImagesToServer = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return []

    const uploadFormData = new FormData()
    files.forEach(file => {
      uploadFormData.append("images", file)
    })

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload images")
      }

      return result.imageUrls || []
    } catch (error) {
      console.error("Image upload error:", error)
      throw new Error("Failed to upload product images")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // Upload new images first
      let newImageUrls: string[] = []
      if (images.length > 0) {
        newImageUrls = await uploadImagesToServer(images)
      }

      // Find the category name from the ID for backward compatibility
      const selectedCategory = managedCategories.find(cat => cat.id === formData.category)
      
      if (!selectedCategory && formData.category) {
        throw new Error("Please select a valid category")
      }
      
      // Filter out empty sizes and colors
      const filteredSizes = sizes.filter(size => size.trim() !== "")
      const filteredColors = colors.filter(color => color.trim() !== "")
      
      // Combine existing image URLs with newly uploaded ones
      const existingImageUrls = imagePreviews.filter(preview => !preview.startsWith('blob:'))
      const allImageUrls = [...existingImageUrls, ...newImageUrls]
      
      const updateData = {
        ...formData,
        category: selectedCategory?.name || formData.category,
        categoryId: formData.category,
        images: allImageUrls,
        // Combine sizes/colors arrays into comma-separated strings
        size: filteredSizes.length > 0 ? filteredSizes.join(", ") : undefined,
        color: filteredColors.length > 0 ? filteredColors.join(", ") : undefined,
        // Convert empty strings to undefined for optional fields
        brand: formData.brand.trim() || undefined,
        material: formData.material.trim() || undefined,
      }

      const response = await fetch(`/api/vendor/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Product updated successfully",
        })
        
        // Clean up blob URLs
        imagePreviews.forEach(preview => {
          if (preview.startsWith('blob:')) {
            URL.revokeObjectURL(preview)
          }
        })
        
        router.push('/vendor/products')
      } else {
        throw new Error(data.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-6 px-4 max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-32 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Button onClick={() => router.push('/vendor/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  const isFormValid = formData.name && 
                     formData.description && 
                     formData.price && 
                     formData.category && 
                     formData.stockCount !== undefined

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 px-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/vendor/products')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Product</h1>
              <p className="text-muted-foreground">Update your product details</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Product Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter product name"
                      required
                      disabled={saving}
                      maxLength={255}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.name.length}/255 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter product description"
                      rows={4}
                      required
                      disabled={saving}
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/2000 characters
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (MWK) *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        required
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stockCount">Stock Quantity *</Label>
                      <Input
                        id="stockCount"
                        type="number"
                        value={formData.stockCount}
                        onChange={(e) => handleInputChange('stockCount', parseInt(e.target.value) || 0)}
                        placeholder="0"
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* Updated Category Select */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                      disabled={saving || categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="ml-2 text-sm text-muted-foreground">Loading categories...</span>
                          </div>
                        ) : managedCategories.length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No categories available
                          </div>
                        ) : (
                          managedCategories
                            .filter(category => category.isActive)
                            .map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                    {!categoriesLoading && managedCategories.filter(cat => cat.isActive).length === 0 && (
                      <p className="text-xs text-amber-600">
                        No active categories available. Please contact administrator.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Optional Fields Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Additional Details (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => handleInputChange('brand', e.target.value)}
                      placeholder="e.g., Apple, Nike, Local Brand"
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty if not applicable
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Sizes</Label>
                    <div className="space-y-2">
                      {sizes.map((size, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="e.g., Small, Medium, Large, 10, 42, etc."
                            value={size}
                            onChange={(e) => updateSize(index, e.target.value)}
                            disabled={saving}
                            className="flex-1"
                          />
                          {sizes.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeSize(index)}
                              disabled={saving}
                              className="shrink-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSize}
                      disabled={saving}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Size Option
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Add multiple sizes separated by commas. Leave empty if not applicable.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Colors</Label>
                    <div className="space-y-2">
                      {colors.map((color, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            placeholder="e.g., Red, Blue, Black, #FF0000"
                            value={color}
                            onChange={(e) => updateColor(index, e.target.value)}
                            disabled={saving}
                            className="flex-1"
                          />
                          {colors.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeColor(index)}
                              disabled={saving}
                              className="shrink-0"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addColor}
                      disabled={saving}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Color Option
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Add multiple colors. Use color names or hex codes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Input
                      id="material"
                      value={formData.material}
                      onChange={(e) => handleInputChange('material', e.target.value)}
                      placeholder="e.g., Cotton, Leather, Wood, Metal"
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty if not applicable
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Images & Settings */}
            <div className="space-y-6">
              {/* Images Card - Updated with file upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="images">Product Images</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload up to {MAX_IMAGES} images. The first image will be used as the main display image.
                    </p>
                  </div>
                  
                  <input
                    id="images"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg, image/jpg, image/png, image/webp"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={saving}
                  />
                  
                  <div
                    onClick={() => !saving && fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                      ${saving 
                        ? "border-gray-300 bg-gray-50 cursor-not-allowed" 
                        : imagePreviews.length >= MAX_IMAGES
                        ? "border-green-200 bg-green-50 cursor-not-allowed"
                        : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
                      }`}
                  >
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-lg font-medium mb-1">
                      {imagePreviews.length >= MAX_IMAGES ? "Maximum images reached" : "Add Product Images"}
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {imagePreviews.length >= MAX_IMAGES 
                        ? `You've reached the maximum of ${MAX_IMAGES} images`
                        : "Click to upload or drag and drop"
                      }
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, WebP up to 10MB each
                    </p>
                    {imagePreviews.length > 0 && (
                      <p className="text-sm text-green-600 mt-2 font-medium">
                        {imagePreviews.length} of {MAX_IMAGES} images selected
                      </p>
                    )}
                  </div>

                  {/* Image Previews Grid */}
                  {imagePreviews.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Image Previews ({imagePreviews.length}/{MAX_IMAGES})</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImages([])
                            setImagePreviews(prev => {
                              prev.forEach(url => {
                                if (url.startsWith('blob:')) {
                                  URL.revokeObjectURL(url)
                                }
                              })
                              return []
                            })
                          }}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Clear All New Images
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square rounded-lg border-2 overflow-hidden bg-muted">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {index === 0 && (
                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                  Main
                                </div>
                              )}
                            </div>
                            
                            {/* Image Info */}
                            {preview.startsWith('blob:') && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-1">
                                <p className="text-xs truncate">
                                  New Image
                                </p>
                              </div>
                            )}

                            {/* Remove Button */}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              onClick={() => removeImage(index)}
                              disabled={saving}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        
                        {/* Add More Images Button */}
                        {imagePreviews.length < MAX_IMAGES && (
                          <div
                            onClick={() => !saving && fileInputRef.current?.click()}
                            className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                          >
                            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground text-center px-1">
                              Add More Images
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Image Tips */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="font-medium text-blue-900 mb-1 text-sm">Image Tips</h4>
                        <ul className="text-xs text-blue-800 space-y-0.5">
                          <li>• First image will be the main display image</li>
                          <li>• Use high-quality, well-lit photos</li>
                          <li>• Show different angles of your product</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="inStock" className="text-base">In Stock</Label>
                      <p className="text-sm text-muted-foreground">
                        Product will be shown as available for purchase
                      </p>
                    </div>
                    <Switch
                      id="inStock"
                      checked={formData.inStock}
                      onCheckedChange={(checked) => handleSwitchChange("inStock", checked)}
                      disabled={saving}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label htmlFor="featured" className="text-base">Featured Product</Label>
                      <p className="text-sm text-muted-foreground">
                        Featured products appear prominently on the homepage
                      </p>
                    </div>
                    <Switch
                      id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => handleSwitchChange("featured", checked)}
                      disabled={saving}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={!isFormValid || saving || imagePreviews.length === 0}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
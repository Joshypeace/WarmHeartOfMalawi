"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Loader2, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ProtectedRoute from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"

const categories = ["Crafts", "Food", "Textiles", "Art", "Jewelry", "Home Decor", "Clothing", "Accessories"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_IMAGES = 10 // Increased from 5 to 10

function AddProductContent() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: File[] = []
    const newPreviews: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload only JPG, PNG, or WebP images.",
          variant: "destructive",
        })
        continue
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: "Please upload images smaller than 10MB.",
          variant: "destructive",
        })
        continue
      }

      newImages.push(file)
      
      // Create preview
      const previewUrl = URL.createObjectURL(file)
      newPreviews.push(previewUrl)
    }

    // Check image limit
    const totalImages = images.length + newImages.length
    if (totalImages > MAX_IMAGES) {
      const allowedNewImages = MAX_IMAGES - images.length
      toast({
        title: "Too many images",
        description: `You can upload up to ${MAX_IMAGES} images maximum. ${allowedNewImages} more allowed.`,
        variant: "destructive",
      })
      return
    }

    setImages(prev => [...prev, ...newImages])
    setImagePreviews(prev => [...prev, ...newPreviews])

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index]) // Clean up memory
      return newPreviews.filter((_, i) => i !== index)
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    
    if (files.length > 0) {
      // Create a fake event to reuse the file selection logic
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
    setIsSubmitting(true)

    try {
      // Upload images first
      let imageUrls: string[] = []
      if (images.length > 0) {
        imageUrls = await uploadImagesToServer(images)
      }

      // Create product with backend API
      const response = await fetch("/api/vendor/products/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create product")
      }

      toast({
        title: "Success!",
        description: result.message || "Product created successfully",
        variant: "default",
      })

      // Clean up image preview URLs
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview))

      // Redirect to products page
      router.push("/vendor/products")
      
    } catch (error) {
      console.error("Product creation error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = formData.name && 
                     formData.description && 
                     formData.price && 
                     formData.category && 
                     formData.stock

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="mb-6"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>

        <h1 className="text-4xl font-bold mb-8">Add New Product</h1>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Handwoven Basket"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.name.length}/255 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your product in detail..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={5}
                  required
                  disabled={isSubmitting}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.description.length}/2000 characters
                </p>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price and Stock */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (MWK) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="2500"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    placeholder="15"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Product Images - Enhanced Section */}
              <div className="space-y-4">
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
                  disabled={isSubmitting}
                />
                
                {/* Upload Area */}
                <div
                  onClick={() => !isSubmitting && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${isSubmitting 
                      ? "border-gray-300 bg-gray-50 cursor-not-allowed" 
                      : images.length >= MAX_IMAGES
                      ? "border-green-200 bg-green-50 cursor-not-allowed"
                      : "border-muted-foreground/25 hover:border-primary hover:bg-primary/5"
                    }`}
                >
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {images.length >= MAX_IMAGES ? "Maximum images reached" : "Add Product Images"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    {images.length >= MAX_IMAGES 
                      ? `You've reached the maximum of ${MAX_IMAGES} images`
                      : "Click to upload or drag and drop"
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP up to 10MB each
                  </p>
                  {images.length > 0 && (
                    <p className="text-sm text-green-600 mt-2 font-medium">
                      {images.length} of {MAX_IMAGES} images selected
                    </p>
                  )}
                </div>

                {/* Enhanced Image Previews Grid */}
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
                            prev.forEach(url => URL.revokeObjectURL(url))
                            return []
                          })
                        }}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                            <p className="text-xs truncate">
                              {images[index]?.name}
                            </p>
                            <p className="text-xs opacity-75">
                              {(images[index]?.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>

                          {/* Remove Button */}
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => removeImage(index)}
                            disabled={isSubmitting}
                          >
                            <X className="h-3 w-3" />
                          </Button>

                          {/* Drag Handle (for future reordering) */}
                          <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            <ImageIcon className="h-3 w-3" />
                          </div>
                        </div>
                      ))}
                      
                      {/* Add More Images Button */}
                      {imagePreviews.length < MAX_IMAGES && (
                        <div
                          onClick={() => !isSubmitting && fileInputRef.current?.click()}
                          className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground text-center px-2">
                            Add More Images
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Image Tips */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Image Tips</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• First image will be the main display image</li>
                        <li>• Use high-quality, well-lit photos</li>
                        <li>• Show different angles of your product</li>
                        <li>• Include close-ups of important details</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-6 border-t">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  size="lg"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Product...
                    </>
                  ) : (
                    "Create Product"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="lg"
                  onClick={() => router.back()} 
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}

export default function AddProductPage() {
  return (
    <ProtectedRoute allowedRoles={["VENDOR"]}>
      <AddProductContent />
    </ProtectedRoute>
  )
}
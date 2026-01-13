"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, Loader2, X, Image as ImageIcon, Plus, Minus, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProtectedRoute from "@/components/protected-route"
import { useToast } from "@/hooks/use-toast"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_IMAGES = 10

interface ManagedCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
  productCount: number
  parentId: string | null
  type: 'MAIN' | 'SUB'
}

interface CategoryAttribute {
  id: string
  attributeName: string
  attributeType: 'text' | 'number' | 'select' | 'color' | 'boolean' | 'range'
  filterType: 'text_input' | 'dropdown' | 'checkbox' | 'range_slider' | 'color_swatch' | 'toggle'
  options: string[]
  units?: string
  isRequired: boolean
  isFilterable: boolean
  placeholder?: string
  sortOrder: number
  minValue?: number
  maxValue?: number
}

interface AttributeValue {
  attributeId: string
  attributeName: string
  value: any
  type: string
  units?: string
}

function AddProductContent() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  
  const [managedCategories, setManagedCategories] = useState<ManagedCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([])
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [expandedAttributes, setExpandedAttributes] = useState<Set<string>>(new Set())
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    brand: "",
    material: "",
    featured: false,
  })

  const [attributeValues, setAttributeValues] = useState<Record<string, AttributeValue>>({})
  const [customAttributes, setCustomAttributes] = useState<Array<{name: string, value: string}>>([])

  // Fetch categories
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

  // Fetch attributes when category changes
  useEffect(() => {
    const fetchCategoryAttributes = async () => {
      if (!formData.category) {
        setCategoryAttributes([])
        setAttributeValues({})
        return
      }

      try {
        setAttributesLoading(true)
        const response = await fetch(`/api/categories/${formData.category}/attributes`)
        const result = await response.json()
        
        if (result.success) {
          const attributes = result.data.attributes || []
          setCategoryAttributes(attributes)
          
          // Initialize attribute values
          const initialValues: Record<string, AttributeValue> = {}
          attributes.forEach((attr: CategoryAttribute) => {
            initialValues[attr.id] = {
              attributeId: attr.id,
              attributeName: attr.attributeName,
              value: '',
              type: attr.attributeType,
              units: attr.units
            }
          })
          setAttributeValues(initialValues)
        } else {
          setCategoryAttributes([])
          setAttributeValues({})
        }
      } catch (error) {
        console.error('Error fetching attributes:', error)
        setCategoryAttributes([])
        setAttributeValues({})
      } finally {
        setAttributesLoading(false)
      }
    }

    fetchCategoryAttributes()
  }, [formData.category])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const updateAttributeValue = (attributeId: string, value: any) => {
    setAttributeValues(prev => ({
      ...prev,
      [attributeId]: {
        ...prev[attributeId],
        value
      }
    }))
  }

  const toggleAttributeExpansion = (attributeId: string) => {
    const newExpanded = new Set(expandedAttributes)
    if (newExpanded.has(attributeId)) {
      newExpanded.delete(attributeId)
    } else {
      newExpanded.add(attributeId)
    }
    setExpandedAttributes(newExpanded)
  }

  const addCustomAttribute = () => {
    setCustomAttributes(prev => [...prev, { name: '', value: '' }])
  }

  const updateCustomAttribute = (index: number, field: 'name' | 'value', value: string) => {
    setCustomAttributes(prev => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
  }

  const removeCustomAttribute = (index: number) => {
    setCustomAttributes(prev => prev.filter((_, i) => i !== index))
  }

  // File handling functions (keep your existing handleFileSelect, removeImage, etc.)
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

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      const newPreviews = [...prev]
      URL.revokeObjectURL(newPreviews[index])
      return newPreviews.filter((_, i) => i !== index)
    })
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

  const validateAttributeValues = () => {
    const errors: string[] = []
    
    categoryAttributes.forEach(attr => {
      if (attr.isRequired) {
        const value = attributeValues[attr.id]?.value
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(`${attr.attributeName} is required`)
        }
      }
    })
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required attributes
    const attributeErrors = validateAttributeValues()
    if (attributeErrors.length > 0) {
      toast({
        title: "Missing required information",
        description: attributeErrors.join(', '),
        variant: "destructive",
      })
      setActiveTab("specifications")
      return
    }
    
    setIsSubmitting(true)

    try {
      let imageUrls: string[] = []
      if (images.length > 0) {
        imageUrls = await uploadImagesToServer(images)
      }

      const selectedCategory = managedCategories.find(cat => cat.id === formData.category)
      let parentCategory = null
      if (selectedCategory) {
         if (selectedCategory.type === 'SUB' && selectedCategory.parentId) {
          parentCategory = managedCategories.find(cat => cat.id === selectedCategory.parentId)
        }
      }
       
      const categoryName = parentCategory 
        ? `${parentCategory.name} - ${selectedCategory?.name}`
        : selectedCategory?.name

      // Prepare attribute values
      const preparedAttributes = Object.values(attributeValues)
        .filter(attr => attr.value !== '' && attr.value !== null && attr.value !== undefined)
        .map(attr => ({
          attributeId: attr.attributeId,
          attributeName: attr.attributeName,
          value: attr.value,
          type: attr.type,
          units: attr.units
        }))

      // Prepare custom attributes
      const preparedCustomAttributes = customAttributes
        .filter(attr => attr.name.trim() && attr.value.trim())
        .map(attr => ({
          name: attr.name.trim(),
          value: attr.value.trim(),
          type: 'custom'
        }))

      const productData = {
        ...formData,
        category: categoryName,
        categoryId: formData.category,
        images: imageUrls,
        brand: formData.brand.trim() || undefined,
        material: formData.material.trim() || undefined,
        attributes: [...preparedAttributes, ...preparedCustomAttributes]
      }

      const response = await fetch("/api/vendor/products/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
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

      imagePreviews.forEach(preview => URL.revokeObjectURL(preview))

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

  const getCategoryHierarchyName = (category: ManagedCategory, categories: ManagedCategory[]): string => {
    if (category.type === 'SUB' && category.parentId) {
      const parent = categories.find(c => c.id === category.parentId)
      return parent ? `${parent.name} - ${category.name}` : category.name
    }
    return category.name
  }

  const renderAttributeField = (attribute: CategoryAttribute) => {
    const attrValue = attributeValues[attribute.id]
    const isExpanded = expandedAttributes.has(attribute.id)
    
    return (
      <div key={attribute.id} className="space-y-2 border rounded-lg p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleAttributeExpansion(attribute.id)}
        >
          <div className="flex items-center gap-2">
            <Label className="font-medium cursor-pointer">
              {attribute.attributeName}
              {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Badge variant="outline">{attribute.attributeType}</Badge>
            {attribute.isFilterable && (
              <Badge variant="secondary">Filterable</Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
        
        {isExpanded && (
          <div className="pt-2 space-y-3">
            {attribute.attributeType === 'text' && (
              <Input
                value={attrValue?.value || ''}
                onChange={(e) => updateAttributeValue(attribute.id, e.target.value)}
                placeholder={attribute.placeholder || `Enter ${attribute.attributeName.toLowerCase()}`}
                disabled={isSubmitting}
              />
            )}
            
            {attribute.attributeType === 'number' && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={attrValue?.value || ''}
                  onChange={(e) => updateAttributeValue(attribute.id, e.target.value)}
                  placeholder={`Enter ${attribute.attributeName.toLowerCase()}`}
                  disabled={isSubmitting}
                  className="flex-1"
                />
                {attribute.units && (
                  <div className="flex items-center px-3 border rounded-md bg-muted">
                    <span className="text-sm text-muted-foreground">{attribute.units}</span>
                  </div>
                )}
              </div>
            )}
            
            {attribute.attributeType === 'select' && (
              <Select
                value={attrValue?.value || ''}
                onValueChange={(value) => updateAttributeValue(attribute.id, value)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${attribute.attributeName.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {attribute.options.map((option, idx) => (
                    <SelectItem key={idx} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {attribute.attributeType === 'color' && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {attribute.options.map((color, idx) => (
                    <div
                      key={idx}
                      className={`w-8 h-8 rounded-full border-2 cursor-pointer ${
                        attrValue?.value === color ? 'border-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateAttributeValue(attribute.id, color)}
                      title={color}
                    />
                  ))}
                </div>
                <Input
                  value={attrValue?.value || ''}
                  onChange={(e) => updateAttributeValue(attribute.id, e.target.value)}
                  placeholder="Or enter custom color"
                  disabled={isSubmitting}
                />
              </div>
            )}
            
            {attribute.attributeType === 'boolean' && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={attrValue?.value === 'Yes' || attrValue?.value === true}
                  onCheckedChange={(checked) => updateAttributeValue(attribute.id, checked ? 'Yes' : 'No')}
                  disabled={isSubmitting}
                />
                <Label>{attrValue?.value === 'Yes' ? 'Yes' : 'No'}</Label>
              </div>
            )}
            
            {attribute.attributeType === 'range' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={attrValue?.value || ''}
                    onChange={(e) => updateAttributeValue(attribute.id, e.target.value)}
                    placeholder={`Enter ${attribute.attributeName.toLowerCase()}`}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                  {attribute.units && (
                    <span className="text-sm text-muted-foreground">{attribute.units}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Range: {attribute.minValue || 0} to {attribute.maxValue || 100} {attribute.units}
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {attribute.isRequired 
                ? "This field is required and will be used for filtering products"
                : "This information will be used for filtering products"
              }
            </p>
          </div>
        )}
      </div>
    )
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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="specifications">Specifications</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-6 pt-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      disabled={isSubmitting || categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                            <span className="ml-2 text-sm text-muted-foreground">Loading categories...</span>
                          </div>
                        ) : managedCategories.length === 0 ? (
                          <div className="text-center py-4 text-sm text-muted-foreground">
                            No categories available. Please contact admin.
                          </div>
                        ) : (
                          managedCategories
                            .filter(category => category.isActive)
                            .map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {getCategoryHierarchyName(category, managedCategories)}
                                {category.type === 'SUB' && (
                                  <span className="text-xs text-muted-foreground ml-2">(Subcategory)</span>
                                )}
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

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        name="brand"
                        placeholder="e.g., Apple, Nike, Local Brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material">Material</Label>
                      <Input
                        id="material"
                        name="material"
                        placeholder="e.g., Cotton, Leather, Wood, Metal"
                        value={formData.material}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      />
                    </div>
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
                      disabled={isSubmitting}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="specifications" className="space-y-6 pt-4">
                  {attributesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading category specifications...</p>
                    </div>
                  ) : categoryAttributes.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-4">
                        {formData.category 
                          ? "This category doesn't have any specifications defined."
                          : "Select a category first to see specifications."
                        }
                      </p>
                      {formData.category && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push('/admin/categories')}
                        >
                          Contact Admin for Specifications
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-medium mb-2">Category Specifications</h3>
                          <p className="text-sm text-muted-foreground">
                            Fill in the specifications for your product. Required fields are marked with *
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          {categoryAttributes.map((attr) => renderAttributeField(attr))}
                        </div>
                      </div>
                      
                      <div className="space-y-4 pt-6 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium">Additional Specifications</h3>
                            <p className="text-sm text-muted-foreground">
                              Add extra details not covered above
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addCustomAttribute}
                            disabled={isSubmitting}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom
                          </Button>
                        </div>
                        
                        {customAttributes.length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">
                              No custom specifications added
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {customAttributes.map((attr, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                <Input
                                  placeholder="Specification name"
                                  value={attr.name}
                                  onChange={(e) => updateCustomAttribute(index, 'name', e.target.value)}
                                  disabled={isSubmitting}
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Value"
                                  value={attr.value}
                                  onChange={(e) => updateCustomAttribute(index, 'value', e.target.value)}
                                  disabled={isSubmitting}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => removeCustomAttribute(index)}
                                  disabled={isSubmitting}
                                  className="shrink-0"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="images" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="images">Product Images *</Label>
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
                            
                            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                              <p className="text-xs truncate">
                                {images[index]?.name}
                              </p>
                              <p className="text-xs opacity-75">
                                {(images[index]?.size / 1024 / 1024).toFixed(1)} MB
                              </p>
                            </div>

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

                            <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                              <ImageIcon className="h-3 w-3" />
                            </div>
                          </div>
                        ))}
                        
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
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-6 border-t">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  size="lg"
                  disabled={!isFormValid || isSubmitting || images.length === 0}
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
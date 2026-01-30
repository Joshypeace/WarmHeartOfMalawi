"use client"

import { useState, useEffect } from "react"
import { Search, SlidersHorizontal, Star, Package, X, Tag, Palette, Ruler, Package2, Shield, Truck, ChevronDown, ChevronRight, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import Image from "next/image"
import { useCart } from "@/lib/cart-context"
import { useToast } from "@/hooks/use-toast"
import { useShopProducts } from "@/hooks/use-shop-products"
import { Skeleton } from "@/components/ui/skeleton"

// Type Definitions matching the admin/categories API response
interface ApiCategory {
  id: string
  name: string
  description: string | null
  image: string | null
  slug: string
  isActive: boolean
  type: 'MAIN' | 'SUB'
  level: number
  parentId: string | null
  parent?: {
    id: string
    name: string
  } | null
  children: Array<{
    id: string
    name: string
    description: string | null
    image: string | null
    slug: string
    isActive: boolean
    type: 'SUB'
    level: number
    parentId: string
    productCount: number
  }>
  productCount: number
  childrenCount: number
  createdAt: string
  updatedAt: string
}

interface ShopCategory {
  id: string
  name: string
  count: number
  type: 'MAIN' | 'SUB'
  level: number
  hasSubCategories?: boolean
  subCategories?: Array<{
    id: string
    name: string
    count: number
    type: 'SUB'
    level: number
  }>
}

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
  vendorId: string
  vendorName: string
  size?: string
  color?: string
  material?: string
  brand?: string
  createdAt: string
  updatedAt: string
}

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState("featured")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null)
  const [categories, setCategories] = useState<ShopCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  
  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

  // Use shop products hook with filters
  const { products, loading, error } = useShopProducts({
    search: searchQuery,
    category: selectedCategory === "all" ? "" : selectedCategory,
    subCategory: selectedSubCategory || "",
    sort: sortBy,
    sizes: selectedSizes,
    colors: selectedColors,
    materials: selectedMaterials,
    brands: selectedBrands,
    // minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    // maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
  })

  const { addItem } = useCart()
  const { toast } = useToast()

  // Fetch categories from admin/categories API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await fetch('/api/admin/categories')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success && result.data?.categories) {
          const allCategories = result.data.categories as ApiCategory[]
          
          // Build hierarchy: only MAIN categories at top level
          const shopCategories: ShopCategory[] = []
          
          allCategories.forEach((category: ApiCategory) => {
            // Only include active MAIN categories
            if (category.isActive && category.type === 'MAIN') {
              // Find all active subcategories for this main category
              const subCategories = allCategories
                .filter(child => 
                  child.isActive && 
                  child.type === 'SUB' && 
                  child.parentId === category.id &&
                  (child.productCount || 0) > 0
                )
                .map(child => ({
                  id: child.id,
                  name: child.name,
                  count: child.productCount || 0,
                  type: child.type as 'SUB',
                  level: child.level
                }))
                .sort((a, b) => b.count - a.count)
              
              // Calculate total product count for this main category (including subcategories)
              let totalProductCount = category.productCount || 0
              subCategories.forEach(subCat => {
                totalProductCount += subCat.count
              })
              
              // Only add main categories that have products or active subcategories
              if (totalProductCount > 0 || subCategories.length > 0) {
                const shopCategory: ShopCategory = {
                  id: category.id,
                  name: category.name,
                  count: totalProductCount,
                  type: category.type,
                  level: category.level,
                  hasSubCategories: subCategories.length > 0,
                  subCategories: subCategories
                }
                
                shopCategories.push(shopCategory)
              }
            }
          })
          
          // Sort categories by product count descending
          shopCategories.sort((a, b) => b.count - a.count)
          setCategories(shopCategories)
        } else {
          throw new Error(result.error || 'Failed to load categories')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        toast({
          title: "Error",
          description: "Failed to load categories. Please refresh the page.",
          variant: "destructive"
        })
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [toast])

  // Handle category selection
  const handleCategorySelect = (categoryId: string, isSubCategory: boolean = false) => {
    if (isSubCategory) {
      setSelectedSubCategory(categoryId)
      // Find parent category to set as selectedCategory too
      const parentCategory = categories.find(cat => 
        cat.subCategories?.some(sub => sub.id === categoryId)
      )
      setSelectedCategory(parentCategory?.id || "all")
    } else {
      setSelectedCategory(categoryId)
      setSelectedSubCategory(null)
    }
    // Reset filters when changing category
    setPriceRange([0, 10000])
    setSelectedSizes([])
    setSelectedColors([])
    setSelectedMaterials([])
    setSelectedBrands([])
  }

  // Toggle category expansion in sidebar
  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  // Add to cart handler
  const handleAddToCart = (product: Product) => {
    addItem(product.id)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedSubCategory(null)
    setPriceRange([0, 10000])
    setSelectedSizes([])
    setSelectedColors([])
    setSelectedMaterials([])
    setSelectedBrands([])
    setExpandedCategories(new Set())
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      searchQuery || 
      selectedCategory !== "all" || 
      selectedSubCategory !== null ||
      priceRange[0] > 0 || 
      priceRange[1] < 10000 ||
      selectedSizes.length > 0 ||
      selectedColors.length > 0 ||
      selectedMaterials.length > 0 ||
      selectedBrands.length > 0
    )
  }

  // Get selected category name for display
  const getSelectedCategoryName = (): string => {
    if (selectedSubCategory) {
      const subCategory = categories
        .flatMap(cat => cat.subCategories || [])
        .find(sub => sub.id === selectedSubCategory)
      return subCategory?.name || ""
    }
    
    if (selectedCategory !== "all") {
      const category = categories.find(cat => cat.id === selectedCategory)
      return category?.name || ""
    }
    
    return ""
  }

  // Get selected main category name (for when subcategory is selected)
  const getSelectedMainCategoryName = (): string => {
    if (selectedSubCategory) {
      const parentCategory = categories.find(cat => 
        cat.subCategories?.some(sub => sub.id === selectedSubCategory)
      )
      return parentCategory?.name || ""
    }
    
    if (selectedCategory !== "all") {
      const category = categories.find(cat => cat.id === selectedCategory)
      return category?.name || ""
    }
    
    return ""
  }

  // Toggle product details expansion
  const toggleProductDetails = (productId: string) => {
    setExpandedProductId(expandedProductId === productId ? null : productId)
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "Today"
    if (diffDays <= 7) return `${diffDays} days ago`
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric'
    }
    
    if (new Date().getFullYear() !== date.getFullYear()) {
      options.year = 'numeric'
    }
    
    return date.toLocaleDateString('en-US', options)
  }

  // Parse comma-separated strings
  const parseDetails = (detailString?: string): string[] => {
    if (!detailString) return []
    return detailString.split(',').map(item => item.trim()).filter(item => item)
  }

  // Format rating
  const formatRating = (rating: number | null): string => {
    return rating ? rating.toFixed(1) : "0.0"
  }

  // Format review count
  const formatReviewCount = (reviews: number | null): string => {
    const count = reviews || 0
    return count > 999 ? "999+" : count.toString()
  }

  // Render rating stars
  const renderRatingStars = (rating: number | null) => {
    const displayRating = rating || 0
    return (
      <div className="flex items-center gap-1">
        <Star className={`h-3 w-3 ${displayRating > 0 ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
        <span className="text-xs font-medium">{formatRating(rating)}</span>
      </div>
    )
  }

  // Calculate total products across all categories
  const getTotalProductsCount = (): number => {
    return categories.reduce((sum, cat) => sum + cat.count, 0)
  }

  // Extract unique values from products for filters
  const getAllSizes = (): string[] => {
    const allSizes = new Set<string>()
    products.forEach(product => {
      if (product.size) {
        parseDetails(product.size).forEach(size => allSizes.add(size))
      }
    })
    return Array.from(allSizes).sort()
  }

  const getAllColors = (): string[] => {
    const allColors = new Set<string>()
    products.forEach(product => {
      if (product.color) {
        parseDetails(product.color).forEach(color => allColors.add(color))
      }
    })
    return Array.from(allColors).sort()
  }

  const getAllMaterials = (): string[] => {
    const allMaterials = new Set<string>()
    products.forEach(product => {
      if (product.material) {
        parseDetails(product.material).forEach(material => allMaterials.add(material))
      }
    })
    return Array.from(allMaterials).sort()
  }

  const getAllBrands = (): string[] => {
    const allBrands = new Set<string>()
    products.forEach(product => {
      if (product.brand) {
        allBrands.add(product.brand)
      }
    })
    return Array.from(allBrands).sort()
  }

  // Toggle filter values
  const toggleSizeFilter = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size]
    )
  }

  const toggleColorFilter = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color)
        : [...prev, color]
    )
  }

  const toggleMaterialFilter = (material: string) => {
    setSelectedMaterials(prev => 
      prev.includes(material) 
        ? prev.filter(m => m !== material)
        : [...prev, material]
    )
  }

  const toggleBrandFilter = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    )
  }

  // Debug function to check what's being sent to API
  const debugAPI = () => {
    console.log('API Parameters:', {
      search: searchQuery,
      category: selectedCategory === "all" ? "" : selectedCategory,
      subCategory: selectedSubCategory || "",
      sort: sortBy,
      sizes: selectedSizes,
      colors: selectedColors,
      materials: selectedMaterials,
      brands: selectedBrands,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
    })
    console.log('Products from hook:', products)
    console.log('Loading:', loading)
    console.log('Error:', error)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-4 md:py-6 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Shop All Products</h1>
          <p className="text-sm text-muted-foreground">
            Discover authentic Malawian products from local artisans and vendors with complete details
          </p>
        </div>

        {/* Debug button - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <Button onClick={debugAPI} variant="outline" size="sm" className="mb-4">
            Debug API
          </Button>
        )}

        <div className="flex gap-6 relative">
          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden fixed bottom-4 right-4 z-50 shadow-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>

          {/* Left Sidebar - Filters */}
          <aside className={`
            fixed md:sticky top-0 left-0 h-screen md:h-auto z-40
            w-72 md:w-80 flex-shrink-0 
            bg-background border-r md:border-r-0
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            overflow-y-auto
            p-4 md:p-0 md:pr-6
          `}>
            {/* Mobile Close Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden absolute top-2 right-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            <div className="space-y-6">
              {/* Search */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Search Products</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, brand..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </div>

              {/* Categories Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Product Categories</h3>
                  <span className="text-xs text-muted-foreground">
                    {getTotalProductsCount()} total products
                  </span>
                </div>
                
                <div className="space-y-1">
                  {/* All Categories Button */}
                  <Button
                    variant={selectedCategory === "all" && !selectedSubCategory ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm h-9"
                    onClick={clearFilters}
                  >
                    <span className="flex-1 text-left">All Categories</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {getTotalProductsCount()}
                    </Badge>
                  </Button>
                  
                  {/* Categories Loading State */}
                  {categoriesLoading ? (
                    <div className="space-y-2 py-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-2 p-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-4 w-8" />
                        </div>
                      ))}
                    </div>
                  ) : categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 px-2 text-center">
                      No categories available
                    </p>
                  ) : (
                    categories.map((category) => {
                      const hasSubcategories = category.hasSubCategories
                      const isExpanded = expandedCategories.has(category.id)
                      
                      return (
                        <div key={category.id} className="space-y-1">
                          {/* Main Category */}
                          <div className="flex items-center">
                            <Button
                              variant={selectedCategory === category.id && !selectedSubCategory ? "secondary" : "ghost"}
                              className="w-full justify-start text-sm h-9 rounded-r-none flex-1"
                              onClick={() => {
                                handleCategorySelect(category.id)
                                // Toggle expansion for main category if it has subcategories
                                if (hasSubcategories && !isExpanded) {
                                  toggleCategoryExpansion(category.id)
                                }
                              }}
                              disabled={category.count === 0}
                            >
                              <span className="flex-1 text-left truncate">{category.name}</span>
                              <Badge 
                                variant={category.count > 0 ? "outline" : "secondary"} 
                                className="ml-2 text-xs shrink-0"
                              >
                                {category.count}
                              </Badge>
                            </Button>
                            
                            {/* Chevron for expandable categories */}
                            {hasSubcategories && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-l-none shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCategoryExpansion(category.id)
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                          
                          {/* Subcategories Dropdown */}
                          {hasSubcategories && isExpanded && (
                            <div className="ml-4 space-y-1 border-l pl-2 mt-1 animate-in fade-in duration-200">
                              {/* List subcategories */}
                              {category.subCategories?.map((subCategory) => (
                                <Button
                                  key={subCategory.id}
                                  variant={selectedSubCategory === subCategory.id ? "secondary" : "ghost"}
                                  className="w-full justify-start text-xs h-8"
                                  onClick={() => handleCategorySelect(subCategory.id, true)}
                                  disabled={subCategory.count === 0}
                                >
                                  <span className="flex-1 text-left truncate">{subCategory.name}</span>
                                  <Badge 
                                    variant={subCategory.count > 0 ? "outline" : "secondary"} 
                                    className="ml-2 text-xs shrink-0"
                                  >
                                    {subCategory.count}
                                  </Badge>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Price Range (MWK)</h3>
                <div className="space-y-4 px-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>MWK {priceRange[0]}</span>
                    <span>MWK {priceRange[1]}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                      className="text-sm h-8"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                      className="text-sm h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Size Filter */}
              {getAllSizes().length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Sizes</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAllSizes().map((size) => (
                      <Badge
                        key={size}
                        variant={selectedSizes.includes(size) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => toggleSizeFilter(size)}
                      >
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Filter */}
              {getAllColors().length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Colors</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAllColors().map((color) => (
                      <Badge
                        key={color}
                        variant={selectedColors.includes(color) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => toggleColorFilter(color)}
                      >
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Material Filter */}
              {getAllMaterials().length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Materials</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAllMaterials().map((material) => (
                      <Badge
                        key={material}
                        variant={selectedMaterials.includes(material) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => toggleMaterialFilter(material)}
                      >
                        {material}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Brand Filter */}
              {getAllBrands().length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Brands</h3>
                  <div className="flex flex-wrap gap-2">
                    {getAllBrands().map((brand) => (
                      <Badge
                        key={brand}
                        variant={selectedBrands.includes(brand) ? "default" : "outline"}
                        className="cursor-pointer px-3 py-1"
                        onClick={() => toggleBrandFilter(brand)}
                      >
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sort By */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">Sort Products</h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  className="w-full h-9 text-sm"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}

              {/* Category Navigation */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">Explore Categories</p>
                <Button asChild variant="ghost" size="sm" className="w-full justify-start text-xs h-8">
                  <Link href="/categories">
                    <ChevronRight className="h-3 w-3 mr-2" />
                    Browse All Categories
                  </Link>
                </Button>
              </div>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Active Filters */}
            {hasActiveFilters() && (
              <div className="mb-4 flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                    <Search className="h-3 w-3" />
                    "{searchQuery}"
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => setSearchQuery("")}
                    />
                  </Badge>
                )}
                {selectedCategory !== "all" && !selectedSubCategory && (
                  <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                    Category: {getSelectedCategoryName()}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => {
                        setSelectedCategory("all")
                        setSelectedSubCategory(null)
                      }}
                    />
                  </Badge>
                )}
                {selectedSubCategory && (
                  <>
                    <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                      Category: {getSelectedMainCategoryName()}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                        onClick={() => {
                          setSelectedCategory("all")
                          setSelectedSubCategory(null)
                        }}
                      />
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                      Subcategory: {getSelectedCategoryName()}
                      <X 
                        className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                        onClick={() => setSelectedSubCategory(null)}
                      />
                    </Badge>
                  </>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                    <Filter className="h-3 w-3" />
                    Price: MWK {priceRange[0]} - {priceRange[1]}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => setPriceRange([0, 10000])}
                    />
                  </Badge>
                )}
                {selectedSizes.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                    <Filter className="h-3 w-3" />
                    Sizes: {selectedSizes.join(', ')}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedSizes([])}
                    />
                  </Badge>
                )}
                {selectedColors.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                    <Filter className="h-3 w-3" />
                    Colors: {selectedColors.join(', ')}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedColors([])}
                    />
                  </Badge>
                )}
                {selectedMaterials.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                    <Filter className="h-3 w-3" />
                    Materials: {selectedMaterials.join(', ')}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedMaterials([])}
                    />
                  </Badge>
                )}
                {selectedBrands.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                    <Filter className="h-3 w-3" />
                    Brands: {selectedBrands.join(', ')}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => setSelectedBrands([])}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {selectedSubCategory 
                    ? `${getSelectedCategoryName()} (${getSelectedMainCategoryName()})`
                    : selectedCategory !== "all"
                    ? `${getSelectedCategoryName()} Products`
                    : "All Products"}
                  {hasActiveFilters() && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      (Filtered)
                    </span>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {loading ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></span>
                      Loading...
                    </span>
                  ) : error ? (
                    "Error loading products"
                  ) : (
                    `${products.length} ${products.length === 1 ? "product" : "products"} found`
                  )}
                </p>
              </div>
            </div>

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-12">
                <Card className="max-w-md mx-auto border-destructive/20 bg-destructive/5">
                  <CardContent className="py-12">
                    <Package className="h-16 w-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Unable to Load Products</h3>
                    <p className="text-muted-foreground mb-4">
                      We're having trouble loading products right now. Please check back later.
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden animate-pulse">
                    <div className="aspect-square bg-muted" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded mb-3 w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Product Grid */}
            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => {
                  const isExpanded = expandedProductId === product.id
                  const sizes = parseDetails(product.size)
                  const colors = parseDetails(product.color)
                  const materials = parseDetails(product.material)
                  
                  return (
                    <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                      {/* Product Image */}
                      <Link href={`/shop/${product.id}`} className="block">
                        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-muted/50 to-muted/30">
                          <Image
                            src={product.images[0] || "/placeholder.svg"}
                            alt={product.name}
                            width={300}
                            height={300}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {product.featured && (
                            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-primary to-accent border-none text-primary-foreground text-xs px-2 py-0.5">
                              <Star className="h-2.5 w-2.5 mr-1 fill-current" />
                              Featured
                            </Badge>
                          )}
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Badge variant="secondary" className="bg-white/90 text-black text-xs font-medium px-3 py-1">
                                Out of Stock
                              </Badge>
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2">
                            <Badge variant="outline" className="bg-background/90 text-xs">
                              {formatDate(product.createdAt)}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                      
                      <CardContent className="p-4 flex-1 flex flex-col">
                        {/* Product Name and Vendor */}
                        <Link href={`/shop/${product.id}`} className="group/title">
                          <h3 className="font-semibold text-sm mb-1 group-hover/title:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          By {product.vendorName}
                        </p>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          {renderRatingStars(product.rating)}
                          <span className="text-xs text-muted-foreground">
                            ({formatReviewCount(product.reviews)})
                          </span>
                        </div>
                        
                        {/* Quick Details */}
                        <div className="space-y-1.5 mb-3">
                          {/* Brand */}
                          {product.brand && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Tag className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground truncate">Brand:</span>
                              <span className="font-medium truncate">{product.brand}</span>
                            </div>
                          )}
                          
                          {/* Sizes */}
                          {sizes.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Ruler className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">Sizes:</span>
                              <div className="flex gap-1 flex-wrap">
                                {sizes.slice(0, 2).map((size, index) => (
                                  <Badge key={index} variant="outline" className="text-[10px] py-0 px-1.5">
                                    {size}
                                  </Badge>
                                ))}
                                {sizes.length > 2 && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                    +{sizes.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Colors */}
                          {colors.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Palette className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">Colors:</span>
                              <div className="flex gap-1 flex-wrap">
                                {colors.slice(0, 2).map((color, index) => (
                                  <Badge key={index} variant="outline" className="text-[10px] py-0 px-1.5">
                                    {color}
                                  </Badge>
                                ))}
                                {colors.length > 2 && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                    +{colors.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Materials */}
                          {materials.length > 0 && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Package2 className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-muted-foreground">Material:</span>
                              <span className="font-medium truncate">{materials[0]}</span>
                              {materials.length > 1 && (
                                <span className="text-xs text-muted-foreground">+{materials.length - 1}</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Stock Status */}
                        <div className="mb-3">
                          {product.stockCount > 0 ? (
                            <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                              <Shield className="h-3 w-3" />
                              <span>In Stock: {product.stockCount} units</span>
                            </div>
                          ) : product.inStock ? (
                            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                              <Truck className="h-3 w-3" />
                              <span>Limited Stock</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                              <Package className="h-3 w-3" />
                              <span>Out of Stock</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Price */}
                        <div className="mt-auto pt-3 border-t">
                          <p className="text-base font-bold text-primary">
                            MWK {product.price.toLocaleString('en-MW')}
                          </p>
                        </div>
                      </CardContent>
                      
                      {/* Action Buttons */}
                      <CardFooter className="p-4 pt-0 space-y-2">
                        <Button
                          onClick={() => handleAddToCart(product)}
                          size="sm"
                          className="w-full h-9 text-sm"
                          disabled={!product.inStock}
                        >
                          {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => toggleProductDetails(product.id)}
                          >
                            {isExpanded ? (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Less
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-3 w-3 mr-1" />
                                More
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            asChild
                          >
                            <Link href={`/shop/${product.id}`}>
                              <span className="sr-only">View Details</span>
                              <Search className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                        
                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-md space-y-2 text-xs animate-in fade-in">
                            <div>
                              <strong className="text-muted-foreground">Description:</strong>
                              <p className="mt-1 line-clamp-3">{product.description}</p>
                            </div>
                            
                            <div className="flex items-center">
                              <strong className="text-muted-foreground mr-2">Category:</strong>
                              <Badge variant="secondary" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>
                            
                            {product.images.length > 1 && (
                              <div>
                                <strong className="text-muted-foreground">Images:</strong>
                                <p className="mt-1">{product.images.length - 1} more available</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="text-center py-16">
                <Card className="max-w-md mx-auto border-dashed bg-gradient-to-br from-muted/30 to-muted/10">
                  <CardContent className="py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Package className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {hasActiveFilters() ? "No Products Found" : "No Products Available"}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      {hasActiveFilters() 
                        ? "Try adjusting your filters or browse different categories to find what you're looking for."
                        : "We're preparing amazing products for you. Check back soon!"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {hasActiveFilters() && (
                        <Button variant="outline" onClick={clearFilters} className="sm:flex-1 max-sm:w-full">
                          Clear All Filters
                        </Button>
                      )}
                      <Button asChild className="sm:flex-1 max-sm:w-full">
                        <Link href="/categories">
                          Browse Categories
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Call to Action */}
            {!loading && products.length > 0 && (
              <div className="mt-12">
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5">
                  <CardContent className="p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="text-xl font-bold mb-2">Need Help Finding Products?</h3>
                        <p className="text-muted-foreground max-w-xl">
                          Browse our complete category hierarchy or contact our support team for personalized assistance.
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                        <Button asChild variant="outline">
                          <Link href="/categories">
                            Browse Categories
                          </Link>
                        </Button>
                        <Button asChild>
                          <Link href="/contact">
                            Contact Support
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
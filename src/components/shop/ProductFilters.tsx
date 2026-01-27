// components/shop/ProductFilters.tsx
"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Filter, X, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

interface FilterAttribute {
  id: string
  name: string
  type: 'text' | 'number' | 'select' | 'color' | 'boolean' | 'range'
  filterType: 'text_input' | 'dropdown' | 'checkbox' | 'range_slider' | 'color_swatch' | 'toggle'
  options: string[]
  units?: string
}

interface ProductFiltersProps {
  categoryId?: string
  categoryName?: string
  onFilterChange?: (filters: any) => void
  className?: string
}

export default function ProductFilters({
  categoryId,
  categoryName,
  onFilterChange,
  className = ""
}: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<any>({})
  const [categoryAttributes, setCategoryAttributes] = useState<FilterAttribute[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set())
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
  const [tempPriceRange, setTempPriceRange] = useState<[number, number]>([0, 10000])

  // Fetch category attributes when category changes
  useEffect(() => {
    const fetchAttributes = async () => {
      if (!categoryId) {
        setCategoryAttributes([])
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/categories/${categoryId}/attributes?filterable=true`)
        const result = await response.json()
        
        if (result.success) {
          setCategoryAttributes(result.data.attributes || [])
        }
      } catch (error) {
        console.error('Error fetching filters:', error)
        setCategoryAttributes([])
      } finally {
        setLoading(false)
      }
    }

    fetchAttributes()
  }, [categoryId])

  // Initialize filters from URL
  useEffect(() => {
    const params: any = {}
    
    // Parse price range
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    if (minPrice || maxPrice) {
      params.priceRange = [
        minPrice ? parseInt(minPrice) : 0,
        maxPrice ? parseInt(maxPrice) : 10000
      ]
      setPriceRange(params.priceRange)
      setTempPriceRange(params.priceRange)
    }

    // Parse other filters
    categoryAttributes.forEach(attr => {
      const paramValue = searchParams.get(attr.id)
      if (paramValue) {
        if (attr.filterType === 'checkbox') {
          params[attr.id] = paramValue.split(',')
        } else if (attr.filterType === 'range_slider') {
          const [min, max] = paramValue.split('-').map(Number)
          params[attr.id] = { min, max }
        } else {
          params[attr.id] = paramValue
        }
      }
    })

    setFilters(params)
  }, [searchParams, categoryAttributes])

  const updateFilter = (attributeId: string, value: any) => {
    const newFilters = { ...filters, [attributeId]: value }
    setFilters(newFilters)
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      params.delete(attributeId)
    } else if (Array.isArray(value)) {
      params.set(attributeId, value.join(','))
    } else if (typeof value === 'object' && value.min !== undefined) {
      params.set(attributeId, `${value.min}-${value.max}`)
    } else {
      params.set(attributeId, value.toString())
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
    
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const updatePriceRange = (range: [number, number]) => {
    setTempPriceRange(range)
  }

  const applyPriceRange = () => {
    setPriceRange(tempPriceRange)
    const params = new URLSearchParams(searchParams.toString())
    params.set('minPrice', tempPriceRange[0].toString())
    params.set('maxPrice', tempPriceRange[1].toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const clearFilter = (attributeId: string) => {
    const newFilters = { ...filters }
    delete newFilters[attributeId]
    setFilters(newFilters)
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete(attributeId)
    router.push(`?${params.toString()}`, { scroll: false })
    
    if (onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const clearAllFilters = () => {
    setFilters({})
    setPriceRange([0, 10000])
    setTempPriceRange([0, 10000])
    
    const params = new URLSearchParams()
    // Keep only category if exists
    const category = searchParams.get('category')
    if (category) {
      params.set('category', category)
    }
    
    router.push(`?${params.toString()}`, { scroll: false })
    
    if (onFilterChange) {
      onFilterChange({})
    }
  }

  const toggleFilterExpansion = (attributeId: string) => {
    const newExpanded = new Set(expandedFilters)
    if (newExpanded.has(attributeId)) {
      newExpanded.delete(attributeId)
    } else {
      newExpanded.add(attributeId)
    }
    setExpandedFilters(newExpanded)
  }

  const renderFilterControl = (attribute: FilterAttribute) => {
    const currentValue = filters[attribute.id]
    const isExpanded = expandedFilters.has(attribute.id)
    
    return (
      <div key={attribute.id} className="space-y-3 py-3 border-b">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleFilterExpansion(attribute.id)}
        >
          <Label className="font-medium cursor-pointer">{attribute.name}</Label>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
        
        {isExpanded && (
          <div className="space-y-3 pt-2">
            {attribute.filterType === 'dropdown' && (
              <Select
                value={currentValue || ''}
                onValueChange={(value) => updateFilter(attribute.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`All ${attribute.name}`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All {attribute.name}</SelectItem>
                  {attribute.options.map((option, idx) => (
                    <SelectItem key={idx} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            {attribute.filterType === 'checkbox' && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {attribute.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${attribute.id}-${idx}`}
                      checked={currentValue?.includes(option) || false}
                      onCheckedChange={(checked) => {
                        const currentValues = currentValue || []
                        const newValues = checked 
                          ? [...currentValues, option]
                          : currentValues.filter((v: string) => v !== option)
                        updateFilter(attribute.id, newValues)
                      }}
                    />
                    <Label
                      htmlFor={`${attribute.id}-${idx}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            )}
            
            {attribute.filterType === 'color_swatch' && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {attribute.options.map((color, idx) => (
                    <button
                      key={idx}
                      className={`w-8 h-8 rounded-full border-2 ${
                        currentValue === color ? 'border-primary' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateFilter(attribute.id, currentValue === color ? '' : color)}
                      title={color}
                    />
                  ))}
                </div>
                {currentValue && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearFilter(attribute.id)}
                    className="w-full"
                  >
                    Clear Color
                  </Button>
                )}
              </div>
            )}
            
            {attribute.filterType === 'range_slider' && (
              <div className="space-y-4">
                <Slider
                  defaultValue={[0, 100]}
                  min={0}
                  max={100}
                  step={1}
                  value={[
                    currentValue?.min || 0,
                    currentValue?.max || 100
                  ]}
                  onValueChange={(value) => {
                    updateFilter(attribute.id, {
                      min: value[0],
                      max: value[1]
                    })
                  }}
                />
                <div className="flex items-center justify-between text-sm">
                  <span>{currentValue?.min || 0}{attribute.units}</span>
                  <span>{currentValue?.max || 100}{attribute.units}</span>
                </div>
              </div>
            )}
            
            {attribute.filterType === 'toggle' && (
              <div className="flex items-center justify-between">
                <Label className="text-sm">Show only {attribute.name}</Label>
                <Switch
                  checked={currentValue === 'true' || currentValue === true}
                  onCheckedChange={(checked) => updateFilter(attribute.id, checked)}
                />
              </div>
            )}
            
            {currentValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearFilter(attribute.id)}
                className="w-full"
              >
                <X className="h-3 w-3 mr-2" />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || priceRange[0] > 0 || priceRange[1] < 10000

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
        {categoryName && (
          <p className="text-sm text-muted-foreground">
            Filtering: {categoryName}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {priceRange[0] > 0 || priceRange[1] < 10000 ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Price: MWK {priceRange[0]} - {priceRange[1]}
                  <X 
                    className="h-3 w-3 ml-1 cursor-pointer" 
                    onClick={() => {
                      setPriceRange([0, 10000])
                      setTempPriceRange([0, 10000])
                      const params = new URLSearchParams(searchParams.toString())
                      params.delete('minPrice')
                      params.delete('maxPrice')
                      router.push(`?${params.toString()}`, { scroll: false })
                    }}
                  />
                </Badge>
              ) : null}
              
              {Object.entries(filters).map(([key, value]) => {
                const attribute = categoryAttributes.find(attr => attr.id === key)
                if (!attribute) return null
                
                let displayValue = ''
                if (Array.isArray(value)) {
                  displayValue = value.join(', ')
                } else if (
                  typeof value === 'object' &&
                  value !== null &&
                  'min' in (value as any) &&
                  'max' in (value as any)
                ) {
                  const v = value as { min?: number | string; max?: number | string }
                  const min = v.min ?? ''
                  const max = v.max ?? ''
                  displayValue = `${min}${attribute.units || ''} - ${max}${attribute.units || ''}`
                } else {
                  displayValue = String(value ?? '')
                }
                
                return (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {attribute.name}: {displayValue}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => clearFilter(key)}
                    />
                  </Badge>
                )
              })}
            </div>
            <Separator />
          </div>
        )}

        {/* Price Filter */}
        <div className="space-y-3 py-3 border-b">
          <Label className="font-medium">Price Range (MWK)</Label>
          <div className="space-y-4">
            <Slider
              defaultValue={[0, 10000]}
              min={0}
              max={10000}
              step={100}
              value={tempPriceRange}
              onValueChange={(value) => updatePriceRange(value as [number, number])}
            />
            <div className="flex items-center justify-between text-sm">
              <span>MWK {tempPriceRange[0]}</span>
              <span>MWK {tempPriceRange[1]}</span>
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={tempPriceRange[0]}
                onChange={(e) => updatePriceRange([parseInt(e.target.value) || 0, tempPriceRange[1]])}
                className="text-sm"
              />
              <Input
                type="number"
                placeholder="Max"
                value={tempPriceRange[1]}
                onChange={(e) => updatePriceRange([tempPriceRange[0], parseInt(e.target.value) || 10000])}
                className="text-sm"
              />
            </div>
            <Button
              onClick={applyPriceRange}
              size="sm"
              className="w-full"
            >
              Apply Price Filter
            </Button>
          </div>
        </div>

        {/* Category Attributes Filters */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading filters...</p>
          </div>
        ) : categoryAttributes.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">No filters available</p>
          </div>
        ) : (
          <div className="space-y-1">
            {categoryAttributes.map(attr => renderFilterControl(attr))}
          </div>
        )}

        {/* Filter Stats */}
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasActiveFilters 
              ? `${Object.keys(filters).length + (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0)} active filter(s)`
              : "No filters applied"
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
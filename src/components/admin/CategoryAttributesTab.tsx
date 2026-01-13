"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Copy, Eye, GripVertical, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CategoryAttribute {
  id: string
  name: string
  type: 'text' | 'number' | 'select' | 'color' | 'boolean' | 'range'
  filterType: 'text_input' | 'dropdown' | 'checkbox' | 'range_slider' | 'color_swatch' | 'toggle'
  options: string[]
  units?: string
  isRequired: boolean
  isFilterable: boolean
  placeholder?: string
  sortOrder: number
  minValue?: number
  maxValue?: number
  step?: number
}

interface CategoryAttributesTabProps {
  categoryId?: string
  categoryName?: string
  attributes: CategoryAttribute[]
  onAttributesChange: (attributes: CategoryAttribute[]) => void
  isSubmitting: boolean
}

export default function CategoryAttributesTab({
  categoryId,
  categoryName,
  attributes,
  onAttributesChange,
  isSubmitting
}: CategoryAttributesTabProps) {
  const { toast } = useToast()
  const [activeAttributeIndex, setActiveAttributeIndex] = useState<number | null>(0)
  const [showPreview, setShowPreview] = useState(true)

  const addAttribute = () => {
    const newAttribute: CategoryAttribute = {
      id: `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'text',
      filterType: 'text_input',
      options: [],
      isRequired: false,
      isFilterable: true,
      sortOrder: attributes.length + 1
    }
    const newAttributes = [...attributes, newAttribute]
    onAttributesChange(newAttributes)
    setActiveAttributeIndex(newAttributes.length - 1)
  }

  const updateAttribute = (index: number, field: keyof CategoryAttribute, value: any) => {
    const updated = [...attributes]
    const attribute = { ...updated[index], [field]: value }

    // Auto-set filterType based on type
    if (field === 'type') {
      switch (value) {
        case 'select':
          attribute.filterType = 'dropdown'
          attribute.options = attribute.options.length > 0 ? attribute.options : ['Option 1', 'Option 2', 'Option 3']
          break
        case 'color':
          attribute.filterType = 'color_swatch'
          attribute.options = attribute.options.length > 0 ? attribute.options : ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF']
          break
        case 'boolean':
          attribute.filterType = 'toggle'
          attribute.options = ['Yes', 'No']
          break
        case 'range':
          attribute.filterType = 'range_slider'
          attribute.minValue = attribute.minValue || 0
          attribute.maxValue = attribute.maxValue || 100
          attribute.step = attribute.step || 1
          break
        default:
          attribute.filterType = 'text_input'
      }
    }

    // Clear options if not needed
    if (field === 'type' && !['select', 'color', 'checkbox'].includes(value)) {
      attribute.options = []
    }

    updated[index] = attribute
    onAttributesChange(updated)
  }

  const removeAttribute = (index: number) => {
    if (attributes.length <= 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one attribute",
        variant: "destructive"
      })
      return
    }

    const updated = attributes.filter((_, i) => i !== index)
    // Update sort orders
    updated.forEach((attr, idx) => {
      attr.sortOrder = idx + 1
    })
    onAttributesChange(updated)
    
    if (activeAttributeIndex === index) {
      setActiveAttributeIndex(updated.length > 0 ? 0 : null)
    } else if (activeAttributeIndex !== null && activeAttributeIndex > index) {
      setActiveAttributeIndex(activeAttributeIndex - 1)
    }
  }

  const updateOptions = (index: number, optionsString: string) => {
    const options = optionsString.split(',')
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0)
    updateAttribute(index, 'options', options)
  }

  const moveAttribute = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= attributes.length) return
    
    const updated = [...attributes]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    
    // Update sort orders
    updated.forEach((attr, idx) => {
      attr.sortOrder = idx + 1
    })
    
    onAttributesChange(updated)
    setActiveAttributeIndex(toIndex)
  }

  const duplicateAttribute = (index: number) => {
    const attributeToDuplicate = attributes[index]
    const duplicated: CategoryAttribute = {
      ...attributeToDuplicate,
      id: `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${attributeToDuplicate.name} (Copy)`,
      sortOrder: attributes.length + 1
    }
    const newAttributes = [...attributes, duplicated]
    onAttributesChange(newAttributes)
    setActiveAttributeIndex(newAttributes.length - 1)
    
    toast({
      title: "Attribute duplicated",
      description: `${attributeToDuplicate.name} has been duplicated`
    })
  }

  const loadTemplate = (templateName: string) => {
    const templates: Record<string, CategoryAttribute[]> = {
      clothing: [
        {
          id: `size_${Date.now()}`,
          name: 'Size',
          type: 'select',
          filterType: 'dropdown',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          isRequired: true,
          isFilterable: true,
          sortOrder: 1,
          placeholder: 'Select size'
        },
        {
          id: `color_${Date.now()}`,
          name: 'Color',
          type: 'color',
          filterType: 'color_swatch',
          options: ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray'],
          isRequired: false,
          isFilterable: true,
          sortOrder: 2
        },
        {
          id: `material_${Date.now()}`,
          name: 'Material',
          type: 'select',
          filterType: 'checkbox',
          options: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Leather', 'Denim'],
          isRequired: false,
          isFilterable: true,
          sortOrder: 3
        },
        {
          id: `fit_${Date.now()}`,
          name: 'Fit',
          type: 'select',
          filterType: 'dropdown',
          options: ['Slim', 'Regular', 'Relaxed', 'Oversized'],
          isRequired: false,
          isFilterable: true,
          sortOrder: 4
        }
      ],
      electronics: [
        {
          id: `brand_${Date.now()}`,
          name: 'Brand',
          type: 'text',
          filterType: 'dropdown',
          options: [],
          isRequired: false,
          isFilterable: true,
          sortOrder: 1,
          placeholder: 'e.g., Apple, Samsung, Sony'
        },
        {
          id: `storage_${Date.now()}`,
          name: 'Storage',
          type: 'select',
          filterType: 'dropdown',
          options: ['64GB', '128GB', '256GB', '512GB', '1TB'],
          isRequired: false,
          isFilterable: true,
          sortOrder: 2,
          units: 'GB'
        },
        {
          id: `screen_size_${Date.now()}`,
          name: 'Screen Size',
          type: 'range',
          filterType: 'range_slider',
          options: [],
          isRequired: false,
          isFilterable: true,
          sortOrder: 3,
          units: 'inches',
          minValue: 4,
          maxValue: 32,
          step: 0.5
        },
        {
          id: `condition_${Date.now()}`,
          name: 'Condition',
          type: 'select',
          filterType: 'dropdown',
          options: ['New', 'Like New', 'Good', 'Fair'],
          isRequired: true,
          isFilterable: true,
          sortOrder: 4
        }
      ],
      furniture: [
        {
          id: `material_${Date.now()}`,
          name: 'Material',
          type: 'select',
          filterType: 'checkbox',
          options: ['Wood', 'Metal', 'Glass', 'Plastic', 'Fabric', 'Leather'],
          isRequired: true,
          isFilterable: true,
          sortOrder: 1
        },
        {
          id: `color_${Date.now()}`,
          name: 'Color',
          type: 'color',
          filterType: 'color_swatch',
          options: ['#8B4513', '#000000', '#FFFFFF', '#808080', '#964B00'],
          isRequired: false,
          isFilterable: true,
          sortOrder: 2
        },
        {
          id: `dimensions_${Date.now()}`,
          name: 'Width',
          type: 'range',
          filterType: 'range_slider',
          options: [],
          isRequired: false,
          isFilterable: true,
          sortOrder: 3,
          units: 'cm',
          minValue: 30,
          maxValue: 300,
          step: 5
        },
        {
          id: `style_${Date.now()}`,
          name: 'Style',
          type: 'select',
          filterType: 'dropdown',
          options: ['Modern', 'Traditional', 'Industrial', 'Scandinavian', 'Rustic'],
          isRequired: false,
          isFilterable: true,
          sortOrder: 4
        }
      ],
      groceries: [
        {
          id: `weight_${Date.now()}`,
          name: 'Weight',
          type: 'range',
          filterType: 'range_slider',
          options: [],
          isRequired: true,
          isFilterable: true,
          sortOrder: 1,
          units: 'kg',
          minValue: 0.1,
          maxValue: 50,
          step: 0.1
        },
        {
          id: `organic_${Date.now()}`,
          name: 'Organic',
          type: 'boolean',
          filterType: 'toggle',
          options: ['Yes', 'No'],
          isRequired: false,
          isFilterable: true,
          sortOrder: 2
        },
        {
          id: `origin_${Date.now()}`,
          name: 'Origin',
          type: 'text',
          filterType: 'dropdown',
          options: [],
          isRequired: false,
          isFilterable: true,
          sortOrder: 3,
          placeholder: 'e.g., Local, Imported'
        },
        {
          id: `packaging_${Date.now()}`,
          name: 'Packaging',
          type: 'select',
          filterType: 'checkbox',
          options: ['Plastic', 'Paper', 'Glass', 'Metal', 'Bulk'],
          isRequired: false,
          isFilterable: true,
          sortOrder: 4
        }
      ]
    }

    const template = templates[templateName] || []
    const newAttributes = [...template]
    
    // Update IDs to be unique
    newAttributes.forEach(attr => {
      attr.id = `${attr.id}_${Date.now()}`
    })
    
    onAttributesChange(newAttributes)
    setActiveAttributeIndex(0)
    
    toast({
      title: "Template loaded",
      description: `${templateName.charAt(0).toUpperCase() + templateName.slice(1)} template applied`
    })
  }

  const renderAttributeForm = (attribute: CategoryAttribute, index: number) => {
    const isActive = activeAttributeIndex === index

    return (
      <Card key={attribute.id} className={`mb-4 ${isActive ? 'border-primary' : ''}`}>
        <CardHeader className="py-3 cursor-pointer" onClick={() => setActiveAttributeIndex(isActive ? null : index)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">#{attribute.sortOrder}</Badge>
              </div>
              <CardTitle className="text-base">
                {attribute.name || `Attribute ${index + 1}`}
              </CardTitle>
              <Badge variant="secondary">
                {attribute.type}
              </Badge>
              {attribute.isRequired && (
                <Badge variant="destructive">Required</Badge>
              )}
              {!attribute.isFilterable && (
                <Badge variant="outline">Hidden</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  duplicateAttribute(index)
                }}
                disabled={isSubmitting}
              >
                <Copy className="h-3 w-3" />
              </Button>
              {isActive ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>
        
        {isActive && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attribute Name */}
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Attribute Name *</Label>
                  <Input
                    id={`name-${index}`}
                    value={attribute.name}
                    onChange={(e) => updateAttribute(index, 'name', e.target.value)}
                    placeholder="e.g., Size, Color, Material"
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Attribute Type */}
                <div className="space-y-2">
                  <Label htmlFor={`type-${index}`}>Attribute Type</Label>
                  <Select
                    value={attribute.type}
                    onValueChange={(value: CategoryAttribute['type']) => updateAttribute(index, 'type', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={`type-${index}`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text Field</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="select">Dropdown Select</SelectItem>
                      <SelectItem value="color">Color Selector</SelectItem>
                      <SelectItem value="boolean">Yes/No Toggle</SelectItem>
                      <SelectItem value="range">Range Slider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Options for select/checkbox/color types */}
              {(attribute.type === 'select' || attribute.type === 'color' || attribute.filterType === 'checkbox') && (
                <div className="space-y-2">
                  <Label htmlFor={`options-${index}`}>
                    {attribute.type === 'color' ? 'Colors (hex codes or names)' : 'Options'}
                  </Label>
                  <Textarea
                    id={`options-${index}`}
                    value={attribute.options.join(', ')}
                    onChange={(e) => updateOptions(index, e.target.value)}
                    placeholder={
                      attribute.type === 'color' 
                        ? "#000000, #FFFFFF, #FF0000, Red, Blue, Green"
                        : "Small, Medium, Large, XL"
                    }
                    disabled={isSubmitting}
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {attribute.options.map((option, optIndex) => (
                      <Badge
                        key={optIndex}
                        variant="secondary"
                        className="flex items-center gap-1"
                        style={
                          attribute.type === 'color' 
                            ? { backgroundColor: option, color: '#000000' }
                            : {}
                        }
                      >
                        {attribute.type === 'color' && (
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: option }}
                          />
                        )}
                        {option}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Units and range settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(attribute.type === 'number' || attribute.type === 'range') && (
                  <div className="space-y-2">
                    <Label htmlFor={`units-${index}`}>Units</Label>
                    <Input
                      id={`units-${index}`}
                      value={attribute.units || ''}
                      onChange={(e) => updateAttribute(index, 'units', e.target.value)}
                      placeholder="e.g., kg, cm, GB, inches"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
                
                {attribute.type === 'range' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`min-${index}`}>Min Value</Label>
                      <Input
                        id={`min-${index}`}
                        type="number"
                        value={attribute.minValue || 0}
                        onChange={(e) => updateAttribute(index, 'minValue', parseFloat(e.target.value))}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`max-${index}`}>Max Value</Label>
                      <Input
                        id={`max-${index}`}
                        type="number"
                        value={attribute.maxValue || 100}
                        onChange={(e) => updateAttribute(index, 'maxValue', parseFloat(e.target.value))}
                        disabled={isSubmitting}
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Placeholder for text fields */}
              {attribute.type === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor={`placeholder-${index}`}>Placeholder Text</Label>
                  <Input
                    id={`placeholder-${index}`}
                    value={attribute.placeholder || ''}
                    onChange={(e) => updateAttribute(index, 'placeholder', e.target.value)}
                    placeholder="e.g., Enter brand name"
                    disabled={isSubmitting}
                  />
                </div>
              )}
              
              {/* Switches */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`required-${index}`}
                    checked={attribute.isRequired}
                    onCheckedChange={(checked) => updateAttribute(index, 'isRequired', checked)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={`required-${index}`} className="cursor-pointer text-sm">
                    Required Field
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`filterable-${index}`}
                    checked={attribute.isFilterable}
                    onCheckedChange={(checked) => updateAttribute(index, 'isFilterable', checked)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={`filterable-${index}`} className="cursor-pointer text-sm">
                    Show in Shop Filters
                  </Label>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">
                    Sort Order: {attribute.sortOrder}
                  </Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveAttribute(index, index - 1)}
                      disabled={isSubmitting || index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveAttribute(index, index + 1)}
                      disabled={isSubmitting || index === attributes.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Delete button */}
              <div className="flex justify-end pt-2 border-t">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeAttribute(index)}
                  disabled={isSubmitting || attributes.length <= 1}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Attribute
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Filter Attributes</h3>
          <p className="text-sm text-muted-foreground">
            Define product specifications and filters for vendors
          </p>
        </div>
        <Button
          type="button"
          onClick={addAttribute}
          disabled={isSubmitting}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Attribute
        </Button>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base">Quick Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('clothing')}
              disabled={isSubmitting}
            >
              👕 Clothing
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('electronics')}
              disabled={isSubmitting}
            >
              📱 Electronics
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('furniture')}
              disabled={isSubmitting}
            >
              🛋️ Furniture
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadTemplate('groceries')}
              disabled={isSubmitting}
            >
              🛒 Groceries
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAttributesChange([])}
              disabled={isSubmitting}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attributes List */}
      <div className="space-y-2">
        {attributes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No attributes defined</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add attributes to create filters for products in this category.
              Vendors will fill these when adding products.
            </p>
            <Button
              type="button"
              onClick={addAttribute}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Attribute
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {attributes.length} attribute{attributes.length !== 1 ? 's' : ''}
                </Badge>
                <Badge variant="outline">
                  {attributes.filter(a => a.isRequired).length} required
                </Badge>
                <Badge variant="outline">
                  {attributes.filter(a => a.isFilterable).length} filterable
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </div>

            {/* Attributes Form */}
            <div className="space-y-2">
              {attributes.map((attr, index) => renderAttributeForm(attr, index))}
            </div>
          </>
        )}
      </div>

      {/* Live Preview */}
      {showPreview && attributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              How filters will appear in shop and product form
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="vendor" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="vendor">Vendor Product Form</TabsTrigger>
                <TabsTrigger value="shop">Shop Filters</TabsTrigger>
              </TabsList>
              
              <TabsContent value="vendor" className="space-y-4 pt-4">
                <h4 className="font-medium">How vendors will see it:</h4>
                {attributes.map((attr, index) => (
                  <div key={attr.id} className="space-y-2 p-3 border rounded-lg">
                    <Label>
                      {attr.name}
                      {attr.isRequired && <span className="text-red-500 ml-1">*</span>}
                      {attr.units && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({attr.units})
                        </span>
                      )}
                    </Label>
                    {attr.type === 'text' && (
                      <Input
                        placeholder={attr.placeholder || `Enter ${attr.name.toLowerCase()}`}
                        disabled
                      />
                    )}
                    {attr.type === 'number' && (
                      <Input
                        type="number"
                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                        disabled
                      />
                    )}
                    {attr.type === 'select' && (
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${attr.name.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {attr.options.map((option, idx) => (
                            <SelectItem key={idx} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {attr.type === 'color' && (
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-full border cursor-pointer"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    )}
                    {attr.type === 'boolean' && (
                      <div className="flex items-center space-x-2">
                        <Switch disabled />
                        <Label>Yes/No</Label>
                      </div>
                    )}
                    {attr.type === 'range' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{attr.minValue || 0}{attr.units}</span>
                          <span>{attr.maxValue || 100}{attr.units}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full"></div>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="shop" className="space-y-4 pt-4">
                <h4 className="font-medium">How customers will filter:</h4>
                {attributes
                  .filter(attr => attr.isFilterable)
                  .map((attr, index) => (
                    <div key={attr.id} className="space-y-2 p-3 border rounded-lg">
                      <h5 className="font-medium">{attr.name}</h5>
                      {attr.filterType === 'dropdown' && (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder={`All ${attr.name}`} />
                          </SelectTrigger>
                        </Select>
                      )}
                      {attr.filterType === 'checkbox' && (
                        <div className="space-y-2">
                          {attr.options.slice(0, 5).map((option, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <div className="h-4 w-4 border rounded"></div>
                              <Label className="text-sm">{option}</Label>
                            </div>
                          ))}
                          {attr.options.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{attr.options.length - 5} more options
                            </p>
                          )}
                        </div>
                      )}
                      {attr.filterType === 'color_swatch' && (
                        <div className="flex flex-wrap gap-2">
                          {attr.options.map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full border cursor-pointer"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      )}
                      {attr.filterType === 'range_slider' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{attr.minValue || 0}{attr.units}</span>
                            <span>{attr.maxValue || 100}{attr.units}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full"></div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Min"
                              className="text-xs"
                              disabled
                            />
                            <Input
                              placeholder="Max"
                              className="text-xs"
                              disabled
                            />
                          </div>
                        </div>
                      )}
                      {attr.filterType === 'toggle' && (
                        <div className="flex items-center space-x-2">
                          <Switch disabled />
                          <Label className="text-sm">{attr.name}</Label>
                        </div>
                      )}
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
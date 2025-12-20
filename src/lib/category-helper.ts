// lib/category-helpers.ts
interface ManagedCategory {
  id: string
  name: string
  description: string | null
  isActive: boolean
  productCount: number
  type: 'MAIN' | 'SUB'
  level: number
  parentId: string | null
  children?: ManagedCategory[]
}

// Get category hierarchy display name
export function getCategoryHierarchyName(category: ManagedCategory, allCategories: ManagedCategory[]): string {
  if (category.type === 'SUB' && category.parentId) {
    const parent = allCategories.find(c => c.id === category.parentId)
    return parent ? `${parent.name} - ${category.name}` : category.name
  }
  return category.name
}

// Get category path (breadcrumb)
export function getCategoryPath(categoryId: string, allCategories: ManagedCategory[]): string[] {
  const path: string[] = []
  let currentCategory = allCategories.find(c => c.id === categoryId)
  
  while (currentCategory) {
    path.unshift(currentCategory.name)
    if (currentCategory.parentId) {
      currentCategory = allCategories.find(c => c.id === currentCategory?.parentId)
    } else {
      break
    }
  }
  
  return path
}

// Filter categories for selection (only active, with hierarchy)
export function getSelectableCategories(allCategories: ManagedCategory[]): ManagedCategory[] {
  return allCategories
    .filter(category => category.isActive)
    .sort((a, b) => {
      // Sort by type (MAIN first), then by name
      if (a.type === b.type) {
        return a.name.localeCompare(b.name)
      }
      return a.type === 'MAIN' ? -1 : 1
    })
}

// Get main categories with their subcategories
export function getMainCategoriesWithSub(allCategories: ManagedCategory[]): ManagedCategory[] {
  const mainCategories = allCategories.filter(cat => cat.type === 'MAIN' && cat.isActive)
  
  return mainCategories.map(mainCategory => ({
    ...mainCategory,
    children: allCategories.filter(cat => 
      cat.parentId === mainCategory.id && cat.isActive
    )
  }))
}
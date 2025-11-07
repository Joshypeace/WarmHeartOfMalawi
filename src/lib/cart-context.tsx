"use client"

import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  vendorName: string
  inStock: boolean
  stockCount: number
}

interface CartState {
  items: CartItem[]
  loading: boolean
  syncing: boolean
  error: string | null
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SYNCING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }

interface CartContextType extends CartState {
  addItem: (productId: string, quantity?: number) => Promise<{ success: boolean; error?: string }>
  updateQuantity: (id: string, quantity: number) => Promise<{ success: boolean; error?: string }>
  removeItem: (id: string) => Promise<{ success: boolean; error?: string }>
  clearCart: () => Promise<{ success: boolean; error?: string }>
  refreshCart: () => Promise<void>
  total: number
  itemCount: number
  isEmpty: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_SYNCING':
      return { ...state, syncing: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'SET_CART':
      return { ...state, items: action.payload, error: null }
    case 'ADD_ITEM':
      const existingItemIndex = state.items.findIndex(item => item.productId === action.payload.productId)
      if (existingItemIndex !== -1) {
        const newItems = [...state.items]
        newItems[existingItemIndex] = action.payload
        return { ...state, items: newItems, error: null }
      }
      return { ...state, items: [...state.items, action.payload], error: null }
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        error: null
      }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        error: null
      }
    case 'CLEAR_CART':
      return { ...state, items: [], error: null }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    loading: true,
    syncing: false,
    error: null
  })

  const fetchCart = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await fetch('/api/cart')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          dispatch({ type: 'SET_CART', payload: data.items || [] })
        } else {
          dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to load cart' })
          dispatch({ type: 'SET_CART', payload: [] })
        }
      } else if (response.status === 401) {
        // User is not authenticated, set empty cart
        dispatch({ type: 'SET_CART', payload: [] })
      } else {
        const errorData = await response.json()
        dispatch({ type: 'SET_ERROR', payload: errorData.error || 'Failed to load cart' })
        dispatch({ type: 'SET_CART', payload: [] })
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Network error loading cart' })
      dispatch({ type: 'SET_CART', payload: [] })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Fetch cart on mount
  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const addItem = async (productId: string, quantity: number = 1): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_SYNCING', payload: true })
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        dispatch({ type: 'ADD_ITEM', payload: data.item })
        return { success: true }
      } else {
        dispatch({ type: 'SET_ERROR', payload: data.error || 'Failed to add item' })
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error adding item to cart:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Network error adding item' })
      return { success: false, error: 'Network error' }
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false })
    }
  }

  const updateQuantity = async (id: string, quantity: number): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_SYNCING', payload: true })
      
      const response = await fetch(`/api/cart/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        dispatch({ type: 'UPDATE_ITEM', payload: { id, quantity: data.item.quantity } })
        return { success: true }
      } else {
        // Refetch cart to get correct state
        await fetchCart()
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error updating item quantity:', error)
      await fetchCart()
      return { success: false, error: 'Network error' }
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false })
    }
  }

  const removeItem = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_SYNCING', payload: true })
      
      const response = await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        dispatch({ type: 'REMOVE_ITEM', payload: id })
        return { success: true }
      } else {
        await fetchCart()
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error removing item from cart:', error)
      await fetchCart()
      return { success: false, error: 'Network error' }
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false })
    }
  }

  const clearCart = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_SYNCING', payload: true })
      const response = await fetch('/api/cart/clear', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        dispatch({ type: 'CLEAR_CART' })
        return { success: true }
      } else {
        await fetchCart()
        return { success: false, error: data.error }
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      await fetchCart()
      return { success: false, error: 'Network error' }
    } finally {
      dispatch({ type: 'SET_SYNCING', payload: false })
    }
  }

  const refreshCart = async () => {
    await fetchCart()
  }

  const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const itemCount = state.items.reduce((count, item) => count + item.quantity, 0)
  const isEmpty = state.items.length === 0

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        loading: state.loading,
        syncing: state.syncing,
        error: state.error,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        total,
        itemCount,
        isEmpty,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
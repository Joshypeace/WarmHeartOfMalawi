// lib/cart-context.tsx
"use client"

import React, { createContext, useContext, useReducer, useEffect } from 'react'

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  vendorId: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  loading: boolean
}

type CartAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ITEMS'; payload: CartItem[] }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }

interface CartContextType extends CartState {
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  updateQuantity: (id: string, quantity: number) => Promise<void>
  removeItem: (id: string) => Promise<void>
  clearCart: () => Promise<void>
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ITEMS':
      return { ...state, items: action.payload }
    case 'ADD_ITEM':
      const existingItem = state.items.find(item => item.productId === action.payload.productId)
      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.productId === action.payload.productId
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          )
        }
      }
      return { ...state, items: [...state.items, action.payload] }
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity === 0) {
        return {
          ...state,
          items: state.items.filter(item => item.id !== action.payload.id)
        }
      }
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      }
    case 'CLEAR_CART':
      return { ...state, items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    loading: true
  })

  // Load cart from backend on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        const response = await fetch('/api/cart')
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            dispatch({ type: 'SET_ITEMS', payload: data.data.items })
          }
        }
      } catch (error) {
        console.error('Failed to load cart:', error)
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadCart()
  }, [])

  const addItem = async (itemData: Omit<CartItem, 'id'>) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: itemData.productId,
          quantity: itemData.quantity
        }),
      })

      const data = await response.json()

      if (data.success) {
        dispatch({ type: 'ADD_ITEM', payload: data.data.item })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error)
      throw error
    }
  }

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      })

      const data = await response.json()

      if (data.success) {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to update cart item:', error)
      throw error
    }
  }

  const removeItem = async (id: string) => {
    try {
      const response = await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        dispatch({ type: 'REMOVE_ITEM', payload: id })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to remove item from cart:', error)
      throw error
    }
  }

  const clearCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        dispatch({ type: 'CLEAR_CART' })
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Failed to clear cart:', error)
      throw error
    }
  }

  const total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        loading: state.loading,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        total,
        itemCount: state.items.reduce((count, item) => count + item.quantity, 0)
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
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type UserRole = "customer" | "vendor" | "admin"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  businessName?: string
  businessDescription?: string
  isApproved?: boolean
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
  isLoading: boolean
  register: (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    businessInfo?: { businessName: string; businessDescription: string },
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("wahea_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, role: UserRole) => {
    // Mock login - in production, this would call an API
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: email.split("@")[0],
      email,
      role,
      avatar: `/placeholder.svg?height=40&width=40&query=user+avatar`,
      isApproved: role === "vendor" ? true : undefined,
    }

    setUser(mockUser)
    localStorage.setItem("wahea_user", JSON.stringify(mockUser))
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole,
    businessInfo?: { businessName: string; businessDescription: string },
  ) => {
    // Mock registration - in production, this would call an API
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      role,
      avatar: `/placeholder.svg?height=40&width=40&query=user+avatar`,
      businessName: businessInfo?.businessName,
      businessDescription: businessInfo?.businessDescription,
      isApproved: role === "vendor" ? false : undefined,
    }

    setUser(mockUser)
    localStorage.setItem("wahea_user", JSON.stringify(mockUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("wahea_user")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading, register }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

type UserRole = "customer" | "vendor" | "admin" | "regional_admin"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requireAuth?: boolean
}

export function ProtectedRoute({ children, allowedRoles, requireAuth = true }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user) {
        router.push("/login")
      } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        switch (user.role) {
          case "vendor":
            router.push("/vendor/dashboard")
            break
          case "admin":
            router.push("/admin/dashboard")
            break
          case "regional_admin":
            router.push("/regional-admin/dashboard")
            break
          default:
            router.push("/")
        }
      }
    }
  }, [user, isLoading, requireAuth, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}

// src/components/protected-route.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[]; // Accept both uppercase and lowercase
  redirectTo?: string;
}

export default function ProtectedRoute({
  children,
  requireAuth = true,
  allowedRoles = [],
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      router.push(redirectTo);
    } else if (user && allowedRoles.length > 0) {
      // Normalize role comparison - handle both uppercase and lowercase
      const userRole = user.role.toLowerCase();
      const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
      
      if (!normalizedAllowedRoles.includes(userRole)) {
        // Redirect based on user role
        switch (user.role) {
          case "VENDOR":
            router.push("/vendor/dashboard");
            break;
          case "ADMIN":
            router.push("/admin/dashboard");
            break;
          case "REGIONAL_ADMIN":
            router.push("/regional-admin/dashboard");
            break;
          default:
            router.push("/shop");
        }
      }
    }
  }, [user, isLoading, requireAuth, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (user && allowedRoles.length > 0) {
    const userRole = user.role.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    if (!normalizedAllowedRoles.includes(userRole)) {
      return null;
    }
  }

  return <>{children}</>;
}
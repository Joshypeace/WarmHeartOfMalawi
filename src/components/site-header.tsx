"use client"

import Link from "next/link"
import { ShoppingCart, User, Heart, Menu, Search, X, Store, Shield, MapPin, Package, Settings, BarChart3, Users, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { useCart } from "@/lib/cart-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { UserRole } from "@/lib/role-utils"

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function SiteHeader() {
  const { user, logout, isLoading } = useAuth()
  const { itemCount } = useCart()

  const [scrolled, setScrolled] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const getDashboardLink = () => {
    if (!user) return "/login"
    switch (user.role) {
      case "vendor": return "/vendor/dashboard"
      case "admin": return "/admin/dashboard"
      case "regional_admin": return "/regional-admin/dashboard"
      case "customer": return "/customer/orders"
      default: return "/customer/orders"
    }
  }

  const formatRoleDisplay = (role: UserRole) =>
    role === "vendor" ? "Vendor"
    : role === "admin" ? "Admin"
    : role === "regional_admin" ? "Regional Admin"
    : "Customer"

  const getRoleIcon = (role: UserRole) =>
    role === "vendor" ? <Store className="h-4 w-4" />
    : role === "admin" ? <Shield className="h-4 w-4" />
    : role === "regional_admin" ? <MapPin className="h-4 w-4" />
    : <User className="h-4 w-4" />

  const getRoleNavigation = (): NavigationItem[] => {
    if (!user) return []
    switch (user.role) {
      case "vendor":
        return [
          { href: "/vendor/dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
          { href: "/vendor/products", label: "My Products", icon: <Package className="h-4 w-4" /> },
          { href: "/vendor/orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4" /> },
        ]
      case "admin":
        return [
          { href: "/admin/dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
          { href: "/admin/users", label: "Users", icon: <Users className="h-4 w-4" /> },
          { href: "/admin/vendors", label: "Vendors", icon: <Store className="h-4 w-4" /> },
          { href: "/admin/categories", label: "Categories", icon: <Settings className="h-4 w-4" /> },
        ]
      case "regional_admin":
        return [
          { href: "/regional-admin/dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
          { href: "/regional-admin/vendors", label: "District Vendors", icon: <Store className="h-4 w-4" /> },
        ]
      case "customer":
        return [
          { href: "/customer/orders", label: "My Orders", icon: <Package className="h-4 w-4" /> },
          { href: "/customer/wishlist", label: "Wishlist", icon: <Heart className="h-4 w-4" /> },
        ]
      default:
        return []
    }
  }

  const roleNavigation = getRoleNavigation()
  const dashboardLink = getDashboardLink()

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b shadow-sm"
          : "bg-background/70 backdrop-blur-md border-b"
      }`}
    >
      <div className="container h-16 md:h-20 flex items-center justify-between gap-2 px-4 md:px-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-4 shrink-0">
          <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Heart className="h-5 w-5 md:h-6 md:w-6 fill-current" />
          </div>
          <span className="hidden sm:block text-xl md:text-2xl font-bold">
            WaHeA
          </span>
        </Link>

        {/* Search (Centered Amazon Style) */}
        <div className="hidden md:flex flex-1 max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for products..."
              className="pl-10 h-11 bg-muted/50"
            />
          </div>
        </div>

        {/* Navigation (Only Shop & Categories) */}
        <nav className="hidden lg:flex items-center gap-6 ml-4">
          <Link href="/shop" className="text-sm font-medium hover:text-primary">
            Shop
          </Link>
          <Link href="/categories" className="text-sm font-medium hover:text-primary">
            Categories
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2">

          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Cart */}
          {(user?.role === "customer" || user?.role === "vendor") && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-11 md:w-11">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                    variant="destructive"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* User */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-11 md:w-11">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="p-4">
                  <div className="flex gap-3 items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {roleNavigation.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center gap-3 px-2 py-2">
                      {item.icon} {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link href={dashboardLink} className="flex items-center gap-3 px-2 py-2">
                    <Home className="h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive flex items-center gap-3 px-2 py-2"
                >
                  <X className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="h-9 md:h-11">
              <Link href="/login">Login</Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 md:h-11 md:w-11">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <nav className="flex flex-col mt-10 space-y-3 text-base">
                <SheetClose asChild>
                  <Link href="/shop" className="px-4 py-3 rounded-lg hover:bg-accent">
                    Shop
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/categories" className="px-4 py-3 rounded-lg hover:bg-accent">
                    Categories
                  </Link>
                </SheetClose>

                {user && (
                  <div className="pt-4 border-t mt-4">
                    {roleNavigation.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link href={item.href} className="px-4 py-3 flex items-center gap-3 rounded-lg hover:bg-accent">
                          {item.icon} {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mobile Search */}
      {mobileSearchOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="container px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10 pr-10 h-10" placeholder="Search products..." autoFocus />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setMobileSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

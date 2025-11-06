"use client"

import Link from "next/link"
import { ShoppingCart, User, Heart, Menu, Search, Sparkles, X, Store, Shield, MapPin, Package, Settings, BarChart3, Users, Home } from "lucide-react"
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
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const getDashboardLink = (): string => {
    if (!user) return "/login"
    
    switch (user.role) {
      case "vendor":
        return "/vendor/dashboard"
      case "admin":
        return "/admin/dashboard"
      case "regional_admin":
        return "/regional-admin/dashboard"
      case "customer":
        return "/customer/orders"
      default:
        return "/customer/orders"
    }
  }

  const formatRoleDisplay = (role: UserRole): string => {
    switch (role) {
      case "vendor":
        return "Vendor"
      case "admin":
        return "Admin"
      case "regional_admin":
        return "Regional Admin"
      case "customer":
        return "Customer"
      default:
        return "User"
    }
  }

  const getRoleIcon = (role: UserRole): React.ReactNode => {
    switch (role) {
      case "vendor":
        return <Store className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      case "regional_admin":
        return <MapPin className="h-4 w-4" />
      case "customer":
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleNavigation = (): NavigationItem[] => {
    if (!user || !user.role) return []

    const roleNavigation: Record<UserRole, NavigationItem[]> = {
      vendor: [
        { href: "/vendor/dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
        { href: "/vendor/products", label: "My Products", icon: <Package className="h-4 w-4" /> },
        { href: "/vendor/orders", label: "Orders", icon: <ShoppingCart className="h-4 w-4" /> },
        { href: "/vendor/analytics", label: "Analytics", icon: <Store className="h-4 w-4" /> },
      ],
      admin: [
        { href: "/admin/dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
        { href: "/admin/users", label: "User Management", icon: <Users className="h-4 w-4" /> },
        { href: "/admin/vendors", label: "Vendor Approvals", icon: <Store className="h-4 w-4" /> },
        { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
      ],
      regional_admin: [
        { href: "/regional-admin/dashboard", label: "Dashboard", icon: <BarChart3 className="h-4 w-4" /> },
        { href: "/regional-admin/vendors", label: "District Vendors", icon: <Store className="h-4 w-4" /> },
        { href: "/regional-admin/users", label: "District Users", icon: <ShoppingCart className="h-4 w-4" /> },
        // { href: "/regional-admin/analytics", label: "District Analytics", icon: <BarChart3 className="h-4 w-4" /> },
      ],
      customer: [
        { href: "/customer/orders", label: "My Orders", icon: <Package className="h-4 w-4" /> },
        // { href: "/customer/wishlist", label: "Wishlist", icon: <Heart className="h-4 w-4" /> },
        // { href: "/customer/addresses", label: "Addresses", icon: <MapPin className="h-4 w-4" /> },
      ]
    }

    return roleNavigation[user.role] || []
  }

  const roleNavigation = getRoleNavigation()
  const dashboardLink = getDashboardLink()

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border/20">
        <div className="container flex h-16 md:h-20 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 md:h-12 md:w-12 bg-muted rounded-xl animate-pulse" />
            <div className="hidden sm:flex flex-col gap-1">
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 md:h-11 md:w-11 bg-muted rounded animate-pulse" />
            <div className="h-9 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "glass-effect shadow-lg border-b border-border/40"
          : "bg-background/80 backdrop-blur-md border-b border-border/20"
      }`}
    >
      <div className="container flex h-16 md:h-20 items-center justify-between gap-2 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
          <div className="relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
            <Heart className="h-5 w-5 md:h-7 md:w-7 text-primary-foreground fill-current" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              WaHeA
            </span>
            <span className="text-[9px] md:text-[10px] text-muted-foreground -mt-1">Warm Heart of Malawi</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {[
            { href: "/shop", label: "Shop" },
            { href: "/categories", label: "Categories" },
            { href: "/vendors", label: "Vendors" },
            { href: "/about", label: "About" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3 xl:px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors duration-200 group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </nav>

        {/* Desktop Search */}
        <div className="hidden xl:flex flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-11 h-11 bg-muted/50 border-border/50"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden h-9 w-9 md:h-11 md:w-11"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          >
            <Search className="h-4 w-4 md:h-5 md:w-5" />
          </Button>

          {/* Cart - Only for customers and vendors */}
          {user && (user.role === "customer" || user.role === "vendor") && (
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 md:h-11 md:w-11"
              >
                <ShoppingCart className="h-4 w-4 md:h-5 md:w-5" />
                {itemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 text-[10px] md:text-xs bg-gradient-to-br from-primary to-accent border-2 border-background"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 md:h-11 md:w-11"
                >
                  <User className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        {getRoleIcon(user.role)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="w-fit text-xs bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {formatRoleDisplay(user.role)}
                      {user.district && ` • ${user.district}`}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />

                {/* Role-specific Navigation */}
                {roleNavigation && roleNavigation.length > 0 && (
                  <>
                    <div className="p-1">
                      {roleNavigation.map((item) => (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 px-2 py-2 text-sm cursor-pointer"
                          >
                            {item.icon}
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Common Navigation */}
                <DropdownMenuItem asChild>
                  <Link
                    href={dashboardLink}
                    className="flex items-center gap-3 px-2 py-2 text-sm cursor-pointer"
                  >
                    <Home className="h-4 w-4" />
                    Main Dashboard
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-2 py-2 text-sm cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>

                {user.role === "vendor" && (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/vendor/settings"
                      className="flex items-center gap-3 px-2 py-2 text-sm cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      Shop Settings
                    </Link>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-3 px-2 py-2 text-sm text-destructive cursor-pointer focus:text-destructive"
                >
                  <X className="h-4 w-4" />
                  Logout
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
                <Menu className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <nav className="flex flex-col gap-1 mt-8">
                {/* Common Navigation */}
                {[
                  { href: "/shop", label: "Shop" },
                  { href: "/categories", label: "Categories" },
                  { href: "/vendors", label: "Vendors" },
                  { href: "/about", label: "About" },
                ].map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center px-4 py-3 text-base font-medium rounded-lg hover:bg-accent transition-colors"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}

                {/* Role-specific Navigation */}
                {user && roleNavigation && roleNavigation.length > 0 && (
                  <div className="border-t border-border/40 mt-4 pt-4">
                    <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">
                      {formatRoleDisplay(user.role)} Menu
                    </p>
                    {roleNavigation.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg hover:bg-accent transition-colors"
                        >
                          {item.icon}
                          {item.label}
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

      {/* Mobile Search Bar */}
      {mobileSearchOpen && (
        <div className="xl:hidden border-t border-border/40 bg-background/95 backdrop-blur-sm">
          <div className="container px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-10 pr-10 h-10"
                autoFocus
              />
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
"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Mail, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"customer" | "vendor" | "admin">("customer")
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(email, password, selectedRole)
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      })

      // Redirect based on role
      switch (selectedRole) {
        case "vendor":
          router.push("/vendor/dashboard")
          break
        case "admin":
          router.push("/admin/dashboard")
          break
        default:
          router.push("/shop")
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6 md:mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground fill-current" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-foreground">WaHeA</span>
          </Link>
          <p className="text-sm md:text-base text-muted-foreground text-center px-4">
            Welcome back to the Warm Heart of Malawi
          </p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-xl md:text-2xl">Sign In</CardTitle>
            <CardDescription className="text-sm">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 md:h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 md:h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Login as</Label>
                <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-9 md:h-10">
                    <TabsTrigger value="customer" className="text-xs md:text-sm">
                      Customer
                    </TabsTrigger>
                    <TabsTrigger value="vendor" className="text-xs md:text-sm">
                      Vendor
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="text-xs md:text-sm">
                      Admin
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Button type="submit" className="w-full h-10 md:h-11 text-sm md:text-base" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-3 md:gap-4 px-4 md:px-6 pb-4 md:pb-6">
            <div className="text-xs md:text-sm text-center text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
            <Link
              href="/forgot-password"
              className="text-xs md:text-sm text-center text-muted-foreground hover:text-foreground"
            >
              Forgot your password?
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

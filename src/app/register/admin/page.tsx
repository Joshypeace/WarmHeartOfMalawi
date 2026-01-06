"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Mail, Lock, UserIcon, Loader2, Shield, MapPin, ArrowLeft, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { signIn } from "next-auth/react"

const MALAWI_DISTRICTS = [
  "Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Kasungu", "Nkhotakota", "Salima", "Machinga",
  "Mangochi", "Ntcheu", "Ntchisi", "Dedza", "Dowa", "Nkhata Bay", "Rumphi", "Karonga", "Chitipa",
]

type AdminType = "ADMIN" | "REGIONAL_ADMIN"

export default function AdminRegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [district, setDistrict] = useState("")
  const [adminType, setAdminType] = useState<AdminType>("ADMIN")
  const [accessCode, setAccessCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    if (adminType === "REGIONAL_ADMIN" && !district) {
      toast({
        title: "District required",
        description: "Please select a district for regional admin.",
        variant: "destructive",
      })
      return
    }

    // Validate access code
    const correctAdminCode = process.env.NEXT_PUBLIC_ADMIN_ACCESS_CODE
    const correctRegionalCode = process.env.NEXT_PUBLIC_REGIONAL_ADMIN_ACCESS_CODE
    
    if (adminType === "ADMIN" && accessCode !== correctAdminCode) {
      toast({
        title: "Invalid access code",
        description: "The admin access code is incorrect.",
        variant: "destructive",
      })
      return
    }

    if (adminType === "REGIONAL_ADMIN" && accessCode !== correctRegionalCode) {
      toast({
        title: "Invalid access code",
        description: "The regional admin access code is incorrect.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
          district: district || undefined,
          role: adminType,
          accessCode: accessCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      toast({
        title: "Admin Account Created Successfully! 🎉",
        description: `Your ${adminType === "ADMIN" ? "admin" : "regional admin"} account has been created.`,
        variant: "default",
      })
      
      // Auto-login
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error(result.error)
        }

        // Redirect to appropriate dashboard
        const redirectPath = adminType === "ADMIN" ? "/admin/dashboard" : "/regional-admin/dashboard"
        router.push(redirectPath)
        router.refresh()
        
      } catch (loginError) {
        // If auto-login fails, redirect to login page
        router.push("/login")
      }

    } catch (error: any) {
      console.error('Registration error:', error)
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-6 w-6 text-primary-foreground fill-current" />
            </div>
            <span className="text-xl font-bold text-foreground">WaHeA</span>
          </Link>
          <p className="text-muted-foreground text-center text-sm">Admin Registration Portal</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="pb-3">
            <Button variant="ghost" size="sm" asChild className="w-fit -ml-2 mb-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Admin Registration</CardTitle>
                <CardDescription>Create a staff/admin account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <div className="flex items-start gap-2">
                  <Key className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Restricted Access</p>
                    <p className="text-xs text-blue-700 mt-1">
                      This portal is for authorized personnel only. Access requires valid credentials.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin Type *</Label>
                <RadioGroup 
                  value={adminType} 
                  onValueChange={(value) => setAdminType(value as AdminType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ADMIN" id="admin" />
                    <Label htmlFor="admin" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="h-4 w-4" />
                      <span>System Admin</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="REGIONAL_ADMIN" id="regional_admin" />
                    <Label htmlFor="regional_admin" className="flex items-center gap-2 cursor-pointer">
                      <MapPin className="h-4 w-4" />
                      <span>Regional Admin</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {adminType === "REGIONAL_ADMIN" && (
                <div className="space-y-2">
                  <Label htmlFor="district">Manage District *</Label>
                  <Select
                    value={district}
                    onValueChange={setDistrict}
                    required
                  >
                    <SelectTrigger className="pl-10">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {MALAWI_DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="accessCode">
                  {adminType === "ADMIN" ? "Admin Access Code" : "Regional Admin Access Code"} *
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="accessCode"
                    type="password"
                    placeholder="Enter access code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={8}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  `Create ${adminType === "ADMIN" ? "Admin" : "Regional Admin"} Account`
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <div className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
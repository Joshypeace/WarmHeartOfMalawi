"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Mail, Lock, UserIcon, Loader2, Store, Shield, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/lib/role-utils"

const MALAWI_DISTRICTS = [
  "Lilongwe",
  "Blantyre",
  "Mzuzu",
  "Zomba",
  "Kasungu",
  "Nkhotakota",
  "Salima",
  "Machinga",
  "Mangochi",
  "Ntcheu",
  "Ntchisi",
  "Dedza",
  "Dowa",
  "Nkhata Bay",
  "Rumphi",
  "Karonga",
  "Chitipa",
]

export default function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")
  const [district, setDistrict] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer")
  const { login } = useAuth()
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

    if ((selectedRole === "vendor" || selectedRole === "regional_admin") && !district) {
      toast({
        title: "District required",
        description: "Please select your district.",
        variant: "destructive",
      })
      return
    }

    if (selectedRole === "vendor" && !businessName) {
      toast({
        title: "Business name required",
        description: "Please enter your business name.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
          phone: phone || undefined,
          district: district || undefined,
          role: selectedRole.toUpperCase(),
          businessName: selectedRole === 'vendor' ? businessName : undefined,
          businessDescription: selectedRole === 'vendor' ? businessDescription : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // After successful registration, log the user in
      await login(email, password, selectedRole)

      toast({
        title: "Account created successfully!",
        description:
          selectedRole === "vendor"
            ? "Your vendor account has been created and is pending approval."
            : selectedRole === "regional_admin"
              ? `Regional admin account created for ${district} district.`
              : selectedRole === "admin"
                ? "Super admin account created."
                : "Welcome to WaHeA! Start shopping now.",
      })

      // Redirect based on role
      if (selectedRole === "vendor") {
        router.push("/vendor/dashboard")
      } else if (selectedRole === "admin") {
        router.push("/admin/dashboard")
      } else if (selectedRole === "regional_admin") {
        router.push("/regional-admin/dashboard")
      } else {
        router.push("/shop")
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
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-7 w-7 text-primary-foreground fill-current" />
            </div>
            <span className="text-2xl font-bold text-foreground">WaHeA</span>
          </Link>
          <p className="text-muted-foreground text-center">Join the Warm Heart of Malawi</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up to start shopping, selling, or managing</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)} className="mb-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="customer" className="text-xs">
                  <UserIcon className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Customer</span>
                </TabsTrigger>
                <TabsTrigger value="vendor" className="text-xs">
                  <Store className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Vendor</span>
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs">
                  <Shield className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
                <TabsTrigger value="regional_admin" className="text-xs">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Reg. Admin</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {selectedRole === "vendor"
                    ? "Your Name"
                    : selectedRole === "admin"
                      ? "Admin Name"
                      : selectedRole === "regional_admin"
                        ? "Full Name"
                        : "Full Name"}
                </Label>
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
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+265 XXX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {(selectedRole === "customer" || selectedRole === "vendor" || selectedRole === "regional_admin") && (
                <div className="space-y-2">
                  <Label htmlFor="district">
                    {selectedRole === "regional_admin" ? "Manage District" : "Your District"}
                    {(selectedRole === "vendor" || selectedRole === "regional_admin") && " *"}
                  </Label>
                  <Select 
                    value={district} 
                    onValueChange={setDistrict}
                    required={selectedRole === "vendor" || selectedRole === "regional_admin"}
                  >
                    <SelectTrigger className="pl-10">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select a district" />
                    </SelectTrigger>
                    <SelectContent>
                      {MALAWI_DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(selectedRole === "vendor" || selectedRole === "regional_admin") && (
                    <p className="text-xs text-muted-foreground">
                      {selectedRole === "regional_admin" 
                        ? "You will manage users and vendors in this district" 
                        : "Your business will operate in this district"}
                    </p>
                  )}
                </div>
              )}

              {selectedRole === "vendor" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="My Awesome Store"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessDescription">Business Description</Label>
                    <Textarea
                      id="businessDescription"
                      placeholder="Tell us about your business..."
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

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
                  "Create Account"
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
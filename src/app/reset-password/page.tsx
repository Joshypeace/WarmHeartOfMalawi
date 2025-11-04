"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Heart, Lock, ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Main component that uses useSearchParams
function ResetPasswordContent() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const token = searchParams.get('token')

  useEffect(() => {
    // Validate token when component mounts
    if (token) {
      validateToken(token)
    } else {
      setIsValidToken(false)
    }
  }, [token])

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`/api/auth/validate-reset-token?token=${token}`)
      const data = await response.json()
      setIsValidToken(data.valid)
    } catch (error) {
      console.error('Token validation error:', error)
      setIsValidToken(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast({
        title: "Invalid reset link",
        description: "The reset link is invalid or has expired.",
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

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        } as ResetPasswordRequest),
      })

      const data: ResetPasswordResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }

      setIsSubmitted(true)
      toast({
        title: "Password reset!",
        description: "Your password has been successfully reset.",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again later."
      
      toast({
        title: "Failed to reset password",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while validating token
  if (isValidToken === null) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-center mt-4">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-4">
                Please request a new password reset link.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/forgot-password" className="w-full">
              <Button className="w-full">
                Request New Reset Link
              </Button>
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Success state after password reset
  if (isSubmitted) {
    return (
      <div className="w-full max-w-md">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Password Reset Successful</CardTitle>
            <CardDescription>
              Your password has been successfully reset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                You can now log in with your new password.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/login" className="w-full">
              <Button className="w-full">
                Go to Login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // Main reset password form
  return (
    <div className="w-full max-w-md">
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
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
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

// Loading component for Suspense fallback
function ResetPasswordLoading() {
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <p className="text-center mt-4">Loading...</p>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="flex flex-col items-center mb-8">
        <Link href="/" className="flex items-center gap-2 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Heart className="h-7 w-7 text-primary-foreground fill-current" />
          </div>
          <span className="text-2xl font-bold text-foreground">WaHeA</span>
        </Link>
        <p className="text-muted-foreground text-center">Create new password</p>
      </div>

      <Suspense fallback={<ResetPasswordLoading />}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  )
}
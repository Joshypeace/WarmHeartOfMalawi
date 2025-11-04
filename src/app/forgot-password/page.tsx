"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Heart, Mail, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email } as ForgotPasswordRequest),
      })

      const data: ForgotPasswordResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link')
      }

      setIsSubmitted(true)
      toast({
        title: "Reset link sent!",
        description: data.message || "Check your email for password reset instructions.",
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Please try again later."
      
      toast({
        title: "Failed to send reset link",
        description: errorMessage,
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
          <p className="text-muted-foreground text-center">Reset your password</p>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              {isSubmitted
                ? "We've sent you a password reset link"
                : "Enter your email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center py-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the
                  instructions.
                </p>
                <p className="text-xs text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setIsSubmitted(false)
                    setEmail("")
                  }}
                >
                  Try Another Email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
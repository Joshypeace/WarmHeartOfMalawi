"use client"

import { useState, useEffect } from "react"
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  phone?: string
  location?: string
  bio?: string
  district?: string
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const { user: authUser, isLoading: authLoading, updateUser } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
    district: ""
  })

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/profile')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const result = await response.json()
      
      if (result.success) {
        setUserProfile(result.data.user)
        setFormData({
          firstName: result.data.user.firstName || "",
          lastName: result.data.user.lastName || "",
          email: result.data.user.email || "",
          phone: result.data.user.phone || "",
          location: result.data.user.location || "",
          bio: result.data.user.bio || "",
          district: result.data.user.district || ""
        })
      } else {
        throw new Error(result.error || 'Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize data when auth user loads
  useEffect(() => {
    if (authUser && !authLoading) {
      fetchUserProfile()
    }
  }, [authUser, authLoading])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !authUser) {
      router.push("/login")
    }
  }, [authUser, authLoading, router])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          district: formData.district
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      if (result.success) {
        // Update local state
        setUserProfile(result.data.user)
        
        // Update auth context
        if (updateUser) {
          updateUser(result.data.user)
        }
        
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        })
        setIsEditing(false)
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to current profile data
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        email: userProfile.email || "",
        phone: userProfile.phone || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
        district: userProfile.district || ""
      })
    }
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-16">
        <div className="container max-w-4xl mx-auto px-4 md:px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96 mb-8"></div>
            
            <div className="grid gap-6">
              <Card className="border-2 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-full bg-muted"></div>
                    <div>
                      <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-9 bg-muted rounded w-24"></div>
                </CardHeader>
              </Card>

              <Card className="border-2 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-48"></div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-10 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-24 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render if no user
  if (!authUser || !userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background py-16">
      <div className="container max-w-4xl mx-auto px-4 md:px-6">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information and preferences</p>
        </div>

        <div className="grid gap-6">
          <Card className="border-2 bg-card/50 backdrop-blur-sm animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="h-10 w-10 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{userProfile.firstName} {userProfile.lastName}</CardTitle>
                  <Badge className="mt-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 text-primary capitalize">
                    {userProfile.role}
                  </Badge>
                  {userProfile.district && (
                    <div className="text-sm text-muted-foreground mt-1">
                      District: {userProfile.district}
                    </div>
                  )}
                </div>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave} 
                    size="sm" 
                    className="gap-2"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button 
                    onClick={handleCancel} 
                    size="sm" 
                    variant="outline" 
                    className="gap-2"
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </CardHeader>
          </Card>

          <Card className="border-2 bg-card/50 backdrop-blur-sm animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.firstName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.lastName}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{userProfile.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+265 xxx xxx xxx"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.location || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  {isEditing ? (
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="Your district"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.district || "Not provided"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                {isEditing ? (
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    disabled={isSaving}
                  />
                ) : (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm">{userProfile.bio || "No bio provided"}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
                <Calendar className="h-4 w-4" />
                <span>Member since {formatDate(userProfile.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
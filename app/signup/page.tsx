"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Kanban } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp, signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Starting signup process...")

      // Sign up the user
      await signUp(email, password, fullName)
      console.log("Signup successful, now signing in...")

      // Immediately sign them in
      await signIn(email, password)
      console.log("Sign in successful, redirecting...")

      toast({
        title: "Success!",
        description: "Account created and signed in!",
      })

      // Redirect to dashboard - THE ONLY DASHBOARD
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Signup error:", error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <Kanban className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">Join TaskFlow</CardTitle>
          <CardDescription className="text-lg text-gray-600">Create your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Enter your name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter any email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <div className="text-center">
            <Link href="/login" className="text-blue-600 hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)

      toast({
        title: "Welcome back!",
        description: "Signed in successfully!",
      })

      // Redirect to dashboard - THE ONLY DASHBOARD
      router.push("/dashboard")
    } catch (error: any) {
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
          <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
          <CardDescription className="text-lg text-gray-600">Sign in to TaskFlow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <div className="text-center">
            <Link href="/signup" className="text-blue-600 hover:underline">
              {"Don't have an account? Create one"}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

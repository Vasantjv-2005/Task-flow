"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"

export function AuthTest() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const testSignUp = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: "test@example.com",
        password: "password123",
        options: {
          data: {
            full_name: "Test User",
          },
        },
      })

      console.log("Signup result:", { data, error })

      if (error) {
        toast({
          title: "Signup Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signup Success",
          description: "Check console for details",
        })
      }
    } catch (err) {
      console.error("Signup error:", err)
    } finally {
      setLoading(false)
    }
  }

  const testSignIn = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "password123",
      })

      console.log("Signin result:", { data, error })

      if (error) {
        toast({
          title: "Signin Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Signin Success",
          description: "Check console for details",
        })
      }
    } catch (err) {
      console.error("Signin error:", err)
    } finally {
      setLoading(false)
    }
  }

  const checkSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      console.log("Current session:", { session, error })

      toast({
        title: "Session Check",
        description: session ? `Logged in as: ${session.user.email}` : "No active session",
      })
    } catch (err) {
      console.error("Session check error:", err)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Auth Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={testSignUp} disabled={loading} className="w-full">
          Test Sign Up
        </Button>
        <Button onClick={testSignIn} disabled={loading} className="w-full">
          Test Sign In
        </Button>
        <Button onClick={checkSession} disabled={loading} className="w-full bg-transparent" variant="outline">
          Check Session
        </Button>
      </CardContent>
    </Card>
  )
}

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export function EnvDebug() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const urlStatus = supabaseUrl ? "present" : "missing"
  const keyStatus = supabaseKey ? "present" : "missing"

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Environment Variables
          {urlStatus === "present" && keyStatus === "present" ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
        <CardDescription>Checking environment variable configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">NEXT_PUBLIC_SUPABASE_URL:</span>
          <Badge variant={urlStatus === "present" ? "default" : "destructive"}>
            {urlStatus === "present" ? "✓ Present" : "✗ Missing"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
          <Badge variant={keyStatus === "present" ? "default" : "destructive"}>
            {keyStatus === "present" ? "✓ Present" : "✗ Missing"}
          </Badge>
        </div>

        {urlStatus === "present" && (
          <div className="text-xs text-muted-foreground">
            <strong>URL:</strong> {supabaseUrl?.substring(0, 30)}...
          </div>
        )}

        {keyStatus === "present" && (
          <div className="text-xs text-muted-foreground">
            <strong>Key:</strong> {supabaseKey?.substring(0, 20)}...
          </div>
        )}

        {(urlStatus === "missing" || keyStatus === "missing") && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800 font-medium">Environment Variables Missing</p>
                <p className="text-xs text-yellow-700 mt-1">
                  The app is using hardcoded fallback values. Create a .env.local file for proper configuration.
                </p>
              </div>
            </div>
          </div>
        )}

        {urlStatus === "present" && keyStatus === "present" && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">✅ Environment variables are properly configured!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

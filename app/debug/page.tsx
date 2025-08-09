"use client"

import { SupabaseConnectionTest } from "@/components/supabase-connection-test"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/login">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SupabaseConnectionTest />

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Debug Information</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Environment Variables</h3>
              <p className="text-sm text-gray-600">
                <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || "Not set"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

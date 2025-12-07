"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chrome } from "lucide-react"
import Link from "next/link"

const LOADING_MESSAGES = [
  "Creating your account...",
  "Setting up your profile...",
  "Connecting to server...",
  "Almost ready...",
]

function LoadingScreen() {
  const [messageIndex, setMessageIndex] = useState(0)
  const [dots, setDots] = useState("")

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 3000)

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => {
      clearInterval(messageInterval)
      clearInterval(dotsInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-slate-200 dark:border-slate-800 rounded-full"></div>
            <div className="absolute top-0 left-0 w-12 h-12 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Cortexa
        </h2>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm h-5">
          {LOADING_MESSAGES[messageIndex]}{dots}
        </p>

        <div className="mt-8 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-48 mx-auto">
          <div 
            className="h-full bg-teal-600 rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${Math.min(25 + messageIndex * 25, 95)}%`
            }}
          />
        </div>

        <p className="mt-6 text-xs text-slate-400">
          This may take a few seconds
        </p>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleCredentialSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signUpWithEmail(email, password, name)

      if (error) {
        setError(error.message)
        setIsLoading(false)
      } else {
        setSuccess("Account created! Please check your email to verify your account, then sign in.")
        setIsLoading(false)
      }
    } catch {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = () => {
    signInWithGoogle("/dashboard")
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
            Create your account
          </h1>
          <p className="text-sm text-slate-500">
            Join Cortexa today
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {success}
          </div>
        )}

        {/* Google Sign Up */}
        <Button
          onClick={handleGoogleSignUp}
          variant="outline"
          className="w-full h-11 mb-4 border-slate-300 dark:border-slate-700"
        >
          <Chrome size={18} className="mr-2" />
          Continue with Google
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-white dark:bg-slate-950 text-slate-400">or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleCredentialSignUp} className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">
              Full name
            </label>
            <Input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11"
            />
            <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">
              Confirm password
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white"
          >
            Create account
          </Button>
        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-teal-600 hover:text-teal-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

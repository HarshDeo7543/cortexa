"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Chrome } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"

interface AuthCardProps {
  onClose: () => void
}

export default function AuthCard({ onClose }: AuthCardProps) {
  const router = useRouter()
  const { signInWithGoogle } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)

  const handleAuthPageRoute = () => {
    onClose()
    if (isSignUp) {
      router.push("/auth/signup")
    } else {
      router.push("/auth/signin")
    }
  }

  const handleGoogleAuth = () => {
    onClose()
    signInWithGoogle("/dashboard")
  }

  return (
    <div className="glass-card p-8 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
        <X size={20} />
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center glow-text">{isSignUp ? "Create Account" : "Sign In"}</h2>

      <Button
        onClick={handleGoogleAuth}
        variant="outline"
        className="w-full mb-4 border-accent/30 hover:bg-accent/10 bg-transparent"
      >
        <Chrome size={18} className="mr-2" />
        {isSignUp ? "Sign Up" : "Sign In"} with Google
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <Button
        onClick={handleAuthPageRoute}
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold mb-4"
      >
        {isSignUp ? "Create Account" : "Sign In"} with Email
      </Button>

      <div className="text-center">
        <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-accent hover:text-accent/80 transition">
          {isSignUp ? "Already have an account?" : "Need an account?"} {isSignUp ? "Sign in" : "Sign up"}
        </button>
      </div>
    </div>
  )
}

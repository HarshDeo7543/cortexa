"use client"

import { useState } from "react"
import { Lock, Cloud, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthCard from "@/components/auth-card"

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)

  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="text-2xl font-bold glow-text">
            <span className="text-accent">Cortexa</span>
          </div>
          <nav className="flex gap-8 items-center">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">
              Features
            </a>
            <a href="#security" className="text-muted-foreground hover:text-foreground transition">
              Security
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuth(!showAuth)}
              className="border-accent text-accent hover:bg-accent/10"
            >
              Sign In
            </Button>
          </nav>
        </header>

        {/* Hero Section */}
        <div className="flex items-center justify-between px-12 py-20 max-w-7xl mx-auto">
          <div className="flex-1 pr-12">
            <h1 className="text-5xl font-bold mb-6 text-balance leading-tight">
              Secure Document <span className="text-accent glow-text">Approval</span> Platform
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl text-balance leading-relaxed">
              Streamline your document workflow with enterprise-grade security, real-time approvals, and seamless team
              collaboration.
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => setShowAuth(!showAuth)}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-accent text-accent hover:bg-accent/10 bg-transparent"
              >
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Auth Card */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-md">
              {showAuth && <AuthCard onClose={() => setShowAuth(false)} />}
              {!showAuth && (
                <div
                  className="glass-card p-8 h-96 flex items-center justify-center border-2 border-dashed border-accent/30 hover:border-accent/50 transition cursor-pointer"
                  onClick={() => setShowAuth(true)}
                >
                  <div className="text-center">
                    <Lock className="w-12 h-12 text-accent mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground">Click to sign in or create account</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-12">
            <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Cortexa</h2>
            <div className="grid grid-cols-3 gap-8">
              <div className="glass-card p-6">
                <Cloud className="w-8 h-8 text-accent mb-4" />
                <h3 className="text-lg font-semibold mb-2">Cloud Native</h3>
                <p className="text-muted-foreground text-sm">
                  Enterprise-scale infrastructure with zero downtime deployments
                </p>
              </div>
              <div className="glass-card p-6">
                <Lock className="w-8 h-8 text-accent mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bank-Level Security</h3>
                <p className="text-muted-foreground text-sm">
                  End-to-end encryption and compliance with industry standards
                </p>
              </div>
              <div className="glass-card p-6">
                <CheckCircle className="w-8 h-8 text-accent mb-4" />
                <h3 className="text-lg font-semibold mb-2">Instant Approvals</h3>
                <p className="text-muted-foreground text-sm">
                  Real-time notifications and mobile-first approval workflows
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-12 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Cortexa. All rights reserved. Enterprise-grade security for document workflows.</p>
        </footer>
      </div>
    </main>
  )
}

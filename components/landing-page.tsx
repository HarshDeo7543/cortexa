"use client"

import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import AuthCard from "@/components/auth-card"

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="text-lg font-semibold text-slate-900 dark:text-white">
            Cortexa
          </a>
          <button 
            onClick={() => setShowAuth(true)}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Sign in →
          </button>
        </div>
      </header>

      {/* Hero - Minimal, Story-driven */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto">
          {showAuth ? (
            <div className="max-w-md mx-auto">
              <AuthCard onClose={() => setShowAuth(false)} />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                For government offices & enterprises
              </p>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight max-w-3xl">
                <span className="text-slate-900 dark:text-white">Stop chasing approvals.</span><br />
                <span className="text-teal-600">Start tracking them.</span>
              </h1>
              
              <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                Cortexa replaces email chains and paper trails with a single platform 
                where documents get verified, signed, and delivered—on time.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => setShowAuth(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white h-12 px-6 text-base"
                >
                  Start for free
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost"
                  className="text-slate-600 dark:text-slate-400 h-12 px-6 text-base"
                  asChild
                >
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Visual Break - Simple Line */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
      </div>

      {/* The Problem / Solution - Conversational */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <p className="text-sm font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-4">
                The old way
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Documents get lost. Reviewers forget. Deadlines slip.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                You email a document. Wait a week. Send a reminder. Get told it's "in review." 
                Meanwhile, the applicant keeps asking for updates you don't have.
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-teal-600 dark:text-teal-500 uppercase tracking-wide mb-4">
                With Cortexa
              </p>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Every document has a timeline. Every step is tracked.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Junior reviewer checks it. Compliance officer signs off. The applicant gets 
                a verified PDF with a unique code. All in days, not weeks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Simple Steps, No Icons */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-12">
            How it works
          </h2>
          
          <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-12">
            <div>
              <p className="text-4xl font-light text-slate-300 dark:text-slate-700 mb-4">01</p>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">User submits</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload the document, fill in details, and submit. 
                It enters the review queue immediately.
              </p>
            </div>
            
            <div>
              <p className="text-4xl font-light text-slate-300 dark:text-slate-700 mb-4">02</p>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Reviewers verify</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A junior reviewer checks first. Then a compliance officer. 
                Each step is logged with timestamp and name.
              </p>
            </div>
            
            <div>
              <p className="text-4xl font-light text-slate-300 dark:text-slate-700 mb-4">03</p>
              <h3 className="font-medium text-slate-900 dark:text-white mb-2">Document verified</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                The final PDF gets a verification stamp with a unique code. 
                Download and use it anywhere.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Text-focused, No Card Grid */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-12">
            Built for real workflows
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-4 items-start">
              <span className="text-teal-600 font-medium shrink-0">→</span>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Role-based access</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Admins, junior reviewers, and compliance officers each see what they need. Nothing more.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <span className="text-teal-600 font-medium shrink-0">→</span>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Activity logs</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  See who did what, when. Complete audit trail for every document.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <span className="text-teal-600 font-medium shrink-0">→</span>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Digital signatures</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Approved documents get a verification stamp—tamper-proof and verifiable.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-start">
              <span className="text-teal-600 font-medium shrink-0">→</span>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-white">Secure storage</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Documents stored on AWS S3 with encryption. Never lost, always accessible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Clean, Simple */}
      <section className="py-24 px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white mb-4">
            Ready to simplify your document workflow?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg mx-auto">
            Create your free account and start processing applications today.
          </p>
          <Button 
            size="lg" 
            onClick={() => setShowAuth(true)}
            className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white h-12 px-8 text-base gap-2"
          >
            Get started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="py-8 px-6 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-500">
            © 2025 Cortexa
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Privacy</a>
            <a href="#" className="hover:text-slate-900 dark:hover:text-white">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  )
}

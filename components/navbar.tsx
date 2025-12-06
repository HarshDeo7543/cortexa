"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, FileText, ClipboardCheck, Home, Plus, User, Users, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"

type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<UserRole>('user')

  useEffect(() => {
    if (user) {
      fetchUserRole()
    }
  }, [user])

  const fetchUserRole = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user?.id)
      .single()
    
    if (data?.role) {
      setUserRole(data.role as UserRole)
    }
  }

  const isReviewer = ['junior_reviewer', 'compliance_officer', 'admin'].includes(userRole)
  const canManageUsers = ['admin', 'compliance_officer'].includes(userRole)
  const isAdmin = userRole === 'admin'
  const isRegularUser = userRole === 'user'

  // Build nav links based on role
  const navLinks: { href: string; label: string; icon: typeof Home }[] = []

  // Dashboard for everyone
  navLinks.push({ href: "/dashboard", label: "Dashboard", icon: Home })

  // My Applications and Apply only for regular users
  if (isRegularUser) {
    navLinks.push({ href: "/applications", label: "My Applications", icon: FileText })
    navLinks.push({ href: "/apply", label: "Apply", icon: Plus })
  }

  // Review link for reviewers
  if (isReviewer) {
    navLinks.push({ href: "/review", label: "Review", icon: ClipboardCheck })
  }

  // Users/Admin link for admin and compliance officer
  if (canManageUsers) {
    navLinks.push({ href: "/admin", label: "Users", icon: Users })
  }

  // Activity Logs for admin only
  if (isAdmin) {
    navLinks.push({ href: "/logs", label: "Logs", icon: ScrollText })
  }

  const isActive = (href: string) => pathname === href

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">C</span>
          </div>
          <span className="font-bold text-lg">Cortexa</span>
        </Link>

        {/* Navigation Links */}
        {user && (
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive(link.href) ? "secondary" : "ghost"}
                    size="sm"
                    className={`gap-2 ${isActive(link.href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Button>
                </Link>
              )
            })}
          </div>
        )}

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
                <User className="w-4 h-4" />
                <span className="max-w-32 truncate">
                  {user.user_metadata?.name || user.email?.split('@')[0]}
                </span>
                {isReviewer && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs capitalize">
                    {userRole.replace('_', ' ')}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

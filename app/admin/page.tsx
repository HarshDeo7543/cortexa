"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  Plus,
  Trash2,
  Shield,
  ClipboardCheck,
  UserCheck,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email?: string
  role: string
  createdAt: string
}

type UserRole = 'user' | 'junior_reviewer' | 'compliance_officer' | 'admin'

const DEMO_CREDENTIALS = [
  {
    role: "Admin",
    email: "harshdeo7543@gmail.com",
    password: "Harsh@123",
    description: "Full access to manage all reviewers",
  },
  {
    role: "Compliance Officer",
    email: "compliance@cortexa.demo",
    password: "Compliance@123",
    description: "Final review + manage Junior Reviewers",
  },
  {
    role: "Junior Reviewer",
    email: "junior@cortexa.demo",
    password: "Junior@123",
    description: "First-level document review",
  },
  {
    role: "User",
    email: "user@cortexa.demo",
    password: "User@123",
    description: "Submit and track applications",
  },
]

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [roleLoading, setRoleLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  const [copiedField, setCopiedField] = useState("")

  // Create form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "junior_reviewer",
  })

  useEffect(() => {
    if (user) {
      fetchUserRole()
    } else if (!authLoading) {
      setRoleLoading(false)
    }
  }, [user, authLoading])

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      const canManage = userRole ? ['admin', 'compliance_officer'].includes(userRole) : false
      if (!user || !canManage) {
        router.push("/dashboard")
      }
    }
  }, [authLoading, roleLoading, user, userRole, router])

  useEffect(() => {
    if (userRole && ['admin', 'compliance_officer'].includes(userRole)) {
      fetchUsers()
    }
  }, [userRole])

  const fetchUserRole = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single()
      
      if (data?.role) {
        setUserRole(data.role as UserRole)
      } else {
        setUserRole('user')
      }
    } catch (err) {
      console.error('Failed to fetch role:', err)
      setUserRole('user')
    } finally {
      setRoleLoading(false)
    }
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setUsersLoading(false)
    }
  }

  const handleCreateUser = async () => {
    setError("")
    setSuccess("")
    
    if (!newUser.email || !newUser.password || !newUser.name) {
      setError("All fields are required")
      return
    }

    if (newUser.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message || "User created successfully")
        setNewUser({ email: "", password: "", name: "", role: "junior_reviewer" })
        setShowCreateForm(false)
        fetchUsers()
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("User deleted successfully")
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to delete user")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(""), 2000)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4 text-red-500" />
      case "compliance_officer":
        return <UserCheck className="w-4 h-4 text-purple-500" />
      case "junior_reviewer":
        return <ClipboardCheck className="w-4 h-4 text-amber-500" />
      default:
        return <Users className="w-4 h-4 text-blue-500" />
    }
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-red-500/10 text-red-500 border-red-500/30",
      compliance_officer: "bg-purple-500/10 text-purple-500 border-purple-500/30",
      junior_reviewer: "bg-amber-500/10 text-amber-500 border-amber-500/30",
      user: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    }
    return styles[role] || styles.user
  }

  const canManage = userRole ? ['admin', 'compliance_officer'].includes(userRole) : false
  const availableRoles = userRole === 'admin' 
    ? ['junior_reviewer', 'compliance_officer'] 
    : ['junior_reviewer']

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show loading while redirect happens via useEffect
  if (!user || !canManage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">User Management</h1>
              <p className="text-muted-foreground">
                Manage reviewer accounts and permissions
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Reviewer
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-500 p-3 rounded-lg mb-6 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New Reviewer Account
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Full Name *
                </label>
                <Input
                  placeholder="Enter full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Password *
                </label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  Role *
                </label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(v) => setNewUser({ ...newUser, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreateUser} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Demo Credentials Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Demo Credentials
            </h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowPasswords(!showPasswords)}
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? "Hide" : "Show"} Passwords
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {DEMO_CREDENTIALS.map((cred) => (
              <div 
                key={cred.role}
                className="p-4 rounded-lg border border-border bg-background/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  {getRoleIcon(cred.role.toLowerCase().replace(' ', '_'))}
                  <span className="font-semibold">{cred.role}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{cred.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded">
                    <span className="text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">{cred.email}</code>
                      <button 
                        onClick={() => copyToClipboard(cred.email, `${cred.role}-email`)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedField === `${cred.role}-email` 
                          ? <CheckCircle className="w-3 h-3 text-green-500" />
                          : <Copy className="w-3 h-3" />
                        }
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded">
                    <span className="text-muted-foreground">Password:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs">
                        {showPasswords ? cred.password : "••••••••"}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(cred.password, `${cred.role}-pass`)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copiedField === `${cred.role}-pass` 
                          ? <CheckCircle className="w-3 h-3 text-green-500" />
                          : <Copy className="w-3 h-3" />
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Reviewer Accounts
          </h2>
          
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No reviewer accounts found</p>
              <p className="text-sm">Create one using the button above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div 
                  key={u.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    {getRoleIcon(u.role)}
                    <div>
                      <p className="font-medium">{u.id.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(u.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadge(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteUser(u.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

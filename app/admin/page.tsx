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
  Loader2,
  RefreshCw,
  Trash2,
  Plus,
  X,
  Eye,
  EyeOff,
} from "lucide-react"

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
    email: "Harshdeo7543@gmail.com",
    password: "Harsh@123",
  },
  {
    role: "Junior Reviewer",
    email: "hdevjharkhand@gmail.com",
    password: "Harsh@123",
  },
  {
    role: "Compliance Officer",
    email: "harshdeo5142@gmail.com",
    password: "Harsh@123",
  },
  {
    role: "User (Google)",
    email: "harsh.arcade.2025@gmail.com",
    password: "Sign in with Google",
  },
]

export default function AdminPage() {
  const router = useRouter()
  const { user, role, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)
  
  // Use role from auth context (Firebase custom claims)
  const userRole = (role || 'user') as UserRole
  const roleLoading = authLoading

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "junior_reviewer",
  })

  useEffect(() => {
    if (!authLoading) {
      const canManage = role ? ['admin', 'compliance_officer'].includes(role) : false
      if (!user || !canManage) {
        router.push("/dashboard")
      }
    }
  }, [authLoading, user, role, router])

  useEffect(() => {
    if (role && ['admin', 'compliance_officer'].includes(role)) {
      fetchUsers()
    }
  }, [role])

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
    } catch {
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
    } catch {
      setError("An error occurred. Please try again.")
    }
  }

  const formatRole = (role: string) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  const canManage = userRole ? ['admin', 'compliance_officer'].includes(userRole) : false
  const availableRoles = userRole === 'admin' 
    ? ['junior_reviewer', 'compliance_officer'] 
    : ['junior_reviewer']

  if (authLoading || roleLoading || !user || !canManage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Users</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage reviewer accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchUsers}
              disabled={usersLoading}
            >
              <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowCreateForm(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add user
            </Button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {success}
          </div>
        )}

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-medium text-slate-900 dark:text-white">New reviewer account</h2>
              <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">Name</label>
                <Input
                  placeholder="Full name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">Password</label>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1.5">Role</label>
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
                        {formatRole(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateUser} 
                disabled={isCreating}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Demo Credentials */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-border flex items-center justify-between">
            <div>
              <h2 className="font-medium text-slate-900 dark:text-white">Demo accounts</h2>
              <p className="text-sm text-slate-500 mt-0.5">Use these to test different roles</p>
            </div>
            <button 
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1.5"
            >
              {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPasswords ? "Hide" : "Show"}
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-border">
            {DEMO_CREDENTIALS.map((cred) => (
              <div key={cred.role} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-slate-900 dark:text-white w-36">
                    {cred.role}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {cred.email}
                  </span>
                </div>
                <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">
                  {showPasswords ? cred.password : "••••••••"}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-lg">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-border">
            <h2 className="font-medium text-slate-900 dark:text-white">All users</h2>
            <p className="text-sm text-slate-500 mt-0.5">{users.length} accounts</p>
          </div>
          
          {users.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-slate-500">No users found</p>
              <p className="text-sm text-slate-400 mt-1">Create one using the button above</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-border">
              {users.map((u) => (
                <div key={u.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {u.email || u.id.slice(0, 8) + '...'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatRole(u.role)} • {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteUser(u.id)}
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
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

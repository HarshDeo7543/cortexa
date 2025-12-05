"use client"

import { LogOut, Settings, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <nav className="border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-accent-foreground font-bold">C</span>
          </div>
          <span className="font-bold text-lg glow-text">Cortexa</span>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => alert("Notifications")}
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full"></span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => alert("Settings")}
          >
            <Settings size={20} />
          </Button>
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-full cursor-pointer"></div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => alert("Logging out...")}
          >
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </nav>
  )
}

'use client'

import * as React from "react"
import { Search, Command, Users, Home, Settings, FileText, DollarSign, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: string
  keywords?: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = React.useState("")
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const router = useRouter()

  const commands: CommandItem[] = [
    {
      id: "dashboard",
      title: "Go to Dashboard",
      description: "View your main dashboard",
      icon: <Home className="h-4 w-4" />,
      action: () => router.push("/dashboard"),
      category: "Navigation"
    },
    {
      id: "leads",
      title: "View Leads",
      description: "Manage your leads",
      icon: <Users className="h-4 w-4" />,
      action: () => router.push("/leads"),
      category: "Navigation",
      keywords: ["customers", "prospects"]
    },
    {
      id: "tasks",
      title: "View Tasks",
      description: "Check your tasks",
      icon: <Calendar className="h-4 w-4" />,
      action: () => router.push("/tasks"),
      category: "Navigation",
      keywords: ["todo", "schedule"]
    },
    {
      id: "sales",
      title: "Sales Dashboard",
      description: "View sales metrics",
      icon: <DollarSign className="h-4 w-4" />,
      action: () => router.push("/sales"),
      category: "Navigation",
      keywords: ["revenue", "money"]
    },
    {
      id: "settings",
      title: "Settings",
      description: "Configure your account",
      icon: <Settings className="h-4 w-4" />,
      action: () => router.push("/settings"),
      category: "Navigation",
      keywords: ["preferences", "config"]
    },
    {
      id: "add-lead",
      title: "Add New Lead",
      description: "Create a new lead",
      icon: <Users className="h-4 w-4" />,
      action: () => router.push("/leads/new"),
      category: "Actions",
      keywords: ["create", "new", "customer"]
    },
    {
      id: "create-task",
      title: "Create Task",
      description: "Add a new task",
      icon: <Calendar className="h-4 w-4" />,
      action: () => router.push("/tasks/new"),
      category: "Actions",
      keywords: ["todo", "reminder"]
    }
  ]

  const filteredCommands = React.useMemo(() => {
    if (!search) return commands

    return commands.filter(command => {
      const searchLower = search.toLowerCase()
      return (
        command.title.toLowerCase().includes(searchLower) ||
        command.description?.toLowerCase().includes(searchLower) ||
        command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
      )
    })
  }, [search])

  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })
    return groups
  }, [filteredCommands])

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          onClose()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="flex items-start justify-center pt-20">
        <div className="w-full max-w-2xl mx-4">
          <div className="glass-card border border-white/20 rounded-2xl shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center space-x-3 p-4 border-b border-white/10">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Command className="h-5 w-5 text-primary" />
              </div>
              <Input
                placeholder="Type a command or search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none bg-transparent text-lg placeholder:text-muted-foreground focus:ring-0"
                autoFocus
              />
              <div className="text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded">
                ESC
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-4">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {commands.map((command, index) => {
                      const globalIndex = filteredCommands.indexOf(command)
                      const isSelected = globalIndex === selectedIndex
                      
                      return (
                        <Button
                          key={command.id}
                          variant="ghost"
                          className={cn(
                            "w-full justify-start h-auto p-3 rounded-xl transition-all duration-200",
                            isSelected && "bg-primary/10 border border-primary/20"
                          )}
                          onClick={() => {
                            command.action()
                            onClose()
                          }}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            <div className={cn(
                              "p-2 rounded-lg transition-colors",
                              isSelected ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
                            )}>
                              {command.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium">{command.title}</div>
                              {command.description && (
                                <div className="text-sm text-muted-foreground">
                                  {command.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </Button>
                      )
                    })}
                  </div>
                </div>
              ))}

              {filteredCommands.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No commands found</p>
                  <p className="text-sm">Try searching for something else</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <kbd className="bg-muted/20 px-1.5 py-0.5 rounded">↑</kbd>
                  <kbd className="bg-muted/20 px-1.5 py-0.5 rounded">↓</kbd>
                  <span>navigate</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="bg-muted/20 px-1.5 py-0.5 rounded">↵</kbd>
                  <span>select</span>
                </div>
              </div>
              <div className="text-gradient font-semibold">⌘K</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

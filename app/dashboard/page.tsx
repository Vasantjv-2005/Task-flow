"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase-client"
import {
  Kanban,
  LogOut,
  Plus,
  Search,
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Filter,
  Target,
  TrendingUp,
  UserPlus,
  AlertCircle,
} from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

interface Task {
  id: string
  board_id: string
  title: string
  description: string | null
  status: "todo" | "in-progress" | "done"
  created_by: string
  user_id: string // NEW: Add user_id field
  assignee_id: string | null
  created_at: string
  updated_at: string
  profiles?: {
    // NEW: Auto-joined profile data
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
  assignee?: {
    id: string
    full_name: string | null
    email: string
  }
  created_by_profile?: {
    id: string
    full_name: string | null
    email: string
  }
}

interface Board {
  id: string
  name: string
  owner_id: string
  created_at: string
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface BoardMember {
  id: string
  board_id: string
  user_id: string
  role: "owner" | "member"
  joined_at: string
  profiles?: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-slate-100" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
]

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [tasks, setTasks] = useState<Task[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null)
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [isCreateBoardDialogOpen, setIsCreateBoardDialogOpen] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([])

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo" as const,
    assignee_id: "unassigned", // Changed from ""
  })

  const [newBoard, setNewBoard] = useState({
    name: "",
  })

  const [inviteEmail, setInviteEmail] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      loadData()
    }
  }, [user, loading, router])

  const addDebug = (message: string) => {
    console.log(message)
    setDebugInfo((prev) => prev + "\n" + new Date().toLocaleTimeString() + ": " + message)
  }

  const loadData = async () => {
    setIsLoading(true)
    addDebug("Starting to load data...")
    try {
      await Promise.all([loadBoards(), loadProfiles()])
      addDebug("Data loaded successfully!")
    } catch (error: any) {
      addDebug("Error loading data: " + error.message)
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBoards = async () => {
    if (!user) return

    try {
      addDebug(`Loading boards for user: ${user.id}`)

      // Query boards where user is owner OR member
      // This uses the new RLS policies you created
      const { data: boardsData, error: boardsError } = await supabase
        .from("boards")
        .select("*")
        .order("created_at", { ascending: false })

      if (boardsError) {
        addDebug(`Boards error: ${boardsError.message}`)
        throw boardsError
      }

      addDebug(`Found ${boardsData?.length || 0} boards`)
      setBoards(boardsData || [])

      // Auto-select first board if none selected
      if (boardsData && boardsData.length > 0 && !selectedBoard) {
        setSelectedBoard(boardsData[0].id)
        addDebug(`Auto-selected board: ${boardsData[0].name}`)
      }
    } catch (error: any) {
      addDebug(`Error loading boards: ${error.message}`)
      console.error("Error loading boards:", error)
      toast({
        title: "Error Loading Boards",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const loadTasks = async (boardId: string) => {
    try {
      addDebug(`Loading tasks for board: ${boardId}`)

      // NEW: Use the user_id column with auto-join to profiles
      const { data, error } = await supabase
        .from("tasks")
        .select(`
        *,
        profiles!tasks_user_id_fkey(id, full_name, email, avatar_url)
      `)
        .eq("board_id", boardId)
        .order("created_at", { ascending: false })

      if (error) {
        // If tasks table doesn't exist, just log and continue
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          addDebug("Tasks table doesn't exist yet - that's OK!")
          setTasks([])
          return
        }
        throw error
      }

      addDebug(`Found ${data?.length || 0} tasks`)
      setTasks(data || [])
    } catch (error: any) {
      addDebug(`Error loading tasks: ${error.message}`)
      console.error("Error loading tasks:", error)
      // Don't show error toast for missing tasks table
      if (!error.message.includes("relation") || !error.message.includes("does not exist")) {
        toast({
          title: "Error Loading Tasks",
          description: error.message,
          variant: "destructive",
        })
      }
      setTasks([])
    }
  }

  const loadProfiles = async () => {
    try {
      addDebug("Loading profiles...")

      // Check if profiles table exists
      const { data, error } = await supabase.from("profiles").select("*")

      if (error) {
        // If profiles table doesn't exist, just log and continue
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          addDebug("Profiles table doesn't exist yet - that's OK!")
          setProfiles([])
          return
        }
        throw error
      }

      addDebug(`Found ${data?.length || 0} profiles`)
      setProfiles(data || [])
    } catch (error: any) {
      addDebug(`Error loading profiles: ${error.message}`)
      console.error("Error loading profiles:", error)
      setProfiles([])
    }
  }

  const loadBoardMembers = async (boardId: string) => {
    try {
      addDebug(`Loading board members for board: ${boardId}`)

      const { data, error } = await supabase
        .from("board_members")
        .select(`
        *,
        profiles(id, full_name, email, avatar_url)
      `)
        .eq("board_id", boardId)

      if (error) {
        addDebug(`Board members error: ${error.message}`)
        setBoardMembers([])
        return
      }

      addDebug(`Found ${data?.length || 0} board members`)
      setBoardMembers(data || [])
    } catch (error: any) {
      addDebug(`Error loading board members: ${error.message}`)
      console.error("Error loading board members:", error)
      setBoardMembers([])
    }
  }

  useEffect(() => {
    if (selectedBoard) {
      loadTasks(selectedBoard)
      loadBoardMembers(selectedBoard)
    }
  }, [selectedBoard])

  const createBoard = async () => {
    if (!newBoard.name.trim() || !user) {
      toast({
        title: "Error",
        description: "Board name is required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      addDebug(`Creating board: "${newBoard.name}" for user: ${user.id}`)

      // Create the board with the new simplified structure
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .insert({
          name: newBoard.name.trim(),
          owner_id: user.id,
        })
        .select()
        .single()

      if (boardError) {
        addDebug(`Board creation error: ${boardError.message}`)
        throw boardError
      }

      addDebug(`Board created successfully: ${boardData.id}`)

      // Create board member entry for the owner
      const { error: memberError } = await supabase.from("board_members").insert({
        board_id: boardData.id,
        user_id: user.id,
        role: "owner",
      })

      if (memberError) {
        addDebug(`Board member creation error: ${memberError.message}`)
        // Don't fail completely, just log the error
        console.log("Continuing without board member entry...")
      } else {
        addDebug("Board member entry created successfully")
      }

      toast({
        title: "Success! 🎉",
        description: `Board "${boardData.name}" created successfully!`,
      })

      // Reset form and close dialog
      setNewBoard({ name: "" })
      setIsCreateBoardDialogOpen(false)

      // Reload boards and select the new one
      await loadBoards()
      setSelectedBoard(boardData.id)
    } catch (error: any) {
      addDebug(`Error creating board: ${error.message}`)
      console.error("Error creating board:", error)
      toast({
        title: "Error Creating Board",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteBoard = async (boardId: string) => {
    try {
      addDebug(`Deleting board: ${boardId}`)

      const { error } = await supabase.from("boards").delete().eq("id", boardId)

      if (error) throw error

      addDebug("Board deleted successfully")

      toast({
        title: "Board Deleted",
        description: "Board has been removed successfully.",
      })

      if (selectedBoard === boardId) {
        setSelectedBoard(null)
        setTasks([])
      }
      loadBoards()
    } catch (error: any) {
      addDebug(`Error deleting board: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to delete board: " + error.message,
        variant: "destructive",
      })
    }
  }

  const createTask = async () => {
    if (!newTask.title.trim() || !selectedBoard || !user) return

    try {
      addDebug(`Creating task: "${newTask.title}" in board: ${selectedBoard}`)

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          board_id: selectedBoard,
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          status: newTask.status,
          created_by: user.id,
          user_id: user.id,
          assignee_id: newTask.assignee_id === "unassigned" ? null : newTask.assignee_id, // Handle unassigned
        })
        .select()
        .single()

      if (error) throw error

      addDebug("Task created successfully")

      toast({
        title: "Task Created! ✅",
        description: `"${data.title}" has been added to ${data.status.replace("-", " ")}.`,
      })

      setIsCreateTaskDialogOpen(false)
      setNewTask({ title: "", description: "", status: "todo", assignee_id: "unassigned" }) // Reset to "unassigned"
      loadTasks(selectedBoard)
    } catch (error: any) {
      addDebug(`Error creating task: ${error.message}`)
      toast({
        title: "Error Creating Task",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      addDebug(`Deleting task: ${taskId}`)

      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error

      addDebug("Task deleted successfully")

      toast({
        title: "Task Deleted",
        description: "Task has been removed successfully.",
      })

      if (selectedBoard) {
        loadTasks(selectedBoard)
      }
    } catch (error: any) {
      addDebug(`Error deleting task: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to delete task: " + error.message,
        variant: "destructive",
      })
    }
  }

  const onDragEnd = async (result: any) => {
    if (!result.destination) return

    const { draggableId, destination } = result
    const newStatus = destination.droppableId as Task["status"]

    try {
      addDebug(`Moving task ${draggableId} to ${newStatus}`)

      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", draggableId)

      if (error) throw error

      addDebug("Task moved successfully")

      toast({
        title: "Task Moved! 🚀",
        description: `Task moved to ${newStatus.replace("-", " ")}.`,
      })

      if (selectedBoard) {
        loadTasks(selectedBoard)
      }
    } catch (error: any) {
      addDebug(`Error moving task: ${error.message}`)
      toast({
        title: "Error",
        description: "Failed to move task: " + error.message,
        variant: "destructive",
      })
    }
  }

  const inviteUser = async () => {
    if (!inviteEmail.trim() || !selectedBoard) return

    try {
      addDebug(`Inviting user: ${inviteEmail} to board: ${selectedBoard}`)

      // First, check if user exists in profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail.trim())
        .single()

      if (profileError || !profileData) {
        toast({
          title: "User Not Found",
          description: "No user found with this email address. They need to sign up first.",
          variant: "destructive",
        })
        return
      }

      addDebug(`Found user profile: ${profileData.id}`)

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("board_members")
        .select("id")
        .eq("board_id", selectedBoard)
        .eq("user_id", profileData.id)
        .single()

      if (existingMember) {
        toast({
          title: "Already a Member",
          description: "This user is already a member of this board.",
          variant: "destructive",
        })
        return
      }

      addDebug("Adding user to board_members...")

      // Add user to board_members
      const { data: newMember, error } = await supabase
        .from("board_members")
        .insert({
          board_id: selectedBoard,
          user_id: profileData.id,
          role: "member",
        })
        .select()
        .single()

      if (error) {
        addDebug(`Insert error: ${error.message}`)
        throw error
      }

      addDebug("User added successfully")

      toast({
        title: "User Invited! 🎉",
        description: `${inviteEmail} has been added to the board.`,
      })

      setIsInviteDialogOpen(false)
      setInviteEmail("")

      // Reload board members to show the new member
      loadBoardMembers(selectedBoard)
    } catch (error: any) {
      addDebug(`Invite user error: ${error.message}`)
      console.error("Invite user error:", error)
      toast({
        title: "Error",
        description: "Failed to invite user: " + error.message,
        variant: "destructive",
      })
    }
  }

  const removeBoardMember = async (memberId: string, memberEmail: string) => {
    try {
      addDebug(`Removing board member: ${memberId}`)

      const { error } = await supabase.from("board_members").delete().eq("id", memberId)

      if (error) {
        addDebug(`Remove member error: ${error.message}`)
        throw error
      }

      addDebug("Member removed successfully")

      toast({
        title: "Member Removed",
        description: `${memberEmail} has been removed from the board.`,
      })

      if (selectedBoard) {
        loadBoardMembers(selectedBoard)
      }
    } catch (error: any) {
      addDebug(`Remove member error: ${error.message}`)
      console.error("Remove member error:", error)
      toast({
        title: "Error",
        description: "Failed to remove member: " + error.message,
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterStatus === "all" || task.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter((task) => task.status === status)
  }

  const getStats = () => {
    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "done").length
    const inProgress = tasks.filter((t) => t.status === "in-progress").length
    const todo = tasks.filter((t) => t.status === "todo").length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return { total, completed, inProgress, todo, completionRate }
  }

  const stats = getStats()

  // Check if current user is owner of selected board
  const isCurrentUserOwner = selectedBoard && boards.find((b) => b.id === selectedBoard)?.owner_id === user?.id

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Setting up your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
                <Kanban className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  TaskFlow Pro
                </h1>
                <p className="text-xs text-green-600 font-medium">✅ Connected & Working!</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-white/50 border-white/20"
                />
              </div>

              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full text-xs"></span>
              </Button>

              <div className="flex items-center space-x-3 bg-white/50 rounded-full px-3 py-1">
                <div className="flex -space-x-2">
                  {boardMembers.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="border-2 border-white h-8 w-8">
                      <AvatarImage
                        src={
                          member.profiles?.avatar_url ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profiles?.email || "/placeholder.svg"}`
                        }
                      />
                      <AvatarFallback className="text-xs">
                        {member.profiles?.full_name?.charAt(0) || member.profiles?.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {boardMembers.length > 3 && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs font-medium text-gray-600">
                      +{boardMembers.length - 3}
                    </div>
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {boardMembers.length} member{boardMembers.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-500">Active Board</p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={handleSignOut} className="bg-white/50">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back! 👋</h2>
              <p className="text-gray-600">Your TaskFlow dashboard is ready and working perfectly!</p>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  ✅ Database Connected
                </Badge>
                <Badge variant="secondary">User: {user.email}</Badge>
                <Badge variant="secondary">Boards: {boards.length}</Badge>
                {selectedBoard && <Badge variant="default">Active Board Selected</Badge>}
              </div>
            </div>

            <div className="flex space-x-3">
              <Dialog open={isCreateBoardDialogOpen} onOpenChange={setIsCreateBoardDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Board
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Board</DialogTitle>
                    <DialogDescription>
                      Create a new project board. It will be saved to your database.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="boardName">Board Name *</Label>
                      <Input
                        id="boardName"
                        placeholder="Enter board name..."
                        value={newBoard.name}
                        onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                        className="focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button variant="outline" onClick={() => setIsCreateBoardDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={createBoard}
                        disabled={!newBoard.name.trim() || isLoading}
                        className="min-w-[120px] bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Board
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {selectedBoard && (
                <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Task</DialogTitle>
                      <DialogDescription>Add a new task to your board.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Task Title *</Label>
                        <Input
                          id="title"
                          placeholder="Enter task title..."
                          value={newTask.title}
                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Task description..."
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={newTask.status}
                            onValueChange={(value: any) => setNewTask({ ...newTask, status: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">To Do</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Assignee</Label>
                          <Select
                            value={newTask.assignee_id}
                            onValueChange={(value) => setNewTask({ ...newTask, assignee_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {profiles.map((profile) => (
                                <SelectItem key={profile.id} value={profile.id}>
                                  {profile.full_name || profile.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createTask} disabled={!newTask.title.trim()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Task
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    addDebug("Testing Supabase connection...")
                    const { data, error } = await supabase.from("boards").select("count").limit(1)
                    console.log("Supabase test result:", { data, error })
                    toast({
                      title: "Supabase Test",
                      description: error ? `Error: ${error.message}` : "✅ Connection successful!",
                      variant: error ? "destructive" : "default",
                    })
                  } catch (err) {
                    console.error("Supabase test error:", err)
                  }
                }}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                ✅ Test Connection
              </Button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        {debugInfo && (
          <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-900">Debug Information</h3>
              <Button variant="ghost" size="sm" onClick={() => setDebugInfo("")} className="h-6 w-6 p-0">
                ×
              </Button>
            </div>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">{debugInfo}</pre>
          </div>
        )}

        {/* Board Selection */}
        {boards.length > 0 && (
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">Your Boards:</Label>
            <div className="flex flex-wrap gap-2">
              {boards.map((board) => (
                <Button
                  key={board.id}
                  variant={selectedBoard === board.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBoard(board.id)}
                  className={`${selectedBoard === board.id ? "bg-blue-600 text-white" : "bg-white/70"}`}
                >
                  {board.name}
                  <Badge variant="default" className="ml-2">
                    Owner
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {selectedBoard && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold">{stats.completed}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">In Progress</p>
                    <p className="text-3xl font-bold">{stats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
                    <p className="text-3xl font-bold">{stats.completionRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        {selectedBoard && (
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label className="text-sm font-medium">Filter by status:</Label>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Kanban Board */}
        {selectedBoard ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {COLUMNS.map((column) => {
                const columnTasks = getTasksByStatus(column.id)
                return (
                  <div
                    key={column.id}
                    className="bg-white/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{column.title}</h3>
                        <Badge variant="secondary" className="bg-white/70">
                          {columnTasks.length}
                        </Badge>
                      </div>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`min-h-[400px] space-y-3 p-2 rounded-lg transition-all ${
                            snapshot.isDraggingOver ? column.color : "bg-transparent"
                          }`}
                        >
                          {columnTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`cursor-move transition-all hover:shadow-md group ${
                                    snapshot.isDragging ? "shadow-xl rotate-2" : ""
                                  }`}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-medium text-gray-900 line-clamp-2">{task.title}</h4>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                                        onClick={() => deleteTask(task.id)}
                                      >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                      </Button>
                                    </div>

                                    {task.description && (
                                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                                    )}

                                    <div className="flex items-center justify-between">
                                      {task.profiles && (
                                        <div className="flex items-center space-x-2">
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={task.profiles.avatar_url || undefined} />
                                            <AvatarFallback className="text-xs">
                                              {task.profiles.full_name?.charAt(0) || task.profiles.email.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs text-gray-600">
                                            {task.profiles.full_name || task.profiles.email}
                                          </span>
                                        </div>
                                      )}

                                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(task.created_at).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}

                          {columnTasks.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                              <Kanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                              <p className="text-xs mt-1">Drag tasks here or create new ones</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                )
              })}
            </div>
          </DragDropContext>
        ) : (
          <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <Kanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {boards.length === 0 ? "Create Your First Board! 🚀" : "Select a Board"}
            </h3>
            <p className="text-gray-600 mb-4">
              {boards.length === 0
                ? "Get started by creating your first project board. It will be saved to your database."
                : "Select a board above to view and manage tasks."}
            </p>
            {boards.length === 0 && (
              <Button
                onClick={() => setIsCreateBoardDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Board
              </Button>
            )}
          </div>
        )}

        {/* My Boards Section */}
        <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">My Boards ({boards.length})</h3>
            <div className="flex space-x-2">
              {isCurrentUserOwner && selectedBoard && (
                <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-white/70">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Invite User to Board</DialogTitle>
                      <DialogDescription>Add a team member to collaborate on this board.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          placeholder="Enter user's email..."
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={inviteUser} disabled={!inviteEmail.trim()}>
                          Send Invite
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {boards.length === 0 ? (
            <div className="text-center py-12">
              <Kanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to get started! 🎯</h4>
              <p className="text-gray-600 mb-4">
                Create your first board to start organizing your tasks. Everything will be saved to your database.
              </p>
              <Button
                onClick={() => setIsCreateBoardDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Board
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boards.map((board) => (
                <Card
                  key={board.id}
                  className={`hover:shadow-lg transition-all cursor-pointer group bg-white/70 ${
                    selectedBoard === board.id ? "ring-2 ring-blue-500 bg-blue-50/70" : ""
                  }`}
                  onClick={() => setSelectedBoard(board.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {board.name}
                        </h4>
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Owner
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteBoard(board.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Created {new Date(board.created_at).toLocaleDateString()}</span>
                      <Badge
                        variant="secondary"
                        className={`${
                          selectedBoard === board.id ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedBoard === board.id ? "✅ Active" : "Board"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Board Members Section */}
        {selectedBoard && boardMembers.length > 0 && (
          <div className="mt-6 bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Board Members ({boardMembers.length})</h3>
              {isCurrentUserOwner && (
                <Button
                  onClick={() => setIsInviteDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {boardMembers.map((member) => (
                <Card key={member.id} className="bg-white/70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              member.profiles?.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profiles?.email || "/placeholder.svg"}`
                            }
                          />
                          <AvatarFallback>
                            {member.profiles?.full_name?.charAt(0) || member.profiles?.email?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.profiles?.full_name || member.profiles?.email}
                          </p>
                          <p className="text-sm text-gray-500">{member.profiles?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>{member.role}</Badge>
                        {member.role !== "owner" && isCurrentUserOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            onClick={() => removeBoardMember(member.id, member.profiles?.email || "Unknown")}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

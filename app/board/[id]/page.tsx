"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-client"
import { useToast } from "@/hooks/use-toast"
import { Plus, ArrowLeft, Users, Settings, Paperclip, Trash2 } from "lucide-react"
import type { Database } from "@/lib/supabase"

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  assignee?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  created_by_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

type Board = Database["public"]["Tables"]["boards"]["Row"]
type BoardMember = Database["public"]["Tables"]["board_members"]["Row"] & {
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
    email: string
  }
}

const COLUMNS = [
  { id: "todo", title: "To Do", color: "bg-gray-100" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
] as const

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const boardId = params.id as string

  const [board, setBoard] = useState<Board | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState<string>("todo")
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskAssignee, setNewTaskAssignee] = useState("")

  useEffect(() => {
    if (user && boardId) {
      fetchBoardData()
      setupRealtimeSubscription()
    }
  }, [user, boardId])

  const fetchBoardData = async () => {
    try {
      // Fetch board details
      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId)
        .single()

      if (boardError) throw boardError
      setBoard(boardData)

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url),
          created_by_profile:profiles!tasks_created_by_fkey(id, full_name, avatar_url)
        `)
        .eq("board_id", boardId)
        .order("position")

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Fetch board members
      const { data: membersData, error: membersError } = await supabase
        .from("board_members")
        .select(`
          *,
          profiles(id, full_name, avatar_url, email)
        `)
        .eq("board_id", boardId)

      if (membersError) throw membersError
      setMembers(membersData || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch board data",
        variant: "destructive",
      })
      router.push("/boards")
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`board-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          fetchBoardData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const createTask = async () => {
    if (!user || !newTaskTitle.trim()) return

    try {
      const { error } = await supabase.from("tasks").insert({
        board_id: boardId,
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim() || null,
        status: selectedColumn as "todo" | "in-progress" | "done",
        assignee_id: newTaskAssignee || null,
        created_by: user.id,
        position: tasks.filter((t) => t.status === selectedColumn).length,
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Task created successfully!",
      })

      setCreateTaskDialogOpen(false)
      setNewTaskTitle("")
      setNewTaskDescription("")
      setNewTaskAssignee("")
      setSelectedColumn("todo")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const onDragEnd = async (result: any) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    const taskId = draggableId
    const newStatus = destination.droppableId as "todo" | "in-progress" | "done"

    // Optimistically update the UI
    const updatedTasks = [...tasks]
    const taskIndex = updatedTasks.findIndex((t) => t.id === taskId)
    if (taskIndex !== -1) {
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: newStatus }
      setTasks(updatedTasks)
    }

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: newStatus,
          position: destination.index,
        })
        .eq("id", taskId)

      if (error) throw error
    } catch (error: any) {
      // Revert the optimistic update
      fetchBoardData()
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Task deleted successfully!",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Board not found</h2>
          <p className="text-gray-600 mb-4">
            The board you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.push("/boards")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Boards
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/boards")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{board.name}</h1>
                {board.description && <p className="text-sm text-gray-600">{board.description}</p>}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex -space-x-2">
                {members.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="border-2 border-white">
                    <AvatarImage src={member.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {member.profiles.full_name?.charAt(0) || member.profiles.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 3 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 border-2 border-white text-xs font-medium text-gray-600">
                    +{members.length - 3}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{column.title}</h3>
                    <Badge variant="secondary">{tasks.filter((task) => task.status === column.id).length}</Badge>
                  </div>
                  <Dialog
                    open={createTaskDialogOpen && selectedColumn === column.id}
                    onOpenChange={(open) => {
                      setCreateTaskDialogOpen(open)
                      if (open) setSelectedColumn(column.id)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedColumn(column.id)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>Add a new task to the {column.title} column.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="taskTitle">Task Title</Label>
                          <Input
                            id="taskTitle"
                            placeholder="Enter task title"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taskDescription">Description (Optional)</Label>
                          <Textarea
                            id="taskDescription"
                            placeholder="Enter task description"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="taskAssignee">Assignee (Optional)</Label>
                          <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              {members.map((member) => (
                                <SelectItem key={member.user_id} value={member.user_id}>
                                  {member.profiles.full_name || member.profiles.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setCreateTaskDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createTask} disabled={!newTaskTitle.trim()}>
                            Create Task
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[200px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? column.color : "bg-gray-50"
                      }`}
                    >
                      <div className="space-y-3">
                        {tasks
                          .filter((task) => task.status === column.id)
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`cursor-move transition-shadow ${
                                    snapshot.isDragging ? "shadow-lg" : "hover:shadow-md"
                                  }`}
                                >
                                  <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                      <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteTask(task.id)
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    {task.description && (
                                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        {task.attachment_url && <Paperclip className="h-3 w-3 text-gray-400" />}
                                        {task.assignee && (
                                          <Avatar className="h-5 w-5">
                                            <AvatarImage src={task.assignee.avatar_url || undefined} />
                                            <AvatarFallback className="text-xs">
                                              {task.assignee.full_name?.charAt(0) || "U"}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {new Date(task.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          ))}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </main>
    </div>
  )
}

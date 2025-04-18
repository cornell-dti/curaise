"use client"

import { useState } from "react"
import { Check, Edit, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Task {
  id: string
  text: string
  completed: boolean
}

export default function Checklist() {
  const [tasks, setTasks] = useState<Task[]>([
  ])

  const [newTask, setNewTask] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  const addTask = () => {
    if (newTask.trim() === "") return

    const newItem: Task = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
    }

    setTasks([...tasks, newItem])
    setNewTask("")
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const toggleComplete = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  const startEditing = (task: Task) => {
    setEditingId(task.id)
    setEditText(task.text)
  }

  const saveEdit = () => {
    if (editText.trim() === "") return

    setTasks(
      tasks.map((tasks) => (tasks.id === editingId ? { ...tasks, text: editText } : tasks)),
    )

    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  return (
    <Card className="max-w-3xl shadow-md">
      <CardContent className="p-3 sm:p-6 pb-6">

        <div className="space-y-3">
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No assignments yet. Add one above!</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`flex flex-wrap sm:flex-nowrap items-center p-3 rounded-md border ${
                  task.completed ? "bg-muted/50" : "bg-background"
                }`}
              >
                <div className="flex items-center mr-2 min-w-[24px]">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleComplete(task.id)}
                    className="rounded-full"
                    id={`assignment-${task.id}`}
                  />
                </div>

                {editingId === task.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit()
                        if (e.key === "Escape") cancelEdit()
                      }}
                      autoFocus
                      className="flex-1 w-full"
                    />
                    <div className="flex space-x-2 w-full sm:w-auto justify-end">
                      <Button size="sm" variant="ghost" onClick={saveEdit} className="flex-shrink-0">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="sm:hidden">Save</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEdit} className="flex-shrink-0">
                        <X className="h-4 w-4 mr-1" />
                        <span className="sm:hidden">Cancel</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <label
                      htmlFor={`assignment-${task.id}`}
                      className={`flex-1 cursor-pointer py-1 ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.text}
                    </label>
                    <div className="flex space-x-1 ml-auto mt-2 sm:mt-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(task)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTask(task.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 mt-6">
          <Input
            type="text"
            placeholder="Add a new assignment..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addTask()
            }}
            className="flex-1"
          />
          <Button onClick={addTask} size="icon" className="w-full sm:w-6 mt-2 sm:mt-0">
            <Plus className="h-4 w-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Add Assignment</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
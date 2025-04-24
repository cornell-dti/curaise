"use client"

import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Task = {
  id: string
  text: string
  completed: boolean
}

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([
  ])
  const [newTask, setNewTask] = useState("")

  const addTask = () => {
    if (newTask.trim() === "") return
    const task: Task = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
    }
    setTasks([...tasks, task])
    setNewTask("")
  }

  const toggleTask = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  return (
    <div className="relative max-w-md w-full transform transition-all">
      <div className="bg-amber-200 rounded-sm p-6 shadow-md relative">

        <h2 className="text-xl font-bold mb-4 text-gray-800 font-handwriting">to-do list</h2>

        <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center group">
              <button
                onClick={() => toggleTask(task.id)}
                className={cn(
                  "w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center mr-3 flex-shrink-0",
                  task.completed ? "bg-gray-700" : "bg-transparent",
                )}
              >
                {task.completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <p
                className={cn(
                  "text-gray-800 flex-grow font-handwriting",
                  task.completed && "line-through text-gray-500",
                )}
              >
                {task.text}
              </p>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete task"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center border-t border-amber-300 pt-3">
          <Input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Add a new task..."
            className="bg-transparent border-none shadow-none focus-visible:ring-0 font-handwriting placeholder:text-amber-800/50 text-gray-800"
          />
          <Button onClick={addTask} size="icon" variant="ghost" className="text-gray-800 hover:bg-amber-300">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Torn paper effect at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden">
          <div className="w-full h-4 bg-amber-200 relative">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 w-4 h-2 bg-slate-100"
                style={{ left: `${i * 5}%`, borderRadius: "50% 50% 0 0" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

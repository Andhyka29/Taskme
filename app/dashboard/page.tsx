"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  deadline: string | null;
  category: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
}

interface Reflection {
  id: string;
  content: string;
  mood: string;
  date: string;
}

const CATEGORIES = ["Kuliah", "Pribadi", "Project"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

const MOODS = [
  { emoji: "😊", value: "happy", label: "Happy" },
  { emoji: "😐", value: "neutral", label: "Neutral" },
  { emoji: "😔", value: "sad", label: "Sad" },
  { emoji: "😤", value: "stressed", label: "Stressed" },
];

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [newCategory, setNewCategory] = useState("Pribadi");
  const [newDeadline, setNewDeadline] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [reflectionContent, setReflectionContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [savingReflection, setSavingReflection] = useState(false);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "done" | "pending">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const router = useRouter();

  useEffect(() => {
    const overdueTasks = tasks.filter(
      (task) => getDeadlineStatus(task.deadline) === "overdue" && !task.done
    );
    if (overdueTasks.length > 0) {
      alert("Kamu punya tugas yang sudah lewat deadline");
    }
  }, [tasks]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/");
      return;
    }

    const parsedUser = JSON.parse(storedUser) as User;
    setUser(parsedUser);
    fetchTasks(parsedUser.id);
    fetchReflection(parsedUser.id);
  }, [router]);

  const fetchTasks = async (userId: string) => {
    try {
      const res = await fetch(`/api/tasks?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Fetch tasks error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReflection = async (userId: string) => {
    try {
      const res = await fetch(`/api/reflection?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.reflection) {
        setReflection(data.reflection);
        setReflectionContent(data.reflection.content);
        setSelectedMood(data.reflection.mood);
      }
    } catch (error) {
      console.error("Fetch reflection error:", error);
    }
  };

  const saveReflection = async () => {
    if (!user) return;
    setSavingReflection(true);
    try {
      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: reflectionContent,
          mood: selectedMood,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReflection(data.reflection);
      }
    } catch (error) {
      console.error("Save reflection error:", error);
    } finally {
      setSavingReflection(false);
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !user) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newTask.trim(),
          userId: user.id,
          priority: newPriority,
          category: newCategory,
          deadline: newDeadline || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks([data.task, ...tasks]);
        setNewTask("");
        setNewPriority("MEDIUM");
        setNewCategory("Pribadi");
        setNewDeadline("");
      }
    } catch (error) {
      console.error("Add task error:", error);
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: id, done: !task.done }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      }
    } catch (error) {
      console.error("Toggle task error:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?taskId=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Delete task error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addTask();
  };

  const getDeadlineStatus = (deadline: string | null) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) return "overdue";
    if (diffDays <= 1) return "warning";
    return null;
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch = task.text.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || 
        (filterStatus === "done" && task.done) || 
        (filterStatus === "pending" && !task.done);
      const matchPriority = filterPriority === "all" || task.priority === filterPriority;
      const matchCategory = filterCategory === "all" || task.category === filterCategory;
      return matchSearch && matchStatus && matchPriority && matchCategory;
    });
  }, [tasks, search, filterStatus, filterPriority, filterCategory]);

  const pendingTasks = filteredTasks.filter((task) => !task.done);
  const completedTasks = filteredTasks.filter((task) => task.done);
  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const getPriorityClass = (priority: "LOW" | "MEDIUM" | "HIGH") => {
    switch (priority) {
      case "HIGH": return "bg-red-500/80";
      case "MEDIUM": return "bg-yellow-400/80";
      case "LOW": return "bg-green-500/80";
      default: return "bg-gray-400/80";
    }
  };

  const getCategoryClass = (category: string) => {
    switch (category) {
      case "Kuliah": return "bg-blue-500/80";
      case "Project": return "bg-purple-500/80";
      case "Pribadi": return "bg-teal-500/80";
      default: return "bg-gray-500/80";
    }
  };

  const renderTask = (task: Task) => {
    const deadlineStatus = getDeadlineStatus(task.deadline);
    return (
      <div
        key={task.id}
        className="group glass rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-all duration-200 hover:scale-[1.01]"
        onClick={() => toggleTask(task.id)}
      >
        <div className={`w-6 h-6 rounded-full border-2 shrink-0 transition-all ${task.done ? "bg-green-500 border-green-500" : "border-white/50 group-hover:border-white"}`}>
          {task.done && <span className="text-white text-sm flex items-center justify-center h-full">✓</span>}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-white/90 ${task.done ? "line-through text-white/40" : ""} block truncate`}>
            {task.text}
          </span>
          <div className="flex items-center gap-2 mt-1">
            {task.deadline && (
              <span className={`text-xs ${deadlineStatus === "overdue" ? "text-red-400" : deadlineStatus === "warning" ? "text-yellow-400" : "text-white/40"}`}>
                📅 {formatDeadline(task.deadline)}
              </span>
            )}
            {deadlineStatus === "overdue" && !task.done && (
              <span className="text-xs font-semibold text-red-400 bg-red-500/20 px-2 py-0.5 rounded-md">
                🔴 Terlambat
              </span>
            )}
            {deadlineStatus === "warning" && !task.done && (
              <span className="text-xs font-semibold text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-md">
                🟡 Segera
              </span>
            )}
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryClass(task.category)} text-white`}>
          {task.category}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)} text-white`}>
          {task.priority}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
          className="text-white/30 hover:text-red-400 transition-colors px-2 opacity-0 group-hover:opacity-100"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 bg-[url('https://4kwallpapers.com/images/walls/thumbs_2t/5889.jpg')] to-slate-900 bg-cover bg-center">
      <header className="bg-white/10 backdrop-blur-xl fixed top-4 left-0 md:left-28 right-0 md:right-28 z-50 rounded-2xl border border-white/10 shadow-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl text-white font-bold">TaskMe</h1>
          <nav className="flex items-center gap-4">
            <span className="text-white/70 text-sm">Halo, {user?.name}</span>
            <button onClick={handleLogout} className="text-white/50 hover:text-red-800 transition-colors text-sm">LOGOUT</button>
          </nav>
        </div>
      </header>

      <main className="pt-32 pb-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-semibold text-white text-center mb-8">Apa yang mau kamu kerjakan hari ini?</h2>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                placeholder="Cari tugas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 min-w-50 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "done" | "pending")}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              >
                <option value="all" className="text-black">Semua</option>
                <option value="pending" className="text-black">Belum</option>
                <option value="done" className="text-black">Selesai</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              >
                <option value="all" className="text-black">Priority</option>
                {PRIORITIES.map((p) => <option key={p} value={p} className="text-black">{p}</option>)}
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              >
                <option value="all" className="text-black">Kategori</option>
                {CATEGORIES.map((c) => <option key={c} value={c} className="text-black">{c}</option>)}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 items-end">
              <input
                type="text"
                placeholder="Tulis tugas baru..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-50 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              >
                {PRIORITIES.map((p) => <option key={p} value={p} className="text-black">{p}</option>)}
              </select>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              >
                {CATEGORIES.map((c) => <option key={c} value={c} className="text-black">{c}</option>)}
              </select>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none"
              />
              <button onClick={addTask} className="px-6 py-2.5 rounded-xl bg-linear-to-r from-red-500 to-purple-500 text-white font-medium hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200">
                +
              </button>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">Refleksi Hari Ini</h3>
            <div className="flex gap-2 mb-4">
              {MOODS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`text-2xl p-2 rounded-xl transition-all duration-200 ${selectedMood === mood.value ? "bg-white/20 scale-110" : "hover:bg-white/10"}`}
                  title={mood.label}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Bagaimana harimu today?"
              value={reflectionContent}
              onChange={(e) => setReflectionContent(e.target.value)}
              className="w-full h-24 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-all resize-none"
            />
            <button
              onClick={saveReflection}
              disabled={savingReflection}
              className="mt-3 w-full py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all disabled:opacity-50"
            >
              {savingReflection ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        <div className="mb-8 bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-medium">Progress Harian</span>
            <span className="text-white/60 text-sm">{completedCount} / {totalTasks} tasks ({progressPercent}%)</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-linear-to-r from-green-400 to-emerald-500 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white/50">Memuat...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-white/10">
                Belum dikerjakan <span className="ml-2 text-sm text-white/40">({pendingTasks.length})</span>
              </h3>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {pendingTasks.length === 0 ? (
                  <p className="text-white/30 text-center py-8">Belum ada tugas</p>
                ) : (
                  pendingTasks.map(renderTask)
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4 pb-3 border-b border-white/10">
                Sudah dikerjakan <span className="ml-2 text-sm text-white/40">({completedTasks.length})</span>
              </h3>
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {completedTasks.length === 0 ? (
                  <p className="text-white/30 text-center py-8">Belum ada tugas selesai</p>
                ) : (
                  completedTasks.map(renderTask)
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
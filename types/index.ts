export interface Task {
  id: string;
  text: string;
  done: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: string;
  deadline: string | null;
  groupId: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
}

export interface Reflection {
  id: string;
  content: string;
  mood: string;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  userId: string;
  _count?: { tasks: number };
}
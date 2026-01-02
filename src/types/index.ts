export interface Project {
  id: string;
  userId: string;
  name: string;
  color: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: string;
  projectId: string;
  title?: string;
  content?: any; // Tiptap JSON content
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  noteId?: string | null;
  title: string;
  description?: string | null;
  dueAt: Date;
  reminderOffsetMinutes?: number | null;
  isCompleted: boolean | null;
  isRecurring: boolean | null;
  recurrenceRule?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithTaskStats {
  project: Project;
  taskStats: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface NoteWithProject {
  note: Note;
  project: Project;
}

export interface TaskWithProject {
  task: Task;
  project: Project;
  note?: Note;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  projectId: string;
  projectName: string;
  projectColor: string;
  isCompleted: boolean;
}
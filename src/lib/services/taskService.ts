'use server';

import { db } from '@/lib/db';
import { tasks, projects, notes } from '@/lib/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { asc, desc, like } from 'drizzle-orm';

interface CreateTaskData {
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  dueAt: Date;
  noteId?: string;
  reminderOffsetMinutes?: number;
}

export async function createTask(data: CreateTaskData) {
  const newTask = await db.insert(tasks).values({
    userId: data.userId,
    projectId: data.projectId,
    title: data.title,
    description: data.description,
    dueAt: data.dueAt,
    noteId: data.noteId,
    reminderOffsetMinutes: data.reminderOffsetMinutes,
  }).returning();

  return newTask[0];
}

export async function getTasksByUser(userId: string) {
  return await db
    .select({ 
      tasks: tasks,
      project: projects
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTasksByProject(projectId: string, userId: string) {
  return await db
    .select({ 
      tasks: tasks,
      project: projects
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.projectId, projectId),
        eq(tasks.userId, userId)
      )
    )
    .orderBy(desc(tasks.createdAt));
}

export async function getTasksByNote(noteId: string, userId: string) {
  return await db
    .select({ 
      tasks: tasks,
      project: projects
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.noteId, noteId),
        eq(tasks.userId, userId)
      )
    )
    .orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: string, userId: string) {
  return await db
    .select({ 
      tasks: tasks,
      project: projects,
      note: notes
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .leftJoin(notes, eq(tasks.noteId, notes.id))
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.userId, userId)
      )
    )
    .limit(1);
}

export async function updateTask(id: string, userId: string, updates: Partial<typeof tasks.$inferInsert>) {
  return await db
    .update(tasks)
    .set(updates)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.userId, userId)
      )
    )
    .returning();
}

export async function deleteTask(id: string, userId: string) {
  return await db
    .delete(tasks)
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.userId, userId)
      )
    );
}

export async function toggleTaskCompletion(id: string, userId: string, isCompleted: boolean) {
  return await db
    .update(tasks)
    .set({ isCompleted, updatedAt: new Date() })
    .where(
      and(
        eq(tasks.id, id),
        eq(tasks.userId, userId)
      )
    )
    .returning();
}

export async function getTasksForToday(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  return await db
    .select({ 
      tasks: tasks,
      project: projects
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.userId, userId),
        sql`${tasks.dueAt} >= ${startOfDay} AND ${tasks.dueAt} <= ${endOfDay}`
      )
    )
    .orderBy(asc(tasks.dueAt));
}

export async function getTasksByDateRange(userId: string, startDate: Date, endDate: Date) {
  return await db
    .select({ 
      tasks: tasks,
      project: projects
    })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(
      and(
        eq(tasks.userId, userId),
        sql`${tasks.dueAt} >= ${startDate} AND ${tasks.dueAt} <= ${endDate}`
      )
    )
    .orderBy(asc(tasks.dueAt));
}
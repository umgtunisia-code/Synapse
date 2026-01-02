'use server';

import { db } from '@/lib/db';
import { notes, projects } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

interface CreateNoteData {
  projectId: string;
  title?: string;
  content?: any; // Tiptap JSON content
}

export async function createNote(data: CreateNoteData) {
  const newNote = await db.insert(notes).values({
    projectId: data.projectId,
    title: data.title,
    content: data.content,
  }).returning();

  return newNote[0];
}

export async function getNotesByProject(projectId: string, userId: string) {
  return await db.select().from(notes).where(
    and(
      eq(notes.projectId, projectId)
    )
  );
}

export async function getNotesByUser(userId: string) {
  return await db
    .select({ 
      notes: notes,
      project: projects
    })
    .from(notes)
    .innerJoin(projects, eq(notes.projectId, projects.id))
    .where(eq(projects.userId, userId));
}

export async function getNoteById(id: string, userId: string) {
  return await db
    .select({ 
      notes: notes,
      project: projects
    })
    .from(notes)
    .innerJoin(projects, eq(notes.projectId, projects.id))
    .where(
      and(
        eq(notes.id, id),
        eq(projects.userId, userId)
      )
    )
    .limit(1);
}

export async function updateNote(id: string, userId: string, updates: Partial<typeof notes.$inferInsert>) {
  return await db
    .update(notes)
    .set(updates)
    .from(projects)
    .innerJoin(notes, eq(notes.projectId, projects.id))
    .where(
      and(
        eq(notes.id, id),
        eq(projects.userId, userId)
      )
    )
    .returning();
}

export async function deleteNote(id: string, userId: string) {
  return await db
    .delete(notes)
    .from(projects)
    .innerJoin(notes, eq(notes.projectId, projects.id))
    .where(
      and(
        eq(notes.id, id),
        eq(projects.userId, userId)
      )
    );
}
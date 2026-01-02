'use server';

import { db } from '@/lib/db';
import { projects, users } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { getRandomColor } from '@/lib/utils';

interface CreateProjectData {
  userId: string;
  name: string;
  color?: string;
}

export async function createProject(data: CreateProjectData) {
  const newProject = await db.insert(projects).values({
    userId: data.userId,
    name: data.name,
    color: data.color || getRandomColor(),
  }).returning();

  return newProject[0];
}

export async function getProjectsByUser(userId: string) {
  return await db.select().from(projects).where(eq(projects.userId, userId));
}

export async function getProjectById(id: string, userId: string) {
  return await db.select().from(projects).where(
    and(
      eq(projects.id, id),
      eq(projects.userId, userId)
    )
  ).limit(1);
}

export async function updateProject(id: string, userId: string, updates: Partial<typeof projects.$inferInsert>) {
  return await db.update(projects).set(updates).where(
    and(
      eq(projects.id, id),
      eq(projects.userId, userId)
    )
  ).returning();
}

export async function deleteProject(id: string, userId: string) {
  return await db.delete(projects).where(
    and(
      eq(projects.id, id),
      eq(projects.userId, userId)
    )
  );
}
'use server';

import { db } from '@/lib/db';
import { users, projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function createUser(userId: string) {
  // Create user record (if not exists)
  const user = await db.insert(users).values({
    id: userId
  }).onConflictDoNothing().returning();

  // Create default "Personal" project for the user
  const defaultProject = await db.insert(projects).values({
    userId: userId,
    name: 'Personal',
    color: '#3B82F6' // Default blue color
  }).returning();

  return { user: user[0], project: defaultProject[0] };
}

export async function getUserById(userId: string) {
  return await db.select().from(users).where(eq(users.id, userId)).limit(1);
}
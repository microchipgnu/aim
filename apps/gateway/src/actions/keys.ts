'use server';

import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export type CreateApiKeyInput = {
  userId: string;
  name: string;
};

export type DeleteApiKeyInput = {
  id: string;
  userId: string;
};

export async function createApiKeyAction(input: CreateApiKeyInput) {
  const { userId, name } = input;
  
  const key = `aim_${nanoid(32)}`;
  
  const result = await db.insert(apiKeys).values({
    id: nanoid(),
    userId,
    name,
    key,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  
  return result[0];
}

export async function listApiKeysAction(userId: string) {
  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId))
    .orderBy(apiKeys.createdAt);
  
  return keys;
}

export async function deleteApiKeyAction(input: DeleteApiKeyInput) {
  const { id, userId } = input;
  
  const result = await db
    .delete(apiKeys)
    .where(
      and(
        eq(apiKeys.id, id),
        eq(apiKeys.userId, userId)
      )
    )
    .returning();
  
  return result[0];
}

export async function verifyApiKeyAction(token: string) {
  const key = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.key, token))
    .limit(1);
  
  if (key.length === 0) {
    return null;
  }
  
  // Update usage count and last used timestamp
  await db
    .update(apiKeys)
    .set({
      usageCount: key[0].usageCount + 1,
      lastUsedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(apiKeys.id, key[0].id));
  
  return key[0];
}

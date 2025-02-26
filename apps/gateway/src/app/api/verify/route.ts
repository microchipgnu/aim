import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.debug('Received verification request');
  const bearerToken = request.headers.get('authorization');
  console.debug('Authorization header:', bearerToken);

  if (!bearerToken?.startsWith('Bearer ')) {
    console.debug('Invalid bearer token format');
    return NextResponse.json(
      { error: 'Missing or invalid bearer token' },
      { status: 401 },
    );
  }

  try {
    const token = bearerToken.split(' ')[1];
    console.debug('Extracted token:', token);

    const key = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, token))
      .limit(1);
    console.debug('DB query result:', key);

    if (key.length === 0) {
      console.debug('No matching API key found');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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

    console.debug('Found valid API key for user:', key[0].userId);
    return NextResponse.json({ id: key[0].userId });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { error: 'Verification service unavailable' },
      { status: 500 },
    );
  }
}

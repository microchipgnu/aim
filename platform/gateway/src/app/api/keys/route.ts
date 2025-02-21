import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, session.user.id));
    return NextResponse.json(keys);
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const key: typeof apiKeys.$inferInsert = {
        id: randomUUID(),
        name: "API Key",
        key: randomUUID(),
        userId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const newKey = await db.insert(apiKeys).values(key).returning();
    return NextResponse.json(newKey[0]);
}

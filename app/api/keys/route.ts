import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { eq, like } from "drizzle-orm";
import { keys } from "@/lib/db/schema";
import { getDB } from "@/lib/db";

export const runtime = "edge";

function generateKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parts = Array.from({ length: 4 }, () =>
    Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("")
  );
  return "KEY-" + parts.join("-");
}

function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  );
}

function durationToDays(duration: string): number {
  if (duration === "1 день" || duration === "1 day") return 1;
  if (duration === "7 дней" || duration === "7 days") return 7;
  if (duration === "30 дней" || duration === "30 days") return 30;
  if (duration === "90 дней" || duration === "90 days") return 90;
  return -1; // forever
}

export async function GET(request: Request) {
  try {
    const env = getRequestContext().env as any;
    const db = getDB(env);

    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const product = url.searchParams.get("product");

    let allKeys;

    if (search) {
      allKeys = await db
        .select()
        .from(keys)
        .where(like(keys.key, `%${search}%`));
    } else if (product) {
      allKeys = await db
        .select()
        .from(keys)
        .where(eq(keys.product, product));
    } else {
      allKeys = await db.select().from(keys);
    }

    return NextResponse.json(allKeys);
  } catch (error) {
    console.error("Keys GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const env = getRequestContext().env as any;
    const db = getDB(env);

    const count = body.count || 1;
    const newKeys = [];

    for (let i = 0; i < count; i++) {
      const keyData = {
        id: generateId(),
        key: generateKey(),
        product: body.product || "default",
        status: "created" as const,
        durationDays: durationToDays(body.duration || "30 дней"),
        hwid: null,
        activatedAt: null,
        expiresAt: null,
        createdBy: body.createdBy || "admin",
        createdAt: Math.floor(Date.now() / 1000),
      };

      await db.insert(keys).values(keyData);
      newKeys.push(keyData);
    }

    return NextResponse.json(newKeys, { status: 201 });
  } catch (error) {
    console.error("Keys POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const env = getRequestContext().env as any;
    const db = getDB(env);

    await db.delete(keys).where(eq(keys.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Keys DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const env = getRequestContext().env as any;
    const db = getDB(env);

    if (!body.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) updates.status = body.status;
    if (body.hwid !== undefined) updates.hwid = body.hwid;
    if (body.activatedAt !== undefined) updates.activatedAt = body.activatedAt;
    if (body.expiresAt !== undefined) updates.expiresAt = body.expiresAt;

    await db.update(keys).set(updates).where(eq(keys.id, body.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Keys PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

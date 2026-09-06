import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { eq } from "drizzle-orm";
import { keys } from "@/lib/db/schema";
import { getDB } from "@/lib/db";

export const runtime = "edge";

interface ValidateRequest {
  key: string;
  hwid: string;
}

interface ValidateResponse {
  valid: boolean;
  expires_at?: number;
  product?: string;
  error?: string;
}

export async function POST(
  request: Request
): Promise<NextResponse<ValidateResponse>> {
  try {
    const body: ValidateRequest = await request.json();

    if (!body.key || !body.hwid) {
      return NextResponse.json(
        { valid: false, error: "Missing key or hwid" },
        { status: 400 }
      );
    }

    const env = getRequestContext().env as any;
    const db = getDB(env);

    const normalizedKey = body.key.trim().toUpperCase();

    const result = await db
      .select()
      .from(keys)
      .where(eq(keys.key, normalizedKey))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { valid: false, error: "Key not found" },
        { status: 404 }
      );
    }

    const row = result[0];

    if (row.status === "banned") {
      return NextResponse.json(
        { valid: false, error: "Key is banned" },
        { status: 403 }
      );
    }

    if (row.status === "expired") {
      return NextResponse.json(
        { valid: false, error: "Key is expired" },
        { status: 403 }
      );
    }

    if (row.expiresAt && row.expiresAt < Math.floor(Date.now() / 1000)) {
      await db
        .update(keys)
        .set({ status: "expired" as const })
        .where(eq(keys.id, row.id));

      return NextResponse.json(
        { valid: false, error: "Key is expired" },
        { status: 403 }
      );
    }

    if (row.hwid && row.hwid !== body.hwid) {
      return NextResponse.json(
        { valid: false, error: "HWID mismatch" },
        { status: 403 }
      );
    }

    if (row.status === "created") {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt =
        row.durationDays === -1 ? 0 : now + row.durationDays * 86400;

      await db
        .update(keys)
        .set({
          status: "active" as const,
          hwid: body.hwid,
          activatedAt: now,
          expiresAt: expiresAt || null,
        })
        .where(eq(keys.id, row.id));

      return NextResponse.json({
        valid: true,
        expires_at: expiresAt || 0,
        product: row.product,
      });
    }

    return NextResponse.json({
      valid: true,
      expires_at: row.expiresAt || 0,
      product: row.product,
    });
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json(
      { valid: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

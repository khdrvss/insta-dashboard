import { getAuth as auth } from "@/lib/mock-auth";
import { NextResponse } from "next/server";
import { buildOAuthUrl } from "@/lib/meta-graph";
import { randomBytes } from "crypto";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CSRF state token — encode userId so callback can verify
  const state = `${userId}.${randomBytes(16).toString("hex")}`;

  const url = buildOAuthUrl(state);
  return NextResponse.redirect(url);
}

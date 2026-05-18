import { NextRequest, NextResponse } from "next/server";

const PASSPHRASE = "19801980";

export async function POST(req: NextRequest) {
  const { passphrase } = await req.json();

  if (passphrase !== PASSPHRASE) {
    return NextResponse.json({ error: "Invalid passphrase" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("session", "authenticated", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

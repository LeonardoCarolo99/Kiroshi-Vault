import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  if (!q) {
    return NextResponse.json({ error: "missing query" }, { status: 400 });
  }
  try {
    // Try to fetch profile page
    const url = q.startsWith("http") ? q : `https://melee.gg/Profile/Index/${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "KiroshiVault/1.0",
        "Accept": "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });
    const html = await res.text();
    return NextResponse.json({ html, url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}

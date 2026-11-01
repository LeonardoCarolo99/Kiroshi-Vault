import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }
  try {
    const url = `https://melee.gg/Tournament/View/${encodeURIComponent(id)}`;
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

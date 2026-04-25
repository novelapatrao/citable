import { scanSite } from "@/lib/scan";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const url = body?.url;
  if (!url || typeof url !== "string") {
    return Response.json({ error: "url is required" }, { status: 400 });
  }
  const result = await scanSite(url);
  return Response.json(result);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) {
    return Response.json({ error: "url query param required" }, { status: 400 });
  }
  const result = await scanSite(url);
  return Response.json(result);
}

export const runtime = "nodejs"; // ensure Node runtime for server-side SDKs

import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";

const ALLOWED_ORIGIN = "*"; // MVP: allow all; tighten later per site/domain

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  } as const;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

type Payload = {
  domain?: string;
  path?: string;
  referrer?: string;
  site_id?: string | null;
};

export async function POST(req: NextRequest) {
  let body: Payload | null = null;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  const domain = body?.domain || null;
  const path = body?.path || null;
  const referrer = body?.referrer || null;
  const site_id = body?.site_id ?? null;

  // Minimal validation for MVP
  if (!domain || !path) {
    return new Response(JSON.stringify({ error: "Missing domain or path" }), {
      status: 422,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  // Fire-and-forget insert; do not await to return ASAP
  try {
    const supabase = getAdminClient();
    supabase
      .from("page_views")
      .insert({ domain, path, referrer, site_id })
      .then(
        (res: any) => {
          if (res.error) console.error("page_views insert error:", res.error);
        },
        (e: unknown) => console.error("page_views insert exception:", e)
      );
  } catch (e) {
    // env missing or other setup error
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

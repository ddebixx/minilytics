import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function getUserIdFromAuthHeader(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const token = auth.replace(/^[Bb]earer\s+/, "").trim();
  if (!token) return null;
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("sites")
    .select("id, created_at, domain, site_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ sites: data ?? [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader(req);
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { domain?: string } = {};
  try {
    body = await req.json();
  } catch {}
  const domain = (body.domain || "").trim().toLowerCase();
  if (!domain) {
    return new Response(JSON.stringify({ error: "Domain is required" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = getAdminClient();

  // Ensure table exists or rely on pre-created schema
  // Generate a site_id (uuid) on insert using DB default if configured; else generate on app side
  const { data, error } = await supabase
    .from("sites")
    .insert({ user_id: userId, domain, site_id: crypto.randomUUID() })
    .select("id, created_at, domain, site_id")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ site: data }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

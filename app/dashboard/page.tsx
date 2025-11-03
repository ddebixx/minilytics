import { getAdminClient } from "@/lib/supabaseAdmin";
import SitesPanel from "@/components/SitesPanel";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic"; // always fetch fresh (MVP)

type PageView = {
  id: string;
  created_at: string;
  domain: string | null;
  path: string | null;
  referrer: string | null;
  site_id: string | null;
};

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    console.log('Dashboard auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      error: error?.message 
    });
    
    if (error || !user) return null;
    return user.id;
  } catch (e) {
    console.error('Auth check failed:', e);
    return null;
  }
}

async function fetchPageViews(userId: string): Promise<PageView[]> {
  try {
    const supabase = getAdminClient();
    
    // First get user's site_ids
    const { data: sites, error: sitesError } = await supabase
      .from("sites")
      .select("site_id")
      .eq("user_id", userId);
    
    if (sitesError) throw sitesError;
    if (!sites || sites.length === 0) return [];
    
    const siteIds = sites.map(s => s.site_id);
    
    // Then fetch page views for those sites
    const { data, error } = await supabase
      .from("page_views")
      .select("id, created_at, domain, path, referrer, site_id")
      .in("site_id", siteIds)
      .order("created_at", { ascending: false })
      .limit(100);
      
    if (error) throw error;
    return data as PageView[];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect('/');
  }
  
  const views = await fetchPageViews(userId);
  return (
    <div className="p-8 space-y-10">
      <SitesPanel />

      <h1 className="text-2xl font-semibold">Page Views (latest 100)</h1>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Time</th>
              <th className="text-left p-2">Domain</th>
              <th className="text-left p-2">Path</th>
              <th className="text-left p-2">Referrer</th>
              <th className="text-left p-2">Site ID</th>
            </tr>
          </thead>
          <tbody>
            {views.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="p-2">{new Date(v.created_at).toLocaleString()}</td>
                <td className="p-2">{v.domain}</td>
                <td className="p-2">{v.path}</td>
                <td className="p-2">{v.referrer}</td>
                <td className="p-2">{v.site_id}</td>
              </tr>
            ))}
            {views.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No data yet. Add the tracker to a page and open it.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

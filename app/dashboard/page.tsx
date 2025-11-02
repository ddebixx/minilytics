import { getAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic"; // always fetch fresh (MVP)

type PageView = {
  id: string;
  created_at: string;
  domain: string | null;
  path: string | null;
  referrer: string | null;
  site_id: string | null;
};

async function fetchPageViews(): Promise<PageView[]> {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("page_views")
      .select("id, created_at, domain, path, referrer, site_id")
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
  const views = await fetchPageViews();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-4">Page Views (latest 100)</h1>
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

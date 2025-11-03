import { getAdminClient } from "@/lib/supabaseAdmin";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabaseServer";
import Link from "next/link";
import { BarChart3, Globe, TrendingUp, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

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

async function getSitesCount(userId: string): Promise<number> {
  try {
    const supabase = getAdminClient();
    const { count } = await supabase
      .from("sites")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId);
    
    return count || 0;
  } catch (e) {
    console.error(e);
    return 0;
  }
}

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    redirect('/');
  }
  
  const views = await fetchPageViews(userId);
  const sitesCount = await getSitesCount(userId);
  
  const totalViews = views.length;
  const todayViews = views.filter(v => {
    const today = new Date().toISOString().split('T')[0];
    const viewDate = new Date(v.created_at).toISOString().split('T')[0];
    return today === viewDate;
  }).length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back! Here's your analytics overview
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <QuickStatCard
          icon={<BarChart3 className="h-6 w-6" />}
          title="Total Views"
          value={totalViews.toLocaleString()}
          color="blue"
        />
        <QuickStatCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="Today's Views"
          value={todayViews.toLocaleString()}
          color="green"
        />
        <QuickStatCard
          icon={<Globe className="h-6 w-6" />}
          title="Active Sites"
          value={sitesCount.toLocaleString()}
          color="purple"
        />
      </div>

      {/* Quick Links */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href="/dashboard/analytics"
          title="View Analytics"
          description="See detailed charts and insights"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <QuickLink
          href="/dashboard/sites"
          title="Manage Sites"
          description="Add or remove tracked websites"
          icon={<Globe className="h-5 w-5" />}
        />
        <QuickLink
          href="/dashboard/settings"
          title="Settings"
          description="Customize your preferences"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-6 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">Time</th>
                <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">Domain</th>
                <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">Path</th>
                <th className="p-4 text-left font-medium text-gray-700 dark:text-gray-300">Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {views.slice(0, 10).map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 text-gray-900 dark:text-white">
                    {new Date(v.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{v.domain}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{v.path}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{v.referrer || '-'}</td>
                </tr>
              ))}
              {views.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No data yet. Add the tracker to a page and open it.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {views.length > 10 && (
          <div className="border-t border-gray-200 p-4 text-center dark:border-gray-800">
            <Link 
              href="/dashboard/analytics"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View all activity →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStatCard({ 
  icon, 
  title, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  value: string
  color: "blue" | "green" | "purple"
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center gap-3">
        <div className={`rounded-lg bg-linear-to-br ${colorClasses[color]} p-2 text-white`}>
          {icon}
        </div>
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}

function QuickLink({
  href,
  title,
  description,
  icon
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-500 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-500"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <ArrowRight className="ml-auto h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </Link>
  )
}

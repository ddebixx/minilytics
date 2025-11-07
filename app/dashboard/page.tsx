"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabaseClient"
import ChartAreaInteractive from "@/components/analytics/ChartAreaInteractive"
import { BarChart3, TrendingUp, Eye, Globe } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Site = {
  id: string
  site_id: string
  domain: string
  created_at: string
}

type PageView = {
  id: string
  created_at: string
  domain: string | null
  path: string | null
  referrer: string | null
  site_id: string | null
}

type DailyStats = {
  date: string
  views: number
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSite, setSelectedSite] = useState<string>("all")
  const [pageViews, setPageViews] = useState<PageView[]>([])
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [timeRange, setTimeRange] = useState<string>("7d")

  useEffect(() => {
    fetchSites()
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [selectedSite])

  useEffect(() => {
    // Recalculate stats when time range changes
    if (pageViews.length > 0) {
      calculateDailyStats(pageViews)
    }
  }, [timeRange])

  const fetchSites = async () => {
    const supabase = getSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) return

    const response = await fetch('/api/sites', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      setSites(data.sites || [])
    }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    
    try {
      let query = supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedSite !== "all") {
        query = query.eq('site_id', selectedSite)
      }

      const { data, error } = await query

      if (error) throw error

      setPageViews(data || [])
      calculateDailyStats(data || [])
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDailyStats = (views: PageView[]) => {
    const stats: { [key: string]: number } = {}
    
    // Calculate days based on time range
    let days = 7
    if (timeRange === "30d") days = 30
    if (timeRange === "90d") days = 90
    
    const daysArray = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    daysArray.forEach(date => {
      stats[date] = 0
    })

    views.forEach(view => {
      const date = new Date(view.created_at).toISOString().split('T')[0]
      if (stats[date] !== undefined) {
        stats[date]++
      }
    })

    setDailyStats(
      Object.entries(stats).map(([date, views]) => ({
        date,
        views
      }))
    )
  }

  const totalViews = pageViews.length
  const totalSites = sites.length
  const todayViews = pageViews.filter(v => {
    const today = new Date().toISOString().split('T')[0]
    const viewDate = new Date(v.created_at).toISOString().split('T')[0]
    return today === viewDate
  }).length
  
  // Calculate average based on time range
  const daysInRange = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  const avgPerDay = daysInRange > 0 ? Math.round(totalViews / daysInRange) : 0

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Track your website performance and analytics
          </p>
        </div>

        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.site_id} value={site.site_id}>
                {site.domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Eye className="h-6 w-6" />}
          title="Total Views"
          value={totalViews.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          title="Today"
          value={todayViews.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={<Globe className="h-6 w-6" />}
          title="Total Sites"
          value={totalSites.toLocaleString()}
          color="purple"
        />
        <StatCard
          icon={<BarChart3 className="h-6 w-6" />}
          title="Avg/Day"
          value={avgPerDay.toLocaleString()}
          color="orange"
        />
      </div>

      {/* Chart */}
      <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {timeRange === "7d" ? "Last 7 Days" : timeRange === "30d" ? "Last 30 Days" : "Last 3 Months"}
          </h2>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-neutral-500">Loading...</div>
          </div>
        ) : (
          <div>
            <ChartAreaInteractive data={dailyStats.map(d => ({ date: d.date, visitors: d.views }))} />
          </div>
        )}
      </div>

      {/* Top Pages */}
      <div className="mb-8 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 className="mb-6 text-xl font-semibold text-neutral-900 dark:text-white">
          Top Pages
        </h2>
        
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="pb-3 text-left font-medium text-neutral-700 dark:text-neutral-300">Page</th>
                <th className="pb-3 text-left font-medium text-neutral-700 dark:text-neutral-300">Domain</th>
                <th className="pb-3 text-right font-medium text-neutral-700 dark:text-neutral-300">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {Object.entries(
                pageViews.reduce((acc, view) => {
                  const key = `${view.domain}${view.path}`
                  acc[key] = {
                    domain: view.domain || '',
                    path: view.path || '/',
                    count: (acc[key]?.count || 0) + 1
                  }
                  return acc
                }, {} as Record<string, { domain: string; path: string; count: number }>)
              )
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 10)
                .map(([key, data]) => (
                  <tr key={key}>
                    <td className="py-3 text-neutral-900 dark:text-white">{data.path}</td>
                    <td className="py-3 text-neutral-600 dark:text-neutral-400">{data.domain}</td>
                    <td className="py-3 text-right text-neutral-900 dark:text-white">{data.count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          
          {pageViews.length === 0 && (
            <div className="py-8 text-center text-neutral-500">
              No data yet. Add the tracker to your sites.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 p-6 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="p-4 text-left font-medium text-neutral-700 dark:text-neutral-300">Time</th>
                <th className="p-4 text-left font-medium text-neutral-700 dark:text-neutral-300">Domain</th>
                <th className="p-4 text-left font-medium text-neutral-700 dark:text-neutral-300">Path</th>
                <th className="p-4 text-left font-medium text-neutral-700 dark:text-neutral-300">Referrer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {pageViews.slice(0, 10).map((v) => (
                <tr key={v.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                  <td className="p-4 text-neutral-900 dark:text-white">
                    {new Date(v.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">{v.domain}</td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">{v.path}</td>
                  <td className="p-4 text-neutral-600 dark:text-neutral-400">{v.referrer || '-'}</td>
                </tr>
              ))}
              {pageViews.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-500">
                    No data yet. Add the tracker to a page and open it.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  title, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  title: string
  value: string
  color: "blue" | "green" | "purple" | "orange"
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-4 flex items-center gap-3">
        <div className={`rounded-lg bg-linear-to-br ${colorClasses[color]} p-2 text-white`}>
          {icon}
        </div>
        <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</div>
    </div>
  )
}

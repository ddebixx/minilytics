"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

type InputPoint = { date: string; visitors: number }

export default function ChartAreaInteractive({ data }: { data?: InputPoint[] }) {
  // Clamp visitors to >= 0 to prevent line from going below zero
  const chartData: { date: string; visitors: number }[] = React.useMemo(() => {
    if (data && data.length) {
      return data.map(d => ({ ...d, visitors: Math.max(0, d.visitors) }))
    }
    return []
  }, [data])

  return (
    <div style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 6 }}>
          <defs>
            <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#737373" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#737373" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#e5e5e5" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={20}
            tickFormatter={(value) => {
              const date = new Date(value)
              return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }}
          />
          <Tooltip
            contentStyle={{ background: "var(--tw-bg-white)", borderRadius: 8 }}
            labelFormatter={(value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          />
          <Area 
            dataKey="visitors" 
            type="monotone" 
            fill="url(#fillVisitors)" 
            stroke="#737373" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"

interface YearlyTrendsChartProps {
  data: Array<{ year: number; avgSalary: number; count: number }>
}

export function YearlyTrendsChart({ data }: YearlyTrendsChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No yearly trends data available</p>
          <p className="text-sm">Data: {JSON.stringify(data)}</p>
        </div>
      </div>
    )
  }

  const chartData = data
    .sort((a, b) => a.year - b.year)
    .map((item) => ({
      year: item.year.toString(),
      salary: Math.round(item.avgSalary),
      jobs: item.count,
    }))

  console.log("Yearly Trends Chart Data:", chartData)

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="year" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            yAxisId="salary"
            orientation="left"
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
          <YAxis yAxisId="jobs" orientation="right" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value: number, name: string) => [
              name === "salary" ? `$${value.toLocaleString()}` : value,
              name === "salary" ? "Average Salary" : "Job Count",
            ]}
            labelFormatter={(label) => `Year: ${label}`}
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend />
          <Bar yAxisId="jobs" dataKey="jobs" fill="#e5e7eb" name="Job Count" radius={[4, 4, 0, 0]} />
          <Line
            yAxisId="salary"
            type="monotone"
            dataKey="salary"
            stroke="#dc2626"
            strokeWidth={3}
            name="Average Salary"
            dot={{ fill: "#dc2626", strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, stroke: "#dc2626", strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

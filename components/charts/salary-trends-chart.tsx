"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"

interface SalaryTrendsChartProps {
  data: Array<{ year: number; avgSalary: number; count: number }>
}

export function SalaryTrendsChart({ data }: SalaryTrendsChartProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 w-full h-full rounded"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No salary trend data available</p>
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

  console.log("Salary Trends Chart Data:", chartData)

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="year" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
          />
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
          <Line
            type="monotone"
            dataKey="salary"
            stroke="#2563eb"
            strokeWidth={3}
            dot={{ fill: "#2563eb", strokeWidth: 2, r: 6 }}
            activeDot={{ r: 8, stroke: "#2563eb", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

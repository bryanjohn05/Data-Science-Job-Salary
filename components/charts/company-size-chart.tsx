"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useEffect, useState } from "react"

interface CompanySizeChartProps {
  data: Array<{ size: string; avgSalary: number; count: number }>
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1"]

export function CompanySizeChart({ data }: CompanySizeChartProps) {
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
          <p>No company size data available</p>
          <p className="text-sm">Data: {JSON.stringify(data)}</p>
        </div>
      </div>
    )
  }

  const chartData = data
    .sort((a, b) => {
      const order = { S: 1, M: 2, L: 3 }
      return (order[a.size as keyof typeof order] || 4) - (order[b.size as keyof typeof order] || 4)
    })
    .map((item) => ({
      size: item.size === "S" ? "Small" : item.size === "M" ? "Medium" : item.size === "L" ? "Large" : item.size,
      salary: Math.round(item.avgSalary),
      count: item.count,
    }))

  console.log("Company Size Chart Data:", chartData)

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="size" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
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
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #ccc",
              borderRadius: "8px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Bar dataKey="salary" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

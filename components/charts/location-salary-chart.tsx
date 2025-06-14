"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useEffect, useState } from "react"

interface LocationSalaryChartProps {
  data: Array<{ location: string; avgSalary: number; count: number }>
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7300",
  "#00FF00",
  "#FF00FF",
]

export function LocationSalaryChart({ data }: LocationSalaryChartProps) {
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
          <p>No location data available</p>
          <p className="text-sm">Data: {JSON.stringify(data?.slice(0, 2))}</p>
        </div>
      </div>
    )
  }

  const chartData = data.slice(0, 10).map((item) => ({
    location: item.location.length > 15 ? item.location.substring(0, 15) + "..." : item.location,
    fullLocation: item.location,
    salary: Math.round(item.avgSalary),
    count: item.count,
  }))

  console.log("Location Chart Data:", chartData)

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="location"
            angle={-45}
            textAnchor="end"
            height={100}
            stroke="#666"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
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
            labelFormatter={(label, payload) =>
              payload && payload[0] ? `Location: ${payload[0].payload.fullLocation}` : label
            }
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

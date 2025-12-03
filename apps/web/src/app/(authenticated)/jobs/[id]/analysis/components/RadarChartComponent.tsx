'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'
import type { AnalysisDimension } from '@careermatch/shared'

interface RadarChartComponentProps {
  dimensions: AnalysisDimension[]
}

export function RadarChartComponent({ dimensions }: RadarChartComponentProps) {
  // Transform dimensions to Recharts format
  const data = dimensions.map((dim) => ({
    dimension: dim.name,
    score: dim.score,
    fullMark: 100,
  }))

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          tickLine={false}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          tickCount={6}
        />
        <Radar
          name="匹配度"
          dataKey="score"
          stroke="#8B5CF6"
          fill="#8B5CF6"
          fillOpacity={0.6}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              const dimension = dimensions.find((d) => d.name === data.dimension)

              return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
                  <p className="font-semibold text-gray-900 mb-1">{data.dimension}</p>
                  <p className="text-2xl font-bold text-primary-600 mb-2">
                    {data.score}<span className="text-sm text-gray-500">/100</span>
                  </p>
                  {dimension && (
                    <p className="text-sm text-gray-600">{dimension.description}</p>
                  )}
                </div>
              )
            }
            return null
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

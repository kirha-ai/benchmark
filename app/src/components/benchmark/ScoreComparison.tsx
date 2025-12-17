import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import type { ChartDataPoint } from '@/lib/loadResults'

const chartConfig = {
  kirha: {
    label: 'Kirha',
    color: '#6366f1',
  },
  websearch: {
    label: 'Web Search',
    color: '#f97316',
  },
} satisfies ChartConfig

interface ScoreComparisonProps {
  chartData: ChartDataPoint[]
}

export function ScoreComparison({ chartData }: ScoreComparisonProps) {
  return (
    <section className="mb-10 sm:mb-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold">Score Comparison</h2>
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#6366f1]"></div>
            <span>Kirha</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#f97316]"></div>
            <span>Web Search</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
        <div>
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">By Metric</h3>
          <ChartContainer config={chartConfig} className="h-[240px] sm:h-[280px] w-full">
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} fontSize={12} />
              <YAxis dataKey="category" type="category" width={100} fontSize={12} />
              <ChartTooltip
                isAnimationActive={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full justify-between gap-2">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium">{value}%</span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="kirha" name="Kirha" fill="var(--color-kirha)" radius={4} isAnimationActive={false} />
              <Bar dataKey="websearch" name="Web Search" fill="var(--color-websearch)" radius={4} isAnimationActive={false} />
            </BarChart>
          </ChartContainer>
        </div>

        <div>
          <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-3 sm:mb-4">Performance Profile</h3>
          <ChartContainer config={chartConfig} className="h-[240px] sm:h-[280px] w-full">
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" fontSize={11} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Kirha"
                dataKey="kirha"
                stroke="var(--color-kirha)"
                fill="var(--color-kirha)"
                fillOpacity={0.3}
                isAnimationActive={false}
              />
              <Radar
                name="Web Search"
                dataKey="websearch"
                stroke="var(--color-websearch)"
                fill="var(--color-websearch)"
                fillOpacity={0.3}
                isAnimationActive={false}
              />
              <ChartTooltip
                isAnimationActive={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full justify-between gap-2">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium">{value}%</span>
                      </div>
                    )}
                  />
                }
              />
            </RadarChart>
          </ChartContainer>
        </div>
      </div>
    </section>
  )
}

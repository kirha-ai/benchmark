import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { loadResults, type BenchmarkResult } from '@/lib/loadResults'
import {
  Header,
  Footer,
  ScoreSummary,
  TokenComparison,
  Methodology,
  ScoreComparison,
  ResultsTable,
  ResultDetailModal,
  RawDataModal,
} from '@/components/benchmark'

export const Route = createFileRoute('/')({
  loader: async () => {
    return await loadResults()
  },
  component: BenchmarkPage,
})

const ITEMS_PER_PAGE = 10

function BenchmarkPage() {
  const { results, summary } = Route.useLoaderData()
  const [selectedResult, setSelectedResult] = useState<BenchmarkResult | null>(null)
  const [rawDataModal, setRawDataModal] = useState<{ title: string; data: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE)
  const paginatedResults = results.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="min-h-screen bg-linear-to-b from-primary/10 to-background">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1.5">
            Domain-Specific Data Enrichment Benchmark
          </h1>
          <p className="text-base font-medium text-muted-foreground max-w-2xl">
            Comparing Kirha's domain-specific knowledge against standard web search.
          </p>
        </div>

        <ScoreSummary
          kirhaScore={summary.kirhaScore}
          websearchScore={summary.websearchScore}
        />

        <TokenComparison
          totalTests={summary.totalTests}
          kirhaTokens={summary.kirhaTokens}
          websearchTokens={summary.websearchTokens}
          savingsPercent={summary.tokenSavingsPercent}
        />

        <Methodology />

        <ScoreComparison chartData={summary.chartData} />

        <Separator className="mb-10 sm:mb-16" />

        <ResultsTable
          results={results}
          paginatedResults={paginatedResults}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onSelectResult={setSelectedResult}
        />
      </main>

      <Footer />

      <ResultDetailModal
        result={selectedResult}
        onClose={() => setSelectedResult(null)}
        onShowRawData={(title, data) => setRawDataModal({ title, data })}
      />

      <RawDataModal
        data={rawDataModal}
        onClose={() => setRawDataModal(null)}
      />
    </div>
  )
}

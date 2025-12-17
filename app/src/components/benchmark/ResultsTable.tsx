import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Eye } from 'lucide-react'
import type { BenchmarkResult } from '@/lib/loadResults'

// Internal component: Winner Badge
function WinnerBadge({ winner, size = 'md' }: { winner: string; size?: 'sm' | 'md' }) {
  const style = winner === 'kirha'
    ? { backgroundColor: '#6366f1' }
    : winner === 'websearch'
      ? { backgroundColor: '#f97316' }
      : undefined

  const label = winner === 'kirha'
    ? (size === 'sm' ? 'Kirha' : 'Kirha')
    : winner === 'websearch'
      ? (size === 'sm' ? 'Web' : 'Web Search')
      : 'Tie'

  return (
    <Badge
      className={`${size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : ''} ${!style ? 'bg-muted-foreground hover:bg-muted-foreground' : ''}`}
      style={style}
    >
      {label}
    </Badge>
  )
}

// Internal component: Mobile Result Card
function ResultCard({ result, onClick }: { result: BenchmarkResult; onClick: () => void }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 active:bg-muted"
      onClick={onClick}
    >
      <span className="text-xs text-muted-foreground w-5 shrink-0">#{result.id}</span>
      <span className="text-sm flex-1 line-clamp-1 min-w-0">{result.prompt}</span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <div className={`text-xs ${result.winner === 'kirha' ? 'font-medium' : 'text-muted-foreground'}`}>
            {result.kirha.score}%
          </div>
          <div className={`text-[10px] ${result.winner === 'websearch' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {result.websearch.score}%
          </div>
        </div>
        <WinnerBadge winner={result.winner} size="sm" />
      </div>
    </div>
  )
}

// Internal component: Desktop Result Row
function ResultRow({ result, onClick }: { result: BenchmarkResult; onClick: () => void }) {
  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell className="font-medium">{result.id}</TableCell>
      <TableCell className="max-w-[300px] lg:max-w-[400px]">
        <span className="block truncate">{result.prompt}</span>
      </TableCell>
      <TableCell className={`text-center ${result.winner === 'kirha' ? 'font-medium' : 'text-muted-foreground'}`}>
        {result.kirha.score}%
      </TableCell>
      <TableCell className={`text-center ${result.winner === 'websearch' ? 'font-medium' : 'text-muted-foreground'}`}>
        {result.websearch.score}%
      </TableCell>
      <TableCell className="text-center">
        <WinnerBadge winner={result.winner} />
      </TableCell>
      <TableCell>
        <Eye className="h-4 w-4 text-muted-foreground" />
      </TableCell>
    </TableRow>
  )
}

// Internal component: Pagination
function ResultsPagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              onClick={() => onPageChange(page)}
              isActive={currentPage === page}
              className="cursor-pointer"
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// Main component
interface ResultsTableProps {
  results: BenchmarkResult[]
  paginatedResults: BenchmarkResult[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onSelectResult: (result: BenchmarkResult) => void
}

export function ResultsTable({
  results,
  paginatedResults,
  currentPage,
  totalPages,
  onPageChange,
  onSelectResult,
}: ResultsTableProps) {
  return (
    <section className="mb-10 sm:mb-16">
      <h2 className="text-lg sm:text-xl font-semibold mb-2">
        Test Results <span className="text-muted-foreground font-normal">({results.length})</span>
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
        Tap on a row to see detailed results and raw outputs
      </p>

      {/* Mobile view */}
      <div className="sm:hidden space-y-2">
        {paginatedResults.map((result) => (
          <ResultCard key={result.id} result={result} onClick={() => onSelectResult(result)} />
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Query</TableHead>
              <TableHead className="text-center w-24">Kirha</TableHead>
              <TableHead className="text-center w-24">Web Search</TableHead>
              <TableHead className="text-center w-24">Winner</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedResults.map((result) => (
              <ResultRow key={result.id} result={result} onClick={() => onSelectResult(result)} />
            ))}
          </TableBody>
        </Table>
      </div>

      <ResultsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </section>
  )
}

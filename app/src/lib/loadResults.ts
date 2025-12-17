import { createServerFn } from "@tanstack/react-start";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export type SourceResult = {
  relevance: number;
  accuracy: number;
  completeness: number;
  freshness: number;
  actionability: number;
  score: number;
  feedback: string;
  result: string;
  rawData: string;
  tokens: number;
};

export type BenchmarkResult = {
  id: number;
  prompt: string;
  vertical: string;
  winner: string;
  lastRunDate: string;
  kirha: SourceResult;
  websearch: SourceResult;
};

export type ChartDataPoint = {
  category: string;
  kirha: number;
  websearch: number;
};

export type BenchmarkSummary = {
  totalTests: number;
  kirhaScore: number;
  websearchScore: number;
  kirhaTokens: number;
  websearchTokens: number;
  tokenSavingsPercent: number;
  chartData: ChartDataPoint[];
};

export type BenchmarkData = {
  results: BenchmarkResult[];
  summary: BenchmarkSummary;
};

export const loadResults = createServerFn({ method: "GET" }).handler(
  async (): Promise<BenchmarkData> => {
    const resultsPath = join(process.cwd(), "public", "benchmark-results.json");
    const data: BenchmarkData = JSON.parse(readFileSync(resultsPath, "utf-8"));
    return data;
  },
);

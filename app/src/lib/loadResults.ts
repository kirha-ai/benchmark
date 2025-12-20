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
  tokens: number;
};

export type SourceDetail = {
  result: string;
  feedback: string;
  rawData: string;
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

export type ResultDetail = {
  kirha: SourceDetail;
  websearch: SourceDetail;
};

const resultsPath = join(process.cwd(), "public", "results", "global.json");
const cachedResults: BenchmarkData = JSON.parse(
  readFileSync(resultsPath, "utf-8"),
);

export const loadResults = createServerFn({ method: "GET" }).handler(
  (): BenchmarkData => cachedResults,
);

export async function loadResultDetail(id: number): Promise<ResultDetail> {
  const response = await fetch(`/results/${id}.json`);
  return response.json();
}

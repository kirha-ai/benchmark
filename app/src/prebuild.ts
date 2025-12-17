import { encode } from "gpt-tokenizer";

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "..", "..", "data");
const RESULTS_DIR = join(DATA_DIR, "results");

const categories = [
  "relevance",
  "accuracy",
  "completeness",
  "freshness",
  "actionability",
] as const;

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const phoneRegex = /\+\d{1,3}[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

function maskPrivateData(text: string): string {
  return text
    .replace(emailRegex, "private@email.com")
    .replace(phoneRegex, "+1 XXX-XXX-XXXX");
}

function countTokens(text: string): number {
  return encode(text).length;
}

function calculateScore(scores: Record<string, number>): number {
  return Math.round(
    categories.reduce((sum, cat) => sum + (scores[cat] || 0), 0) / 5,
  );
}

console.log("Building results with pre-computed data...");

const prompts = readFileSync(join(DATA_DIR, "prompts.jsonl"), "utf-8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const judgeResults = readFileSync(
  join(RESULTS_DIR, "judge-result.jsonl"),
  "utf-8",
)
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const kirhaResults = readFileSync(
  join(RESULTS_DIR, "kirha-result.jsonl"),
  "utf-8",
)
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const websearchResults = readFileSync(
  join(RESULTS_DIR, "exa-result.jsonl"),
  "utf-8",
)
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const results = judgeResults.map((judge) => {
  const kirha = kirhaResults.find((k: { id: number }) => k.id === judge.id);
  const websearch = websearchResults.find(
    (w: { id: number }) => w.id === judge.id,
  );
  const promptData = prompts.find((p: { id: number }) => p.id === judge.id);

  const kirhaRawData = kirha?.rawData || "";
  const websearchRawData = websearch?.rawData || "";

  const kirhaScores = {
    relevance: judge.kirha?.relevance || 0,
    accuracy: judge.kirha?.accuracy || 0,
    completeness: judge.kirha?.completeness || 0,
    freshness: judge.kirha?.freshness || 0,
    actionability: judge.kirha?.actionability || 0,
  };

  const websearchScores = {
    relevance: judge.exa?.relevance || 0,
    accuracy: judge.exa?.accuracy || 0,
    completeness: judge.exa?.completeness || 0,
    freshness: judge.exa?.freshness || 0,
    actionability: judge.exa?.actionability || 0,
  };

  console.log(`Processing #${judge.id}: ${judge.prompt.slice(0, 40)}...`);

  return {
    id: judge.id,
    prompt: judge.prompt,
    vertical: promptData?.vertical || "unknown",
    winner: judge.winner === "exa" ? "websearch" : judge.winner,
    lastRunDate: judge.lastRunDate || "",
    kirha: {
      ...kirhaScores,
      score: calculateScore(kirhaScores),
      feedback: judge.kirha?.feedback || "",
      result: maskPrivateData(kirha?.result || ""),
      rawData: maskPrivateData(kirhaRawData),
      tokens: countTokens(kirhaRawData),
    },
    websearch: {
      ...websearchScores,
      score: calculateScore(websearchScores),
      feedback: judge.exa?.feedback || "",
      result: maskPrivateData(websearch?.result || ""),
      rawData: maskPrivateData(websearchRawData),
      tokens: countTokens(websearchRawData),
    },
  };
});

const totalKirhaTokens = results.reduce((sum, r) => sum + r.kirha.tokens, 0);
const totalWebsearchTokens = results.reduce(
  (sum, r) => sum + r.websearch.tokens,
  0,
);
const tokenSavingsPercent =
  totalWebsearchTokens > 0
    ? Math.round((1 - totalKirhaTokens / totalWebsearchTokens) * 100)
    : 0;

const aggregateScores = {
  kirha: {
    relevance: 0,
    accuracy: 0,
    completeness: 0,
    freshness: 0,
    actionability: 0,
    score: 0,
  },
  websearch: {
    relevance: 0,
    accuracy: 0,
    completeness: 0,
    freshness: 0,
    actionability: 0,
    score: 0,
  },
};

results.forEach((r) => {
  categories.forEach((cat) => {
    aggregateScores.kirha[cat] += r.kirha[cat];
    aggregateScores.websearch[cat] += r.websearch[cat];
  });
});

categories.forEach((cat) => {
  aggregateScores.kirha[cat] = Math.round(
    aggregateScores.kirha[cat] / results.length,
  );
  aggregateScores.websearch[cat] = Math.round(
    aggregateScores.websearch[cat] / results.length,
  );
});

aggregateScores.kirha.score = calculateScore(aggregateScores.kirha);
aggregateScores.websearch.score = calculateScore(aggregateScores.websearch);

const chartData = categories.map((cat) => ({
  category: cat.charAt(0).toUpperCase() + cat.slice(1),
  kirha: aggregateScores.kirha[cat],
  websearch: aggregateScores.websearch[cat],
}));

const output = {
  results,
  summary: {
    totalTests: results.length,
    kirhaScore: aggregateScores.kirha.score,
    websearchScore: aggregateScores.websearch.score,
    kirhaTokens: totalKirhaTokens,
    websearchTokens: totalWebsearchTokens,
    tokenSavingsPercent,
    chartData,
  },
};

const outputPath = join(
  import.meta.dirname,
  "..",
  "public",
  "benchmark-results.json",
);
writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✓ Built ${results.length} results`);
console.log(`  Kirha score: ${aggregateScores.kirha.score}/100`);
console.log(`  Websearch score: ${aggregateScores.websearch.score}/100`);
console.log(`  Kirha tokens: ${totalKirhaTokens.toLocaleString()}`);
console.log(`  Websearch tokens: ${totalWebsearchTokens.toLocaleString()}`);
console.log(`  Token savings: ${tokenSavingsPercent}%`);
console.log(`  Output: ${outputPath}`);

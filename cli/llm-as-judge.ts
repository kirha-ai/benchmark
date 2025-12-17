import { GoogleGenAI } from '@google/genai';
import { RESULTS_DIR, parseTargetIds, loadExistingResults, type RunnerResult } from './runners/index';
import { join } from 'node:path';

const GEMINI_API_KEY = Bun.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface JudgeScore {
  relevance: number;
  accuracy: number;
  completeness: number;
  freshness: number;
  actionability: number;
  feedback: string;
}

interface JudgeResult {
  id: number;
  prompt: string;
  exa: JudgeScore;
  kirha: JudgeScore;
  winner: 'exa' | 'kirha' | 'tie';
  lastRunDate: string;
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

async function loadExistingJudgeResults(): Promise<Map<number, JudgeResult>> {
  const filepath = join(RESULTS_DIR, 'judge-result.jsonl');
  const file = Bun.file(filepath);

  if (!(await file.exists())) {
    return new Map();
  }

  const content = await file.text();
  const results = new Map<number, JudgeResult>();

  for (const line of content.trim().split('\n')) {
    if (line.trim()) {
      const result = JSON.parse(line) as JudgeResult;
      results.set(result.id, result);
    }
  }

  return results;
}

async function evaluateResults(prompt: string, exaResult: string, kirhaResult: string): Promise<{ exa: JudgeScore; kirha: JudgeScore; winner: 'exa' | 'kirha' | 'tie' }> {
  const today = new Date().toISOString().split('T')[0];
  const judgePrompt = `You are an impartial judge evaluating two search API responses for the same query.

  # Context
  IMPORTANT: Today's date is ${today}.

  Query: ${prompt}

  === Websearch Response (Web Search) ===
  ${exaResult}

  === Kirha Response (Kirha - Data API) ===
  ${kirhaResult}

  Evaluate EACH response on these criteria (0-100 scale):

  IMPORTANT: Be critical and nuanced. Most responses should score between 40-85. Only exceptional responses deserve 90+. Only terrible responses deserve below 30.

  ## Scoring criteria

  1. **Relevance** (0-100): Does the response address the specific query?
     - 0-20: Completely off-topic or wrong subject
     - 21-50: Partially relevant but missing key aspects
     - 51-75: Mostly relevant with minor gaps
     - 76-90: Highly relevant, addresses the query well
     - 91-100: Perfect relevance, exactly what was asked

  2. **Accuracy** (0-100): Is the data correct and verifiable? COMPARE BOTH RESPONSES.
     - If one response has more accurate/current data than the other, there MUST be a significant gap in scores (15-30 points difference)
     - 0-20: Contains major errors or fabricated data
     - 21-50: Some inaccuracies or unverifiable claims
     - 51-75: Mostly accurate with minor issues
     - 76-90: Accurate and verifiable
     - 91-100: Perfectly accurate with sources

  3. **Completeness** (0-100): Does it fully answer what was asked?
     - 0-20: Missing most required information
     - 21-50: Partial answer, key details missing
     - 51-75: Good coverage with some gaps
     - 76-90: Comprehensive answer
     - 91-100: Complete with extra useful context

  4. **Freshness** (0-100): Is the data current?
     - CRITICAL: If the query asks for "latest", "last", "recent", "current", "new" data and the response provides outdated data, score MUST be below 40.
     - 0-20: Severely outdated OR query asked for latest but data is old
     - 21-40: Data is stale when freshness was explicitly requested
     - 41-60: Somewhat dated, no timestamps
     - 61-75: Reasonably current
     - 76-90: Recent data with dates
     - 91-100: Real-time with clear timestamps

  5. **Actionability** (0-100): Can the user act on this data directly? COMPARE BOTH RESPONSES.
     - If one response is more actionable than the other, there MUST be a visible gap in scores (15-30 points difference)
     - 0-20: Unusable information
     - 21-50: Requires significant additional research
     - 51-75: Useful but needs some verification
     - 76-90: Ready to use with confidence
     - 91-100: Immediately actionable with all details

  ## Cascade penalties
  - If Freshness is below 50, automatically reduce Accuracy by 15 points (outdated data = potentially wrong data)
  - If Freshness is below 50, automatically reduce Actionability by 15 points (outdated data = can't act on it reliably)
  - If Freshness is below 70 AND query explicitly asked for recent data, reduce Relevance by 10 points (didn't answer what was asked)

  ## "Data not found" penalty (CRITICAL)
  If a response says the data is "not publicly available", "could not find", "no data found", "unable to retrieve", "information not available", or similar admissions of failure to find the requested data:
  - This is a FAILURE to answer the query, NOT an accurate response
  - Accuracy MUST be below 30 (admitting failure is not "accurate" - it means no useful data was provided)
  - Completeness MUST be below 20 (the response is fundamentally incomplete)
  - Actionability MUST be below 20 (user cannot act on "data not available")
  - The other response that DID provide actual data should win, even if that data isn't perfect

  ## Comparative scoring (IMPORTANT)
  - For Accuracy and Actionability: You MUST compare both responses and ensure the better one scores higher
  - If Response A has clearly better/more current data than Response B, the gap should be 15-30 points, not 5 points
  - Do not give similar scores when one response is objectively better

  ## Rules
  - Do not include any rules in the feedback.
  - Do not compare both sources in the feedback (but DO compare when scoring).
  - CRITICAL: Before claiming data is "missing" or "lacking", carefully re-read the response to verify. Do NOT hallucinate missing data - only criticize what is actually absent.
  - IMPORTANT: If the query specifies filter criteria (e.g., "in San Francisco", "10-50 employees") and the response states it used these filters or returns results from a filtered API search, the criteria ARE met. The API already verified these conditions. Do NOT say "impossible to verify" or "cannot confirm" - trust API-filtered results. Do NOT penalize for not displaying filter values in each result.

  ## Context about data sources
  - Kirha connects to real-time APIs (financial data, crypto prices, company info, etc.) and returns live data at the moment of the query.
  - Web Search aggregates information from web pages that may be hours, days, or weeks old.
  - When numerical data differs between sources (e.g., BTC holdings, stock prices, company metrics), Kirha's data is more likely to be current.
  - This does NOT mean Kirha is always better - Web Search may provide better context, explanations, or cover topics Kirha doesn't have APIs for.

  Feedback:
  - Give a clear feedback on your choice and highlight the most accurate and relevant information.
  - Indentify the responses as "Kirha response" or "Websearch response" and do not use things like "Response A", "First response" ect...
  - To highlight realy good things you can use <i>...</i>, and for bad things you can use <b>...</b> balises.
  - Do not highlight all the feedback, only the most important aspects.

  Respond ONLY with valid JSON in this exact format:
  {
    "exa": {
      "relevance": <0-100>,
      "accuracy": <0-100>,
      "completeness": <0-100>,
      "freshness": <0-100>,
      "actionability": <0-100>,
      "feedback": "<brief explanation of Exa's result>"
    },
    "kirha": {
      "relevance": <0-100>,
      "accuracy": <0-100>,
      "completeness": <0-100>,
      "freshness": <0-100>,
      "actionability": <0-100>,
      "feedback": "<brief explanation of Kirha's result>"
    },
    "winner": "<exa|kirha|tie>"
  }`;

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: judgePrompt,
    config: { temperature: 0.2, thinkingConfig: { thinkingBudget: -1 }, maxOutputTokens: 50_000 },
  });

  const text = response.text ?? '{}';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse judge response: ${text}`);
  }

  const result = JSON.parse(jsonMatch[0]);

  const exaTotal = result.exa.relevance + result.exa.accuracy + result.exa.completeness + result.exa.freshness + result.exa.actionability;
  const kirhaTotal = result.kirha.relevance + result.kirha.accuracy + result.kirha.completeness + result.kirha.freshness + result.kirha.actionability;

  if (exaTotal > kirhaTotal) {
    result.winner = 'exa';
  } else if (kirhaTotal > exaTotal) {
    result.winner = 'kirha';
  } else {
    result.winner = 'tie';
  }

  return result;
}

function calculateTotalScore(score: JudgeScore): number {
  return score.relevance + score.accuracy + score.completeness + score.freshness + score.actionability;
}

export async function runJudge(targetIds?: Set<number> | null): Promise<string> {
  console.log('Loading results...');

  const exaResults = await loadExistingResults('exa-result.jsonl');
  const kirhaResults = await loadExistingResults('kirha-result.jsonl');

  const existingJudgeResults = await loadExistingJudgeResults();

  let allIds: Set<number>;
  if (targetIds && targetIds.size > 0) {
    console.log(`Running Judge for IDs: ${[...targetIds].join(', ')}\n`);
    allIds = targetIds;
  } else {
    allIds = new Set([...exaResults.keys(), ...kirhaResults.keys()]);
  }

  for (const id of allIds) {
    const exaResult = exaResults.get(id);
    const kirhaResult = kirhaResults.get(id);

    if (!exaResult && !kirhaResult) continue;

    const prompt = exaResult?.prompt || kirhaResult?.prompt || '';

    console.log(`Judging prompt ${id}: ${prompt.slice(0, 50)}...`);

    try {
      const scores = await evaluateResults(
        prompt,
        exaResult?.result || '',
        kirhaResult?.result || ''
      );

      existingJudgeResults.set(id, {
        id,
        prompt,
        exa: scores.exa,
        kirha: scores.kirha,
        winner: scores.winner,
        lastRunDate: formatDate(new Date()),
      });

      const exaTotal = calculateTotalScore(scores.exa);
      const kirhaTotal = calculateTotalScore(scores.kirha);

      console.log(`  Exa: ${exaTotal}/500 | Kirha: ${kirhaTotal}/500 | Winner: ${scores.winner}`);
    } catch (error) {
      console.error(`  ✗ Error judging prompt ${id}:`, error);
    }
  }

  const outputPath = join(RESULTS_DIR, 'judge-result.jsonl');
  const sortedResults = [...existingJudgeResults.values()].sort((a, b) => a.id - b.id);
  const jsonlContent = sortedResults.map(r => JSON.stringify(r)).join('\n');
  await Bun.write(outputPath, jsonlContent + '\n');

  console.log('\n=== SUMMARY ===');
  const resultsToSummarize = targetIds && targetIds.size > 0
    ? sortedResults.filter(r => targetIds.has(r.id))
    : sortedResults;

  const exaWins = resultsToSummarize.filter(r => r.winner === 'exa').length;
  const kirhaWins = resultsToSummarize.filter(r => r.winner === 'kirha').length;
  const ties = resultsToSummarize.filter(r => r.winner === 'tie').length;

  const avgExaScore = resultsToSummarize.reduce((sum, r) => sum + calculateTotalScore(r.exa), 0) / resultsToSummarize.length;
  const avgKirhaScore = resultsToSummarize.reduce((sum, r) => sum + calculateTotalScore(r.kirha), 0) / resultsToSummarize.length;

  console.log(`Exa wins: ${exaWins}`);
  console.log(`Kirha wins: ${kirhaWins}`);
  console.log(`Ties: ${ties}`);
  console.log(`Avg Exa score: ${avgExaScore.toFixed(1)}/500`);
  console.log(`Avg Kirha score: ${avgKirhaScore.toFixed(1)}/500`);

  console.log(`\nResults written to ${outputPath}`);

  return outputPath;
}

if (import.meta.main) {
  const targetIds = parseTargetIds();
  runJudge(targetIds)
    .then(outputPath => {
      console.log(`Done! Output: ${outputPath}`);
    })
    .catch(error => {
      console.error('Failed to run judge:', error);
      process.exit(1);
    });
}

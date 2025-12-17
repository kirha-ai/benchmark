import { loadPrompts, writeResults, parseTargetIds, type RunnerResult } from './index';
import { summarizeResults } from '../summarizer';

const KIRHA_API_KEY = Bun.env.KIRHA_API_KEY;
const KIRHA_API_URL = 'https://api.kirha.ai/chat/v1/search';

if (!KIRHA_API_KEY) {
  throw new Error('KIRHA_API_KEY environment variable is required');
}

interface KirhaRawDataStep {
  step_id: string;
  tool_name: string;
  parameters: Record<string, unknown>;
  output: unknown;
}

interface KirhaResponse {
  id: string;
  summary?: string;
  raw_data?: KirhaRawDataStep[];
  planning?: {
    status: string;
    steps: unknown[];
    reasoning: string;
  };
  usage?: {
    estimated: number;
    consumed: number;
  };
}

async function searchKirha(
  query: string,
  verticalId: string
): Promise<string> {
  const response = await fetch(KIRHA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIRHA_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      vertical_id: verticalId,
      include_planning: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kirha API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return JSON.stringify(data.raw_data.map((r: any) => {
    return {
      tool_name: r.tool_name,
      parameters: r.parameters,
      output: r.output,
    };
  }));
}

export async function runKirhaRunner(targetIds?: Set<number> | null): Promise<string> {
  const prompts = await loadPrompts(targetIds);
  const results: RunnerResult[] = [];

  if (targetIds && targetIds.size > 0) {
    console.log(`Running Kirha for IDs: ${[...targetIds].join(', ')}\n`);
  }

  for (const promptData of prompts) {
    console.log(`Processing prompt ${promptData.id}: ${promptData.prompt.slice(0, 50)}...`);

    try {
      const rawResult = await searchKirha(promptData.prompt, promptData.vertical);

      console.log(`  ✓ Got ${rawResult.length} chars, summarizing...`);

      const result = await summarizeResults(promptData.prompt, rawResult);

      results.push({
        id: promptData.id,
        prompt: promptData.prompt,
        rawData: rawResult,
        result,
      });

      console.log(`  ✓ Summary complete`);
    } catch (error) {
      console.error(`  ✗ Error processing prompt ${promptData.id}:`, error);

      results.push({
        id: promptData.id,
        prompt: promptData.prompt,
        rawData: '',
        result: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const outputPath = await writeResults('kirha-result.jsonl', results, targetIds);
  console.log(`\nResults written to ${outputPath}`);

  return outputPath;
}

if (import.meta.main) {
  const targetIds = parseTargetIds();
  runKirhaRunner(targetIds)
    .then(outputPath => {
      console.log(`Done! Output: ${outputPath}`);
    })
    .catch(error => {
      console.error('Failed to run Kirha runner:', error);
      process.exit(1);
    });
}

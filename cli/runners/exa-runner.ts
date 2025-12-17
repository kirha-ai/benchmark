import Exa from "exa-js";
import {
  loadPrompts,
  writeResults,
  parseTargetIds,
  type RunnerResult,
} from "./index";
import { summarizeResults } from "../summarizer";

const EXA_API_KEY = Bun.env.EXA_API_KEY;

if (!EXA_API_KEY) {
  throw new Error("EXA_API_KEY environment variable is required");
}

const exaClient = new Exa(EXA_API_KEY);

async function searchExa(prompt: string): Promise<string> {
  const response = await exaClient.searchAndContents(prompt, {
    type: "auto",
    numResults: 5,
  });

  return JSON.stringify(
    response.results.map((r) => {
      return {
        id: r.id,
        title: r.title,
        content: r.text,
      };
    }),
  );
}

export async function runExaRunner(
  targetIds?: Set<number> | null,
): Promise<string> {
  const prompts = await loadPrompts(targetIds);
  const results: RunnerResult[] = [];

  if (targetIds && targetIds.size > 0) {
    console.log(`Running Exa for IDs: ${[...targetIds].join(", ")}\n`);
  }

  for (const promptData of prompts) {
    console.log(
      `Processing prompt ${promptData.id}: ${promptData.prompt.slice(0, 50)}...`,
    );

    try {
      const rawResult = await searchExa(promptData.prompt);

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
        rawData: "",
        result: `Error: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  const outputPath = await writeResults("exa-result.jsonl", results, targetIds);
  console.log(`\nResults written to ${outputPath}`);

  return outputPath;
}

if (import.meta.main) {
  const targetIds = parseTargetIds();
  runExaRunner(targetIds)
    .then((outputPath) => {
      console.log(`Done! Output: ${outputPath}`);
    })
    .catch((error) => {
      console.error("Failed to run Exa runner:", error);
      process.exit(1);
    });
}

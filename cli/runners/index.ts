import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

export const DATA_DIR = join(import.meta.dir, '..', '..', 'data');
export const RESULTS_DIR = join(DATA_DIR, 'results');
export const PROMPTS_FILE = join(DATA_DIR, 'prompts.jsonl');

export interface Prompt {
  id: number;
  prompt: string;
  vertical: string;
}

export interface Source {
  title: string;
  url: string;
  publishedDate?: string;
}

export interface RunnerResult {
  id: number;
  prompt: string;
  rawData: string;
  result: string;
}

export function parseTargetIds(): Set<number> | null {
  const idsArg = process.argv[2];
  if (!idsArg) return null;

  const ids = new Set<number>();
  const parts = idsArg.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      // Range: "1-5"
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim(), 10));
      for (let i = start; i <= end; i++) {
        ids.add(i);
      }
    } else {
      ids.add(parseInt(trimmed, 10));
    }
  }

  return ids;
}

export async function loadPrompts(targetIds?: Set<number> | null): Promise<Prompt[]> {
  const file = Bun.file(PROMPTS_FILE);
  const content = await file.text();

  const prompts = content
    .trim()
    .split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line) as Prompt);

  if (targetIds && targetIds.size > 0) {
    return prompts.filter(p => targetIds.has(p.id));
  }

  return prompts;
}

export async function ensureResultsDir(): Promise<void> {
  await mkdir(RESULTS_DIR, { recursive: true });
}

export async function loadExistingResults(filename: string): Promise<Map<number, RunnerResult>> {
  const filepath = join(RESULTS_DIR, filename);
  const file = Bun.file(filepath);

  if (!(await file.exists())) {
    return new Map();
  }

  const content = await file.text();
  const results = new Map<number, RunnerResult>();

  for (const line of content.trim().split('\n')) {
    if (line.trim()) {
      const result = JSON.parse(line) as RunnerResult;
      results.set(result.id, result);
    }
  }

  return results;
}

export async function writeResults(filename: string, results: RunnerResult[], targetIds?: Set<number> | null): Promise<string> {
  await ensureResultsDir();
  const outputPath = join(RESULTS_DIR, filename);

  if (targetIds && targetIds.size > 0) {
    const existing = await loadExistingResults(filename);

    for (const result of results) {
      existing.set(result.id, result);
    }

    const jsonlContent = [...existing.values()]
      .sort((a, b) => a.id - b.id)
      .map(r => JSON.stringify(r))
      .join('\n');

    await Bun.write(outputPath, jsonlContent + '\n');
  } else {
    const jsonlContent = results
      .sort((a, b) => a.id - b.id)
      .map(r => JSON.stringify(r))
      .join('\n');

    await Bun.write(outputPath, jsonlContent + '\n');
  }

  return outputPath;
}

# Kirha Benchmark

An open-source benchmark comparing [Kirha](https://kirha.ai)'s domain-specific data enrichment APIs against standard web search.

**[View live results →](https://benchmark.kirha.com)**

## What is this?

This benchmark evaluates how well Kirha's specialized data integrations perform compared to generic web search for domain-specific queries. Kirha connects to real-time APIs while web search aggregates information from web pages.

**Domains tested:**

- **Company Data** — SEC filings, tenders, company search, patents, research papers
- **Crypto** — Token metrics, wallet analytics, DeFi protocols, NFTs
- **Insurance** — Flight delays, weather risk assessment

## How it works

```
EXA_API_KEY=your_exa_key
KIRHA_API_KEY=your_kirha_key
GEMINI_API_KEY=your_gemini_key
```

1. **Query Execution** — Each prompt runs against both Kirha and Exa web search in parallel
2. **Summarization** — Raw results are summarized by Gemini 2.5 Flash to normalize output format
3. **LLM-as-Judge** — Gemini 2.5 Flash (with extended thinking) scores each response on 5 criteria
4. **Scoring** — Winner determined by total score across all criteria

### Evaluation Criteria (0-100 each)

| Criteria          | Description                                    |
| ----------------- | ---------------------------------------------- |
| **Relevance**     | How well does the response address the query?  |
| **Accuracy**      | Is the information correct and verifiable?     |
| **Completeness**  | Does it cover all aspects of the request?      |
| **Freshness**     | Is the data current and up-to-date?            |
| **Actionability** | Can the user act on this information directly? |

## Project Structure

```
kirha-benchmark/
├── data/
│   ├── prompts.jsonl      # Benchmark queries
│   └── results/           # Raw results (JSONL)
├── app/                   # Web UI
├── cli/                   # Benchmark runner
│   ├── runners/           # Kirha & Exa runners
│   ├── llm-as-judge.ts    # Judge implementation
│   └── summarizer.ts      # Result summarization
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) runtime
- API keys for Kirha, Exa, and Gemini

### Setup

```bash
# Install all dependencies
bun run install:all

# Create CLI .env file in cli
```

### Running Benchmarks

From the project root:

```bash
# Run full evaluation on specific prompts
bun run eval 1,2,3

# Run a range of prompts
bun run eval 1-10

# Run only the judge (re-evaluate existing results)
bun run judge 1,2,3

# Run all prompts
bun run eval
```

### Viewing Results

```bash
# Start the web app
bun run app:dev
```

Open http://localhost:3000

### Docker

```bash
docker build -t kirha-benchmark .
docker run -p 3000:3000 kirha-benchmark
```

## Adding Prompts

Edit `data/prompts.jsonl`:

```json
{
  "id": 1,
  "prompt": "List Construction and Real Estate latest 10 tenders in France and Germany above 10m euros.",
  "vertical": "crypto"
}
```

Verticals: `company`, `crypto`, `insurance`, `cybersec`

## Results Format

Results are stored in `data/results/`:

| File                 | Description              |
| -------------------- | ------------------------ |
| `kirha-result.jsonl` | Kirha API raw responses  |
| `exa-result.jsonl`   | Web search raw responses |
| `judge-result.jsonl` | Scores and feedback      |

## Claude Cross-Review

To ensure benchmark accuracy, an independent cross-review was conducted by Claude (Opus 4.5). The review validated judge decisions and identified edge cases requiring investigation.

**Process:**

1. For each prompt, raw data and summaries from both Kirha and Exa were examined
2. Judge scores and winner decisions were validated against actual response quality
3. Inconsistencies between raw data and summaries were flagged
4. Edge cases where judge reasoning was questionable were documented

**Results:**

- 96 out of 100 judge decisions validated (~96% accuracy)
- 4 inconsistencies identified for investigation
- Patterns documented for when each system excels

**[View full cross-review report →](data/results/claude-review.md)**

## Methodology Notes

### On Judge Blinding

The judge prompt identifies responses as "Kirha" vs "Websearch" rather than using anonymous labels (e.g., "Response A" vs "Response B"). This is a pragmatic choice for v1:

- **Why not blind?** Full blinding would require manually annotating each prompt with source-agnostic evaluation criteria. For 100 prompts across different domains, this represents significant manual effort.
- **Why it's acceptable:** The quality gap between responses is typically objective and measurable—timestamps, data freshness, and completeness are verifiable regardless of source identity. The cross-review from Claude code confirmed ~96% of decisions are defensible based purely on response quality.
- **v2 improvement:** We plan to implement blinded evaluation in a future version, with manually curated evaluation guidelines per prompt category.

## License

MIT

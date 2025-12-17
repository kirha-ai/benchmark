import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = Bun.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function summarizeResults(
  query: string,
  rawResults: string,
): Promise<string> {
  const prompt = `You are a research assistant. Analyze these web search results and extract ONLY the specific data that answers the query.

# Context
Current date: ${new Date().toString()}

Query: ${query}

Search results:
${rawResults}

Instructions:
- Start with a brief of what is included in the result. Say if you are truncating some parts of the results.
- Extract concrete data points that answer the query (names, numbers, dates, specific items)
- If you see more data to enrich the answer, include it, you need to make a 360 explaination of the data retrieved
- If the search results contain actual data matching the query, list it in a structured format
- Include as much data as possible, but prioritize relevance and accuracy
- When you summarize a text, include as maximum relevant keywords and phrases that include the query keywords or respond to the query
- If date or timestamp is provided, include it in the response as much as possible
- If parameters are provided and add some context to the response include a small summary of the parameters
- When data is provided with date include it in the response as much as possible
- Be concise but detailed - max 7000 words`;

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.4,
      thinkingConfig: { thinkingBudget: -1 },
      maxOutputTokens: 100_000,
    },
  });

  return response.text ?? "";
}

export function Methodology() {
  return (
    <section className="mb-10 sm:mb-16 bg-background rounded-lg py-4 sm:py-6 px-4 sm:px-6 shadow-lg border">
      <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Methodology</h2>

      <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
        Datasets
      </h3>
      <div className="text-sm text-muted-foreground mb-6 sm:mb-8 space-y-3">
        <p>
          This benchmark compares Kirha against standard web search on
          domain-specific queries where Kirha has specialized knowledge
          integrations: <strong>Company Data</strong>,{" "}
          <strong>Insurance</strong>, and <strong>Crypto/Blockchain</strong>.
        </p>
        <p>
          Kirha uses web search as a fallback when it doesn't have
          domain-specific knowledge. This benchmark tests domains where Kirha's
          specialized integrations provide structured, accurate, and actionable
          data compared to generic web results.
        </p>
      </div>

      <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
        Evaluation Process
      </h3>
      <div className="text-sm text-muted-foreground mb-6 sm:mb-8 space-y-3">
        <p>
          Each query is executed in parallel against both Kirha and a standard
          web search. The raw results are then processed through a summarization
          step using <strong>Gemini 2.5 Flash</strong> to extract the most
          relevant information and normalize the output format.
        </p>
        <p>
          The summarized responses are evaluated using an{" "}
          <strong>LLM-as-Judge</strong> approach with
          <strong> Gemini 2.5 Flash</strong> and extended thinking enabled. The
          judge scores each response on 5 criteria (0-100) and determines a
          winner based on the total score.
        </p>
        <p>
          A common best practice with LLM-as-a-Judge is to{" "}
          <a
            href="https://huggingface.co/learn/cookbook/en/llm_judge"
            target="_blank"
            className="underline font-bold"
            rel="noopener"
          >
            cross-reference scores against human evaluation and aim for a high
            correlation
          </a>
          .<br />
          For this v1 we took a lighter approach: we asked Claude to review all
          results alongside their judge scores and flag inconsistencies.
          <br />
          Read the{" "}
          <a
            href="https://github.com/kirha-ai/benchmark/blob/main/data/results/claude-review.md"
            target="_blank"
            className="underline font-bold"
            rel="noopener"
          >
            full report
          </a>
          .
        </p>
      </div>

      <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">
        Evaluation Criteria
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-x-12 sm:gap-y-4 text-xs sm:text-sm">
        <div>
          <span className="font-medium">Relevance</span>
          <span className="text-muted-foreground">
            {" "}
            — How well does the response address the query?
          </span>
        </div>
        <div>
          <span className="font-medium">Accuracy</span>
          <span className="text-muted-foreground">
            {" "}
            — Is the information correct and verifiable?
          </span>
        </div>
        <div>
          <span className="font-medium">Completeness</span>
          <span className="text-muted-foreground">
            {" "}
            — Does it cover all aspects of the request?
          </span>
        </div>
        <div>
          <span className="font-medium">Freshness</span>
          <span className="text-muted-foreground">
            {" "}
            — Is the data current and up-to-date?
          </span>
        </div>
        <div>
          <span className="font-medium">Actionability</span>
          <span className="text-muted-foreground">
            {" "}
            — Can the user act on this information directly?
          </span>
        </div>
      </div>
    </section>
  );
}

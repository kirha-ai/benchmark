interface TokenComparisonProps {
  totalTests: number;
  kirhaTokens: number;
  websearchTokens: number;
  savingsPercent: number;
}

export function TokenComparison({
  totalTests,
  kirhaTokens,
  websearchTokens,
  savingsPercent,
}: TokenComparisonProps) {
  return (
    <div className="max-w-[500px] flex flex-col justify-center mb-16">
      <p className="text-lg text-muted-foreground mb-4">
        Across all <b>{totalTests} tests</b>, Kirha injected{" "}
        <span className="font-bold text-[#6366f1]">
          {kirhaTokens.toLocaleString()}
        </span>{" "}
        tokens into LLM context, compared to{" "}
        <span className="font-bold text-[#f97316]">
          {websearchTokens.toLocaleString()}
        </span>{" "}
        for Web Search.
      </p>
      <p className="text-lg sm:text-xl font-medium">
        Kirha uses{" "}
        <span className="text-[#6366f1] font-bold">{savingsPercent}% less</span>{" "}
        tokens.
      </p>
    </div>
  );
}

interface ScoreSummaryProps {
  kirhaScore: number;
  websearchScore: number;
}

export function ScoreSummary({
  kirhaScore,
  websearchScore,
}: ScoreSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:gap-12 mb-10 sm:mb-16">
      <div>
        <p className="mb-1 uppercase font-bold text-xs sm:text-sm">
          Kirha Score
        </p>
        <div className="flex items-baseline gap-1 sm:gap-3">
          <span className="text-3xl sm:text-5xl font-bold">{kirhaScore}</span>
          <span className="text-lg sm:text-2xl text-muted-foreground">
            /100
          </span>
        </div>
      </div>
      <div>
        <p className="text-muted-foreground mb-1 uppercase font-bold text-xs sm:text-sm">
          Web Search Score
        </p>
        <div className="flex items-baseline gap-1 sm:gap-3">
          <span className="text-3xl sm:text-5xl font-bold text-muted-foreground">
            {websearchScore}
          </span>
          <span className="text-lg sm:text-2xl text-muted-foreground">
            /100
          </span>
        </div>
      </div>
    </div>
  );
}

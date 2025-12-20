import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Code, Loader2 } from "lucide-react";
import {
  loadResultDetail,
  type BenchmarkResult,
  type ResultDetail,
  type SourceResult,
  type SourceDetail,
} from "@/lib/loadResults";

const categories = [
  "relevance",
  "accuracy",
  "completeness",
  "freshness",
  "actionability",
] as const;

const chartConfig = {
  kirha: { label: "Kirha", color: "#6366f1" },
  websearch: { label: "Web Search", color: "#f97316" },
} satisfies ChartConfig;

type Source = "kirha" | "websearch";

const sourceConfig = {
  kirha: { label: "Kirha", color: "#6366f1", rawDataTitle: "Kirha Raw Data" },
  websearch: {
    label: "Web Search",
    color: "#f97316",
    rawDataTitle: "Web Search Raw Data",
  },
} as const;

function SourceScoreCard({
  source,
  data,
  detail,
  isWinner,
  chartData,
}: {
  source: Source;
  data: SourceResult;
  detail: SourceDetail | null;
  isWinner: boolean;
  chartData: { category: string; kirha: number; websearch: number }[];
}) {
  const config = sourceConfig[source];
  const isKirha = source === "kirha";

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: config.color }}
        />
        <h3 className="font-semibold text-sm sm:text-base">{config.label}</h3>
        {isWinner && (
          <Badge className="text-xs" style={{ backgroundColor: config.color }}>
            Winner
          </Badge>
        )}
        <span className="ml-auto">
          <span
            className={`text-xl sm:text-2xl font-bold ${!isKirha ? "text-muted-foreground" : ""}`}
          >
            {data.score}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">/100</span>
        </span>
      </div>

      <ChartContainer config={chartConfig} className="h-40 sm:h-[180px] w-full">
        <RadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" fontSize={10} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={config.label}
            dataKey={source}
            stroke={config.color}
            fill={config.color}
            fillOpacity={0.3}
            isAnimationActive={false}
          />
          <ChartTooltip
            isAnimationActive={false}
            content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
          />
        </RadarChart>
      </ChartContainer>

      {detail ? (
        <p
          className="text-xs sm:text-sm text-muted-foreground mt-2 [&>i]:bg-green-500/20 [&>i]:text-green-700 dark:[&>i]:text-green-400 [&>i]:not-italic [&>i]:px-1 [&>i]:rounded [&>b]:bg-red-500/20 [&>b]:text-red-700 dark:[&>b]:text-red-400 [&>b]:font-normal [&>b]:px-1 [&>b]:rounded"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML is verified
          dangerouslySetInnerHTML={{ __html: detail.feedback }}
        />
      ) : (
        <div className="h-12 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Internal: Output Card
function SourceOutputCard({
  source,
  data,
  detail,
  onShowRawData,
}: {
  source: Source;
  data: SourceResult;
  detail: SourceDetail | null;
  onShowRawData: () => void;
}) {
  const config = sourceConfig[source];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-xs sm:text-sm">
          {config.label} Output
        </h4>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-xs cursor-pointer"
          onClick={onShowRawData}
          disabled={!detail}
        >
          <Code className="h-3 w-3 mr-1" />
          Raw data - <b>{data.tokens.toLocaleString()} tokens</b>
        </Button>
      </div>
      <div className="bg-muted/30 rounded-lg p-2 sm:p-3 h-[150px] sm:h-[200px] overflow-auto">
        {detail ? (
          <pre className="whitespace-pre-wrap font-mono text-[10px] sm:text-xs leading-relaxed">
            {detail.result}
          </pre>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

interface ResultDetailModalProps {
  result: BenchmarkResult | null;
  onClose: () => void;
  onShowRawData: (title: string, data: string) => void;
}

export function ResultDetailModal({
  result,
  onClose,
  onShowRawData,
}: ResultDetailModalProps) {
  const [detail, setDetail] = useState<ResultDetail | null>(null);

  useEffect(() => {
    if (result) {
      setDetail(null);
      loadResultDetail(result.id).then(setDetail);
    }
  }, [result]);

  if (!result) return null;

  const chartData = categories.map((cat) => ({
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    kirha: result.kirha[cat],
    websearch: result.websearch[cat],
  }));

  const handleShowRawData = (source: Source) => {
    if (!detail) return;
    const config = sourceConfig[source];
    onShowRawData(config.rawDataTitle, detail[source].rawData);
  };

  return (
    <Dialog open={!!result} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:w-full md:max-w-[1100px]! max-h-[95vh] sm:max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-2 sm:pb-4">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Query #{result.id}
            </p>
            {result.vertical && (
              <Badge variant="outline" className="px-1.5 py-0 capitalize">
                {result.vertical}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-base sm:text-xl font-semibold leading-tight">
            {result.prompt}
          </DialogTitle>
          {result.lastRunDate && (
            <p className="text-xs text-muted-foreground">
              Run on {result.lastRunDate}
            </p>
          )}
        </DialogHeader>

        <div className="px-0 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Score Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <SourceScoreCard
              source="kirha"
              data={result.kirha}
              detail={detail?.kirha ?? null}
              isWinner={result.winner === "kirha"}
              chartData={chartData}
            />
            <SourceScoreCard
              source="websearch"
              data={result.websearch}
              detail={detail?.websearch ?? null}
              isWinner={result.winner === "websearch"}
              chartData={chartData}
            />
          </div>

          <Separator />

          {/* Output Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            <SourceOutputCard
              source="kirha"
              data={result.kirha}
              detail={detail?.kirha ?? null}
              onShowRawData={() => handleShowRawData("kirha")}
            />
            <SourceOutputCard
              source="websearch"
              data={result.websearch}
              detail={detail?.websearch ?? null}
              onShowRawData={() => handleShowRawData("websearch")}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "../moneylost.mock";
import type { Confidence } from "../moneylost.types";

interface LossAreaCardProps {
  title: string;
  dailyUsd: number;
  monthlyUsd: number;
  annualUsd: number;
  recoverablePctRange: [number, number];
  confidence: Confidence;
  notes?: string;
}

const confidenceColors = {
  high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200", 
  low: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const confidenceLabels = {
  high: "High Confidence",
  medium: "Medium Confidence",
  low: "Low Confidence"
};

export function LossAreaCard({ 
  title, 
  dailyUsd, 
  monthlyUsd, 
  annualUsd, 
  recoverablePctRange, 
  confidence,
  notes 
}: LossAreaCardProps) {
  const [minPct, maxPct] = recoverablePctRange;
  const recoverableText = `${Math.round(minPct * 100)}–${Math.round(maxPct * 100)}%`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className={confidenceColors[confidence]}>
            {confidenceLabels[confidence]}
          </Badge>
        </div>
        {notes && (
          <p className="text-sm text-muted-foreground">{notes}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Daily:</span>
          <span className="text-sm font-semibold text-destructive">
            {formatCurrency(dailyUsd)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Monthly:</span>
          <span className="text-sm font-semibold text-destructive">
            {formatCurrency(monthlyUsd)}
          </span>
        </div>
        <div className="flex justify-between items-center border-t pt-2">
          <span className="text-sm font-medium">Annual:</span>
          <span className="text-base font-bold text-destructive">
            {formatCurrency(annualUsd)}
          </span>
        </div>
        <div className="border-t pt-2 text-center">
          <span className="text-xs text-muted-foreground">
            Estimated recoverable: {recoverableText}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
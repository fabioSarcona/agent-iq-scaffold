import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LossAreaCardProps {
  title: string;
  dailyUsd: number;
  monthlyUsd: number;
  annualUsd: number;
  recoverablePct: [number, number];
  severity: "low" | "medium" | "high" | "critical";
  rationale: string;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const severityColors = {
  low: "bg-accent text-accent-foreground",
  medium: "bg-secondary text-secondary-foreground",
  high: "bg-warning text-warning-foreground",
  critical: "bg-destructive text-destructive-foreground"
};

const severityLabels = {
  low: "Low Impact",
  medium: "Medium Impact", 
  high: "High Impact",
  critical: "Critical Impact"
};

export function LossAreaCard({ 
  title, 
  dailyUsd, 
  monthlyUsd, 
  annualUsd, 
  recoverablePct, 
  severity,
  rationale 
}: LossAreaCardProps) {
  const [min, max] = recoverablePct;
  const recoverableText = `${Math.round(min * 100)}–${Math.round(max * 100)}%`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <Badge variant="secondary" className={severityColors[severity]}>
            {severityLabels[severity]}
          </Badge>
        </div>
        {rationale && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">• {rationale}</p>
          </div>
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
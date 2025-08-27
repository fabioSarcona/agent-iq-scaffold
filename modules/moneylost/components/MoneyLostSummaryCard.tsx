import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "../moneylost";

interface MoneyLostSummaryCardProps {
  dailyUsd: number;
  monthlyUsd: number;
  annualUsd: number;
}

export function MoneyLostSummaryCard({ dailyUsd, monthlyUsd, annualUsd }: MoneyLostSummaryCardProps) {
  return (
    <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
      <CardHeader className="text-center">
        <div className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-10 w-10 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl text-primary-foreground">
          Total Estimated Revenue Loss
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium">Daily Loss (est.)</p>
            <p className="text-3xl font-bold text-primary-foreground">{formatCurrency(dailyUsd)}</p>
          </div>
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium">Monthly Loss (est.)</p>
            <p className="text-3xl font-bold text-primary-foreground">{formatCurrency(monthlyUsd)}</p>
          </div>
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium">Annual Loss (est.)</p>
            <p className="text-4xl font-bold text-primary-foreground">{formatCurrency(annualUsd)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
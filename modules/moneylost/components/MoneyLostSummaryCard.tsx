import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "./LossAreaCard";

interface MoneyLostSummaryCardProps {
  dailyUsd: number;
  monthlyUsd: number;
  annualUsd: number;
}

export function MoneyLostSummaryCard({ dailyUsd, monthlyUsd, annualUsd }: MoneyLostSummaryCardProps) {
  return (
    <Card className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0 shadow-lg">
      <CardHeader className="text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-10 w-10 text-white" />
        </div>
        <CardTitle className="text-2xl text-white font-bold drop-shadow-sm">
          Total Estimated Revenue Loss
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-white/90 text-sm font-semibold">Daily Loss (est.)</p>
            <p className="text-3xl font-bold text-white drop-shadow-sm">{formatCurrency(dailyUsd)}</p>
          </div>
          <div>
            <p className="text-white/90 text-sm font-semibold">Monthly Loss (est.)</p>
            <p className="text-3xl font-bold text-white drop-shadow-sm">{formatCurrency(monthlyUsd)}</p>
          </div>
          <div>
            <p className="text-white/90 text-sm font-semibold">Annual Loss (est.)</p>
            <p className="text-4xl font-bold text-white drop-shadow-sm">{formatCurrency(annualUsd)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
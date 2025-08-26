import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function DisclaimerNote() {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Conservative Estimates
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              These are conservative estimates based on your audit responses. Actual impact can vary by market, seasonality, and operations.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
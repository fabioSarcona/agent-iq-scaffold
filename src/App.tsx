import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayoutWithLogs } from "@/components/layout/AppLayoutWithLogs";
import Landing from "./pages/Landing";
import AuditDental from "./pages/AuditDental";
import AuditHVAC from "./pages/AuditHVAC";
import MoneyLost from "./pages/MoneyLost";
import Report from "./pages/Report";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <ThemeProvider defaultTheme="light" storageKey="needagent-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayoutWithLogs />}>
                <Route index element={<Landing />} />
                <Route path="audit/dental" element={<AuditDental />} />
                <Route path="audit/hvac" element={<AuditHVAC />} />
                <Route path="moneylost" element={<MoneyLost />} />
                <Route path="report" element={<Report />} />
                <Route path="admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;

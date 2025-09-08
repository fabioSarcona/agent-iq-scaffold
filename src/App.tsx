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
import SkillScopePage from "./pages/SkillScope";
import { DevConsole } from "./pages/DevConsole";
import { Billing } from "./pages/Billing";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000, retry: 2, refetchOnWindowFocus: false },
    mutations: { retry: 1 }
  }
});

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
                <Route path="billing" element={<Billing />} />
                <Route path="admin" element={<Admin />} />
                <Route path="skills/:id" element={<SkillScopePage />} />
                {process.env.NODE_ENV !== 'production' && <Route path="dev" element={<DevConsole />} />}
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

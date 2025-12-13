import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Beneficiaries from "./pages/Beneficiaries";
import EducationLevels from "./pages/EducationLevels";
import FinancialAid from "./pages/FinancialAid";
import Performance from "./pages/Performance";
import AcademicCalendar from "./pages/AcademicCalendar";
import Communication from "./pages/Communication";
import SystemSettings from "./pages/SystemSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/education" element={<EducationLevels />} />
          <Route path="/education/:level" element={<EducationLevels />} />
          <Route path="/financial-aid" element={<FinancialAid />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/calendar" element={<AcademicCalendar />} />
          <Route path="/communication" element={<Communication />} />
          <Route path="/settings" element={<SystemSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

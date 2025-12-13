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
// Admin pages
import AdminReceipts from "./pages/admin/AdminReceipts";
import AdminStatements from "./pages/admin/AdminStatements";
// Beneficiary Portal pages
import PortalDashboard from "./pages/portal/PortalDashboard";
import PortalDocuments from "./pages/portal/PortalDocuments";
import PortalUpload from "./pages/portal/PortalUpload";
import PortalStatements from "./pages/portal/PortalStatements";
import PortalReceipts from "./pages/portal/PortalReceipts";
import PortalAcademics from "./pages/portal/PortalAcademics";
import PortalMessages from "./pages/portal/PortalMessages";
import PortalProfile from "./pages/portal/PortalProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Admin Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/beneficiaries" element={<Beneficiaries />} />
          <Route path="/education" element={<EducationLevels />} />
          <Route path="/education/:level" element={<EducationLevels />} />
          <Route path="/financial-aid" element={<FinancialAid />} />
          <Route path="/admin/receipts" element={<AdminReceipts />} />
          <Route path="/admin/statements" element={<AdminStatements />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/calendar" element={<AcademicCalendar />} />
          <Route path="/communication" element={<Communication />} />
          <Route path="/settings" element={<SystemSettings />} />
          
          {/* Beneficiary Portal Routes */}
          <Route path="/portal" element={<PortalDashboard />} />
          <Route path="/portal/documents" element={<PortalDocuments />} />
          <Route path="/portal/upload" element={<PortalUpload />} />
          <Route path="/portal/statements" element={<PortalStatements />} />
          <Route path="/portal/receipts" element={<PortalReceipts />} />
          <Route path="/portal/academics" element={<PortalAcademics />} />
          <Route path="/portal/messages" element={<PortalMessages />} />
          <Route path="/portal/profile" element={<PortalProfile />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
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
        <AuthProvider>
          <Routes>
            {/* Auth Route */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Admin Routes - Protected */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/beneficiaries" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Beneficiaries />
              </ProtectedRoute>
            } />
            <Route path="/education" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EducationLevels />
              </ProtectedRoute>
            } />
            <Route path="/education/:level" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <EducationLevels />
              </ProtectedRoute>
            } />
            <Route path="/financial-aid" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <FinancialAid />
              </ProtectedRoute>
            } />
            <Route path="/admin/receipts" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReceipts />
              </ProtectedRoute>
            } />
            <Route path="/admin/statements" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminStatements />
              </ProtectedRoute>
            } />
            <Route path="/performance" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Performance />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AcademicCalendar />
              </ProtectedRoute>
            } />
            <Route path="/communication" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Communication />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemSettings />
              </ProtectedRoute>
            } />
            
            {/* Beneficiary Portal Routes - Protected */}
            <Route path="/portal" element={
              <ProtectedRoute allowedRoles={['beneficiary']}>
                <PortalDashboard />
              </ProtectedRoute>
            } />
            <Route path="/portal/documents" element={
              <ProtectedRoute allowedRoles={['beneficiary']}>
                <PortalDocuments />
              </ProtectedRoute>
            } />
            <Route path="/portal/upload" element={
              <ProtectedRoute allowedRoles={['beneficiary']}>
                <PortalUpload />
              </ProtectedRoute>
            } />
            <Route path="/portal/statements" element={
              <ProtectedRoute allowedRoles={['beneficiary']}>
                <PortalStatements />
              </ProtectedRoute>
            } />
            <Route path="/portal/receipts" element={
              <ProtectedRoute allowedRoles={['beneficiary']}>
                <PortalReceipts />
              </ProtectedRoute>
            } />
            <Route path="/portal/academics" element={
              <ProtectedRoute allowedRoles={['beneficiary']}>
                <PortalAcademics />
              </ProtectedRoute>
            } />
            <Route path="/portal/messages" element={
              <ProtectedRoute allowedRoles={['beneficiary']}>
                <PortalMessages />
              </ProtectedRoute>
            } />
            <Route path="/portal/profile" element={
              <ProtectedRoute allowedRoles={['beneficiary']}>
                <PortalProfile />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

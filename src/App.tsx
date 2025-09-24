import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import SchoolDashboard from "./pages/SchoolDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AttendanceScan from "./pages/AttendanceScan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="eduvate-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/school" element={<SchoolDashboard />} />
            <Route path="/school/:schoolId" element={<SchoolDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />
            <Route path="/teacher/:teacherId" element={<TeacherDashboard />} />
            <Route path="/attendance/:sessionCode" element={<AttendanceScan />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

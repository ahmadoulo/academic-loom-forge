import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/AdminDashboard";
import SchoolDashboard from "./pages/SchoolDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProfilePage from "./pages/ProfilePage";
import AttendanceScan from "./pages/AttendanceScan";
import StudentRegistration from "./pages/StudentRegistration";
import AccountActivation from "./pages/AccountActivation";
import SetPassword from "./pages/SetPassword";
import EventsPage from "./pages/EventsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import PublicAdmissionForm from "./pages/PublicAdmissionForm";
import TakeExam from "./pages/TakeExam";
import EventAttendanceScan from "./pages/EventAttendanceScan";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="eduvate-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Root: redirect to /admin (admins) or to /auth via ProtectedRoute redirect logic */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard" replace />
                  </ProtectedRoute>
                }
              />

              <Route path="/auth" element={<AuthPage />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRoles={['global_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/school"
                element={
                  <ProtectedRoute requiredRoles={['school_admin', 'global_admin']}>
                    <SchoolDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/school/:schoolId"
                element={
                  <ProtectedRoute requiredRoles={['school_admin', 'global_admin']}>
                    <SchoolDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="/school/:identifier/admission" element={<PublicAdmissionForm />} />

              <Route
                path="/teacher"
                element={
                  <ProtectedRoute requiredRoles={['teacher', 'global_admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/:teacherId"
                element={
                  <ProtectedRoute requiredRoles={['teacher', 'global_admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/student"
                element={
                  <ProtectedRoute requiredRoles={['student', 'global_admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/:studentId"
                element={
                  <ProtectedRoute requiredRoles={['student', 'global_admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute requiredRoles={['student', 'global_admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="/attendance/:sessionCode" element={<AttendanceScan />} />
              <Route path="/student-registration" element={<StudentRegistration />} />
              <Route path="/activate-account" element={<AccountActivation />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/exam/:examId" element={<TakeExam />} />
              <Route path="/event-attendance/:sessionCode" element={<EventAttendanceScan />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { StudioProvider } from "@/hooks/useStudio";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Lessons from "./pages/Lessons";
import CalendarPage from "./pages/CalendarPage";
import Repertoire from "./pages/Repertoire";
import Files from "./pages/Files";
import Auth from "./pages/Auth";
import ParentPortal from "./pages/ParentPortal";
import LessonRequest from "./pages/LessonRequest";
import AdminRequests from "./pages/AdminRequests";
import Signups from "./pages/Signups";
import SuperAdmin from "./pages/SuperAdmin";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import Messages from "./pages/Messages";
import Today from "./pages/Today";
import Settings from "./pages/Settings";
import Payments from "./pages/Payments";
import Classes from "./pages/Classes";
import ClassDetail from "./pages/ClassDetail";
import SessionMode from "./pages/SessionMode";
import AppLayout from "./components/AppLayout";
import VersionChecker from "./components/VersionChecker";
import PWAUpdateToast from "./components/PWAUpdateToast";
import SalesPage from "./pages/SalesPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StudioProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <VersionChecker />
          <PWAUpdateToast />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/parent" element={<ParentPortal />} />
              {/* Parent portal sub-routes */}
              <Route path="/p/home" element={<ParentPortal initialTab="home" />} />
              <Route path="/p/homework" element={<ParentPortal initialTab="homework" />} />
              <Route path="/p/files" element={<ParentPortal initialTab="files" />} />
              <Route path="/p/messages" element={<ParentPortal initialTab="messages" />} />
              <Route path="/request-lesson" element={<LessonRequest />} />
              <Route path="/requests" element={<AppLayout><AdminRequests /></AppLayout>} />
              <Route path="/signups" element={<AppLayout><Signups /></AppLayout>} />
              <Route path="/superadmin" element={<AppLayout><SuperAdmin /></AppLayout>} />
              <Route path="/today" element={<AppLayout><Today /></AppLayout>} />
              <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
              <Route path="/students" element={<AppLayout><Students /></AppLayout>} />
              <Route path="/lessons" element={<AppLayout><Lessons /></AppLayout>} />
              <Route path="/classes" element={<AppLayout><Classes /></AppLayout>} />
              <Route path="/classes/:classId" element={<AppLayout><ClassDetail /></AppLayout>} />
              {/* Session Mode — full-screen, no AppLayout chrome */}
              <Route path="/class-session/:sessionId" element={<SessionMode />} />
              <Route path="/calendar" element={<AppLayout><CalendarPage /></AppLayout>} />
              <Route path="/repertoire" element={<AppLayout><Repertoire /></AppLayout>} />
              <Route path="/files" element={<AppLayout><Files /></AppLayout>} />
              <Route path="/messages" element={<AppLayout><Messages /></AppLayout>} />
              <Route path="/payments" element={<AppLayout><Payments /></AppLayout>} />
              <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </StudioProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

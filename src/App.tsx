import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import VersionChecker from "./components/VersionChecker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <VersionChecker />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/parent" element={<ParentPortal />} />
            <Route path="/request-lesson" element={<LessonRequest />} />
            <Route path="/requests" element={<AppLayout><AdminRequests /></AppLayout>} />
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/students" element={<AppLayout><Students /></AppLayout>} />
            <Route path="/lessons" element={<AppLayout><Lessons /></AppLayout>} />
            <Route path="/calendar" element={<AppLayout><CalendarPage /></AppLayout>} />
            <Route path="/repertoire" element={<AppLayout><Repertoire /></AppLayout>} />
            <Route path="/files" element={<AppLayout><Files /></AppLayout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

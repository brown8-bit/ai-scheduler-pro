import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { DemoProvider } from "@/contexts/DemoContext";
import ScheddyLoader from "@/components/ScheddyLoader";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import DemoBanner from "@/components/DemoBanner";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

// Regular imports for most pages (no loading animation)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Contact from "./pages/Contact";
import Install from "./pages/Install";
import Analytics from "./pages/Analytics";
import BookingSettings from "./pages/BookingSettings";
import BookPage from "./pages/BookPage";
import CalendarPage from "./pages/Calendar";
import Templates from "./pages/Templates";

import Gamification from "./pages/Gamification";
import Progress from "./pages/Progress";
import Community from "./pages/Community";
import Profile from "./pages/Profile";
import AdminSettings from "./pages/AdminSettings";
import UserSettings from "./pages/UserSettings";
import Timer from "./pages/Timer";
import Clients from "./pages/Clients";
import Team from "./pages/Team";
import Invoices from "./pages/Invoices";
import VoiceNotes from "./pages/VoiceNotes";
import Tasks from "./pages/Tasks";
import Grades from "./pages/Grades";
import Referrals from "./pages/Referrals";
import Messages from "./pages/Messages";
import Discover from "./pages/Discover";
import DemoFocusBlocks from "./pages/DemoFocusBlocks";
import DemoAIScheduling from "./pages/DemoAIScheduling";
import NotFound from "./pages/NotFound";

// Only lazy load Chat page to show Scheddy loader
const Chat = lazy(() => import("./pages/Chat"));

const queryClient = new QueryClient();

const VisitorTracker = () => {
  useVisitorTracking();
  return null;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PresenceProvider>
          <DemoProvider>
            <TooltipProvider>
              <ThemeInitializer />
              <Toaster />
              <Sonner />
              <InstallPromptBanner />
              <BrowserRouter>
                <DemoBanner />
                <VisitorTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route 
                path="/chat" 
                element={
                  <Suspense fallback={<ScheddyLoader message="Scheddy is warming up..." />}>
                    <Chat />
                  </Suspense>
                } 
              />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/install" element={<Install />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/booking-settings" element={<BookingSettings />} />
              <Route path="/book/:slug" element={<BookPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/achievements" element={<Gamification />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin-settings" element={<AdminSettings />} />
              <Route path="/settings" element={<UserSettings />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/team" element={<Team />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/voice-notes" element={<VoiceNotes />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/demo/focus-blocks" element={<DemoFocusBlocks />} />
              <Route path="/demo/ai-scheduling" element={<DemoAIScheduling />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </DemoProvider>
        </PresenceProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

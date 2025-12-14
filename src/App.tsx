import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import ScheddyLoader from "@/components/ScheddyLoader";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Chat = lazy(() => import("./pages/Chat"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Admin = lazy(() => import("./pages/Admin"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Install = lazy(() => import("./pages/Install"));
const Analytics = lazy(() => import("./pages/Analytics"));
const BookingSettings = lazy(() => import("./pages/BookingSettings"));
const BookPage = lazy(() => import("./pages/BookPage"));
const CalendarPage = lazy(() => import("./pages/Calendar"));
const Templates = lazy(() => import("./pages/Templates"));
const FocusBlocks = lazy(() => import("./pages/FocusBlocks"));
const Gamification = lazy(() => import("./pages/Gamification"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const UserSettings = lazy(() => import("./pages/UserSettings"));
const Timer = lazy(() => import("./pages/Timer"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ThemeInitializer />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<ScheddyLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin-login" element={<AdminLogin />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/install" element={<Install />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/booking-settings" element={<BookingSettings />} />
                <Route path="/book/:slug" element={<BookPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/focus" element={<FocusBlocks />} />
                <Route path="/achievements" element={<Gamification />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/settings" element={<UserSettings />} />
                <Route path="/timer" element={<Timer />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;

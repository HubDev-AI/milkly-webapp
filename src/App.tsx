import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/Toaster";
import { Toaster as Sonner } from "@/components/ui/Sonner";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GuestRoute } from "@/components/GuestRoute";
import { MilkLoading } from "@/components/MilkLoading";
import { ThemeProvider } from "@/lib/theme";

import Login from "@/pages/Login";
import VerifyOtp from "@/pages/VerifyOtp";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const StreamFeed = lazy(() => import("@/pages/StreamFeed"));
const CreateStream = lazy(() => import("@/pages/CreateStream"));
const Newsletter = lazy(() => import("@/pages/Newsletter"));
const PublishedNewsletters = lazy(() => import("@/pages/PublishedNewsletters"));
const NewsletterSubscribers = lazy(() => import("@/pages/NewsletterSubscribers"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Subscription = lazy(() => import("@/pages/Subscription"));
const LinkedStreams = lazy(() => import("@/pages/LinkedStreams"));
const LinkedStreamFeed = lazy(() => import("@/pages/LinkedStreamFeed"));
const LinkedStreamNewsletter = lazy(() => import("@/pages/LinkedStreamNewsletter"));
const LinkedStreamPublished = lazy(() => import("@/pages/LinkedStreamPublished"));
const AccountSettings = lazy(() => import("@/pages/AccountSettings"));
const MediaLibrary = lazy(() => import("@/pages/MediaLibrary"));
const Templates = lazy(() => import("@/pages/Templates"));
const TemplateNew = lazy(() => import("@/pages/TemplateNew"));
const TemplateEdit = lazy(() => import("@/pages/TemplateEdit"));
const CheckoutSuccess = lazy(() => import("@/pages/CheckoutSuccess"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

import { DevThemeToggle } from "@/components/DevThemeToggle";
import { Agentation } from "agentation";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DevThemeToggle />
        <ErrorBoundary>
          <Suspense fallback={<MilkLoading />}>
          <Routes>
          {/* Guest routes (redirect to dashboard if authenticated) */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <GuestRoute>
                <VerifyOtp />
              </GuestRoute>
            }
          />

          {/* Protected routes (redirect to login if not authenticated) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/streams/new"
            element={
              <ProtectedRoute>
                <CreateStream />
              </ProtectedRoute>
            }
          />
          <Route
            path="/streams/:id"
            element={
              <ProtectedRoute>
                <StreamFeed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/streams/:id/edit"
            element={
              <ProtectedRoute>
                <CreateStream />
              </ProtectedRoute>
            }
          />
          <Route
            path="/streams/:id/newsletter/:newsletterId"
            element={
              <ProtectedRoute>
                <Newsletter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/streams/:id/newsletter/:newsletterId/subscribers"
            element={
              <ProtectedRoute>
                <NewsletterSubscribers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/streams/:id/published"
            element={
              <ProtectedRoute>
                <PublishedNewsletters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription"
            element={
              <ProtectedRoute>
                <Subscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/linked-streams"
            element={
              <ProtectedRoute>
                <LinkedStreams />
              </ProtectedRoute>
            }
          />
          <Route
            path="/linked-streams/:id"
            element={
              <ProtectedRoute>
                <LinkedStreamFeed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/linked-streams/:id/newsletter/:newsletterId"
            element={
              <ProtectedRoute>
                <LinkedStreamNewsletter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/linked-streams/:id/published"
            element={
              <ProtectedRoute>
                <LinkedStreamPublished />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/media"
            element={
              <ProtectedRoute>
                <MediaLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates/new"
            element={
              <ProtectedRoute>
                <TemplateNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates/:id"
            element={
              <ProtectedRoute>
                <TemplateEdit />
              </ProtectedRoute>
            }
          />

          {/* Public routes (accessible to both authenticated and guest users) */}
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/checkout/success"
            element={
              <ProtectedRoute>
                <CheckoutSuccess />
              </ProtectedRoute>
            }
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
    {import.meta.env.DEV && <Agentation />}
  </QueryClientProvider>
);

export default App;

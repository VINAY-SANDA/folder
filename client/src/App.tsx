import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CreateListing from "@/pages/create-listing";
import ListingDetail from "@/pages/listing-detail";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import SplashPage from "@/pages/splash-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import Header from "./components/layout/header";
import Footer from "./components/layout/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SplashPage} />
      <Route path="/home" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/create-listing" component={CreateListing} />
      <Route path="/listing/:id" component={ListingDetail} />
      <ProtectedRoute path="/messages" component={Messages} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location] = useLocation();
  
  // Don't show header/footer on splash page
  if (location === "/") {
    return (
      <main className="flex-grow">
        <Router />
      </main>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Router />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppLayout />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import DashboardLayout from "./components/DashboardLayout";
import LaunchGate from "./components/LaunchGate";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import News from "./pages/News";
import Community from "./pages/Community";
import Landing from "./pages/Landing";
import { appRoutes } from "./lib/appRoutes";

function WorkspaceRouter() {
  return (
    <LaunchGate>
      <DashboardLayout>
        <Switch>
          <Route path={appRoutes.journal} component={Home} />
          <Route path={appRoutes.calendar} component={News} />
          <Route path={appRoutes.community} component={Community} />
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    </LaunchGate>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={appRoutes.calendar} component={WorkspaceRouter} />
      <Route path={appRoutes.community} component={WorkspaceRouter} />
      <Route path={appRoutes.journal} component={WorkspaceRouter} />
      <Route path={appRoutes.landing} component={Landing} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

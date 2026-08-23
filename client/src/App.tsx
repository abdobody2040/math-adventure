import { useAuth } from "@/_core/hooks/useAuth";
import LandingPage from "@/pages/LandingPage";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
const AuthenticatedAdventure = lazy(() => import("./pages/Home"));

function StartupScreen() {
  return <div className="startup-screen" aria-live="polite"><span className="startup-orbit" /><p>Preparing your adventure…</p></div>;
}

function AppEntry() {
  const auth = useAuth();
  const { isAuthenticated } = auth;
  if (!isAuthenticated) return <LandingPage />;
  return <Suspense fallback={<StartupScreen />}><AuthenticatedAdventure auth={auth} /></Suspense>;
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <LocaleProvider>
          <AppEntry />
        </LocaleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

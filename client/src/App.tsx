import { useAuth } from "@/_core/hooks/useAuth";
import LandingPage from "@/pages/LandingPage";
import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import { useLocale } from "./contexts/LocaleContext";
const AuthenticatedAdventure = lazy(() => import("./pages/Home"));

function StartupScreen() {
  const { t } = useLocale();
  return <div className="skeleton-shell startup-skeleton" aria-live="polite"><header className="skeleton-header"><span className="skeleton-brand-mark" /><b>{t("brand.name")}</b><span className="skeleton-header-line" /></header><main className="skeleton-main"><section className="skeleton-welcome"><div><span className="skeleton-kicker" /><span className="skeleton-title" /><span className="skeleton-copy" /></div><span className="skeleton-orb" /></section><section className="skeleton-card-grid"><i /><i /><i /></section><p>{t("common.loading")}</p></main></div>;
}

function AppEntry() {
  const auth = useAuth();
  const { isAuthenticated } = auth;
  useEffect(() => { const timer = window.setTimeout(() => { void import("./pages/Home"); }, 400); return () => window.clearTimeout(timer); }, []);
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

import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import WorkspaceLoader from "./components/WorkspaceLoader";
const Examples = lazy(() => import("./pages/Examples"));
export default function App() {
  const [location] = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
    document.title =
      location === "/examples"
        ? "Try the automation playground — Problem2App"
        : "Problem2App — Your busywork. On autopilot.";
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute(
        "href",
        location === "/examples"
          ? "https://problem2app.shop/examples"
          : "https://problem2app.shop/"
      );
  }, [location]);
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <main
            className="container"
            style={{ paddingBlock: 80 }}
            role="status"
          >
            <WorkspaceLoader />
          </main>
        }
      >
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/examples" component={Examples} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

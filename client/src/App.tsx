import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import WorkspaceLoader from "./components/WorkspaceLoader";
const Examples = lazy(() => import("./pages/Examples"));
const About = lazy(() => import("./pages/About"));
export default function App() {
  const [location] = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
    document.title =
      location === "/examples"
        ? "Try the automation playground — Problem2App"
        : location === "/about"
          ? "About Prathamesh Chandak — Problem2App"
          : "Problem2App — Your busywork. On autopilot.";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      location === "/about"
        ? "A note from Prathamesh Chandak, founder of Problem2App, on building AI agents, automations and software that make everyday work easier."
        : "AI agents, automations, and custom software for growing teams. Try invoices, payroll, attendance, dashboards, and a warehouse sales-agent preview."
    );
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute(
        "href",
        location === "/examples"
          ? "https://problem2app.shop/examples"
          : location === "/about"
            ? "https://problem2app.shop/about"
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
          <Route path="/about" component={About} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

import { Component, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { contactEmail } from "@/lib/site";
export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error("Problem2App rendering error", error);
  }
  render() {
    if (this.state.hasError)
      return (
        <main className="not-found container">
          <p className="eyebrow">Something needs a fresh start.</p>
          <h1>Let's try again.</h1>
          <p>
            The page couldn't load. Please refresh, or contact{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a> if it keeps
            happening.
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => window.location.reload()}
          >
            <RotateCcw size={16} />
            Reload page
          </button>
        </main>
      );
    return this.props.children;
  }
}

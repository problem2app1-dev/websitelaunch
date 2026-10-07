import { ArrowRight } from "lucide-react";
import { Brand } from "./Home";
export default function NotFound() {
  return (
    <div className="not-found container">
      <Brand />
      <main>
        <p className="eyebrow">404 · Page not found</p>
        <h1>A small detour.</h1>
        <p>That page isn't here. Let's get you back to something useful.</p>
        <a className="button button-primary" href="/">
          Back to home <ArrowRight size={16} />
        </a>
      </main>
    </div>
  );
}

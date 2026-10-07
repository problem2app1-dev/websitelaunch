import { useEffect, useRef } from "react";
import {
  ArrowDown,
  Check,
  Inbox,
  Send,
  Sparkles,
  Workflow,
} from "lucide-react";

// One-time explanatory entrance. No WebGL, video, pointer tracking, or endless loop.
export default function AutomationScene() {
  const scene = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = scene.current;
    if (!node) return;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const setup = () => {
      observer?.disconnect();
      node.classList.remove("scene-enter");
      if (query.matches) return;
      observer = new IntersectionObserver(
        entries => {
          if (entries.some(entry => entry.isIntersecting)) {
            node.classList.add("scene-enter");
            observer?.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(node);
    };
    setup();
    query.addEventListener("change", setup);
    return () => {
      observer?.disconnect();
      query.removeEventListener("change", setup);
    };
  }, []);
  return (
    <div className="automation-scene" ref={scene}>
      <div className="scene-caption">
        <span className="status-dot" /> From a new lead to a next step
        <span>One connected flow</span>
      </div>
      <div className="scene-stage">
        <div className="scene-grid" aria-hidden="true" />
        <div className="scene-card scene-input">
          <span className="scene-icon">
            <Inbox size={22} />
          </span>
          <div>
            <small>01 · YOUR WEBSITE</small>
            <h3>New lead comes in.</h3>
            <p>No more copying details.</p>
          </div>
          <Check size={19} className="scene-check" />
        </div>
        <span className="scene-arrow">
          <ArrowDown size={22} />
        </span>
        <div className="scene-engine">
          <div className="engine-symbol">
            <Sparkles size={31} />
          </div>
          <div>
            <small>PROBLEM2APP</small>
            <h3>The next steps happen.</h3>
            <p>Sort the request. Update your tools.</p>
          </div>
          <span className="engine-corner">
            <Workflow size={22} />
          </span>
        </div>
        <span className="scene-arrow">
          <ArrowDown size={22} />
        </span>
        <div className="scene-card scene-output">
          <span className="scene-icon">
            <Send size={22} />
          </span>
          <div>
            <small>02 · YOUR TEAM</small>
            <h3>The right person is notified.</h3>
            <p>With the details they need.</p>
          </div>
          <Check size={19} className="scene-check" />
        </div>
      </div>
      <div className="scene-bottom">
        <ShieldMark />
        <span>
          Choose what runs automatically.
          <br />
          Keep approval where you need it.
        </span>
        <span className="scene-build-label">What we can build</span>
      </div>
    </div>
  );
}
function ShieldMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="21"
      height="21"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z" />
      <path d="m8 12 3 3 5-6" />
    </svg>
  );
}

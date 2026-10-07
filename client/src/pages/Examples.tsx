import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  FileText,
  Users,
  Fingerprint,
  BarChart3,
  Headphones,
  Check,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import { BookingLink, SiteLayout } from "@/components/SiteLayout";
import WorkspaceLoader from "@/components/WorkspaceLoader";
const InvoiceDemo = lazy(() =>
  import("@/components/demos/FinanceDemos").then(m => ({
    default: m.InvoiceDemo,
  }))
);
const PayrollDemo = lazy(() =>
  import("@/components/demos/FinanceDemos").then(m => ({
    default: m.PayrollDemo,
  }))
);
const AttendanceDemo = lazy(() =>
  import("@/components/demos/OperationsDemos").then(m => ({
    default: m.AttendanceDemo,
  }))
);
const DashboardDemo = lazy(() =>
  import("@/components/demos/OperationsDemos").then(m => ({
    default: m.DashboardDemo,
  }))
);
const VoiceDemo = lazy(() =>
  import("@/components/demos/OperationsDemos").then(m => ({
    default: m.VoiceDemo,
  }))
);
const demos = [
  {
    id: "invoice",
    title: "Invoices",
    caption: "Brief to beautiful PDF",
    icon: FileText,
    component: InvoiceDemo,
  },
  {
    id: "payroll",
    title: "Payroll",
    caption: "An easier payday",
    icon: Users,
    component: PayrollDemo,
  },
  {
    id: "voice",
    title: "Voice agent",
    caption: "Turn questions into orders",
    icon: Headphones,
    component: VoiceDemo,
  },
  {
    id: "dashboard",
    title: "Dashboard",
    caption: "Your numbers, in focus",
    icon: BarChart3,
    component: DashboardDemo,
  },
  {
    id: "attendance",
    title: "Attendance",
    caption: "Clock in. Carry on.",
    icon: Fingerprint,
    component: AttendanceDemo,
  },
];
function initialDemo(search: string) {
  const value = new URLSearchParams(search).get("demo");
  return demos.some(d => d.id === value) ? value! : "invoice";
}
export default function Examples() {
  const search = useSearch();
  const [active, setActive] = useState(() => initialDemo(search));
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => setActive(initialDemo(search)), [search]);
  const select = (id: string) => {
    setActive(id);
    window.history.replaceState(null, "", `/examples?demo=${id}`);
    if (window.scrollY > 250) {
      requestAnimationFrame(() =>
        panelRef.current?.scrollIntoView({
          block: "start",
          behavior: "instant",
        })
      );
    }
  };
  const Demo = demos.find(d => d.id === active)!.component;
  return (
    <SiteLayout>
      <div className="playground container">
        <div className="playground-intro">
          <Link href="/" className="back-link">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <div className="playground-title">
            <div>
              <p className="eyebrow">THE AUTOMATION PLAYGROUND</p>
              <h1>
                Less talk. <em>More try.</em>
              </h1>
            </div>
            <p>
              Working tools, sample data.{" "}
              <br />
              Make something you can actually take away.
            </p>
          </div>
        </div>
        <div className="demo-chooser" role="tablist" aria-label="Choose a demo">
          {demos.map((d, i) => (
            <button
              key={d.id}
              ref={el => {
                tabRefs.current[i] = el;
              }}
              id={`tab-${d.id}`}
              role="tab"
              type="button"
              className={`demo-choice demo-choice-${d.id}`}
              aria-label={d.title}
              aria-controls="demo-panel"
              aria-selected={active === d.id}
              tabIndex={active === d.id ? 0 : -1}
              onClick={() => select(d.id)}
              onKeyDown={e => {
                let next = i;
                if (e.key === "ArrowRight" || e.key === "ArrowDown")
                  next = (i + 1) % demos.length;
                else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
                  next = (i - 1 + demos.length) % demos.length;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = demos.length - 1;
                else return;
                e.preventDefault();
                select(demos[next].id);
                tabRefs.current[next]?.focus();
              }}
            >
              <span className="choice-art" aria-hidden="true">
                <span className="choice-backplate" />
                <span className="choice-icon">
                  <d.icon size={25} strokeWidth={1.6} />
                </span>
                <span className="choice-spark" />
              </span>
              <span className="choice-copy">
                <strong>{d.title}</strong>
                <small>{d.caption}</small>
              </span>
              <span className="choice-indicator" aria-hidden="true">
                {active === d.id ? (
                  <Check size={14} />
                ) : (
                  <ArrowUpRight size={14} />
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="playground-disclosure">
          <span>Interactive demos · sample data</span>
        </div>
        <section
          ref={panelRef}
          id="demo-panel"
          className="demo-panel"
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
        >
          <Suspense fallback={<WorkspaceLoader />}>
            <Demo key={active} />
          </Suspense>
        </section>
        <aside className="playground-cta">
          <div>
            <h2>Now imagine this with your tools.</h2>
            <p>
              We build the connections, rules and approvals around your
              business.
            </p>
          </div>
          <BookingLink>Make it yours</BookingLink>
        </aside>
      </div>
    </SiteLayout>
  );
}

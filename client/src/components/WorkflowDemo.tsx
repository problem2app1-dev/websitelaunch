import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  ArrowRight,
  Check,
  FileText,
  Inbox,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

export const scenarios = {
  fit: {
    label: "A clear fit",
    sender: "Jamie at Northstar",
    subject: "A better way to handle our leads",
    message:
      "Our inquiries arrive by email and through our website. We copy them into our CRM, then assign them manually. Can you help us connect those steps?",
    request: "Lead operations",
    context: "Inbox + website → CRM",
    route: "Sales operations",
    reason:
      "A defined workflow and known tools make this a suitable request for an initial discovery conversation.",
    draft:
      "Thanks for sharing the process. We can explore connecting inquiry capture, CRM updates, and assignment. Let's map your current workflow on a call.",
    status: "Ready for review",
    next: "Review the prepared response",
  },
  missing: {
    label: "Missing details",
    sender: "Alex at Fieldwork",
    subject: "Can you automate our admin?",
    message:
      "Our team spends too much time on admin. We'd like to automate it, but we're not sure where to start.",
    request: "Admin automation",
    context: "Tools and workflow not specified",
    route: "Discovery team",
    reason:
      "There isn't enough context to choose an integration. Ask about one repeated task and the tools involved before making a recommendation.",
    draft:
      "Happy to explore this. Which task does your team repeat most often, and which tools do you use for it? That will help us find a practical starting point.",
    status: "More context needed",
    next: "Review a clarification question",
  },
  review: {
    label: "Needs a specialist",
    sender: "Morgan at Cedar",
    subject: "Document routing with access controls",
    message:
      "We need to route documents between teams. Some contain sensitive business records, and access needs to depend on each person's role.",
    request: "Document routing",
    context: "Role-based access + sensitive data",
    route: "Technical discovery",
    reason:
      "Sensitive data and access controls need a specialist assessment. Don't assume a standard workflow is appropriate.",
    draft:
      "Before recommending a solution, we need to understand your data, access requirements, and existing systems. Our technical team should review the workflow with you.",
    status: "Specialist review required",
    next: "Review access and data requirements",
  },
} as const;
type Scenario = keyof typeof scenarios;
const steps = [
  {
    title: "Capture",
    icon: Inbox,
    detail: "Keep the original inquiry and its context together.",
  },
  {
    title: "Understand",
    icon: Sparkles,
    detail: "Extract useful details without filling in what's missing.",
  },
  {
    title: "Qualify",
    icon: ShieldCheck,
    detail: "Check the request against explicit routing rules.",
  },
  {
    title: "Route",
    icon: Workflow,
    detail: "Assign the request to the right review queue.",
  },
  {
    title: "Prepare",
    icon: FileText,
    detail: "Prepare a draft. Don't send it automatically.",
  },
  {
    title: "Review",
    icon: Check,
    detail: "A person decides what happens next.",
  },
];

export default function WorkflowDemo() {
  const [scenario, setScenario] = useState<Scenario>("fit");
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const data = scenarios[scenario];
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(query.matches);
      if (query.matches) setPlaying(false);
    };
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    if (!playing || reduced) return;
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    if (stage === 5) {
      setPlaying(false);
      return () => document.removeEventListener("visibilitychange", pause);
    }
    const timer = window.setTimeout(
      () => setStage(current => current + 1),
      1700
    );
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", pause);
    };
  }, [playing, stage, reduced]);
  function reset() {
    setStage(0);
    setPlaying(false);
  }
  function play() {
    if (reduced) {
      setStage(current => (current === 5 ? 0 : current + 1));
      return;
    }
    if (stage === 5) setStage(0);
    setPlaying(!playing);
  }
  function changeScenario(value: string) {
    setScenario(value as Scenario);
    reset();
  }
  const Icon = steps[stage].icon;
  return (
    <div className="demo-shell">
      <div className="demo-toolbar">
        <div className="demo-identity">
          <span className="demo-mark">
            <Workflow size={20} />
          </span>
          <div>
            <strong>Lead workflow</strong>
            <span>Interactive example · sample data</span>
          </div>
        </div>
        <div className="demo-controls">
          <button
            className="button button-small button-secondary"
            onClick={play}
            type="button"
            aria-label={
              reduced
                ? "Advance demo one step"
                : playing
                  ? "Pause demo"
                  : "Play demo"
            }
          >
            {reduced ? (
              <ArrowRight size={14} />
            ) : playing ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
            <span>
              {reduced ? "Step through" : playing ? "Pause" : "Play demo"}
            </span>
          </button>
          <button
            className="icon-button restart-button"
            type="button"
            onClick={reset}
            aria-label="Restart demo"
          >
            <RotateCcw size={17} />
          </button>
        </div>
      </div>
      <Tabs.Root value={scenario} onValueChange={changeScenario}>
        <Tabs.List
          className="scenario-tabs"
          aria-label="Choose an inquiry scenario"
        >
          {Object.entries(scenarios).map(([key, item]) => (
            <Tabs.Trigger key={key} value={key}>
              {item.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {Object.keys(scenarios).map(key => (
          <Tabs.Content value={key} key={key} className="scenario-panel">
            <div className="demo-body">
              <div className="demo-inquiry">
                <div className="panel-label">
                  <Inbox size={15} /> The inquiry
                </div>
                <div className="sender-avatar" aria-hidden="true">
                  {data.sender[0]}
                </div>
                <span className="inquiry-sender">{data.sender}</span>
                <h3>{data.subject}</h3>
                <p>{data.message}</p>
                <div className="sample-label">
                  Fictional company · sample message
                </div>
              </div>
              <div
                className="demo-processing"
                aria-live="polite"
                aria-atomic="true"
              >
                <div className="panel-label">
                  <Icon size={15} />
                  <span>Step {stage + 1} of 6</span>
                </div>
                <h3>{steps[stage].title}.</h3>
                <p className="step-description">{steps[stage].detail}</p>
                <div className="step-output">
                  {stage === 0 && (
                    <div className="capture-result">
                      <span className="result-icon">
                        <Check size={24} />
                      </span>
                      <h4>Inquiry captured.</h4>
                      <p>
                        The original message is available for the team to
                        review.
                      </p>
                      <span className="output-tag">
                        No details lost between tools
                      </span>
                    </div>
                  )}
                  {stage === 1 && (
                    <dl className="extracted-fields">
                      <div>
                        <dt>Request</dt>
                        <dd>{data.request}</dd>
                      </div>
                      <div>
                        <dt>Context</dt>
                        <dd>{data.context}</dd>
                      </div>
                      <div>
                        <dt>Source</dt>
                        <dd>Email inquiry</dd>
                      </div>
                    </dl>
                  )}
                  {stage === 2 && (
                    <div className="rule-result">
                      <span className={`output-tag tone-${scenario}`}>
                        {data.status}
                      </span>
                      <h4>The reason matters.</h4>
                      <p>{data.reason}</p>
                    </div>
                  )}
                  {stage === 3 && (
                    <div className="route-result">
                      <span className="result-icon">
                        <Workflow size={24} />
                      </span>
                      <span className="muted-small">Assigned review queue</span>
                      <h4>{data.route}</h4>
                      <p>The inquiry travels with its original context.</p>
                    </div>
                  )}
                  {stage === 4 && (
                    <div className="draft-result">
                      <span className="draft-label">
                        <FileText size={14} /> Draft response
                      </span>
                      <p>{data.draft}</p>
                      <span className="draft-note">
                        <ShieldCheck size={14} /> Prepared only. Nothing has
                        been sent.
                      </span>
                    </div>
                  )}
                  {stage === 5 && (
                    <div className="review-result">
                      <span className={`output-tag tone-${scenario}`}>
                        {data.status}
                      </span>
                      <h4>{data.next}.</h4>
                      <p>{data.draft}</p>
                      <div className="review-owner">
                        <ShieldCheck size={16} />
                        <span>{data.route} · human approval</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tabs.Content>
        ))}
      </Tabs.Root>
      <div className="demo-progress" aria-label="Workflow steps">
        {steps.map(({ title, icon: StepIcon }, index) => (
          <button
            key={title}
            type="button"
            className={`progress-step ${index === stage ? "current" : ""} ${index < stage ? "complete" : ""}`}
            onClick={() => {
              setPlaying(false);
              setStage(index);
            }}
            aria-current={index === stage ? "step" : undefined}
          >
            <span>
              {index < stage ? <Check size={15} /> : <StepIcon size={15} />}
            </span>
            <span>{title}</span>
          </button>
        ))}
      </div>
      <div className="demo-bottom">
        <span>
          <ShieldCheck size={15} /> A person approves the next step.
        </span>
        <button
          type="button"
          className="text-link"
          disabled={stage === 5}
          onClick={() => {
            setPlaying(false);
            setStage(current => Math.min(5, current + 1));
          }}
        >
          Next step <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

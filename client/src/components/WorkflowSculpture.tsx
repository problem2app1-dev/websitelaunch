import {
  ArrowDown,
  ArrowRight,
  Check,
  Command,
  Mail,
  Sparkles,
} from "lucide-react";
export default function WorkflowSculpture() {
  return (
    <div
      className="workflow-sculpture"
      aria-label="Illustration: a new enquiry becomes a contact, a reply draft, and a team update"
    >
      <div className="sculpture-grid" aria-hidden="true" />
      <div className="sculpture-label">
        <span className="status-dot" /> THE WORK BETWEEN YOUR TOOLS. HANDLED.
      </div>
      <div className="sculpture-path">
        <div className="glass input-node">
          <span className="node-icon">
            <Mail size={20} />
          </span>
          <div>
            <span className="micro">NEW ENQUIRY</span>
            <strong>“Let's work together.”</strong>
            <small>From your website</small>
          </div>
        </div>
        <span className="flow-arrow">
          <ArrowRight size={22} />
          <ArrowDown size={20} />
        </span>
        <div className="core-wrap">
          <div className="core-halo" />
          <div className="automation-core">
            <Command size={35} strokeWidth={1.3} />
          </div>
          <span>Your workflow</span>
        </div>
        <span className="flow-arrow">
          <ArrowRight size={22} />
          <ArrowDown size={20} />
        </span>
        <div className="glass output-node">
          <div className="output-title">
            <Sparkles size={15} /> Ready for your team
          </div>
          {["Contact organised", "Reply drafted", "Next step assigned"].map(
            s => (
              <div className="output-row" key={s}>
                <Check size={14} />
                {s}
              </div>
            )
          )}
        </div>
      </div>
      <div className="sculpture-bottom">
        <span>One trigger. Every next step.</span>
        <span className="small-tag">WORKFLOW PREVIEW</span>
      </div>
    </div>
  );
}

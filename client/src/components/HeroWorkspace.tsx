import {
  ArrowUpRight,
  Check,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { BrandLogo } from "./BrandLogo";
export default function HeroWorkspace() {
  return (
    <Link
      href="/examples?demo=invoice"
      className="hero-workspace"
      aria-label="Try the interactive invoice builder"
    >
      <div className="workspace-orbit orbit-one" aria-hidden="true" />
      <div className="workspace-orbit orbit-two" aria-hidden="true" />
      <div className="hero-window">
        <div className="hero-window-bar">
          <span>
            <i />
            <i />
            <i />
          </span>
          <span>YOUR BUSINESS, CONNECTED</span>
          <ShieldCheck size={15} />
        </div>
        <div className="hero-window-body">
          <div className="workflow-caption">
            <span className="surface-icon">
              <Sparkles size={18} />
            </span>
            <div>
              <strong>From busywork to done.</strong>
              <span>One connected workflow</span>
            </div>
            <span className="preview-pill">PREVIEW</span>
          </div>
          <div className="hero-invoice">
            <div className="invoice-label">
              <span>INVOICE</span>
              <span>01 / SAMPLE</span>
            </div>
            <div className="invoice-title">
              <div>
                <span>Prepared for</span>
                <strong>Your next client</strong>
              </div>
              <FileText size={27} />
            </div>
            <div className="invoice-line">
              <span>Design & development</span>
              <b>$2,400.00</b>
            </div>
            <div className="invoice-line">
              <span>Workflow setup</span>
              <b>$600.00</b>
            </div>
            <div className="invoice-total">
              <span>Total due</span>
              <strong>
                $3,000<span>.00</span>
              </strong>
            </div>
            <div className="invoice-foot">
              <span>
                <Check size={13} /> Branded PDF
              </span>
              <span>Ready to review</span>
            </div>
          </div>
          <div className="hero-route">
            <span>
              <FileText size={17} /> Create
            </span>
            <i />
            <span>
              <Check size={17} /> Review
            </span>
            <i />
            <span>
              <BrandLogo name="gmail" size={19} /> Send
            </span>
          </div>
        </div>
      </div>
      <div className="hero-float">
        <span className="float-icon">
          <FileText size={18} />
        </span>
        <div>
          <strong>Don't just watch. Try it.</strong>
          <span>Edit, calculate & download a real PDF</span>
        </div>
        <ArrowUpRight size={20} />
      </div>
    </Link>
  );
}

import { FileText, Sparkles, Check } from "lucide-react";
export default function WorkspaceLoader({
  label = "Opening your workspace…",
}: {
  label?: string;
}) {
  return (
    <div className="workspace-loader" role="status" aria-live="polite">
      <div className="loader-art" aria-hidden="true">
        <span>
          <FileText size={24} />
        </span>
        <i />
        <span>
          <Sparkles size={24} />
        </span>
        <i />
        <span>
          <Check size={24} />
        </span>
      </div>
      <p>{label}</p>
    </div>
  );
}

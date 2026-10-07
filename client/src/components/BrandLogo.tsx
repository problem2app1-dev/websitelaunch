export type BrandName =
  | "notion"
  | "slack"
  | "hubspot"
  | "gmail"
  | "shopify"
  | "stripe";
const names: Record<BrandName, string> = {
  notion: "Notion",
  slack: "Slack",
  hubspot: "HubSpot",
  gmail: "Gmail",
  shopify: "Shopify",
  stripe: "Stripe",
};
export function BrandLogo({
  name,
  size = 24,
  label = false,
}: {
  name: BrandName;
  size?: number;
  label?: boolean;
}) {
  return (
    <span className="tool-brand">
      <img
        src={`/logos/${name}.svg`}
        width={size}
        height={size}
        alt={label ? "" : names[name]}
        loading="lazy"
        decoding="async"
      />
      {label && <span>{names[name]}</span>}
    </span>
  );
}
export function ToolLogos() {
  return (
    <div className="tools-strip">
      <p>Built around the tools you already use.</p>
      <div className="tools-grid">
        {(
          [
            "notion",
            "slack",
            "hubspot",
            "gmail",
            "shopify",
            "stripe",
          ] as BrandName[]
        ).map(name => (
          <BrandLogo key={name} name={name} size={25} label />
        ))}
      </div>
    </div>
  );
}

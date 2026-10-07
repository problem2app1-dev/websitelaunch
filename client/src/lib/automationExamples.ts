export type DemoKind = "leads" | "onboarding" | "support";
export type DemoResult = {
  title: string;
  summary: string;
  steps: string[];
  records: { label: string; value: string }[];
  draft?: string;
  tasks?: string[];
  review: boolean;
};
export const knowledge = {
  invite: {
    question: "How do I invite a teammate?",
    answer:
      "Open Settings → Team → Invite member. Enter their email and choose a role, then select Send invite.",
    source: "Getting started → Invite your team",
  },
  export: {
    question: "Can I export my data?",
    answer:
      "Open Settings → Data → Export. Choose CSV, then select Download. Only a workspace admin can export data.",
    source: "Workspace guide → Export data",
  },
  refund: {
    question: "Can I get a refund?",
    answer:
      "This request needs a person to check the account and the applicable policy. It should not receive an automatic promise.",
    source: "No approved refund answer",
  },
} as const;
export function buildLead(
  name: string,
  company: string,
  size: string
): DemoResult {
  const owner = size === "small" ? "Founder" : "Sales team";
  return {
    title: "A new lead. Ready for a follow-up.",
    summary:
      "The details are saved, the owner is set, and a reply is ready to review.",
    steps: [
      "Read the form",
      "Save contact details",
      "Choose the owner",
      "Prepare a reply",
    ],
    records: [
      { label: "Contact", value: name.trim() },
      { label: "Company", value: company.trim() },
      {
        label: "Team size",
        value: size === "small" ? "1–10" : size === "medium" ? "11–50" : "51+",
      },
      { label: "Follow-up owner", value: owner },
    ],
    draft: `Hi ${name.trim()}, thanks for reaching out from ${company.trim()}. We'd love to hear what you're building and what you need help with. Could we arrange a quick call to learn more?`,
    review: true,
  };
}
export function buildOnboarding(name: string, service: string): DemoResult {
  const tasks =
    service === "website"
      ? [
          "Collect brand files",
          "Confirm pages and content",
          "Arrange the kickoff call",
        ]
      : [
          "List the tools in use",
          "Map the repeated task",
          "Choose who approves actions",
        ];
  return {
    title: "A new client. A clear starting point.",
    summary:
      "A project, checklist, and welcome draft are ready—without starting from a blank page.",
    steps: [
      "Read the client details",
      "Create a project",
      "Make the checklist",
      "Prepare the welcome email",
    ],
    records: [
      {
        label: "Project",
        value: `${name.trim()} · ${service === "website" ? "Website" : "Automation"}`,
      },
      { label: "Client folder", value: `Clients / ${name.trim()}` },
      { label: "Status", value: "Waiting for kickoff" },
    ],
    tasks,
    draft: `Welcome, ${name.trim()}! We're excited to get started. We've prepared your project checklist. Next, let's arrange a kickoff call and collect the details we need.`,
    review: true,
  };
}
export function buildSupport(question: keyof typeof knowledge): DemoResult {
  const item = knowledge[question];
  const review = question === "refund";
  return {
    title: review
      ? "This one needs a person."
      : "A useful answer. Ready to review.",
    summary: review
      ? "No made-up promise. The request goes to the support team."
      : "The draft uses the fictional product's help guide, with its source shown.",
    steps: [
      "Read the question",
      "Check the help guide",
      review ? "Flag for a person" : "Find the approved answer",
      "Prepare the next step",
    ],
    records: [
      { label: "Question", value: item.question },
      { label: "Source", value: item.source },
      {
        label: "Next step",
        value: review ? "Support team review" : "Check the draft reply",
      },
    ],
    draft: review
      ? "Thanks for reaching out. Our support team will review your account and refund request before confirming the next step."
      : item.answer,
    review: true,
  };
}

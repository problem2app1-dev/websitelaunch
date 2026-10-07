export type CaseId = "leads" | "onboarding" | "support";
export type WorkItem = {
  id: string;
  name: string;
  subject: string;
  detail: string;
  email?: string;
  budget?: number;
  signed?: boolean;
  paid?: boolean;
  issue?: "tracking" | "delay" | "refund" | "unknown";
};
export type WorkResult = {
  id: string;
  status: string;
  tone: "success" | "review" | "muted";
  reason: string;
  actions: string[];
  output: { label: string; text: string }[];
};
export const cases: Record<
  CaseId,
  {
    label: string;
    company: string;
    industry: string;
    title: string;
    description: string;
    problem: string;
    outcome: string;
    tools: string[];
    items: WorkItem[];
  }
> = {
  leads: {
    label: "Sales inbox",
    company: "Northstar Studio",
    industry: "Creative agency",
    title: "Good leads shouldn't get lost in your inbox.",
    description:
      "Sort new enquiries, spot duplicates, and prepare the right follow-up for each person.",
    problem:
      "Every enquiry needs reading, copying, checking, and a different reply.",
    outcome:
      "A clean pipeline, ready-to-review replies, and a clear next step for every lead.",
    tools: ["Website", "HubSpot", "Gmail"],
    items: [
      {
        id: "L-01",
        name: "Aisha Rao",
        email: "aisha@example.com",
        subject: "Brand & website launch",
        budget: 12000,
        detail:
          "We're launching a new skincare brand next month. We need a brand identity and a Shopify store. Budget: $12,000.",
      },
      {
        id: "L-02",
        name: "Ben Carter",
        email: "ben@example.com",
        subject: "A landing page for my idea",
        budget: 1800,
        detail:
          "I'm testing a new idea and need a simple landing page. I have $1,800 to start with.",
      },
      {
        id: "L-03",
        name: "Nina Park",
        email: "nina@example.com",
        subject: "Website for our growing team",
        budget: 7500,
        detail:
          "Our current website is holding us back. We'd like to discuss a rebuild with a budget of $7,500.",
      },
      {
        id: "L-04",
        name: "Aisha Rao",
        email: "aisha@example.com",
        subject: "One more thing about the launch",
        budget: 12000,
        detail:
          "Following up on my earlier enquiry: can we also discuss a product photography page?",
      },
    ],
  },
  onboarding: {
    label: "Client kickoff",
    company: "Forma Digital",
    industry: "Service business",
    title: "Deal signed. Project ready. Zero copy-paste.",
    description:
      "Check the contract and deposit, then prepare the project, kickoff checklist, and welcome pack.",
    problem:
      "A signed deal still means folders, project boards, payment checks, and welcome emails.",
    outcome:
      "Paid clients move to kickoff. Missing payments or signatures stay visible.",
    tools: ["Stripe", "Notion", "Google Drive"],
    items: [
      {
        id: "C-01",
        name: "Bloom Coffee",
        subject: "Online store build",
        signed: true,
        paid: true,
        detail:
          "A new Shopify store for a local coffee brand. Contract signed; the first deposit has cleared.",
      },
      {
        id: "C-02",
        name: "Arlo Interiors",
        subject: "Brand & website",
        signed: true,
        paid: false,
        detail:
          "A brand refresh and portfolio website. The contract is signed, but the deposit is still outstanding.",
      },
      {
        id: "C-03",
        name: "Fieldwork",
        subject: "Customer portal",
        signed: false,
        paid: true,
        detail:
          "A customer portal for a growing services team. Deposit received; the contract needs a signature.",
      },
      {
        id: "C-04",
        name: "June Studio",
        subject: "Booking website",
        signed: true,
        paid: true,
        detail:
          "A booking website for a creative studio. Contract signed and deposit received. Ready for kickoff.",
      },
    ],
  },
  support: {
    label: "Order support",
    company: "Everyday Goods",
    industry: "Online store",
    title: "An inbox full of questions. A plan for each.",
    description:
      "Match order questions to the right information, draft replies, and flag the cases that need a person.",
    problem:
      "The team looks up orders and repeats the same answers while urgent requests wait.",
    outcome:
      "Routine replies are ready. Delays, refunds, and unknown questions have an owner.",
    tools: ["Shopify", "Gmail", "Slack"],
    items: [
      {
        id: "T-01",
        name: "Sophie",
        subject: "Where is order #1042?",
        issue: "tracking",
        detail:
          "Can you tell me where my order is? Sample order #1042: dispatched, expected tomorrow; tracking is available.",
      },
      {
        id: "T-02",
        name: "Omar",
        subject: "My delivery is late",
        issue: "delay",
        detail:
          "My parcel should have arrived two days ago. Sample order #1043: carrier delay, no revised delivery date.",
      },
      {
        id: "T-03",
        name: "Maya",
        subject: "I'd like a refund",
        issue: "refund",
        detail:
          "My order arrived damaged. I'd like a refund. Sample order #1044: delivered yesterday; photo attached in the sample record.",
      },
      {
        id: "T-04",
        name: "Leo",
        subject: "A custom wholesale order",
        issue: "unknown",
        detail:
          "Could you create a custom bundle of 250 items with our company logo? The sample help guide has no wholesale policy.",
      },
    ],
  },
};
export function runWorkflow(
  kind: CaseId,
  items: WorkItem[],
  minimumBudget = 5000
): WorkResult[] {
  const seen = new Set<string>();
  return items.map(item => {
    if (kind === "leads") {
      const email = (item.email ?? "").trim().toLowerCase();
      if (email && seen.has(email))
        return {
          id: item.id,
          status: "Duplicate merged",
          tone: "muted",
          reason:
            "The email matches an earlier enquiry. Keep one contact and attach this note.",
          actions: ["Find existing contact", "Attach follow-up note"],
          output: [
            {
              label: "Contact update",
              text: `${item.name}'s existing record gets the extra message. No second contact or reply is created.`,
            },
          ],
        };
      if (email) seen.add(email);
      if (!email || item.budget == null)
        return {
          id: item.id,
          status: "Needs details",
          tone: "review",
          reason:
            "Missing contact or budget details. A person should check this enquiry.",
          actions: ["Flag missing details"],
          output: [
            {
              label: "Task",
              text: "Ask for the missing details before qualifying this lead.",
            },
          ],
        };
      const qualified = item.budget >= minimumBudget;
      return {
        id: item.id,
        status: qualified ? "Call-ready lead" : "Nurture follow-up",
        tone: qualified ? "success" : "review",
        reason: qualified
          ? `The $${item.budget.toLocaleString("en-US")} budget meets your $${minimumBudget.toLocaleString("en-US")} minimum.`
          : "The budget is below your project minimum. Keep the relationship warm.",
        actions: [
          "Create one contact",
          qualified ? "Assign a discovery call" : "Add to nurture pipeline",
          "Prepare a personal reply",
        ],
        output: [
          {
            label: "Pipeline record",
            text: `${item.name} · ${item.subject} · $${item.budget.toLocaleString("en-US")} · ${qualified ? "Discovery" : "Nurture"}`,
          },
          {
            label: "Email draft",
            text: qualified
              ? `Hi ${item.name.split(" ")[0]}, thanks for sharing your plans for ${item.subject.toLowerCase()}. This looks like a good fit for a discovery call. What would work for you this week?`
              : `Hi ${item.name.split(" ")[0]}, thanks for reaching out. Your current budget is below our starting scope, but we can explore a smaller first step. Would a focused landing page discussion help?`,
          },
        ],
      };
    }
    if (kind === "onboarding") {
      if (!item.signed || !item.paid) {
        const missing = [
          !item.signed && "signed contract",
          !item.paid && "cleared deposit",
        ]
          .filter(Boolean)
          .join(" and ");
        return {
          id: item.id,
          status: !item.signed ? "Signature needed" : "Deposit needed",
          tone: "review",
          reason: `Waiting for a ${missing}. Project setup stays on hold.`,
          actions: ["Check contract and payment", "Create follow-up task"],
          output: [
            {
              label: "Follow-up draft",
              text: `Hi ${item.name} team, we're looking forward to starting ${item.subject.toLowerCase()}. We still need the ${missing} before kickoff. Let us know if you need a hand.`,
            },
          ],
        };
      }
      return {
        id: item.id,
        status: "Ready for kickoff",
        tone: "success",
        reason: "The contract and cleared deposit are both confirmed.",
        actions: [
          "Confirm contract and deposit",
          "Prepare project board",
          "Prepare shared folder",
          "Create kickoff checklist",
          "Draft welcome email",
        ],
        output: [
          {
            label: "Project board",
            text: `${item.name} / ${item.subject} — owner: Delivery team; stage: Kickoff.`,
          },
          {
            label: "Kickoff checklist",
            text: "Collect brand assets → confirm scope → request tool access → book kickoff → agree milestones.",
          },
          {
            label: "Welcome draft",
            text: `Welcome aboard, ${item.name}! We've received your signed contract and deposit. Your next step is to share your brand assets and choose a kickoff time. Your project: ${item.subject}.`,
          },
        ],
      };
    }
    if (item.issue === "tracking")
      return {
        id: item.id,
        status: "Reply ready",
        tone: "success",
        reason:
          "The order has a confirmed dispatch status and delivery estimate.",
        actions: [
          "Match order #1042",
          "Read shipping status",
          "Draft tracking reply",
        ],
        output: [
          {
            label: "Source",
            text: "Sample order #1042 · dispatched · estimated delivery: tomorrow.",
          },
          {
            label: "Reply draft",
            text: "Hi Sophie, your order #1042 is on its way and is expected tomorrow. You can find the tracking link in your dispatch email. Let us know if it hasn't arrived after the estimated date.",
          },
        ],
      };
    const refund = item.issue === "refund";
    const delay = item.issue === "delay";
    return {
      id: item.id,
      status: refund
        ? "Refund review"
        : delay
          ? "Delivery check"
          : "Team review",
      tone: "review",
      reason: refund
        ? "Refunds need a team decision. No money is moved."
        : delay
          ? "There is no confirmed new delivery date. Don't invent one."
          : "No approved answer exists for this request.",
      actions: [
        "Match customer request",
        "Assign a team owner",
        "Prepare handoff note",
      ],
      output: [
        {
          label: "Team task",
          text: refund
            ? "Review order #1044 and the damage evidence. Confirm eligibility before approving a refund."
            : delay
              ? "Ask the carrier about order #1043 and update the customer when a date is confirmed."
              : "Ask the sales team whether a custom 250-item wholesale order can be fulfilled.",
        },
        {
          label: "Reply draft",
          text: refund
            ? "Hi Maya, I'm sorry your order arrived damaged. I've prepared the details for our team to review your refund request. They'll confirm the next steps."
            : delay
              ? "Hi Omar, I'm sorry your parcel is late. The carrier has reported a delay, and we're checking for an updated delivery date. We'll share it as soon as it's confirmed."
              : "Hi Leo, thanks for the custom order request. I'll pass the details to our team so they can check options and get back to you.",
        },
      ],
    };
  });
}
export function workflowBrief(kind: CaseId, results: WorkResult[]): string {
  const item = cases[kind];
  return `# ${item.label} — Problem2App sample workflow\n\nFictional scenario: ${item.company}. Browser simulation; no connected accounts or messages sent.\n\n## Business problem\n${item.problem}\n\n## Intended outcome\n${item.outcome}\n\n## Suggested connections\n${item.tools.join(" → ")}\n\n## Sample run\n${results.map(r => `### ${r.id}: ${r.status}\n${r.reason}\n${r.actions.map(a => "- " + a).join("\n")}\n\n${r.output.map(o => o.label + ": " + o.text).join("\n\n")}`).join("\n\n")}\n\n## Production build\nConfirm integration access, field mappings, approval rules, retries, duplicate handling, and handover with your team. All external messages in this sample are drafts.\n\nContact: problem2app@gmail.com\n`;
}

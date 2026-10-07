import { describe, expect, it } from "vitest";
import { cases, runWorkflow, workflowBrief } from "./workflowLab";

describe("sample workflow decisions", () => {
  it("merges repeated email addresses without creating another reply", () => {
    const records = cases.leads.items.map(item => ({ ...item }));
    records[3].email = " AISHA@EXAMPLE.COM ";
    const results = runWorkflow("leads", records);
    expect(results[3].status).toBe("Duplicate merged");
    expect(results[3].output.some(o => o.label === "Email draft")).toBe(false);
  });
  it("reclassifies leads at the selected minimum, including equality", () => {
    const results = runWorkflow("leads", cases.leads.items, 7500);
    expect(results.map(r => r.status)).toEqual([
      "Call-ready lead",
      "Nurture follow-up",
      "Call-ready lead",
      "Duplicate merged",
    ]);
    expect(
      runWorkflow("leads", cases.leads.items, 12500).filter(
        r => r.tone === "success"
      )
    ).toHaveLength(0);
  });
  it("flags incomplete lead data for review", () => {
    expect(
      runWorkflow("leads", [
        {
          id: "missing",
          name: "Test",
          subject: "Inquiry",
          detail: "No contact",
        },
      ])[0].status
    ).toBe("Needs details");
  });
  it("requires both signature and deposit before creating a kickoff pack", () => {
    const results = runWorkflow("onboarding", cases.onboarding.items);
    expect(results.map(r => r.status)).toEqual([
      "Ready for kickoff",
      "Deposit needed",
      "Signature needed",
      "Ready for kickoff",
    ]);
    const changed = cases.onboarding.items.map(i => ({ ...i, paid: true }));
    const rerun = runWorkflow("onboarding", changed);
    expect(rerun[1].status).toBe("Ready for kickoff");
    expect(rerun[2].status).toBe("Signature needed");
  });
  it("routes unknown policies, refunds, and uncertain deliveries to people", () => {
    const results = runWorkflow("support", cases.support.items);
    expect(results.map(r => r.tone)).toEqual([
      "success",
      "review",
      "review",
      "review",
    ]);
    expect(results[2].output[0].text).toContain("Confirm eligibility");
    expect(results[1].reason).toContain("no confirmed new delivery date");
  });
  it("exports the current run, with its simulation context", () => {
    const brief = workflowBrief(
      "leads",
      runWorkflow("leads", cases.leads.items, 15000)
    );
    expect(brief).toContain("Fictional scenario");
    expect(brief).toContain("L-01: Nurture follow-up");
    expect(brief).toContain("Duplicate merged");
    expect(brief).toContain("problem2app@gmail.com");
  });
});

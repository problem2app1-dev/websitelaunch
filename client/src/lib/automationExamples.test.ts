import { describe, it, expect } from "vitest";
import {
  buildLead,
  buildOnboarding,
  buildSupport,
  knowledge,
} from "./automationExamples";

describe("local automation examples", () => {
  it("uses custom input and trims surrounding whitespace", () => {
    const result = buildLead("  Mina  ", "  Light Labs  ", "small");
    expect(result.records).toContainEqual({ label: "Contact", value: "Mina" });
    expect(result.records).toContainEqual({
      label: "Company",
      value: "Light Labs",
    });
    expect(result.draft).toContain("Hi Mina");
    expect(result.draft).toContain("Light Labs");
    expect(result.records).toContainEqual({
      label: "Follow-up owner",
      value: "Founder",
    });
  });
  it.each(["medium", "large"])("routes %s teams to sales", size => {
    expect(buildLead("Mina", "Light Labs", size).records).toContainEqual({
      label: "Follow-up owner",
      value: "Sales team",
    });
  });
  it("creates different project checklists", () => {
    const website = buildOnboarding("Light Labs", "website");
    const automation = buildOnboarding("Light Labs", "automation");
    expect(website.tasks).toContain("Collect brand files");
    expect(automation.tasks).toContain("List the tools in use");
    expect(website.records).toContainEqual({
      label: "Project",
      value: "Light Labs · Website",
    });
  });
  it.each(["invite", "export"] as const)(
    "quotes the approved %s guide",
    question => {
      const result = buildSupport(question);
      expect(result.draft).toBe(knowledge[question].answer);
      expect(result.records).toContainEqual({
        label: "Source",
        value: knowledge[question].source,
      });
    }
  );
  it("sends refund requests to a person instead of promising a refund", () => {
    const result = buildSupport("refund");
    expect(result.title).toBe("This one needs a person.");
    expect(result.records).toContainEqual({
      label: "Next step",
      value: "Support team review",
    });
    expect(result.draft).toContain("review your account");
  });
  it("never represents a draft as sent", () => {
    for (const result of [
      buildLead("Mina", "Light Labs", "small"),
      buildOnboarding("Light Labs", "automation"),
      buildSupport("invite"),
    ]) {
      expect(result.review).toBe(true);
      expect(result.steps).toHaveLength(4);
    }
  });
});

export const contactInterests = [
  "Invoices & payments",
  "Payroll & attendance",
  "AI calling agents",
  "Dashboards & reporting",
  "Something else",
] as const;

export type ContactInterest = (typeof contactInterests)[number];
export interface ContactSubmission {
  name: string;
  email: string;
  business: string;
  interest: ContactInterest;
  message: string;
  consent: true;
  website: string;
}

export type ContactErrors = Partial<Record<keyof ContactSubmission, string>>;

export function validateContact(
  input: unknown
):
  | { ok: true; data: ContactSubmission }
  | { ok: false; errors: ContactErrors } {
  const value =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const read = (key: string) =>
    typeof value[key] === "string" ? (value[key] as string).trim() : "";
  const name = read("name");
  const email = read("email");
  const business = read("business");
  const interest = read("interest");
  const message = read("message");
  const website = read("website");
  const errors: ContactErrors = {};
  if (name.length < 2 || name.length > 80 || /[\r\n]/.test(name))
    errors.name = "Enter your name (2–80 characters).";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address.";
  if (business.length < 2 || business.length > 120 || /[\r\n]/.test(business))
    errors.business = "Enter your business name (2–120 characters).";
  if (!contactInterests.includes(interest as ContactInterest))
    errors.interest = "Choose what you want to build.";
  if (message.length < 10 || message.length > 2500)
    errors.message = "Tell us a little more (10–2,500 characters).";
  if (value.consent !== true)
    errors.consent = "Please confirm we can reply to your request.";
  if (website.length) errors.website = "We could not accept this request.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      name,
      email,
      business,
      interest: interest as ContactInterest,
      message,
      consent: true,
      website: "",
    },
  };
}

export interface SiteCapabilities {
  contactMode: "local" | "email" | "unavailable";
  invoiceEmailAvailable: boolean;
  voiceAvailable: boolean;
}

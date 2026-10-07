import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, LoaderCircle, Mail } from "lucide-react";
import {
  contactInterests,
  validateContact,
  type ContactErrors,
  type SiteCapabilities,
} from "@shared/contact";
import "./contact-form.css";

export default function ContactForm({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [capabilities, setCapabilities] = useState<SiteCapabilities | null>(
    null
  );
  const [errors, setErrors] = useState<ContactErrors>({});
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    mode?: string;
  } | null>(null);
  const pendingRef = useRef(false);
  const activeRequest = useRef<AbortController | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/capabilities", { signal: controller.signal })
      .then(response => (response.ok ? response.json() : null))
      .then(value => {
        if (value) setCapabilities(value);
      })
      .catch(() => {});
    return () => {
      controller.abort();
      activeRequest.current?.abort();
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const input = {
      name: values.get("name"),
      email: values.get("email"),
      business: values.get("business"),
      interest: values.get("interest"),
      message: values.get("message"),
      website: values.get("website"),
      consent: values.get("consent") === "on",
    };
    const validation = validateContact(input);
    setResult(null);
    if (!validation.ok) {
      setErrors(validation.errors);
      const first = Object.keys(validation.errors)[0];
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    pendingRef.current = true;
    setPending(true);
    const controller = new AbortController();
    activeRequest.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        mode?: string;
        message?: string;
        errors?: ContactErrors;
      };
      if (!response.ok || !data.ok) {
        setErrors(data.errors || {});
        setResult({
          ok: false,
          message:
            data.message || "We couldn't send this just now. Please try again.",
        });
      } else {
        setResult({
          ok: true,
          mode: data.mode,
          message: data.message || "Your request was received.",
        });
        form.reset();
      }
    } catch {
      setResult({
        ok: false,
        message:
          "We couldn't confirm your request. Check your connection and try again, or email us below.",
      });
    } finally {
      window.clearTimeout(timeout);
      pendingRef.current = false;
      setPending(false);
      activeRequest.current = null;
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }

  const fieldError = (name: keyof ContactErrors) =>
    errors[name] ? (
      <span id={`contact-${name}-error`} className="contact-error">
        {errors[name]}
      </span>
    ) : null;
  const props = (name: keyof ContactErrors) => ({
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });

  return (
    <div className={`contact-panel${compact ? " contact-panel-compact" : ""}`}>
      {!compact && (
        <div className="contact-intro">
          <span className="contact-kicker">
            <span /> LET'S BUILD YOUR VERSION
          </span>
          <h2>
            What should run
            <br />
            without you?
          </h2>
          <p>
            Tell us what slows your team down. We'll help you pick a useful
            first automation.
          </p>
          <a className="contact-email" href="mailto:problem2app@gmail.com">
            <Mail size={18} aria-hidden="true" /> problem2app@gmail.com{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <div className="contact-promise">
            <Check size={16} aria-hidden="true" />
            <span>A conversation about your business. No sales sequence.</span>
          </div>
        </div>
      )}
      <form
        className="contact-form"
        onSubmit={submit}
        noValidate
        aria-label="Project enquiry"
      >
        <div className="contact-row">
          <label className="contact-field" htmlFor="contact-name">
            <span>Your name</span>
            <input
              id="contact-name"
              name="name"
              autoComplete="name"
              placeholder="Alex Morgan"
              required
              minLength={2}
              maxLength={80}
              {...props("name")}
            />
            {fieldError("name")}
          </label>
          <label className="contact-field" htmlFor="contact-email">
            <span>Email</span>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="alex@company.com"
              required
              maxLength={254}
              {...props("email")}
            />
            {fieldError("email")}
          </label>
        </div>
        <div className="contact-row">
          <label className="contact-field" htmlFor="contact-business">
            <span>Business name</span>
            <input
              id="contact-business"
              name="business"
              autoComplete="organization"
              placeholder="Your company"
              required
              minLength={2}
              maxLength={120}
              {...props("business")}
            />
            {fieldError("business")}
          </label>
          <label className="contact-field" htmlFor="contact-interest">
            <span>What do you have in mind?</span>
            <select
              id="contact-interest"
              name="interest"
              defaultValue=""
              required
              {...props("interest")}
            >
              <option value="" disabled>
                Choose a starting point
              </option>
              {contactInterests.map(interest => (
                <option key={interest} value={interest}>
                  {interest}
                </option>
              ))}
            </select>
            {fieldError("interest")}
          </label>
        </div>
        <label className="contact-field" htmlFor="contact-message">
          <span>A little about the work</span>
          <textarea
            id="contact-message"
            name="message"
            rows={3}
            placeholder="We spend every Friday making invoices and chasing updates…"
            required
            minLength={10}
            maxLength={2500}
            {...props("message")}
          />
          {fieldError("message")}
        </label>
        <div className="contact-honeypot" aria-hidden="true">
          <label htmlFor="contact-website">
            Leave this field empty
            <input
              id="contact-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>
        <label className="contact-consent" htmlFor="contact-consent">
          <input
            id="contact-consent"
            name="consent"
            type="checkbox"
            required
            {...props("consent")}
          />
          <span>Problem2App can use these details to reply to my enquiry.</span>
        </label>
        {fieldError("consent")}
        {capabilities?.contactMode === "local" && (
          <p className="contact-preview-note">
            Local preview: submissions save on this computer. Email is not
            connected yet.
          </p>
        )}
        {result && (
          <div
            ref={statusRef}
            tabIndex={-1}
            className={`contact-status ${result.ok ? "is-success" : "is-error"}`}
            role={result.ok ? "status" : "alert"}
          >
            {result.ok && <Check size={18} aria-hidden="true" />}
            <span>{result.message}</span>
          </div>
        )}
        <button
          className="contact-submit"
          type="submit"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <>
              <LoaderCircle
                className="contact-loading"
                size={18}
                aria-hidden="true"
              />{" "}
              Sending your idea…
            </>
          ) : (
            <>
              Let's talk about it <ArrowUpRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

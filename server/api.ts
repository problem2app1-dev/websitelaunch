import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { validateContact, type SiteCapabilities } from "../shared/contact.js";
import { invoiceSchema } from "../shared/finance.js";
import { createInvoicePdf } from "../shared/finance-pdf.js";

export type ApiRequest = IncomingMessage & { body?: unknown };
export interface ApiOptions {
  local?: boolean;
  storageDirectory?: string;
  env?: Record<string, string | undefined>;
  fetcher?: typeof fetch;
  now?: () => number;
}
export type ApiRoute = "contact" | "capabilities" | "invoice";
const BODY_LIMIT = 16_384;
const RATE_WINDOW = 10 * 60_000;

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

function header(req: ApiRequest, name: string) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value || "";
}

export function isSameOrigin(req: ApiRequest) {
  if (header(req, "sec-fetch-site") === "cross-site") return false;
  const origin = header(req, "origin");
  if (!origin) return true; // Non-browser clients have no Origin; JSON is still required.
  try {
    const source = new URL(origin);
    const host = header(req, "host");
    const proxyScheme = header(req, "x-forwarded-proto").split(",")[0].trim();
    const scheme = proxyScheme === "https" ? "https:" : "http:";
    return source.host === host && source.protocol === scheme;
  } catch {
    return false;
  }
}

export async function readJson(req: ApiRequest) {
  if (!/^application\/json(?:\s*;|$)/i.test(header(req, "content-type")))
    throw new ApiError(415, "Send this request as JSON.");
  const declared = Number(header(req, "content-length") || 0);
  if (declared > BODY_LIMIT)
    throw new ApiError(413, "This request is too large.");
  if (req.body !== undefined) {
    const serialized =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(serialized) > BODY_LIMIT)
      throw new ApiError(413, "This request is too large.");
    try {
      return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch {
      throw new ApiError(400, "This request could not be read.");
    }
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > BODY_LIMIT)
      throw new ApiError(413, "This request is too large.");
    chunks.push(bytes);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "This request could not be read.");
  }
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(JSON.stringify(data));
}

export function getCapabilities(
  env: Record<string, string | undefined>,
  local = false
): SiteCapabilities {
  const mail = Boolean(env.RESEND_API_KEY?.trim() && env.CONTACT_FROM?.trim());
  return {
    contactMode: mail ? "email" : local ? "local" : "unavailable",
    invoiceEmailAvailable:
      mail &&
      env.INVOICE_DEMO_EMAIL_ENABLED === "true" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.INVOICE_DEMO_TO || ""),
    voiceAvailable: Boolean(
      env.VITE_VAPI_PUBLIC_KEY?.trim() && env.VITE_VAPI_ASSISTANT_ID?.trim()
    ),
  };
}

export async function deliverEmail(
  env: Record<string, string | undefined>,
  payload: Record<string, unknown>,
  fetcher: typeof fetch = fetch
) {
  const response = await fetcher("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: env.CONTACT_FROM, ...payload }),
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok)
    throw new ApiError(
      502,
      "We could not send this just now. Please try again or email problem2app@gmail.com."
    );
  const result = (await response.json()) as { id?: string };
  if (!result.id)
    throw new ApiError(
      502,
      "The email service did not confirm this request. Please try again."
    );
  return result.id;
}

export function createApiHandler(route: ApiRoute, options: ApiOptions = {}) {
  const rateBuckets = new Map<string, { count: number; expires: number }>();
  return async (req: ApiRequest, res: ServerResponse) => {
    const env = options.env ?? process.env;
    const local = options.local === true;
    const now = options.now?.() ?? Date.now();
    const capabilities = getCapabilities(env, local);
    try {
      const method = route === "capabilities" ? "GET" : "POST";
      if (req.method !== method) {
        res.setHeader("Allow", method);
        return json(res, 405, {
          ok: false,
          message: `Use ${method} for this request.`,
        });
      }
      if (route === "capabilities") return json(res, 200, capabilities);
      if (!isSameOrigin(req))
        return json(res, 403, {
          ok: false,
          message: "Please send the form from this website.",
        });
      // Per-instance protection. Vercel Firewall is the shared edge layer in production.
      const ip =
        env.VERCEL === "1"
          ? header(req, "x-forwarded-for").split(",")[0].trim()
          : req.socket.remoteAddress;
      const key = (ip || "unknown").slice(0, 100);
      const bucket = rateBuckets.get(key);
      if (
        bucket &&
        bucket.expires > now &&
        bucket.count >= (route === "invoice" ? 3 : 8)
      ) {
        res.setHeader(
          "Retry-After",
          String(Math.ceil((bucket.expires - now) / 1000))
        );
        return json(res, 429, {
          ok: false,
          message:
            "A few requests arrived together. Please try again in a few minutes.",
        });
      }
      if (rateBuckets.size > 10_000) {
        for (const [entryKey, entry] of rateBuckets)
          if (entry.expires <= now) rateBuckets.delete(entryKey);
        if (rateBuckets.size > 10_000)
          return json(res, 503, {
            ok: false,
            message: "The form is busy. Please try again shortly.",
          });
      }
      rateBuckets.set(
        key,
        bucket && bucket.expires > now
          ? { ...bucket, count: bucket.count + 1 }
          : { count: 1, expires: now + RATE_WINDOW }
      );
      const input = await readJson(req);
      if (route === "invoice") {
        if (!capabilities.invoiceEmailAvailable)
          return json(res, 503, {
            ok: false,
            message:
              "Invoice email is not connected yet. You can still download your PDF.",
          });
        const invoice = invoiceSchema.safeParse(input);
        if (!invoice.success)
          return json(res, 400, {
            ok: false,
            message: "Check the invoice details before sending.",
          });
        const pdf = await createInvoicePdf(invoice.data);
        const content = Buffer.from(pdf.output("arraybuffer")).toString(
          "base64"
        );
        await deliverEmail(
          env,
          {
            to: [env.INVOICE_DEMO_TO],
            subject: "Problem2App Studio — sample invoice",
            text: "A visitor generated this sample invoice in the Problem2App Studio. It uses demo data and is not a payment request.",
            attachments: [
              { filename: "problem2app-sample-invoice.pdf", content },
            ],
          },
          options.fetcher
        );
        return json(res, 201, {
          ok: true,
          message:
            "The sample PDF is on its way to the studio inbox. No email was sent to the client on the invoice.",
        });
      }
      const validation = validateContact(input);
      if (!validation.ok)
        return json(res, 400, {
          ok: false,
          message: "Please check the highlighted fields.",
          errors: validation.errors,
        });
      const data = validation.data;
      if (capabilities.contactMode === "unavailable")
        return json(res, 503, {
          ok: false,
          message:
            "Our form is not connected yet. Please email problem2app@gmail.com.",
        });
      const id = randomUUID();
      if (capabilities.contactMode === "local") {
        const directory =
          options.storageDirectory ?? path.resolve(process.cwd(), ".local");
        await mkdir(directory, { recursive: true });
        await appendFile(
          path.join(directory, "contact-submissions.jsonl"),
          JSON.stringify({
            id,
            receivedAt: new Date(now).toISOString(),
            ...data,
          }) + "\n",
          { encoding: "utf8", mode: 0o600 }
        );
        return json(res, 201, {
          ok: true,
          mode: "local",
          message: "Saved in the local preview inbox. No email was sent.",
        });
      }
      await deliverEmail(
        env,
        {
          to: [env.CONTACT_TO?.trim() || "problem2app@gmail.com"],
          reply_to: data.email,
          subject: `Website enquiry: ${data.interest}`,
          text: `New Problem2App enquiry\n\nName: ${data.name}\nEmail: ${data.email}\nBusiness: ${data.business}\nInterested in: ${data.interest}\n\n${data.message}\n\nReply permission: granted\nReference: ${id}`,
        },
        options.fetcher
      );
      return json(res, 201, {
        ok: true,
        mode: "email",
        message:
          "Thanks — your request is on its way to our team. We'll reply to the email you shared.",
      });
    } catch (error) {
      if (error instanceof ApiError)
        return json(res, error.status, { ok: false, message: error.message });
      return json(res, 500, {
        ok: false,
        message:
          "We could not save your request. Please try again or email problem2app@gmail.com.",
      });
    }
  };
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createApiHandler,
  getCapabilities,
  type ApiOptions,
  type ApiRoute,
} from "./api";
import { defaultInvoice } from "../shared/finance";

const validContact = {
  name: "Test Founder",
  email: "founder@example.com",
  business: "Example Studio",
  interest: "Invoices & payments",
  message: "We need to automate weekly invoice preparation.",
  consent: true,
  website: "",
};
const servers: Server[] = [];
const directories: string[] = [];
async function endpoint(route: ApiRoute, options: ApiOptions = {}) {
  const server = createServer(createApiHandler(route, { env: {}, ...options }));
  servers.push(server);
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw Error("Missing test address");
  return `http://127.0.0.1:${address.port}/api/${route}`;
}
function post(
  url: string,
  body: unknown = validContact,
  headers: Record<string, string> = {}
) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(url).origin,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close(error => (error ? reject(error) : resolve()))
    );
  }
  for (const directory of directories.splice(0))
    await rm(directory, { recursive: true, force: true });
});

describe("contact API", () => {
  it("persists local submissions and makes the delivery mode explicit", async () => {
    const directory = await mkdtemp(
      path.join(tmpdir(), "problem2app-contact-test-")
    );
    directories.push(directory);
    const url = await endpoint("contact", {
      local: true,
      storageDirectory: directory,
    });
    const response = await post(url);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ ok: true, mode: "local" });
    const saved = JSON.parse(
      (
        await readFile(
          path.join(directory, "contact-submissions.jsonl"),
          "utf8"
        )
      ).trim()
    );
    expect(saved).toMatchObject(validContact);
    expect(saved.id).toBeTruthy();
  });

  it("does not report success in production when delivery is unconfigured", async () => {
    const response = await post(await endpoint("contact"));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false });
  });

  it("rejects invalid addresses, missing consent, and a filled honeypot before delivery", async () => {
    const fetcher = vi.fn();
    const url = await endpoint("contact", {
      env: { RESEND_API_KEY: "test", CONTACT_FROM: "site@example.com" },
      fetcher,
    });
    const response = await post(url, {
      ...validContact,
      email: "bad",
      consent: false,
      website: "spam",
    });
    expect(response.status).toBe(400);
    expect((await response.json()).errors).toHaveProperty("email");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects cross-origin requests, oversized bodies and unsupported media types", async () => {
    const url = await endpoint("contact");
    expect(
      (await post(url, validContact, { Origin: "https://unrelated.example" }))
        .status
    ).toBe(403);
    expect(
      (await post(url, { ...validContact, message: "a".repeat(17000) })).status
    ).toBe(413);
    expect(
      (await post(url, validContact, { "Content-Type": "text/plain" })).status
    ).toBe(415);
  });

  it("reports provider failure and only confirms a provider-accepted message", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response("rejected", { status: 500 }))
      .mockResolvedValueOnce(Response.json({ id: "mail-test" }));
    const url = await endpoint("contact", {
      env: { RESEND_API_KEY: "test", CONTACT_FROM: "site@example.com" },
      fetcher,
    });
    expect((await post(url)).status).toBe(502);
    const response = await post(url);
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ ok: true, mode: "email" });
    const payload = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(payload.to).toEqual(["problem2app@gmail.com"]);
    expect(payload.reply_to).toBe(validContact.email);
  });

  it("limits repeated submissions without relying on a visitor-provided IP", async () => {
    const url = await endpoint("contact");
    for (let index = 0; index < 8; index++)
      await post(url, validContact, { "X-Forwarded-For": `192.0.2.${index}` });
    const response = await post(url);
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
  });
});

describe("studio delivery capabilities", () => {
  it("requires the explicit invoice flag, provider and fixed inbox", () => {
    expect(getCapabilities({}, true)).toMatchObject({
      contactMode: "local",
      invoiceEmailAvailable: false,
      voiceAvailable: false,
    });
    expect(
      getCapabilities({
        RESEND_API_KEY: "test",
        CONTACT_FROM: "site@example.com",
      })
    ).toMatchObject({ contactMode: "email", invoiceEmailAvailable: false });
    expect(
      getCapabilities({
        RESEND_API_KEY: "test",
        CONTACT_FROM: "site@example.com",
        INVOICE_DEMO_EMAIL_ENABLED: "true",
        INVOICE_DEMO_TO: "owner@example.com",
      }).invoiceEmailAvailable
    ).toBe(true);
  });

  it("generates the invoice attachment server-side and sends only to the fixed studio inbox", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "invoice-test" }));
    const url = await endpoint("invoice", {
      env: {
        RESEND_API_KEY: "test",
        CONTACT_FROM: "site@example.com",
        INVOICE_DEMO_EMAIL_ENABLED: "true",
        INVOICE_DEMO_TO: "owner@example.com",
      },
      fetcher,
    });
    const response = await post(url, {
      ...defaultInvoice(),
      clientEmail: "visitor@example.com",
      to: "attacker@example.com",
    });
    expect(response.status).toBe(201);
    const payload = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(payload.to).toEqual(["owner@example.com"]);
    expect(
      Buffer.from(payload.attachments[0].content, "base64")
        .subarray(0, 5)
        .toString()
    ).toBe("%PDF-");
  });
});

import { describe, expect, it } from "vitest";
import {
  calculateInvoice,
  calculatePayroll,
  defaultInvoice,
  gmailInvoiceUrl,
  invoiceSchema,
  payrollCsv,
  sampleEmployees,
  toMinor,
} from "../../../shared/finance";
import {
  createInvoicePdf,
  createPayslipPdf,
} from "../../../shared/finance-pdf";

describe("invoice calculations", () => {
  it("rounds line items before summing, then discounts before taxing", () => {
    const result = calculateInvoice({
      items: [
        { description: "Service", quantity: 3, rate: 19.99 },
        { description: "Extra", quantity: 0.5, rate: 10.01 },
      ],
      discountRate: 10,
      taxRate: 8.25,
    });
    expect(result.lines).toEqual([5997, 501]);
    expect(result.subtotal).toBe(6498);
    expect(result.discount).toBe(650);
    expect(result.taxable).toBe(5848);
    expect(result.tax).toBe(482);
    expect(result.total).toBe(6330);
  });
  it("supports a full discount without adding tax to zero", () => {
    expect(
      calculateInvoice({ ...defaultInvoice(), discountRate: 100, taxRate: 18 })
        .total
    ).toBe(0);
  });
  it("rejects invalid invoice dates, excessive rates and empty line descriptions", () => {
    expect(
      invoiceSchema.safeParse({ ...defaultInvoice(), dueDate: "2026-02-30" })
        .success
    ).toBe(false);
    expect(
      invoiceSchema.safeParse({ ...defaultInvoice(), dueDate: "2026-01-01" })
        .success
    ).toBe(false);
    expect(
      invoiceSchema.safeParse({ ...defaultInvoice(), taxRate: 101 }).success
    ).toBe(false);
    expect(
      invoiceSchema.safeParse({
        ...defaultInvoice(),
        items: [{ description: " ", quantity: 1, rate: 10 }],
      }).success
    ).toBe(false);
  });
  it("rejects nonfinite amounts and zero quantities", () => {
    expect(
      invoiceSchema.safeParse({
        ...defaultInvoice(),
        items: [{ description: "Work", quantity: 0, rate: 10 }],
      }).success
    ).toBe(false);
    expect(
      invoiceSchema.safeParse({ ...defaultInvoice(), taxRate: Infinity })
        .success
    ).toBe(false);
  });
  it("encodes Gmail recipient and body without losing client characters", () => {
    const url = new URL(
      gmailInvoiceUrl({
        ...defaultInvoice(),
        clientName: "Maya & Co",
        clientEmail: "maya@example.com",
      })
    );
    expect(url.origin).toBe("https://mail.google.com");
    expect(url.searchParams.get("to")).toBe("maya@example.com");
    expect(url.searchParams.get("body")).toContain("Maya & Co");
    expect(url.searchParams.get("body")).toContain("attach the downloaded PDF");
  });
});

describe("payroll calculations", () => {
  it("calculates prorated leave in cents after adding bonuses and overtime", () => {
    const pay = calculatePayroll({
      base: 6000,
      bonus: 250,
      overtimeHours: 4,
      overtimeRate: 40,
      absentDays: 1,
      deductions: 150,
    });
    expect(pay.gross).toBe(641000);
    expect(pay.absence).toBe(27273);
    expect(pay.net).toBe(598727);
  });
  it("caps leave to 22 days and deductions at remaining gross pay", () => {
    const pay = calculatePayroll({
      base: 100,
      bonus: 50,
      overtimeHours: 0,
      overtimeRate: 0,
      absentDays: 50,
      deductions: 10000,
    });
    expect(pay.absence).toBe(10000);
    expect(pay.deductions).toBe(5000);
    expect(pay.net).toBe(0);
  });
  it("does not allow negative or nonfinite inputs to create negative pay", () => {
    expect(
      calculatePayroll({
        base: -1,
        bonus: NaN,
        overtimeHours: Infinity,
        overtimeRate: 100,
        absentDays: -4,
        deductions: 100,
      }).net
    ).toBe(0);
  });
  it("exports exactly the five edited employee calculations", () => {
    const edited = sampleEmployees.map(employee => ({ ...employee }));
    edited[0].bonus = 1000;
    const csv = payrollCsv(edited, "USD");
    expect(csv.split("\r\n")).toHaveLength(6);
    expect(csv).toContain('"Maya Chen"');
    expect(csv).toContain('"6080.00"');
  });
  it("rounds midpoint amounts consistently", () => {
    expect(toMinor(1.005)).toBe(101);
    expect(toMinor(10.075)).toBe(1008);
    expect(
      calculateInvoice({
        items: [{ description: "Fractional unit", quantity: 0.1, rate: 0.35 }],
        taxRate: 0,
        discountRate: 0,
      }).total
    ).toBe(4);
    expect(
      calculatePayroll({
        base: 2200,
        bonus: 0,
        overtimeHours: 0.5,
        overtimeRate: 10.01,
        absentDays: 0.5,
        deductions: 0.01,
      }).net
    ).toBe(215500);
  });
});

describe("downloadable documents", () => {
  it("creates both invoice designs with a real PDF header", async () => {
    for (const template of ["studio", "minimal"] as const) {
      const pdf = await createInvoicePdf({
        ...defaultInvoice(),
        template,
        currency: "INR",
      });
      expect(
        new TextDecoder().decode(pdf.output("arraybuffer").slice(0, 8))
      ).toMatch(/^%PDF-/);
      expect(pdf.getNumberOfPages()).toBe(1);
    }
  });
  it("moves long invoice summaries onto a second page and creates a payslip", async () => {
    const invoice = await createInvoicePdf({
      ...defaultInvoice(),
      items: Array.from({ length: 8 }, () => ({
        description:
          "A considered product design and development package with research, design, build and launch support",
        quantity: 1,
        rate: 100,
      })),
    });
    expect(invoice.getNumberOfPages()).toBe(2);
    const slip = await createPayslipPdf(sampleEmployees[0], "USD");
    expect(slip.getNumberOfPages()).toBe(1);
    expect(slip.output("arraybuffer").byteLength).toBeGreaterThan(1000);
  });
});

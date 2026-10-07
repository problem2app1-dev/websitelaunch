import { z } from "zod";

export type Currency = "USD" | "INR";
const amount = z.number().finite().min(0).max(1_000_000).multipleOf(0.01);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(value => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Enter a valid date");

export const invoiceSchema = z
  .object({
    number: z.string().trim().min(1).max(32),
    sellerName: z.string().trim().min(1).max(80),
    sellerEmail: z.email().max(120),
    clientName: z.string().trim().min(1).max(80),
    clientEmail: z.union([z.literal(""), z.email().max(120)]),
    issueDate: date,
    dueDate: date,
    currency: z.enum(["USD", "INR"]),
    template: z.enum(["studio", "minimal"]),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1).max(100),
          quantity: z.number().finite().min(0.01).max(1000).multipleOf(0.01),
          rate: amount,
        })
      )
      .min(1)
      .max(8),
    taxRate: z.number().finite().min(0).max(100).multipleOf(0.01),
    discountRate: z.number().finite().min(0).max(100).multipleOf(0.01),
  })
  .refine(input => input.dueDate >= input.issueDate, {
    message: "Due date must be on or after the invoice date",
    path: ["dueDate"],
  });

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export function toMinor(value: number) {
  if (!Number.isFinite(value)) return 0;
  const [coefficient, exponent = "0"] = value.toString().split("e");
  return Math.round(Number(`${coefficient}e${Number(exponent) + 2}`));
}
const bounded = (value: number, max = 1_000_000) =>
  Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;

/** Line amounts, discounts, and tax are rounded once, in that order, to cents/paise. */
export function calculateInvoice(
  input: Pick<InvoiceInput, "items" | "taxRate" | "discountRate">
) {
  const lines = input.items.map(item =>
    Math.round(
      (toMinor(bounded(item.rate)) * toMinor(bounded(item.quantity, 1000))) /
        100
    )
  );
  const subtotal = lines.reduce((sum, line) => sum + line, 0);
  const discount = Math.round(
    (subtotal * toMinor(bounded(input.discountRate, 100))) / 10000
  );
  const taxable = subtotal - discount;
  const tax = Math.round(
    (taxable * toMinor(bounded(input.taxRate, 100))) / 10000
  );
  return { lines, subtotal, discount, taxable, tax, total: taxable + tax };
}

export function money(minor: number, currency: Currency = "USD") {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function defaultInvoice(): InvoiceInput {
  return {
    number: "INV-1042",
    sellerName: "Nook Studio",
    sellerEmail: "hello@example.com",
    clientName: "Orbit Coffee",
    clientEmail: "",
    issueDate: "2026-10-07",
    dueDate: "2026-10-21",
    currency: "USD",
    template: "studio",
    items: [
      { description: "Brand identity & launch kit", quantity: 1, rate: 1200 },
      { description: "Product photography", quantity: 3, rate: 180 },
    ],
    taxRate: 0,
    discountRate: 5,
  };
}

export function gmailInvoiceUrl(input: InvoiceInput) {
  const totals = calculateInvoice(input);
  const body = `Hi ${input.clientName},\n\nHere is sample invoice ${input.number} from ${input.sellerName}.\n\n${input.items.map((item, index) => `${item.description} (${item.quantity} × ${money(toMinor(item.rate), input.currency)}): ${money(totals.lines[index], input.currency)}`).join("\n")}\n\nTotal: ${money(totals.total, input.currency)}\nDue: ${input.dueDate}\n\nPlease attach the downloaded PDF before sending.\n\nCreated with the Problem2App invoice demo.`;
  return `https://mail.google.com/mail/?${new URLSearchParams({ view: "cm", fs: "1", to: input.clientEmail, su: `Sample invoice ${input.number} — ${input.sellerName}`, body })}`;
}

export type Employee = {
  id: string;
  name: string;
  role: string;
  initials: string;
  base: number;
  bonus: number;
  overtimeHours: number;
  overtimeRate: number;
  absentDays: number;
  deductions: number;
};
export const sampleEmployees: Employee[] = [
  {
    id: "NK-001",
    name: "Maya Chen",
    role: "Product designer",
    initials: "MC",
    base: 5200,
    bonus: 400,
    overtimeHours: 0,
    overtimeRate: 35,
    absentDays: 0,
    deductions: 120,
  },
  {
    id: "NK-002",
    name: "Arjun Mehta",
    role: "Frontend developer",
    initials: "AM",
    base: 6000,
    bonus: 250,
    overtimeHours: 4,
    overtimeRate: 40,
    absentDays: 1,
    deductions: 150,
  },
  {
    id: "NK-003",
    name: "Sofia Rivera",
    role: "Growth strategist",
    initials: "SR",
    base: 4800,
    bonus: 600,
    overtimeHours: 0,
    overtimeRate: 30,
    absentDays: 0,
    deductions: 100,
  },
  {
    id: "NK-004",
    name: "Noah Williams",
    role: "Operations lead",
    initials: "NW",
    base: 4500,
    bonus: 200,
    overtimeHours: 6,
    overtimeRate: 28,
    absentDays: 2,
    deductions: 90,
  },
  {
    id: "NK-005",
    name: "Aisha Khan",
    role: "Customer success",
    initials: "AK",
    base: 4200,
    bonus: 300,
    overtimeHours: 2,
    overtimeRate: 26,
    absentDays: 0,
    deductions: 80,
  },
];

export const PAYROLL_WORK_DAYS = 22;
export const PAYROLL_PERIOD = "October 2026";

/** Demo policy: 22 paid workdays, flat voluntary deductions, no statutory tax rules. */
export function calculatePayroll(
  input: Pick<
    Employee,
    | "base"
    | "bonus"
    | "overtimeHours"
    | "overtimeRate"
    | "absentDays"
    | "deductions"
  >
) {
  const base = toMinor(bounded(input.base));
  const bonus = toMinor(bounded(input.bonus));
  const overtime = Math.round(
    (toMinor(bounded(input.overtimeHours, 200)) *
      toMinor(bounded(input.overtimeRate, 10000))) /
      100
  );
  const gross = base + bonus + overtime;
  const absentDays = bounded(input.absentDays, PAYROLL_WORK_DAYS);
  const absence = Math.min(
    base,
    Math.round((base * absentDays) / PAYROLL_WORK_DAYS)
  );
  const deductions = Math.min(
    gross - absence,
    toMinor(bounded(input.deductions))
  );
  return {
    base,
    bonus,
    overtime,
    gross,
    absence,
    deductions,
    totalDeductions: absence + deductions,
    net: gross - absence - deductions,
    absentDays,
  };
}

export function payrollCsv(employees: Employee[], currency: Currency) {
  const headers = [
    "Employee ID",
    "Employee",
    "Role",
    "Period",
    "Currency",
    "Base",
    "Bonus",
    "Overtime",
    "Gross",
    "Unpaid leave",
    "Other deductions",
    "Net pay",
  ];
  const rows = employees.map(employee => {
    const pay = calculatePayroll(employee);
    return [
      employee.id,
      employee.name,
      employee.role,
      PAYROLL_PERIOD,
      currency,
      ...[
        pay.base,
        pay.bonus,
        pay.overtime,
        pay.gross,
        pay.absence,
        pay.deductions,
        pay.net,
      ].map(value => (value / 100).toFixed(2)),
    ];
  });
  return [headers, ...rows]
    .map(row =>
      row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")
    )
    .join("\r\n");
}

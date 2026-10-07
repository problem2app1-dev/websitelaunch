import {
  calculateInvoice,
  calculatePayroll,
  invoiceSchema,
  PAYROLL_PERIOD,
  type InvoiceInput,
  type Employee,
  type Currency,
} from "./finance";
import type { jsPDF } from "jspdf";

const ink = [24, 22, 39] as const;
const purple = [117, 86, 217] as const;
const muted = [105, 103, 119] as const;
// PDF core fonts are Latin. Keep unsupported glyphs legible without loading a large font on every visit.
const printable = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
const amount = (minor: number, currency: Currency) =>
  `${currency} ${(minor === 0 ? 0 : minor / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function text(
  pdf: jsPDF,
  value: string,
  x: number,
  y: number,
  size = 10,
  color: readonly number[] = ink,
  bold = false,
  align: "left" | "right" = "left"
) {
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(size);
  pdf.setTextColor(color[0], color[1], color[2]);
  pdf.text(printable(value), x, y, { align });
}

function wrappedText(
  pdf: jsPDF,
  value: string,
  x: number,
  y: number,
  width: number,
  size: number,
  lineHeight: number,
  color: readonly number[] = ink,
  bold = false,
  align: "left" | "right" = "left"
) {
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(size);
  const lines: string[] = pdf.splitTextToSize(printable(value), width);
  lines.forEach((line, index) =>
    text(pdf, line, x, y + index * lineHeight, size, color, bold, align)
  );
  return y + Math.max(0, lines.length - 1) * lineHeight;
}

function fittedText(
  pdf: jsPDF,
  value: string,
  x: number,
  y: number,
  width: number,
  size: number,
  color: readonly number[] = ink,
  bold = false,
  align: "left" | "right" = "left"
) {
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(size);
  const measured = pdf.getTextWidth(printable(value));
  text(
    pdf,
    value,
    x,
    y,
    measured > width ? (size * width) / measured : size,
    color,
    bold,
    align
  );
}
function footer(pdf: jsPDF) {
  pdf.setDrawColor(229, 226, 239);
  pdf.line(20, 272, 190, 272);
  text(pdf, "SAMPLE DOCUMENT / FICTIONAL BUSINESS", 20, 281, 8, muted);
  text(pdf, "Made with Problem2App", 190, 281, 8, muted, false, "right");
}

export async function createInvoicePdf(rawInput: InvoiceInput): Promise<jsPDF> {
  const input = invoiceSchema.parse(rawInput);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const totals = calculateInvoice(input);
  const studio = input.template === "studio";
  const accent = studio ? purple : ink;
  pdf.setProperties({
    title: `Sample invoice ${input.number}`,
    author: "Problem2App",
    subject: "Interactive invoice demo",
  });
  pdf.setFillColor(accent[0], accent[1], accent[2]);
  pdf.rect(0, 0, 210, 5, "F");
  if (studio) {
    pdf.setFillColor(248, 246, 255);
    pdf.roundedRect(133, 15, 57, 44, 4, 4, "F");
  }
  const sellerBottom = wrappedText(
    pdf,
    input.sellerName,
    20,
    28,
    101,
    18,
    7,
    ink,
    true
  );
  const senderBottom = wrappedText(
    pdf,
    input.sellerEmail,
    20,
    sellerBottom + 8,
    101,
    9,
    4.5,
    muted
  );
  text(pdf, "INVOICE", 190, 29, 21, studio ? purple : ink, true, "right");
  const numberBottom = wrappedText(
    pdf,
    input.number,
    190,
    39,
    53,
    10,
    5,
    muted,
    false,
    "right"
  );
  const billTop = Math.max(66, senderBottom + 15, numberBottom + 17);
  text(pdf, "BILL TO", 20, billTop, 8, muted, true);
  const clientBottom = wrappedText(
    pdf,
    input.clientName,
    20,
    billTop + 10,
    101,
    12,
    6,
    ink,
    true
  );
  const clientEmailBottom = input.clientEmail
    ? wrappedText(
        pdf,
        input.clientEmail,
        20,
        clientBottom + 8,
        101,
        9,
        4.5,
        muted
      )
    : clientBottom;
  text(
    pdf,
    `Issued: ${input.issueDate}`,
    190,
    billTop + 2,
    9,
    muted,
    false,
    "right"
  );
  text(pdf, `Due: ${input.dueDate}`, 190, billTop + 11, 9, ink, true, "right");
  const start = Math.max(104, clientEmailBottom + 20);
  pdf.setFillColor(accent[0], accent[1], accent[2]);
  pdf.roundedRect(20, start - 7, 170, 12, 2, 2, "F");
  text(pdf, "DESCRIPTION", 24, start, 8, [255, 255, 255], true);
  text(pdf, "QTY", 122, start, 8, [255, 255, 255], true, "right");
  text(pdf, "RATE", 151, start, 8, [255, 255, 255], true, "right");
  text(pdf, "AMOUNT", 186, start, 8, [255, 255, 255], true, "right");
  let y = start + 15;
  input.items.forEach((item, index) => {
    pdf.setFontSize(9);
    const lines: string[] = pdf.splitTextToSize(
      printable(item.description),
      80
    );
    const rowHeight = Math.max(12, lines.length * 4 + 7);
    if (y + rowHeight > 257) {
      footer(pdf);
      pdf.addPage();
      y = 28;
      text(pdf, `Invoice ${input.number} / continued`, 20, 18, 9, muted);
    }
    lines.forEach((line, lineIndex) =>
      text(pdf, line, 24, y + lineIndex * 4, 9)
    );
    text(pdf, String(item.quantity), 122, y, 9, muted, false, "right");
    text(pdf, item.rate.toFixed(2), 151, y, 9, muted, false, "right");
    text(
      pdf,
      (totals.lines[index] / 100).toFixed(2),
      186,
      y,
      9,
      ink,
      false,
      "right"
    );
    y += rowHeight;
    pdf.setDrawColor(236, 233, 243);
    pdf.line(20, y - 6, 190, y - 6);
  });
  if (y > 204) {
    footer(pdf);
    pdf.addPage();
    y = 30;
    text(pdf, `Invoice ${input.number} / continued`, 20, 18, 9, muted);
  }
  y += 7;
  const summary = [
    ["Subtotal", totals.subtotal],
    [`Discount (${input.discountRate}%)`, -totals.discount],
    [`Tax (${input.taxRate}%)`, totals.tax],
  ] as const;
  summary.forEach(([label, value]) => {
    text(pdf, label, 117, y, 9, muted);
    text(pdf, amount(value, input.currency), 186, y, 9, ink, false, "right");
    y += 8;
  });
  pdf.setFillColor(244, 241, 252);
  pdf.roundedRect(111, y - 3, 79, 17, 3, 3, "F");
  text(pdf, "TOTAL DUE", 117, y + 7, 9, purple, true);
  fittedText(
    pdf,
    amount(totals.total, input.currency),
    186,
    y + 7,
    45,
    12,
    purple,
    true,
    "right"
  );
  text(
    pdf,
    "Thanks for making good things with us.",
    20,
    Math.min(y + 32, 253),
    10,
    ink,
    true
  );
  text(
    pdf,
    "Preview invoice. No payment is due for this demo.",
    20,
    Math.min(y + 40, 261),
    8,
    muted
  );
  footer(pdf);
  return pdf;
}

export async function createPayslipPdf(
  employee: Employee,
  currency: Currency
): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pay = calculatePayroll(employee);
  pdf.setProperties({
    title: `Sample payslip ${employee.name}`,
    author: "Problem2App",
  });
  pdf.setFillColor(...ink);
  pdf.rect(0, 0, 210, 55, "F");
  text(pdf, "Nook Studio", 20, 25, 20, [255, 255, 255], true);
  text(pdf, "PAY STATEMENT / SAMPLE", 20, 38, 9, [204, 197, 231]);
  text(pdf, PAYROLL_PERIOD, 190, 27, 12, [255, 255, 255], true, "right");
  text(pdf, employee.name, 20, 75, 17, ink, true);
  text(pdf, `${employee.role} / ${employee.id}`, 20, 85, 10, muted);
  text(pdf, "22 paid workdays / monthly sample payroll", 20, 94, 9, muted);
  pdf.setFillColor(245, 242, 253);
  pdf.roundedRect(20, 106, 170, 33, 4, 4, "F");
  text(pdf, "NET PAY", 27, 119, 9, purple, true);
  text(pdf, amount(pay.net, currency), 183, 126, 22, purple, true, "right");
  let y = 156;
  const lines = [
    ["Base salary", pay.base],
    ["Bonus", pay.bonus],
    [`Overtime (${employee.overtimeHours} hours)`, pay.overtime],
    ["Gross earnings", pay.gross],
    [`Unpaid leave (${pay.absentDays} days)`, -pay.absence],
    ["Other deductions", -pay.deductions],
    ["Net pay", pay.net],
  ] as const;
  lines.forEach(([label, value], index) => {
    const bold = index === 3 || index === 6;
    text(pdf, label, 24, y, 10, bold ? ink : muted, bold);
    text(pdf, amount(value, currency), 186, y, 10, ink, bold, "right");
    pdf.setDrawColor(236, 233, 243);
    pdf.line(20, y + 4, 190, y + 4);
    y += 12;
  });
  text(
    pdf,
    "Illustrative calculation. Statutory taxes and benefits are not included.",
    20,
    252,
    8,
    muted
  );
  text(
    pdf,
    "Deductions are capped so the sample net pay cannot go below zero.",
    20,
    259,
    8,
    muted
  );
  footer(pdf);
  return pdf;
}

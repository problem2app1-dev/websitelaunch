import { useEffect, useId, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileText,
  LoaderCircle,
  Plus,
  ReceiptText,
  RotateCcw,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useInvoiceDownload } from "@/lib/useInvoiceDownload";
import {
  calculateInvoice,
  calculatePayroll,
  defaultInvoice,
  gmailInvoiceUrl,
  invoiceSchema,
  money,
  payrollCsv,
  sampleEmployees,
  PAYROLL_PERIOD,
  PAYROLL_WORK_DAYS,
  toMinor,
  type Currency,
  type Employee,
  type InvoiceInput,
} from "@shared/finance";
import "./finance-demos.css";

function saveText(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function cleanFilename(value: string) {
  return value.replace(/[^a-z0-9_-]/gi, "-").slice(0, 60);
}
function numeric(value: string, max: number) {
  return Math.min(max, Math.max(0, Number(value) || 0));
}

function NumberField({
  label,
  value,
  onChange,
  max = 1_000_000,
  step = "0.01",
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  max?: number;
  step?: string;
  suffix?: string;
}) {
  const id = useId();
  return (
    <label className="finance-field" htmlFor={id}>
      <span>
        {label}
        {suffix && <small>{suffix}</small>}
      </span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0"
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(numeric(event.target.value, max))}
      />
    </label>
  );
}

function MobilePanelTabs({
  panel,
  setPanel,
  preview = "Preview",
}: {
  panel: "edit" | "preview";
  setPanel: (panel: "edit" | "preview") => void;
  preview?: string;
}) {
  return (
    <div className="finance-mobile-tabs" aria-label="Workspace view">
      <button
        type="button"
        aria-pressed={panel === "edit"}
        onClick={() => setPanel("edit")}
      >
        Edit details
      </button>
      <button
        type="button"
        aria-pressed={panel === "preview"}
        onClick={() => setPanel("preview")}
      >
        {preview}
      </button>
    </div>
  );
}

export function InvoiceDemo() {
  const [input, setInput] = useState<InvoiceInput>(defaultInvoice);
  const [panel, setPanel] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState<"email" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState(false);
  const totals = calculateInvoice(input);
  const validation = invoiceSchema.safeParse(input);
  const invoiceDownload = useInvoiceDownload(input);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/capabilities", { signal: controller.signal })
      .then(response => (response.ok ? response.json() : null))
      .then(data => setEmailAvailable(Boolean(data?.invoiceEmailAvailable)))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  function update<K extends keyof InvoiceInput>(
    key: K,
    value: InvoiceInput[K]
  ) {
    setInput(current => ({ ...current, [key]: value }));
    setNotice("");
  }
  function updateItem(
    index: number,
    patch: Partial<InvoiceInput["items"][number]>
  ) {
    update(
      "items",
      input.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }
  function checkInput() {
    if (!validation.success) {
      setError(true);
      setNotice(
        validation.error.issues[0]?.message || "Check your invoice details."
      );
      setPanel("edit");
      return false;
    }
    return true;
  }
  async function sendToStudio() {
    if (!checkInput() || busy) return;
    setBusy("email");
    setNotice("");
    try {
      const response = await fetch("/api/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await response.json();
      setError(!response.ok || !result.ok);
      setNotice(
        result.message || "The email could not be sent. Please try again."
      );
    } catch {
      setError(true);
      setNotice(
        "Could not reach the email service. You can still download your PDF."
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="finance-demo">
      <div className="finance-demo-heading">
        <div className="finance-heading-icon">
          <ReceiptText size={22} />
        </div>
        <div>
          <h3>A brief becomes a beautiful invoice.</h3>
          <p>Change the numbers. The invoice does the maths.</p>
        </div>
        <span className="finance-live">
          <span /> Live calculation
        </span>
      </div>
      <MobilePanelTabs panel={panel} setPanel={setPanel} />
      <div className="finance-workspace" data-panel={panel}>
        <div className="finance-editor">
          <div className="finance-section-heading">
            <span>01 / Make it yours</span>
            <button
              type="button"
              className="finance-icon-button"
              aria-label="Reset invoice"
              onClick={() => {
                setInput(defaultInvoice());
                setNotice("");
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="finance-field-grid">
            <label className="finance-field">
              <span>Client / company</span>
              <input
                maxLength={80}
                value={input.clientName}
                onChange={event => update("clientName", event.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="finance-field">
              <span>
                Client email <small>optional</small>
              </span>
              <input
                type="email"
                maxLength={120}
                placeholder="you@company.com"
                value={input.clientEmail}
                onChange={event => update("clientEmail", event.target.value)}
                autoComplete="off"
              />
            </label>
          </div>
          <div className="finance-section-heading finance-items-heading">
            <span>02 / The work</span>
            <span>{input.items.length} of 8 items</span>
          </div>
          <div className="finance-line-items">
            {input.items.map((item, index) => (
              <div className="finance-line-item" key={index}>
                <div className="finance-line-top">
                  <label className="finance-field">
                    <span>Item {index + 1}</span>
                    <input
                      aria-label={`Item ${index + 1} description`}
                      maxLength={100}
                      value={item.description}
                      onChange={event =>
                        updateItem(index, { description: event.target.value })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="finance-icon-button finance-remove"
                    aria-label={`Remove item ${index + 1}`}
                    disabled={input.items.length === 1}
                    onClick={() =>
                      update(
                        "items",
                        input.items.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="finance-line-values">
                  <NumberField
                    label={`Quantity ${index + 1}`}
                    value={item.quantity}
                    max={1000}
                    onChange={quantity => updateItem(index, { quantity })}
                  />
                  <NumberField
                    label={`Rate ${index + 1}`}
                    value={item.rate}
                    onChange={rate => updateItem(index, { rate })}
                  />
                  <span className="finance-line-total">
                    <small>Amount</small>
                    <strong>
                      {money(totals.lines[index], input.currency)}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="finance-text-button"
            disabled={input.items.length >= 8}
            onClick={() =>
              update("items", [
                ...input.items,
                { description: "New service", quantity: 1, rate: 100 },
              ])
            }
          >
            <Plus size={16} /> Add item
          </button>
          <div className="finance-rate-grid">
            <NumberField
              label="Discount"
              suffix="%"
              value={input.discountRate}
              max={100}
              onChange={value => update("discountRate", value)}
            />
            <NumberField
              label="Tax"
              suffix="%"
              value={input.taxRate}
              max={100}
              onChange={value => update("taxRate", value)}
            />
            <label className="finance-field">
              <span>Currency</span>
              <select
                value={input.currency}
                onChange={event =>
                  update("currency", event.target.value as Currency)
                }
              >
                <option value="USD">USD $</option>
                <option value="INR">INR ₹</option>
              </select>
            </label>
          </div>
          <details className="finance-extra">
            <summary>
              Dates & sender details <ChevronDown size={15} />
            </summary>
            <div className="finance-field-grid">
              <label className="finance-field">
                <span>Invoice number</span>
                <input
                  maxLength={32}
                  value={input.number}
                  onChange={event => update("number", event.target.value)}
                />
              </label>
              <label className="finance-field">
                <span>Studio name</span>
                <input
                  maxLength={80}
                  value={input.sellerName}
                  onChange={event => update("sellerName", event.target.value)}
                />
              </label>
              <label className="finance-field">
                <span>Sender email</span>
                <input
                  type="email"
                  maxLength={120}
                  value={input.sellerEmail}
                  onChange={event => update("sellerEmail", event.target.value)}
                />
              </label>
              <label className="finance-field">
                <span>Issued</span>
                <input
                  type="date"
                  value={input.issueDate}
                  onChange={event => update("issueDate", event.target.value)}
                />
              </label>
              <label className="finance-field">
                <span>Due</span>
                <input
                  type="date"
                  min={input.issueDate}
                  value={input.dueDate}
                  onChange={event => update("dueDate", event.target.value)}
                />
              </label>
            </div>
            <p>
              Tax is your chosen rate, applied after the discount. Currency
              changes the unit, without converting amounts.
            </p>
          </details>
          <button
            type="button"
            className="finance-preview-button"
            onClick={() => setPanel("preview")}
          >
            Preview invoice <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="finance-preview">
          <div className="finance-preview-toolbar">
            <span>
              <FileText size={15} /> Your invoice
            </span>
            <div
              className="finance-template-switch"
              aria-label="Invoice design"
            >
              <button
                type="button"
                aria-pressed={input.template === "studio"}
                onClick={() => update("template", "studio")}
              >
                Studio
              </button>
              <button
                type="button"
                aria-pressed={input.template === "minimal"}
                onClick={() => update("template", "minimal")}
              >
                Minimal
              </button>
            </div>
          </div>
          <div className={`finance-paper finance-paper-${input.template}`}>
            <div className="finance-paper-top">
              <span className="finance-paper-brand">
                {input.sellerName || "Your studio"}
                <small>{input.sellerEmail}</small>
              </span>
              <span className="finance-paper-word">
                Invoice<small>{input.number}</small>
              </span>
            </div>
            <div className="finance-paper-client">
              <div>
                <small>BILL TO</small>
                <strong>{input.clientName || "Your client"}</strong>
                {input.clientEmail && <span>{input.clientEmail}</span>}
              </div>
              <div>
                <small>DUE DATE</small>
                <strong>{input.dueDate || "—"}</strong>
              </div>
            </div>
            <div className="finance-paper-lines">
              <div className="finance-paper-labels">
                <span>Description</span>
                <span>Amount</span>
              </div>
              {input.items.map((item, index) => (
                <div key={index}>
                  <span>
                    {item.description || "Untitled item"}
                    <small>
                      {item.quantity} ×{" "}
                      {money(toMinor(item.rate), input.currency)}
                    </small>
                  </span>
                  <strong>{money(totals.lines[index], input.currency)}</strong>
                </div>
              ))}
            </div>
            <div className="finance-paper-totals">
              <span>
                Subtotal{" "}
                <strong>{money(totals.subtotal, input.currency)}</strong>
              </span>
              <span>
                Discount ({input.discountRate}%){" "}
                <strong>−{money(totals.discount, input.currency)}</strong>
              </span>
              <span>
                Tax ({input.taxRate}%){" "}
                <strong>{money(totals.tax, input.currency)}</strong>
              </span>
              <div className="finance-paper-due">
                <span>Total due</span>
                <strong>{money(totals.total, input.currency)}</strong>
              </div>
            </div>
            <div className="finance-paper-footer">
              Thanks for making good things with us.
              <span>Sample invoice · no payment due</span>
            </div>
          </div>
          <div className="finance-export">
            {invoiceDownload.url ? (
              <a
                className="finance-primary-button"
                href={invoiceDownload.url}
                download={`${cleanFilename(input.number)}-sample.pdf`}
              >
                <ArrowDownToLine size={17} /> Download invoice PDF
              </a>
            ) : (
              <button
                type="button"
                className="finance-primary-button"
                disabled={validation.success && !invoiceDownload.failed}
                onClick={() => {
                  if (checkInput()) invoiceDownload.retry();
                }}
              >
                {validation.success && !invoiceDownload.failed && (
                  <LoaderCircle size={17} className="finance-spinner" />
                )}
                {!validation.success
                  ? "Check invoice details"
                  : invoiceDownload.failed
                    ? "Retry PDF download"
                    : "Preparing your PDF…"}
              </button>
            )}
            {invoiceDownload.failed && (
              <p role="alert">
                Could not prepare your PDF. Check your connection and retry.
              </p>
            )}
            {invoiceDownload.url && (
              <a
                className="finance-pdf-fallback"
                href={invoiceDownload.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open PDF in a new tab <ArrowUpRight size={13} />
              </a>
            )}
            <a
              className="finance-secondary-button"
              href={gmailInvoiceUrl(input)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={event => {
                if (!checkInput()) event.preventDefault();
              }}
            >
              <BrandLogo name="gmail" size={18} /> Open Gmail draft{" "}
              <ArrowUpRight size={14} />
            </a>
            {emailAvailable && (
              <button
                type="button"
                className="finance-secondary-button"
                onClick={sendToStudio}
                disabled={busy !== null}
              >
                {busy === "email" ? (
                  <LoaderCircle size={16} className="finance-spinner" />
                ) : (
                  <Send size={16} />
                )}{" "}
                Send to studio inbox
              </button>
            )}
            <p>
              Gmail opens a ready-to-edit message. Attach the downloaded PDF,
              then send it when you're ready.
            </p>
          </div>
        </div>
      </div>
      {notice && (
        <p
          className={`finance-notice ${error ? "finance-error" : ""}`}
          role={error ? "alert" : "status"}
        >
          {!error && <Check size={16} />}
          {notice}
        </p>
      )}
      <div className="finance-bottom-strip">
        <span>
          <Check size={14} /> Editable items
        </span>
        <span>
          <Check size={14} /> Real PDF
        </span>
        <span>
          <Check size={14} /> Gmail draft
        </span>
      </div>
    </div>
  );
}

export function PayrollDemo() {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    sampleEmployees.map(employee => ({ ...employee }))
  );
  const [selectedId, setSelectedId] = useState(sampleEmployees[0].id);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [panel, setPanel] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(false);
  const employee = employees.find(item => item.id === selectedId)!;
  const pay = calculatePayroll(employee);
  const teamPay = employees.reduce(
    (sum, item) => sum + calculatePayroll(item).net,
    0
  );
  function update(patch: Partial<Employee>) {
    setEmployees(current =>
      current.map(item =>
        item.id === selectedId ? { ...item, ...patch } : item
      )
    );
    setNotice("");
  }
  async function download() {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      const { createPayslipPdf } = await import("@shared/finance-pdf");
      const pdf = await createPayslipPdf(employee, currency);
      pdf.save(`${cleanFilename(employee.name)}-sample-payslip.pdf`);
      setError(false);
      setNotice(`Payslip ready for ${employee.name}.`);
    } catch {
      setError(true);
      setNotice("The payslip could not be created. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="finance-demo">
      <div className="finance-demo-heading">
        <div className="finance-heading-icon">
          <Users size={22} />
        </div>
        <div>
          <h3>Five people. One effortless payday.</h3>
          <p>Adjust pay, see the calculation, download the payslip.</p>
        </div>
        <span className="finance-live">
          <span /> Sample team
        </span>
      </div>
      <div className="finance-payroll-top">
        <label className="finance-field">
          <span>Team member</span>
          <select
            value={selectedId}
            onChange={event => {
              setSelectedId(event.target.value);
              setNotice("");
            }}
          >
            {employees.map(person => (
              <option value={person.id} key={person.id}>
                {person.name} · {person.role}
              </option>
            ))}
          </select>
        </label>
        <div className="finance-team-total">
          <small>TEAM TAKE-HOME / {employees.length} PEOPLE</small>
          <strong>{money(teamPay, currency)}</strong>
        </div>
      </div>
      <MobilePanelTabs panel={panel} setPanel={setPanel} preview="Payslip" />
      <div className="finance-workspace" data-panel={panel}>
        <div className="finance-editor">
          <div className="finance-employee">
            <span className="finance-avatar">{employee.initials}</span>
            <div>
              <strong>{employee.name}</strong>
              <span>
                {employee.role} · {employee.id}
              </span>
            </div>
            <button
              type="button"
              className="finance-icon-button"
              aria-label={`Reset ${employee.name}'s pay`}
              onClick={() => {
                update({
                  ...sampleEmployees.find(item => item.id === selectedId)!,
                });
              }}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="finance-section-heading">
            <span>01 / Earnings</span>
            <label className="finance-currency-label">
              Currency
              <select
                aria-label="Payroll currency"
                value={currency}
                onChange={event => {
                  setCurrency(event.target.value as Currency);
                  setNotice("");
                }}
              >
                <option value="USD">USD</option>
                <option value="INR">INR</option>
              </select>
            </label>
          </div>
          <div className="finance-field-grid">
            <NumberField
              label="Monthly base pay"
              value={employee.base}
              onChange={base => update({ base })}
            />
            <NumberField
              label="Bonus"
              value={employee.bonus}
              onChange={bonus => update({ bonus })}
            />
            <NumberField
              label="Overtime hours"
              value={employee.overtimeHours}
              max={200}
              step="0.5"
              onChange={overtimeHours => update({ overtimeHours })}
            />
            <NumberField
              label="Rate per extra hour"
              value={employee.overtimeRate}
              max={10000}
              onChange={overtimeRate => update({ overtimeRate })}
            />
          </div>
          <div className="finance-section-heading">
            <span>02 / Deductions</span>
          </div>
          <div className="finance-field-grid">
            <NumberField
              label="Unpaid leave"
              suffix="days"
              value={employee.absentDays}
              max={22}
              step="0.5"
              onChange={absentDays => update({ absentDays })}
            />
            <NumberField
              label="Other deductions"
              value={employee.deductions}
              onChange={deductions => update({ deductions })}
            />
          </div>
          <details className="finance-extra">
            <summary>
              How the maths works <ChevronDown size={15} />
            </summary>
            <p>
              Gross pay = base + bonus + overtime. Unpaid leave = base ÷{" "}
              {PAYROLL_WORK_DAYS} workdays × days absent. Take-home = gross −
              leave − other deductions. Deductions are capped at available
              earnings.
            </p>
            <p>
              This sample uses your flat deductions. It does not calculate
              statutory tax or benefits. Currency changes the unit, without
              converting amounts.
            </p>
          </details>
          <button
            type="button"
            className="finance-preview-button"
            onClick={() => setPanel("preview")}
          >
            View payslip <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="finance-preview">
          <div className="finance-preview-toolbar">
            <span>
              <FileText size={15} /> Your payslip
            </span>
            <span className="finance-period">{PAYROLL_PERIOD}</span>
          </div>
          <div className="finance-payslip">
            <div className="finance-payslip-header">
              <span>
                Nook Studio<small>MONTHLY PAY STATEMENT</small>
              </span>
              <span className="finance-sample-label">SAMPLE</span>
            </div>
            <div className="finance-payslip-person">
              <strong>{employee.name}</strong>
              <span>
                {employee.id} · {employee.role}
              </span>
            </div>
            <div className="finance-net-pay">
              <span>Take-home pay</span>
              <strong>{money(pay.net, currency)}</strong>
              <small>{PAYROLL_PERIOD}</small>
            </div>
            <dl className="finance-pay-breakdown">
              <div>
                <dt>Base salary</dt>
                <dd>{money(pay.base, currency)}</dd>
              </div>
              <div>
                <dt>Bonus</dt>
                <dd>{money(pay.bonus, currency)}</dd>
              </div>
              <div>
                <dt>
                  Overtime <small>{employee.overtimeHours} hrs</small>
                </dt>
                <dd>{money(pay.overtime, currency)}</dd>
              </div>
              <div className="finance-subtotal">
                <dt>Gross earnings</dt>
                <dd>{money(pay.gross, currency)}</dd>
              </div>
              <div>
                <dt>
                  Unpaid leave <small>{pay.absentDays} days</small>
                </dt>
                <dd>−{money(pay.absence, currency)}</dd>
              </div>
              <div>
                <dt>Other deductions</dt>
                <dd>−{money(pay.deductions, currency)}</dd>
              </div>
            </dl>
            <div className="finance-payslip-foot">
              Fictional team · illustrative pay calculation
            </div>
          </div>
          <div className="finance-export">
            <button
              type="button"
              className="finance-primary-button"
              onClick={download}
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle size={17} className="finance-spinner" />
              ) : (
                <ArrowDownToLine size={17} />
              )}
              {busy ? "Creating payslip…" : "Download payslip PDF"}
            </button>
            <button
              type="button"
              className="finance-secondary-button"
              onClick={() => {
                saveText(
                  payrollCsv(employees, currency),
                  "nook-studio-sample-payroll.csv",
                  "text/csv;charset=utf-8"
                );
                setError(false);
                setNotice(
                  "Payroll CSV ready, including all five team members and your edits."
                );
              }}
            >
              <ArrowDownToLine size={17} /> Export all 5 as CSV
            </button>
          </div>
        </div>
      </div>
      {notice && (
        <p
          className={`finance-notice ${error ? "finance-error" : ""}`}
          role={error ? "alert" : "status"}
        >
          {!error && <Check size={16} />}
          {notice}
        </p>
      )}
      <div className="finance-bottom-strip">
        <span>
          <Check size={14} /> 5 editable profiles
        </span>
        <span>
          <Check size={14} /> Instant net pay
        </span>
        <span>
          <Check size={14} /> PDF + CSV
        </span>
      </div>
    </div>
  );
}

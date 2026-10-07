import { useEffect, useState } from "react";
import { invoiceSchema, type InvoiceInput } from "@shared/finance";

/** Prepare before the click so saving stays a native, user-initiated download. */
export function useInvoiceDownload(input: InvoiceInput) {
  const key = JSON.stringify(input);
  const [attempt, setAttempt] = useState(0);
  const [file, setFile] = useState({ key: "", url: "", failed: false });
  useEffect(() => {
    let cancelled = false;
    let objectUrl = "";
    const timer = window.setTimeout(async () => {
      const parsed = invoiceSchema.safeParse(JSON.parse(key));
      if (!parsed.success) return;
      try {
        const { createInvoicePdf } = await import("@shared/finance-pdf");
        const pdf = await createInvoicePdf(parsed.data);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(pdf.output("blob"));
        setFile({ key, url: objectUrl, failed: false });
      } catch {
        if (!cancelled) setFile({ key, url: "", failed: true });
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [key, attempt]);
  return {
    url: file.key === key ? file.url : "",
    failed: file.key === key && file.failed,
    retry: () => {
      setFile({ key: "", url: "", failed: false });
      setAttempt(value => value + 1);
    },
  };
}

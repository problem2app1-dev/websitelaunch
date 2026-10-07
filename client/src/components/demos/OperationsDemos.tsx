import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  AudioLines,
  Check,
  CheckCheck,
  Clock3,
  Headphones,
  Mic,
  Package,
  PhoneOff,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import {
  aggregateDashboard,
  ATTENDANCE_STORAGE_KEY,
  attendanceCsv,
  attendanceEmployees,
  createAttendanceDay,
  dashboardChannels,
  durationLabel,
  formatWarehouseMoney,
  isPunchedIn,
  localDay,
  makeDashboardData,
  parseAttendanceDay,
  qualifyWarehouseEnquiry,
  recordPunch,
  warehouseProducts,
  workedMilliseconds,
  type AttendanceDay,
  type DashboardChannel,
  type DashboardPeriod,
  type EmployeeId,
  type WarehouseProductId,
} from "@/lib/operations";
import "./operations-demos.css";

function downloadText(
  contents: string,
  filename: string,
  type = "text/plain;charset=utf-8"
) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
const shortDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
const timeLabel = (time: number) =>
  new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function AttendanceDemo() {
  const [now, setNow] = useState(Date.now);
  const [day, setDay] = useState<AttendanceDay>(() => {
    try {
      return parseAttendanceDay(
        localStorage.getItem(ATTENDANCE_STORAGE_KEY),
        Date.now()
      );
    } catch {
      return createAttendanceDay(Date.now());
    }
  });
  const [message, setMessage] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const working = attendanceEmployees.filter(employee =>
    isPunchedIn(day.sessions[employee.id])
  ).length;
  const total = attendanceEmployees.reduce(
    (sum, employee) => sum + workedMilliseconds(day.sessions[employee.id], now),
    0
  );
  const completed = attendanceEmployees.reduce(
    (sum, employee) =>
      sum +
      day.sessions[employee.id].filter(session => session.out !== null).length,
    0
  );

  useEffect(() => {
    try {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(day));
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, [day]);

  useEffect(() => {
    const interval = window.setInterval(
      () => {
        const timestamp = Date.now();
        setNow(timestamp);
        setDay(previous =>
          previous.day === localDay(timestamp)
            ? previous
            : createAttendanceDay(timestamp)
        );
      },
      working ? 1000 : 60000
    );
    return () => window.clearInterval(interval);
  }, [working]);

  function punch(id: EmployeeId) {
    const timestamp = Date.now();
    const active =
      day.day === localDay(timestamp) && isPunchedIn(day.sessions[id]);
    const employee = attendanceEmployees.find(person => person.id === id)!;
    setDay(previous =>
      recordPunch(previous, id, active ? "out" : "in", timestamp)
    );
    setNow(timestamp);
    setMessage(
      `${employee.name} punched ${active ? "out" : "in"} at ${timeLabel(timestamp)}.`
    );
  }

  function reset() {
    const timestamp = Date.now();
    setDay(createAttendanceDay(timestamp));
    setNow(timestamp);
    setMessage("This demo's local attendance history has been cleared.");
  }

  return (
    <section
      className="op-demo attendance-demo"
      aria-label="Interactive attendance demo"
    >
      <div className="op-head">
        <div>
          <span className="op-eyebrow">
            <span className="op-status-dot" /> The daily roll call
          </span>
          <h2>Good work starts here.</h2>
          <p>Punch someone in. Watch their time add up.</p>
        </div>
        <div className="op-date">
          <Clock3 size={17} />
          <span>
            {new Date(now).toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
            <small>Your device time</small>
          </span>
        </div>
      </div>
      <div className="op-stat-grid">
        <div className="op-stat">
          <span>Working now</span>
          <strong>
            {working}
            <small> / 5</small>
          </strong>
          <span className="op-caption">fictional teammates</span>
        </div>
        <div className="op-stat">
          <span>Time tracked</span>
          <strong className="op-time-total">{durationLabel(total)}</strong>
          <span className="op-caption">across the whole team</span>
        </div>
        <div className="op-stat">
          <span>Finished shifts</span>
          <strong>{completed}</strong>
          <span className="op-caption">breaks excluded</span>
        </div>
      </div>
      <div className="op-roster" aria-label="Five sample employees">
        {attendanceEmployees.map(employee => {
          const sessions = day.sessions[employee.id];
          const active = isPunchedIn(sessions);
          const last = sessions[sessions.length - 1];
          return (
            <div
              className={`op-person ${active ? "is-working" : ""}`}
              key={employee.id}
            >
              <span
                className={`op-avatar ${employee.color}`}
                aria-hidden="true"
              >
                {employee.initials}
              </span>
              <div className="op-person-name">
                <strong>{employee.name}</strong>
                <span>{employee.role}</span>
              </div>
              <div className="op-person-hours">
                <strong>
                  {durationLabel(workedMilliseconds(sessions, now))}
                </strong>
                <span>
                  {active
                    ? `In at ${timeLabel(last.in)}`
                    : last?.out
                      ? `Out at ${timeLabel(last.out)}`
                      : "Not started"}
                </span>
              </div>
              <button
                className={`op-punch ${active ? "is-out" : ""}`}
                onClick={() => punch(employee.id)}
                aria-label={`Punch ${employee.name} ${active ? "out" : "in"}`}
              >
                {active ? <Check size={15} /> : <Clock3 size={15} />}
                {active ? "Punch out" : "Punch in"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="op-footer-actions">
        <button
          className="op-secondary"
          onClick={() => {
            downloadText(
              attendanceCsv(day, now),
              `problem2app-attendance-${day.day}.csv`,
              "text/csv;charset=utf-8"
            );
            setMessage("Attendance CSV downloaded.");
          }}
        >
          <ArrowDownToLine size={16} /> Export timesheet
        </button>
        <button className="op-text-button" onClick={reset}>
          <RotateCcw size={15} /> Reset local demo
        </button>
      </div>
      <p className="op-announcement" role="status">
        {message || "Choose a teammate to start a shift."}
      </p>
      <p className="op-footnote">
        {storageAvailable
          ? "Saved only in this browser for today. "
          : "Browser storage is unavailable; punches stay in this open page. "}
        Export your timesheet before resetting or starting a new day.
      </p>
    </section>
  );
}

export function DashboardDemo() {
  const [period, setPeriod] = useState<DashboardPeriod>(30);
  const [channel, setChannel] = useState<DashboardChannel | "All">("All");
  const [selected, setSelected] = useState(0);
  const records = useMemo(() => makeDashboardData(), []);
  const dashboard = useMemo(
    () => aggregateDashboard(records, period, channel),
    [records, period, channel]
  );
  const bucket =
    dashboard.buckets[Math.min(selected, dashboard.buckets.length - 1)];
  const id = useId().replaceAll(":", "");
  const max =
    Math.max(...dashboard.buckets.map(point => point.revenue), 1) * 1.22;
  const points = dashboard.buckets.map((point, index) => ({
    x: 28 + index * (584 / Math.max(dashboard.buckets.length - 1, 1)),
    y: 186 - (point.revenue / max) * 156,
  }));
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const focusPoint = points[Math.min(selected, points.length - 1)];
  const highest = dashboard.channels[0];

  function changePeriod(value: DashboardPeriod) {
    setPeriod(value);
    setSelected(0);
  }
  function changeChannel(value: DashboardChannel | "All") {
    setChannel(value);
    setSelected(0);
  }

  return (
    <section
      className="op-demo dashboard-demo"
      aria-label="Interactive sample business dashboard"
    >
      <div className="op-head">
        <div>
          <span className="op-eyebrow">
            <Activity size={14} /> The founder's morning view
          </span>
          <h2>Your business. In focus.</h2>
          <p>Change the view. Every number recalculates.</p>
        </div>
        <span className="op-badge">Sample company · USD</span>
      </div>
      <div className="op-dashboard-filters">
        <div className="op-periods" aria-label="Reporting period">
          {([7, 30, 90] as const).map(value => (
            <button
              key={value}
              aria-pressed={period === value}
              onClick={() => changePeriod(value)}
            >
              {value} days
            </button>
          ))}
        </div>
        <label className="op-filter-label" htmlFor={`${id}-channel`}>
          Channel
          <select
            id={`${id}-channel`}
            value={channel}
            onChange={event =>
              changeChannel(event.target.value as DashboardChannel | "All")
            }
          >
            <option value="All">All channels</option>
            {dashboardChannels.map(name => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="op-stat-grid">
        <div className="op-stat op-stat-featured">
          <span>Revenue</span>
          <strong>{money(dashboard.revenue)}</strong>
          <span className="op-caption">
            {dashboard.growth !== null
              ? `${dashboard.growth >= 0 ? "+" : ""}${dashboard.growth.toFixed(1)}% vs previous ${period} days`
              : "No previous period"}
          </span>
        </div>
        <div className="op-stat">
          <span>Enquiries</span>
          <strong>{dashboard.leads.toLocaleString()}</strong>
          <span className="op-caption">
            {dashboard.orders.toLocaleString()} became orders
          </span>
        </div>
        <div className="op-stat">
          <span>Conversion</span>
          <strong>
            {dashboard.conversion.toFixed(1)}
            <small>%</small>
          </strong>
          <span className="op-caption">orders ÷ enquiries</span>
        </div>
      </div>
      <div className="op-dashboard-body">
        <div className="op-chart-panel">
          <div className="op-chart-top">
            <div>
              <h3>Revenue over time</h3>
              <span>
                {shortDate(dashboard.start)} — {shortDate(dashboard.end)}
              </span>
            </div>
            <span className="op-chart-legend">
              <i /> {channel === "All" ? "All channels" : channel}
            </span>
          </div>
          <svg
            className="op-chart"
            viewBox="0 0 640 218"
            aria-hidden="true"
            onClick={event => {
              const box = event.currentTarget.getBoundingClientRect();
              const x = ((event.clientX - box.left) / box.width) * 640;
              setSelected(
                Math.max(
                  0,
                  Math.min(
                    points.length - 1,
                    Math.round(((x - 28) / 584) * (points.length - 1))
                  )
                )
              );
            }}
          >
            <defs>
              <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9570e5" stopOpacity=".28" />
                <stop offset="100%" stopColor="#c3acf3" stopOpacity=".015" />
              </linearGradient>
              <linearGradient id={`${id}-line`}>
                <stop stopColor="#b095ea" />
                <stop offset="100%" stopColor="#6c45c4" />
              </linearGradient>
            </defs>
            {[54, 98, 142, 186].map(y => (
              <path d={`M28 ${y} H612`} className="op-chart-grid" key={y} />
            ))}
            <path d={`${line} L612,186 L28,186 Z`} fill={`url(#${id}-fill)`} />
            <path
              d={line}
              fill="none"
              stroke={`url(#${id}-line)`}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={`M${focusPoint.x} 26 V186`}
              stroke="#a995cf"
              strokeDasharray="4 5"
            />
            {points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={index === selected ? 7 : 4}
                fill={index === selected ? "#7556d9" : "#fff"}
                stroke="#7556d9"
                strokeWidth="2"
              />
            ))}
            <text x="28" y="212">
              {shortDate(dashboard.start)}
            </text>
            <text x="612" y="212" textAnchor="end">
              {shortDate(dashboard.end)}
            </text>
          </svg>
          <label className="op-chart-scrub" htmlFor={`${id}-point`}>
            <span>
              Explore a {period === 7 ? "day" : "period"}
              <small>Drag to inspect</small>
            </span>
            <input
              id={`${id}-point`}
              type="range"
              min={0}
              max={dashboard.buckets.length - 1}
              step={1}
              value={selected}
              onChange={event => setSelected(Number(event.target.value))}
              aria-valuetext={`${shortDate(bucket.start)}${bucket.end !== bucket.start ? ` to ${shortDate(bucket.end)}` : ""}: ${money(bucket.revenue)} revenue`}
            />
          </label>
          <div className="op-chart-result" aria-live="polite">
            <span>
              {shortDate(bucket.start)}
              {bucket.end !== bucket.start ? `–${shortDate(bucket.end)}` : ""}
            </span>
            <strong>{money(bucket.revenue)}</strong>
            <span>
              {bucket.orders} orders · {bucket.leads} enquiries
            </span>
          </div>
        </div>
        <aside className="op-insights">
          <div className="op-insight-symbol">
            <Sparkles size={22} />
          </div>
          <span className="op-eyebrow">A useful signal</span>
          <h3>
            {channel === "All"
              ? `${highest.name} is your top revenue channel.`
              : `${dashboard.conversion.toFixed(1)}% of ${channel.toLowerCase()} enquiries convert.`}
          </h3>
          <p>
            {channel === "All"
              ? `${highest.name} generated ${money(highest.revenue)} — ${((highest.revenue / dashboard.revenue) * 100).toFixed(0)}% of this view. A good place to review your next campaign.`
              : `${dashboard.orders} orders came from ${dashboard.leads} enquiries in this view. Review the enquiries that didn't become orders for follow-up opportunities.`}
          </p>
          <div className="op-channel-breakdown">
            {dashboard.channels
              .filter(item => item.revenue > 0)
              .map(item => (
                <div key={item.name}>
                  <span>{item.name}</span>
                  <strong>{money(item.revenue)}</strong>
                </div>
              ))}
          </div>
          <span className="op-footnote">
            Calculated from sample data. These are rules-based insights.
          </span>
        </aside>
      </div>
    </section>
  );
}

type LiveVapi = InstanceType<(typeof import("@vapi-ai/web"))["default"]>;
type TranscriptLine = { role: "user" | "assistant"; text: string };

export function VoiceDemo() {
  const [productId, setProductId] = useState<WarehouseProductId>("boxes");
  const [quantity, setQuantity] = useState("500");
  const [business, setBusiness] = useState("Sunday Supply");
  const [urgency, setUrgency] = useState<"standard" | "urgent">("standard");
  const [result, setResult] =
    useState<ReturnType<typeof qualifyWarehouseEnquiry>>(null);
  const [handoff, setHandoff] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "connected" | "ended" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const vapiRef = useRef<LiveVapi | null>(null);
  const attemptRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const id = useId();
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY?.trim();
  const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID?.trim();
  const voiceConfigured = Boolean(publicKey && assistantId);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  function clearCallTimeout() {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }
  function stopReading() {
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      attemptRef.current++;
      clearCallTimeout();
      const instance = vapiRef.current;
      if (instance) {
        instance.removeAllListeners();
        void instance.stop().catch(() => {});
      }
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  function invalidatePreview() {
    setResult(null);
    setHandoff(false);
    setFormError("");
    stopReading();
  }

  function runPreview(event: FormEvent) {
    event.preventDefault();
    stopReading();
    const next = qualifyWarehouseEnquiry(
      productId,
      Number(quantity),
      business,
      urgency
    );
    if (!next) {
      setFormError(
        "Enter a business name and a whole quantity from 1 to 100,000."
      );
      return;
    }
    setFormError("");
    setResult(next);
    setHandoff(false);
  }

  function listen() {
    if (!result || !canSpeak) return;
    if (speaking) {
      stopReading();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(result.answer);
    utterance.rate = 1;
    utterance.onend = () => {
      if (mountedRef.current) setSpeaking(false);
    };
    utterance.onerror = () => {
      if (mountedRef.current) setSpeaking(false);
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  async function startCall() {
    if (
      !voiceConfigured ||
      !publicKey ||
      !assistantId ||
      status === "connecting" ||
      status === "connected"
    )
      return;
    stopReading();
    const attempt = ++attemptRef.current;
    const valid = () => mountedRef.current && attemptRef.current === attempt;
    setStatus("connecting");
    setError("");
    setTranscript([]);
    try {
      if (vapiRef.current) {
        const previous = vapiRef.current;
        vapiRef.current = null;
        previous.removeAllListeners();
        await previous.stop();
      }
      const { default: Vapi } = await import("@vapi-ai/web");
      if (!valid()) return;
      const instance = new Vapi(publicKey);
      vapiRef.current = instance;
      instance.on("call-start", () => {
        if (!valid()) {
          void instance.stop().catch(() => {});
          return;
        }
        clearCallTimeout();
        setStatus("connected");
      });
      instance.on("call-end", () => {
        if (valid()) {
          clearCallTimeout();
          setStatus("ended");
        }
      });
      instance.on("error", () => {
        if (valid()) {
          attemptRef.current++;
          clearCallTimeout();
          setError(
            "The voice session couldn't connect. Check microphone access and try again, or use the guided preview below."
          );
          setStatus("error");
          instance.removeAllListeners();
          void instance.stop().catch(() => {});
        }
      });
      instance.on(
        "message",
        (message: {
          type?: string;
          transcriptType?: string;
          role?: string;
          transcript?: string;
        }) => {
          if (
            valid() &&
            message.type === "transcript" &&
            message.transcriptType === "final" &&
            message.transcript &&
            (message.role === "user" || message.role === "assistant")
          )
            setTranscript(previous => [
              ...previous.slice(-19),
              {
                role: message.role as TranscriptLine["role"],
                text: message.transcript!,
              },
            ]);
        }
      );
      timeoutRef.current = window.setTimeout(() => {
        if (valid()) {
          attemptRef.current++;
          setStatus("error");
          setError(
            "The connection took too long. You can retry, or explore the guided preview below."
          );
          instance.removeAllListeners();
          void instance.stop().catch(() => {});
        }
      }, 30000);
      await instance.start(assistantId);
      if (!valid()) {
        instance.removeAllListeners();
        void instance.stop().catch(() => {});
      }
    } catch {
      if (valid()) {
        attemptRef.current++;
        clearCallTimeout();
        setStatus("error");
        setError(
          "We couldn't start the voice session. Allow microphone access and try again."
        );
        const failed = vapiRef.current;
        if (failed) {
          failed.removeAllListeners();
          void failed.stop().catch(() => {});
        }
      }
    }
  }

  async function endCall() {
    attemptRef.current++;
    clearCallTimeout();
    const instance = vapiRef.current;
    vapiRef.current = null;
    if (instance) {
      instance.removeAllListeners();
      try {
        await instance.stop();
      } catch {}
    }
    if (mountedRef.current) setStatus("ended");
  }

  function downloadBrief() {
    if (!result) return;
    downloadText(
      `PROBLEM2APP — SAMPLE SALES HANDOFF\n\nBusiness: ${result.business}\nProduct: ${result.product.name}\nQuantity: ${result.quantity}\nSample stock: ${result.product.stock}\nEstimated items total: ${formatWarehouseMoney(result.total)} (USD; shipping excluded)\nPriority: ${result.priority}\nNext step: ${result.next}\n\nAgent response:\n${result.answer}\n\nFictional catalogue. This preview has not sent a quote, reserved stock, or scheduled a callback.\n`,
      "problem2app-warehouse-enquiry.txt"
    );
  }

  return (
    <section
      className="op-demo voice-demo"
      aria-label="Warehouse sales assistant demo"
    >
      <div className="op-head">
        <div>
          <span className="op-eyebrow">
            <Headphones size={14} /> Meet the warehouse concierge
          </span>
          <h2>
            From “is it in stock?”
            <br />
            to a qualified enquiry.
          </h2>
          <p>Stock checked. Quantities understood. Sales brief ready.</p>
        </div>
        <span className="op-badge">
          {voiceConfigured ? "Voice + guided preview" : "Guided preview"}
        </span>
      </div>
      {voiceConfigured && (
        <div className="op-live-voice">
          <div
            className={`op-voice-orb ${status === "connected" ? "is-connected" : ""}`}
            aria-hidden="true"
          >
            <AudioLines size={28} />
          </div>
          <div className="op-live-copy">
            <strong>
              {status === "connected"
                ? "You're connected"
                : status === "connecting"
                  ? "Connecting your microphone…"
                  : status === "ended"
                    ? "Voice session ended"
                    : "Try a live browser conversation"}
            </strong>
            <span>
              Your microphone audio goes to the configured voice service.
              Nothing starts until you tap.
            </span>
          </div>
          <button
            className="op-primary"
            onClick={
              status === "connected" || status === "connecting"
                ? endCall
                : startCall
            }
          >
            {status === "connected" || status === "connecting" ? (
              <>
                <PhoneOff size={16} /> End session
              </>
            ) : (
              <>
                <Mic size={16} /> Start voice
              </>
            )}
          </button>
          <p className="op-call-state" role="status">
            {error ||
              (status === "connecting"
                ? "Allow microphone access if your browser asks."
                : status === "connected"
                  ? "Microphone session active. You can end it at any time."
                  : "")}
          </p>
          {transcript.length > 0 && (
            <div
              className="op-live-transcript"
              role="log"
              aria-label="Live voice transcript"
            >
              {transcript.map((line, index) => (
                <p key={index}>
                  <strong>
                    {line.role === "assistant" ? "Assistant" : "You"}
                  </strong>
                  {line.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="op-warehouse-grid">
        <div className="op-catalogue">
          <span className="op-eyebrow">
            <Package size={14} /> Packhouse · sample catalogue
          </span>
          <h3>
            A small warehouse.{" "}
            <br />A lot of repeat questions.
          </h3>
          <div className="op-stock-list">
            {warehouseProducts.map(product => (
              <button
                type="button"
                aria-pressed={productId === product.id}
                aria-label={`Select ${product.name}`}
                onClick={() => {
                  setProductId(product.id);
                  invalidatePreview();
                }}
                className={productId === product.id ? "is-selected" : ""}
                key={product.id}
              >
                <span className="op-package-thumb" aria-hidden="true">
                  <Package size={26} />
                </span>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.detail}</span>
                </div>
                <span className="op-stock-count">
                  <strong>{product.stock.toLocaleString()}</strong>in stock
                </span>
              </button>
            ))}
          </div>
          <div className="op-preview-steps">
            <span>
              <CheckCheck size={15} /> Check sample inventory
            </span>
            <span>
              <CheckCheck size={15} /> Apply bulk pricing
            </span>
            <span>
              <CheckCheck size={15} /> Prepare a sales handoff
            </span>
          </div>
        </div>
        <div className="op-enquiry-panel">
          <h3>Try a customer enquiry</h3>
          <form onSubmit={runPreview} className="op-enquiry-form">
            <label htmlFor={`${id}-business`}>
              Business name
              <input
                id={`${id}-business`}
                maxLength={80}
                required
                value={business}
                onChange={event => {
                  setBusiness(event.target.value);
                  invalidatePreview();
                }}
              />
            </label>
            <label htmlFor={`${id}-product`}>
              What do you need?
              <select
                id={`${id}-product`}
                value={productId}
                onChange={event => {
                  setProductId(event.target.value as WarehouseProductId);
                  invalidatePreview();
                }}
              >
                {warehouseProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="op-form-pair">
              <label htmlFor={`${id}-quantity`}>
                Quantity
                <input
                  type="number"
                  inputMode="numeric"
                  id={`${id}-quantity`}
                  min={1}
                  max={100000}
                  step={1}
                  required
                  value={quantity}
                  onChange={event => {
                    setQuantity(event.target.value);
                    invalidatePreview();
                  }}
                />
              </label>
              <label htmlFor={`${id}-urgency`}>
                Delivery need
                <select
                  id={`${id}-urgency`}
                  value={urgency}
                  onChange={event => {
                    setUrgency(event.target.value as "standard" | "urgent");
                    invalidatePreview();
                  }}
                >
                  <option value="standard">Standard</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
            </div>
            <button className="op-primary" type="submit">
              Check this enquiry <ArrowUpRight size={17} />
            </button>
            {formError && (
              <p className="op-form-error" role="alert">
                {formError}
              </p>
            )}
          </form>
        </div>
      </div>
      {result && (
        <div className="op-enquiry-result">
          <div className="op-message-preview">
            <span className="op-eyebrow">
              <Sparkles size={14} /> Preview response
            </span>
            <p>{result.answer}</p>
            {canSpeak && (
              <button className="op-text-button" onClick={listen}>
                <Volume2 size={16} />
                {speaking ? "Stop reading" : "Listen to this response"}
              </button>
            )}
          </div>
          <div className="op-sales-brief">
            <span className="op-badge">{result.priority}</span>
            <h3>{result.business}</h3>
            <dl>
              <div>
                <dt>Enquiry value</dt>
                <dd>{formatWarehouseMoney(result.total)}</dd>
              </div>
              <div>
                <dt>Availability</dt>
                <dd>
                  {result.inStock ? "In sample stock" : "Needs sales review"}
                </dd>
              </div>
              <div>
                <dt>Next step</dt>
                <dd>{result.next}</dd>
              </div>
            </dl>
            <div className="op-brief-actions">
              <button className="op-secondary" onClick={() => setHandoff(true)}>
                {handoff ? <Check size={16} /> : <ArrowUpRight size={16} />}
                {handoff ? "Handoff prepared" : "Prepare callback brief"}
              </button>
              <button
                className="op-icon-button"
                onClick={downloadBrief}
                aria-label="Download warehouse sales brief"
              >
                <ArrowDownToLine size={19} />
              </button>
            </div>
            {handoff && (
              <p className="op-footnote" role="status">
                Brief ready to download. No callback has been booked or sent.
              </p>
            )}
          </div>
        </div>
      )}
      <p className="op-footnote op-voice-disclosure">
        Sample inventory · Rules-based enquiry preview · Device-voice audio
      </p>
    </section>
  );
}

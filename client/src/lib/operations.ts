export const attendanceEmployees = [
  {
    id: "maya",
    name: "Maya Patel",
    role: "Design",
    initials: "MP",
    color: "lilac",
  },
  {
    id: "aarav",
    name: "Aarav Shah",
    role: "Engineering",
    initials: "AS",
    color: "peach",
  },
  {
    id: "zoe",
    name: "Zoe Chen",
    role: "Operations",
    initials: "ZC",
    color: "mint",
  },
  {
    id: "leo",
    name: "Leo Martin",
    role: "Sales",
    initials: "LM",
    color: "blue",
  },
  {
    id: "nia",
    name: "Nia Brooks",
    role: "Customer success",
    initials: "NB",
    color: "pink",
  },
] as const;

export type EmployeeId = (typeof attendanceEmployees)[number]["id"];
export type AttendanceSession = { in: number; out: number | null };
export type AttendanceDay = {
  version: 1;
  day: string;
  sessions: Record<EmployeeId, AttendanceSession[]>;
};
export const ATTENDANCE_STORAGE_KEY = "problem2app-attendance-v1";

export function localDay(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function createAttendanceDay(now: number): AttendanceDay {
  return {
    version: 1,
    day: localDay(now),
    sessions: { maya: [], aarav: [], zoe: [], leo: [], nia: [] },
  };
}

export function parseAttendanceDay(
  raw: string | null,
  now: number
): AttendanceDay {
  const fallback = createAttendanceDay(now);
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw);
    if (
      value.version !== 1 ||
      value.day !== localDay(now) ||
      typeof value.sessions !== "object" ||
      !value.sessions
    )
      return fallback;
    for (const employee of attendanceEmployees) {
      const sessions = value.sessions[employee.id];
      if (!Array.isArray(sessions) || sessions.length > 200) return fallback;
      let previousEnd = 0;
      for (let index = 0; index < sessions.length; index++) {
        const session = sessions[index];
        if (
          !session ||
          typeof session.in !== "number" ||
          !Number.isFinite(session.in) ||
          session.in > now ||
          localDay(session.in) !== value.day ||
          session.in < previousEnd
        )
          return fallback;
        if (session.out === null) {
          if (index !== sessions.length - 1) return fallback;
        } else if (
          typeof session.out !== "number" ||
          !Number.isFinite(session.out) ||
          session.out < session.in ||
          session.out > now ||
          localDay(session.out) !== value.day
        ) {
          return fallback;
        }
        previousEnd = session.out ?? session.in;
      }
    }
    return {
      version: 1,
      day: value.day,
      sessions: Object.fromEntries(
        attendanceEmployees.map(employee => [
          employee.id,
          value.sessions[employee.id],
        ])
      ) as AttendanceDay["sessions"],
    };
  } catch {
    return fallback;
  }
}

export function isPunchedIn(sessions: AttendanceSession[]): boolean {
  return sessions.length > 0 && sessions[sessions.length - 1].out === null;
}

export function recordPunch(
  day: AttendanceDay,
  id: EmployeeId,
  action: "in" | "out",
  now: number
): AttendanceDay {
  const current = day.day === localDay(now) ? day : createAttendanceDay(now);
  const sessions = current.sessions[id];
  const active = isPunchedIn(sessions);
  if (
    (action === "in" && active) ||
    (action === "out" && !active) ||
    !Number.isFinite(now) ||
    (action === "in" && sessions.length >= 200)
  )
    return current;
  const last = sessions[sessions.length - 1];
  if (last && now < (last.out ?? last.in)) return current;
  return {
    ...current,
    sessions: {
      ...current.sessions,
      [id]:
        action === "in"
          ? [...sessions, { in: now, out: null }]
          : sessions.map((session, index) =>
              index === sessions.length - 1 ? { ...session, out: now } : session
            ),
    },
  };
}

export function workedMilliseconds(
  sessions: AttendanceSession[],
  now: number
): number {
  return sessions.reduce(
    (sum, session) => sum + Math.max(0, (session.out ?? now) - session.in),
    0
  );
}

export function durationLabel(milliseconds: number): string {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours
    ? `${hours}h ${String(minutes).padStart(2, "0")}m`
    : minutes
      ? `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`
      : `${seconds}s`;
}

export function attendanceCsv(day: AttendanceDay, now: number): string {
  const rows = [
    [
      "Date",
      "Employee",
      "Department",
      "Punch in (ISO)",
      "Punch out (ISO)",
      "Minutes",
      "Status",
    ],
  ];
  for (const employee of attendanceEmployees) {
    const sessions = day.sessions[employee.id];
    if (!sessions.length)
      rows.push([
        day.day,
        employee.name,
        employee.role,
        "",
        "",
        "0",
        "Not started",
      ]);
    for (const session of sessions) {
      rows.push([
        day.day,
        employee.name,
        employee.role,
        new Date(session.in).toISOString(),
        session.out === null ? "" : new Date(session.out).toISOString(),
        (workedMilliseconds([session], now) / 60000).toFixed(2),
        session.out === null ? "Working" : "Completed",
      ]);
    }
  }
  return rows
    .map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}

export const dashboardChannels = ["Website", "Referrals", "Campaigns"] as const;
export type DashboardChannel = (typeof dashboardChannels)[number];
export type DashboardRecord = {
  day: string;
  channel: DashboardChannel;
  revenue: number;
  leads: number;
  orders: number;
};
export type DashboardPeriod = 7 | 30 | 90;

export function makeDashboardData(anchor = new Date()): DashboardRecord[] {
  const result: DashboardRecord[] = [];
  const start = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate()
  );
  for (let i = 179; i >= 0; i--) {
    const date = new Date(start);
    date.setDate(start.getDate() - i);
    dashboardChannels.forEach((channel, channelIndex) => {
      const seed = 179 - i;
      const leads =
        13 + ((seed * 7 + channelIndex * 11) % 19) + Math.floor(seed / 28);
      const orders = Math.max(
        1,
        Math.floor(leads * (0.14 + channelIndex * 0.025)) +
          ((seed + channelIndex) % 3)
      );
      const revenue = orders * (185 + channelIndex * 65 + ((seed * 13) % 90));
      result.push({
        day: localDay(date.getTime()),
        channel,
        revenue,
        leads,
        orders,
      });
    });
  }
  return result;
}

export function aggregateDashboard(
  records: DashboardRecord[],
  period: DashboardPeriod,
  channel: DashboardChannel | "All"
) {
  const dates = [...new Set(records.map(record => record.day))].sort();
  const chosen = dates.slice(-period);
  const previous = dates.slice(-period * 2, -period);
  const currentSet = new Set(chosen);
  const previousSet = new Set(previous);
  const matches = (record: DashboardRecord) =>
    channel === "All" || record.channel === channel;
  const visible = records.filter(
    record => currentSet.has(record.day) && matches(record)
  );
  const preceding = records.filter(
    record => previousSet.has(record.day) && matches(record)
  );
  const total = (items: DashboardRecord[]) =>
    items.reduce(
      (sum, row) => ({
        revenue: sum.revenue + row.revenue,
        leads: sum.leads + row.leads,
        orders: sum.orders + row.orders,
      }),
      { revenue: 0, leads: 0, orders: 0 }
    );
  const summary = total(visible);
  const previousRevenue = total(preceding).revenue;
  const groupSize = period === 7 ? 1 : period === 30 ? 5 : 15;
  const buckets = [];
  for (let i = 0; i < chosen.length; i += groupSize) {
    const groupDates = chosen.slice(i, i + groupSize);
    buckets.push({
      start: groupDates[0],
      end: groupDates[groupDates.length - 1],
      ...total(visible.filter(row => groupDates.includes(row.day))),
    });
  }
  const channelTotals = dashboardChannels
    .map(name => ({
      name,
      ...total(visible.filter(row => row.channel === name)),
    }))
    .sort((a, b) => b.revenue - a.revenue);
  return {
    ...summary,
    buckets,
    channels: channelTotals,
    growth: previousRevenue
      ? ((summary.revenue - previousRevenue) / previousRevenue) * 100
      : null,
    conversion: summary.leads ? (summary.orders / summary.leads) * 100 : 0,
    start: chosen[0],
    end: chosen[chosen.length - 1],
  };
}

export const warehouseProducts = [
  {
    id: "boxes",
    name: "Shipping boxes",
    detail: "12 × 9 × 6 in · kraft",
    stock: 1800,
    unitPrice: 1.25,
    initials: "BX",
  },
  {
    id: "mailers",
    name: "Padded mailers",
    detail: "A4 · recycled paper",
    stock: 620,
    unitPrice: 0.8,
    initials: "PM",
  },
  {
    id: "tape",
    name: "Packing tape",
    detail: "48 mm × 50 m",
    stock: 240,
    unitPrice: 2.4,
    initials: "PT",
  },
] as const;
export type WarehouseProductId = (typeof warehouseProducts)[number]["id"];

export function formatWarehouseMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function qualifyWarehouseEnquiry(
  productId: WarehouseProductId,
  quantity: number,
  business: string,
  urgency: "standard" | "urgent"
) {
  const product = warehouseProducts.find(item => item.id === productId)!;
  const valid =
    Number.isSafeInteger(quantity) &&
    quantity >= 1 &&
    quantity <= 100000 &&
    business.trim().length > 0;
  if (!valid) return null;
  const inStock = quantity <= product.stock;
  const discount = quantity >= 500 ? 0.08 : 0;
  const total =
    Math.round(quantity * product.unitPrice * (1 - discount) * 100) / 100;
  const priority =
    !inStock || urgency === "urgent"
      ? "Sales review"
      : quantity >= 500
        ? "Bulk enquiry"
        : "Quote ready";
  const answer = inStock
    ? `${quantity.toLocaleString()} ${product.name.toLowerCase()} are available in this sample catalogue. The estimated item total is ${formatWarehouseMoney(total)}${discount ? " after an 8% bulk discount" : ""}. ${urgency === "urgent" ? "A sales teammate needs to confirm rush delivery before promising a date." : "Standard dispatch is 2–3 business days; delivery and freight need confirmation."}`
    : `This sample catalogue has ${product.stock.toLocaleString()} ${product.name.toLowerCase()}, which is ${(quantity - product.stock).toLocaleString()} short of your request. I would pass this to sales to discuss a split shipment or restock date. No delivery promise has been made.`;
  return {
    product,
    quantity,
    business: business.trim(),
    inStock,
    discount,
    total,
    priority,
    answer,
    next: !inStock
      ? "Confirm restock or a split shipment"
      : urgency === "urgent"
        ? "Confirm a rush delivery date"
        : "Confirm delivery details and freight",
  };
}

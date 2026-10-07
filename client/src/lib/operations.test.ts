import { describe, expect, it } from "vitest";
import {
  aggregateDashboard,
  attendanceCsv,
  createAttendanceDay,
  formatWarehouseMoney,
  makeDashboardData,
  parseAttendanceDay,
  qualifyWarehouseEnquiry,
  recordPunch,
  workedMilliseconds,
} from "./operations";

const now = new Date(2026, 9, 7, 10).getTime();
describe("attendance clock", () => {
  it("records multiple shifts without counting the break", () => {
    let day = createAttendanceDay(now);
    day = recordPunch(day, "maya", "in", now);
    day = recordPunch(day, "maya", "out", now + 3600000);
    day = recordPunch(day, "maya", "in", now + 7200000);
    expect(workedMilliseconds(day.sessions.maya, now + 9000000)).toBe(5400000);
    expect(attendanceCsv(day, now + 9000000)).toContain('"60.00","Completed"');
    expect(attendanceCsv(day, now + 9000000)).toContain('"30.00","Working"');
  });
  it("ignores duplicate punches, premature punch-out, and clock reversal", () => {
    const blank = createAttendanceDay(now);
    expect(recordPunch(blank, "maya", "out", now)).toBe(blank);
    const active = recordPunch(blank, "maya", "in", now);
    expect(recordPunch(active, "maya", "in", now + 1)).toBe(active);
    expect(recordPunch(active, "maya", "out", now - 1)).toBe(active);
    const complete = recordPunch(active, "maya", "out", now + 1);
    expect(recordPunch(complete, "maya", "out", now + 2)).toBe(complete);
  });
  it("recovers from bad storage and resets yesterday without carrying an active shift", () => {
    const active = recordPunch(createAttendanceDay(now), "maya", "in", now);
    expect(parseAttendanceDay(JSON.stringify(active), now + 1000)).toEqual(
      active
    );
    expect(parseAttendanceDay("not json", now)).toEqual(
      createAttendanceDay(now)
    );
    expect(parseAttendanceDay(JSON.stringify(active), now + 86400000)).toEqual(
      createAttendanceDay(now + 86400000)
    );
    active.sessions.maya.push({ in: now + 1, out: null });
    expect(
      parseAttendanceDay(JSON.stringify(active), now + 1000).sessions.maya
    ).toEqual([]);
  });
  it("exports each session and keeps active timestamps honest", () => {
    const day = recordPunch(createAttendanceDay(now), "maya", "in", now);
    const csv = attendanceCsv(day, now + 90000);
    expect(csv).toContain('"1.50","Working"');
    expect(csv).toContain(new Date(now).toISOString());
    expect(csv).toContain('"Not started"');
  });
});

describe("dashboard aggregation", () => {
  it("period and channel filters recompute source records, totals, and graph buckets", () => {
    const records = makeDashboardData(new Date(now));
    const all = aggregateDashboard(records, 30, "All");
    const website = aggregateDashboard(records, 30, "Website");
    const seven = aggregateDashboard(records, 7, "All");
    expect(all.buckets.reduce((sum, point) => sum + point.revenue, 0)).toBe(
      all.revenue
    );
    expect(all.channels.reduce((sum, point) => sum + point.revenue, 0)).toBe(
      all.revenue
    );
    expect(website.revenue).toBe(
      all.channels.find(channel => channel.name === "Website")?.revenue
    );
    expect(seven.leads).toBeLessThan(all.leads);
    expect(all.buckets).toHaveLength(6);
    expect(seven.buckets).toHaveLength(7);
    expect(all.conversion).toBeCloseTo((all.orders / all.leads) * 100);
  });
  it("has a full preceding 90-day window and handles empty data", () => {
    const records = makeDashboardData(new Date(now));
    expect(aggregateDashboard(records, 90, "All").growth).not.toBeNull();
    expect(aggregateDashboard([], 7, "All")).toMatchObject({
      revenue: 0,
      leads: 0,
      orders: 0,
      growth: null,
      conversion: 0,
      buckets: [],
    });
  });
});

describe("warehouse qualification", () => {
  it("keeps cents consistent in the response and quote formatter", () => {
    const result = qualifyWarehouseEnquiry("mailers", 1, "Studio", "standard")!;
    expect(result.total).toBe(0.8);
    expect(formatWarehouseMoney(result.total)).toBe("$0.80");
    expect(result.answer).toContain(formatWarehouseMoney(result.total));
    expect(formatWarehouseMoney(1234.5)).toBe("$1,234.50");
  });
  it("checks stock, applies bulk pricing, and routes urgent delivery to a person", () => {
    expect(
      qualifyWarehouseEnquiry("boxes", 500, "  Studio  ", "standard")
    ).toMatchObject({
      total: 575,
      discount: 0.08,
      inStock: true,
      business: "Studio",
      priority: "Bulk enquiry",
    });
    expect(
      qualifyWarehouseEnquiry("tape", 300, "Studio", "standard")
    ).toMatchObject({ inStock: false, priority: "Sales review" });
    expect(
      qualifyWarehouseEnquiry("boxes", 50, "Studio", "urgent")
    ).toMatchObject({ inStock: true, priority: "Sales review" });
    expect(
      qualifyWarehouseEnquiry("boxes", 0, "Studio", "standard")
    ).toBeNull();
    expect(
      qualifyWarehouseEnquiry("boxes", 1.5, "Studio", "standard")
    ).toBeNull();
  });
});

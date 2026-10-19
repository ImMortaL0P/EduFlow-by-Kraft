import { format, formatDistanceToNow, isBefore, startOfDay } from "date-fns";

export const fmtDate = (d?: string | null) => (d ? format(new Date(d), "d MMM yyyy") : "—");
export const fmtDateTime = (d?: string | null) => (d ? format(new Date(d), "d MMM, h:mm a") : "—");
export const fromNow = (d?: string | null) => (d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : "—");
export const isOverdue = (d?: string | null) => !!d && isBefore(new Date(d), startOfDay(new Date()));
export const inr = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const LEAD_STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  counselling_scheduled: "Counselling scheduled",
  counselled: "Counselled",
  assessment: "Assessment",
  negotiation: "Fee discussion",
  converted: "Enrolled",
  lost: "Lost",
};
export const LEAD_STATUSES = Object.keys(LEAD_STATUS_LABEL);
export const LEAD_SOURCES = ["Website", "Instagram", "Referral", "Walk-in", "Google Ads", "Webinar", "Alumni", "Seminar"];

/** Conversion rate = converted / (all leads), as a whole percentage. */
export function conversionRate(statuses: string[]) {
  if (!statuses.length) return 0;
  return Math.round((statuses.filter((s) => s === "converted").length / statuses.length) * 100);
}

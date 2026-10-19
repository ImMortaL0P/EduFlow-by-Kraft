import { format, formatDistanceToNow, isBefore, startOfDay } from "date-fns";

export const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return format(dt, "d MMM yyyy");
  } catch {
    return "—";
  }
};

export const fmtDateTime = (d?: string | null) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return format(dt, "d MMM, h:mm a");
  } catch {
    return "—";
  }
};

export const fromNow = (d?: string | null) => {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return formatDistanceToNow(dt, { addSuffix: true });
  } catch {
    return "—";
  }
};

export const isOverdue = (d?: string | null) => {
  if (!d) return false;
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return false;
    return isBefore(dt, startOfDay(new Date()));
  } catch {
    return false;
  }
};

export const inr = (n?: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const LEAD_STATUS_LABEL: Record<string, string> = {
  new: "New Enquiry",
  contacted: "Contacted",
  counselling_scheduled: "Counselling Scheduled",
  counselled: "Profile Evaluated",
  assessment: "Diagnostic Taken",
  negotiation: "Fee Discussion",
  converted: "Enrolled in Batch",
  lost: "Lost / Not Interested",
};

export const LEAD_STATUSES = Object.keys(LEAD_STATUS_LABEL);
export const LEAD_SOURCES = ["Website", "Instagram", "Referral", "Walk-in", "Google Ads", "Webinar", "Alumni", "Seminar"];

/** Conversion rate = converted / (all leads), as a whole percentage. */
export function conversionRate(statuses: string[]) {
  if (!statuses.length) return 0;
  return Math.round((statuses.filter((s) => s === "converted").length / statuses.length) * 100);
}

export const defaultPolicy = {
  timezone: "Asia/Kolkata", workingDays: [1, 2, 3, 4, 5], defaultShiftStart: "09:00",
  defaultShiftEnd: "18:00", lateGraceMinutes: 15, fullDayHours: 8, halfDayHours: 4,
  attendanceMode: "multiple_sessions", punchInRestriction: "anytime",
};

export function policyFor(organization) {
  return { ...defaultPolicy, ...(organization?.attendanceConfig?.toObject?.() || organization?.attendanceConfig || {}), attendanceMode: organization?.attendanceMode || "multiple_sessions" };
}

export function dateInTimezone(date, timezone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function localMinutes(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const value = (type) => Number(parts.find((part) => part.type === type)?.value || 0);
  return value("hour") * 60 + value("minute");
}

export function minutesForTime(value) {
  const [hours, minutes] = String(value || "00:00").split(":").map(Number);
  return hours * 60 + minutes;
}

export function isWithinShiftHours(date, timezone, shiftStart, shiftEnd) {
  const now = localMinutes(date, timezone);
  const start = minutesForTime(shiftStart), end = minutesForTime(shiftEnd);
  // Daytime-only policy: an end time at/before the start time is invalid.
  return start < end && now >= start && now <= end;
}

export function statusForSeconds(seconds, policy) {
  if (seconds >= policy.fullDayHours * 3600) return "present";
  if (seconds >= policy.halfDayHours * 3600) return "half_day";
  return "absent";
}

export function publicStatus(record) {
  if (!record) return "Absent";
  if (record.status === "working") return record.isLate ? "Late" : "Present";
  const map = { present: "Present", half_day: "Half Day", absent: "Absent" };
  return map[record.attendanceStatus] || "Absent";
}

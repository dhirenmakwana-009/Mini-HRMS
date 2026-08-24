import React, { useState, useMemo, useEffect } from "react";
import { api } from "../api/Client";
import * as XLSX from "xlsx";
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  CalendarDays,
  CheckCircle2,
  Clock3,
  XCircle,
  Umbrella,
  TrendingUp,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDateLabel = (d) =>
  d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
const fmtDayLabel = (d) => d.toLocaleDateString("en-US", { weekday: "short" });
const fmtMonthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const fmtMonthLabel = (d) => d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
const minToLabel = (value) => {
  if (value == null) return "—";
  if (value instanceof Date) return value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const h24 = Math.floor(value / 60);
  const mm = value % 60;
  return `${h24 % 12 || 12}:${pad(mm)} ${h24 >= 12 ? "PM" : "AM"}`;
};

const STATUS_META = {
  Present: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 ring-emerald-200" },
  Late: { icon: Clock3, color: "text-amber-600 bg-amber-50 ring-amber-200" },
  Absent: { icon: XCircle, color: "text-rose-600 bg-rose-50 ring-rose-200" },
  "Half Day": { icon: Clock3, color: "text-sky-600 bg-sky-50 ring-sky-200" },
  "On Leave": { icon: Umbrella, color: "text-violet-600 bg-violet-50 ring-violet-200" },
};

/* ------------------------------------------------------------------ */
/*  Range presets                                                       */
/* ------------------------------------------------------------------ */

const PRESETS = ["Today", "This Week", "This Month", "This Quarter", "This Year", "Custom"];
const STATUS_FILTERS = ["Present", "Late", "Absent", "Half Day", "On Leave"];

function getPresetRange(preset, refDate) {
  const now = new Date(refDate);
  const start = new Date(now);
  const end = new Date(now);

  if (preset === "Today") {
    // start = end = today
  } else if (preset === "This Week") {
    const dow = now.getDay() === 0 ? 6 : now.getDay() - 1; // Monday start
    start.setDate(now.getDate() - dow);
  } else if (preset === "This Month") {
    start.setDate(1);
  } else if (preset === "This Quarter") {
    const q = Math.floor(now.getMonth() / 3);
    start.setMonth(q * 3, 1);
  } else if (preset === "This Year") {
    start.setMonth(0, 1);
  }
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, accent }) {
  const accents = {
    slate: "bg-slate-100 text-slate-600 ring-slate-200",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    amber: "bg-amber-50 text-amber-600 ring-amber-200",
    rose: "bg-rose-50 text-rose-600 ring-rose-200",
    violet: "bg-violet-50 text-violet-600 ring-violet-200",
    sky: "bg-sky-50 text-sky-600 ring-sky-200",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ring-1 ${accents[accent]}`}>
        <Icon size={15} />
      </div>
      <p className="font-mono text-xl font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Monthly trend chart                                                 */
/* ------------------------------------------------------------------ */

function MonthlyTrend({ records }) {
  const byMonth = useMemo(() => {
    const map = new Map();
    records.forEach((r) => {
      const key = fmtMonthKey(r.date);
      if (!map.has(key)) map.set(key, { date: r.date, total: 0, present: 0 });
      const bucket = map.get(key);
      bucket.total += 1;
      if (r.status === "Present" || r.status === "Late" || r.status === "Half Day") bucket.present += 1;
    });
    return Array.from(map.values())
      .sort((a, b) => a.date - b.date)
      .map((b) => ({ label: fmtMonthLabel(b.date), rate: b.total ? (b.present / b.total) * 100 : 0 }));
  }, [records]);

  if (byMonth.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Attendance Rate Trend</h3>
          <p className="text-xs text-slate-400">Share of working days attended, per month</p>
        </div>
        <TrendingUp size={16} className="text-amber-500" />
      </div>
      <div className="flex h-32 items-end justify-between gap-2 overflow-x-auto sm:gap-3">
        {byMonth.map((m) => (
          <div key={m.label} className="flex min-w-[32px] flex-1 flex-col items-center gap-2">
            <div className="relative flex h-24 w-full items-end justify-center">
              <div
                className="w-full max-w-[24px] rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-500"
                style={{ height: `${Math.max(m.rate, 4)}%` }}
                title={`${m.rate.toFixed(0)}%`}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge + chip                                                 */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${meta.color}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

const TODAY = new Date();

export default function AttendanceHistory() {
  const [serverRecords, setServerRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [preset, setPreset] = useState("This Month");
  const [customStart, setCustomStart] = useState(toISO(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(toISO(TODAY));
  const [statusFilters, setStatusFilters] = useState([]); // empty = all
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const range = useMemo(() => {
    if (preset === "Custom") {
      const s = new Date(customStart);
      const e = new Date(customEnd);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
    return getPresetRange(preset, TODAY);
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    api.get("/attendance/history", { params: { from: toISO(range.start), to: toISO(range.end), limit: 100 } })
      .then(({ data }) => setServerRecords(data.records.map((record) => ({
        date: new Date(`${record.date}T00:00:00`),
        status: record.statusLabel || (record.status === "completed" ? "Present" : record.status === "working" ? "Late" : "Absent"),
        punchIn: record.firstPunchIn ? new Date(record.firstPunchIn) : null,
        punchOut: record.lastPunchOut ? new Date(record.lastPunchOut) : null,
        breakMins: 0,
        totalHours: (record.totalWorkedSeconds || 0) / 3600,
      }))))
      .catch(() => setRequestError("Unable to load attendance history."))
      .finally(() => setIsLoading(false));
  }, [range]);

  const filtered = useMemo(() => {
    let rows = serverRecords.filter((r) => r.date >= range.start && r.date <= range.end);
    if (statusFilters.length > 0) rows = rows.filter((r) => statusFilters.includes(r.status));
    rows = [...rows].sort((a, b) => (sortDesc ? b.date - a.date : a.date - b.date));
    return rows;
  }, [range, serverRecords, statusFilters, sortDesc]);

  const summary = useMemo(() => {
    const total = filtered.length;
    const present = filtered.filter((r) => r.status === "Present").length;
    const late = filtered.filter((r) => r.status === "Late").length;
    const absent = filtered.filter((r) => r.status === "Absent").length;
    const leave = filtered.filter((r) => r.status === "On Leave").length;
    const halfDay = filtered.filter((r) => r.status === "Half Day").length;
    const sumHours = filtered.reduce((s, r) => s + r.totalHours, 0);
    const attendedDays = present + late + halfDay;
    const avgHours = attendedDays ? sumHours / attendedDays : 0;
    const rate = total ? ((present + late + halfDay) / total) * 100 : 0;
    return { total, present, late, absent, leave, halfDay, avgHours, rate };
  }, [filtered]);

  const totalPages = Math.max(Math.ceil(filtered.length / rowsPerPage), 1);
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * rowsPerPage, pageSafe * rowsPerPage);

  const toggleStatusFilter = (s) => {
    setPage(1);
    setStatusFilters((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handlePresetChange = (p) => {
    setPreset(p);
    setPage(1);
  };

  const exportToExcel = () => {
    const rows = filtered.map((r) => ({
      Date: fmtDateLabel(r.date),
      Day: fmtDayLabel(r.date),
      Status: r.status,
      "Punch In": r.punchIn ? r.punchIn.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—",
      "Punch Out": r.punchOut ? r.punchOut.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—",
      "Break (mins)": r.punchIn != null ? r.breakMins : 0,
      "Total Hours": Number(r.totalHours.toFixed(2)),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 14 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance History");
    const filename = `attendance-history_${toISO(range.start)}_to_${toISO(range.end)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const rangeLabel =
    preset === "Custom"
      ? `${fmtDateLabel(range.start)} – ${fmtDateLabel(range.end)}`
      : `${fmtDateLabel(range.start)} – ${fmtDateLabel(range.end)}`;

  return (
    <div className="min-h-screen w-full bg-slate-50 px-2 py-5 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="mx-auto max-w-6xl font-body">
        {/* header */}
        <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-2xl font-semibold text-slate-900">Attendance History</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <CalendarDays size={12} /> {rangeLabel}
              <span className="text-slate-300">&bull;</span>
              {filtered.length} record{filtered.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={exportToExcel}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet size={16} />
            Export to Excel
            <Download size={14} className="opacity-60" />
          </button>
        </header>

        {requestError && <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{requestError}</p>}
        {isLoading && <p className="mb-4 text-sm text-slate-500">Loading attendance history...</p>}

        {/* filters */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => handlePresetChange(p)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    preset === p
                      ? "bg-slate-900 text-amber-400"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
              <div className="ml-auto">
                <button
                  onClick={() => setFiltersOpen((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilters.length > 0
                      ? "border-amber-300 bg-amber-50 text-amber-700"
                      : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  Status {statusFilters.length > 0 && `(${statusFilters.length})`}
                </button>
              </div>
            </div>

            {preset === "Custom" && (
              <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  From
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => {
                      setCustomStart(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  To
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => {
                      setCustomEnd(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  />
                </label>
              </div>
            )}

            {filtersOpen && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                {STATUS_FILTERS.map((s) => {
                  const meta = STATUS_META[s];
                  const active = statusFilters.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleStatusFilter(s)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition-all ${
                        active ? meta.color : "text-slate-400 bg-white ring-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <meta.icon size={12} />
                      {s}
                    </button>
                  );
                })}
                {statusFilters.length > 0 && (
                  <button
                    onClick={() => setStatusFilters([])}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-500"
                  >
                    <X size={12} /> Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* summary cards */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={CalendarDays} label="Working Days" value={summary.total} accent="slate" />
          <StatCard icon={CheckCircle2} label="Present" value={summary.present} accent="emerald" />
          <StatCard icon={Clock3} label="Late" value={summary.late} accent="amber" />
          <StatCard icon={XCircle} label="Absent" value={summary.absent} accent="rose" />
          <StatCard icon={Umbrella} label="On Leave" value={summary.leave} accent="violet" />
          <StatCard icon={TrendingUp} label="Avg Hours/Day" value={`${summary.avgHours.toFixed(1)}h`} accent="sky" />
        </section>

        {/* trend chart */}
        <section className="mb-6">
          <MonthlyTrend records={filtered} />
        </section>

        {/* ledger table */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h3 className="text-sm font-semibold text-slate-900">Attendance Ledger</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Rows
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-xs text-slate-600 outline-none focus:border-amber-400"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <CalendarDays className="text-slate-300" size={28} />
              <p className="text-sm text-slate-400">No records match these filters</p>
              <p className="text-xs text-slate-300">Try a different date range or clear the status filter</p>
            </div>
          ) : (
            <>
              {/* desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-medium">
                        <button onClick={() => setSortDesc((v) => !v)} className="flex items-center gap-1 hover:text-slate-600">
                          Date <ArrowUpDown size={11} />
                        </button>
                      </th>
                      <th className="px-3 py-3 font-medium">Day</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Punch In</th>
                      <th className="px-3 py-3 font-medium">Punch Out</th>
                      <th className="px-3 py-3 font-medium">Break</th>
                      <th className="px-5 py-3 text-right font-medium">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-mono text-xs text-slate-600">{fmtDateLabel(r.date)}</td>
                        <td className="px-3 py-3 text-xs text-slate-400">{fmtDayLabel(r.date)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-600">{minToLabel(r.punchIn)}</td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-600">{minToLabel(r.punchOut)}</td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-400">
                          {r.punchIn != null ? `${r.breakMins}m` : "—"}
                        </td>
                        <td className="px-5 py-3 text-right font-mono text-xs font-semibold text-slate-800">
                          {r.totalHours > 0 ? r.totalHours.toFixed(1) + "h" : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* mobile cards */}
              <div className="divide-y divide-slate-50 sm:hidden">
                {pageRows.map((r, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-mono text-sm font-medium text-slate-800">{fmtDateLabel(r.date)}</p>
                        <p className="text-xs text-slate-400">{fmtDayLabel(r.date)}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">In</p>
                        <p className="font-mono font-medium text-slate-700">{minToLabel(r.punchIn)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Out</p>
                        <p className="font-mono font-medium text-slate-700">{minToLabel(r.punchOut)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total</p>
                        <p className="font-mono font-semibold text-slate-900">
                          {r.totalHours > 0 ? r.totalHours.toFixed(1) + "h" : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* pagination */}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-400">
                  Page <span className="font-medium text-slate-600">{pageSafe}</span> of {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={pageSafe === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={pageSafe === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <footer className="mt-8 text-center text-xs text-slate-300">
          Mini&#8209;HRMS &bull; Attendance ledger, exportable and auditable
        </footer>
      </div>
    </div>
  );
}

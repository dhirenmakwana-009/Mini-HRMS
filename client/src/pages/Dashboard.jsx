import { useState, useEffect, useRef, useCallback } from "react";
import {
  LogIn,
  LogOut,
  Coffee,
  CheckCircle2,
  Timer,
  CalendarDays,
  TrendingUp,
  Sunrise,
  BellRing,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { api } from "../api/Client";
import { useAuth } from "../hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, "0");

const fmtClock = (d) =>
  `${pad(d.getHours() % 12 === 0 ? 12 : d.getHours() % 12)}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;

const fmtAmPm = (d) => (d.getHours() >= 12 ? "PM" : "AM");

const fmtDuration = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const fmtHoursShort = (totalSeconds) => {
  const h = totalSeconds / 3600;
  return `${h.toFixed(1)}h`;
};

const fmtTime = (d) =>
  `${d.getHours() % 12 === 0 ? 12 : d.getHours() % 12}:${pad(
    d.getMinutes()
  )} ${fmtAmPm(d)}`;

const minToClock = (minutes) => {
  const hour = Math.floor(minutes / 60);
  return `${hour % 12 || 12}:${pad(Math.round(minutes % 60))} ${hour >= 12 ? "PM" : "AM"}`;
};

const formatShiftTime = (value) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return "--:--";
  const [hours, minutes] = value.split(":").map(Number);
  return `${hours % 12 || 12}:${pad(minutes)} ${hours >= 12 ? "PM" : "AM"}`;
};

const WEEK_TARGET_HOURS = 40;
const DAY_TARGET_SECONDS = 8 * 3600;

/* ------------------------------------------------------------------ */
/*  Analog punch clock                                                 */
/* ------------------------------------------------------------------ */

function AnalogClock({ now, status, elapsedSeconds, onPunch }) {
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  const ticks = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className="relative mx-auto flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
      {/* outer bezel */}
      <div className="absolute inset-0 rounded-full border border-amber-200/15 bg-[radial-gradient(circle_at_35%_25%,#263a3a_0%,#17292a_42%,#0b1719_100%)] shadow-[0_24px_70px_rgba(5,15,17,0.55)]" />
      <div className="absolute inset-[7px] rounded-full border border-white/[0.08] bg-[#102123]" />
      {/* face */}
      <div className="absolute inset-[13px] rounded-full border border-amber-300/20 bg-[#122426] shadow-[inset_0_0_35px_rgba(0,0,0,0.45)]">
        <svg viewBox="0 0 200 200" className="h-full w-full">
          {ticks.map((t) => {
            const isMajor = t % 5 === 0;
            const angle = (t * 6 * Math.PI) / 180;
            const r1 = isMajor ? 82 : 88;
            const r2 = 92;
            const x1 = 100 + r1 * Math.sin(angle);
            const y1 = 100 - r1 * Math.cos(angle);
            const x2 = 100 + r2 * Math.sin(angle);
            const y2 = 100 - r2 * Math.cos(angle);
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? "#d4a24e" : "#475569"}
                strokeWidth={isMajor ? 2 : 1}
                strokeLinecap="round"
              />
            );
          })}
          {[12, 3, 6, 9].map((n) => {
            const angle = ((n === 12 ? 0 : n) * 30 * Math.PI) / 180;
            const r = 70;
            const x = 100 + r * Math.sin(angle);
            const y = 100 - r * Math.cos(angle);
            return (
              <text
                key={n}
                x={x}
                y={y + 4}
                textAnchor="middle"
                className="fill-amber-400/90"
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", fontWeight: 600 }}
              >
                {n}
              </text>
            );
          })}

          {/* hour hand */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="58"
            stroke="#f1f5f9"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ transform: `rotate(${hourDeg}deg)`, transformOrigin: "100px 100px", transition: "transform 0.3s ease" }}
          />
          {/* minute hand */}
          <line
            x1="100"
            y1="100"
            x2="100"
            y2="38"
            stroke="#f1f5f9"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transform: `rotate(${minDeg}deg)`, transformOrigin: "100px 100px", transition: "transform 0.3s ease" }}
          />
          {/* second hand */}
          <line
            x1="100"
            y1="112"
            x2="100"
            y2="30"
            stroke="#d4a24e"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ transform: `rotate(${secDeg}deg)`, transformOrigin: "100px 100px", transition: "transform 0.2s cubic-bezier(0.4,2.3,0.6,1)" }}
          />
          <circle cx="100" cy="100" r="4" fill="#d4a24e" />
        </svg>
      </div>

      {/* punch button (crown) */}
      <button
        onClick={onPunch}
        className={`group absolute bottom-[-14px] flex flex-col items-center gap-1 rounded-full border px-6 py-3 text-xs font-semibold uppercase tracking-wider shadow-lg transition-all duration-200 active:scale-95 ${
          status === "in"
            ? "border-rose-400/40 bg-rose-500 text-white shadow-rose-900/40 hover:bg-rose-400"
            : "border-amber-300/50 bg-amber-500 text-slate-950 shadow-amber-900/40 hover:bg-amber-400"
        }`}
      >
        <span className="flex items-center gap-2">
          {status === "in" ? <LogOut size={15} /> : <LogIn size={15} />}
          {status === "in" ? "Punch Out" : "Punch In"}
        </span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, sub, accent = "amber" }) {
  const accents = {
    amber: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    sky: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
    rose: "bg-rose-500/10 text-rose-400 ring-rose-500/20",
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Weekly bar chart                                                   */
/* ------------------------------------------------------------------ */

function WeeklyChart({ weekData, todayIndex }) {
  const max = Math.max(...weekData.map((d) => d.hours), 8);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">This Week</h3>
          <p className="text-xs text-slate-400">Hours logged, Mon&nbsp;&ndash;&nbsp;Sun</p>
        </div>
        <span className="rounded-full bg-slate-50 px-2.5 py-1 font-mono text-xs font-medium text-slate-500 ring-1 ring-slate-200">
          Target {WEEK_TARGET_HOURS}h
        </span>
      </div>
      <div className="flex h-36 items-end justify-between gap-2 sm:gap-4">
        {weekData.map((d, i) => {
          const heightPct = Math.max((d.hours / max) * 100, d.hours > 0 ? 6 : 2);
          const isToday = i === todayIndex;
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-28 w-full items-end justify-center">
                <div
                  className={`w-full max-w-[26px] rounded-t-md transition-all duration-500 ${
                    isToday
                      ? "bg-gradient-to-t from-amber-600 to-amber-400"
                      : d.hours > 0
                      ? "bg-slate-200"
                      : "bg-slate-100"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>
              <span className={`text-[11px] font-medium ${isToday ? "text-amber-600" : "text-slate-400"}`}>
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Activity timeline                                                  */
/* ------------------------------------------------------------------ */

const EVENT_META = {
  in: { icon: LogIn, label: "Punched In", color: "text-emerald-500 bg-emerald-50 ring-emerald-200" },
  out: { icon: LogOut, label: "Punched Out", color: "text-rose-500 bg-rose-50 ring-rose-200" },
  breakStart: { icon: Coffee, label: "Break Started", color: "text-amber-500 bg-amber-50 ring-amber-200" },
  breakEnd: { icon: Coffee, label: "Break Ended", color: "text-sky-500 bg-sky-50 ring-sky-200" },
};

function Timeline({ events }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Today&apos;s Activity</h3>
        {events.length > 0 && (
          <span className="font-mono text-xs text-slate-400">{events.length} events</span>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Timer className="text-slate-300" size={26} />
          <p className="text-sm text-slate-400">No punches yet today</p>
          <p className="text-xs text-slate-300">Tap the clock face to punch in</p>
        </div>
      ) : (
        <ol className="relative space-y-5 border-l border-slate-100 pl-5">
          {events.map((ev, idx) => {
            const meta = EVENT_META[ev.type];
            const Icon = meta.icon;
            return (
              <li key={idx} className="relative">
                <span
                  className={`absolute -left-[27px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${meta.color}`}
                >
                  <Icon size={12} />
                </span>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                  <p className="font-mono text-xs text-slate-400">{fmtTime(ev.time)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dashboard                                                     */
/* ------------------------------------------------------------------ */

function greeting(d) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function AttendanceDashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());
  const [attendance, setAttendance] = useState(null);
  const [summary, setSummary] = useState(null);
  const [requestError, setRequestError] = useState("");
  const [isPunching, setIsPunching] = useState(false);
  const tickRef = useRef(null);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tickRef.current);
  }, []);

  useEffect(() => {
    api.get("/attendance/today").then(({ data }) => setAttendance(data.attendance)).catch(() => setRequestError("Unable to load today's attendance."));
    api.get("/attendance/summary").then(({ data }) => setSummary(data.summary)).catch(() => setRequestError("Unable to load attendance summary."));
  }, []);

  const status = attendance?.status === "working" ? "in" : "out";
  const punchInAt = status === "in" ? new Date(attendance.sessions.at(-1).punchIn) : null;
  const accumulatedSeconds = attendance?.totalWorkedSeconds || 0;
  const events = (attendance?.logs || []).slice().reverse().map((event) => ({ type: event.type === "punch_in" ? "in" : "out", time: new Date(event.at) }));
  const firstPunchIn = attendance?.firstPunchIn ? new Date(attendance.firstPunchIn) : null;

  const liveSeconds =
    status === "in" && punchInAt
      ? accumulatedSeconds + Math.floor((now - punchInAt) / 1000)
      : accumulatedSeconds;

  const handlePunch = useCallback(async () => {
    setIsPunching(true);
    setRequestError("");
    try {
      const endpoint = status === "in" ? "/attendance/punch-out" : "/attendance/punch-in";
      const { data } = await api.post(endpoint);
      setAttendance(data.attendance);
    } catch (error) {
      setRequestError(error.response?.data?.error || "Unable to update attendance.");
      const { data } = await api.get("/attendance/today");
      setAttendance(data.attendance);
    } finally { setIsPunching(false); }
  }, [status]);

  const weekData = summary?.week || [];
  const weekTotal = weekData.reduce((sum, d) => sum + d.hours, 0);
  const progressPct = Math.min((liveSeconds / DAY_TARGET_SECONDS) * 100, 100);

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen w-full bg-slate-50 px-2 py-5 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

      <div className="mx-auto max-w-6xl font-body">
        {/* header — identity strip, not a navbar */}
        <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            {/* <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-display text-sm font-semibold text-amber-400 ring-2 ring-amber-500/30">
              {user?.initials}
            </div> */}
            <div>
              <p className="font-display text-2xl font-semibold text-slate-900">
                {greeting(now)}, {user?.name?.split(" ")[0]}
              </p>
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                {user?.designation || user?.role}
                {user?.department && <><span className="text-slate-300">&bull;</span><MapPin size={11} /> {user.department}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500 shadow-sm">
              <CalendarDays size={14} className="text-amber-500" />
              {dateStr}
            </div>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-amber-500">
              <BellRing size={15} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>
          </div>
        </header>

        {/* hero clock */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="flex flex-col items-center justify-center gap-6 px-6 py-10 lg:col-span-3 lg:py-14">
              <AnalogClock now={now} status={status} elapsedSeconds={liveSeconds} onPunch={handlePunch} />
              <div className="mt-4 text-center">
                <p className="font-mono text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {fmtClock(now)}
                  <span className="ml-2 align-top text-base text-amber-400">{fmtAmPm(now)}</span>
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      status === "in"
                        ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/30"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${status === "in" ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                    {status === "in" ? "Currently Clocked In" : "Not Clocked In"}
                  </span>
                </div>
              </div>
            </div>

            {/* right info panel */}
            <div className="flex flex-col justify-center gap-6 border-t border-slate-800 bg-slate-900/60 px-8 py-10 lg:col-span-2 lg:border-l lg:border-t-0">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Time on the clock today</p>
                <p className="mt-2 font-mono text-4xl font-bold text-white">{fmtDuration(liveSeconds)}</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">{progressPct.toFixed(0)}% of 8h target</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-800/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">First Punch In</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white">
                    {firstPunchIn ? fmtTime(firstPunchIn) : "&mdash;"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-800/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Shift Window</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-white">{formatShiftTime(user?.shiftStart)}&ndash;{formatShiftTime(user?.shiftEnd)}</p>
                </div>
              </div>

              <button
                onClick={handlePunch}
                disabled={isPunching || !attendance}
                className={`flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition-all active:scale-[0.98] ${
                  status === "in"
                    ? "bg-rose-500 text-white hover:bg-rose-400"
                    : "bg-amber-500 text-slate-950 hover:bg-amber-400"
                }`}
              >
                {status === "in" ? <LogOut size={16} /> : <LogIn size={16} />}
                {status === "in" ? "Punch Out Now" : "Punch In Now"}
                <ChevronRight size={15} className="opacity-60" />
              </button>
              {requestError && <p role="alert" className="text-sm text-rose-300">{requestError}</p>}
            </div>
          </div>
        </section>

        {/* stat cards */}
        <section className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Timer} label="Today" value={fmtHoursShort(liveSeconds)} sub={`${fmtDuration(liveSeconds)} logged`} accent="amber" />
          <StatCard icon={TrendingUp} label="This Week" value={`${weekTotal.toFixed(1)}h`} sub={`of ${WEEK_TARGET_HOURS}h target`} accent="sky" />
          <StatCard icon={CheckCircle2} label="Attendance" value={`${(summary?.attendanceRate || 0).toFixed(0)}%`} sub="Last 30 days" accent="emerald" />
          <StatCard icon={Sunrise} label="Avg Check-in" value={summary?.averageCheckInMinutes == null ? "--:--" : minToClock(summary.averageCheckInMinutes)} sub="Recorded check-ins" accent="rose" />
        </section>

        {/* chart + timeline */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <WeeklyChart weekData={weekData} todayIndex={(now.getUTCDay() + 6) % 7} />
          </div>
          <div className="lg:col-span-3">
            <Timeline events={events} />
          </div>
        </section>

        <footer className="mt-10 text-center text-xs text-slate-300">
          Mini&#8209;HRMS &bull; Attendance recorded to the second, verified on punch
        </footer>
      </div>
    </div>
  );
}
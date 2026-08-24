import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
    Users,
    UserPlus,
    Search,
    Building2,
    Mail,
    Phone,
    CalendarDays,
    Clock3,
    CheckCircle2,
    XCircle,
    Umbrella,
    TrendingUp,
    Eye,
    Pencil,
    UserX,
    UserCheck,
    X,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Download,
    BellRing,
    ShieldCheck,
    MapPin,
    Briefcase,
    BadgeCheck,
    LogOut
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { api } from "../api/Client";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ */
/*  Helpers + form configuration                                        */
/* ------------------------------------------------------------------ */

const DEPARTMENTS = ["Engineering", "Design", "Product", "Marketing", "Sales", "HR", "Finance", "Support"];
const DEPT_ROLES = {
    Engineering: ["Software Engineer", "Senior Engineer", "Engineering Manager", "QA Engineer"],
    Design: ["Product Designer", "UX Researcher", "Design Lead"],
    Product: ["Product Manager", "Associate PM", "Product Analyst"],
    Marketing: ["Marketing Executive", "Content Strategist", "Growth Marketer"],
    Sales: ["Account Executive", "Sales Manager", "SDR"],
    HR: ["HR Executive", "Talent Partner", "HR Manager"],
    Finance: ["Financial Analyst", "Accountant", "Finance Manager"],
    Support: ["Support Specialist", "Support Lead"],
};
const STATUS_META = {
    Present: { icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50 ring-emerald-200", dot: "bg-emerald-500" },
    Late: { icon: Clock3, color: "text-amber-600 bg-amber-50 ring-amber-200", dot: "bg-amber-500" },
    Absent: { icon: XCircle, color: "text-rose-600 bg-rose-50 ring-rose-200", dot: "bg-rose-500" },
    "On Leave": { icon: Umbrella, color: "text-violet-600 bg-violet-50 ring-violet-200", dot: "bg-violet-500" },
};

const AVATAR_PALETTE = [
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
    "bg-indigo-100 text-indigo-700",
];

const avatarColor = (name) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
const initials = (f, l) => `${f[0]}${l[0]}`.toUpperCase();
const fmtDate = (d) => d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
const fmtHourDecimal = (h) => {
    if (!h) return "--:--";
    if (typeof h === "string" || h instanceof Date) return new Date(h).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
};
const formatShiftTime = (value) => {
    if (!value || !/^\d{2}:\d{2}$/.test(value)) return "--:--";
    const [hours, minutes] = value.split(":").map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
};

/* ------------------------------------------------------------------ */
/*  KPI card                                                            */
/* ------------------------------------------------------------------ */

function StatCard({ icon: Icon, label, value, accent, sub }) {
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
            {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Department distribution donut (signature element)                   */
/* ------------------------------------------------------------------ */

function DepartmentDonut({ employees }) {
    const colors = ["#d4a24e", "#0ea5e9", "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b", "#64748b", "#0284c7"];
    const counts = useMemo(() => {
        const map = new Map();
        employees.forEach((e) => map.set(e.department, (map.get(e.department) || 0) + 1));
        return DEPARTMENTS.map((d, i) => ({ dept: d, count: map.get(d) || 0, color: colors[i % colors.length] })).filter(
            (d) => d.count > 0
        );
    }, [employees]);

    const total = counts.reduce((s, c) => s + c.count, 0) || 1;
    let cumulative = 0;
    const stops = counts.map((c) => {
        const start = (cumulative / total) * 360;
        cumulative += c.count;
        const end = (cumulative / total) * 360;
        return `${c.color} ${start}deg ${end}deg`;
    });
    const gradient = `conic-gradient(${stops.join(", ")})`;

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-sm font-semibold text-slate-900">Team Distribution</h3>
            <div className="flex items-center gap-6">
                <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: gradient }}>
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                        <span className="font-mono text-xl font-bold text-slate-900">{total}</span>
                        <span className="text-[10px] uppercase tracking-wide text-slate-400">Total</span>
                    </div>
                </div>
                <div className="flex-1 space-y-2">
                    {counts.map((c) => (
                        <div key={c.dept} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-2 text-slate-500">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                                {c.dept}
                            </span>
                            <span className="font-mono font-medium text-slate-700">{c.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Live status panel                                                   */
/* ------------------------------------------------------------------ */

function LivePanel({ employees }) {
    const live = employees
        .filter((e) => e.active && (e.todayStatus === "Present" || e.todayStatus === "Late"))
        .sort((a, b) => a.punchInTime - b.punchInTime)
        .slice(0, 6);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Currently Checked In</h3>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    {live.length} online
                </span>
            </div>
            <div className="space-y-3">
                {live.map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(e.firstName)}`}>
                                {initials(e.firstName, e.lastName)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800">{e.firstName} {e.lastName}</p>
                                <p className="text-xs text-slate-400">{e.department}</p>
                            </div>
                        </div>
                        <p className="font-mono text-xs text-slate-400">{fmtHourDecimal(e.punchInTime)}</p>
                    </div>
                ))}
                {live.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No one has checked in yet</p>}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Status + department badges                                          */
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
/*  Add / Edit employee modal                                           */
/* ------------------------------------------------------------------ */

const EMPTY_FORM = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: DEPARTMENTS[0],
    designation: DEPT_ROLES[DEPARTMENTS[0]][0],
    employmentType: "Full-time",
    joinDate: "",
    shiftStart: "09:00",
    shiftEnd: "18:00",
    password: "",
    confirmPassword: "",
};

function EmployeeModal({ open, onClose, onSave, initialData }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setForm(
                initialData
                    ? {
                        firstName: initialData.firstName,
                        lastName: initialData.lastName,
                        email: initialData.email,
                        phone: initialData.phone,
                        department: initialData.department,
                        designation: initialData.designation,
                        employmentType: initialData.employmentType,
                        joinDate: initialData.joinDate.toISOString().slice(0, 10),
                        shiftStart: initialData.shiftStart,
                        shiftEnd: initialData.shiftEnd,
                        password: "",
                        confirmPassword: "",
                    }
                    : EMPTY_FORM
            );
            setErrors({});
        }
    }, [open, initialData]);

    if (!open) return null;

    const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const validate = () => {
        const e = {};
        if (!form.firstName.trim()) e.firstName = "Required";
        if (!form.lastName.trim()) e.lastName = "Required";
        if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
        if (!form.phone.trim()) e.phone = "Required";
        if (!initialData && form.password.length < 8) e.password = "Minimum 8 characters";
        if (!initialData && form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
        if (!/^\+?[\d\s()-]{7,20}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
        if (form.shiftStart >= form.shiftEnd) e.shiftEnd = "Must be after shift start";
        if (!form.joinDate) e.joinDate = "Required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsSaving(true);
        try {
            await onSave({ ...form, joinDate: new Date(form.joinDate) });
        } catch (error) {
            setErrors(error.response?.data?.fields || { form: error.response?.data?.error || "Unable to save employee" });
        } finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
                <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
                    <h3 className="font-display text-lg font-semibold text-slate-900">
                        {initialData ? "Edit Employee" : "Add New Employee"}
                    </h3>
                    <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    {errors.form && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{errors.form}</p>}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="First Name" error={errors.firstName}>
                            <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className={inputCls(errors.firstName)} placeholder="Dhiren" />
                        </Field>
                        <Field label="Last Name" error={errors.lastName}>
                            <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className={inputCls(errors.lastName)} placeholder="Makwana" />
                        </Field>
                    </div>

                    <Field label="Email Address" error={errors.email}>
                        <input value={form.email} onChange={(e) => update("email", e.target.value)} className={inputCls(errors.email)} placeholder="dhiren.makwana@minihrms.com" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">

                        <Field label="Password" error={errors.password}>
                            <input value={form.password} onChange={(e) => update("password", e.target.value)} className={inputCls(errors.password)} placeholder="*******" />
                        </Field>
                        <Field label="Confirm Password" error={errors.confirmPassword}>
                            <input value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} className={inputCls(errors.confirmPassword)} placeholder="*******" />
                        </Field>
                    </div>
                    <Field label="Phone Number" error={errors.phone}>
                        <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputCls(errors.phone)} placeholder="+91 9XXXXXXXXX" />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Department">
                            <select
                                value={form.department}
                                onChange={(e) => update("department", e.target.value)}
                                className={inputCls()}
                            >
                                {DEPARTMENTS.map((d) => (
                                    <option key={d}>{d}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Designation">
                            <select value={form.designation} onChange={(e) => update("designation", e.target.value)} className={inputCls()}>
                                {(DEPT_ROLES[form.department] || []).map((r) => (
                                    <option key={r}>{r}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Employment Type">
                            <select value={form.employmentType} onChange={(e) => update("employmentType", e.target.value)} className={inputCls()}>
                                <option>Full-time</option>
                                <option>Part-time</option>
                                <option>Contract</option>
                            </select>
                        </Field>
                        <Field label="Date of Joining" error={errors.joinDate}>
                            <input type="date" value={form.joinDate} onChange={(e) => update("joinDate", e.target.value)} className={inputCls(errors.joinDate)} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Shift Start">
                            <input type="time" value={form.shiftStart} onChange={(e) => update("shiftStart", e.target.value)} className={inputCls()} />
                        </Field>
                        <Field label="Shift End">
                            <input type="time" value={form.shiftEnd} onChange={(e) => update("shiftEnd", e.target.value)} className={inputCls()} />
                        </Field>
                    </div>
                </div>

                <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-white px-6 py-4">
                    <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-amber-400 active:scale-[0.98]"
                    >
                        <BadgeCheck size={16} />
                        {isSaving ? "Saving..." : initialData ? "Save Changes" : "Add Employee"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function inputCls(error) {
    return `w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:ring-2 ${error ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100" : "border-slate-200 focus:border-amber-400 focus:ring-amber-100"
        }`;
}

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
            {children}
            {error && <span className="mt-1 block text-[11px] text-rose-500">{error}</span>}
        </label>
    );
}

/* ------------------------------------------------------------------ */
/*  Employee detail drawer                                              */
/* ------------------------------------------------------------------ */

function EmployeeDrawer({ employee, onClose, onEdit, onToggleActive }) {
    if (!employee) return null;
    const meta = STATUS_META[employee.todayStatus];
    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h3 className="text-sm font-semibold text-slate-900">Employee Profile</h3>
                    <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-3 border-b border-slate-100 px-6 py-8">
                    <div className={`flex h-20 w-20 items-center justify-center rounded-full text-xl font-semibold ${avatarColor(employee.firstName)}`}>
                        {initials(employee.firstName, employee.lastName)}
                    </div>
                    <div className="text-center">
                        <p className="font-display text-lg font-semibold text-slate-900">
                            {employee.firstName} {employee.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{employee.designation}</p>
                    </div>
                    <StatusBadge status={employee.todayStatus} />
                </div>

                <div className="space-y-4 px-6 py-6">
                    <DetailRow icon={Briefcase} label="Employee ID" value={employee.id} mono />
                    <DetailRow icon={Building2} label="Department" value={employee.department} />
                    <DetailRow icon={Mail} label="Email" value={employee.email} />
                    <DetailRow icon={Phone} label="Phone" value={employee.phone} mono />
                    <DetailRow icon={CalendarDays} label="Joined" value={fmtDate(employee.joinDate)} />
                    <DetailRow icon={Clock3} label="Shift" value={`${formatShiftTime(employee.shiftStart)} – ${formatShiftTime(employee.shiftEnd)}`} mono />
                    <DetailRow icon={ShieldCheck} label="Employment Type" value={employee.employmentType} />
                    <DetailRow icon={MapPin} label="Status" value={employee.active ? "Active" : "Deactivated"} />
                </div>

                <div className="mt-auto border-t border-slate-100 px-6 py-4">
                    <div className="mb-4 rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">30-Day Attendance Rate</p>
                        <div className="mt-2 flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                                <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300" style={{ width: `${employee.attendanceRate || 0}%` }} />
                            </div>
                            <span className="font-mono text-sm font-semibold text-slate-700">{employee.attendanceRate == null ? "--" : `${employee.attendanceRate}%`}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit(employee)}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        >
                            <Pencil size={14} /> Edit
                        </button>
                        <button
                            onClick={() => onToggleActive(employee)}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${employee.active ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                }`}
                        >
                            {employee.active ? <UserX size={14} /> : <UserCheck size={14} />}
                            {employee.active ? "Deactivate" : "Activate"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value, mono }) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400 ring-1 ring-slate-100">
                <Icon size={14} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
                <p className={`truncate text-sm font-medium text-slate-700 ${mono ? "font-mono" : ""}`}>{value}</p>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main admin dashboard                                                */
/* ------------------------------------------------------------------ */

export default function AdminDashboard() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState("");
    const [deptFilter, setDeptFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortAsc, setSortAsc] = useState(true);
    const [page, setPage] = useState(1);
    const rowsPerPage = 8;

    const [modalOpen, setModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [drawerEmployee, setDrawerEmployee] = useState(null);
    const [toast, setToast] = useState("");

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(""), 3000);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        api.get("/admin/employees")
            .then(({ data }) => setEmployees(data.employees.map((employee) => ({
                ...employee,
                joinDate: employee.joinDate ? new Date(employee.joinDate) : null,
            }))))
            .catch(() => setToast("Unable to load employees"));
    }, []);

    const filtered = useMemo(() => {
        let rows = employees.filter((e) => {
            const q = search.trim().toLowerCase();
            const matchesSearch =
                !q ||
                `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
                e.email.toLowerCase().includes(q) ||
                e.id.toLowerCase().includes(q);
            const matchesDept = deptFilter === "All" || e.department === deptFilter;
            const matchesStatus = statusFilter === "All" || e.todayStatus === statusFilter;
            return matchesSearch && matchesDept && matchesStatus;
        });
        rows = [...rows].sort((a, b) => {
            const an = `${a.firstName} ${a.lastName}`;
            const bn = `${b.firstName} ${b.lastName}`;
            return sortAsc ? an.localeCompare(bn) : bn.localeCompare(an);
        });
        return rows;
    }, [employees, search, deptFilter, statusFilter, sortAsc]);

    const totalPages = Math.max(Math.ceil(filtered.length / rowsPerPage), 1);
    const pageSafe = Math.min(page, totalPages);
    const pageRows = filtered.slice((pageSafe - 1) * rowsPerPage, pageSafe * rowsPerPage);

    const kpis = useMemo(() => {
        const active = employees.filter((e) => e.active);
        const present = active.filter((e) => e.todayStatus === "Present").length;
        const late = active.filter((e) => e.todayStatus === "Late").length;
        const absent = active.filter((e) => e.todayStatus === "Absent").length;
        const leave = active.filter((e) => e.todayStatus === "On Leave").length;
        const rate = active.length ? (((present + late) / active.length) * 100).toFixed(0) : 0;
        return { total: employees.length, active: active.length, present, late, absent, leave, rate };
    }, [employees]);

    const openAddModal = () => {
        setEditingEmployee(null);
        setModalOpen(true);
    };
    const openEditModal = (emp) => {
        setEditingEmployee(emp);
        setDrawerEmployee(null);
        setModalOpen(true);
    };

    const handleSaveEmployee = async (form) => {
        if (editingEmployee) {
            setEmployees((prev) => prev.map((e) => (e.id === editingEmployee.id ? { ...e, ...form } : e)));
            setToast(`${form.firstName} ${form.lastName}'s profile was updated`);
        } else {
            const { data } = await api.post("/admin/employees", form);
            setEmployees((prev) => [{ ...data.employee, joinDate: new Date(data.employee.joinDate) }, ...prev]);
            setToast(`${form.firstName} ${form.lastName} was added to the team`);
        }
        setModalOpen(false);
    };

    const handleToggleActive = (emp) => {
        setEmployees((prev) => prev.map((e) => (e.id === emp.id ? { ...e, active: !e.active } : e)));
        setDrawerEmployee((prev) => (prev ? { ...prev, active: !prev.active } : prev));
        setToast(`${emp.firstName} ${emp.lastName} was ${emp.active ? "deactivated" : "reactivated"}`);
    };

    const exportDirectory = () => {
        const rows = filtered.map((e) => ({
            "Employee ID": e.id,
            Name: `${e.firstName} ${e.lastName}`,
            Email: e.email,
            Phone: e.phone,
            Department: e.department,
            Designation: e.designation,
            "Employment Type": e.employmentType,
            "Join Date": fmtDate(e.joinDate),
            "Today's Status": e.todayStatus,
            "Attendance Rate": `${e.attendanceRate}%`,
            Status: e.active ? "Active" : "Deactivated",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = Array(11).fill({ wch: 16 });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Employee Directory");
        XLSX.writeFile(wb, "employee-directory.xlsx");
    };

    return (
        <div className="min-h-screen w-full bg-slate-50 px-2 py-5 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>

            <div className="mx-auto max-w-6xl font-body">
                {/* toast */}
                {toast && (
                    <div className="fixed left-1/2 top-6 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-xs font-medium text-amber-400 shadow-xl">
                        {toast}
                    </div>
                )}

                {/* header */}
                <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        {/* <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-display text-sm font-semibold text-amber-400 ring-2 ring-amber-500/30">
                            DM
                        </div> */}
                        <div>
                            <p className="font-display text-3xl font-semibold text-slate-900">Admin Panel</p>
                            <p className="text-xm text-slate-400">Manage your team and monitor attendance in real time</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm hover:text-amber-500">
                            <BellRing size={15} />
                            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98]"
                        >
                            <UserPlus size={16} />
                            Add Employee
                        </button>
                        <button
                            onClick={async () => { await logout(); navigate("/login", { replace: true }); }}
                            type="button"
                            className="flex items-center gap-2 cursor-pointer rounded-xl bg-white-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition-all hover:bg-red-500 active:scale-[0.98]"
                        >
                            <LogOut size={16} />
                            Log Out
                        </button>
                    </div>
                </header>

                {/* KPI row */}
                <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <StatCard icon={Users} label="Total Employees" value={kpis.total} accent="slate" sub={`${kpis.active} active`} />
                    <StatCard icon={CheckCircle2} label="Present Today" value={kpis.present} accent="emerald" />
                    <StatCard icon={Clock3} label="Late Today" value={kpis.late} accent="amber" />
                    <StatCard icon={XCircle} label="Absent Today" value={kpis.absent} accent="rose" />
                    <StatCard icon={Umbrella} label="On Leave" value={kpis.leave} accent="violet" />
                    <StatCard icon={TrendingUp} label="Attendance Rate" value={`${kpis.rate}%`} accent="sky" />
                </section>

                {/* distribution + live panel */}
                <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <DepartmentDonut employees={employees} />
                    <LivePanel employees={employees} />
                </section>

                {/* directory */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-semibold text-slate-900">Employee Directory</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    placeholder="Search name, email, ID..."
                                    className="rounded-xl border border-slate-200 py-2 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 sm:w-56"
                                />
                            </div>
                            <select
                                value={deptFilter}
                                onChange={(e) => {
                                    setDeptFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 outline-none focus:border-amber-400"
                            >
                                <option>All</option>
                                {DEPARTMENTS.map((d) => (
                                    <option key={d}>{d}</option>
                                ))}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 outline-none focus:border-amber-400"
                            >
                                <option>All</option>
                                <option>Present</option>
                                <option>Late</option>
                                <option>Absent</option>
                                <option>On Leave</option>
                            </select>
                            <button
                                onClick={exportDirectory}
                                className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                <Download size={13} /> Export
                            </button>
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                            <Users className="text-slate-300" size={28} />
                            <p className="text-sm text-slate-400">No employees match these filters</p>
                        </div>
                    ) : (
                        <>
                            {/* desktop table */}
                            <div className="hidden overflow-x-auto sm:block">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                                            <th className="px-5 py-3 font-medium">
                                                <button onClick={() => setSortAsc((v) => !v)} className="flex items-center gap-1 hover:text-slate-600">
                                                    Employee <ArrowUpDown size={11} />
                                                </button>
                                            </th>
                                            <th className="px-3 py-3 font-medium">Department</th>
                                            <th className="px-3 py-3 font-medium">Today</th>
                                            <th className="px-3 py-3 font-medium">Joined</th>
                                            <th className="px-3 py-3 font-medium">Rate</th>
                                            <th className="px-5 py-3 text-right font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pageRows.map((e) => (
                                            <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(e.firstName)}`}>
                                                            {initials(e.firstName, e.lastName)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className={`truncate text-sm font-medium ${e.active ? "text-slate-800" : "text-slate-400 line-through"}`}>
                                                                {e.firstName} {e.lastName}
                                                            </p>
                                                            <p className="truncate font-mono text-[11px] text-slate-400">{e.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-xs text-slate-500">{e.department}</td>
                                                <td className="px-3 py-3">
                                                    <StatusBadge status={e.todayStatus} />
                                                </td>
                                                <td className="px-3 py-3 font-mono text-xs text-slate-500">{fmtDate(e.joinDate)}</td>
                                                <td className="px-3 py-3 font-mono text-xs font-medium text-slate-600">{e.attendanceRate}%</td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button onClick={() => setDrawerEmployee(e)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                                            <Eye size={14} />
                                                        </button>
                                                        <button onClick={() => openEditModal(e)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleActive(e)}
                                                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${e.active ? "text-slate-400 hover:bg-rose-50 hover:text-rose-500" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"}`}
                                                        >
                                                            {e.active ? <UserX size={14} /> : <UserCheck size={14} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* mobile cards */}
                            <div className="divide-y divide-slate-50 sm:hidden">
                                {pageRows.map((e) => (
                                    <div key={e.id} className="px-5 py-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(e.firstName)}`}>
                                                    {initials(e.firstName, e.lastName)}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-medium ${e.active ? "text-slate-800" : "text-slate-400 line-through"}`}>
                                                        {e.firstName} {e.lastName}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{e.department}</p>
                                                </div>
                                            </div>
                                            <StatusBadge status={e.todayStatus} />
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <button onClick={() => setDrawerEmployee(e)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600">
                                                <Eye size={12} /> View
                                            </button>
                                            <button onClick={() => openEditModal(e)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600">
                                                <Pencil size={12} /> Edit
                                            </button>
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
                    Mini&#8209;HRMS &bull; Admin Panel
                </footer>
            </div>

            <EmployeeModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSaveEmployee} initialData={editingEmployee} />
            <EmployeeDrawer employee={drawerEmployee} onClose={() => setDrawerEmployee(null)} onEdit={openEditModal} onToggleActive={handleToggleActive} />
        </div>
    );
}
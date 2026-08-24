import { useEffect, useRef } from "react";
import { History, LogOut, PanelLeftClose, ShieldCheck } from "lucide-react";

const NAV_SECTIONS = [
  {
    items: [
      { id: "dashboard", label: "Dashboard", href: "/", icon: DashboardIcon },
      { id: "attendanceHistory", label: "History", href: "/attendance-history", icon: History },
    ],
  },
  // {
  //   divider: true,
  //   items: [{ id: "settings", label: "Settings", href: "/settings", icon: SettingsIcon }],
  // },
];

export const Sidebar = ({
  collapsed = false,
  onCollapsedChange,
  mobileOpen = false,
  onMobileOpenChange,
  activeItemId,
  onNavigate,
  user,
  orgName = "DM WebSoft",
  onLogout,
}) => {
  const drawerRef = useRef(null);

  // close the mobile drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onMobileOpenChange?.(false);
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, onMobileOpenChange]);

  const handleNavClick = (item) => {
    onNavigate?.(item);
    onMobileOpenChange?.(false);
  };

  return (
    <>
      {/* ---------------- Mobile backdrop ---------------- */}
      <div
        aria-hidden="true"
        onClick={() => onMobileOpenChange?.(false)}
        className={`fixed inset-0 z-40 bg-[#07130f]/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
      />

      {/* ---------------- Sidebar / drawer ---------------- */}
      <aside
        ref={drawerRef}
        role="navigation"
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden border-r border-white/[0.08] bg-[#0d1d17] shadow-[12px_0_40px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          w-[260px] sm:w-[280px] ${collapsed ? "lg:w-[76px]" : "lg:w-[240px]"}
        `}
      >
        {/* ---- Header: brand + collapse toggle (desktop) / close (mobile) ---- */}
        <div className="flex h-[76px] flex-shrink-0 items-center justify-between border-b border-white/[0.07] px-4">
          <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? "lg:w-0 lg:opacity-0" : ""} transition-all duration-200`}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center object-cover rounded-xl border border-[#c9a877]/25 bg-[#c9a877]/10 shadow-inner shadow-[#c9a877]/10">
              <img src="/image.png" alt="DM WebSoft" className="h-9 w-9 object-cover" />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-serif text-[15px] font-semibold tracking-wide text-stone-50">{orgName}</span>
              {/* <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#c9a877]/70">People operations</span> */}
            </div>
          </div>

          {/* collapsed-state mini glyph, desktop only */}
          {collapsed && (
            <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-[#c9a877]/25 bg-[#c9a877]/10 lg:flex">
              <img src="/image.png" alt="DM WebSoft" className="h-9 w-9 object-contain" />
              {/* <BrandGlyph className="h-4.5 w-4.5 text-[#c9a877]" /> */}
            </div>
          )}

          {/* mobile close button */}
          <button
            onClick={() => onMobileOpenChange?.(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white/[0.07] hover:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#c9a877]/50 lg:hidden"
          >
            <CloseIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* ---- Nav items ---- */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 [scrollbar-width:thin] [scrollbar-color:rgba(201,168,119,.25)_transparent]">
          <p className={`mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500 ${collapsed ? "lg:hidden" : ""}`}>Workspace</p>
          {NAV_SECTIONS.map((section, sIdx) => (
            <div key={sIdx} className={section.divider ? "mt-3 border-t border-white/[0.06] pt-3" : ""}>
              {section.items.map((item) => {
                const isActive = item.id === activeItemId;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? "page" : undefined}
                    className={`group relative mb-1 flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a877]/50
                      ${collapsed ? "lg:justify-center lg:px-0" : ""}
                      ${isActive
                        ? "border-[#c9a877]/20 bg-[#c9a877]/10 text-stone-50 shadow-[inset_3px_0_0_#c9a877]"
                        : "border-transparent text-stone-400 hover:border-white/[0.06] hover:bg-white/[0.05] hover:text-stone-100"
                      }`}
                  >
                    {/* active indicator bar */}
                    {isActive && (
                      <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-[#c9a877] shadow-[0_0_10px_#c9a877]" />
                    )}
                    <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? "text-[#c9a877]" : ""}`} />
                    <span className={`truncate transition-all duration-200 ${collapsed ? "lg:hidden" : ""}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`ml-auto flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#8a7148] px-1 text-[10px] font-semibold text-white ${collapsed ? "lg:absolute lg:right-1 lg:top-1 lg:h-4 lg:min-w-4" : ""
                          }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ---- User snippet ---- */}
        {user && <div className="flex-shrink-0 border-t border-white/[0.08] p-3">
          <div className={`mb-2 flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-3 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#c9a877] text-xs font-bold text-[#16231c] shadow-[0_4px_14px_rgba(201,168,119,0.2)]">{user.initials}</div>
            <div className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
              <p className="truncate text-sm font-semibold text-stone-100">{user.name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-stone-500"><ShieldCheck size={11} className="text-[#c9a877]" /> {user.role}</p>
            </div>
          </div>
          <button onClick={onLogout} type="button" title="Log out" className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-400 transition-all hover:bg-rose-400/10 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300/40 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
            <LogOut size={17} className="transition-transform group-hover:-translate-x-0.5" />
            <span className={collapsed ? "lg:hidden" : ""}>Log out</span>
          </button>
        </div>}

        {/* ---- Collapse toggle, desktop only ---- */}
        <button
          onClick={() => onCollapsedChange?.(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden flex-shrink-0 cursor-pointer items-center justify-center gap-2 border-t border-white/[0.08] py-3.5 text-stone-500 transition hover:bg-white/[0.05] hover:text-stone-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#c9a877]/50 lg:flex"
        >
          <PanelLeftClose className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </aside>
    </>
  );
}

/**
 * SidebarToggleButton
 * Render this in your top bar / header, visible only below `lg`, wired to
 * open the mobile drawer.
 */
export function SidebarToggleButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className="flex h-9 w-9 items-center justify-center rounded-md text-stone-600 transition hover:bg-stone-100 lg:hidden"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* --------------------------------- Icons ---------------------------------
   Simple, consistent 24x24 stroke icons so the sidebar doesn't depend on
   an external icon library (swap for lucide-react etc. if you already
   use one — same props shape, just className). */

function iconProps(className) {
  return { viewBox: "0 0 24 24", fill: "none", className, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
}

function DashboardIcon({ className }) {
  return (
    <svg {...iconProps(className)}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.2" />
      <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.2" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.2" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.2" />
    </svg>
  );
}
function CloseIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

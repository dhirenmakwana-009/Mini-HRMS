import { Sidebar } from "../components/Sidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react"
import { useAuth } from "../hooks/useAuth";


export const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const activeItemId = location.pathname;
    const { user, logout } = useAuth();

    return (    
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <Sidebar
                collapsed={collapsed}
                onCollapsedChange={setCollapsed}
                mobileOpen={mobileOpen}
                onMobileOpenChange={setMobileOpen}
                activeItemId={activeItemId}
                onNavigate={(item) => navigate(item.href)}  // wire to react-router etc.
                user={user}
                onLogout={async () => { await logout(); navigate("/login", { replace: true }); }}
            />
            <main
                className={`min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 transition-all duration-300 ease-in-out ${collapsed ? "lg:ml-[76px]" : "lg:ml-[240px]"
                    }`}
            >
                <button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"><span className="text-xl leading-none">☰</span></button>
                <div className="pt-12 lg:pt-0"><Outlet /></div>
            </main>
        </div>
    )
}

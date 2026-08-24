import { Sidebar } from "../components/Sidebar";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react"
import { useAuth } from "../hooks/useAuth";


export const MainLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const activeItemId = location.pathname.split('/')[1] || "/";
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
                <Outlet />
            </main>
        </div>
    )
}
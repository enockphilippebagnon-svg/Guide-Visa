import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Home, FolderClosed, MessagesSquare, ShieldAlert, User, LogOut, Shield, WifiOff } from "lucide-react";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isAdmin = user && user.role === "admin";
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const tabs = [
    { to: "/app", icon: Home, label: "Accueil", end: true },
    { to: "/app/documents", icon: FolderClosed, label: "Docs" },
    { to: "/app/anti-arnaque", icon: ShieldAlert, label: "Arnaque" },
    { to: "/app/forum", icon: MessagesSquare, label: "Forum" },
    { to: "/app/profil", icon: User, label: "Profil" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-24 lg:pb-6">
      {!online && (
        <div className="bg-[#F9CA24] text-[#1A2B4C] text-center text-xs font-bold py-2 flex items-center justify-center gap-2" data-testid="offline-banner">
          <WifiOff size={14}/> Mode hors ligne, tes données sont sauvegardées localement
        </div>
      )}
      {/* Top nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/90 border-b border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => nav("/app")} data-testid="header-logo">
            <div className="w-9 h-9 rounded-xl bg-[#0A3D62] flex items-center justify-center text-[#F9CA24] font-bold font-display">GV</div>
            <div>
              <div className="font-display font-bold text-[#1A2B4C] leading-tight text-lg">Guide Visa</div>
              <div className="text-[10px] text-slate-500 leading-tight">by Digitalk Afrique</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => nav("/admin")} data-testid="header-admin-btn"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#0A3D62] text-white hover:bg-[#0d4a78]">
                <Shield size={14}/> Admin
              </button>
            )}
            <button onClick={() => { logout(); nav("/login"); }} data-testid="header-logout-btn"
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
              <LogOut size={18}/>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6">{children}</main>

      {/* Bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-white/95 border-t border-slate-200">
        <div className="grid grid-cols-5">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} data-testid={`tab-${t.label.toLowerCase()}`}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 py-3 ${isActive ? "text-[#0A3D62]" : "text-slate-500"}`}>
              <t.icon size={20}/>
              <span className="text-[10px] font-semibold">{t.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

import React from "react";
import { useAuth } from "../lib/auth";
import { User, Mail, Globe2, Coins } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  const items = [
    { icon: User, label: "Nom", value: `${user.prenom || ""} ${user.nom || ""}`.trim() },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Globe2, label: "Pays d'origine", value: user.pays_origine },
    { icon: Coins, label: "Devise préférée", value: user.devise_preferee },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-24 h-24 rounded-full bg-[#F9CA24] mx-auto flex items-center justify-center font-display font-bold text-4xl text-[#1A2B4C]">
          {user.nom?.[0]?.toUpperCase()}
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-[#1A2B4C]">{user.nom} {user.prenom}</h1>
        <div className="text-sm text-slate-500">{user.email}</div>
        {user.role === "admin" && <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#0A3D62] text-white text-xs font-bold">ADMIN</div>}
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-100 gv-shadow divide-y divide-slate-100">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 py-3">
            <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
              <it.icon className="text-[#0A3D62]" size={18}/>
            </div>
            <div className="flex-1">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">{it.label}</div>
              <div className="text-sm font-semibold text-[#1A2B4C]">{it.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-slate-500">
        Guide Visa v3.5 • Un produit <b>Digitalk Afrique</b> 
      </div>
    </div>
  );
}

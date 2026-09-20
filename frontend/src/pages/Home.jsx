import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatMontant } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ArrowRight, GraduationCap, Briefcase, Users, ShieldAlert, ExternalLink } from "lucide-react";

const MOTIF_ICONS = { etudes: GraduationCap, travail: Briefcase, famille: Users };
const MOTIF_LABELS = { etudes: "Études", travail: "Travail", famille: "Famille" };

export default function Home() {
  const { user } = useAuth();
  const [paysList, setPaysList] = useState([]);
  const [sims, setSims] = useState([]);
  const [selPays, setSelPays] = useState(null);

  useEffect(() => {
    api.get("/simulations/pays").then(({ data }) => setPaysList(data));
    api.get("/simulations/mes").then(({ data }) => setSims(data));
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0A3D62] p-8 lg:p-10 text-white gv-noise">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#F9CA24]/20 rounded-full blur-3xl"/>
        <div className="relative">
          <div className="text-xs font-bold uppercase tracking-widest text-[#F9CA24]">Bonjour {user?.prenom || user?.nom}</div>
          <h1 className="mt-2 font-display text-3xl lg:text-4xl font-bold leading-tight">Prêt à démarrer<br/>ta procédure ?</h1>
          <p className="mt-3 text-sm text-white/80 max-w-md">Choisis ton pays de destination — on te montre les coûts en {user?.devise_preferee || "FCFA"}.</p>
        </div>
      </div>

      {/* Simulations en cours */}
      {sims.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-bold text-[#1A2B4C] mb-3">Tes simulations</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sims.map((s) => (
              <Link key={s.id} to={`/app/simulation/${s.id}`} data-testid={`sim-card-${s.id}`}
                className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow gv-shadow-hover hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-bold text-[#1A2B4C]">{s.pays_destination} • {MOTIF_LABELS[s.motif]}</div>
                  <div className="text-xs px-2.5 py-1 rounded-full bg-[#2ECC71]/10 text-[#2ECC71] font-bold">Score {s.score_eligibilite}</div>
                </div>
                <div className="text-xs text-slate-500">Progression : {s.progression_pct}%</div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F9CA24]" style={{ width: `${s.progression_pct}%` }}/>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Countries */}
      <div>
        <h2 className="font-display text-xl font-bold text-[#1A2B4C] mb-3">Choisis ta destination</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {paysList.map((p) => (
            <button key={p.code} onClick={() => setSelPays(selPays === p.code ? null : p.code)}
              data-testid={`country-card-${p.code}`}
              className={`relative rounded-2xl overflow-hidden aspect-[4/5] group text-left border-2 transition-all ${selPays === p.code ? "border-[#F9CA24]" : "border-transparent"}`}>
              <img src={p.hero_image} alt={p.pays} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D62]/90 via-[#0A3D62]/30 to-transparent"/>
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="text-3xl">{p.drapeau}</div>
                <div className="font-display text-2xl font-bold mt-1">{p.pays}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Motif selector */}
      {selPays && (
        <div className="gv-fadeup bg-white rounded-2xl p-6 border border-slate-100 gv-shadow">
          <h3 className="font-display text-lg font-bold text-[#1A2B4C]">Quel est ton motif ?</h3>
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {(paysList.find((p) => p.code === selPays)?.motifs || []).map((m) => {
              const Icon = MOTIF_ICONS[m] || GraduationCap;
              return (
                <Link key={m} to={`/app/simuler/${selPays}/${m}`} data-testid={`motif-${m}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[#F5F7FA] hover:bg-[#F9CA24]/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[#0A3D62] flex items-center justify-center text-white">
                    <Icon size={20}/>
                  </div>
                  <div>
                    <div className="font-bold text-[#1A2B4C]">{MOTIF_LABELS[m]}</div>
                    <div className="text-xs text-slate-500">Voir les étapes</div>
                  </div>
                  <ArrowRight size={18} className="ml-auto text-slate-400"/>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Liens utiles */}
      <button onClick={() => window.location.href = "/app/liens"} data-testid="home-liens-cta"
        className="w-full text-left bg-white rounded-2xl p-5 border border-slate-100 gv-shadow hover:-translate-y-0.5 transition-transform flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#F9CA24]/20 flex items-center justify-center">
          <ExternalLink className="text-[#F9CA24]" size={22}/>
        </div>
        <div className="flex-1">
          <div className="font-display font-bold text-[#1A2B4C]">Bibliothèque de liens officiels</div>
          <div className="text-xs text-slate-500 mt-0.5">Ambassades, tests de langue, bourses, biométrie…</div>
        </div>
        <ArrowRight className="text-slate-400" size={18}/>
      </button>

      {/* Anti-scam */}
      <button onClick={() => window.location.href = "/app/anti-arnaque"} data-testid="home-antiscam-cta"
        className="w-full text-left rounded-2xl bg-[#E74C3C]/10 border border-[#E74C3C]/30 p-6 flex gap-4 hover:bg-[#E74C3C]/15 transition-colors">
        <ShieldAlert className="text-[#E74C3C] shrink-0" size={28}/>
        <div>
          <div className="font-display font-bold text-[#1A2B4C]">Vérifie un devis d'agent 🚨</div>
          <p className="text-sm text-slate-600 mt-1">Un permis d'études Canada coûte <b>150 CAD (~98 500 FCFA)</b>. Si on te demande 3 000 000 FCFA, c'est une arnaque. Colle le montant → vérification instantanée.</p>
        </div>
      </button>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, formatMontant } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ArrowLeft, ExternalLink, Clock, ShieldAlert, CheckCircle2, Circle, Sparkles } from "lucide-react";

export default function SimulationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [sim, setSim] = useState(null);
  const [taux, setTaux] = useState({});
  const [checklist, setChecklist] = useState(null);
  const devise = user?.devise_preferee || "XOF";

  useEffect(() => {
    api.get(`/simulations/${id}`).then(({ data }) => setSim(data));
    api.get(`/devises/taux?base=EUR`).then(({ data }) => setTaux(data.rates || {}));
    api.get(`/simulations/${id}/verifier-dossier`).then(({ data }) => setChecklist(data)).catch(() => {});
  }, [id]);

  if (!sim) return <div className="text-slate-400">Chargement…</div>;

  const d = sim.donnees;
  const officialCurrency = d.devise_officielle;

  const convertLocal = (amountOfficial) => {
    // amount is in official currency (CAD/EUR). Convert -> user's devise via EUR.
    if (!taux || Object.keys(taux).length === 0) return null;
    // rates are relative to EUR: taux[X] = X per 1 EUR
    const inEur = officialCurrency === "EUR" ? amountOfficial : amountOfficial / (taux[officialCurrency] || 1);
    const inUserDevise = devise === "EUR" ? inEur : inEur * (taux[devise] || 1);
    return inUserDevise;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => nav("/app")} data-testid="detail-back" className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#0A3D62]">
        <ArrowLeft size={16}/> Accueil
      </button>

      <div className="bg-white rounded-3xl overflow-hidden gv-shadow border border-slate-100">
        <div className="relative h-40 bg-[#0A3D62]">
          <div className="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=1200')] bg-cover bg-center"/>
          <div className="relative p-6 text-white">
            <div className="text-4xl">{d.drapeau}</div>
            <h1 className="font-display text-2xl font-bold mt-1">{d.titre}</h1>
          </div>
        </div>
        <div className="p-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Score</div>
            <div className="font-display text-2xl font-bold text-[#2ECC71]">{sim.score_eligibilite}<span className="text-sm text-slate-400">/100</span></div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total</div>
            <div className="font-display text-base font-bold text-[#1A2B4C]">{d.cout_total} {officialCurrency}</div>
            <div className="text-xs text-slate-500">≈ {formatMontant(convertLocal(d.cout_total), devise)}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Délai</div>
            <div className="font-display text-base font-bold text-[#1A2B4C] flex items-center justify-center gap-1"><Clock size={14}/> {d.delai}</div>
          </div>
        </div>
      </div>

      {/* Anti-scam */}
      <div className="rounded-2xl bg-[#E74C3C]/10 border border-[#E74C3C]/30 p-5 flex gap-3">
        <ShieldAlert className="text-[#E74C3C] shrink-0 mt-0.5" size={22}/>
        <div className="text-sm flex-1">
          <b className="text-[#1A2B4C]">Frais officiels total : {d.cout_total} {officialCurrency}</b>
          <p className="text-slate-600 mt-1">Si un "agent" te demande beaucoup plus pour "accélérer", c'est une arnaque. Utilise uniquement les liens officiels ci-dessous.</p>
          <button onClick={() => nav("/app/anti-arnaque")} data-testid="detail-antiscam-cta"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#E74C3C] hover:underline">
            Vérifier un devis reçu →
          </button>
        </div>
      </div>

      {/* Dossier checklist */}
      {checklist && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 gv-shadow" data-testid="detail-checklist">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#F9CA24]">
                <Sparkles size={12} className="inline mr-1"/> Assistant IA
              </div>
              <div className="font-display font-bold text-lg text-[#1A2B4C]">Vérification du dossier</div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl font-bold text-[#0A3D62]">{checklist.presents}/{checklist.total}</div>
              <div className="text-[10px] text-slate-500 uppercase font-bold">documents</div>
            </div>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-[#2ECC71] transition-all" style={{ width: `${checklist.progression_pct}%` }}/>
          </div>
          <ul className="space-y-2">
            {checklist.checklist.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" data-testid={`checklist-${i}`}>
                {c.present ? (
                  <CheckCircle2 className="text-[#2ECC71] shrink-0 mt-0.5" size={18}/>
                ) : (
                  <Circle className="text-slate-300 shrink-0 mt-0.5" size={18}/>
                )}
                <div className="flex-1">
                  <div className={c.present ? "text-slate-500 line-through" : "text-[#1A2B4C] font-semibold"}>{c.requis}</div>
                  <div className="text-[11px] text-slate-400">Catégorie : {c.categorie}</div>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={() => nav("/app/documents")} data-testid="detail-docs-cta"
            className="mt-4 w-full bg-[#F9CA24] hover:bg-[#ffd93d] text-[#1A2B4C] font-semibold py-2.5 rounded-xl text-sm">
            Compléter mon dossier
          </button>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        {d.etapes.map((e, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow" data-testid={`step-${e.num}`}>
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[#0A3D62] text-white flex items-center justify-center font-display font-bold">
                {e.num}
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg text-[#1A2B4C]">{e.titre}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{e.description}</p>
                <p className="mt-2 text-sm text-slate-500 italic">💡 {e.explication}</p>

                <div className="mt-4 flex flex-wrap gap-2 items-center">
                  {e.cout > 0 ? (
                    <div className="flex items-center gap-2 bg-[#F5F7FA] px-3 py-1.5 rounded-full">
                      <span className="text-sm font-bold text-[#1A2B4C]">{e.cout} {officialCurrency}</span>
                      <span className="text-xs text-slate-500">≈ {formatMontant(convertLocal(e.cout), devise)}</span>
                    </div>
                  ) : (
                    <div className="bg-[#2ECC71]/10 text-[#2ECC71] px-3 py-1.5 rounded-full text-xs font-bold">Gratuit / variable</div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-slate-500"><Clock size={12}/> {e.delai}</div>
                </div>

                <a href={e.lien} target="_blank" rel="noopener noreferrer" data-testid={`step-link-${e.num}`}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#0A3D62] hover:underline">
                  <ExternalLink size={14}/> Lien officiel
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-[#2ECC71]/10 border border-[#2ECC71]/30 p-5 flex gap-3">
        <CheckCircle2 className="text-[#2ECC71] shrink-0 mt-0.5" size={22}/>
        <div className="text-sm text-slate-700">
          <b className="text-[#1A2B4C]">Prêt à te lancer ?</b> Rassemble tes documents dans ton porte-document et suis chaque étape à ton rythme.
        </div>
      </div>
    </div>
  );
}

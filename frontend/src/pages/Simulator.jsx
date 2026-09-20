import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export default function Simulator() {
  const { pays, motif } = useParams();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [donnees, setDonnees] = useState(null);
  const [profil, setProfil] = useState({ age: 25, diplome: "Licence", niveau_langue: "B2", budget: 500000, experience: 0 });
  const [score, setScore] = useState(null);
  const [simId, setSimId] = useState(null);

  useEffect(() => {
    api.get(`/simulations/donnees/${pays}/${motif}`).then(({ data }) => setDonnees(data));
  }, [pays, motif]);

  const submit = async () => {
    try {
      const { data } = await api.post("/simulations", { pays_destination: pays, motif, profil });
      setScore(data.score_eligibilite);
      setSimId(data.id);
      setStep(3);
    } catch (e) { toast.error("Erreur lors de la création"); }
  };

  const scoreColor = score >= 75 ? "#2ECC71" : score >= 50 ? "#F9CA24" : "#E74C3C";
  const scoreLabel = score >= 75 ? "Excellent " : score >= 50 ? "Bon profil" : "À renforcer";

  if (!donnees) return <div className="text-slate-400">Chargement…</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => nav(-1)} data-testid="sim-back" className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#0A3D62]">
        <ArrowLeft size={16}/> Retour
      </button>

      <div className="flex gap-1">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-[#F9CA24]" : "bg-slate-200"}`}/>
        ))}
      </div>

      <div className="text-center">
        <div className="text-4xl">{donnees.drapeau}</div>
        <h1 className="font-display text-2xl font-bold text-[#1A2B4C] mt-2">{donnees.titre}</h1>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 gv-shadow space-y-4 gv-fadeup">
          <h2 className="font-display font-bold text-lg text-[#1A2B4C]">Parle-nous de toi</h2>
          {[
            { l: "Âge", k: "age", t: "number" },
            { l: "Diplôme", k: "diplome", opts: ["Aucun", "Bac", "Licence", "Master", "Doctorat"] },
            { l: "Niveau de langue", k: "niveau_langue", opts: ["A1", "A2", "B1", "B2", "C1", "C2"] },
            { l: "Budget disponible (FCFA)", k: "budget", t: "number" },
          ].map((f) => (
            <div key={f.k}>
              <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">{f.l}</label>
              {f.opts ? (
                <select value={profil[f.k]} onChange={(e) => setProfil({ ...profil, [f.k]: e.target.value })}
                  data-testid={`sim-profil-${f.k}`}
                  className="mt-1.5 w-full px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]">
                  {f.opts.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.t} value={profil[f.k]} onChange={(e) => setProfil({ ...profil, [f.k]: e.target.value })}
                  data-testid={`sim-profil-${f.k}`}
                  className="mt-1.5 w-full px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"/>
              )}
            </div>
          ))}
          <button onClick={() => setStep(2)} data-testid="sim-step1-next"
            className="w-full bg-[#0A3D62] hover:bg-[#0d4a78] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2">
            Continuer <ArrowRight size={18}/>
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 gv-shadow space-y-4 gv-fadeup">
          <h2 className="font-display font-bold text-lg text-[#1A2B4C]">Récap de ton profil</h2>
          <div className="space-y-2 text-sm">
            {Object.entries(profil).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500 capitalize">{k.replace("_", " ")}</span>
                <span className="font-semibold text-[#1A2B4C]">{v}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-[#1A2B4C] font-semibold py-3.5 rounded-xl">Modifier</button>
            <button onClick={submit} data-testid="sim-submit"
              className="flex-1 bg-[#F9CA24] hover:bg-[#ffd93d] text-[#1A2B4C] font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2">
              Calculer <Check size={18}/>
            </button>
          </div>
        </div>
      )}

      {step === 3 && score !== null && (
        <div className="bg-white rounded-2xl p-8 border border-slate-100 gv-shadow text-center gv-fadeup">
          <h2 className="font-display font-bold text-xl text-[#1A2B4C]">Ton score d'éligibilité</h2>
          <div className="relative w-40 h-40 mx-auto mt-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#F5F7FA" strokeWidth="8"/>
              <circle cx="50" cy="50" r="45" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray="283" strokeDashoffset={283 - (283 * score / 100)} className="gv-gauge-anim"/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-5xl font-bold" style={{ color: scoreColor }}>{score}</div>
              <div className="text-xs text-slate-500">/100</div>
            </div>
          </div>
          <div className="mt-4 font-semibold text-lg" style={{ color: scoreColor }}>{scoreLabel}</div>
          <p className="mt-3 text-sm text-slate-600">Voici les étapes à suivre. On les détaille avec les coûts réels dans ta devise.</p>
          <button onClick={() => nav(`/app/simulation/${simId}`)} data-testid="sim-view-steps"
            className="mt-6 w-full bg-[#0A3D62] hover:bg-[#0d4a78] text-white font-semibold py-3.5 rounded-xl">
            Voir les étapes détaillées
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatMontant } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ShieldAlert, ShieldCheck, TrendingUp, ArrowRight } from "lucide-react";

const DEVISES_LOCALES = ["XOF", "XAF", "EUR", "CAD", "MAD", "DZD", "TND", "GHS", "NGN", "USD"];

export default function AntiScam() {
  const { user } = useAuth();
  const [paysList, setPaysList] = useState([]);
  const [form, setForm] = useState({
    pays: "CA", motif: "etudes",
    montant_demande: "", devise_demandee: "XOF",
    devise_utilisateur: user?.devise_preferee || "XOF",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/simulations/pays").then(({ data }) => setPaysList(data));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/anti-arnaque/comparer", {
        ...form, montant_demande: parseFloat(form.montant_demande) || 0,
      });
      setResult(data);
    } catch (err) { toast.error("Erreur lors de la comparaison"); }
    setLoading(false);
  };

  const motifs = paysList.find((p) => p.code === form.pays)?.motifs || ["etudes", "travail", "famille"];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#E74C3C]/15 text-[#E74C3C] rounded-full text-xs font-bold uppercase tracking-widest mb-2">
          <ShieldAlert size={14}/> Anti-arnaque
        </div>
        <h1 className="font-display text-3xl font-bold text-[#1A2B4C]">Vérifie un devis</h1>
        <p className="text-sm text-slate-600 mt-1">Un "agent" te propose un prix ? Colle-le ici — on te dit s'il correspond aux frais officiels.</p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl p-6 border border-slate-100 gv-shadow space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">Pays</label>
            <select value={form.pays} onChange={(e) => setForm({ ...form, pays: e.target.value })}
              data-testid="anti-pays" className="mt-1.5 w-full px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]">
              {paysList.map((p) => <option key={p.code} value={p.code}>{p.drapeau} {p.pays}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">Motif</label>
            <select value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })}
              data-testid="anti-motif" className="mt-1.5 w-full px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]">
              {motifs.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">Montant demandé par l'agent</label>
          <div className="grid grid-cols-[1fr,120px] gap-2 mt-1.5">
            <input type="number" required min="1" placeholder="Ex: 3000000" value={form.montant_demande}
              onChange={(e) => setForm({ ...form, montant_demande: e.target.value })}
              data-testid="anti-montant"
              className="px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"/>
            <select value={form.devise_demandee} onChange={(e) => setForm({ ...form, devise_demandee: e.target.value })}
              data-testid="anti-devise" className="px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]">
              {DEVISES_LOCALES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} data-testid="anti-submit"
          className="w-full bg-[#0A3D62] hover:bg-[#0d4a78] text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {loading ? "Analyse…" : <>Analyser ce devis <ArrowRight size={18}/></>}
        </button>
      </form>

      {result && (
        <div className="gv-fadeup space-y-4" data-testid="anti-result">
          <div className="rounded-2xl p-6 border-2" style={{ backgroundColor: `${result.couleur}18`, borderColor: `${result.couleur}55` }}>
            <div className="flex items-start gap-4">
              {result.verdict === "SAFE" ? <ShieldCheck size={40} style={{ color: result.couleur }}/> : <ShieldAlert size={40} style={{ color: result.couleur }}/>}
              <div className="flex-1">
                <div className="font-display font-bold text-2xl text-[#1A2B4C]">{result.label}</div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">{result.message}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Frais officiels</div>
              <div className="font-display text-xl font-bold text-[#2ECC71] mt-1">{result.cout_officiel.montant} {result.cout_officiel.devise}</div>
              <div className="text-xs text-slate-500">≈ {formatMontant(result.cout_officiel.en_devise_utilisateur, result.cout_officiel.devise_utilisateur)}</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Prix demandé</div>
              <div className="font-display text-xl font-bold" style={{ color: result.couleur }}>{formatMontant(result.montant_demande.montant, result.montant_demande.devise)}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1"><TrendingUp size={12}/> {result.ratio}× le prix officiel</div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#0A3D62] text-white p-5">
            <div className="text-xs font-bold uppercase tracking-widest text-[#F9CA24]">Notre conseil</div>
            <p className="mt-2 text-sm leading-relaxed">{result.conseil_final}</p>
          </div>
        </div>
      )}
    </div>
  );
}

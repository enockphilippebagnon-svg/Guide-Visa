import React, { useEffect, useState } from "react";
import { X, Sparkles, CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function AIAnalyzer({ open, onClose, docId, simulationId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open || !docId) return;
    setLoading(true); setResult(null);
    api.post(`/documents/${docId}/analyser`, simulationId ? { simulation_id: simulationId } : {})
      .then(({ data }) => setResult(data))
      .catch(() => toast.error("Analyse IA impossible"))
      .finally(() => setLoading(false));
  }, [open, docId, simulationId]);

  if (!open) return null;

  const Icon = result?.est_conforme === true ? CheckCircle2 :
               result?.est_conforme === false ? XCircle : AlertTriangle;
  const iconColor = result?.est_conforme === true ? "#2ECC71" :
                    result?.est_conforme === false ? "#E74C3C" : "#F9CA24";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A3D62] to-[#1a5a8f] flex items-center justify-center">
              <Sparkles className="text-[#F9CA24]" size={18}/>
            </div>
            <div>
              <div className="font-display font-bold text-[#1A2B4C]">Assistant IA</div>
              <div className="text-[10px] text-slate-500">Analyse par Gemini</div>
            </div>
          </div>
          <button onClick={onClose} data-testid="ai-close" className="p-1"><X size={20}/></button>
        </div>

        <div className="p-5">
          {loading && (
            <div className="py-10 text-center">
              <Loader2 className="animate-spin mx-auto text-[#0A3D62]" size={32}/>
              <div className="mt-3 text-sm text-slate-600">L'IA analyse ton document…</div>
              <div className="text-xs text-slate-400 mt-1">Ça prend 10-20 secondes ⏳</div>
            </div>
          )}

          {result && result.status === "erreur" && (
            <div className="rounded-2xl bg-[#E74C3C]/10 border border-[#E74C3C]/30 p-4 text-sm text-slate-700">
              {result.message}
            </div>
          )}

          {result && result.status === "non_supporte" && (
            <div className="rounded-2xl bg-[#F9CA24]/15 border border-[#F9CA24]/40 p-4 text-sm text-slate-700">
              {result.message}
            </div>
          )}

          {result && result.status === "ok" && (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ backgroundColor: `${iconColor}18`, borderColor: `${iconColor}44` }}>
                <Icon size={28} style={{ color: iconColor }} className="shrink-0"/>
                <div>
                  <div className="font-display font-bold text-[#1A2B4C]">{result.type_detecte || "Document"}</div>
                  <div className="text-sm text-slate-700 mt-1">{result.verdict_court}</div>
                  {typeof result.score_qualite === "number" && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="text-xs text-slate-500">Qualité :</div>
                      <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${result.score_qualite}%`, backgroundColor: iconColor }}/>
                      </div>
                      <div className="text-xs font-bold text-[#1A2B4C]">{result.score_qualite}/100</div>
                    </div>
                  )}
                </div>
              </div>

              {result.probleme?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#E74C3C] mb-2">⚠️ Problèmes détectés</div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {result.probleme.map((p, i) => (
                      <li key={i} className="flex gap-2"><span className="text-[#E74C3C]">•</span> {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.manque?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#F9CA24] mb-2">📋 Ce qu'il manque</div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {result.manque.map((p, i) => (
                      <li key={i} className="flex gap-2"><span className="text-[#F9CA24]">•</span> {p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommandations?.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#2ECC71] mb-2">💡 Recommandations</div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {result.recommandations.map((p, i) => (
                      <li key={i} className="flex gap-2"><span className="text-[#2ECC71]">•</span> {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

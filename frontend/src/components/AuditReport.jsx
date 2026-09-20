import React, { useState } from "react";
import { X, FileCheck2, Loader2, CheckCircle2, XCircle, AlertTriangle, Download, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

export default function AuditReport({ open, onClose, simId }) {
  const [loading, setLoading] = useState(false);
  const [rapport, setRapport] = useState(null);

  const lancer = async () => {
    setLoading(true); setRapport(null);
    try {
      const { data } = await api.post(`/simulations/${simId}/auditer-tout`);
      setRapport(data);
    } catch (e) {
      toast.error("Audit impossible pour le moment.");
    }
    setLoading(false);
  };

  const telecharger = () => {
    if (!rapport) return;
    const html = buildHtml(rapport);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-audit-${rapport.pays}-${rapport.motif}-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport telecharge. Ouvre-le puis Imprimer, PDF pour le sauvegarder en PDF.");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A3D62] to-[#1a5a8f] flex items-center justify-center">
              <FileCheck2 className="text-[#F9CA24]" size={18}/>
            </div>
            <div>
              <div className="font-display font-bold text-[#1A2B4C]">Audit complet du dossier</div>
              <div className="text-[10px] text-slate-500">Analyse IA de tous tes documents</div>
            </div>
          </div>
          <button onClick={onClose} data-testid="audit-close" className="p-1"><X size={20}/></button>
        </div>

        <div className="p-5">
          {!rapport && !loading && (
            <div className="text-center py-6">
              <Sparkles className="mx-auto text-[#F9CA24]" size={36}/>
              <div className="mt-3 font-display font-bold text-lg text-[#1A2B4C]">Lancer l'audit</div>
              <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
                L'IA va analyser chaque document image de ton porte-document, verifier leur conformite et te produire un rapport complet telechargeable.
              </p>
              <p className="mt-1 text-xs text-slate-400">Duree : 30 a 90 secondes selon le nombre de documents.</p>
              <button onClick={lancer} data-testid="audit-start"
                className="mt-5 bg-[#0A3D62] hover:bg-[#0d4a78] text-white font-semibold px-6 py-3 rounded-xl">
                Analyser tout mon dossier
              </button>
            </div>
          )}

          {loading && (
            <div className="py-10 text-center">
              <Loader2 className="animate-spin mx-auto text-[#0A3D62]" size={36}/>
              <div className="mt-3 text-sm text-slate-600">L'IA analyse chaque document...</div>
              <div className="text-xs text-slate-400 mt-1">Merci de patienter</div>
            </div>
          )}

          {rapport && (
            <div className="space-y-5" data-testid="audit-result">
              <div className="rounded-2xl p-5 border-2" style={{ backgroundColor: `${rapport.couleur}18`, borderColor: `${rapport.couleur}55` }}>
                <div className="flex items-center gap-3">
                  <div className="font-display text-5xl font-bold" style={{ color: rapport.couleur }}>
                    {rapport.score_global}
                    <span className="text-xl text-slate-400">/100</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Score global</div>
                    <div className="font-display font-bold text-[#1A2B4C]">{rapport.verdict_global}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><b className="text-[#1A2B4C] block text-base">{rapport.docs_uploaded}</b><span className="text-slate-500">documents</span></div>
                  <div><b className="text-[#2ECC71] block text-base">{rapport.docs_analyses?.length || 0}</b><span className="text-slate-500">analyses</span></div>
                  <div><b className="text-[#E74C3C] block text-base">{rapport.docs_manquants?.length || 0}</b><span className="text-slate-500">manquants</span></div>
                </div>
              </div>

              {rapport.docs_manquants?.length > 0 && (
                <section>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#E74C3C] mb-2">A ajouter</div>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {rapport.docs_manquants.map((m, i) => (
                      <li key={i} className="flex gap-2"><XCircle size={16} className="text-[#E74C3C] shrink-0 mt-0.5"/> {m}</li>
                    ))}
                  </ul>
                </section>
              )}

              {rapport.docs_analyses?.length > 0 && (
                <section>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#0A3D62] mb-2">Documents analyses</div>
                  <div className="space-y-3">
                    {rapport.docs_analyses.map((d, i) => (
                      <div key={i} className="bg-[#F5F7FA] rounded-xl p-3" data-testid={`audit-doc-${i}`}>
                        <div className="flex items-center gap-2">
                          {d.est_conforme === true ? <CheckCircle2 className="text-[#2ECC71]" size={18}/>
                            : d.est_conforme === false ? <XCircle className="text-[#E74C3C]" size={18}/>
                            : <AlertTriangle className="text-[#F9CA24]" size={18}/>}
                          <div className="font-semibold text-sm text-[#1A2B4C] flex-1">{d.requis}</div>
                          {typeof d.score_qualite === "number" && (
                            <div className="text-xs font-bold text-slate-500">{d.score_qualite}/100</div>
                          )}
                        </div>
                        {d.verdict && <div className="text-xs text-slate-600 mt-1.5 pl-6">{d.verdict}</div>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <button onClick={telecharger} data-testid="audit-download"
                className="w-full bg-[#F9CA24] hover:bg-[#ffd93d] text-[#1A2B4C] font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                <Download size={18}/> Telecharger le rapport
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildHtml(r) {
  const esc = (s) => String(s || "").replace(/</g, "&lt;");
  const date = new Date(r.date_audit).toLocaleDateString("fr-FR");
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Rapport ${esc(r.procedure)}</title>
<style>
body{font-family:'Segoe UI',sans-serif;color:#1A2B4C;max-width:800px;margin:2em auto;padding:2em;line-height:1.6}
h1{font-size:2em;color:#0A3D62;margin-bottom:0}
.brand{color:#64748B;font-size:.85em;margin-bottom:2em}
.score{display:inline-block;padding:1em 2em;border-radius:1em;background:${r.couleur}22;border:2px solid ${r.couleur};margin:1em 0}
.score b{font-size:3em;color:${r.couleur};display:block}
h2{color:#0A3D62;border-bottom:2px solid #F9CA24;padding-bottom:.3em;margin-top:2em}
.doc{background:#F5F7FA;padding:1em;border-radius:.5em;margin:.7em 0}
.doc-title{font-weight:700;color:#1A2B4C}
.ok{color:#2ECC71}.ko{color:#E74C3C}.warn{color:#F9CA24}
ul{padding-left:1.2em}
.footer{margin-top:3em;padding-top:1em;border-top:1px solid #E2E8F0;color:#64748B;font-size:.85em}
</style></head><body>
<h1>Rapport d'audit du dossier</h1>
<div class="brand">Guide Visa, un produit Digitalk Afrique, Cote d'Ivoire, digitalkafrique@gmail.com, +225 01 42 07 32 07</div>
<p><b>Utilisateur :</b> ${esc(r.utilisateur)}<br>
<b>Procedure :</b> ${esc(r.procedure)} (${esc(r.pays)})<br>
<b>Date de l'audit :</b> ${date}</p>

<div class="score"><b>${r.score_global}/100</b>${esc(r.verdict_global)}</div>

<h2>Vue d'ensemble</h2>
<ul>
<li>Documents requis : ${r.total_requis}</li>
<li>Documents televerses : ${r.docs_uploaded}</li>
<li>Documents analyses par l'IA : ${r.docs_analyses?.length || 0}</li>
<li>Documents manquants : ${r.docs_manquants?.length || 0}</li>
</ul>

${r.docs_manquants?.length ? `<h2>Documents manquants</h2><ul>${r.docs_manquants.map(m=>`<li class="ko">${esc(m)}</li>`).join("")}</ul>` : ""}

${r.points_forts?.length ? `<h2>Points forts</h2><ul>${r.points_forts.map(p=>`<li class="ok">${esc(p)}</li>`).join("")}</ul>` : ""}

${r.points_faibles?.length ? `<h2>Points a corriger</h2><ul>${r.points_faibles.map(p=>`<li class="warn">${esc(p)}</li>`).join("")}</ul>` : ""}

<h2>Detail par document</h2>
${(r.docs_analyses || []).map(d => `<div class="doc">
  <div class="doc-title">${esc(d.requis)} (${esc(d.categorie)})</div>
  <div>Fichier : ${esc(d.nom_fichier)} | Type detecte : ${esc(d.type_detecte || "?")} | Score : ${d.score_qualite ?? "?"}/100</div>
  ${d.verdict ? `<p><i>${esc(d.verdict)}</i></p>` : ""}
  ${d.probleme?.length ? `<b>Problemes :</b><ul>${d.probleme.map(x=>`<li class="ko">${esc(x)}</li>`).join("")}</ul>` : ""}
  ${d.recommandations?.length ? `<b>Recommandations :</b><ul>${d.recommandations.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>` : ""}
</div>`).join("")}

<div class="footer">Rapport genere par l'assistant IA Guide Visa. Pour toute question : digitalkafrique@gmail.com</div>
</body></html>`;
}

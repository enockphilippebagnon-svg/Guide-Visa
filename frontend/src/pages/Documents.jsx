import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Upload, Trash2, FileText, FolderClosed, Sparkles } from "lucide-react";
import AIAnalyzer from "../components/AIAnalyzer";

const CATEGORIES = ["Identité", "Études", "Finances", "Santé", "Autres"];

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [cat, setCat] = useState("Identité");
  const [analyzing, setAnalyzing] = useState(null);
  const [sims, setSims] = useState([]);
  const [expiration, setExpiration] = useState("");
  const inputRef = useRef(null);

  const load = () => api.get("/documents").then(({ data }) => setDocs(data));
  useEffect(() => {
    load();
    api.get("/simulations/mes").then(({ data }) => setSims(data)).catch(() => {});
  }, []);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 Mo"); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result.split(",")[1];
      try {
        await api.post("/documents", {
          nom: file.name, categorie: cat, contenu_base64: b64, mime_type: file.type,
          date_expiration: expiration || null,
        });
        toast.success("Document ajouté");
        setExpiration("");
        load();
      } catch { toast.error("Erreur upload"); }
    };
    reader.readAsDataURL(file);
  };

  const del = async (id) => {
    try { await api.delete(`/documents/${id}`); toast.success("Supprimé"); load(); }
    catch { toast.error("Erreur"); }
  };

  const grouped = CATEGORIES.map((c) => ({ cat: c, items: docs.filter((d) => d.categorie === c) }));
  const total = docs.length;
  const goal = 8;
  const pct = Math.min(100, Math.round((total / goal) * 100));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1A2B4C]">Mon porte-document</h1>
        <p className="text-sm text-slate-600">Range tes documents par catégorie, consultation possible hors ligne.</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-[#1A2B4C]">Dossier complété</div>
          <div className="text-sm font-bold text-[#2ECC71]">{pct}%</div>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[#2ECC71] transition-all" style={{ width: `${pct}%` }}/>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-slate-200 text-center">
        <Upload className="mx-auto text-[#0A3D62]" size={28}/>
        <div className="mt-3 font-semibold text-[#1A2B4C]">Ajouter un document</div>
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} data-testid={`doc-cat-${c}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${cat === c ? "bg-[#0A3D62] text-white" : "bg-slate-100 text-slate-600"}`}>
              {c}
            </button>
          ))}
        </div>
        <input ref={inputRef} type="file" hidden onChange={(e) => upload(e.target.files[0])} data-testid="doc-file-input"/>
        <div className="mt-4 max-w-xs mx-auto">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Date d'expiration (optionnel)</label>
          <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)}
            data-testid="doc-expiration-input"
            className="w-full px-3 py-2 bg-[#F5F7FA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"/>
        </div>
        <button onClick={() => inputRef.current?.click()} data-testid="doc-upload-btn"
          className="mt-4 bg-[#F9CA24] hover:bg-[#ffd93d] text-[#1A2B4C] font-semibold px-5 py-2.5 rounded-xl">
          Choisir un fichier (max 10 Mo)
        </button>
      </div>

      <div className="space-y-4">
        {grouped.map((g) => (
          <div key={g.cat} className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow">
            <div className="flex items-center gap-2 mb-3">
              <FolderClosed className="text-[#0A3D62]" size={18}/>
              <div className="font-display font-bold text-[#1A2B4C]">{g.cat}</div>
              <div className="ml-auto text-xs text-slate-500">{g.items.length} fichier(s)</div>
            </div>
            {g.items.length === 0 ? (
              <div className="text-sm text-slate-400 italic">Aucun document</div>
            ) : (
              <div className="space-y-2">
                {g.items.map((d) => {
                  const de = d.date_expiration ? new Date(d.date_expiration + "T00:00:00") : null;
                  const jrsRestants = de ? Math.ceil((de - new Date()) / 86400000) : null;
                  const urgence = jrsRestants == null ? null : jrsRestants < 0 ? "expire" : jrsRestants <= 30 ? "critique" : jrsRestants <= 90 ? "attention" : "ok";
                  const badgeCls = urgence === "expire" ? "bg-[#E74C3C]/15 text-[#E74C3C]"
                    : urgence === "critique" ? "bg-[#E74C3C]/10 text-[#E74C3C]"
                    : urgence === "attention" ? "bg-[#F9CA24]/20 text-[#8a6d00]" : "bg-slate-100 text-slate-500";
                  return (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F5F7FA]" data-testid={`doc-item-${d.id}`}>
                    <FileText className="text-slate-400" size={18}/>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#1A2B4C] truncate">{d.nom}</div>
                      {de && (
                        <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`} data-testid={`doc-exp-${d.id}`}>
                          {urgence === "expire" ? "Expiré" : urgence === "critique" ? `Expire dans ${jrsRestants}j` : urgence === "attention" ? `Expire dans ${jrsRestants}j` : `Valide jusqu'au ${de.toLocaleDateString("fr-FR")}`}
                        </span>
                      )}
                    </div>
                    {d.mime_type?.startsWith("image/") && (
                      <button onClick={() => setAnalyzing(d.id)} data-testid={`doc-ai-${d.id}`}
                        title="Analyser avec l'IA"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-br from-[#0A3D62] to-[#1a5a8f] text-white text-xs font-semibold hover:opacity-90">
                        <Sparkles size={12} className="text-[#F9CA24]"/> IA
                      </button>
                    )}
                    <button onClick={() => del(d.id)} className="text-slate-400 hover:text-[#E74C3C] p-1" data-testid={`doc-del-${d.id}`}>
                      <Trash2 size={16}/>
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <AIAnalyzer open={!!analyzing} onClose={() => setAnalyzing(null)} docId={analyzing} simulationId={sims[0]?.id}/>
    </div>
  );
}

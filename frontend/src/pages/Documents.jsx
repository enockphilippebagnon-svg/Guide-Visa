import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Upload, Trash2, FileText, FolderClosed } from "lucide-react";

const CATEGORIES = ["Identité", "Études", "Finances", "Santé", "Autres"];

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [cat, setCat] = useState("Identité");
  const inputRef = useRef(null);

  const load = () => api.get("/documents").then(({ data }) => setDocs(data));
  useEffect(() => { load(); }, []);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 Mo"); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result.split(",")[1];
      try {
        await api.post("/documents", { nom: file.name, categorie: cat, contenu_base64: b64, mime_type: file.type });
        toast.success("Document ajouté");
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
        <p className="text-sm text-slate-600">Range tes documents par catégorie — consultation possible hors ligne.</p>
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
                {g.items.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F5F7FA]" data-testid={`doc-item-${d.id}`}>
                    <FileText className="text-slate-400" size={18}/>
                    <div className="text-sm text-[#1A2B4C] flex-1 truncate">{d.nom}</div>
                    <button onClick={() => del(d.id)} className="text-slate-400 hover:text-[#E74C3C] p-1" data-testid={`doc-del-${d.id}`}>
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

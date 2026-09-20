import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ExternalLink, Landmark, Search } from "lucide-react";

export default function Links() {
  const [liens, setLiens] = useState([]);
  const [cat, setCat] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => { api.get("/liens").then(({ data }) => setLiens(data)); }, []);

  const cats = Array.from(new Set(liens.map((l) => l.categorie)));
  const filtered = liens.filter((l) =>
    (!cat || l.categorie === cat) &&
    (!q || l.titre.toLowerCase().includes(q.toLowerCase()) || l.description.toLowerCase().includes(q.toLowerCase()))
  );

  const clic = async (id, url) => {
    try { await api.post(`/liens/${id}/clic`); } catch {}
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#1A2B4C]">Liens utiles</h1>
        <p className="text-sm text-slate-600">Ressources officielles vérifiées par Digitalk Afrique.</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…"
          data-testid="links-search"
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"/>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setCat(null)} data-testid="links-cat-all"
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${!cat ? "bg-[#0A3D62] text-white" : "bg-white text-slate-600"}`}>
          Tous
        </button>
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} data-testid={`links-cat-${c}`}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${cat === c ? "bg-[#0A3D62] text-white" : "bg-white text-slate-600"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((l) => (
          <button key={l.id} onClick={() => clic(l.id, l.url)} data-testid={`link-${l.id}`}
            className="w-full text-left bg-white rounded-2xl p-5 border border-slate-100 gv-shadow gv-shadow-hover hover:-translate-y-0.5 transition-transform flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-[#0A3D62]/10 flex items-center justify-center shrink-0">
              <Landmark className="text-[#0A3D62]" size={18}/>
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <div className="font-display font-bold text-[#1A2B4C]">{l.titre}</div>
                <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0A3D62]/10 text-[#0A3D62] uppercase">Officiel</div>
              </div>
              <div className="text-sm text-slate-600 mt-1 leading-relaxed">{l.description}</div>
              <div className="flex gap-3 mt-2 text-xs text-slate-500">
                <span> {l.categorie}</span>
                <span> {l.cout}</span>
              </div>
            </div>
            <ExternalLink className="text-slate-400 shrink-0" size={18}/>
          </button>
        ))}
        {filtered.length === 0 && <div className="text-center text-slate-400 py-10">Aucun résultat</div>}
      </div>
    </div>
  );
}

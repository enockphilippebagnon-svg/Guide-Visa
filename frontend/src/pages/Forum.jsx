import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Plus, MessageCircle, Eye, X } from "lucide-react";

export default function Forum() {
  const [cats, setCats] = useState([]);
  const [topics, setTopics] = useState([]);
  const [sel, setSel] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ categorie_slug: "", titre: "", contenu: "" });

  const load = () => api.get(`/forum/topics${sel ? `?categorie_slug=${sel}` : ""}`).then(({ data }) => setTopics(data));

  useEffect(() => { api.get("/forum/categories").then(({ data }) => setCats(data)); }, []);
  useEffect(() => { load(); }, [sel]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/forum/topics", form);
      toast.success("Sujet publié");
      setShowNew(false); setForm({ categorie_slug: "", titre: "", contenu: "" });
      load();
    } catch { toast.error("Erreur"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#1A2B4C]">Forum</h1>
          <p className="text-sm text-slate-600">Échangez avec la communauté.</p>
        </div>
        <button onClick={() => setShowNew(true)} data-testid="forum-new-btn"
          className="flex items-center gap-2 bg-[#F9CA24] hover:bg-[#ffd93d] text-[#1A2B4C] font-semibold px-4 py-2.5 rounded-full">
          <Plus size={18}/> Nouveau sujet
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button onClick={() => setSel(null)} data-testid="forum-cat-all"
          className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${!sel ? "bg-[#0A3D62] text-white" : "bg-white text-slate-600"}`}>
          Tous
        </button>
        {cats.map((c) => (
          <button key={c.slug} onClick={() => setSel(c.slug)} data-testid={`forum-cat-${c.slug}`}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold ${sel === c.slug ? "bg-[#0A3D62] text-white" : "bg-white text-slate-600"}`}>
            {c.nom}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {topics.map((t) => (
          <Link key={t.id} to={`/app/forum/${t.id}`} data-testid={`topic-${t.id}`}
            className="block bg-white rounded-2xl p-5 border border-slate-100 gv-shadow gv-shadow-hover hover:-translate-y-0.5 transition-transform">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F9CA24] text-[#1A2B4C] flex items-center justify-center font-bold shrink-0">
                {t.auteur_nom?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-display font-bold text-[#1A2B4C]">{t.titre}</div>
                <div className="text-xs text-slate-500 mt-1">par {t.auteur_nom} • {new Date(t.date_creation).toLocaleDateString("fr-FR")}</div>
                <div className="flex gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MessageCircle size={12}/> {t.nb_reponses}</span>
                  <span className="flex items-center gap-1"><Eye size={12}/> {t.vues}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {topics.length === 0 && <div className="text-center text-slate-400 py-10">Aucun sujet — sois le premier !</div>}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-xl text-[#1A2B4C]">Nouveau sujet</h3>
              <button onClick={() => setShowNew(false)} data-testid="forum-new-close" className="p-1"><X size={20}/></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <select required value={form.categorie_slug} onChange={(e) => setForm({ ...form, categorie_slug: e.target.value })}
                data-testid="forum-new-cat"
                className="w-full px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]">
                <option value="">Choisir une catégorie</option>
                {cats.map((c) => <option key={c.slug} value={c.slug}>{c.nom}</option>)}
              </select>
              <input required type="text" placeholder="Titre" value={form.titre}
                onChange={(e) => setForm({ ...form, titre: e.target.value })}
                data-testid="forum-new-titre"
                className="w-full px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"/>
              <textarea required rows={5} placeholder="Ton message…" value={form.contenu}
                onChange={(e) => setForm({ ...form, contenu: e.target.value })}
                data-testid="forum-new-contenu"
                className="w-full px-4 py-3 bg-[#F5F7FA] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"/>
              <button type="submit" data-testid="forum-new-submit"
                className="w-full bg-[#0A3D62] hover:bg-[#0d4a78] text-white font-semibold py-3 rounded-xl">
                Publier
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

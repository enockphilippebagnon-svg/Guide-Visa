import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { ArrowLeft, Send } from "lucide-react";

export default function ForumTopic() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  const load = () => api.get(`/forum/topics/${id}`).then(({ data }) => setData(data));
  useEffect(() => { load(); }, [id]);

  const send = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    try { await api.post(`/forum/topics/${id}/reponses`, { contenu: msg }); setMsg(""); toast.success("Réponse envoyée"); load(); }
    catch { toast.error("Erreur"); }
  };

  if (!data) return <div className="text-slate-400">Chargement…</div>;
  const t = data.topic;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <button onClick={() => nav("/app/forum")} data-testid="topic-back" className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#0A3D62]">
        <ArrowLeft size={16}/> Forum
      </button>

      <div className="bg-white rounded-2xl p-6 border border-slate-100 gv-shadow">
        <h1 className="font-display text-2xl font-bold text-[#1A2B4C]">{t.titre}</h1>
        <div className="text-xs text-slate-500 mt-1">par {t.auteur_nom} • {new Date(t.date_creation).toLocaleDateString("fr-FR")}</div>
        <p className="mt-4 text-[#1A2B4C] leading-relaxed whitespace-pre-line">{t.contenu}</p>
      </div>

      <div className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">{t.nb_reponses} réponse(s)</div>

      {data.reponses.map((r) => (
        <div key={r.id} className="bg-white rounded-2xl p-5 border border-slate-100" data-testid={`reponse-${r.id}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#F9CA24] text-[#1A2B4C] flex items-center justify-center font-bold text-sm">
              {r.auteur_nom?.[0]?.toUpperCase()}
            </div>
            <div className="text-sm font-semibold text-[#1A2B4C]">{r.auteur_nom}</div>
            <div className="text-xs text-slate-400 ml-auto">{new Date(r.date_creation).toLocaleDateString("fr-FR")}</div>
          </div>
          <p className="text-sm text-[#1A2B4C] leading-relaxed whitespace-pre-line">{r.contenu}</p>
        </div>
      ))}

      <form onSubmit={send} className="fixed bottom-16 lg:bottom-0 inset-x-0 z-30 backdrop-blur-xl bg-white/95 border-t border-slate-200 p-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input type="text" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ta réponse…"
            data-testid="reponse-input"
            className="flex-1 px-4 py-3 bg-[#F5F7FA] rounded-full focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"/>
          <button type="submit" data-testid="reponse-send"
            className="w-12 h-12 rounded-full bg-[#0A3D62] hover:bg-[#0d4a78] text-white flex items-center justify-center">
            <Send size={18}/>
          </button>
        </div>
      </form>
    </div>
  );
}

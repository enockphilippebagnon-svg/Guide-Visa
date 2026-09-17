import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Users, FileText, MessagesSquare, Link2, Ban, Trash2, Plus } from "lucide-react";

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [liens, setLiens] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [newLien, setNewLien] = useState({ categorie: "", titre: "", url: "", description: "", pays: "INT", cout: "Gratuit" });

  const load = () => {
    api.get("/admin/stats").then(({ data }) => setStats(data));
    api.get("/admin/users").then(({ data }) => setUsers(data));
    api.get("/admin/liens").then(({ data }) => setLiens(data));
    api.get("/admin/topics").then(({ data }) => setTopics(data));
  };
  useEffect(() => { load(); }, []);

  const suspend = async (u) => {
    const next = u.statut === "suspendu" ? "actif" : "suspendu";
    try { await api.patch(`/admin/users/${u.id}`, { statut: next }); toast.success(`Utilisateur ${next}`); load(); }
    catch { toast.error("Erreur"); }
  };
  const delUser = async (u) => {
    if (!confirm(`Supprimer ${u.email} ?`)) return;
    try { await api.delete(`/admin/users/${u.id}`); toast.success("Supprimé"); load(); }
    catch { toast.error("Erreur"); }
  };
  const addLien = async (e) => {
    e.preventDefault();
    try { await api.post("/admin/liens", newLien); toast.success("Lien ajouté"); setNewLien({ categorie: "", titre: "", url: "", description: "", pays: "INT", cout: "Gratuit" }); load(); }
    catch { toast.error("Erreur"); }
  };
  const delLien = async (id) => { await api.delete(`/admin/liens/${id}`); toast.success("Supprimé"); load(); };
  const delTopic = async (id) => { if (!confirm("Supprimer ce sujet ?")) return; await api.delete(`/forum/topics/${id}`); toast.success("Supprimé"); load(); };

  const cards = stats ? [
    { icon: Users, label: "Utilisateurs", val: stats.nb_users },
    { icon: FileText, label: "Simulations", val: stats.nb_simulations },
    { icon: MessagesSquare, label: "Sujets forum", val: stats.nb_topics },
    { icon: Link2, label: "Liens utiles", val: stats.nb_liens },
  ] : [];

  const tabs = [
    { k: "dashboard", l: "Dashboard" },
    { k: "users", l: "Utilisateurs" },
    { k: "liens", l: "Liens" },
    { k: "forum", l: "Forum" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-[#F9CA24]">Espace Admin</div>
        <h1 className="font-display text-3xl font-bold text-[#1A2B4C]">Digitalk Afrique</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} data-testid={`admin-tab-${t.k}`}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold ${tab === t.k ? "bg-[#0A3D62] text-white" : "bg-white text-slate-600"}`}>
            {t.l}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow" data-testid={`admin-stat-${c.label}`}>
              <div className="w-10 h-10 rounded-lg bg-[#0A3D62]/10 flex items-center justify-center mb-3">
                <c.icon className="text-[#0A3D62]" size={20}/>
              </div>
              <div className="font-display text-3xl font-bold text-[#1A2B4C]">{c.val}</div>
              <div className="text-xs text-slate-500">{c.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="bg-white rounded-2xl p-2 border border-slate-100 gv-shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase font-bold">
              <tr><th className="p-3 text-left">Email</th><th className="p-3 text-left">Nom</th><th className="p-3">Pays</th><th className="p-3">Rôle</th><th className="p-3">Statut</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} data-testid={`admin-user-${u.id}`}>
                  <td className="p-3 text-[#1A2B4C] font-semibold">{u.email}</td>
                  <td className="p-3">{u.nom}</td>
                  <td className="p-3 text-center">{u.pays_origine}</td>
                  <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${u.role === "admin" ? "bg-[#0A3D62] text-white" : "bg-slate-100"}`}>{u.role}</span></td>
                  <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${u.statut === "suspendu" ? "bg-[#E74C3C]/20 text-[#E74C3C]" : "bg-[#2ECC71]/20 text-[#2ECC71]"}`}>{u.statut}</span></td>
                  <td className="p-3 flex gap-1 justify-end">
                    <button onClick={() => suspend(u)} data-testid={`admin-user-suspend-${u.id}`} className="p-1.5 rounded hover:bg-slate-100"><Ban size={16}/></button>
                    <button onClick={() => delUser(u)} data-testid={`admin-user-del-${u.id}`} className="p-1.5 rounded hover:bg-[#E74C3C]/10 text-[#E74C3C]"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "liens" && (
        <div className="space-y-4">
          <form onSubmit={addLien} className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow grid sm:grid-cols-2 gap-3">
            <input required placeholder="Titre" value={newLien.titre} onChange={(e) => setNewLien({ ...newLien, titre: e.target.value })} data-testid="admin-lien-titre" className="px-4 py-2.5 bg-[#F5F7FA] rounded-xl"/>
            <input required placeholder="URL" value={newLien.url} onChange={(e) => setNewLien({ ...newLien, url: e.target.value })} data-testid="admin-lien-url" className="px-4 py-2.5 bg-[#F5F7FA] rounded-xl"/>
            <input required placeholder="Catégorie" value={newLien.categorie} onChange={(e) => setNewLien({ ...newLien, categorie: e.target.value })} data-testid="admin-lien-cat" className="px-4 py-2.5 bg-[#F5F7FA] rounded-xl"/>
            <input placeholder="Pays (CA/FR/DE/INT)" value={newLien.pays} onChange={(e) => setNewLien({ ...newLien, pays: e.target.value })} className="px-4 py-2.5 bg-[#F5F7FA] rounded-xl"/>
            <textarea required placeholder="Description" value={newLien.description} onChange={(e) => setNewLien({ ...newLien, description: e.target.value })} data-testid="admin-lien-desc" className="px-4 py-2.5 bg-[#F5F7FA] rounded-xl sm:col-span-2"/>
            <button type="submit" data-testid="admin-lien-submit" className="sm:col-span-2 bg-[#F9CA24] hover:bg-[#ffd93d] text-[#1A2B4C] font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"><Plus size={16}/> Ajouter le lien</button>
          </form>
          <div className="space-y-2">
            {liens.map((l) => (
              <div key={l.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1A2B4C] truncate">{l.titre}</div>
                  <div className="text-xs text-slate-500 truncate">{l.url}</div>
                </div>
                <button onClick={() => delLien(l.id)} data-testid={`admin-lien-del-${l.id}`} className="text-[#E74C3C]"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "forum" && (
        <div className="space-y-2">
          {topics.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between gap-3">
              <div>
                <div className="font-semibold text-[#1A2B4C]">{t.titre}</div>
                <div className="text-xs text-slate-500">par {t.auteur_nom} • {t.nb_reponses} réponse(s)</div>
              </div>
              <button onClick={() => delTopic(t.id)} data-testid={`admin-topic-del-${t.id}`} className="text-[#E74C3C]"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

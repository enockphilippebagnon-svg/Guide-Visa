import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid } from "recharts";
import { Users, FileText, MessagesSquare, Link2, Ban, Trash2, Plus, TrendingUp, Activity, Search, Eye, X, Shield, Award, Globe2, AlertTriangle } from "lucide-react";

const COLORS = ["#0A3D62", "#F9CA24", "#2ECC71", "#E74C3C", "#8E44AD", "#3498DB", "#E67E22", "#16A085"];

export default function Admin() {
  const [tab, setTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [liens, setLiens] = useState([]);
  const [topics, setTopics] = useState([]);
  const [q, setQ] = useState("");
  const [userDetail, setUserDetail] = useState(null);
  const [newLien, setNewLien] = useState({ categorie: "", titre: "", url: "", description: "", pays: "INT", cout: "Gratuit" });

  const load = async () => {
    try {
      const [s, u, l, t] = await Promise.all([
        api.get("/admin/stats/detaille"),
        api.get("/admin/users"),
        api.get("/admin/liens"),
        api.get("/admin/topics"),
      ]);
      setStats(s.data); setUsers(u.data); setLiens(l.data); setTopics(t.data);
    } catch { toast.error("Erreur chargement admin"); }
  };
  useEffect(() => { load(); }, []);

  const suspend = async (u) => {
    const next = u.statut === "suspendu" ? "actif" : "suspendu";
    try { await api.patch(`/admin/users/${u.id}`, { statut: next }); toast.success(`Utilisateur ${next}`); load(); }
    catch { toast.error("Erreur"); }
  };
  const delUser = async (u) => {
    if (!window.confirm(`Supprimer ${u.email} ?`)) return;
    try { await api.delete(`/admin/users/${u.id}`); toast.success("Supprimé"); load(); }
    catch { toast.error("Erreur"); }
  };
  const voir = async (uid) => {
    try { const { data } = await api.get(`/admin/users/${uid}/detail`); setUserDetail(data); }
    catch { toast.error("Erreur"); }
  };
  const addLien = async (e) => {
    e.preventDefault();
    try { await api.post("/admin/liens", newLien); toast.success("Lien ajouté"); setNewLien({ categorie: "", titre: "", url: "", description: "", pays: "INT", cout: "Gratuit" }); load(); }
    catch { toast.error("Erreur"); }
  };
  const delLien = async (id) => { await api.delete(`/admin/liens/${id}`); toast.success("Supprimé"); load(); };
  const delTopic = async (id) => { if (!window.confirm("Supprimer ce sujet ?")) return; await api.delete(`/forum/topics/${id}`); toast.success("Supprimé"); load(); };

  const usersFiltres = users.filter((u) =>
    !q || u.email.toLowerCase().includes(q.toLowerCase()) || (u.nom || "").toLowerCase().includes(q.toLowerCase())
  );

  const tabs = [
    { k: "dashboard", l: "Dashboard", icon: Activity },
    { k: "users", l: "Utilisateurs", icon: Users },
    { k: "liens", l: "Liens", icon: Link2 },
    { k: "forum", l: "Forum", icon: MessagesSquare },
  ];

  if (!stats) return <div className="text-slate-400">Chargement du dashboard...</div>;

  const kpis = [
    { label: "Utilisateurs", val: stats.totaux.utilisateurs, delta: `${stats.totaux.actifs_7j} actifs (7j)`, icon: Users, color: "#0A3D62" },
    { label: "Simulations", val: stats.totaux.simulations, delta: `Score moyen ${stats.totaux.score_moyen}/100`, icon: TrendingUp, color: "#2ECC71" },
    { label: "Documents", val: stats.totaux.documents, delta: `${(stats.docs_par_categorie || []).length} catégories`, icon: FileText, color: "#F9CA24" },
    { label: "Forum", val: stats.totaux.topics, delta: `${stats.totaux.reponses} réponses`, icon: MessagesSquare, color: "#8E44AD" },
    { label: "Suspendus", val: stats.totaux.suspendus, delta: "Attention modération", icon: AlertTriangle, color: "#E74C3C" },
    { label: "Liens officiels", val: stats.totaux.liens, delta: "Vérifiés", icon: Link2, color: "#3498DB" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F9CA24]/20 text-[#8a6d00] rounded-full text-xs font-bold uppercase tracking-widest mb-2">
          <Shield size={14}/> Espace Digitalk Afrique
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-[#1A2B4C]">Dashboard administrateur</h1>
        <p className="text-sm text-slate-600 mt-1">Vue complète sur l'activité de la plateforme.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} data-testid={`admin-tab-${t.k}`}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${tab === t.k ? "bg-[#0A3D62] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
            <t.icon size={14}/> {t.l}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {kpis.map((c) => (
              <div key={c.label} className="bg-white rounded-2xl p-4 border border-slate-100 gv-shadow" data-testid={`admin-kpi-${c.label}`}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${c.color}18` }}>
                  <c.icon size={18} style={{ color: c.color }}/>
                </div>
                <div className="font-display text-2xl font-bold text-[#1A2B4C]">{c.val}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.label}</div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">{c.delta}</div>
              </div>
            ))}
          </div>

          {/* Croissance 7j */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="text-[#0A3D62]" size={18}/>
              <div className="font-display font-bold text-[#1A2B4C]">Croissance des 7 derniers jours</div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.croissance_7j}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11}/>
                <YAxis stroke="#64748B" fontSize={11}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
                <Line type="monotone" dataKey="utilisateurs" stroke="#0A3D62" strokeWidth={2.5} dot={{ r: 4 }}/>
                <Line type="monotone" dataKey="simulations" stroke="#F9CA24" strokeWidth={2.5} dot={{ r: 4 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            {/* Users par pays */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Globe2 className="text-[#0A3D62]" size={18}/>
                <div className="font-display font-bold text-[#1A2B4C]">Utilisateurs par pays d'origine</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.users_par_pays.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                  <XAxis dataKey="pays" stroke="#64748B" fontSize={11}/>
                  <YAxis stroke="#64748B" fontSize={11}/>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}/>
                  <Bar dataKey="nombre" fill="#0A3D62" radius={[8, 8, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Simulations par pays destination */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="text-[#0A3D62]" size={18}/>
                <div className="font-display font-bold text-[#1A2B4C]">Simulations par destination</div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={stats.sims_par_pays} dataKey="nombre" nameKey="pays" cx="50%" cy="50%" outerRadius={80} label>
                    {stats.sims_par_pays.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }}/>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Sims par motif */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="text-[#0A3D62]" size={18}/>
                <div className="font-display font-bold text-[#1A2B4C]">Motifs les plus demandés</div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.sims_par_motif} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
                  <XAxis type="number" stroke="#64748B" fontSize={11}/>
                  <YAxis dataKey="motif" type="category" stroke="#64748B" fontSize={11} width={80}/>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E2E8F0" }}/>
                  <Bar dataKey="nombre" fill="#F9CA24" radius={[0, 8, 8, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top users */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Award className="text-[#F9CA24]" size={18}/>
                <div className="font-display font-bold text-[#1A2B4C]">Utilisateurs les plus actifs</div>
              </div>
              {stats.top_users.length === 0 ? (
                <div className="text-sm text-slate-400 italic text-center py-8">Aucune activité forum pour l'instant</div>
              ) : (
                <ul className="space-y-2">
                  {stats.top_users.map((u, i) => (
                    <li key={u.id} className="flex items-center gap-3 p-2 bg-[#F5F7FA] rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-[#F9CA24] text-[#1A2B4C] flex items-center justify-center font-bold text-xs">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#1A2B4C] truncate">{u.nom}</div>
                        <div className="text-xs text-slate-500 truncate">{u.email} · {u.pays_origine}</div>
                      </div>
                      <div className="text-sm font-bold text-[#0A3D62]">{u.points} pts</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Activité récente */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 gv-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="text-[#0A3D62]" size={18}/>
              <div className="font-display font-bold text-[#1A2B4C]">Activité récente</div>
            </div>
            {stats.activite_recente.length === 0 ? (
              <div className="text-sm text-slate-400 italic text-center py-6">Aucune activité récente</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.activite_recente.map((e, i) => {
                  const color = e.type === "inscription" ? "#2ECC71" : e.type === "simulation" ? "#0A3D62" : "#F9CA24";
                  const dt = e.date ? new Date(e.date).toLocaleString("fr-FR") : "";
                  return (
                    <li key={i} className="flex items-center gap-3 py-2.5" data-testid={`admin-activity-${i}`}>
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }}/>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-[#1A2B4C] truncate">{e.libelle}</div>
                        <div className="text-[11px] text-slate-400">{dt}{e.pays ? ` · ${e.pays}` : ""}</div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>{e.type}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un utilisateur..."
              data-testid="admin-users-search"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"/>
          </div>
          <div className="bg-white rounded-2xl p-2 border border-slate-100 gv-shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-3 text-left">Email</th><th className="p-3 text-left">Nom</th>
                  <th className="p-3">Pays</th><th className="p-3">Devise</th>
                  <th className="p-3">Rôle</th><th className="p-3">Statut</th><th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersFiltres.map((u) => (
                  <tr key={u.id} data-testid={`admin-user-${u.id}`} className="hover:bg-slate-50/50">
                    <td className="p-3 text-[#1A2B4C] font-semibold">{u.email}</td>
                    <td className="p-3">{u.nom} {u.prenom || ""}</td>
                    <td className="p-3 text-center">{u.pays_origine}</td>
                    <td className="p-3 text-center text-xs text-slate-500">{u.devise_preferee}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-[#0A3D62] text-white" : "bg-slate-100"}`}>{u.role}</span></td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.statut === "suspendu" ? "bg-[#E74C3C]/20 text-[#E74C3C]" : "bg-[#2ECC71]/20 text-[#2ECC71]"}`}>{u.statut}</span></td>
                    <td className="p-3 flex gap-1 justify-end">
                      <button onClick={() => voir(u.id)} data-testid={`admin-user-view-${u.id}`} title="Voir détail" className="p-1.5 rounded hover:bg-slate-100"><Eye size={16}/></button>
                      <button onClick={() => suspend(u)} data-testid={`admin-user-suspend-${u.id}`} title="Suspendre" className="p-1.5 rounded hover:bg-slate-100"><Ban size={16}/></button>
                      <button onClick={() => delUser(u)} data-testid={`admin-user-del-${u.id}`} title="Supprimer" className="p-1.5 rounded hover:bg-[#E74C3C]/10 text-[#E74C3C]"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                  <div className="text-xs text-slate-400 mt-1">{l.categorie} · {l.pays} · {l.clics} clics</div>
                </div>
                <button onClick={() => delLien(l.id)} data-testid={`admin-lien-del-${l.id}`} className="text-[#E74C3C]"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "forum" && (
        <div className="space-y-2">
          {topics.length === 0 && <div className="text-sm text-slate-400 italic text-center py-10">Aucun sujet pour l'instant.</div>}
          {topics.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex justify-between gap-3">
              <div>
                <div className="font-semibold text-[#1A2B4C]">{t.titre}</div>
                <div className="text-xs text-slate-500">par {t.auteur_nom} · {t.nb_reponses} réponse(s) · {t.vues} vues</div>
              </div>
              <button onClick={() => delTopic(t.id)} data-testid={`admin-topic-del-${t.id}`} className="text-[#E74C3C]"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      )}

      {/* User detail modal */}
      {userDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setUserDetail(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="admin-user-detail">
            <div className="sticky top-0 bg-white p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#F9CA24] text-[#1A2B4C] flex items-center justify-center font-bold text-lg">
                  {userDetail.user.nom?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-display font-bold text-[#1A2B4C]">{userDetail.user.nom} {userDetail.user.prenom}</div>
                  <div className="text-xs text-slate-500">{userDetail.user.email}</div>
                </div>
              </div>
              <button onClick={() => setUserDetail(null)} className="p-1"><X size={20}/></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#F5F7FA] rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Pays</div><div className="font-bold text-[#1A2B4C]">{userDetail.user.pays_origine}</div></div>
                <div className="bg-[#F5F7FA] rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Devise</div><div className="font-bold text-[#1A2B4C]">{userDetail.user.devise_preferee}</div></div>
                <div className="bg-[#F5F7FA] rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Rôle</div><div className="font-bold text-[#1A2B4C]">{userDetail.user.role}</div></div>
                <div className="bg-[#F5F7FA] rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Statut</div><div className="font-bold text-[#1A2B4C]">{userDetail.user.statut}</div></div>
                <div className="bg-[#F5F7FA] rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Documents</div><div className="font-bold text-[#1A2B4C]">{userDetail.nb_documents}</div></div>
                <div className="bg-[#F5F7FA] rounded-xl p-3"><div className="text-[10px] uppercase font-bold text-slate-500">Réponses forum</div><div className="font-bold text-[#1A2B4C]">{userDetail.nb_reponses}</div></div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#0A3D62] mb-2">Simulations ({userDetail.simulations.length})</div>
                {userDetail.simulations.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">Aucune simulation</div>
                ) : (
                  <ul className="space-y-1.5">
                    {userDetail.simulations.map((s) => (
                      <li key={s.id} className="flex justify-between items-center text-sm p-2 bg-[#F5F7FA] rounded-xl">
                        <div className="text-[#1A2B4C]">{s.pays_destination} · {s.motif}</div>
                        <div className="text-xs font-bold text-[#2ECC71]">Score {s.score_eligibilite}/100</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-[#0A3D62] mb-2">Sujets forum ({userDetail.topics.length})</div>
                {userDetail.topics.length === 0 ? (
                  <div className="text-sm text-slate-400 italic">Aucun sujet</div>
                ) : (
                  <ul className="space-y-1.5">
                    {userDetail.topics.map((t) => (
                      <li key={t.id} className="text-sm p-2 bg-[#F5F7FA] rounded-xl">
                        <div className="font-semibold text-[#1A2B4C] truncate">{t.titre}</div>
                        <div className="text-xs text-slate-500">{t.nb_reponses} réponse(s) · {t.vues} vues</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { User, Mail, Lock, Phone, Globe2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [pays, setPays] = useState([]);
  const [devises, setDevises] = useState({});
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "", telephone: "", pays_origine: "CI" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/pays").then(({ data }) => { setPays(data.pays); setDevises(data.devises); });
  }, []);

  const devise = devises[form.pays_origine] || "EUR";

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Mot de passe : 8 caractères minimum"); return; }
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (res.ok) { toast.success(`Bienvenue ${form.nom} ! Devise détectée : ${devise}`); nav("/app"); }
    else toast.error(res.error);
  };

  const inp = (name, type, icon, placeholder, req = true) => (
    <div>
      <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">{placeholder}{req && " *"}</label>
      <div className="relative mt-1.5">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
        <input type={type} required={req} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          data-testid={`register-${name}-input`}
          className={`w-full ${icon ? "pl-11" : "pl-4"} pr-4 py-3 bg-[#F5F7FA] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]`}/>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-[#F5F7FA]">
      <div className="w-full max-w-lg">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center" data-testid="register-logo">
          <div className="w-11 h-11 rounded-xl bg-[#0A3D62] flex items-center justify-center text-[#F9CA24] font-bold font-display text-lg">GV</div>
          <div>
            <div className="font-display font-bold text-[#1A2B4C] text-xl leading-tight">Guide Visa</div>
            <div className="text-[10px] text-slate-500">by Digitalk Afrique</div>
          </div>
        </Link>

        <div className="bg-white rounded-3xl p-8 gv-shadow border border-slate-100">
          <h1 className="font-display text-3xl font-bold text-[#1A2B4C]">Crée ton compte</h1>
          <p className="mt-2 text-slate-600 text-sm">Ton pays d'origine nous permet d'afficher les coûts dans ta devise.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {inp("nom", "text", <User size={18}/>, "Nom")}
              {inp("prenom", "text", <User size={18}/>, "Prénom", false)}
            </div>
            {inp("email", "email", <Mail size={18}/>, "Email")}

            <div>
              <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">Pays d'origine *</label>
              <div className="relative mt-1.5">
                <Globe2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <select required value={form.pays_origine} onChange={(e) => setForm({ ...form, pays_origine: e.target.value })}
                  data-testid="register-pays-select"
                  className="w-full pl-11 pr-4 py-3 bg-[#F5F7FA] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62] appearance-none">
                  {pays.map((p) => <option key={p.code} value={p.code}>{p.drapeau} {p.nom}</option>)}
                </select>
              </div>
              <div className="mt-1.5 text-xs text-[#2ECC71] font-semibold"> Devise détectée : {devise}</div>
            </div>

            {inp("telephone", "tel", <Phone size={18}/>, "Téléphone", false)}
            {inp("password", "password", <Lock size={18}/>, "Mot de passe (8+)")}

            <button type="submit" disabled={loading} data-testid="register-submit-btn"
              className="w-full bg-[#0A3D62] hover:bg-[#0d4a78] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60">
              {loading ? "Création…" : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-600">
            Déjà un compte ?{" "}
            <Link to="/login" className="font-semibold text-[#0A3D62]" data-testid="register-goto-login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

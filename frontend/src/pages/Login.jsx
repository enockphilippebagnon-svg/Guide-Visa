import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.ok) { toast.success("Bienvenue !"); nav("/app"); }
    else toast.error(res.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10 bg-[#F5F7FA]">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center" data-testid="login-logo">
          <div className="w-11 h-11 rounded-xl bg-[#0A3D62] flex items-center justify-center text-[#F9CA24] font-bold font-display text-lg">GV</div>
          <div>
            <div className="font-display font-bold text-[#1A2B4C] text-xl leading-tight">Guide Visa</div>
            <div className="text-[10px] text-slate-500">by Digitalk Afrique</div>
          </div>
        </Link>

        <div className="bg-white rounded-3xl p-8 gv-shadow border border-slate-100">
          <h1 className="font-display text-3xl font-bold text-[#1A2B4C]">Content de te revoir 👋</h1>
          <p className="mt-2 text-slate-600 text-sm">Reprends là où tu en étais.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">Email</label>
              <div className="relative mt-1.5">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email-input"
                  className="w-full pl-11 pr-4 py-3 bg-[#F5F7FA] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"
                  placeholder="ton@email.com"/>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#1A2B4C] uppercase tracking-wider">Mot de passe</label>
              <div className="relative mt-1.5">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password-input"
                  className="w-full pl-11 pr-11 py-3 bg-[#F5F7FA] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A3D62]"
                  placeholder="••••••••"/>
                <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                  {show ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} data-testid="login-submit-btn"
              className="w-full bg-[#0A3D62] hover:bg-[#0d4a78] text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60">
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-slate-600">
            Pas encore de compte ?{" "}
            <Link to="/register" className="font-semibold text-[#0A3D62]" data-testid="login-goto-register">Créer un compte</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

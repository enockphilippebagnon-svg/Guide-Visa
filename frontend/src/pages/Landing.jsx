import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Compass, Wifi, ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Nav */}
      <header className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5" data-testid="landing-logo">
          <div className="w-10 h-10 rounded-xl bg-[#0A3D62] flex items-center justify-center text-[#F9CA24] font-bold font-display">GV</div>
          <div>
            <div className="font-display font-bold text-[#1A2B4C] leading-tight text-lg">Guide Visa</div>
            <div className="text-[10px] text-slate-500 leading-tight">by Digitalk Afrique</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" data-testid="landing-login-btn" className="text-sm font-semibold text-[#1A2B4C] px-4 py-2 rounded-full hover:bg-white">Se connecter</Link>
          <Link to="/register" data-testid="landing-register-btn" className="text-sm font-semibold text-white bg-[#0A3D62] hover:bg-[#0d4a78] px-4 py-2 rounded-full">Commencer</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-6 pb-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="gv-fadeup">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F9CA24]/20 text-[#8a6d00] rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles size={14}/> Édité par Digitalk Afrique • 
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1A2B4C] leading-[1.05] tracking-tight">
            Ton chemin vers l'étranger, <span className="text-[#0A3D62] relative">sans arnaque<svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10"><path d="M2 6 Q 100 -3 198 6" stroke="#F9CA24" strokeWidth="3" fill="none" strokeLinecap="round"/></svg></span>.
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-lg leading-relaxed">
            Simule gratuitement ta procédure d'immigration vers le Canada, la France ou l'Allemagne, étape par étape, avec les <b>vrais coûts</b> en FCFA.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to="/register" data-testid="landing-cta-primary" className="inline-flex items-center justify-center gap-2 bg-[#0A3D62] hover:bg-[#0d4a78] text-white font-semibold px-6 py-3.5 rounded-full transition-colors">
              Simuler ma procédure <ArrowRight size={18}/>
            </Link>
            <Link to="/login" data-testid="landing-cta-secondary" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-[#1A2B4C] font-semibold px-6 py-3.5 rounded-full border border-slate-200 transition-colors">
              J'ai déjà un compte
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
            <div><b className="text-[#1A2B4C]">3</b> pays</div>
            <div><b className="text-[#1A2B4C]">40+</b> devises</div>
            <div><b className="text-[#1A2B4C]">100%</b> gratuit</div>
          </div>
        </div>

        <div className="relative gv-fadeup">
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-[#F9CA24]/40 rounded-full blur-3xl"/>
          <div className="absolute -bottom-8 -right-4 w-40 h-40 bg-[#0A3D62]/20 rounded-full blur-3xl"/>
          <div className="relative rounded-3xl overflow-hidden aspect-[4/5] gv-shadow">
            <img alt="Étudiante africaine avec passeport" src="https://images.pexels.com/photos/5622660/pexels-photo-5622660.jpeg?auto=compress&cs=tinysrgb&w=800" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D62]/60 via-transparent to-transparent"/>
            <div className="absolute bottom-4 left-4 right-4 backdrop-blur-md bg-white/95 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2ECC71]/20 flex items-center justify-center">
                <ShieldCheck className="text-[#2ECC71]" size={20}/>
              </div>
              <div>
                <div className="text-sm font-bold text-[#1A2B4C]">Score éligibilité : 82/100</div>
                <div className="text-xs text-slate-500">Permis d'études Canada</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1A2B4C] max-w-2xl">Un outil sérieux pour un projet sérieux.</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {[
            { icon: Compass, title: "Simulateur pas-à-pas", desc: "Pour chaque étape : coûts officiels, délais et liens vérifiés."},
            { icon: ShieldCheck, title: "Alertes anti-arnaque", desc: "Compare les frais officiels aux montants qu'on te demande."},
            { icon: Wifi, title: "Marche hors ligne", desc: "Consulte ta simulation sans connexion, parfait pour la 3G."},
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 gv-shadow border border-slate-100" data-testid={`landing-feature-${i}`}>
              <div className="w-12 h-12 rounded-xl bg-[#0A3D62]/10 flex items-center justify-center mb-4">
                <f.icon className="text-[#0A3D62]" size={24}/>
              </div>
              <div className="font-display font-bold text-xl text-[#1A2B4C]">{f.title}</div>
              <div className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 py-10 text-sm text-slate-500 grid sm:grid-cols-2 gap-4">
          <div>
            <div className="font-display font-bold text-[#1A2B4C] text-lg">Guide Visa</div>
            <div className="mt-1">Un produit <b>Digitalk Afrique</b>, Côte d'Ivoire</div>
          </div>
          <div className="sm:text-right">
             digitalkafrique@gmail.com<br/> +225 01 42 07 32 07<br/>© 2025 Digitalk Afrique
          </div>
        </div>
      </footer>
    </div>
  );
}

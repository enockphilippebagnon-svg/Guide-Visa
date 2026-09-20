import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Attach access_token from localStorage as fallback (browsers may block cross-site cookies)
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("gv_access_token");
  if (t && !cfg.headers.Authorization) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

export function formatApiError(err) {
  const d = err?.response?.data?.detail;
  if (!d) return err?.message || "Une erreur est survenue";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join(" ");
  return String(d);
}

export const DEVISE_SYMBOLES = {
  XOF: "FCFA", XAF: "FCFA", EUR: "€", USD: "$", CAD: "C$",
  GBP: "£", CHF: "CHF", MAD: "DH", DZD: "DA", TND: "DT",
  GHS: "₵", NGN: "₦", KES: "KSh", ZAR: "R", GNF: "FG",
};

export function formatMontant(montant, devise) {
  if (montant == null) return ", ";
  const sym = DEVISE_SYMBOLES[devise] || devise;
  const isFCFA = devise === "XOF" || devise === "XAF";
  const val = isFCFA ? Math.round(montant).toLocaleString("fr-FR") : montant.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  return `${val} ${sym}`;
}

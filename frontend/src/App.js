import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";
import { AuthProvider, useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Simulator from "./pages/Simulator";
import SimulationDetail from "./pages/SimulationDetail";
import Documents from "./pages/Documents";
import Links from "./pages/Links";
import Forum from "./pages/Forum";
import ForumTopic from "./pages/ForumTopic";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/app" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/app" element={<Protected><Layout><Home /></Layout></Protected>} />
          <Route path="/app/simuler/:pays/:motif" element={<Protected><Layout><Simulator /></Layout></Protected>} />
          <Route path="/app/simulation/:id" element={<Protected><Layout><SimulationDetail /></Layout></Protected>} />
          <Route path="/app/documents" element={<Protected><Layout><Documents /></Layout></Protected>} />
          <Route path="/app/liens" element={<Protected><Layout><Links /></Layout></Protected>} />
          <Route path="/app/forum" element={<Protected><Layout><Forum /></Layout></Protected>} />
          <Route path="/app/forum/:id" element={<Protected><Layout><ForumTopic /></Layout></Protected>} />
          <Route path="/app/profil" element={<Protected><Layout><Profile /></Layout></Protected>} />
          <Route path="/admin" element={<Protected admin><Layout><Admin /></Layout></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

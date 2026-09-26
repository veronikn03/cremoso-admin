"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr("Correo o clave incorrectos.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="wrap" style={{ maxWidth: 420, paddingTop: 60 }}>
      <div className="brand" style={{ marginBottom: 24 }}>
        <h1>Cremoso Gourmet</h1>
        <span>Panel</span>
      </div>
      <div className="panel">
        <h3>Iniciar sesión</h3>
        <form className="fg" onSubmit={onSubmit}>
          <label className="f full">
            Correo
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="f full">
            Clave
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <div className="err full">{err}</div>
          <div className="full">
            <button className="btn pri" type="submit" disabled={loading}>
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

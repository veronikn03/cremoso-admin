"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function HeaderActions() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="header-actions">
      <a className="btn sm ghost" href="/" target="_blank" rel="noopener">
        Ver como cliente
      </a>
      <button className="btn sm" onClick={signOut} type="button">
        Salir
      </button>
    </div>
  );
}

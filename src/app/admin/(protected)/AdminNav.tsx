"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TABS: [string, string][] = [
  ["/admin", "Resumen"],
  ["/admin/pedidos", "Pedidos"],
  ["/admin/cobrar", "Por cobrar"],
  ["/admin/inventario", "Inventario"],
  ["/admin/clientes", "Clientes"],
  ["/admin/ajustes", "Ajustes"],
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <nav className="tabs" role="tablist">
      {TABS.map(([href, label]) => (
        <Link key={href} href={href} role="tab" aria-selected={pathname === href}>
          {label}
        </Link>
      ))}
      <button className="viewtog" onClick={signOut} type="button">
        Salir
      </button>
    </nav>
  );
}

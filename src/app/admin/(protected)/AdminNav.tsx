"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <nav className="tabs" role="tablist">
      {TABS.map(([href, label]) => (
        <Link key={href} href={href} role="tab" aria-selected={pathname === href}>
          {label}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Catalogo, { type ProductoPublico } from "@/components/Catalogo";
import MiCuenta from "./MiCuenta";

export default function CuentaClient({
  productos,
  negocio,
  whatsapp,
  tasa,
}: {
  productos: ProductoPublico[];
  negocio: string;
  whatsapp: string;
  tasa: number;
}) {
  const [tab, setTab] = useState<"pedir" | "cuenta">("pedir");

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <h1>{negocio}</h1>
          <span>Pedidos</span>
        </div>
        <Link className="btn sm" href="/">
          ← Ver catálogo
        </Link>
      </header>
      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "pedir"} onClick={() => setTab("pedir")}>
          Hacer pedido
        </button>
        <button role="tab" aria-selected={tab === "cuenta"} onClick={() => setTab("cuenta")}>
          Mi cuenta
        </button>
      </nav>
      {tab === "pedir" ? (
        <Catalogo productos={productos} negocio={negocio} whatsapp={whatsapp} tasa={tasa} />
      ) : (
        <MiCuenta negocio={negocio} whatsapp={whatsapp} tasa={tasa} />
      )}
    </div>
  );
}

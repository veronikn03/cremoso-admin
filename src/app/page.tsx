import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/supabase/retry";
import Catalogo from "@/components/Catalogo";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: productos }, { data: config }] = await Promise.all([
    withRetry(() =>
      supabase
        .from("productos")
        .select("id, nombre, categoria, descripcion, precio_usd, stock, stock_min")
        .order("categoria")
        .order("nombre"),
    ),
    withRetry(() => supabase.from("config").select("negocio, whatsapp, tasa").eq("id", 1).single()),
  ]);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <h1>{config?.negocio || "Cremoso Gourmet"}</h1>
          <span>Postres artesanales</span>
        </div>
        <Link className="btn sm" href="/cuenta">
          Mi cuenta
        </Link>
      </header>
      <div className="hero-c">
        <h2>Dulces disponibles hoy</h2>
        <p>Esto es lo que hay disponible ahora mismo. Elige lo que quieres y envía tu pedido por WhatsApp; te confirmamos la entrega.</p>
      </div>
      <Catalogo
        productos={productos ?? []}
        negocio={config?.negocio ?? "Cremoso Gourmet"}
        whatsapp={config?.whatsapp ?? ""}
        tasa={config?.tasa ?? 0}
      />
    </div>
  );
}

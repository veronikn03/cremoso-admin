import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/supabase/retry";
import Catalogo from "@/components/Catalogo";
import HeroLogo from "@/components/HeroLogo";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: productos }, { data: config }] = await Promise.all([
    withRetry(() =>
      supabase
        .from("productos")
        .select("id, nombre, categoria, descripcion, precio_usd, stock, stock_min, imagen_url")
        .order("categoria")
        .order("nombre"),
    ),
    withRetry(() => supabase.from("config").select("negocio, whatsapp, tasa").eq("id", 1).single()),
  ]);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.jpg" alt="" className="brand-mark" />
          <span style={{ display: "block" }}>
            <h1>{config?.negocio || "Cremoso Gourmet"}</h1>
            <span>Postres artesanales</span>
          </span>
        </div>
        <Link className="btn sm" href="/cuenta">
          Mi cuenta
        </Link>
      </header>
      <section className="hero">
        <div className="hero-inner">
          <HeroLogo src="/images/logo.jpg" alt={config?.negocio || "Cremoso Gourmet"} />
          <p className="eyebrow">Postres artesanales · Caracas</p>
          <h2>
            El postre más <em>sabroso</em> y cremoso
          </h2>
          <p className="lead">
            Esto es lo que hay disponible ahora mismo. Elige lo que quieres y envía tu pedido por WhatsApp; te
            confirmamos la entrega.
          </p>
        </div>
      </section>
      <Catalogo
        productos={productos ?? []}
        negocio={config?.negocio ?? "Cremoso Gourmet"}
        whatsapp={config?.whatsapp ?? ""}
        tasa={config?.tasa ?? 0}
      />
    </div>
  );
}

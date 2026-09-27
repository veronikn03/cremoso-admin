import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/supabase/retry";
import CuentaClient from "./CuentaClient";

export default async function CuentaPage() {
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
    <CuentaClient
      productos={productos ?? []}
      negocio={config?.negocio ?? "Cremoso Gourmet"}
      whatsapp={config?.whatsapp ?? ""}
      tasa={config?.tasa ?? 0}
    />
  );
}

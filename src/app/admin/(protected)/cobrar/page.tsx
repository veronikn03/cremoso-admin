import { createClient } from "@/lib/supabase/server";
import { fetchPedidos } from "../pedidos/page";
import CobrarClient from "./CobrarClient";

export type ClienteDeuda = {
  id: string;
  nombre: string;
  telefono: string | null;
  saldo_usd: number;
  pedidos_abiertos: number;
  pedido_mas_antiguo: string | null;
};

export default async function CobrarPage() {
  const supabase = await createClient();

  const [{ data: clientesDeuda }, { data: pedidosSaldo }, { data: config }, pedidos] = await Promise.all([
    supabase
      .from("clientes_derivados")
      .select("id, nombre, telefono, saldo_usd, pedidos_abiertos, pedido_mas_antiguo")
      .gt("saldo_usd", 0.009)
      .order("saldo_usd", { ascending: false }),
    supabase.from("pedidos_derivados").select("fecha, saldo_usd").gt("saldo_usd", 0.009),
    supabase.from("config").select("tasa, negocio, whatsapp").eq("id", 1).single(),
    fetchPedidos(supabase),
  ]);

  return (
    <CobrarClient
      clientesDeuda={(clientesDeuda ?? []) as ClienteDeuda[]}
      pedidosSaldo={pedidosSaldo ?? []}
      pedidos={pedidos}
      tasa={config?.tasa ?? 0}
      negocio={config?.negocio ?? "Cremoso Gourmet"}
    />
  );
}

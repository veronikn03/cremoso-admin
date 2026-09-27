import { createClient } from "@/lib/supabase/server";
import ClientesClient from "./ClientesClient";

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
  codigo_hash: string | null;
  saldo_usd: number;
  num_pedidos: number;
  total_comprado: number;
};

export default async function ClientesPage() {
  const supabase = await createClient();
  const [{ data: clientes }, { data: config }] = await Promise.all([
    supabase
      .from("clientes_derivados")
      .select("id, nombre, telefono, notas, codigo_hash, saldo_usd, num_pedidos, total_comprado")
      .order("nombre"),
    supabase.from("config").select("negocio").eq("id", 1).single(),
  ]);

  return (
    <div>
      <div className="bar">
        <h2>Clientes</h2>
      </div>
      <ClientesClient clientes={(clientes ?? []) as Cliente[]} negocio={config?.negocio ?? "Cremoso Gourmet"} />
    </div>
  );
}

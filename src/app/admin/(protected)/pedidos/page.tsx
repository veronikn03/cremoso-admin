import { createClient } from "@/lib/supabase/server";
import PedidosClient from "./PedidosClient";

export type PedidoItem = { nombre: string; cant: number; precio_usd: number };

export type Pedido = {
  id: string;
  numero: number;
  cliente_id: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  fecha: string;
  total_usd: number;
  entregado: boolean;
  estado: "activo" | "cancelado";
  notas: string | null;
  items: PedidoItem[];
  pagos: { id: string; monto_usd: number; moneda: string; monto_original: number; tasa_bs: number; metodo: string; referencia: string | null; fecha: string }[];
  pagado_usd: number;
  saldo_usd: number;
};

type PedidoRow = {
  id: string;
  numero: number;
  cliente_id: string;
  fecha: string;
  total_usd: number;
  entregado: boolean;
  estado: "activo" | "cancelado";
  notas: string | null;
  clientes: { nombre: string; telefono: string | null } | null;
  pedido_items: PedidoItem[];
  pagos: { id: string; monto_usd: number; moneda: string; monto_original: number; tasa_bs: number; metodo: string; referencia: string | null; fecha: string }[];
};

export async function fetchPedidos(supabase: Awaited<ReturnType<typeof createClient>>): Promise<Pedido[]> {
  const { data } = await supabase
    .from("pedidos")
    .select(
      "id, numero, cliente_id, fecha, total_usd, entregado, estado, notas, clientes(nombre, telefono), pedido_items(nombre, cant, precio_usd), pagos(id, monto_usd, moneda, monto_original, tasa_bs, metodo, referencia, fecha)",
    )
    .order("fecha", { ascending: false })
    .order("numero", { ascending: false });

  return ((data ?? []) as unknown as PedidoRow[]).map((o) => {
    const pagado = Math.round(o.pagos.reduce((a, p) => a + p.monto_usd, 0) * 100) / 100;
    const saldo = o.estado === "cancelado" ? 0 : Math.max(0, Math.round((o.total_usd - pagado) * 100) / 100);
    return {
      id: o.id,
      numero: o.numero,
      cliente_id: o.cliente_id,
      cliente_nombre: o.clientes?.nombre ?? "Cliente",
      cliente_telefono: o.clientes?.telefono ?? null,
      fecha: o.fecha,
      total_usd: o.total_usd,
      entregado: o.entregado,
      estado: o.estado,
      notas: o.notas,
      items: o.pedido_items,
      pagos: o.pagos,
      pagado_usd: pagado,
      saldo_usd: saldo,
    };
  });
}

export default async function PedidosPage({ searchParams }: PageProps<"/admin/pedidos">) {
  const supabase = await createClient();
  const params = await searchParams;
  const filtroParam = Array.isArray(params.filtro) ? params.filtro[0] : params.filtro;
  const filtrosValidos = ["abiertos", "entregar", "saldo", "todos", "cancelados"] as const;
  const filtroInicial = filtrosValidos.find((f) => f === filtroParam);

  const [pedidos, { data: clientes }, { data: productos }, { data: config }] = await Promise.all([
    fetchPedidos(supabase),
    supabase.from("clientes_derivados").select("id, nombre, saldo_usd").order("nombre"),
    supabase.from("productos").select("id, nombre, precio_usd, stock, activo").order("nombre"),
    supabase.from("config").select("tasa").eq("id", 1).single(),
  ]);

  return (
    <PedidosClient
      pedidosIniciales={pedidos}
      clientes={clientes ?? []}
      productos={productos ?? []}
      tasa={config?.tasa ?? 0}
      filtroInicial={filtroInicial}
    />
  );
}

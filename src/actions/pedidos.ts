"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/cobrar");
  revalidatePath("/admin/inventario");
  revalidatePath("/admin/clientes");
}

export type PedidoLineInput = { producto_id: string; cant: number };

export async function crearPedido(input: {
  cliente_id: string | null;
  cliente_nuevo?: { nombre: string; telefono: string } | null;
  fecha: string;
  items: PedidoLineInput[];
  notas: string;
  entregado: boolean;
  abono?: { monto_original: number; moneda: "USD" | "Bs"; metodo: string; referencia: string } | null;
}) {
  const supabase = await createClient();

  let clienteId = input.cliente_id;
  if (!clienteId && input.cliente_nuevo) {
    const { data, error } = await supabase
      .from("clientes")
      .insert({ nombre: input.cliente_nuevo.nombre, telefono: input.cliente_nuevo.telefono })
      .select("id")
      .single();
    if (error) return { error: error.message, pedidoId: null };
    clienteId = data.id;
  }
  if (!clienteId) return { error: "Elige el cliente", pedidoId: null };

  const { data: pedidoId, error } = await supabase.rpc("crear_pedido", {
    p_cliente_id: clienteId,
    p_fecha: input.fecha,
    p_items: input.items,
    p_notas: input.notas || null,
    p_entregado: input.entregado,
  });
  if (error) return { error: error.message, pedidoId: null };

  if (input.abono && input.abono.monto_original > 0) {
    const { error: payErr } = await supabase.rpc("registrar_pago", {
      p_pedido_id: pedidoId,
      p_monto_original: input.abono.monto_original,
      p_moneda: input.abono.moneda,
      p_metodo: input.abono.metodo,
      p_referencia: input.abono.referencia || null,
      p_fecha: input.fecha,
    });
    if (payErr) return { error: payErr.message, pedidoId };
  }

  revalidateAll();
  return { error: null, pedidoId: pedidoId as string };
}

export async function cancelarPedido(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_pedido", { p_pedido_id: pedidoId });
  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function marcarEntregado(pedidoId: string, entregado: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({
      entregado,
      fecha_entrega: entregado ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", pedidoId);
  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

export async function registrarPago(input: {
  pedido_id?: string | null;
  cliente_id?: string | null;
  monto_original: number;
  moneda: "USD" | "Bs";
  metodo: string;
  referencia: string;
  fecha: string;
}) {
  const supabase = await createClient();
  if (input.pedido_id) {
    const { error } = await supabase.rpc("registrar_pago", {
      p_pedido_id: input.pedido_id,
      p_monto_original: input.monto_original,
      p_moneda: input.moneda,
      p_metodo: input.metodo,
      p_referencia: input.referencia || null,
      p_fecha: input.fecha,
    });
    if (error) return { error: error.message };
  } else if (input.cliente_id) {
    const { error } = await supabase.rpc("registrar_pago_cuenta", {
      p_cliente_id: input.cliente_id,
      p_monto_original: input.monto_original,
      p_moneda: input.moneda,
      p_metodo: input.metodo,
      p_referencia: input.referencia || null,
      p_fecha: input.fecha,
    });
    if (error) return { error: error.message };
  } else {
    return { error: "Falta el pedido o el cliente" };
  }
  revalidateAll();
  return { error: null };
}

export async function eliminarPago(pagoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pagos").delete().eq("id", pagoId);
  if (error) return { error: error.message };
  revalidateAll();
  return { error: null };
}

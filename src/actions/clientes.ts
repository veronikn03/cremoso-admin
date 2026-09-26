"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ClienteInput = {
  nombre: string;
  telefono: string;
  notas: string;
};

export async function guardarCliente(id: string | null, data: ClienteInput) {
  const supabase = await createClient();
  const payload = { ...data, actualizado: new Date().toISOString() };

  const { error } = id
    ? await supabase.from("clientes").update(payload).eq("id", id)
    : await supabase.from("clientes").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/clientes");
  return { error: null };
}

export async function generarCodigoCliente(clienteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerar_codigo", {
    p_cliente_id: clienteId,
  });
  if (error) return { error: error.message, codigo: null };
  revalidatePath("/admin/clientes");
  return { error: null, codigo: data as string };
}

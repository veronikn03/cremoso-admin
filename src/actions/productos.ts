"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/supabase/retry";

export type ProductoInput = {
  nombre: string;
  categoria: string;
  descripcion: string;
  precio_usd: number;
  stock: number;
  unidad: string;
  stock_min: number;
  activo: boolean;
  imagen_url: string | null;
};

export async function guardarProducto(id: string | null, data: ProductoInput) {
  const supabase = await createClient();
  await withRetry(() => supabase.auth.getUser());
  const payload = { ...data, actualizado: new Date().toISOString() };

  const { error } = id
    ? await supabase.from("productos").update(payload).eq("id", id)
    : await supabase.from("productos").insert(payload);

  if (error) return { error: error.message };
  revalidatePath("/admin/inventario");
  revalidatePath("/");
  revalidatePath("/cuenta");
  return { error: null };
}

export async function eliminarProducto(id: string) {
  const supabase = await createClient();
  await withRetry(() => supabase.auth.getUser());
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/inventario");
  return { error: null };
}

export async function entradaInventario(id: string, nuevoStock: number) {
  const supabase = await createClient();
  await withRetry(() => supabase.auth.getUser());
  const { error } = await supabase
    .from("productos")
    .update({ stock: nuevoStock, actualizado: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/inventario");
  return { error: null };
}

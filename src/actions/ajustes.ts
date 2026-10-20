"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withRetry } from "@/lib/supabase/retry";

export async function guardarAjustes(data: {
  negocio: string;
  tasa: number;
  whatsapp: string;
}) {
  const supabase = await createClient();
  await withRetry(() => supabase.auth.getUser());
  const { error } = await supabase
    .from("config")
    .update({ ...data, actualizado: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/admin/ajustes");
  revalidatePath("/");
  revalidatePath("/cuenta");
  return { error: null };
}

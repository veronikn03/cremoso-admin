import { createClient } from "@/lib/supabase/server";
import AjustesClient from "./AjustesClient";

export default async function AjustesPage() {
  const supabase = await createClient();
  const { data: config } = await supabase.from("config").select("*").eq("id", 1).single();

  return (
    <div>
      <div className="bar">
        <h2>Ajustes del negocio</h2>
      </div>
      <AjustesClient
        negocio={config?.negocio ?? "Cremoso Gourmet"}
        tasa={config?.tasa ?? 0}
        whatsapp={config?.whatsapp ?? ""}
      />
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { fUSD } from "@/lib/format";

export default async function ResumenPage() {
  const supabase = await createClient();

  const [{ data: clientes }, { count: numProductos }] = await Promise.all([
    supabase.from("clientes_derivados").select("saldo_usd"),
    supabase.from("productos").select("*", { count: "exact", head: true }),
  ]);

  const porCobrar = (clientes ?? []).reduce((a, c) => a + (c.saldo_usd || 0), 0);
  const conDeuda = (clientes ?? []).filter((c) => c.saldo_usd > 0.009).length;

  return (
    <div>
      <div className="kpis">
        <div className="kpi hot">
          <div className="l">Por cobrar</div>
          <div className="v">{fUSD(porCobrar)}</div>
          <div className="s">{conDeuda ? `${conDeuda} cliente(s)` : "nadie debe"}</div>
        </div>
        <div className="kpi">
          <div className="l">Productos</div>
          <div className="v">{numProductos ?? 0}</div>
          <div className="s">en el inventario</div>
        </div>
        <div className="kpi">
          <div className="l">Clientes</div>
          <div className="v">{(clientes ?? []).length}</div>
          <div className="s">registrados</div>
        </div>
      </div>
      <div className="empty">
        <b>Los pedidos y pagos llegan en la próxima fase</b>
        Por ahora puedes agregar tus productos en Inventario y tus clientes en Clientes.
      </div>
    </div>
  );
}

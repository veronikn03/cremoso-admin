import { createClient } from "@/lib/supabase/server";
import { fUSD } from "@/lib/format";
import InventarioClient from "./InventarioClient";

export type Producto = {
  id: string;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  precio_usd: number;
  stock: number;
  unidad: string;
  stock_min: number;
  activo: boolean;
};

export default async function InventarioPage() {
  const supabase = await createClient();
  const { data: productos } = await supabase
    .from("productos")
    .select("*")
    .order("categoria")
    .order("nombre");

  const lista = (productos ?? []) as Producto[];
  const valor = lista
    .filter((p) => p.activo)
    .reduce((a, p) => a + p.stock * p.precio_usd, 0);

  return (
    <div>
      <div className="bar">
        <div>
          <h2>Inventario</h2>
          <div className="muted" style={{ fontSize: 13 }}>
            {lista.length} productos · valor a precio de venta{" "}
            <b className="num">{fUSD(valor)}</b>
          </div>
        </div>
      </div>
      <InventarioClient productos={lista} />
    </div>
  );
}

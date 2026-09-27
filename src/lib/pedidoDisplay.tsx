import { fUSD, fBs } from "@/lib/format";
import type { Pedido, PedidoItem } from "@/app/admin/(protected)/pedidos/page";

export function Money({ usd, tasa }: { usd: number; tasa: number }) {
  return (
    <>
      <span className="money">{fUSD(usd)}</span>
      {tasa > 0 && <small className="bs">{fBs(usd * tasa)}</small>}
    </>
  );
}

export function payChip(o: Pedido) {
  if (o.estado === "cancelado") return <span className="chip muted">Cancelado</span>;
  if (o.saldo_usd <= 0.009) return <span className="chip good">Pagado</span>;
  if (o.pagado_usd > 0) return <span className="chip warn">Abonado</span>;
  return <span className="chip bad">Pendiente</span>;
}

export function delivChip(o: Pedido) {
  if (o.estado === "cancelado") return null;
  if (o.entregado) return <span className="chip muted">Entregado</span>;
  return <span className="chip accent">Por entregar</span>;
}

export function itemsTxt(items: PedidoItem[]) {
  return items.map((i) => `${i.cant} ${i.nombre}`).join(", ");
}

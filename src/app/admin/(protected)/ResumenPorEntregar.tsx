"use client";

import { useState } from "react";
import { fDate } from "@/lib/format";
import { marcarEntregado } from "@/actions/pedidos";
import { Money, payChip, delivChip, itemsTxt } from "@/lib/pedidoDisplay";
import PagoSheet from "@/components/PagoSheet";
import { DetallePedidoSheet } from "./pedidos/PedidosClient";
import type { Pedido } from "./pedidos/page";

export default function ResumenPorEntregar({ pedidos, tasa }: { pedidos: Pedido[]; tasa: number }) {
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [pagoFor, setPagoFor] = useState<Pedido | null>(null);

  const detalle = detalleId ? pedidos.find((o) => o.id === detalleId) ?? null : null;

  if (!pedidos.length) return <p className="muted">No hay pedidos pendientes de entrega.</p>;

  return (
    <>
      <div className="list">
        {pedidos.map((o) => (
          <div className="row" key={o.id}>
            <div>
              <div className="t">
                #{o.numero} · {o.cliente_nombre}{" "}
                <span className="chips">
                  {payChip(o)}
                  {delivChip(o)}
                </span>
              </div>
              <div className="sub">
                {fDate(o.fecha)} · {itemsTxt(o.items)}
              </div>
            </div>
            <div className="r">
              <Money usd={o.total_usd} tasa={tasa} />
            </div>
            <div className="acts">
              {o.saldo_usd > 0.009 && (
                <button className="btn sm" onClick={() => setPagoFor(o)}>
                  Registrar pago
                </button>
              )}
              <button className="btn sm" onClick={() => marcarEntregado(o.id, true)}>
                Marcar entregado
              </button>
              <button className="btn sm ghost" onClick={() => setDetalleId(o.id)}>
                Detalle
              </button>
            </div>
          </div>
        ))}
      </div>
      {detalle && (
        <DetallePedidoSheet pedido={detalle} tasa={tasa} onClose={() => setDetalleId(null)} onPagar={() => setPagoFor(detalle)} />
      )}
      {pagoFor && (
        <PagoSheet
          target={{ kind: "pedido", id: pagoFor.id, numero: pagoFor.numero, clienteNombre: pagoFor.cliente_nombre, saldo: pagoFor.saldo_usd }}
          tasa={tasa}
          onClose={() => setPagoFor(null)}
        />
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import { fUSD, fBs, fDate, days } from "@/lib/format";
import { waLink, recordatorioTxt } from "@/lib/whatsapp";
import { itemsTxt } from "@/lib/pedidoDisplay";
import PagoSheet from "@/components/PagoSheet";
import type { ClienteDeuda } from "./page";
import type { Pedido } from "../pedidos/page";

const BUCKETS: [number, number, string, string][] = [
  [0, 7, "0–7 días", "var(--good)"],
  [8, 15, "8–15 días", "var(--warn)"],
  [16, 30, "16–30 días", "var(--accent)"],
  [31, Infinity, "Más de 30 días", "var(--bad)"],
];

export default function CobrarClient({
  clientesDeuda,
  pedidosSaldo,
  pedidos,
  tasa,
  negocio,
}: {
  clientesDeuda: ClienteDeuda[];
  pedidosSaldo: { fecha: string; saldo_usd: number }[];
  pedidos: Pedido[];
  tasa: number;
  negocio: string;
}) {
  const [pagoFor, setPagoFor] = useState<ClienteDeuda | null>(null);
  const [recordarFor, setRecordarFor] = useState<ClienteDeuda | null>(null);
  const [cuentaFor, setCuentaFor] = useState<ClienteDeuda | null>(null);

  const total = Math.round(clientesDeuda.reduce((a, c) => a + c.saldo_usd, 0) * 100) / 100;
  const bk = BUCKETS.map(() => 0);
  pedidosSaldo.forEach((o) => {
    const d = days(o.fecha);
    const i = BUCKETS.findIndex((b) => d >= b[0] && d <= b[1]);
    if (i >= 0) bk[i] += o.saldo_usd;
  });

  return (
    <>
      <div className="bar">
        <h2>Cuentas por cobrar</h2>
      </div>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="bar" style={{ margin: 0 }}>
          <div>
            <h3>Total por cobrar</h3>
            <div style={{ fontSize: 30, fontWeight: 700 }} className="num">
              {fUSD(total)}
            </div>
            {tasa > 0 && <div className="muted num">{fBs(total * tasa)} a la tasa del día</div>}
          </div>
          <div className="muted" style={{ fontSize: 13, maxWidth: "36ch" }}>
            Las deudas se guardan en dólares. El monto en bolívares se recalcula con la tasa del día.
          </div>
        </div>
        {total > 0 && (
          <>
            <div className="aging" role="img" aria-label="Antigüedad de la deuda">
              {BUCKETS.map((b, i) =>
                bk[i] > 0 ? (
                  <div key={i} style={{ width: `${(bk[i] / total) * 100}%`, background: b[3] }} title={`${b[2]}: ${fUSD(bk[i])}`} />
                ) : null,
              )}
            </div>
            <div className="legend">
              {BUCKETS.map((b, i) => (
                <span key={i}>
                  <i style={{ background: b[3] }} />
                  {b[2]}: <b className="num">{fUSD(bk[i])}</b>
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {clientesDeuda.length ? (
        <div className="tw">
          <table className="t">
            <thead>
              <tr>
                <th>Cliente</th>
                <th className="n">Pedidos con deuda</th>
                <th className="n">Más antiguo</th>
                <th className="n">Saldo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientesDeuda.map((c) => {
                const d = days(c.pedido_mas_antiguo);
                return (
                  <tr key={c.id}>
                    <td>
                      <b>{c.nombre}</b>
                      {c.telefono && <small className="bs">{c.telefono}</small>}
                    </td>
                    <td className="n">{c.pedidos_abiertos}</td>
                    <td className="n">
                      {d} días {d > 30 ? <span className="chip bad">Vencido</span> : d > 15 ? <span className="chip warn">Atrasado</span> : null}
                    </td>
                    <td className="n">
                      <b>{fUSD(c.saldo_usd)}</b>
                      {tasa > 0 && <small className="bs">{fBs(c.saldo_usd * tasa)}</small>}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn sm pri" onClick={() => setPagoFor(c)}>
                        Registrar pago
                      </button>{" "}
                      <button className="btn sm" onClick={() => setRecordarFor(c)}>
                        Recordatorio
                      </button>{" "}
                      <button className="btn sm ghost" onClick={() => setCuentaFor(c)}>
                        Estado de cuenta
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <b>No hay cuentas por cobrar</b>
          Todos los pedidos están pagados.
        </div>
      )}

      {pagoFor && (
        <PagoSheet
          target={{ kind: "cliente", id: pagoFor.id, nombre: pagoFor.nombre, saldo: pagoFor.saldo_usd }}
          tasa={tasa}
          onClose={() => setPagoFor(null)}
        />
      )}
      {recordarFor && (
        <RecordatorioSheet cliente={recordarFor} pedidos={pedidos} tasa={tasa} negocio={negocio} onClose={() => setRecordarFor(null)} />
      )}
      {cuentaFor && <EstadoCuentaSheet cliente={cuentaFor} pedidos={pedidos} onClose={() => setCuentaFor(null)} />}
    </>
  );
}

function RecordatorioSheet({
  cliente,
  pedidos,
  tasa,
  negocio,
  onClose,
}: {
  cliente: ClienteDeuda;
  pedidos: Pedido[];
  tasa: number;
  negocio: string;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const pedidosConSaldo = pedidos
    .filter((o) => o.cliente_id === cliente.id && o.saldo_usd > 0.009)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((o) => ({ numero: o.numero, fecha: o.fecha, saldo_usd: o.saldo_usd }));
  const texto = recordatorioTxt({ negocio, clienteNombre: cliente.nombre, pedidosConSaldo, saldoTotal: cliente.saldo_usd, tasa });

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // el usuario puede seleccionar el texto manualmente
    }
  }

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>Recordatorio de pago</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <pre className="msg">{texto}</pre>
        {!cliente.telefono && (
          <p className="muted" style={{ fontSize: 13 }}>
            Este cliente no tiene teléfono guardado; WhatsApp te pedirá elegir el contacto.
          </p>
        )}
        <div className="foot">
          <button className="btn" onClick={copiar}>
            {copiado ? "Copiado" : "Copiar"}
          </button>
          <a className="btn pri" target="_blank" rel="noopener" href={waLink(cliente.telefono, texto)}>
            Abrir en WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

type Mov = { fecha: string; titulo: string; detalle: string; cargo: number; abono: number; orden: number };

function EstadoCuentaSheet({ cliente, pedidos, onClose }: { cliente: ClienteDeuda; pedidos: Pedido[]; onClose: () => void }) {
  const propios = pedidos.filter((o) => o.cliente_id === cliente.id && o.estado !== "cancelado");
  const mov: Mov[] = [];
  propios.forEach((o) => {
    mov.push({ fecha: o.fecha, titulo: `Pedido #${o.numero}`, detalle: itemsTxt(o.items), cargo: o.total_usd, abono: 0, orden: o.numero * 2 });
    o.pagos.forEach((p) => {
      mov.push({
        fecha: p.fecha,
        titulo: `Pago a #${o.numero}`,
        detalle: `${p.metodo}${p.moneda === "Bs" ? ` · ${fBs(p.monto_original)}` : ""}${p.referencia ? ` · Ref. ${p.referencia}` : ""}`,
        cargo: 0,
        abono: p.monto_usd,
        orden: o.numero * 2 + 1,
      });
    });
  });
  mov.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.orden - b.orden);
  let saldo = 0;
  const filas = mov.map((m) => {
    saldo = Math.round((saldo + m.cargo - m.abono) * 100) / 100;
    return { ...m, saldo };
  });

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>Estado de cuenta</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="bar">
          <div>
            <b style={{ fontSize: 17 }}>{cliente.nombre}</b>
            {cliente.telefono && <div className="muted">{cliente.telefono}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="muted" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em" }}>
              Saldo
            </span>
            <div style={{ fontSize: 22, fontWeight: 700 }} className={`num ${cliente.saldo_usd > 0.009 ? "neg" : "pos"}`}>
              {fUSD(cliente.saldo_usd)}
            </div>
          </div>
        </div>
        {filas.length ? (
          <div className="tw">
            <table className="t">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Movimiento</th>
                  <th className="n">Cargo</th>
                  <th className="n">Pago</th>
                  <th className="n">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((m, i) => (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap" }}>{fDate(m.fecha)}</td>
                    <td>
                      <b>{m.titulo}</b>
                      <small className="bs">{m.detalle}</small>
                    </td>
                    <td className="n">{m.cargo ? fUSD(m.cargo) : ""}</td>
                    <td className="n pos">{m.abono ? fUSD(m.abono) : ""}</td>
                    <td className="n">
                      <b>{fUSD(m.saldo)}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">Sin movimientos.</div>
        )}
        <div className="foot">
          <button className="btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

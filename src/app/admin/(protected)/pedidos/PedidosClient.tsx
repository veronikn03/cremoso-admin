"use client";

import { useState } from "react";
import { fUSD, fBs, fDate, parseNum, today, METODOS } from "@/lib/format";
import { crearPedido, cancelarPedido, marcarEntregado, eliminarPago } from "@/actions/pedidos";
import PagoSheet from "@/components/PagoSheet";
import { Money, payChip, delivChip, itemsTxt } from "@/lib/pedidoDisplay";
import type { Pedido } from "./page";

type Filtro = "abiertos" | "entregar" | "saldo" | "todos" | "cancelados";
const FILTROS: [Filtro, string][] = [
  ["abiertos", "Abiertos"],
  ["entregar", "Por entregar"],
  ["saldo", "Con deuda"],
  ["todos", "Todos"],
  ["cancelados", "Cancelados"],
];

export default function PedidosClient({
  pedidosIniciales,
  clientes,
  productos,
  tasa,
  filtroInicial,
}: {
  pedidosIniciales: Pedido[];
  clientes: { id: string; nombre: string; saldo_usd: number }[];
  productos: { id: string; nombre: string; precio_usd: number; stock: number; activo: boolean }[];
  tasa: number;
  filtroInicial?: Filtro;
}) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>(filtroInicial ?? "abiertos");
  const [nuevo, setNuevo] = useState(false);
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [pagoFor, setPagoFor] = useState<Pedido | null>(null);

  let lista = pedidosIniciales;
  if (filtro === "abiertos") lista = lista.filter((o) => o.estado !== "cancelado" && (!o.entregado || o.saldo_usd > 0.009));
  if (filtro === "entregar") lista = lista.filter((o) => o.estado !== "cancelado" && !o.entregado);
  if (filtro === "saldo") lista = lista.filter((o) => o.saldo_usd > 0.009);
  if (filtro === "cancelados") lista = lista.filter((o) => o.estado === "cancelado");
  if (q) {
    const ql = q.toLowerCase();
    lista = lista.filter(
      (o) => o.cliente_nombre.toLowerCase().includes(ql) || String(o.numero).includes(ql) || itemsTxt(o.items).toLowerCase().includes(ql),
    );
  }

  const detalle = detalleId ? pedidosIniciales.find((o) => o.id === detalleId) ?? null : null;

  return (
    <>
      <div className="bar">
        <h2>Pedidos</h2>
        <button className="btn pri" onClick={() => setNuevo(true)}>
          + Nuevo pedido
        </button>
      </div>
      <div className="bar">
        <div className="filters">
          {FILTROS.map(([k, t]) => (
            <button key={k} aria-pressed={filtro === k} onClick={() => setFiltro(k)}>
              {t}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="search"
          placeholder="Buscar cliente, nº o dulce"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="panel">
        {lista.length ? (
          <div className="list">
            {lista.map((o) => (
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
                  {o.estado !== "cancelado" && o.saldo_usd > 0.009 && o.pagado_usd > 0 && (
                    <small className="bs neg">Debe {fUSD(o.saldo_usd)}</small>
                  )}
                </div>
                <div className="acts">
                  {o.estado !== "cancelado" && o.saldo_usd > 0.009 && (
                    <button className="btn sm" onClick={() => setPagoFor(o)}>
                      Registrar pago
                    </button>
                  )}
                  {o.estado !== "cancelado" && !o.entregado && (
                    <button className="btn sm" onClick={() => marcarEntregado(o.id, true)}>
                      Marcar entregado
                    </button>
                  )}
                  <button className="btn sm ghost" onClick={() => setDetalleId(o.id)}>
                    Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <b>{pedidosIniciales.length ? "Ningún pedido en este filtro" : "Aún no hay pedidos"}</b>
            {pedidosIniciales.length
              ? "Prueba con otro filtro."
              : "Cuando registres un pedido se descontará del inventario y quedará en cuentas por cobrar."}
          </div>
        )}
      </div>

      {nuevo && (
        <NuevoPedidoSheet clientes={clientes} productos={productos} tasa={tasa} onClose={() => setNuevo(false)} />
      )}
      {detalle && (
        <DetallePedidoSheet
          pedido={detalle}
          tasa={tasa}
          onClose={() => setDetalleId(null)}
          onPagar={() => setPagoFor(detalle)}
        />
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

type Linea = { producto_id: string; cant: string };

function NuevoPedidoSheet({
  clientes,
  productos,
  tasa,
  onClose,
}: {
  clientes: { id: string; nombre: string; saldo_usd: number }[];
  productos: { id: string; nombre: string; precio_usd: number; stock: number; activo: boolean }[];
  tasa: number;
  onClose: () => void;
}) {
  const [clienteId, setClienteId] = useState("");
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [telefonoNuevo, setTelefonoNuevo] = useState("");
  const [fecha, setFecha] = useState(today());
  const [lineas, setLineas] = useState<Linea[]>([{ producto_id: "", cant: "1" }]);
  const [abono, setAbono] = useState("");
  const [moneda, setMoneda] = useState<"USD" | "Bs">("USD");
  const [metodo, setMetodo] = useState<string>(METODOS[0]);
  const [referencia, setReferencia] = useState("");
  const [entregado, setEntregado] = useState(false);
  const [notas, setNotas] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const prodById = (id: string) => productos.find((p) => p.id === id);
  const disponibles = productos.filter((p) => p.activo && (p.stock > 0 || lineas.some((l) => l.producto_id === p.id)));
  const total = Math.round(lineas.reduce((a, l) => {
    const p = prodById(l.producto_id);
    return a + (p ? (parseInt(l.cant || "0", 10) || 0) * p.precio_usd : 0);
  }, 0) * 100) / 100;

  const a = parseNum(abono);
  const usdAbono = moneda === "Bs" ? (tasa ? a / tasa : NaN) : a;
  let abonoHint = "";
  if (!abono || isNaN(a)) {
    abonoHint = total ? `Quedará debiendo ${fUSD(total)}.` : "";
  } else if (isNaN(usdAbono)) {
    abonoHint = "Fija la tasa del día para registrar pagos en bolívares.";
  } else {
    abonoHint = `Equivale a ${fUSD(usdAbono)}. Queda debiendo ${fUSD(Math.max(0, total - usdAbono))}.`;
  }

  function updateLinea(i: number, patch: Partial<Linea>) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLinea() {
    setLineas((prev) => [...prev, { producto_id: "", cant: "1" }]);
  }
  function delLinea(i: number) {
    setLineas((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length ? next : [{ producto_id: "", cant: "1" }];
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId) return setErr("Elige el cliente");
    if (clienteId === "__nuevo" && !nombreNuevo.trim()) return setErr("Escribe el nombre del cliente nuevo");

    const agg: Record<string, number> = {};
    for (const l of lineas) {
      if (!l.producto_id) continue;
      const cant = parseInt(l.cant || "0", 10);
      if (!cant || cant <= 0) return setErr("Las cantidades deben ser mayores que 0");
      agg[l.producto_id] = (agg[l.producto_id] || 0) + cant;
    }
    if (!Object.keys(agg).length) return setErr("Agrega al menos un dulce");
    for (const [pid, cant] of Object.entries(agg)) {
      const p = prodById(pid);
      if (p && cant > p.stock) return setErr(`Solo quedan ${p.stock} de ${p.nombre}`);
    }

    let abonoUsd = 0;
    if (abono) {
      if (isNaN(a)) return setErr("El monto del pago no es un número válido");
      if (a > 0) {
        if (moneda === "Bs" && !tasa) return setErr("Fija la tasa del día para registrar pagos en bolívares");
        abonoUsd = Math.round((moneda === "Bs" ? a / tasa : a) * 100) / 100;
        if (abonoUsd > total + 0.01) return setErr("El pago es mayor que el total del pedido");
      }
    }

    setBusy(true);
    const res = await crearPedido({
      cliente_id: clienteId === "__nuevo" ? null : clienteId,
      cliente_nuevo: clienteId === "__nuevo" ? { nombre: nombreNuevo.trim(), telefono: telefonoNuevo.trim() } : null,
      fecha,
      items: Object.entries(agg).map(([producto_id, cant]) => ({ producto_id, cant })),
      notas: notas.trim(),
      entregado,
      abono: abonoUsd > 0 ? { monto_original: a, moneda, metodo, referencia: referencia.trim() } : null,
    });
    setBusy(false);
    if (res.error) return setErr(res.error);
    onClose();
  }

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>Nuevo pedido</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="fg">
            <label className="f">
              Cliente
              <select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Elige un cliente…</option>
                <option value="__nuevo">+ Cliente nuevo</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                    {c.saldo_usd > 0.009 ? ` (debe ${fUSD(c.saldo_usd)})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="f">
              Fecha
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
            {clienteId === "__nuevo" && (
              <>
                <label className="f">
                  Nombre del cliente
                  <input value={nombreNuevo} onChange={(e) => setNombreNuevo(e.target.value)} />
                </label>
                <label className="f">
                  Teléfono
                  <input type="tel" value={telefonoNuevo} onChange={(e) => setTelefonoNuevo(e.target.value)} />
                </label>
              </>
            )}
          </div>

          <div className="box">
            <h3>Dulces</h3>
            {disponibles.length ? (
              <>
                <div className="lines">
                  {lineas.map((l, i) => {
                    const p = prodById(l.producto_id);
                    return (
                      <div className="line" key={i}>
                        <select value={l.producto_id} onChange={(e) => updateLinea(i, { producto_id: e.target.value })} aria-label="Producto">
                          <option value="">Elige…</option>
                          {disponibles.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.nombre} · {fUSD(x.precio_usd)} · quedan {x.stock}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={l.cant}
                          onChange={(e) => updateLinea(i, { cant: e.target.value })}
                          aria-label="Cantidad"
                        />
                        <span className="sub">{p ? fUSD((parseInt(l.cant || "0", 10) || 0) * p.precio_usd) : ""}</span>
                        <button type="button" className="x" onClick={() => delLinea(i)} aria-label="Quitar">
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
                <button type="button" className="btn sm ghost" style={{ marginTop: 8 }} onClick={addLinea}>
                  + Agregar otro dulce
                </button>
              </>
            ) : (
              <p className="muted" style={{ margin: 0 }}>
                No hay productos con existencia. Agrega inventario primero.
              </p>
            )}
            <div className="sum">
              <span className="muted">Total</span>
              <span style={{ textAlign: "right" }}>
                <b>{fUSD(total)}</b>
                {tasa > 0 && <small className="bs">{fBs(total * tasa)}</small>}
              </span>
            </div>
          </div>

          <div className="box">
            <h3>Pago al momento (opcional)</h3>
            <div className="fg">
              <label className="f">
                Monto
                <input inputMode="decimal" value={abono} onChange={(e) => setAbono(e.target.value)} placeholder="0 si queda a crédito" />
              </label>
              <label className="f">
                Moneda
                <select value={moneda} onChange={(e) => setMoneda(e.target.value as "USD" | "Bs")}>
                  <option value="USD">Dólares ($)</option>
                  <option value="Bs">Bolívares (Bs)</option>
                </select>
              </label>
              <label className="f">
                Método
                <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                  {METODOS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="f">
                Referencia
                <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Nº de operación" />
              </label>
            </div>
            <p className="muted" style={{ fontSize: 13, margin: "8px 0 0" }}>
              {abonoHint}
            </p>
          </div>

          <div className="fg" style={{ marginTop: 14 }}>
            <label className="check">
              <input type="checkbox" checked={entregado} onChange={(e) => setEntregado(e.target.checked)} /> Ya se entregó
            </label>
            <label className="f full">
              Notas
              <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Fecha de entrega, dedicatoria…" />
            </label>
          </div>
          <div className="err" style={{ marginTop: 10 }}>
            {err}
          </div>
          <div className="foot">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn pri" type="submit" disabled={busy}>
              Guardar pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function DetallePedidoSheet({
  pedido,
  tasa,
  onClose,
  onPagar,
}: {
  pedido: Pedido;
  tasa: number;
  onClose: () => void;
  onPagar: () => void;
}) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelPago, setConfirmDelPago] = useState<string | null>(null);

  async function onCancelar() {
    setBusy(true);
    const res = await cancelarPedido(pedido.id);
    setBusy(false);
    if (res.error) return setErr(res.error);
    onClose();
  }

  async function onEntregar(entregado: boolean) {
    setBusy(true);
    await marcarEntregado(pedido.id, entregado);
    setBusy(false);
  }

  async function onDelPago(id: string) {
    setBusy(true);
    const res = await eliminarPago(id);
    setBusy(false);
    if (res.error) setErr(res.error);
    setConfirmDelPago(null);
  }

  const pagos = [...pedido.pagos].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>Pedido #{pedido.numero}</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <p style={{ margin: "0 0 10px" }}>
          <b>{pedido.cliente_nombre}</b> · {fDate(pedido.fecha)}{" "}
          <span className="chips">
            {payChip(pedido)}
            {delivChip(pedido)}
          </span>
        </p>
        <div className="tw">
          <table className="t">
            <thead>
              <tr>
                <th>Dulce</th>
                <th className="n">Cant.</th>
                <th className="n">Precio</th>
                <th className="n">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.items.map((i, idx) => (
                <tr key={idx}>
                  <td>{i.nombre}</td>
                  <td className="n">{i.cant}</td>
                  <td className="n">{fUSD(i.precio_usd)}</td>
                  <td className="n">{fUSD(i.cant * i.precio_usd)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}>
                  <b>Total</b>
                </td>
                <td className="n">
                  <b>{fUSD(pedido.total_usd)}</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {pedido.notas && <p className="muted">Nota: {pedido.notas}</p>}
        <div className="box">
          <h3>Pagos</h3>
          {pagos.length ? (
            pagos.map((p) => (
              <div className="row" key={p.id}>
                <div>
                  <div className="t">
                    {fUSD(p.monto_usd)}{" "}
                    {p.moneda === "Bs" && (
                      <span className="muted" style={{ fontWeight: 400 }}>
                        ({fBs(p.monto_original)} a {p.tasa_bs})
                      </span>
                    )}
                  </div>
                  <div className="sub">
                    {fDate(p.fecha)} · {p.metodo}
                    {p.referencia ? ` · Ref. ${p.referencia}` : ""}
                  </div>
                </div>
                <div className="r">
                  {confirmDelPago === p.id ? (
                    <button className="btn sm danger" onClick={() => onDelPago(p.id)} disabled={busy}>
                      Sí, eliminar
                    </button>
                  ) : (
                    <button className="btn sm ghost" onClick={() => setConfirmDelPago(p.id)}>
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Sin pagos todavía.
            </p>
          )}
          <div className="sum">
            <span className="muted">Saldo</span>
            <b className={pedido.saldo_usd > 0.009 ? "neg" : "pos"}>{fUSD(pedido.saldo_usd)}</b>
          </div>
        </div>
        <div className="err">{err}</div>
        <div className="foot">
          {pedido.estado !== "cancelado" &&
            (confirmCancel ? (
              pedido.pagado_usd > 0 ? (
                <span className="muted" style={{ marginRight: "auto", fontSize: 13 }}>
                  Este pedido tiene pagos. Elimínalos primero.
                </span>
              ) : (
                <span style={{ marginRight: "auto" }}>
                  <span className="muted" style={{ fontSize: 13 }}>
                    ¿Cancelar y devolver al inventario?
                  </span>{" "}
                  <button className="btn sm danger" onClick={onCancelar} disabled={busy}>
                    Sí, cancelar
                  </button>
                </span>
              )
            ) : (
              <span style={{ marginRight: "auto" }}>
                <button className="btn danger" onClick={() => setConfirmCancel(true)}>
                  Cancelar pedido
                </button>
              </span>
            ))}
          {pedido.estado !== "cancelado" && pedido.entregado && (
            <button className="btn" onClick={() => onEntregar(false)} disabled={busy}>
              Marcar por entregar
            </button>
          )}
          {pedido.estado !== "cancelado" && !pedido.entregado && (
            <button className="btn" onClick={() => onEntregar(true)} disabled={busy}>
              Marcar entregado
            </button>
          )}
          {pedido.saldo_usd > 0.009 && (
            <button className="btn pri" onClick={onPagar}>
              Registrar pago
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

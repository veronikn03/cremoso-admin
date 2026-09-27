"use client";

import { useState } from "react";
import { fUSD, fBs, fTasa, parseNum, today, METODOS } from "@/lib/format";
import { registrarPago } from "@/actions/pedidos";

type Target =
  | { kind: "pedido"; id: string; numero: number; clienteNombre: string; saldo: number }
  | { kind: "cliente"; id: string; nombre: string; saldo: number };

export default function PagoSheet({
  target,
  tasa,
  onClose,
}: {
  target: Target;
  tasa: number;
  onClose: () => void;
}) {
  const [monto, setMonto] = useState("");
  const [moneda, setMoneda] = useState<"USD" | "Bs">("USD");
  const [metodo, setMetodo] = useState<string>(METODOS[0]);
  const [fecha, setFecha] = useState(today());
  const [referencia, setReferencia] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const saldo = target.saldo;
  const a = parseNum(monto);
  const usd = moneda === "Bs" ? (tasa ? a / tasa : NaN) : a;
  let hint = "";
  if (monto && !isNaN(a)) {
    if (moneda === "Bs" && !tasa) hint = "Fija la tasa del día para registrar pagos en bolívares.";
    else if (!isNaN(usd))
      hint = `${moneda === "Bs" ? `Equivale a ${fUSD(usd)} a ${fTasa(tasa)} Bs/$. ` : ""}Queda debiendo ${fUSD(Math.max(0, saldo - usd))}.`;
  }

  function pagaTodo() {
    setMonto(moneda === "Bs" && tasa ? String(Math.round(saldo * tasa * 100) / 100).replace(".", ",") : String(saldo).replace(".", ","));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!monto || isNaN(a) || a < 0) return setErr("Escribe el monto del pago");
    if (moneda === "Bs" && !tasa) return setErr("Fija la tasa del día primero");
    let montoUsd = Math.round((moneda === "Bs" ? a / tasa : a) * 100) / 100;
    if (montoUsd > saldo + 0.01) return setErr(`El pago supera el saldo de ${fUSD(saldo)}`);
    montoUsd = Math.min(montoUsd, saldo);

    setBusy(true);
    const res = await registrarPago({
      pedido_id: target.kind === "pedido" ? target.id : null,
      cliente_id: target.kind === "cliente" ? target.id : null,
      monto_original: a,
      moneda,
      metodo,
      referencia: referencia.trim(),
      fecha,
    });
    setBusy(false);
    if (res.error) return setErr(res.error);
    onClose();
  }

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>Registrar pago</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="fg" onSubmit={onSubmit}>
          <p className="full" style={{ margin: 0 }}>
            {target.kind === "pedido" ? (
              <>
                Pedido <b>#{target.numero}</b> de <b>{target.clienteNombre}</b>
              </>
            ) : (
              <>
                Cuenta de <b>{target.nombre}</b> · se aplica a los pedidos más antiguos primero
              </>
            )}
          </p>
          <div
            className="full box"
            style={{ margin: 0, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
          >
            <span className="muted">Saldo pendiente</span>
            <span style={{ textAlign: "right" }}>
              <b style={{ fontSize: 20 }} className="num">
                {fUSD(saldo)}
              </b>
              {tasa > 0 && <small className="bs">{fBs(saldo * tasa)}</small>}
            </span>
          </div>
          <label className="f">
            Monto
            <input inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} required />
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
            Fecha
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label className="f full">
            Referencia
            <input value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Nº de operación" />
          </label>
          <p className="muted full" style={{ margin: 0, fontSize: 13 }}>
            {hint}
          </p>
          <div className="err full">{err}</div>
          <div className="foot full">
            <button type="button" className="btn" onClick={pagaTodo}>
              Paga todo
            </button>
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn pri" type="submit" disabled={busy}>
              Guardar pago
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { parseNum } from "@/lib/format";
import { guardarAjustes } from "@/actions/ajustes";

export default function AjustesClient({
  negocio,
  tasa,
  whatsapp,
}: {
  negocio: string;
  tasa: number;
  whatsapp: string;
}) {
  const [n, setN] = useState(negocio);
  const [t, setT] = useState(tasa ? String(tasa).replace(".", ",") : "");
  const [w, setW] = useState(whatsapp);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOk(false);
    const parsed = parseNum(t);
    if (isNaN(parsed) || parsed < 0) return setErr("Escribe la tasa como número, por ejemplo 36,50");
    setBusy(true);
    const res = await guardarAjustes({
      negocio: n.trim() || "Cremoso Gourmet",
      tasa: Math.round(parsed * 10000) / 10000,
      whatsapp: w.trim(),
    });
    setBusy(false);
    if (res.error) return setErr(res.error);
    setErr("");
    setOk(true);
  }

  return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <form className="fg" onSubmit={onSubmit}>
        <label className="f full">
          Nombre del negocio
          <input value={n} onChange={(e) => setN(e.target.value)} />
        </label>
        <label className="f">
          Tasa del día (Bs por $)
          <input value={t} onChange={(e) => setT(e.target.value)} inputMode="decimal" placeholder="Ej. 36,50" />
        </label>
        <label className="f">
          WhatsApp para pedidos
          <input value={w} onChange={(e) => setW(e.target.value)} placeholder="0414 1234567" />
        </label>
        <p className="muted full" style={{ margin: 0, fontSize: 13 }}>
          La tasa solo cambia el equivalente en bolívares que se muestra. Las deudas quedan en
          dólares; cada pago en bolívares se convierte con la tasa del día en que lo registras.
        </p>
        <div className="err full">{err}</div>
        {ok && <p className="full pos" style={{ margin: 0 }}>Guardado.</p>}
        <div className="full">
          <button className="btn pri" type="submit" disabled={busy}>
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
}

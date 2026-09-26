"use client";

import { useState } from "react";
import { fUSD } from "@/lib/format";
import { guardarCliente, generarCodigoCliente } from "@/actions/clientes";
import type { Cliente } from "./page";

export default function ClientesClient({ clientes }: { clientes: Cliente[] }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Cliente | null | "new">(null);
  const [codigoFor, setCodigoFor] = useState<Cliente | null>(null);

  const lista = clientes.filter(
    (c) =>
      !q ||
      c.nombre.toLowerCase().includes(q.toLowerCase()) ||
      (c.telefono ?? "").includes(q),
  );

  return (
    <>
      <div className="bar">
        <input
          type="search"
          className="search"
          placeholder="Buscar nombre o teléfono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn pri" onClick={() => setEditing("new")}>
          + Cliente
        </button>
      </div>

      {lista.length ? (
        <div className="tw">
          <table className="t">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th className="n">Pedidos</th>
                <th className="n">Comprado</th>
                <th className="n">Debe</th>
                <th>Acceso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.nombre}</b>
                    {c.notas && <small className="bs">{c.notas}</small>}
                  </td>
                  <td>{c.telefono || "—"}</td>
                  <td className="n">{c.num_pedidos}</td>
                  <td className="n">{fUSD(c.total_comprado)}</td>
                  <td className="n">
                    {c.saldo_usd > 0.009 ? (
                      <b className="neg">{fUSD(c.saldo_usd)}</b>
                    ) : (
                      <span className="pos">Al día</span>
                    )}
                  </td>
                  <td>
                    {c.codigo_hash ? (
                      <span className="chip good">Con código</span>
                    ) : (
                      <span className="chip muted">Sin código</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn sm" onClick={() => setCodigoFor(c)}>
                      Código de acceso
                    </button>{" "}
                    <button className="btn sm ghost" onClick={() => setEditing(c)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <b>{clientes.length ? "Sin resultados" : "Aún no hay clientes"}</b>
        </div>
      )}

      {editing && (
        <ClienteSheet cliente={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
      {codigoFor && <CodigoSheet cliente={codigoFor} onClose={() => setCodigoFor(null)} />}
    </>
  );
}

function ClienteSheet({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  const [nombre, setNombre] = useState(cliente?.nombre ?? "");
  const [telefono, setTelefono] = useState(cliente?.telefono ?? "");
  const [notas, setNotas] = useState(cliente?.notas ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return setErr("Escribe el nombre");
    setBusy(true);
    const res = await guardarCliente(cliente?.id ?? null, {
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      notas: notas.trim(),
    });
    setBusy(false);
    if (res.error) return setErr(res.error);
    onClose();
  }

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>{cliente ? "Editar cliente" : "Nuevo cliente"}</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="fg" onSubmit={onSubmit}>
          <label className="f full">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </label>
          <label className="f">
            Teléfono / WhatsApp
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </label>
          <label className="f">
            Notas
            <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Dirección, preferencias…" />
          </label>
          <div className="err full">{err}</div>
          <div className="foot full">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn pri" type="submit" disabled={busy}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CodigoSheet({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmar, setConfirmar] = useState(!cliente.codigo_hash);

  async function generar() {
    setBusy(true);
    const res = await generarCodigoCliente(cliente.id);
    setBusy(false);
    if (res.error) return setErr(res.error);
    setCodigo(res.codigo);
  }

  const fmt = (c: string) => c.slice(0, 5) + "-" + c.slice(5);

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>Código de acceso de {cliente.nombre}</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        {codigo ? (
          <div>
            <p className="muted">
              Nuevo código (se muestra una sola vez — cópialo y envíaselo por WhatsApp ahora):
            </p>
            <p className="code">{fmt(codigo)}</p>
          </div>
        ) : confirmar ? (
          <div>
            {cliente.codigo_hash && (
              <p className="muted">El código anterior dejará de funcionar en cuanto crees uno nuevo.</p>
            )}
            <button className="btn pri" onClick={generar} disabled={busy}>
              {cliente.codigo_hash ? "Crear nuevo código" : "Crear código de acceso"}
            </button>
          </div>
        ) : (
          <button className="btn danger" onClick={() => setConfirmar(true)}>
            Cambiar código (el anterior dejará de servir)
          </button>
        )}
        <div className="err">{err}</div>
        <div className="foot">
          <button className="btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

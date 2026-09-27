"use client";

import { useState } from "react";
import { fUSD, parseNum } from "@/lib/format";
import { catalogoCompartirTxt } from "@/lib/whatsapp";
import { guardarProducto, eliminarProducto, entradaInventario } from "@/actions/productos";
import type { Producto } from "./page";

function stockChip(p: Producto) {
  if (!p.activo) return <span className="chip muted">Oculto</span>;
  if (p.stock <= 0) return <span className="chip bad">Agotado</span>;
  if (p.stock <= p.stock_min) return <span className="chip warn">Quedan pocos</span>;
  return <span className="chip good">Disponible</span>;
}

export default function InventarioClient({
  productos,
  negocio,
  whatsapp,
  tasa,
}: {
  productos: Producto[];
  negocio: string;
  whatsapp: string;
  tasa: number;
}) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Producto | null | "new">(null);
  const [entradaFor, setEntradaFor] = useState<Producto | null>(null);
  const [compartir, setCompartir] = useState(false);

  const lista = productos.filter(
    (p) =>
      !q ||
      p.nombre.toLowerCase().includes(q.toLowerCase()) ||
      (p.categoria ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <div className="bar">
        <input
          type="search"
          className="search"
          placeholder="Buscar dulce o categoría"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chips">
          <button className="btn" onClick={() => setCompartir(true)}>
            Compartir catálogo
          </button>
          <button className="btn pri" onClick={() => setEditing("new")}>
            + Producto
          </button>
        </div>
      </div>

      {lista.length ? (
        <div className="tw">
          <table className="t">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Categoría</th>
                <th className="n">Precio</th>
                <th className="n">Disponible</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.nombre}</b>
                    {p.descripcion && <small className="bs">{p.descripcion}</small>}
                  </td>
                  <td>{p.categoria || "—"}</td>
                  <td className="n">{fUSD(p.precio_usd)}</td>
                  <td className="n">
                    <b style={{ fontSize: 17 }}>{p.stock}</b>{" "}
                    <span className="muted">{p.unidad}</span>
                  </td>
                  <td>{stockChip(p)}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn sm" onClick={() => setEntradaFor(p)}>
                      + Entrada
                    </button>{" "}
                    <button className="btn sm ghost" onClick={() => setEditing(p)}>
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
          <b>{productos.length ? "Sin resultados" : "Tu inventario está vacío"}</b>
          {!productos.length &&
            "Agrega tus dulces con su precio en dólares y la cantidad disponible."}
        </div>
      )}

      {editing && (
        <ProductoSheet producto={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
      {entradaFor && <EntradaSheet producto={entradaFor} onClose={() => setEntradaFor(null)} />}
      {compartir && (
        <CompartirSheet productos={productos} negocio={negocio} whatsapp={whatsapp} tasa={tasa} onClose={() => setCompartir(false)} />
      )}
    </>
  );
}

function CompartirSheet({
  productos,
  negocio,
  whatsapp,
  tasa,
  onClose,
}: {
  productos: Producto[];
  negocio: string;
  whatsapp: string;
  tasa: number;
  onClose: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const texto = catalogoCompartirTxt({ negocio, whatsapp, tasa, productos });

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
          <h2>Catálogo para compartir</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Pégalo en tu estado de WhatsApp, Instagram o un grupo. Solo incluye lo que tiene existencia.
        </p>
        <pre className="msg">{texto}</pre>
        <div className="foot">
          <button className="btn pri" onClick={copiar}>
            {copiado ? "Copiado" : "Copiar texto"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductoSheet({ producto, onClose }: { producto: Producto | null; onClose: () => void }) {
  const [nombre, setNombre] = useState(producto?.nombre ?? "");
  const [categoria, setCategoria] = useState(producto?.categoria ?? "");
  const [precio, setPrecio] = useState(producto ? String(producto.precio_usd).replace(".", ",") : "");
  const [stock, setStock] = useState(String(producto?.stock ?? 0));
  const [unidad, setUnidad] = useState(producto?.unidad ?? "und");
  const [stockMin, setStockMin] = useState(String(producto?.stock_min ?? 3));
  const [activo, setActivo] = useState(producto?.activo ?? true);
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? "");
  const [err, setErr] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pr = parseNum(precio);
    const st = parseInt(stock || "0", 10);
    const mn = parseInt(stockMin || "0", 10);
    if (!nombre.trim()) return setErr("Escribe el nombre del producto");
    if (isNaN(pr) || pr < 0) return setErr("Escribe el precio en dólares, por ejemplo 3,50");
    if (isNaN(st) || st < 0) return setErr("La cantidad no puede ser negativa");

    setBusy(true);
    const res = await guardarProducto(producto?.id ?? null, {
      nombre: nombre.trim(),
      categoria: categoria.trim(),
      descripcion: descripcion.trim(),
      precio_usd: Math.round(pr * 100) / 100,
      stock: st,
      unidad: unidad.trim() || "und",
      stock_min: isNaN(mn) ? 3 : mn,
      activo,
    });
    setBusy(false);
    if (res.error) return setErr(res.error);
    onClose();
  }

  async function onDelete() {
    if (!producto) return;
    setBusy(true);
    const res = await eliminarProducto(producto.id);
    setBusy(false);
    if (res.error) return setErr(res.error);
    onClose();
  }

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>{producto ? "Editar producto" : "Nuevo producto"}</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="fg" onSubmit={onSubmit}>
          <label className="f full">
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Quesillo de coco" required />
          </label>
          <label className="f">
            Categoría
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej. Postres fríos" />
          </label>
          <label className="f">
            Precio en $
            <input value={precio} onChange={(e) => setPrecio(e.target.value)} inputMode="decimal" required />
          </label>
          <label className="f">
            Cantidad disponible
            <input type="number" min={0} step={1} value={stock} onChange={(e) => setStock(e.target.value)} />
          </label>
          <label className="f">
            Unidad
            <input value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="und, porción, caja" />
          </label>
          <label className="f">
            Avisar cuando queden
            <input type="number" min={0} step={1} value={stockMin} onChange={(e) => setStockMin(e.target.value)} />
          </label>
          <label className="check" style={{ alignSelf: "end" }}>
            <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} /> Mostrar en el
            catálogo
          </label>
          <label className="f full">
            Descripción (la ven tus clientes)
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </label>
          <div className="err full">{err}</div>
          <div className="foot full">
            {producto &&
              (confirmDelete ? (
                <span style={{ marginRight: "auto" }}>
                  <button type="button" className="btn sm danger" onClick={onDelete} disabled={busy}>
                    Sí, eliminar
                  </button>
                </span>
              ) : (
                <span style={{ marginRight: "auto" }}>
                  <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>
                    Eliminar
                  </button>
                </span>
              ))}
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

function EntradaSheet({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  const [cant, setCant] = useState("1");
  const [total, setTotal] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    let nuevoStock: number;
    if (total !== "") {
      nuevoStock = parseInt(total, 10);
      if (isNaN(nuevoStock) || nuevoStock < 0) return setErr("El total debe ser 0 o más");
    } else {
      const q = parseInt(cant || "0", 10);
      if (isNaN(q) || q <= 0) return setErr("Escribe cuántas unidades entran");
      nuevoStock = producto.stock + q;
    }
    setBusy(true);
    const res = await entradaInventario(producto.id, nuevoStock);
    setBusy(false);
    if (res.error) return setErr(res.error);
    onClose();
  }

  return (
    <div className="ov" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="sh">
          <h2>Entrada de inventario</h2>
          <button className="x" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form className="fg" onSubmit={onSubmit}>
          <p className="full" style={{ margin: 0 }}>
            <b>{producto.nombre}</b> · hoy hay <b className="num">{producto.stock}</b> {producto.unidad}
          </p>
          <label className="f">
            Cantidad que entra (producción)
            <input type="number" min={1} step={1} value={cant} onChange={(e) => setCant(e.target.value)} />
          </label>
          <label className="f">
            O fija el total contado
            <input type="number" min={0} step={1} placeholder="Opcional" value={total} onChange={(e) => setTotal(e.target.value)} />
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

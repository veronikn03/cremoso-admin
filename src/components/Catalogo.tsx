"use client";

import { useState } from "react";
import { fUSD, fBs } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

export type ProductoPublico = {
  id: string;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  precio_usd: number;
  stock: number;
  stock_min: number;
};

export default function Catalogo({
  productos,
  negocio,
  whatsapp,
  tasa,
}: {
  productos: ProductoPublico[];
  negocio: string;
  whatsapp: string;
  tasa: number;
}) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [nota, setNota] = useState("");
  const [copiado, setCopiado] = useState(false);

  const disponibles = productos.filter((p) => p.stock > 0);
  const categorias = [...new Set(disponibles.map((p) => p.categoria || "Dulces"))];

  function setQty(id: string, qty: number, stock: number) {
    const q = Math.max(0, Math.min(stock, qty));
    setCart((prev) => {
      const next = { ...prev };
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
  }

  const prodById = (id: string) => productos.find((p) => p.id === id);
  const n = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Math.round(
    Object.entries(cart).reduce((a, [id, q]) => {
      const p = prodById(id);
      return a + (p ? q * p.precio_usd : 0);
    }, 0) * 100,
  ) / 100;

  function mensaje() {
    const lineas = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, q]) => {
        const p = prodById(id)!;
        return `• ${q} × ${p.nombre} (${fUSD(p.precio_usd)} c/u) = ${fUSD(q * p.precio_usd)}`;
      });
    return `Hola ${negocio}, quiero hacer este pedido:\n${lineas.join("\n")}\n\nTotal: ${fUSD(total)}${tasa ? ` (${fBs(total * tasa)})` : ""}\nNombre: ${nombre || "—"}\nTeléfono: ${telefono || "—"}${nota ? `\nNota: ${nota}` : ""}`;
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // el cliente puede seleccionar el texto manualmente
    }
  }

  if (!disponibles.length) {
    return (
      <div className="empty">
        <b>No hay dulces disponibles en este momento</b>
        Vuelve pronto.
      </div>
    );
  }

  return (
    <>
      {categorias.map((cat) => (
        <div key={cat}>
          <div className="cat-h">{cat}</div>
          <div className="cat-grid">
            {disponibles
              .filter((p) => (p.categoria || "Dulces") === cat)
              .map((p) => {
                const q = cart[p.id] || 0;
                return (
                  <div className={`prod ${q ? "on" : ""}`} key={p.id}>
                    <div className="nm">{p.nombre}</div>
                    <div className="ds">{p.descripcion}</div>
                    <div className="bar" style={{ margin: 0 }}>
                      <div className="pr">
                        {fUSD(p.precio_usd)}
                        {tasa > 0 && <small className="bs">{fBs(p.precio_usd * tasa)}</small>}
                      </div>
                      <span className="muted" style={{ fontSize: 12.5 }}>
                        {p.stock <= p.stock_min ? `¡Quedan ${p.stock}!` : `${p.stock} disponibles`}
                      </span>
                    </div>
                    <div className="step">
                      <button type="button" onClick={() => setQty(p.id, q - 1, p.stock)} aria-label="Quitar uno">
                        −
                      </button>
                      <span>{q}</span>
                      <button
                        type="button"
                        onClick={() => setQty(p.id, q + 1, p.stock)}
                        aria-label="Agregar uno"
                        disabled={q >= p.stock}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

      <div className="cartbox">
        <div className="bar" style={{ marginBottom: 10 }}>
          <div>
            <h3 style={{ margin: 0 }}>Tu pedido</h3>
            <div className="muted" style={{ fontSize: 13 }}>
              {n} {n === 1 ? "dulce" : "dulces"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <b style={{ fontSize: 22 }} className="num">
              {fUSD(total)}
            </b>
            {tasa > 0 && <small className="bs">{fBs(total * tasa)}</small>}
          </div>
        </div>
        <div className="fg">
          <label className="f">
            Tu nombre
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
          </label>
          <label className="f">
            Teléfono
            <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" />
          </label>
          <label className="f full">
            Nota (fecha de entrega, dedicatoria…)
            <input type="text" value={nota} onChange={(e) => setNota(e.target.value)} />
          </label>
        </div>
        <div className="chips" style={{ marginTop: 12 }}>
          <a
            className="btn pri"
            target="_blank"
            rel="noopener"
            href={waLink(whatsapp, mensaje())}
            aria-disabled={!n}
            onClick={(e) => !n && e.preventDefault()}
          >
            Enviar pedido por WhatsApp
          </a>
          <button className="btn" type="button" disabled={!n} onClick={copiar}>
            {copiado ? "Copiado" : "Copiar pedido"}
          </button>
        </div>
        {whatsapp ? (
          <p className="muted" style={{ fontSize: 12.5, margin: "10px 0 0" }}>
            Si WhatsApp no se abre, copia el pedido y envíalo al{" "}
            <b className="num" style={{ userSelect: "all" }}>
              {whatsapp}
            </b>
            .
          </p>
        ) : null}
      </div>
    </>
  );
}

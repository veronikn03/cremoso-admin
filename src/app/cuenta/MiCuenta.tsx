"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fUSD, fBs, fDate } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";

type Pedido = {
  numero: number;
  fecha: string;
  total_usd: number;
  entregado: boolean;
  estado: "activo" | "cancelado";
  items: string;
  pagado_usd: number;
  saldo_usd: number;
};

type Pago = {
  fecha: string;
  monto_usd: number;
  moneda: string;
  monto_original: number;
  metodo: string;
  pedido_numero: number | null;
};

type Cuenta = { nombre: string; telefono: string | null };

function chipPago(o: Pedido) {
  if (o.estado === "cancelado") return <span className="chip muted">Cancelado</span>;
  if (o.saldo_usd <= 0.009) return <span className="chip good">Pagado</span>;
  if (o.pagado_usd > 0) return <span className="chip warn">Abonado</span>;
  return <span className="chip bad">Pendiente</span>;
}

export default function MiCuenta({ negocio, whatsapp, tasa }: { negocio: string; whatsapp: string; tasa: number }) {
  const [loading, setLoading] = useState(true);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [codigo, setCodigo] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function cargarDatos() {
    const supabase = createClient();
    const [{ data: peds }, { data: pgs }] = await Promise.all([
      supabase
        .from("pedidos")
        .select("numero, fecha, total_usd, entregado, estado, pedido_items(nombre, cant), pagos(monto_usd)")
        .order("fecha", { ascending: false })
        .order("numero", { ascending: false }),
      supabase
        .from("pagos")
        .select("fecha, monto_usd, moneda, monto_original, metodo, pedidos(numero)")
        .order("fecha", { ascending: false }),
    ]);

    setPedidos(
      (peds ?? []).map((o) => {
        const pagado = Math.round(o.pagos.reduce((a: number, p: { monto_usd: number }) => a + p.monto_usd, 0) * 100) / 100;
        const saldo = o.estado === "cancelado" ? 0 : Math.max(0, Math.round((o.total_usd - pagado) * 100) / 100);
        return {
          numero: o.numero,
          fecha: o.fecha,
          total_usd: o.total_usd,
          entregado: o.entregado,
          estado: o.estado,
          items: o.pedido_items.map((i: { nombre: string; cant: number }) => `${i.cant} ${i.nombre}`).join(", "),
          pagado_usd: pagado,
          saldo_usd: saldo,
        };
      }),
    );
    setPagos(
      (pgs ?? []).map((p) => ({
        fecha: p.fecha,
        monto_usd: p.monto_usd,
        moneda: p.moneda,
        monto_original: p.monto_original,
        metodo: p.metodo,
        pedido_numero: p.pedidos?.numero ?? null,
      })),
    );
  }

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("clientes")
          .select("nombre, telefono")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        if (data) {
          setCuenta(data);
          await cargarDatos();
        }
      }
      setLoading(false);
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const norm = codigo.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (norm.length !== 10) return setErr("El código tiene 10 letras y números, por ejemplo ABCDE-23456");

    setBusy(true);
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session || !session.user.is_anonymous) {
      if (session) await supabase.auth.signOut();
      const { error: anonErr } = await supabase.auth.signInAnonymously();
      if (anonErr) {
        setBusy(false);
        return setErr("No pudimos conectar. Intenta de nuevo en un momento.");
      }
    }
    const { data, error } = await supabase.rpc("canjear_codigo", { p_code: norm });
    if (error || !data || !data.length) {
      setBusy(false);
      return setErr("No encontramos una cuenta con ese código. Revísalo o pídelo por WhatsApp.");
    }
    setCuenta({ nombre: data[0].nombre, telefono: null });
    await cargarDatos();
    setBusy(false);
  }

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCuenta(null);
    setPedidos([]);
    setPagos([]);
    setCodigo("");
  }

  if (loading) return null;

  if (!cuenta) {
    return (
      <div className="panel" style={{ maxWidth: 480 }}>
        <h2>Mi cuenta</h2>
        <p className="muted" style={{ margin: "6px 0 14px" }}>
          Escribe el código de acceso que te enviamos por WhatsApp para ver tus pedidos, tus pagos y lo que tienes
          pendiente.
        </p>
        <form className="fg" onSubmit={onSubmit}>
          <label className="f full">
            Código de acceso
            <input
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="ABCDE-23456"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </label>
          <div className="err full">{err}</div>
          <div className="full">
            <button className="btn pri" type="submit" disabled={busy}>
              Ver mi cuenta
            </button>
          </div>
        </form>
        <p className="muted" style={{ fontSize: 13, margin: "14px 0 0" }}>
          ¿No tienes código? Pídelo por WhatsApp{whatsapp ? ` al ${whatsapp}` : ""}. Es personal: no lo compartas.
        </p>
      </div>
    );
  }

  const abiertos = pedidos.filter((p) => p.estado !== "cancelado" && p.saldo_usd > 0.009);
  const porEntregar = pedidos.filter((p) => p.estado !== "cancelado" && !p.entregado);
  const saldo = Math.round(abiertos.reduce((a, p) => a + p.saldo_usd, 0) * 100) / 100;
  const pagadoTotal = Math.round(pagos.reduce((a, p) => a + p.monto_usd, 0) * 100) / 100;
  const aviso = `Hola ${negocio}, soy ${cuenta.nombre}. Quiero reportar un pago:\nMonto: \nMétodo: \nReferencia: \n\nMi saldo pendiente es ${fUSD(saldo)}${tasa ? ` (${fBs(saldo * tasa)})` : ""}.`;

  return (
    <div>
      <div className="bar">
        <div>
          <h2>Hola, {cuenta.nombre}</h2>
        </div>
        <button className="btn sm ghost" onClick={salir}>
          Salir de mi cuenta
        </button>
      </div>
      <div className="kpis k3">
        <div className={`kpi ${saldo > 0.009 ? "hot" : ""}`}>
          <div className="l">Saldo pendiente</div>
          <div className="v">{fUSD(saldo)}</div>
          <div className="s">{tasa > 0 ? `${fBs(saldo * tasa)} hoy` : ""}</div>
        </div>
        <div className="kpi">
          <div className="l">Por entregar</div>
          <div className="v">{porEntregar.length}</div>
          <div className="s">{porEntregar.length === 1 ? "pedido" : "pedidos"}</div>
        </div>
        <div className="kpi">
          <div className="l">Total pagado</div>
          <div className="v">{fUSD(pagadoTotal)}</div>
          <div className="s">
            {pagos.length} {pagos.length === 1 ? "pago" : "pagos"}
          </div>
        </div>
      </div>

      {saldo > 0.009 && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="bar" style={{ margin: 0 }}>
            <div>
              <b>¿Ya pagaste?</b>
              <div className="muted" style={{ fontSize: 13 }}>
                Avísanos con la referencia y lo registramos en tu cuenta.
              </div>
            </div>
            <a className="btn pri" target="_blank" rel="noopener" href={waLink(whatsapp, aviso)}>
              Reportar un pago
            </a>
          </div>
        </div>
      )}

      <div className="grid2">
        <section className="panel">
          <h3>Mis pedidos</h3>
          {pedidos.length ? (
            <div className="list">
              {pedidos.map((p) => (
                <div className="row" key={p.numero}>
                  <div>
                    <div className="t">
                      #{p.numero} · {fDate(p.fecha)}{" "}
                      <span className="chips">
                        {chipPago(p)}
                        {p.estado !== "cancelado" && (p.entregado ? <span className="chip muted">Entregado</span> : <span className="chip accent">Por entregar</span>)}
                      </span>
                    </div>
                    <div className="sub">{p.items}</div>
                  </div>
                  <div className="r">{fUSD(p.total_usd)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Todavía no tienes pedidos.</p>
          )}
        </section>
        <section className="panel">
          <h3>Mis pagos</h3>
          {pagos.length ? (
            <div className="list">
              {pagos.map((p, i) => (
                <div className="row" key={i}>
                  <div>
                    <div className="t">
                      {fUSD(p.monto_usd)}{" "}
                      {p.moneda === "Bs" && <span className="muted" style={{ fontWeight: 400 }}>({fBs(p.monto_original)})</span>}
                    </div>
                    <div className="sub">
                      {fDate(p.fecha)} · {p.metodo}
                      {p.pedido_numero ? ` · pedido #${p.pedido_numero}` : ""}
                    </div>
                  </div>
                  <div className="r">
                    <span className="chip good">Recibido</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">Todavía no hay pagos registrados.</p>
          )}
        </section>
      </div>
    </div>
  );
}

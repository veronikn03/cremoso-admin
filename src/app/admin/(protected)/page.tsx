import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fUSD, days } from "@/lib/format";
import { fetchPedidos } from "./pedidos/page";
import ResumenPorEntregar from "./ResumenPorEntregar";

function stockChip(stock: number, stockMin: number) {
  if (stock <= 0) return <span className="chip bad">Agotado</span>;
  if (stock <= stockMin) return <span className="chip warn">Quedan pocos</span>;
  return <span className="chip good">Disponible</span>;
}

export default async function ResumenPage() {
  const supabase = await createClient();

  const [{ data: clientesDeuda }, { data: productos }, { data: config }, pedidos] = await Promise.all([
    supabase
      .from("clientes_derivados")
      .select("id, nombre, saldo_usd, pedidos_abiertos, pedido_mas_antiguo")
      .order("saldo_usd", { ascending: false }),
    supabase.from("productos").select("id, nombre, categoria, stock, stock_min, activo"),
    supabase.from("config").select("tasa").eq("id", 1).single(),
    fetchPedidos(supabase),
  ]);

  const tasa = config?.tasa ?? 0;
  const clientes = clientesDeuda ?? [];
  const deudores = clientes.filter((c) => c.saldo_usd > 0.009);
  const porCobrar = Math.round(clientes.reduce((a, c) => a + c.saldo_usd, 0) * 100) / 100;

  const mes = new Date().toISOString().slice(0, 7);
  const mesNombre = new Date().toLocaleDateString("es-VE", { month: "long" });
  const activos = pedidos.filter((o) => o.estado !== "cancelado");
  const ventasMes = activos.filter((o) => o.fecha.startsWith(mes));
  const ventas = Math.round(ventasMes.reduce((a, o) => a + o.total_usd, 0) * 100) / 100;
  const pagosMes = pedidos.flatMap((o) => o.pagos).filter((p) => p.fecha.startsWith(mes));
  const cobrado = Math.round(pagosMes.reduce((a, p) => a + p.monto_usd, 0) * 100) / 100;
  const porEntregar = activos.filter((o) => !o.entregado);
  const conDeuda = activos.filter((o) => o.saldo_usd > 0.009);
  const pagados = activos.filter((o) => o.saldo_usd <= 0.009);
  const cancelados = pedidos.length - activos.length;

  const alerta = (productos ?? []).filter((p) => p.activo && p.stock <= p.stock_min);

  if (!(productos ?? []).length && !pedidos.length) {
    return (
      <div className="empty" style={{ textAlign: "left", padding: 24 }}>
        <b>Empecemos a organizar Cremoso Gourmet</b>
        <p>
          1. Fija la <strong>tasa del día</strong> en Ajustes para ver precios y deudas también en bolívares.
          <br />
          2. Ve a <strong>Inventario</strong> y agrega tus dulces con precio en dólares y cantidad disponible.
          <br />
          3. Registra tus <strong>Clientes</strong> y sus <strong>Pedidos</strong>. Cada pedido descuenta inventario y
          queda como cuenta por cobrar hasta que se pague.
        </p>
        <div className="chips" style={{ marginTop: 8 }}>
          <Link className="btn pri" href="/admin/inventario">
            + Agregar primer producto
          </Link>
          <Link className="btn" href="/admin/ajustes">
            Ajustes del negocio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="kpis">
        <div className="kpi hot">
          <div className="l">Por cobrar</div>
          <div className="v">{fUSD(porCobrar)}</div>
          <div className="s">{deudores.length ? `${deudores.length} cliente${deudores.length > 1 ? "s" : ""}` : "nadie debe"}</div>
        </div>
        <div className="kpi">
          <div className="l">Vendido en {mesNombre}</div>
          <div className="v">{fUSD(ventas)}</div>
          <div className="s">{ventasMes.length} pedido(s)</div>
        </div>
        <div className="kpi">
          <div className="l">Cobrado en {mesNombre}</div>
          <div className="v">{fUSD(cobrado)}</div>
          <div className="s">{pagosMes.length} pago(s)</div>
        </div>
        <div className="kpi">
          <div className="l">Por entregar</div>
          <div className="v">{porEntregar.length}</div>
          <div className="s">pedidos activos</div>
        </div>
      </div>

      <div className="grid2">
        <section className="panel">
          <div className="bar">
            <h3 style={{ margin: 0 }}>Quién te debe más</h3>
            <Link className="btn sm ghost" href="/admin/cobrar">
              Ver todo
            </Link>
          </div>
          <div className="list">
            {deudores.length ? (
              deudores.slice(0, 6).map((c) => (
                <div className="row" key={c.id}>
                  <div>
                    <div className="t">{c.nombre}</div>
                    <div className="sub">
                      {c.pedidos_abiertos} pedido{c.pedidos_abiertos > 1 ? "s" : ""} · el más viejo hace{" "}
                      {days(c.pedido_mas_antiguo)} días
                    </div>
                  </div>
                  <div className="r">{fUSD(c.saldo_usd)}</div>
                </div>
              ))
            ) : (
              <p className="muted">Nadie tiene deudas pendientes.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <div className="bar">
            <h3 style={{ margin: 0 }}>Postres agotados o por agotarse</h3>
            <Link className="btn sm ghost" href="/admin/inventario">
              Inventario
            </Link>
          </div>
          <div className="list">
            {alerta.length ? (
              alerta.map((p) => (
                <div className="row" key={p.id}>
                  <div>
                    <div className="t">{p.nombre}</div>
                    <div className="sub">{p.categoria}</div>
                  </div>
                  <div className="r">
                    {stockChip(p.stock, p.stock_min)} <span className="num">{p.stock}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">Todo el inventario tiene existencia suficiente.</p>
            )}
          </div>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 24 }}>
        <h3>Todos los pedidos</h3>
        <div className="filters">
          <Link href="/admin/pedidos?filtro=todos">
            Activos <b className="num">{activos.length}</b>
          </Link>
          <Link href="/admin/pedidos?filtro=entregar">
            Por entregar <b className="num">{porEntregar.length}</b>
          </Link>
          <Link href="/admin/pedidos?filtro=saldo">
            Con deuda <b className="num">{conDeuda.length}</b>
          </Link>
          <Link href="/admin/pedidos?filtro=todos">
            Pagados <b className="num">{pagados.length}</b>
          </Link>
          <Link href="/admin/pedidos?filtro=cancelados">
            Cancelados <b className="num">{cancelados}</b>
          </Link>
        </div>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <div className="bar">
          <h3 style={{ margin: 0 }}>Por entregar</h3>
          <Link className="btn sm pri" href="/admin/pedidos">
            + Nuevo pedido
          </Link>
        </div>
        <ResumenPorEntregar pedidos={porEntregar.slice(0, 8)} tasa={tasa} />
      </section>
    </div>
  );
}

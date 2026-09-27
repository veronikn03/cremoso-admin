import { fUSD, fBs, fTasa, fDate } from "@/lib/format";

export function waNum(tel: string | null | undefined): string {
  let d = String(tel || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = "58" + d.slice(1);
  else if (d.length === 10 && d.startsWith("4")) d = "58" + d;
  return d;
}

export function waLink(tel: string | null | undefined, text: string): string {
  const n = waNum(tel);
  const base = n ? `https://wa.me/${n}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function accesoMsg(params: {
  negocio: string;
  clienteNombre: string;
  codigo: string;
  cuentaUrl: string;
}): string {
  const { negocio, clienteNombre, codigo, cuentaUrl } = params;
  const fmtCodigo = codigo.length === 10 ? `${codigo.slice(0, 5)}-${codigo.slice(5)}` : codigo;
  return `Hola ${clienteNombre}, ya puedes hacer tus pedidos y ver tu cuenta de ${negocio} aquí:\n${cuentaUrl}\n\nEn "Mi cuenta" escribe tu código: ${fmtCodigo}\nEs personal, no lo compartas.`;
}

export function catalogoCompartirTxt(params: {
  negocio: string;
  whatsapp: string;
  tasa: number;
  productos: { nombre: string; categoria: string | null; precio_usd: number; stock: number }[];
}): string {
  const { negocio, whatsapp, tasa, productos } = params;
  const disponibles = productos.filter((p) => p.stock > 0);
  const categorias = [...new Set(disponibles.map((p) => p.categoria || "Dulces"))];
  const cuerpo = categorias
    .map((cat) => {
      const lineas = disponibles
        .filter((p) => (p.categoria || "Dulces") === cat)
        .map((p) => `• ${p.nombre}: ${fUSD(p.precio_usd)}${tasa ? ` (${fBs(p.precio_usd * tasa)})` : ""}`)
        .join("\n");
      return `\n${cat}\n${lineas}`;
    })
    .join("\n");
  return `${negocio} · Disponible hoy\n${cuerpo}\n\nHaz tu pedido respondiendo este mensaje${whatsapp ? ` o al ${whatsapp}` : ""}.`;
}

export function recordatorioTxt(params: {
  negocio: string;
  clienteNombre: string;
  pedidosConSaldo: { numero: number; fecha: string; saldo_usd: number }[];
  saldoTotal: number;
  tasa: number;
}): string {
  const { negocio, clienteNombre, pedidosConSaldo, saldoTotal, tasa } = params;
  const lineas = pedidosConSaldo
    .map((o) => `• Pedido #${o.numero} del ${fDate(o.fecha)}: ${fUSD(o.saldo_usd)}`)
    .join("\n");
  return `Hola ${clienteNombre}, te saludamos de ${negocio}. Te recordamos tu saldo pendiente:\n${lineas}\n\nTotal: ${fUSD(saldoTotal)}${tasa ? ` (${fBs(saldoTotal * tasa)} a tasa ${fTasa(tasa)})` : ""}\n¡Gracias por tu preferencia!`;
}

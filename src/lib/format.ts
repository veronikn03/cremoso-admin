export const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export const fUSD = (n: number) =>
  (n < 0 ? "-" : "") +
  "$" +
  Math.abs(Number(n) || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fBs = (n: number) =>
  "Bs " +
  (Number(n) || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const fTasa = (n: number) =>
  (Number(n) || 0).toLocaleString("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

export const fDate = (iso: string | null | undefined) =>
  iso
    ? new Date(iso + "T12:00").toLocaleDateString("es-VE", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      })
    : "";

export function today(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function days(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.max(
    0,
    Math.floor(
      (new Date(today() + "T12:00").getTime() - new Date(iso + "T12:00").getTime()) / 864e5,
    ),
  );
}

// Acepta "3,50" o "3.50" (formato venezolano o punto decimal)
export function parseNum(s: string): number {
  let str = String(s ?? "").trim().replace(/\s/g, "");
  if (!str) return 0;
  if (str.includes(".") && str.includes(",")) {
    str = str.replace(/\./g, "").replace(",", ".");
  } else {
    str = str.replace(",", ".");
  }
  const n = Number(str);
  return Number.isFinite(n) ? n : NaN;
}

export const METODOS = [
  "Efectivo $",
  "Pago móvil",
  "Transferencia Bs",
  "Zelle",
  "Binance / USDT",
  "Efectivo Bs",
  "Otro",
] as const;

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cremoso Gourmet",
  description: "Pedidos, inventario y cuentas por cobrar de Cremoso Gourmet",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

---
name: Cremoso Gourmet — Panel y Cuenta
description: Pedidos, cobranza e inventario de un negocio de postres caseros, con la misma calidez de marca que la página pública.
colors:
  caramelo-dorado: "#C07E33"
  crema: "#FBF5EA"
  superficie: "#FFFFFF"
  crema-honda: "#F3E7D4"
  chocolate-oscuro: "#25150C"
  canela-apagada: "#7C6656"
  arena-tostada: "#E9DCC7"
  caramelo-claro: "#F3E4C9"
  verde-confirmado: "#2F6E40"
  verde-confirmado-suave: "#E1EFE2"
  naranja-quemado: "#A8460B"
  naranja-quemado-suave: "#F8E4D3"
  rojo-ladrillo: "#B3261E"
  rojo-ladrillo-suave: "#F9DEDC"
typography:
  display:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.2px"
  title:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Mulish, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Mulish, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "18px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.caramelo-dorado}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.caramelo-dorado}"
    textColor: "#FFFFFF"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.caramelo-dorado}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  card:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.chocolate-oscuro}"
    rounded: "{rounded.lg}"
    padding: "16px"
  chip:
    rounded: "{rounded.pill}"
    padding: "2px 9px"
---

# Design System: Cremoso Gourmet — Panel y Cuenta

## 1. Overview

**Creative North Star: "La Dulcería del Barrio"**

Este sistema visual existe para que el panel y la cuenta de cliente se sientan como la misma dulcería que es cremosito, no como una herramienta de oficina pegada a un negocio casero. La paleta y la tipografía (caramelo dorado, crema, chocolate oscuro; Fraunces + Mulish) ya vienen de cremosito; lo que falta es la confianza visual: el logo redondo, el calor de los acentos, el detalle hecho a mano que hace que algo se sienta querido y no genérico.

El estado actual es un punto de partida correcto pero todavía tímido: tarjetas planas con borde de 1px, tipografía de marca aplicada solo a los títulos, casi ninguna decoración. El trabajo de esta fase es llevarlo más cerca de cremosito sin sacrificar la claridad que la dueña necesita para leer números y saldos de un vistazo — sobre todo en el panel admin, donde la calidez no puede estorbar la lectura rápida de cifras.

**Key Characteristics:**
- Cálido y de barrio, nunca corporativo ni frío.
- Fraunces para todo lo que es identidad y jerarquía (marca, títulos, precios destacados); Mulish para todo lo que se lee en bloque (tablas, formularios, listas).
- Plano en reposo, con una sola sombra ambiental reservada para lo que realmente flota (hojas/modales, la caja del carrito).
- El naranja quemado (alertas) y el caramelo dorado (marca/acento) deben poder distinguirse a simple vista: son primos de la misma familia cálida, no el mismo color.

## 2. Colors

La paleta es cálida de punta a punta: ni un gris neutro verdadero en todo el sistema. Los grises "neutros" llevan tinte de canela o crema.

### Primary
- **Caramelo Dorado** (#C07E33): la marca. Nombre del negocio, enlaces activos, botones primarios, precios en catálogo, bordes de foco. Se usa con moderación fuera del botón primario — es acento, no fondo.

### Neutral
- **Crema** (#FBF5EA): fondo de página. El "papel" sobre el que vive todo.
- **Superficie** (#FFFFFF): tarjetas, paneles, inputs — un paso más claro que el fondo para que las superficies se despeguen sin necesitar sombra.
- **Crema Honda** (#F3E7D4): superficie secundaria (filas alternas, botones de paso en el stepper, chips neutros).
- **Chocolate Oscuro** (#25150C): todo el texto de lectura principal.
- **Canela Apagada** (#7C6656): texto secundario, etiquetas, metadatos.
- **Arena Tostada** (#E9DCC7): todos los bordes de 1px del sistema.

### Named Rules
**La Regla de la Familia Cálida.** Verde (confirmado), naranja quemado (alerta) y rojo ladrillo (pendiente/error) son los únicos tres colores de estado. El naranja quemado existe *a propósito* para no competir con el caramelo dorado de marca: son parientes, no gemelos — si de lejos se confunden, el naranja está mal.

## 3. Typography

**Display Font:** Fraunces (con Georgia, Times New Roman de respaldo)
**Body Font:** Mulish (con system-ui, Segoe UI, Roboto de respaldo)

**Character:** Fraunces aporta el carácter artesanal — una serif con personalidad, nunca neutra — reservada para lo que es identidad de marca o una cifra que merece peso. Mulish es el caballo de trabajo: clara, cálida sin ser decorativa, hecha para leerse rápido en tablas y formularios.

### Hierarchy
- **Display** (400, 28px, line-height 1.1): nombre del negocio en el header.
- **Title** (400, 22px): títulos de sección ("Pedidos", "Mi cuenta", nombres de categoría en el catálogo).
- **Body** (400, 15px, line-height 1.45): todo el texto corrido, formularios, filas de tabla.
- **Label** (700, 12px, letter-spacing 0.1em, mayúsculas): encabezados de tabla, etiquetas de KPI, texto de chip.

### Named Rules
**La Regla de Fraunces con Propósito.** Fraunces no decora: marca exactamente tres cosas — el nombre del negocio, los títulos de sección y los montos que son el punto central de una pantalla (el total de un pedido, el saldo pendiente). Todo lo demás es Mulish, incluidos los números de tabla.

## 4. Elevation

Plano en reposo, con una sola sombra ambiental (`--shadow`) reservada exclusivamente para lo que literalmente flota sobre el contenido: hojas/modales y la caja de carrito fija. Las tarjetas en flujo normal (KPIs, paneles, filas de producto) se despegan del fondo por contraste de superficie y un borde de 1px, nunca por sombra — así una pantalla llena de tarjetas no se siente apilada ni pesada.

### Shadow Vocabulary
- **Ambiental** (`box-shadow: 0 10px 40px rgba(60,40,10,.18)`): hojas/modales (`.sheet`) y la caja de carrito pegajosa (`.cartbox`). En modo oscuro, `rgba(0,0,0,.5)`.

### Named Rules
**La Regla de lo que Flota.** Si un elemento vive en el flujo normal de la página, no lleva sombra — borde y contraste de superficie bastan. La sombra se gana solo al despegarse físicamente del documento (overlay, sheet, elemento `sticky`).

## 5. Components

### Buttons
- **Shape:** esquinas suaves (10px; variante `sm` en 8px).
- **Primary:** fondo caramelo dorado, texto blanco, sin borde visible más que su propio color.
- **Ghost:** transparente, texto caramelo dorado — para acciones secundarias dentro de una tarjeta ya cargada de información.
- **Danger:** texto rojo ladrillo con borde en rojo ladrillo suave, reservado a cancelar/eliminar.
- **Hover:** el primario aclara (`brightness(1.07)`); ghost y outline oscurecen el borde hacia canela apagada.

### Chips
- **Style:** píldora completa (999px), texto en mayúscula pequeña y negrita, fondo "suave" del color de estado con texto en el tono fuerte correspondiente (ej. fondo verde-confirmado-suave + texto verde-confirmado).
- **State:** `good` / `warn` / `bad` / `muted` / `accent` — nunca más de un chip de estado por fila además del chip de entrega.

### Cards / Containers
- **Corner Style:** 14px en paneles y KPIs, 18px en hojas/modales.
- **Background:** superficie blanca sobre fondo crema.
- **Shadow Strategy:** ninguna salvo overlays (ver Elevation).
- **Border:** 1px arena tostada en todas las tarjetas y paneles.
- **Internal Padding:** 16px est��ndar, 14px en tarjetas de producto.

### Inputs / Fields
- **Style:** fondo superficie, borde 1px arena tostada, radio 10px.
- **Focus:** contorno de 2.5px en caramelo dorado con 2px de separación (`:focus-visible`), nunca solo cambio de color de borde.

### Navigation
- **Style:** pestañas de texto (sin fondo) con línea inferior de 2.5px en caramelo dorado para la activa; Mulish en negrita, canela apagada cuando está inactiva.

### Producto (tarjeta de catálogo)
Tarjeta de postre con nombre, descripción, precio y un stepper de cantidad (−/+). Al tener unidades en el carrito, el borde cambia a caramelo dorado con un anillo interior del mismo color — el único lugar del sistema donde el borde de marca reemplaza al neutro, porque señala "esto ya es tuyo".

## 6. Do's and Don'ts

### Do:
- **Do** usar Fraunces solo donde hay identidad de marca o una cifra protagonista (nombre del negocio, títulos, el total grande de un pedido) — la Regla de Fraunces con Propósito.
- **Do** mantener el naranja quemado (#A8460B) y el caramelo dorado (#C07E33) visualmente distinguibles a simple vista; son familia, no gemelos.
- **Do** reservar la sombra ambiental para lo que literalmente flota sobre la página (sheets, cartbox); todo lo demás se despega por contraste y borde.
- **Do** priorizar que los números (saldos, precios, stock) se lean rápido en el panel admin — la calidez nunca debe hacer más lento el trabajo diario de la dueña.
- **Do** diseñar primero para el teléfono: tanto la dueña como sus clientes usan esto mayormente desde el celular.

### Don't:
- **Don't** usar el look genérico de dashboard SaaS: tarjetas de gris plano, acentos azules, "chrome" corporativo frío — es la antítesis explícita de esta marca.
- **Don't** usar `border-left` ni `border-right` de color como franja decorativa en tarjetas o filas.
- **Don't** usar texto con gradiente (`background-clip: text`); el énfasis se logra con peso o tamaño, nunca con degradado.
- **Don't** agregar sombra a tarjetas en flujo normal — rompe la Regla de lo que Flota y hace que la pantalla se vea apilada.
- **Don't** hacer el sistema infantil ni demasiado decorativo — "casero" no es "caricatura"; la calidez convive con que esto maneja dinero real.

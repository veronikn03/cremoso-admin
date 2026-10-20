# Product

## Register

brand

## Users

Two user groups, both non-technical:

- **The owner (Verónica)**, running Cremoso Gourmet solo from Caracas, Venezuela. Uses the admin panel (resumen, pedidos, por cobrar, inventario, clientes, ajustes) daily on both desktop and phone to register orders, track payments, and manage stock between baking sessions.
- **Her customers**, mostly ordering by WhatsApp already familiar with her marketing site (cremosito). They visit the public catalog (`/`) to see what's available today and `/cuenta` to check their own balance and order history with a personal access code — no account creation required.

## Product Purpose

An internal order/inventory/accounts-receivable tool for a one-woman artisanal dessert business, paired with a lightweight public storefront and self-serve account lookup for her customers. It exists so she can stop tracking orders and debts in her head or on paper, and so customers get a polished, branded experience instead of a generic admin tool bolted onto her business. Success looks like: she trusts the numbers enough to run the business on it daily, and customers feel like `/` and `/cuenta` are obviously part of the same business as cremosito, not a disconnected "backend."

## Brand Personality

Warm, artisanal, homemade — "el postre más sabroso y cremoso," made by hand, neighborhood-close, not corporate. The same personality cremosito already carries (caramelo dorado, crema, chocolate oscuro; Fraunces + Mulish) should run through this app too, including the admin panel, not just the customer-facing pages.

## Anti-references

Generic SaaS admin-template look (flat gray dashboards, default shadcn/Tailwind-starter aesthetic, blue-on-white enterprise chrome). Nothing cold, corporate, or childish. The owner trusts the designer's judgment here rather than naming specific anti-references.

## Design Principles

1. **One brand, one business.** A customer or the owner should never feel like they've left cremosito and landed in "some developer's tool." Visual richness (color, type, warmth) carries through the admin panel too, not just the public pages.
2. **Warmth never costs clarity.** The owner runs her real finances through pedidos/cobrar/inventario. Elevating the visual design must not make numbers, totals, or stock levels harder to scan at a glance — this is a working tool first, a beautiful one second.
3. **Show, don't template.** Avoid the reflexive "admin dashboard" and "SaaS landing" visual defaults. Earn every visual choice from the artisanal, handmade, Caracas-neighborhood personality instead of a generic category reflex.
4. **Phone-first for everyone.** The owner checks orders between baking batches on her phone; customers order and check their account on their phones. Desktop is secondary for both audiences.

## Accessibility & Inclusion

No stated formal requirement. Default to solid baseline practice: WCAG AA color contrast (important since the owner is scanning money/stock numbers quickly), respect `prefers-reduced-motion`, and keep tap targets comfortable for one-handed phone use. Flag to the owner if a specific bolder color choice would compromise contrast rather than silently picking a less saturated one.

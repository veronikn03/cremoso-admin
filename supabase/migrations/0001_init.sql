-- Cremoso Gourmet — esquema inicial
-- Extensiones necesarias
create extension if not exists pgcrypto;

-- ============================================================
-- TABLAS
-- ============================================================

create table if not exists config (
  id smallint primary key default 1 check (id = 1),
  negocio text not null default 'Cremoso Gourmet',
  tasa numeric(12,4) not null default 0,
  whatsapp text,
  actualizado timestamptz not null default now()
);
insert into config (id) values (1) on conflict (id) do nothing;

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  descripcion text,
  precio_usd numeric(10,2) not null check (precio_usd >= 0),
  stock integer not null default 0 check (stock >= 0),
  unidad text not null default 'und',
  stock_min integer not null default 3 check (stock_min >= 0),
  activo boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  notas text,
  codigo_hash text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create sequence if not exists pedidos_numero_seq start 1;

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique default nextval('pedidos_numero_seq'),
  cliente_id uuid not null references clientes(id),
  fecha date not null default current_date,
  total_usd numeric(10,2) not null check (total_usd >= 0),
  tasa_bs numeric(12,4) not null default 0,
  entregado boolean not null default false,
  fecha_entrega date,
  estado text not null default 'activo' check (estado in ('activo','cancelado')),
  notas text,
  creado timestamptz not null default now()
);

create table if not exists pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id) on delete cascade,
  producto_id uuid references productos(id) on delete set null,
  nombre text not null,
  cant integer not null check (cant > 0),
  precio_usd numeric(10,2) not null check (precio_usd >= 0)
);

create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references pedidos(id),
  cliente_id uuid not null references clientes(id),
  fecha date not null default current_date,
  monto_usd numeric(10,2) not null check (monto_usd > 0),
  moneda text not null check (moneda in ('USD','Bs')),
  monto_original numeric(12,2) not null,
  tasa_bs numeric(12,4) not null default 0,
  metodo text not null check (metodo in
    ('Efectivo $','Pago móvil','Transferencia Bs','Zelle','Binance / USDT','Efectivo Bs','Otro')),
  referencia text,
  creado timestamptz not null default now()
);

-- ============================================================
-- VISTAS DERIVADAS (saldo, estado de pago, totales)
-- ============================================================

create or replace view pedidos_derivados with (security_invoker = true) as
select p.*,
  coalesce(pg.pagado, 0) as pagado_usd,
  case when p.estado = 'cancelado' then 0
       else greatest(0, p.total_usd - coalesce(pg.pagado,0)) end as saldo_usd
from pedidos p
left join (select pedido_id, round(sum(monto_usd),2) as pagado from pagos group by pedido_id) pg
  on pg.pedido_id = p.id;

create or replace view clientes_derivados with (security_invoker = true) as
select c.*,
  coalesce(x.saldo,0) as saldo_usd,
  coalesce(x.abiertos,0) as pedidos_abiertos,
  coalesce(x.n,0) as num_pedidos,
  coalesce(x.compras,0) as total_comprado,
  x.oldest as pedido_mas_antiguo
from clientes c
left join (
  select cliente_id,
    sum(saldo_usd) filter (where saldo_usd > 0.009) as saldo,
    count(*) filter (where saldo_usd > 0.009) as abiertos,
    count(*) as n,
    sum(total_usd) as compras,
    min(fecha) filter (where saldo_usd > 0.009) as oldest
  from pedidos_derivados where estado <> 'cancelado'
  group by cliente_id
) x on x.cliente_id = c.id;

-- ============================================================
-- FUNCIONES AUXILIARES
-- ============================================================

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins a where a.user_id = auth.uid());
$$;

create or replace function mi_cliente_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from clientes where auth_user_id = auth.uid();
$$;

-- Genera un código de 10 caracteres (mismo alfabeto que el prototipo, sin 0/O/1/I/L para evitar confusión)
create or replace function generar_codigo() returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..10 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end $$;

-- El cliente canjea su código: valida contra el hash guardado y vincula su sesión (anónima o no) a esa fila de cliente.
create or replace function canjear_codigo(p_code text)
returns table(cliente_id uuid, nombre text)
language plpgsql security definer set search_path = public as $$
declare v_cliente clientes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'auth requerida';
  end if;

  select * into v_cliente from clientes
    where codigo_hash is not null
      and codigo_hash = crypt(upper(regexp_replace(p_code, '[^A-Za-z0-9]', '', 'g')), codigo_hash)
    limit 1;

  if not found then
    return;
  end if;

  -- Libera cualquier otra fila que esta sesión tuviera vinculada antes (evita duplicados)
  update clientes set auth_user_id = null where auth_user_id = auth.uid() and id <> v_cliente.id;
  update clientes set auth_user_id = auth.uid() where id = v_cliente.id;

  return query select v_cliente.id, v_cliente.nombre;
end $$;

-- Solo la dueña: genera (o cambia) el código de un cliente. Devuelve el código en texto plano UNA vez para enviarlo por WhatsApp.
create or replace function regenerar_codigo(p_cliente_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not is_admin() then
    raise exception 'solo la administradora puede hacer esto';
  end if;

  v_code := generar_codigo();
  update clientes
    set codigo_hash = crypt(v_code, gen_salt('bf')), auth_user_id = null, actualizado = now()
    where id = p_cliente_id;

  return v_code;
end $$;

-- Crea un pedido completo (líneas + descuento de inventario) de forma atómica. Solo la dueña.
create or replace function crear_pedido(
  p_cliente_id uuid,
  p_fecha date,
  p_items jsonb, -- [{"producto_id": "...", "cant": 2}, ...]
  p_notas text default null,
  p_entregado boolean default false
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_pedido_id uuid;
  v_total numeric(10,2) := 0;
  v_tasa numeric(12,4);
  v_agg record;
  v_producto productos%rowtype;
begin
  if not is_admin() then
    raise exception 'solo la administradora puede registrar pedidos';
  end if;

  select tasa into v_tasa from config where id = 1;
  v_pedido_id := gen_random_uuid();

  -- Agrupa por producto (si el mismo postre aparece en varias líneas, se suman antes de validar)
  for v_agg in
    select (item->>'producto_id')::uuid as producto_id, sum((item->>'cant')::int) as cant
    from jsonb_array_elements(p_items) as item
    group by (item->>'producto_id')::uuid
  loop
    if v_agg.cant <= 0 then
      raise exception 'las cantidades deben ser mayores que 0';
    end if;

    -- Bloquea la fila del producto para evitar sobreventa concurrente
    select * into v_producto from productos where id = v_agg.producto_id for update;
    if not found then
      raise exception 'producto no encontrado';
    end if;
    if v_producto.stock < v_agg.cant then
      raise exception 'solo quedan % de %', v_producto.stock, v_producto.nombre;
    end if;

    v_total := v_total + (v_agg.cant * v_producto.precio_usd);
  end loop;

  insert into pedidos (id, cliente_id, fecha, total_usd, tasa_bs, entregado, notas)
    values (v_pedido_id, p_cliente_id, p_fecha, v_total, coalesce(v_tasa,0), p_entregado, p_notas);

  for v_agg in
    select (item->>'producto_id')::uuid as producto_id, sum((item->>'cant')::int) as cant
    from jsonb_array_elements(p_items) as item
    group by (item->>'producto_id')::uuid
  loop
    select * into v_producto from productos where id = v_agg.producto_id;
    insert into pedido_items (pedido_id, producto_id, nombre, cant, precio_usd)
      values (v_pedido_id, v_producto.id, v_producto.nombre, v_agg.cant, v_producto.precio_usd);
    update productos set stock = stock - v_agg.cant, actualizado = now() where id = v_producto.id;
  end loop;

  return v_pedido_id;
end $$;

-- Cancela un pedido (solo si no tiene pagos) y devuelve las unidades al inventario. Solo la dueña.
create or replace function cancelar_pedido(p_pedido_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_pagado numeric;
begin
  if not is_admin() then
    raise exception 'solo la administradora puede cancelar pedidos';
  end if;

  select coalesce(sum(monto_usd),0) into v_pagado from pagos where pedido_id = p_pedido_id;
  if v_pagado > 0 then
    raise exception 'este pedido tiene pagos; elimínalos primero';
  end if;

  update productos p set stock = p.stock + i.cant, actualizado = now()
    from pedido_items i where i.pedido_id = p_pedido_id and i.producto_id = p.id;

  update pedidos set estado = 'cancelado' where id = p_pedido_id;
end $$;

-- Registra un pago sobre UN pedido específico. Solo la dueña.
create or replace function registrar_pago(
  p_pedido_id uuid, p_monto_original numeric, p_moneda text, p_metodo text,
  p_referencia text default null, p_fecha date default current_date
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_tasa numeric(12,4);
  v_monto_usd numeric(10,2);
  v_saldo numeric(10,2);
  v_cliente_id uuid;
  v_pago_id uuid;
begin
  if not is_admin() then
    raise exception 'solo la administradora puede registrar pagos';
  end if;

  select tasa into v_tasa from config where id = 1;
  select saldo_usd, cliente_id into v_saldo, v_cliente_id from pedidos_derivados where id = p_pedido_id;

  if p_moneda = 'Bs' then
    if coalesce(v_tasa,0) <= 0 then
      raise exception 'fija la tasa del día antes de registrar pagos en bolívares';
    end if;
    v_monto_usd := round(p_monto_original / v_tasa, 2);
  else
    v_monto_usd := round(p_monto_original, 2);
  end if;

  if v_monto_usd > v_saldo + 0.01 then
    raise exception 'el pago supera el saldo de %', v_saldo;
  end if;
  v_monto_usd := least(v_monto_usd, v_saldo);

  v_pago_id := gen_random_uuid();
  insert into pagos (id, pedido_id, cliente_id, fecha, monto_usd, moneda, monto_original, tasa_bs, metodo, referencia)
    values (v_pago_id, p_pedido_id, v_cliente_id, p_fecha, v_monto_usd, p_moneda, p_monto_original, coalesce(v_tasa,0), p_metodo, p_referencia);

  return v_pago_id;
end $$;

-- Registra un pago a la cuenta de un cliente, repartido entre sus pedidos con deuda del más antiguo al más reciente. Solo la dueña.
create or replace function registrar_pago_cuenta(
  p_cliente_id uuid, p_monto_original numeric, p_moneda text, p_metodo text,
  p_referencia text default null, p_fecha date default current_date
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_tasa numeric(12,4);
  v_monto_usd numeric(10,2);
  v_restante numeric(10,2);
  v_saldo_total numeric(10,2);
  v_pedido record;
  v_aplicado numeric(10,2);
begin
  if not is_admin() then
    raise exception 'solo la administradora puede registrar pagos';
  end if;

  select tasa into v_tasa from config where id = 1;
  select coalesce(saldo_usd,0) into v_saldo_total from clientes_derivados where id = p_cliente_id;

  if p_moneda = 'Bs' then
    if coalesce(v_tasa,0) <= 0 then
      raise exception 'fija la tasa del día antes de registrar pagos en bolívares';
    end if;
    v_monto_usd := round(p_monto_original / v_tasa, 2);
  else
    v_monto_usd := round(p_monto_original, 2);
  end if;

  if v_monto_usd > v_saldo_total + 0.01 then
    raise exception 'el pago supera el saldo total de %', v_saldo_total;
  end if;
  v_restante := least(v_monto_usd, v_saldo_total);

  for v_pedido in
    select id, saldo_usd from pedidos_derivados
    where cliente_id = p_cliente_id and saldo_usd > 0.009
    order by fecha asc, numero asc
  loop
    exit when v_restante <= 0.004;
    v_aplicado := least(v_restante, v_pedido.saldo_usd);
    insert into pagos (pedido_id, cliente_id, fecha, monto_usd, moneda, monto_original, tasa_bs, metodo, referencia)
      values (v_pedido.id, p_cliente_id, p_fecha, v_aplicado,
              p_moneda, case when p_moneda = 'Bs' then round(v_aplicado * v_tasa, 2) else v_aplicado end,
              coalesce(v_tasa,0), p_metodo, p_referencia);
    v_restante := round(v_restante - v_aplicado, 2);
  end loop;
end $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table config enable row level security;
alter table admins enable row level security;
alter table productos enable row level security;
alter table clientes enable row level security;
alter table pedidos enable row level security;
alter table pedido_items enable row level security;
alter table pagos enable row level security;

-- config: todos leen, solo admin escribe
create policy config_select on config for select using (true);
create policy config_write on config for all using (is_admin()) with check (is_admin());

-- admins: solo admin lee/gestiona (se gestiona manualmente por SQL de todas formas)
create policy admins_select on admins for select using (is_admin());

-- productos: catálogo disponible para todos; admin ve y edita todo
create policy productos_select on productos for select
  using (is_admin() or (activo = true and stock > 0));
create policy productos_write on productos for all using (is_admin()) with check (is_admin());

-- clientes: admin ve todo; cada cliente ve solo su propia fila. Escritura directa: solo admin
-- (canjear_codigo/regenerar_codigo son SECURITY DEFINER y no pasan por estas reglas).
create policy clientes_select on clientes for select
  using (is_admin() or id = mi_cliente_id());
create policy clientes_write on clientes for all using (is_admin()) with check (is_admin());

-- pedidos: admin ve todo; cliente ve solo los suyos. Toda escritura pasa por las funciones de arriba.
create policy pedidos_select on pedidos for select
  using (is_admin() or cliente_id = mi_cliente_id());
create policy pedidos_write on pedidos for all using (is_admin()) with check (is_admin());

create policy pedido_items_select on pedido_items for select
  using (is_admin() or pedido_id in (select id from pedidos where cliente_id = mi_cliente_id()));
create policy pedido_items_write on pedido_items for all using (is_admin()) with check (is_admin());

create policy pagos_select on pagos for select
  using (is_admin() or cliente_id = mi_cliente_id());
create policy pagos_write on pagos for all using (is_admin()) with check (is_admin());

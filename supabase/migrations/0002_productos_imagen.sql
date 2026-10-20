-- Agrega la foto del producto al catálogo (coherencia visual con cremosito)
alter table productos add column if not exists imagen_url text;

-- Carga las fotos reales ya usadas en cremosito para el catálogo inicial
update productos set imagen_url = '/images/productos/quesillo.jpg' where nombre = 'Quesillo';
update productos set imagen_url = '/images/productos/marquesa-chocolate.jpg' where nombre = 'Marquesa de chocolate';
update productos set imagen_url = '/images/productos/marquesa-arequipe.jpg' where nombre = 'Marquesa de arequipe';
update productos set imagen_url = '/images/productos/marquesa-limon.jpg' where nombre = 'Marquesa de limón';
update productos set imagen_url = '/images/productos/marquesa-parchita.jpg' where nombre = 'Marquesa de parchita';
update productos set imagen_url = '/images/productos/tres-leches.jpg' where nombre = 'Tres leches';
update productos set imagen_url = '/images/productos/gelatina.jpg' where nombre = 'Gelatina';

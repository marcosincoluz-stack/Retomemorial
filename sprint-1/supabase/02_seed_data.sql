-- ============================================
-- Sprint 1: Seed de datos — Insertar todos los atletas actuales
-- Ejecutar DESPUÉS de 01_create_tables.sql
-- ============================================

-- ========================================
-- Disco Masculino
-- ========================================
insert into athletes (id, event_slug, gender, name, mark, image_url) values
  ('dm1', 'disco', 'male', 'Marcos Moreno', 61.15, '/marcosmoreno.jpg'),
  ('dm2', 'disco', 'male', 'Yasiel Sotero', 64.53, '/yasielsotero.jpg'),
  ('dm3', 'disco', 'male', 'Bruno Cagigos', 50.87, '/brunocagigos.jpg'),
  ('dm4', 'disco', 'male', 'Mykahilo Brudin', 61.33, '/brudin.jpg'),
  ('dm5', 'disco', 'male', 'Miguel Capdepont', 53.61, '/capdepont.jpg'),
  ('dm6', 'disco', 'male', 'Diego Casas', 62.10, 'https://images.unsplash.com/photo-1544033527-b192daee1f5b?q=80&w=400&auto=format&fit=crop')
on conflict (id) do nothing;

-- ========================================
-- Disco Femenino
-- ========================================
insert into athletes (id, event_slug, gender, name, mark, image_url) values
  ('df1', 'disco', 'female', 'Nneka Naomey Ezenwa', 55.49, '/naomeyezenwa.jpg'),
  ('df2', 'disco', 'female', 'Natalia Sainz', 53.96, '/nataliasainz.jpg'),
  ('df3', 'disco', 'female', 'Ines Alais Tellene', 44.71, '/inestellene.jpg'),
  ('df4', 'disco', 'female', 'Raquel Villa', 42.94, '/raquelvilla.jpg'),
  ('df5', 'disco', 'female', 'Angela Ferreira', 40.00, '/angelaferreira.jpg'),
  ('df6', 'disco', 'female', 'June Kintana', 56.20, 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=400&auto=format&fit=crop')
on conflict (id) do nothing;

-- ========================================
-- Jabalina Masculino
-- ========================================
insert into athletes (id, event_slug, gender, name, mark, image_url) values
  ('jm1', 'jabalina', 'male', 'Nicolás Quijera', 80.21, '/nicoquijera.jpg'),
  ('jm2', 'jabalina', 'male', 'Jorge Franco', 76.98, '/jorgefranco.jpg'),
  ('jm3', 'jabalina', 'male', 'Rodrigo Iglesias', 72.97, '/rodrigoiglesias.jpg'),
  ('jm4', 'jabalina', 'male', 'David Agudo', 66.45, '/davidagudo.jpg'),
  ('jm5', 'jabalina', 'male', 'Hailu Estrampes', 71.43, '/hailuestrampes.jpg'),
  ('jm6', 'jabalina', 'male', 'Manu Quijera', 79.50, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400&auto=format&fit=crop')
on conflict (id) do nothing;

-- ========================================
-- Jabalina Femenino
-- ========================================
insert into athletes (id, event_slug, gender, name, mark, image_url) values
  ('jf1', 'jabalina', 'female', 'Haruka Kitaguchi', 67.38, 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=400&auto=format&fit=crop'),
  ('jf2', 'jabalina', 'female', 'Kelsey-Lee Barber', 66.91, 'https://images.unsplash.com/photo-1502014822147-1aed8061dfc8?q=80&w=400&auto=format&fit=crop'),
  ('jf3', 'jabalina', 'female', 'Mackenzie Little', 65.70, 'https://images.unsplash.com/photo-1628779238951-3013b5bf5a45?q=80&w=400&auto=format&fit=crop'),
  ('jf4', 'jabalina', 'female', 'Kara Winger', 68.11, 'https://images.unsplash.com/photo-1566895291253-fa587530db9c?q=80&w=400&auto=format&fit=crop'),
  ('jf5', 'jabalina', 'female', 'Lina Muze', 64.78, 'https://images.unsplash.com/photo-1606041011872-596597976b25?q=80&w=400&auto=format&fit=crop'),
  ('jf6', 'jabalina', 'female', 'Arantza Moreno', 59.15, 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=400&auto=format&fit=crop')
on conflict (id) do nothing;

-- ========================================
-- Longitud Masculino
-- ========================================
insert into athletes (id, event_slug, gender, name, mark, image_url) values
  ('lm1', 'longitud', 'male', 'Miltiadis Tentoglou', 8.52, 'https://images.unsplash.com/photo-1552674605-46d526d25246?q=80&w=400&auto=format&fit=crop'),
  ('lm2', 'longitud', 'male', 'Wayne Pinnock', 8.50, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400&auto=format&fit=crop'),
  ('lm3', 'longitud', 'male', 'Wang Jianan', 8.36, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=400&auto=format&fit=crop'),
  ('lm4', 'longitud', 'male', 'Simon Ehammer', 8.45, 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop'),
  ('lm5', 'longitud', 'male', 'Carey McLeod', 8.40, 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?q=80&w=400&auto=format&fit=crop')
on conflict (id) do nothing;

-- ========================================
-- Longitud Femenino
-- ========================================
insert into athletes (id, event_slug, gender, name, mark, image_url) values
  ('lf1', 'longitud', 'female', 'Ivana Vuleta', 7.06, 'https://images.unsplash.com/photo-1594882645126-14020914d58d?q=80&w=400&auto=format&fit=crop'),
  ('lf2', 'longitud', 'female', 'Malaika Mihambo', 7.12, 'https://images.unsplash.com/photo-1566895291253-fa587530db9c?q=80&w=400&auto=format&fit=crop'),
  ('lf3', 'longitud', 'female', 'Ese Brume', 7.02, 'https://images.unsplash.com/photo-1502014822147-1aed8061dfc8?q=80&w=400&auto=format&fit=crop'),
  ('lf4', 'longitud', 'female', 'Quanesha Burks', 6.98, 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?q=80&w=400&auto=format&fit=crop'),
  ('lf5', 'longitud', 'female', 'Brooke Buschkuehl', 7.13, 'https://images.unsplash.com/photo-1535131749050-aac1f124c655?q=80&w=400&auto=format&fit=crop')
on conflict (id) do nothing;

-- ========================================
-- Bios de atletas (solo los que tenían bio en el código original)
-- ========================================
update athletes set bio = 'Discóbolo riojano de La Rioja Atletismo. En marzo de 2025 fue bronce absoluto de España con 61,15 m y oro sub-23 en el Nacional de Lanzamientos de Invierno. También compitió internacionalmente en categorías sub-20 y sub-23.' where id = 'dm1';
update athletes set bio = 'Especialista hispano-cubano del Tenerife CajaCanaria. Campeón de España absoluto de disco en 2021, 2023 y 2025; en 2025 ganó con 64,53 m y récord del campeonato. Fue oro europeo sub-18 y sub-20, y doble bronce europeo sub-23.' where id = 'dm2';
update athletes set bio = 'Discóbolo universitario (UC3M) en progresión dentro del circuito nacional. Figura en el Campeonato de España Universitario 2024 en disco (2 kg), compitiendo en categoría masculina.' where id = 'dm3';
update athletes set bio = 'Lanzador ucraniano afincado en Logroño, habitual en competiciones nacionales con Atletismo Numantino. En 2025 fue subcampeón sub-23 en el Nacional de Invierno (54,68 m) y 4.º en el Europeo sub-23 con 59,85 m.' where id = 'dm4';
update athletes set bio = 'Atleta del Trops-Cueva de Nerja especializado en disco. Fue campeón de España sub-20 en 2025 (49,76 m) y posteriormente campeón de España sub-23 (53,61 m), además de entrar en la preselección española sub-23 para la Copa de Europa de Lanzamientos 2026.' where id = 'dm5';

-- ========================================
-- Highlights de atletas
-- ========================================
insert into athlete_highlights (athlete_id, tier, label, sort_order) values
  ('dm1', 'gold', 'Oro sub-23 en invierno (2025)', 0),
  ('dm1', 'bronze', 'Bronce de España absoluto (2025)', 1),
  ('dm1', 'silver', 'Marca destacada: 61,15 m', 2),
  ('dm2', 'gold', 'Campeón de España absoluto (2021, 2023, 2025)', 0),
  ('dm2', 'silver', 'Récord de campeonato: 64,53 m (2025)', 1),
  ('dm2', 'bronze', 'Doble bronce europeo sub-23', 2),
  ('dm3', 'gold', 'Participación en CEU 2024 (disco 2 kg)', 0),
  ('dm3', 'silver', 'Proyección dentro del circuito nacional', 1),
  ('dm3', 'bronze', 'Perfil universitario competitivo', 2),
  ('dm4', 'gold', '4.º en Europeo sub-23 (2025)', 0),
  ('dm4', 'silver', 'Subcampeón de España sub-23 (2025)', 1),
  ('dm4', 'silver', 'Plata nacional de invierno (54,68 m)', 2),
  ('dm5', 'gold', 'Campeón de España sub-23 (2025)', 0),
  ('dm5', 'silver', 'Campeón de España sub-20 (2025)', 1),
  ('dm5', 'bronze', 'Preselección Copa de Europa 2026', 2);
# Sprint 1 — Infraestructura + Refactor de Atletas a Supabase

## Resumen

Mover los datos de atletas de `data.ts` hardcodeado a Supabase, manteniendo la app funcionando igual que antes con fallback local.

---

## Paso 1: Crear tablas y políticas en Supabase

Ir a **Supabase Dashboard → SQL Editor** y ejecutar el archivo:

- `supabase/01_create_tables.sql`

Esto crea:
- Tabla `athletes` (id, event_slug, gender, name, mark, image_url, bio)
- Tabla `athlete_highlights` (id, athlete_id, tier, label, sort_order)
- Tabla `event_results` (para Sprint 3)
- Tabla `participation_scores` (para Sprint 3)
- Bucket de Storage `athlete-images`
- Políticas RLS (lectura pública, escritura solo service_role)
- Triggers de updated_at

---

## Paso 2: Seed de datos

En el mismo SQL Editor, ejecutar:

- `supabase/02_seed_data.sql`

Esto inserta:
- Los 29 atletas actuales con sus datos (nombre, marca, imagen)
- Las 5 bios de los atletas de disco masculino
- Los 15 highlights de dm1-dm5

---

## Paso 3: Verificar en Supabase

- Ir a **Table Editor** y comprobar que `athletes` tiene 29 filas y `athlete_highlights` tiene 15 filas
- Ir a **Storage** y comprobar que existe el bucket `athlete-images`
- Probar una query: `SELECT * FROM athletes WHERE event_slug = 'disco' AND gender = 'male';`

---

## Paso 4: Código TypeScript

Los cambios de código están en `src/` y se hacen sobre los archivos existentes del proyecto. Los archivos modificados son:

- `src/lib/data.ts` — Tipos nuevos + funciones de lectura de DB
- `src/lib/supabase.ts` — No cambia (ya tiene getSupabaseServiceClient)
- `src/app/actions.ts` — Añadir getAthletesData() y getAthletesWithMeta()
- `src/app/admin/actions.ts` — Añadir getAthletesForAdmin()
- `src/app/page.tsx` — Cargar atletas de DB con fallback
- `src/app/event/[slug]/page.tsx` — Cargar atletas+bios de DB con fallback
- `src/app/confirmation/[ref]/page.tsx` — Cargar atletas de DB con fallback
- `src/app/admin/page.tsx` — Usar datos de DB para ATHLETE_LOOKUP

---

## Criterios de aceptación

1. La app funciona exactamente igual que antes
2. Con Supabase configurado: los atletas se leen de la tabla `athletes`
3. Sin Supabase o si la DBfalla: se usa ATHLETES local como fallback
4. Las apuestas existentes siguen funcionando (IDs de atletas no cambian)
5. El admin sigue funcionando con los mismos datos
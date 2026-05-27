# Verificación tras ejecutar los SQL

## Comprobar en Supabase Dashboard

### Table Editor
- [ ] `athletes` tiene **29 filas** (6 disco M + 6 disco F + 6 jabalina M + 6 jabalina F + 5 longitud M + 5 longitud F - 5 = 29... Wait)

  Desglose:
  - Disco masculino: dm1-dm6 = 6
  - Disco femenino: df1-df6 = 6
  - Jabalina masculino: jm1-jm6 = 6
  - Jabalina femenino: jf1-jf6 = 6
  - Longitud masculino: lm1-lm5 = 5
  - Longitud femenino: lf1-lf5 = 5
  
  **Total: 34 atletas**

- [ ] `athlete_highlights` tiene **15 filas** (3 por cada atleta con bio: dm1, dm2, dm3, dm4, dm5)
- [ ] `event_results` existe (vacía)
- [ ] `participation_scores` existe (vacía)

### Storage
- [ ] El bucket `athlete-images` existe y es público

### SQL de prueba
Ejecutar en SQL Editor:

```sql
-- Verificar atletas de disco masculino
SELECT id, name, mark, image_url FROM athletes WHERE event_slug = 'disco' AND gender = 'male' ORDER BY mark DESC;

-- Verificar bios
SELECT id, name, bio FROM athletes WHERE bio != '' ORDER BY id;

-- Verificar highlights
SELECT ah.athlete_id, a.name, ah.tier, ah.label 
FROM athlete_highlights ah 
JOIN athletes a ON a.id = ah.athlete_id 
ORDER BY ah.athlete_id, ah.sort_order;

-- Contar total de atletas
SELECT event_slug, gender, count(*) FROM athletes GROUP BY event_slug, gender ORDER BY event_slug, gender;
```

### Resultado esperado de la query de conteo:

| event_slug | gender | count |
|---|---|---|
| disco | female | 6 |
| disco | male | 6 |
| jabalina | female | 6 |
| jabalina | male | 6 |
| longitud | female | 5 |
| longitud | male | 5 |
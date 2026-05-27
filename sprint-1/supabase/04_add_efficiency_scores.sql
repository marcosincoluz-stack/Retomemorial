-- ============================================
-- Sprint: Puntuacion por eficiencia
-- Añade inversion total y eficiencia a participation_scores
-- ============================================

alter table public.participation_scores
  add column if not exists total_invested numeric not null default 0,
  add column if not exists efficiency numeric not null default 0;

update public.participation_scores
set
  total_invested = coalesce(total_invested, 0),
  efficiency = coalesce(efficiency, 0);

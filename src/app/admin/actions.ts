"use server";

import { cookies } from "next/headers";
import { createHmac } from "crypto";
import { type SupabaseClient, type User } from "@supabase/supabase-js";
import { ATHLETES, EVENTS, type AthletesByEvent, type AthleteHighlightData, type Athlete } from "@/lib/data";
import { calculateEventScores, calculateParticipationScore, type AthleteScore } from "@/lib/scoring";
import {
  fetchAthletesFromDB,
  rowsToAthletesByEvent,
  getSupabaseServiceClient,
  getSupabaseAnonClient,
  isSupabaseConfigured,
  isSupabasePublicConfigured,
} from "@/lib/supabase";

type ParticipationRow = {
  id: string;
  reference: string;
  delivered: boolean;
  selected_slots_count: number;
  created_at: string;
};

type PickRow = {
  participation_id: string;
  event_slug: string;
  male_external_key: string | null;
  female_external_key: string | null;
  winner_external_key: string | null;
};

type AthleteMeta = {
  id: string;
  name: string;
  image: string;
  eventName: string;
  gender: "M" | "F";
};

type AuthResponse = {
  ok: boolean;
  message?: string;
  unauthorized?: boolean;
};

export type ResetPreview = {
  participations: number;
  picks: number;
  locks: number;
  results: number;
  scores: number;
};

type ResetPreviewResponse = {
  ok: boolean;
  unauthorized?: boolean;
  message?: string;
  data?: ResetPreview;
};

type ResetCompetitionResponse = {
  ok: boolean;
  unauthorized?: boolean;
  message?: string;
  deleted?: {
    participations: number;
    results: number;
    scores: number;
  };
  executedAt?: string;
};

export type AdminOverview = {
  totalApuestas: number;
  totalEntregadas: number;
  totalPendientes: number;
  apuestasHoy: number;
  huecosSeleccionados: number;
};

export type AdminEventFavoriteAthlete = {
  athleteId: string;
  name: string;
  image: string;
  gender: "M" | "F";
  votos: number;
  porcentaje: number;
};

export type AdminEventFavorite = {
  eventSlug: string;
  eventName: string;
  totalVotos: number;
  athletes: AdminEventFavoriteAthlete[];
};

export type AdminEventStat = {
  eventSlug: string;
  eventName: string;
  ticketsConSeleccion: number;
  seleccionesMasculinas: number;
  seleccionesFemeninas: number;
  seleccionesGanador: number;
};

export type AdminRecentBet = {
  reference: string;
  delivered: boolean;
  selectedSlotsCount: number;
  createdAt: string;
};

export type AdminBetDetail = {
  reference: string;
  delivered: boolean;
  createdAt: string;
  selectedSlotsCount: number;
  selections: Record<string, { maleId: string | null; femaleId: string | null; winnerId: string | null }>;
  athletes: AthleteMeta[];
};

export type AdminDashboard = {
  overview: AdminOverview;
  eventFavorites: AdminEventFavorite[];
  eventStats: AdminEventStat[];
  recentBets: AdminRecentBet[];
};

type DashboardResponse = {
  ok: boolean;
  unauthorized?: boolean;
  message?: string;
  data?: AdminDashboard;
};

type BetDetailResponse = {
  ok: boolean;
  unauthorized?: boolean;
  message?: string;
  data?: AdminBetDetail;
};

type TokenSecret = string;
type AdminSessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

const ADMIN_COOKIE_NAME = "retomemorial_admin_session";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "retomemorial-admin-secret";
const ADMIN_EMAIL_ALLOWLIST = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function buildAthleteLookup(athletesByEvent: AthletesByEvent): Record<string, AthleteMeta> {
  return Object.entries(athletesByEvent).reduce(
    (acc, [eventSlug, athletesByGender]) => {
      const eventName = EVENTS.find((item) => item.slug === eventSlug)?.name ?? eventSlug;

      for (const athlete of athletesByGender.male) {
        acc[athlete.id] = {
          id: athlete.id,
          name: athlete.name,
          image: athlete.image,
          eventName,
          gender: "M",
        };
      }

      for (const athlete of athletesByGender.female) {
        acc[athlete.id] = {
          id: athlete.id,
          name: athlete.name,
          image: athlete.image,
          eventName,
          gender: "F",
        };
      }

      return acc;
    },
    {} as Record<string, AthleteMeta>
  );
}

const ATHLETE_LOOKUP_LOCAL: Record<string, AthleteMeta> = buildAthleteLookup(ATHLETES);

let cachedAthleteLookup: Record<string, AthleteMeta> | null = null;

async function getAthleteLookup(): Promise<Record<string, AthleteMeta>> {
  if (cachedAthleteLookup) return cachedAthleteLookup;
  const dbAthletes = await fetchAthletesFromDB();
  if (dbAthletes) {
    cachedAthleteLookup = buildAthleteLookup(dbAthletes);
    return cachedAthleteLookup;
  }
  cachedAthleteLookup = ATHLETE_LOOKUP_LOCAL;
  return cachedAthleteLookup;
}

function signPayload(payloadB64: string): string {
  return createHmac("sha256", ADMIN_SESSION_SECRET).update(payloadB64).digest("base64url");
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function buildSessionToken(payload: AdminSessionPayload): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseSessionToken(token: string): AdminSessionPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;
  if (signPayload(encodedPayload) !== signature) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as AdminSessionPayload;
    if (!payload.sub || !payload.email || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function isAdminUser(user: User): boolean {
  const email = user.email?.toLowerCase() ?? "";
  const appRole = user.app_metadata?.role;
  const userRole = user.user_metadata?.role;
  const appRoles = user.app_metadata?.roles;
  const userRoles = user.user_metadata?.roles;

  const hasAdminRole =
    appRole === "admin" ||
    userRole === "admin" ||
    (Array.isArray(appRoles) && appRoles.includes("admin")) ||
    (Array.isArray(userRoles) && userRoles.includes("admin"));

  if (ADMIN_EMAIL_ALLOWLIST.length === 0) {
    return true;
  }

  return hasAdminRole || ADMIN_EMAIL_ALLOWLIST.includes(email);
}

async function hasAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return Boolean(parseSessionToken(token));
}

function normalizeSelectionsFromPicks(picks: PickRow[]) {
  const selections = EVENTS.reduce((acc, event) => {
    acc[event.slug] = { maleId: null, femaleId: null, winnerId: null };
    return acc;
  }, {} as Record<string, { maleId: string | null; femaleId: string | null; winnerId: string | null }>);

  for (const pick of picks) {
    if (!selections[pick.event_slug]) continue;
    selections[pick.event_slug] = {
      maleId: pick.male_external_key ?? null,
      femaleId: pick.female_external_key ?? null,
      winnerId: pick.winner_external_key ?? null,
    };
  }

  return selections;
}

async function getAthletesFromPicks(picks: PickRow[]) {
  const lookup = await getAthleteLookup();
  const result: AthleteMeta[] = [];
  const used = new Set<string>();

  for (const pick of picks) {
    const keys = [pick.male_external_key, pick.female_external_key, pick.winner_external_key];
    for (const key of keys) {
      if (!key || used.has(key)) continue;
      const athlete = lookup[key];
      if (!athlete) continue;
      used.add(key);
      result.push(athlete);
    }
  }

  return result;
}

export async function getAdminSessionState() {
  return { authenticated: await hasAdminSession() };
}

export async function adminLogin(
  email: string,
  password: string
): Promise<AuthResponse> {
  if (!isSupabasePublicConfigured()) {
    return {
      ok: false,
      message:
        "Supabase Auth no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { ok: false, message: "Introduce email y contraseña." };
  }

  const client = getSupabaseAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    return { ok: false, message: "Credenciales inválidas." };
  }

  if (!isAdminUser(data.user)) {
    return {
      ok: false,
      message:
        "Tu usuario existe, pero no tiene permisos de admin. Añade role=admin en app_metadata o usa ADMIN_EMAIL_ALLOWLIST.",
    };
  }

  const store = await cookies();
  store.set(
    ADMIN_COOKIE_NAME,
    buildSessionToken({
      sub: data.user.id,
      email: data.user.email ?? normalizedEmail,
      exp: Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000,
    }),
    {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    }
  );

  return { ok: true };
}

export async function adminLogout(): Promise<AuthResponse> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE_NAME);
  return { ok: true };
}

export async function getAdminDashboard(): Promise<DashboardResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "Supabase no está configurado en la app. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const client = getSupabaseServiceClient();
  const lookup = await getAthleteLookup();

  const [{ data: participations, error: participationsError }, { data: picks, error: picksError }] =
    await Promise.all([
      client
        .from("participations")
        .select("id, reference, delivered, selected_slots_count, created_at")
        .order("created_at", { ascending: false })
        .limit(5000),
      client
        .from("participation_picks")
        .select(
          "participation_id, event_slug, male_external_key, female_external_key, winner_external_key"
        )
        .limit(20000),
    ]);

  if (participationsError || picksError) {
    return { ok: false, message: "No se pudieron cargar los datos del panel." };
  }

  const participationRows = (participations ?? []) as ParticipationRow[];
  const pickRows = (picks ?? []) as PickRow[];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const overview: AdminOverview = {
    totalApuestas: participationRows.length,
    totalEntregadas: participationRows.filter((item) => item.delivered).length,
    totalPendientes: participationRows.filter((item) => !item.delivered).length,
    apuestasHoy: participationRows.filter(
      (item) => new Date(item.created_at) >= todayStart
    ).length,
    huecosSeleccionados: participationRows.reduce(
      (acc, item) => acc + (item.selected_slots_count ?? 0),
      0
    ),
  };

  const eventNameBySlug = EVENTS.reduce((acc, event) => {
    acc[event.slug] = event.name;
    return acc;
  }, {} as Record<string, string>);

  const eventVoteCounter = EVENTS.reduce((acc, event) => {
    acc[event.slug] = new Map<string, number>();
    return acc;
  }, {} as Record<string, Map<string, number>>);

  const eventVotesTotal = EVENTS.reduce((acc, event) => {
    acc[event.slug] = 0;
    return acc;
  }, {} as Record<string, number>);

  for (const pick of pickRows) {
    const counter = eventVoteCounter[pick.event_slug];
    if (!counter) continue;

    const keys = [pick.male_external_key, pick.female_external_key, pick.winner_external_key];
    for (const key of keys) {
      if (!key) continue;
      const athlete = lookup[key];
      if (!athlete) continue;
      if (athlete.eventName !== eventNameBySlug[pick.event_slug]) continue;

      counter.set(key, (counter.get(key) ?? 0) + 1);
      eventVotesTotal[pick.event_slug] += 1;
    }
  }

  const eventFavorites: AdminEventFavorite[] = EVENTS.map((event) => {
    const counter = eventVoteCounter[event.slug];
    const totalVotos = eventVotesTotal[event.slug] ?? 0;

    const athletes = Array.from(counter.entries())
      .map(([athleteId, votos]) => {
        const athlete = lookup[athleteId];
        if (!athlete) return null;
        return {
          athleteId,
          name: athlete.name,
          image: athlete.image,
          gender: athlete.gender,
          votos,
          porcentaje: totalVotos > 0 ? (votos / totalVotos) * 100 : 0,
        };
      })
      .filter((item): item is AdminEventFavoriteAthlete => Boolean(item))
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 8);

    return {
      eventSlug: event.slug,
      eventName: event.name,
      totalVotos,
      athletes,
    };
  });

  const eventStatsMap: Record<string, AdminEventStat> = EVENTS.reduce((acc, event) => {
    acc[event.slug] = {
      eventSlug: event.slug,
      eventName: event.name,
      ticketsConSeleccion: 0,
      seleccionesMasculinas: 0,
      seleccionesFemeninas: 0,
      seleccionesGanador: 0,
    };
    return acc;
  }, {} as Record<string, AdminEventStat>);

  for (const pick of pickRows) {
    const target = eventStatsMap[pick.event_slug];
    if (!target) continue;

    const hasAnySelection = Boolean(
      pick.male_external_key || pick.female_external_key || pick.winner_external_key
    );
    if (hasAnySelection) target.ticketsConSeleccion += 1;
    if (pick.male_external_key) target.seleccionesMasculinas += 1;
    if (pick.female_external_key) target.seleccionesFemeninas += 1;
    if (pick.winner_external_key) target.seleccionesGanador += 1;
  }

  const eventStats = EVENTS.map((event) => eventStatsMap[event.slug]);

  const recentBets: AdminRecentBet[] = participationRows.slice(0, 20).map((row) => ({
    reference: row.reference,
    delivered: row.delivered,
    selectedSlotsCount: row.selected_slots_count ?? 0,
    createdAt: row.created_at,
  }));

  return {
    ok: true,
    data: {
      overview,
      eventFavorites,
      eventStats,
      recentBets,
    },
  };
}

export async function getBetByReference(
  reference: string
): Promise<BetDetailResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "Supabase no está configurado en la app. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const normalizedReference = reference.trim().toUpperCase();
  if (!normalizedReference) {
    return { ok: false, message: "Introduce una referencia válida." };
  }

  const client = getSupabaseServiceClient();

  const { data: participation, error: participationError } = await client
    .from("participations")
    .select("id, reference, delivered, selected_slots_count, created_at")
    .eq("reference", normalizedReference)
    .maybeSingle<ParticipationRow>();

  if (participationError || !participation) {
    return { ok: false, message: "No existe ninguna apuesta con esa referencia." };
  }

  const { data: picks, error: picksError } = await client
    .from("participation_picks")
    .select(
      "participation_id, event_slug, male_external_key, female_external_key, winner_external_key"
    )
    .eq("participation_id", participation.id);

  if (picksError) {
    return { ok: false, message: "No se pudieron cargar los picks de la apuesta." };
  }

  const pickRows = (picks ?? []) as PickRow[];
  const selections = normalizeSelectionsFromPicks(pickRows);
  const athletes = await getAthletesFromPicks(pickRows);

  return {
    ok: true,
    data: {
      reference: participation.reference,
      delivered: participation.delivered,
      createdAt: participation.created_at,
      selectedSlotsCount: participation.selected_slots_count ?? 0,
      selections,
      athletes,
    },
  };
}

export async function markBetAsDelivered(
  reference: string
): Promise<AuthResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "Supabase no está configurado en la app. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const normalizedReference = reference.trim().toUpperCase();
  if (!normalizedReference) {
    return { ok: false, message: "Introduce una referencia válida." };
  }

  const client = getSupabaseServiceClient();
  const { error } = await client
    .from("participations")
    .update({ delivered: true })
    .eq("reference", normalizedReference);

  return { ok: true };
}

export async function deleteBetByReference(
  reference: string
): Promise<AuthResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "Supabase no está configurado en la app. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const normalizedReference = reference.trim().toUpperCase();
  if (!normalizedReference) {
    return { ok: false, message: "Introduce una referencia válida." };
  }

  const client = getSupabaseServiceClient();
  const { data, error } = await client
    .from("participations")
    .delete()
    .eq("reference", normalizedReference)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, message: "No se pudo borrar la apuesta." };
  }

  if (!data) {
    return { ok: false, message: "No existe ninguna apuesta con esa referencia." };
  }

  return { ok: true };
}

// ============================================
// Athlete CRUD
// ============================================

export type AdminAthlete = {
  id: string;
  externalKey: string;
  eventSlug: string;
  gender: "male" | "female";
  name: string;
  mark: number;
  imageUrl: string;
  bio: string;
  highlights: AdminHighlight[];
};

export type AdminHighlight = {
  id: string;
  tier: "gold" | "silver" | "bronze";
  label: string;
  sortOrder: number;
};

type AthleteCrudResponse = {
  ok: boolean;
  unauthorized?: boolean;
  message?: string;
  data?: AdminAthlete;
};

type AthleteListResponse = {
  ok: boolean;
  unauthorized?: boolean;
  message?: string;
  data?: AdminAthlete[];
};

function invalidateAthleteCache() {
  cachedAthleteLookup = null;
}

async function getTableRowCount(
  client: SupabaseClient,
  table: string
) {
  const { count, error } = await client
    .from(table)
    .select("id", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function getResetCounts(client: SupabaseClient): Promise<ResetPreview> {
  const [
    participations,
    picks,
    locks,
    results,
    scores,
  ] = await Promise.all([
    getTableRowCount(client, "participations"),
    getTableRowCount(client, "participation_picks"),
    getTableRowCount(client, "participation_device_locks"),
    getTableRowCount(client, "event_results"),
    getTableRowCount(client, "participation_scores"),
  ]);

  return { participations, picks, locks, results, scores };
}

export async function getResetPreview(): Promise<ResetPreviewResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "Supabase no está configurado en la app. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const client = getSupabaseServiceClient();

  try {
    const counts = await getResetCounts(client);
    return { ok: true, data: counts };
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "No se pudo calcular el impacto del reset." };
  }
}

export async function resetCompetitionData(): Promise<ResetCompetitionResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message:
        "Supabase no está configurado en la app. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const client = getSupabaseServiceClient();

  let beforeCounts: ResetPreview;
  try {
    beforeCounts = await getResetCounts(client);
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "No se pudieron leer los datos antes del reset." };
  }

  const { error: resultsDeleteError } = await client
    .from("event_results")
    .delete()
    .not("id", "is", null);

  if (resultsDeleteError) {
    return { ok: false, message: "No se pudieron borrar los resultados de evento." };
  }

  const { error: participationsDeleteError } = await client
    .from("participations")
    .delete()
    .not("id", "is", null);

  if (participationsDeleteError) {
    return { ok: false, message: "No se pudieron borrar las participaciones." };
  }

  const { error: scoresDeleteError } = await client
    .from("participation_scores")
    .delete()
    .not("id", "is", null);

  if (scoresDeleteError) {
    return { ok: false, message: "No se pudieron limpiar las puntuaciones." };
  }

  return {
    ok: true,
    deleted: {
      participations: beforeCounts.participations,
      results: beforeCounts.results,
      scores: beforeCounts.scores,
    },
    executedAt: new Date().toISOString(),
  };
}

function buildAthleteExternalKeyPrefix(
  eventSlug: string,
  gender: "male" | "female"
) {
  const eventInitial = eventSlug.trim().charAt(0).toLowerCase();
  const genderInitial = gender === "male" ? "m" : "f";
  return `${eventInitial}${genderInitial}`;
}

function isExternalKeyUniqueViolation(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: string }).code ?? "")
    : "";
  const message = typeof error === "object" && error !== null && "message" in error
    ? String((error as { message?: string }).message ?? "")
    : "";

  return code === "23505" || message.toLowerCase().includes("external_key");
}

async function getNextExternalKey(
  client: SupabaseClient,
  eventSlug: string,
  gender: "male" | "female"
) {
  const prefix = buildAthleteExternalKeyPrefix(eventSlug, gender);
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix}(\\d+)$`);

  const { data, error } = await client
    .from("athletes")
    .select("external_key")
    .ilike("external_key", `${prefix}%`);

  if (error) {
    throw error;
  }

  let maxSuffix = 0;
  for (const row of data ?? []) {
    const key = String((row as { external_key?: string | null }).external_key ?? "").toLowerCase();
    const match = pattern.exec(key);
    if (!match) continue;
    const suffix = Number.parseInt(match[1], 10);
    if (Number.isFinite(suffix) && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  }

  return `${prefix}${maxSuffix + 1}`;
}

export async function getAthletesList(): Promise<AthleteListResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const client = getSupabaseServiceClient();

  const [athletesResult, highlightsResult] = await Promise.all([
    client
      .from("athletes")
      .select("id, external_key, event_slug, gender, name, mark, image_url, bio")
      .order("event_slug", { ascending: true })
      .order("mark", { ascending: false }),
    client
      .from("athlete_highlights")
      .select("id, athlete_id, tier, label, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  if (athletesResult.error) {
    return { ok: false, message: "No se pudieron cargar los atletas." };
  }

  const athletes = athletesResult.data;
  const highlights = highlightsResult.data ?? [];

  const highlightsByAthleteId: Record<string, AdminHighlight[]> = {};
  for (const h of highlights) {
    if (!highlightsByAthleteId[h.athlete_id]) {
      highlightsByAthleteId[h.athlete_id] = [];
    }
    highlightsByAthleteId[h.athlete_id].push({
      id: h.id,
      tier: h.tier as "gold" | "silver" | "bronze",
      label: h.label,
      sortOrder: h.sort_order,
    });
  }

  const result: AdminAthlete[] = athletes.map((a: any) => ({
    id: a.id,
    externalKey: a.external_key || a.id,
    eventSlug: a.event_slug,
    gender: a.gender as "male" | "female",
    name: a.name,
    mark: Number(a.mark),
    imageUrl: a.image_url || "",
    bio: a.bio || "",
    highlights: highlightsByAthleteId[a.id] ?? [],
  }));

  return { ok: true, data: result };
}

export async function upsertAthlete(data: {
  externalKey?: string;
  eventSlug: string;
  gender: "male" | "female";
  name: string;
  mark: number;
  imageUrl: string;
  bio?: string;
}): Promise<AthleteCrudResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const client = getSupabaseServiceClient();
  const normalizedExternalKey = data.externalKey?.trim().toLowerCase();

  const payload = {
    event_slug: data.eventSlug,
    gender: data.gender,
    name: data.name,
    mark: data.mark,
    image_url: data.imageUrl,
    bio: data.bio || "",
  };

  if (normalizedExternalKey) {
    const { data: athlete, error } = await client
      .from("athletes")
      .update(payload)
      .eq("external_key", normalizedExternalKey)
      .select("id, external_key, event_slug, gender, name, mark, image_url, bio")
      .single();

    if (error || !athlete) {
      return { ok: false, message: error?.message ?? "No se pudo guardar el atleta." };
    }

    invalidateAthleteCache();

    return {
      ok: true,
      data: {
        id: athlete.id,
        externalKey: athlete.external_key || athlete.id,
        eventSlug: athlete.event_slug,
        gender: athlete.gender as "male" | "female",
        name: athlete.name,
        mark: Number(athlete.mark),
        imageUrl: athlete.image_url || "",
        bio: athlete.bio || "",
        highlights: [],
      },
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let generatedExternalKey = "";
    try {
      generatedExternalKey = await getNextExternalKey(client, data.eventSlug, data.gender);
    } catch (error: any) {
      return { ok: false, message: error?.message ?? "No se pudo calcular el ID externo." };
    }

    const { data: athlete, error } = await client
      .from("athletes")
      .insert({
        ...payload,
        external_key: generatedExternalKey,
      })
      .select("id, external_key, event_slug, gender, name, mark, image_url, bio")
      .single();

    if (!error && athlete) {
      invalidateAthleteCache();
      return {
        ok: true,
        data: {
          id: athlete.id,
          externalKey: athlete.external_key || athlete.id,
          eventSlug: athlete.event_slug,
          gender: athlete.gender as "male" | "female",
          name: athlete.name,
          mark: Number(athlete.mark),
          imageUrl: athlete.image_url || "",
          bio: athlete.bio || "",
          highlights: [],
        },
      };
    }

    if (!isExternalKeyUniqueViolation(error) || attempt === 2) {
      return { ok: false, message: error?.message ?? "No se pudo guardar el atleta." };
    }
  }

  return { ok: false, message: "No se pudo guardar el atleta." };
}

export async function deleteAthleteAction(athleteId: string): Promise<AuthResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const client = getSupabaseServiceClient();
  const { error } = await client.from("athletes").delete().eq("id", athleteId);

  if (error) {
    return { ok: false, message: "No se pudo eliminar el atleta." };
  }

  invalidateAthleteCache();
  return { ok: true };
}

export async function upsertHighlightAction(data: {
  athleteId: string;
  tier: "gold" | "silver" | "bronze";
  label: string;
  sortOrder: number;
  highlightId?: string;
}): Promise<AuthResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const client = getSupabaseServiceClient();

  const payload = {
    athlete_id: data.athleteId,
    tier: data.tier,
    label: data.label,
    sort_order: data.sortOrder,
  };

  if (data.highlightId) {
    const { error } = await client
      .from("athlete_highlights")
      .update(payload)
      .eq("id", data.highlightId);
    if (error) {
      return { ok: false, message: "No se pudo actualizar el highlight." };
    }
  } else {
    const { error } = await client
      .from("athlete_highlights")
      .insert(payload);
    if (error) {
      return { ok: false, message: "No se pudo crear el highlight." };
    }
  }

  return { ok: true };
}

export async function deleteHighlightAction(highlightId: string): Promise<AuthResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const client = getSupabaseServiceClient();
  const { error } = await client.from("athlete_highlights").delete().eq("id", highlightId);

  if (error) {
    return { ok: false, message: "No se pudo eliminar el highlight." };
  }

  return { ok: true };
}

export async function uploadAthleteImageAction(formData: FormData): Promise<{ ok: boolean; url?: string; message?: string }> {
  if (!(await hasAdminSession())) {
    return { ok: false, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { ok: false, message: "No se encontró el archivo." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const client = getSupabaseServiceClient();
  const { error: uploadError } = await client.storage
    .from("athlete-images")
    .upload(filename, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    return { ok: false, message: "No se pudo subir la imagen." };
  }

  const { data: urlData } = client.storage.from("athlete-images").getPublicUrl(filename);
  const publicUrl = urlData?.publicUrl || `/athlete-images/${filename}`;

  return { ok: true, url: publicUrl };
}

// ============================================
// Event Results & Scoring
// ============================================

export type EventResultEntry = {
  athleteId: string;
  athleteDbId: string;
  athleteName: string;
  athleteGender: "male" | "female";
  mark: number | null;
  position: number | null;
  score: number | null;
  retoBonus: boolean;
};

export type EventResultsData = {
  eventSlug: string;
  eventName: string;
  results: EventResultEntry[];
};

type EventResultsResponse = {
  ok: boolean;
  unauthorized?: boolean;
  message?: string;
  data?: EventResultsData[];
};

export async function getEventResults(): Promise<EventResultsResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const client = getSupabaseServiceClient();

  const [athletesResult, resultsResult] = await Promise.all([
    client
      .from("athletes")
      .select("id, external_key, event_slug, gender, name, mark, image_url")
      .order("mark", { ascending: false }),
    client
      .from("event_results")
      .select("event_slug, athlete_id, mark, position"),
  ]);

  if (athletesResult.error) {
    return { ok: false, message: "No se pudieron cargar los atletas." };
  }

  const athletes = athletesResult.data;
  const results = (resultsResult.data ?? []) as {
    event_slug: string;
    athlete_id: string;
    mark: number | null;
    position: number | null;
  }[];

  const athletesByEvent = rowsToAthletesByEvent(athletes as any);

  const athletesLookup = new Map<string, { name: string; gender: string; externalKey: string; eventSlug: string }>();
  for (const a of athletes) {
    const extKey = (a as any).external_key || (a as any).id;
    athletesLookup.set((a as any).id, {
      name: (a as any).name,
      gender: (a as any).gender,
      externalKey: extKey,
      eventSlug: (a as any).event_slug,
    });
  }

  const athleteIdToExternal = new Map<string, string>();
  for (const a of athletes) {
    athleteIdToExternal.set((a as any).id, (a as any).external_key || (a as any).id);
  }

  const resultsWithScore: EventResultsData[] = EVENTS.map((event) => {
    const eventResults = results.filter((r) => r.event_slug === event.slug);

    const eventScores = calculateEventScores(
      event.slug,
      eventResults.map((r) => ({
        eventSlug: r.event_slug,
        athleteId: athleteIdToExternal.get(r.athlete_id) || r.athlete_id,
        mark: r.mark !== null ? Number(r.mark) : null,
        position: r.position,
      })),
      athletesByEvent || ATHLETES
    );

    const scoreMap = new Map(eventScores.map((s) => [s.athleteId, s]));

    const eventAthletes = athletes.filter((a: any) => (a as any).event_slug === event.slug);

    const entries: EventResultEntry[] = eventAthletes.map((a: any) => {
      const extKey = athleteIdToExternal.get(a.id) || a.id;
      const score = scoreMap.get(extKey);
      const resultRow = eventResults.find((r) => r.athlete_id === a.id);

      return {
        athleteId: extKey,
        athleteDbId: a.id,
        athleteName: a.name,
        athleteGender: a.gender as "male" | "female",
        mark: resultRow?.mark !== null && resultRow?.mark !== undefined ? Number(resultRow.mark) : null,
        position: resultRow?.position ?? (score?.position ?? null),
        score: score?.finalPoints ?? null,
        retoBonus: score?.retoBonus ?? false,
      };
    });

    entries.sort((a, b) => {
      if (a.mark === null && b.mark === null) return 0;
      if (a.mark === null) return 1;
      if (b.mark === null) return -1;
      return (b.mark as number) - (a.mark as number);
    });

    return {
      eventSlug: event.slug,
      eventName: event.name,
      results: entries,
    };
  });

  return { ok: true, data: resultsWithScore };
}

type SaveResultRow = {
  athleteDbId: string;
  mark: number | null;
};

function normalizeResultMark(mark: number | null | undefined) {
  return typeof mark === "number" && Number.isFinite(mark) ? mark : null;
}

export async function saveEventResultsAction(
  eventSlug: string,
  results: SaveResultRow[]
): Promise<AuthResponse> {
  if (!(await hasAdminSession())) {
    return { ok: false, unauthorized: true, message: "Sesión no válida." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, message: "Supabase no está configurado." };
  }

  const client = getSupabaseServiceClient();

  const { data: athleteRows, error: athleteError } = await client
    .from("athletes")
    .select("id, external_key, event_slug, gender, name, mark, image_url")
    .eq("event_slug", eventSlug)
    .order("mark", { ascending: false });

  if (athleteError) {
    return { ok: false, message: "No se pudieron cargar los atletas del evento." };
  }

  const dbIdToExternal = new Map<string, string>();
  for (const a of (athleteRows ?? [])) {
    dbIdToExternal.set(a.id, a.external_key || a.id);
  }

  const athletesByEvent = await fetchAthletesFromDB();
  const athletesPool = athletesByEvent || ATHLETES;

  const resultByDbId = new Map(
    results.map((result) => [
      result.athleteDbId,
      normalizeResultMark(result.mark),
    ])
  );

  const orderedAthleteRows = [...(athleteRows ?? [])].sort((a, b) => {
    const aMark = normalizeResultMark(resultByDbId.get(a.id));
    const bMark = normalizeResultMark(resultByDbId.get(b.id));

    if (aMark !== null && bMark !== null) {
      return bMark - aMark;
    }

    if (aMark !== null) return -1;
    if (bMark !== null) return 1;

    return 0;
  });

  const positionByDbId = new Map<string, number>();
  orderedAthleteRows.forEach((athlete, index) => {
    positionByDbId.set(athlete.id, index + 1);
  });

  const validResults = orderedAthleteRows
    .map((athlete) => {
      const mark = normalizeResultMark(resultByDbId.get(athlete.id));
      if (mark === null) return null;

      return {
        athleteDbId: athlete.id,
        mark,
      };
    })
    .filter((result): result is { athleteDbId: string; mark: number } => result !== null);

  const scores = calculateEventScores(
    eventSlug,
    validResults.map((r) => ({
      eventSlug,
      athleteId: dbIdToExternal.get(r.athleteDbId) || r.athleteDbId,
      mark: r.mark!,
      position: null,
    })),
    athletesPool
  );

  for (const s of scores) {
    const dbId = [...dbIdToExternal.entries()].find(([, v]) => v === s.athleteId)?.[0] ?? s.athleteId;
    positionByDbId.set(dbId, s.position);
  }

  const rowsToUpsert = orderedAthleteRows.map((athlete) => ({
    event_slug: eventSlug,
    athlete_id: athlete.id,
    mark: normalizeResultMark(resultByDbId.get(athlete.id)),
    position: positionByDbId.get(athlete.id) ?? null,
  }));

  if (rowsToUpsert.length === 0) {
    return { ok: true };
  }

  const { error } = await client
    .from("event_results")
    .upsert(rowsToUpsert, { onConflict: "event_slug,athlete_id" });

  if (error) {
    return { ok: false, message: `No se pudieron guardar los resultados: ${error.message}` };
  }

  await recalculateAllScores();

  return { ok: true };
}

async function recalculateAllScores(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const client = getSupabaseServiceClient();

  const [athletesResult, resultsResult, picksResult, participationsResult] = await Promise.all([
    client.from("athletes").select("id, external_key, event_slug, gender, name, mark, image_url").order("mark", { ascending: false }),
    client.from("event_results").select("event_slug, athlete_id, mark, position"),
    client.from("participation_picks").select("participation_id, event_slug, male_external_key, female_external_key, winner_external_key"),
    client.from("participations").select("id"),
  ]);

  if (athletesResult.error || resultsResult.error || picksResult.error || participationsResult.error) return;

  const athletes = athletesResult.data ?? [];
  const results = (resultsResult.data ?? []) as { event_slug: string; athlete_id: string; mark: number | null; position: number | null }[];
  const picks = (picksResult.data ?? []) as { participation_id: string; event_slug: string; male_external_key: string | null; female_external_key: string | null; winner_external_key: string | null }[];

  const externalToDbId = new Map<string, string>();
  const dbIdToExternal = new Map<string, string>();
  for (const a of athletes) {
    const ext = a.external_key || a.id;
    externalToDbId.set(ext, a.id);
    dbIdToExternal.set(a.id, ext);
  }

  const athletesByEvent = rowsToAthletesByEvent(athletes as any);

  const scoresByEvent: Record<string, AthleteScore[]> = {};
  for (const event of EVENTS) {
    const eventResults = results.filter((r) => r.event_slug === event.slug);
    if (eventResults.length === 0) {
      scoresByEvent[event.slug] = [];
      continue;
    }

    const mapped = eventResults.map((r) => ({
      eventSlug: r.event_slug,
      athleteId: dbIdToExternal.get(r.athlete_id) || r.athlete_id,
      mark: r.mark !== null ? Number(r.mark) : null,
      position: r.position,
    }));

    scoresByEvent[event.slug] = calculateEventScores(event.slug, mapped, athletesByEvent || ATHLETES);
  }

  const hasAnyResults = Object.values(scoresByEvent).some((s) => s.length > 0);
  if (!hasAnyResults) return;

  const picksByParticipation = new Map<string, typeof picks>();
  for (const pick of picks) {
    if (!picksByParticipation.has(pick.participation_id)) {
      picksByParticipation.set(pick.participation_id, []);
    }
    picksByParticipation.get(pick.participation_id)!.push(pick);
  }

  const scoresToUpsert: {
    participation_id: string;
    total_score: number;
    total_invested: number;
    efficiency: number;
    breakdown: object;
  }[] = [];

  for (const participation of (participationsResult.data ?? [])) {
    const participationPicks = picksByParticipation.get(participation.id) ?? [];
    if (participationPicks.length === 0) continue;

    const score = calculateParticipationScore(
      participationPicks.map((p) => ({
        eventSlug: p.event_slug,
        maleExternalKey: p.male_external_key,
        femaleExternalKey: p.female_external_key,
        winnerExternalKey: p.winner_external_key,
      })),
      scoresByEvent,
      athletesByEvent || ATHLETES
    );

    scoresToUpsert.push({
      participation_id: participation.id,
      total_score: score.totalScore,
      total_invested: score.totalInvested,
      efficiency: score.efficiency,
      breakdown: score.events,
    });
  }

  if (scoresToUpsert.length === 0) return;

  const { error: upsertError } = await client
    .from("participation_scores")
    .upsert(scoresToUpsert, { onConflict: "participation_id" });

  if (upsertError) {
    console.error("Error upserting participation_scores:", upsertError);
  }
}

export type LeaderboardEntry = {
  rank: number;
  reference: string;
  nickname?: string | null;
  isWinner: boolean;
  delivered: boolean;
  totalScore: number;
  totalInvested: number;
  efficiency: number;
  breakdown: Record<string, {
    male: { athleteId: string; points: number; retoBonus: boolean } | null;
    female: { athleteId: string; points: number; retoBonus: boolean } | null;
    winner: { athleteId: string; points: number; retoBonus: boolean } | null;
  }>;
  selectedSlotsCount: number;
  createdAt: string;
};

export type LeaderboardMeta = {
  resultsComplete: boolean;
  winnersCutoff: number;
  resultsStatus: "pending" | "partial" | "complete";
  completedResults: number;
  expectedResults: number;
};

export type LeaderboardResponse = {
  ok: boolean;
  message?: string;
  data?: LeaderboardEntry[];
  meta?: LeaderboardMeta;
};

export async function getLeaderboard(): Promise<LeaderboardResponse> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Supabase no está configurado.",
      meta: {
        resultsComplete: false,
        winnersCutoff: 10,
        resultsStatus: "pending",
        completedResults: 0,
        expectedResults: 0,
      },
    };
  }

  const client = getSupabaseServiceClient();

  const [scoresResult, participationsResult, picksResult, athletesResult, resultsResult] = await Promise.all([
    client.from("participation_scores").select("participation_id, total_score, total_invested, efficiency, breakdown, calculated_at"),
    client.from("participations").select("id, reference, nickname, delivered, selected_slots_count, created_at").order("created_at", { ascending: true }),
    client.from("participation_picks").select("participation_id, event_slug, male_external_key, female_external_key, winner_external_key"),
    client.from("athletes").select("id, external_key, event_slug, gender, name, mark, image_url").order("mark", { ascending: false }),
    client.from("event_results").select("event_slug, athlete_id, mark, position"),
  ]);

  if (scoresResult.error || participationsResult.error || picksResult.error || athletesResult.error || resultsResult.error) {
    return {
      ok: false,
      message: "No se pudieron cargar los datos de clasificación.",
      meta: {
        resultsComplete: false,
        winnersCutoff: 10,
        resultsStatus: "pending",
        completedResults: 0,
        expectedResults: 0,
      },
    };
  }

  const scores = (scoresResult.data ?? []) as {
    participation_id: string;
    total_score: number;
    total_invested?: number | null;
    efficiency?: number | null;
    breakdown: object;
    calculated_at: string;
  }[];
  const participations = (participationsResult.data ?? []) as { id: string; reference: string; nickname?: string | null; delivered: boolean; selected_slots_count: number; created_at: string }[];
  const picks = (picksResult.data ?? []) as { participation_id: string; event_slug: string; male_external_key: string | null; female_external_key: string | null; winner_external_key: string | null }[];
  const athletes = athletesResult.data ?? [];
  const results = (resultsResult.data ?? []) as { event_slug: string; athlete_id: string; mark: number | null; position: number | null }[];
  const winnersCutoff = 10;

  const scoreMap = new Map(scores.map((s) => [s.participation_id, s]));
  const picksByParticipation = new Map<string, typeof picks>();
  for (const pick of picks) {
    if (!picksByParticipation.has(pick.participation_id)) {
      picksByParticipation.set(pick.participation_id, []);
    }
    picksByParticipation.get(pick.participation_id)!.push(pick);
  }

  const hasAnyResults = results.length > 0;

  const dbIdToExternal = new Map<string, string>();
  for (const a of athletes) {
    dbIdToExternal.set(a.id, a.external_key || a.id);
  }

  const resultPositionByEventAndAthlete = new Map<string, number | null>();
  for (const result of results) {
    resultPositionByEventAndAthlete.set(
      `${result.event_slug}:${result.athlete_id}`,
      result.position
    );
  }

  const athletesByEvent = rowsToAthletesByEvent(athletes as any);
  const expectedResults = EVENTS.reduce((count, event) => {
    return count + athletes.filter((athlete) => athlete.event_slug === event.slug).length;
  }, 0);
  const completedResults = EVENTS.reduce((count, event) => {
    return (
      count +
      athletes.filter((athlete) => {
        const position = resultPositionByEventAndAthlete.get(`${event.slug}:${athlete.id}`);
        return athlete.event_slug === event.slug && position !== null && position !== undefined;
      }).length
    );
  }, 0);
  const resultsComplete = EVENTS.every((event) => {
    const eventAthletes = athletes.filter((athlete) => athlete.event_slug === event.slug);
    if (eventAthletes.length === 0) return false;

    return eventAthletes.every((athlete) => {
      const position = resultPositionByEventAndAthlete.get(`${event.slug}:${athlete.id}`);
      return position !== null && position !== undefined;
    });
  });
  const resultsStatus: LeaderboardMeta["resultsStatus"] = resultsComplete
    ? "complete"
    : completedResults > 0
    ? "partial"
    : "pending";

  let liveScoresByEvent: Record<string, AthleteScore[]> = {};
  if (hasAnyResults) {
    for (const event of EVENTS) {
      const eventResults = results.filter((r) => r.event_slug === event.slug);
      const mapped = eventResults.map((r) => ({
        eventSlug: r.event_slug,
        athleteId: dbIdToExternal.get(r.athlete_id) || r.athlete_id,
        mark: r.mark !== null ? Number(r.mark) : null,
        position: r.position,
      }));

      if (mapped.length > 0) {
        liveScoresByEvent[event.slug] = calculateEventScores(event.slug, mapped, athletesByEvent || ATHLETES);
      }
    }
  }

  const entries: LeaderboardEntry[] = participations.map((p) => {
    const storedScore = scoreMap.get(p.id);
    const participationPicks = picksByParticipation.get(p.id) ?? [];

    let totalScore = 0;
    let totalInvested = 0;
    let efficiency = 0;
    let breakdown: LeaderboardEntry["breakdown"] = {};

    if (storedScore && hasAnyResults && Object.keys(liveScoresByEvent).length > 0) {
      const result = calculateParticipationScore(
        participationPicks.map((pp) => ({
          eventSlug: pp.event_slug,
          maleExternalKey: pp.male_external_key,
          femaleExternalKey: pp.female_external_key,
          winnerExternalKey: pp.winner_external_key,
        })),
        liveScoresByEvent,
        athletesByEvent || ATHLETES
      );
      totalScore = result.totalScore;
      totalInvested = result.totalInvested;
      efficiency = result.efficiency;
      breakdown = result.events;
    } else if (storedScore) {
      totalScore = Number(storedScore.total_score);
      totalInvested = Number(storedScore.total_invested ?? 0);
      efficiency = Number(storedScore.efficiency ?? 0);
      breakdown = (storedScore.breakdown ?? {}) as LeaderboardEntry["breakdown"];
    } else {
      const totalInvestedOnly = calculateParticipationScore(
        participationPicks.map((pp) => ({
          eventSlug: pp.event_slug,
          maleExternalKey: pp.male_external_key,
          femaleExternalKey: pp.female_external_key,
          winnerExternalKey: pp.winner_external_key,
        })),
        liveScoresByEvent,
        athletesByEvent || ATHLETES
      );
      totalInvested = totalInvestedOnly.totalInvested;
      efficiency = totalInvestedOnly.efficiency;
      breakdown = totalInvestedOnly.events;
    }

    return {
      rank: 0,
      reference: p.reference,
      nickname: p.nickname,
      isWinner: false,
      delivered: p.delivered,
      totalScore,
      totalInvested,
      efficiency,
      breakdown,
      selectedSlotsCount: p.selected_slots_count ?? 0,
      createdAt: p.created_at,
    };
  });

  entries.sort((a, b) => {
    if (b.efficiency !== a.efficiency) return b.efficiency - a.efficiency;
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  for (let i = 0; i < entries.length; i++) {
    entries[i].rank = i + 1;
  }

  if (resultsComplete && entries.length > 0) {
    const cutoffEntry = entries[Math.min(winnersCutoff, entries.length) - 1];
    for (const entry of entries) {
      entry.isWinner =
        entry.rank <= winnersCutoff ||
        (
          cutoffEntry &&
          Math.abs(entry.efficiency - cutoffEntry.efficiency) < 0.000001 &&
          entry.totalScore === cutoffEntry.totalScore
        );
    }
  }

  return {
    ok: true,
    data: entries,
    meta: {
      resultsComplete,
      winnersCutoff,
      resultsStatus,
      completedResults,
      expectedResults,
    },
  };
}

"use server";

import { cookies } from "next/headers";
import { createHash } from "crypto";
import { ATHLETES, EVENTS } from "@/lib/data";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase";

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
  selections: Record<string, { maleId: string | null; femaleId: string | null }>;
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

const ADMIN_COOKIE_NAME = "retomemorial_admin_session";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin4600";
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ?? "retomemorial-admin-secret";

const ATHLETE_LOOKUP: Record<string, AthleteMeta> = Object.entries(ATHLETES).reduce(
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

function getSessionToken() {
  return createHash("sha256")
    .update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}:${ADMIN_SESSION_SECRET}`)
    .digest("hex");
}

async function hasAdminSession() {
  const store = await cookies();
  const cookie = store.get(ADMIN_COOKIE_NAME)?.value;
  return cookie === getSessionToken();
}

function normalizeSelectionsFromPicks(picks: PickRow[]) {
  const selections = EVENTS.reduce((acc, event) => {
    acc[event.slug] = { maleId: null, femaleId: null };
    return acc;
  }, {} as Record<string, { maleId: string | null; femaleId: string | null }>);

  for (const pick of picks) {
    if (!selections[pick.event_slug]) continue;
    selections[pick.event_slug] = {
      maleId: pick.male_external_key ?? null,
      femaleId: pick.female_external_key ?? null,
    };
  }

  return selections;
}

function getAthletesFromPicks(picks: PickRow[]) {
  const result: AthleteMeta[] = [];
  const used = new Set<string>();

  for (const pick of picks) {
    const keys = [pick.male_external_key, pick.female_external_key, pick.winner_external_key];
    for (const key of keys) {
      if (!key || used.has(key)) continue;
      const athlete = ATHLETE_LOOKUP[key];
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
  username: string,
  password: string
): Promise<AuthResponse> {
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return { ok: false, message: "Usuario o contraseña incorrectos." };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, getSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

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
      const athlete = ATHLETE_LOOKUP[key];
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
        const athlete = ATHLETE_LOOKUP[athleteId];
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
  const athletes = getAthletesFromPicks(pickRows);

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

  if (error) {
    return { ok: false, message: "No se pudo actualizar el estado del ticket." };
  }

  return { ok: true };
}

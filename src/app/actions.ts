"use server";

import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { addMinutes, isAfter } from "date-fns";
import { cookies } from "next/headers";
import { EVENTS, getAthleteCost } from "@/lib/data";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export type EventSelection = { maleId: string | null; femaleId: string | null; winnerId: string | null };
export type SelectionsMap = Record<string, EventSelection>;

export type FullParticipationResult = {
  success: boolean;
  message?: string;
  reference?: string;
};

export type ExistingParticipationResult = {
  found: boolean;
  error?: boolean;
  reference?: string;
  selections?: SelectionsMap;
  createdAt?: string;
  selectedSlotsCount?: number;
};

type ParticipationRecord = {
  reference: string;
  selections: SelectionsMap;
  delivered: boolean;
  createdAt: string;
  selectedSlotsCount: number;
};

type ParticipationRow = {
  id: string;
  reference: string;
  delivered: boolean;
  created_at: string;
  selected_slots_count: number;
};

type ParticipationPickRow = {
  event_slug: string;
  male_external_key: string | null;
  female_external_key: string | null;
  winner_external_key: string | null;
};

type DeviceLockRow = {
  device_hash?: string;
  participation_id: string;
};

const DEVICE_LOCK_COOKIE = "rm_device_lock";
const DEVICE_LOCK_SECRET =
  process.env.DEVICE_LOCK_SECRET ?? "retomemorial-device-lock";

const MOCK_DB_FILE = path.join(process.cwd(), ".next", "mock_db.json");

type MockDbData = {
  participations: Record<string, ParticipationRecord>;
  deviceLocks: Record<string, string>;
};

function readMockDb(): MockDbData {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      const content = fs.readFileSync(MOCK_DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.error("Error reading mock DB:", err);
  }
  return { participations: {}, deviceLocks: {} };
}

function writeMockDb(data: MockDbData) {
  try {
    const dir = path.dirname(MOCK_DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing mock DB:", err);
  }
}

/**
 * Lightweight check: only verifies if the device-lock cookie exists.
 * No DB queries — extremely fast and reliable for guards/redirects.
 */
export async function isDeviceLocked(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(DEVICE_LOCK_COOKIE)?.value);
}

/**
 * Clear the device lock cookie (self-healing / cleanup).
 */
export async function clearDeviceLock(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEVICE_LOCK_COOKIE);
}

export async function validateAndTimeCheck(eventSlug: string): Promise<{
  allowed: boolean;
  reason?: string;
  serverTime?: string;
}> {
  const event = EVENTS.find((item) => item.slug === eventSlug);
  if (!event) {
    return { allowed: false, reason: "Evento no encontrado." };
  }

  const now = new Date();
  const startTime = new Date(event.startTime);
  const closeTime = addMinutes(startTime, 15);

  if (isAfter(now, closeTime)) {
    return { allowed: false, reason: "El plazo de participación ha finalizado." };
  }

  return { allowed: true, serverTime: now.toISOString() };
}

function normalizeSelections(selections: SelectionsMap): SelectionsMap {
  return EVENTS.reduce((acc, event) => {
    const current = selections[event.slug] ?? { maleId: null, femaleId: null, winnerId: null };
    acc[event.slug] = {
      maleId: current.maleId ?? null,
      femaleId: current.femaleId ?? null,
      winnerId: current.winnerId ?? null,
    };
    return acc;
  }, {} as SelectionsMap);
}

function buildSelectionsFromPicks(picks: ParticipationPickRow[]): SelectionsMap {
  const normalized = EVENTS.reduce((acc, event) => {
    acc[event.slug] = { maleId: null, femaleId: null, winnerId: null };
    return acc;
  }, {} as SelectionsMap);

  for (const pick of picks) {
    if (!normalized[pick.event_slug]) continue;
    normalized[pick.event_slug] = {
      maleId: pick.male_external_key ?? null,
      femaleId: pick.female_external_key ?? null,
      winnerId: pick.winner_external_key ?? null,
    };
  }

  return normalized;
}

function countSelectedSlots(selections: SelectionsMap) {
  return Object.values(selections).reduce((acc, current) => {
    return acc + (current.maleId ? 1 : 0) + (current.femaleId ? 1 : 0);
  }, 0);
}

function normalizeDeviceId(rawDeviceId?: string | null) {
  if (!rawDeviceId) return null;
  const normalized = rawDeviceId.trim();
  if (!normalized || normalized.length < 16 || normalized.length > 200) {
    return null;
  }
  return normalized;
}

function hashDeviceId(deviceId: string) {
  return createHash("sha256")
    .update(`${deviceId}:${DEVICE_LOCK_SECRET}`)
    .digest("hex");
}

async function cleanupFailedParticipation(participationId: string) {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseServiceClient();
  await client.from("participation_picks").delete().eq("participation_id", participationId);
  await client.from("participations").delete().eq("id", participationId);
}

async function generateUniqueReference() {
  if (!isSupabaseConfigured()) {
    const stamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `RM-${stamp}-${random}`;
  }

  const client = getSupabaseServiceClient();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const stamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const candidate = `RM-${stamp}-${random}`;

    const { data, error } = await client
      .from("participations")
      .select("id")
      .eq("reference", candidate)
      .maybeSingle();

    if (error) {
      continue;
    }

    if (!data) {
      return candidate;
    }
  }

  return `RM-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
}

export async function submitFullParticipation(
  selections: SelectionsMap,
  rawDeviceId?: string
): Promise<FullParticipationResult> {
  const cookieStore = await cookies();
  if (cookieStore.get(DEVICE_LOCK_COOKIE)?.value) {
    return {
      success: false,
      message: "Este dispositivo ya registró una apuesta.",
    };
  }

  const normalizedDeviceId = normalizeDeviceId(rawDeviceId);
  if (!normalizedDeviceId) {
    return {
      success: false,
      message: "No se pudo validar este dispositivo. Recarga e inténtalo de nuevo.",
    };
  }
  const deviceHash = hashDeviceId(normalizedDeviceId);

  const normalizedSelections = normalizeSelections(selections);
  const selectedEventSlugs = EVENTS.filter((event) => {
    const eventSelection = normalizedSelections[event.slug];
    return Boolean(eventSelection?.maleId || eventSelection?.femaleId);
  }).map((event) => event.slug);

  if (selectedEventSlugs.length === 0) {
    return { success: false, message: "Debes seleccionar al menos un atleta." };
  }

  for (const eventSlug of selectedEventSlugs) {
    const event = EVENTS.find((item) => item.slug === eventSlug);
    if (!event) continue;

    const validation = await validateAndTimeCheck(event.slug);
    if (!validation.allowed) {
      return { success: false, message: `El evento ${event.name} ha cerrado.` };
    }
  }

  // Validar presupuesto de puntos
  let totalCost = 0;
  for (const event of EVENTS) {
    const selection = normalizedSelections[event.slug];
    if (selection) {
      if (selection.maleId) {
        totalCost += getAthleteCost(selection.maleId, event.slug, "male");
      }
      if (selection.femaleId) {
        totalCost += getAthleteCost(selection.femaleId, event.slug, "female");
      }
    }
  }

  if (totalCost > 35) {
    return {
      success: false,
      message: "Has superado el límite de 35 puntos.",
    };
  }

  const reference = (await generateUniqueReference()).toUpperCase();
  const selectedSlotsCount = countSelectedSlots(normalizedSelections);

  if (!isSupabaseConfigured()) {
    const db = readMockDb();
    if (db.deviceLocks[deviceHash]) {
      return {
        success: false,
        message: "Este dispositivo ya registró una apuesta.",
      };
    }

    db.participations[reference] = {
      reference,
      selections: normalizedSelections,
      delivered: false,
      createdAt: new Date().toISOString(),
      selectedSlotsCount,
    };
    db.deviceLocks[deviceHash] = reference;
    writeMockDb(db);

    cookieStore.set(DEVICE_LOCK_COOKIE, deviceHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
    return { success: true, reference };
  }

  const client = getSupabaseServiceClient();
  const { data: existingDeviceLock, error: existingDeviceLockError } = await client
    .from("participation_device_locks")
    .select("participation_id")
    .eq("device_hash", deviceHash)
    .maybeSingle<DeviceLockRow>();

  if (existingDeviceLockError) {
    return {
      success: false,
      message: "No se pudo validar el dispositivo. Inténtalo de nuevo.",
    };
  }

  if (existingDeviceLock) {
    return {
      success: false,
      message: "Este dispositivo ya registró una apuesta.",
    };
  }

  const { data: participation, error: insertParticipationError } = await client
    .from("participations")
    .insert({
      reference,
      delivered: false,
      selected_slots_count: selectedSlotsCount,
    })
    .select("id")
    .single();

  if (insertParticipationError || !participation) {
    return {
      success: false,
      message: "No se pudo registrar tu ticket. Inténtalo de nuevo.",
    };
  }

  const picksPayload = EVENTS.map((event) => {
    const selection = normalizedSelections[event.slug];
    return {
      participation_id: participation.id,
      event_slug: event.slug,
      male_external_key: selection.maleId,
      female_external_key: selection.femaleId,
      winner_external_key: selection.winnerId,
      male_athlete_id: null as string | null,
      female_athlete_id: null as string | null,
      winner_athlete_id: null as string | null,
    };
  });

  const { error: insertPicksError } = await client
    .from("participation_picks")
    .insert(picksPayload);

  if (insertPicksError) {
    await cleanupFailedParticipation(participation.id);
    return {
      success: false,
      message: "No se pudo guardar la selección. Inténtalo de nuevo.",
    };
  }

  const { error: insertDeviceLockError } = await client
    .from("participation_device_locks")
    .insert({
      device_hash: deviceHash,
      participation_id: participation.id,
    });

  if (insertDeviceLockError) {
    await cleanupFailedParticipation(participation.id);
    return {
      success: false,
      message:
        insertDeviceLockError.code === "23505"
          ? "Este dispositivo ya registró una apuesta."
          : "No se pudo validar el dispositivo. Inténtalo de nuevo.",
    };
  }

  cookieStore.set(DEVICE_LOCK_COOKIE, deviceHash, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365 * 2,
  });

  return { success: true, reference };
}

export async function getExistingParticipationForDevice(
  rawDeviceId?: string
): Promise<ExistingParticipationResult> {
  const cookieStore = await cookies();
  const cookieHash = cookieStore.get(DEVICE_LOCK_COOKIE)?.value ?? null;
  const normalizedDeviceId = normalizeDeviceId(rawDeviceId);
  const computedHash = normalizedDeviceId ? hashDeviceId(normalizedDeviceId) : null;
  const deviceHash = cookieHash ?? computedHash;

  if (!deviceHash) {
    return { found: false };
  }

  if (!isSupabaseConfigured()) {
    const db = readMockDb();
    const reference = db.deviceLocks[deviceHash];
    if (!reference) return { found: false, error: false };

    const record = db.participations[reference];
    if (!record) return { found: false, error: false };

    if (!cookieHash) {
      cookieStore.set(DEVICE_LOCK_COOKIE, deviceHash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365 * 2,
      });
    }

    return {
      found: true,
      error: false,
      reference: record.reference,
      selections: record.selections,
      createdAt: record.createdAt,
      selectedSlotsCount: record.selectedSlotsCount,
    };
  }

  const client = getSupabaseServiceClient();
  const { data: deviceLock, error: deviceLockError } = await client
    .from("participation_device_locks")
    .select("participation_id, device_hash")
    .eq("device_hash", deviceHash)
    .maybeSingle<DeviceLockRow>();

  if (deviceLockError) {
    console.error("Error fetching device lock from Supabase:", deviceLockError);
    return { found: false, error: true };
  }

  if (!deviceLock) {
    return { found: false, error: false };
  }

  const { data: participation, error: participationError } = await client
    .from("participations")
    .select("id, reference, created_at, selected_slots_count")
    .eq("id", deviceLock.participation_id)
    .maybeSingle<{
      id: string;
      reference: string;
      created_at: string;
      selected_slots_count: number;
    }>();

  if (participationError) {
    console.error("Error fetching participation from Supabase:", participationError);
    return { found: false, error: true };
  }

  if (!participation) {
    return { found: false, error: false };
  }

  const { data: picks, error: picksError } = await client
    .from("participation_picks")
    .select("event_slug, male_external_key, female_external_key, winner_external_key")
    .eq("participation_id", participation.id);

  if (picksError) {
    console.error("Error fetching picks from Supabase:", picksError);
    return { found: false, error: true };
  }

  if (!cookieHash) {
    cookieStore.set(DEVICE_LOCK_COOKIE, deviceHash, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
  }

  const selections = buildSelectionsFromPicks((picks ?? []) as ParticipationPickRow[]);
  return {
    found: true,
    error: false,
    reference: participation.reference,
    selections,
    createdAt: participation.created_at,
    selectedSlotsCount:
      participation.selected_slots_count ?? countSelectedSlots(selections),
  };
}

export async function getParticipation(reference: string) {
  const normalizedReference = reference.trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    const db = readMockDb();
    return db.participations[normalizedReference] ?? null;
  }

  const client = getSupabaseServiceClient();
  const { data: participation, error: participationError } = await client
    .from("participations")
    .select("id, reference, delivered, created_at, selected_slots_count")
    .eq("reference", normalizedReference)
    .maybeSingle<ParticipationRow>();

  if (participationError || !participation) {
    return null;
  }

  const { data: picks, error: picksError } = await client
    .from("participation_picks")
    .select("event_slug, male_external_key, female_external_key, winner_external_key")
    .eq("participation_id", participation.id);

  if (picksError) {
    return null;
  }

  const selections = buildSelectionsFromPicks((picks ?? []) as ParticipationPickRow[]);

  return {
    reference: participation.reference,
    selections,
    delivered: participation.delivered,
    createdAt: participation.created_at,
    selectedSlotsCount: participation.selected_slots_count ?? countSelectedSlots(selections),
  };
}

export async function markDelivered(reference: string) {
  const normalizedReference = reference.trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    const db = readMockDb();
    const record = db.participations[normalizedReference];
    if (!record) return false;
    db.participations[normalizedReference] = { ...record, delivered: true };
    writeMockDb(db);
    return true;
  }

  const client = getSupabaseServiceClient();
  const { error } = await client
    .from("participations")
    .update({ delivered: true })
    .eq("reference", normalizedReference);

  return !error;
}

export async function getAthletePopularityStats(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) {
    return {
      dm1: 28, dm2: 42, dm3: 8, dm4: 15, dm5: 7,
      df1: 35, df2: 25, df3: 15, df4: 15, df5: 10,
      jm1: 40, jm2: 30, jm3: 12, jm4: 10, jm5: 8,
      jf1: 38, jf2: 24, jf3: 18, jf4: 12, jf5: 8,
    };
  }

  try {
    const client = getSupabaseServiceClient();
    const { data: picks, error } = await client
      .from("participation_picks")
      .select("event_slug, male_external_key, female_external_key");

    if (error || !picks) {
      return {};
    }

    const counts: Record<string, number> = {};
    const poolTotals: Record<string, number> = {};

    picks.forEach((pick) => {
      const event = pick.event_slug;
      if (pick.male_external_key) {
        const poolKey = `${event}-male`;
        counts[pick.male_external_key] = (counts[pick.male_external_key] || 0) + 1;
        poolTotals[poolKey] = (poolTotals[poolKey] || 0) + 1;
      }
      if (pick.female_external_key) {
        const poolKey = `${event}-female`;
        counts[pick.female_external_key] = (counts[pick.female_external_key] || 0) + 1;
        poolTotals[poolKey] = (poolTotals[poolKey] || 0) + 1;
      }
    });

    const stats: Record<string, number> = {};
    picks.forEach((pick) => {
      const event = pick.event_slug;
      if (pick.male_external_key) {
        const poolKey = `${event}-male`;
        const total = poolTotals[poolKey] || 1;
        stats[pick.male_external_key] = Math.round((counts[pick.male_external_key] / total) * 100);
      }
      if (pick.female_external_key) {
        const poolKey = `${event}-female`;
        const total = poolTotals[poolKey] || 1;
        stats[pick.female_external_key] = Math.round((counts[pick.female_external_key] / total) * 100);
      }
    });

    return stats;
  } catch (err) {
    console.error("Error fetching popularity stats:", err);
    return {};
  }
}

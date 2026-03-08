"use server";

import { createHash } from "crypto";
import { addMinutes, isAfter } from "date-fns";
import { cookies } from "next/headers";
import { EVENTS } from "@/lib/data";
import { getSupabaseServiceClient, isSupabaseConfigured } from "@/lib/supabase";

export type EventSelection = { maleId: string | null; femaleId: string | null };
export type SelectionsMap = Record<string, EventSelection>;

export type FullParticipationResult = {
  success: boolean;
  message?: string;
  reference?: string;
};

export type ExistingParticipationResult = {
  found: boolean;
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
};

type DeviceLockRow = {
  device_hash?: string;
  participation_id: string;
};

const mockParticipations = new Map<string, ParticipationRecord>();
const mockDeviceLocks = new Map<string, string>();
const DEVICE_LOCK_COOKIE = "rm_device_lock";
const DEVICE_LOCK_SECRET =
  process.env.DEVICE_LOCK_SECRET ?? "retomemorial-device-lock";

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
    const current = selections[event.slug] ?? { maleId: null, femaleId: null };
    acc[event.slug] = {
      maleId: current.maleId ?? null,
      femaleId: current.femaleId ?? null,
    };
    return acc;
  }, {} as SelectionsMap);
}

function buildSelectionsFromPicks(picks: ParticipationPickRow[]): SelectionsMap {
  const normalized = EVENTS.reduce((acc, event) => {
    acc[event.slug] = { maleId: null, femaleId: null };
    return acc;
  }, {} as SelectionsMap);

  for (const pick of picks) {
    if (!normalized[pick.event_slug]) continue;
    normalized[pick.event_slug] = {
      maleId: pick.male_external_key ?? null,
      femaleId: pick.female_external_key ?? null,
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

  const reference = (await generateUniqueReference()).toUpperCase();
  const selectedSlotsCount = countSelectedSlots(normalizedSelections);

  if (!isSupabaseConfigured()) {
    if (mockDeviceLocks.has(deviceHash)) {
      return {
        success: false,
        message: "Este dispositivo ya registró una apuesta.",
      };
    }

    mockParticipations.set(reference, {
      reference,
      selections: normalizedSelections,
      delivered: false,
      createdAt: new Date().toISOString(),
      selectedSlotsCount,
    });
    mockDeviceLocks.set(deviceHash, reference);
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
      winner_external_key: null as string | null,
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
    const reference = mockDeviceLocks.get(deviceHash);
    if (!reference) return { found: false };

    const record = mockParticipations.get(reference);
    if (!record) return { found: false };

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

  if (deviceLockError || !deviceLock) {
    return { found: false };
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

  if (participationError || !participation) {
    return { found: false };
  }

  const { data: picks, error: picksError } = await client
    .from("participation_picks")
    .select("event_slug, male_external_key, female_external_key")
    .eq("participation_id", participation.id);

  if (picksError) {
    return { found: false };
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
    return mockParticipations.get(normalizedReference) ?? null;
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
    .select("event_slug, male_external_key, female_external_key")
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
    const record = mockParticipations.get(normalizedReference);
    if (!record) return false;
    mockParticipations.set(normalizedReference, { ...record, delivered: true });
    return true;
  }

  const client = getSupabaseServiceClient();
  const { error } = await client
    .from("participations")
    .update({ delivered: true })
    .eq("reference", normalizedReference);

  return !error;
}

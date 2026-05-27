import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ATHLETES, type Athlete, type AthletesByEvent, type AthleteHighlightData, type AthleteWithMeta } from "@/lib/data";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

export function isSupabasePublicConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getSupabaseServiceClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Supabase no configurado. Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseAnonClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase no configurado para cliente público. Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

type AthleteRow = {
  id: string;
  external_key: string;
  event_slug: string;
  gender: string;
  name: string;
  mark: number;
  image_url: string;
  bio: string;
};

type HighlightRow = {
  id: string;
  athlete_id: string;
  tier: string;
  label: string;
  sort_order: number;
};

function rowToAthlete(row: AthleteRow): Athlete {
  return {
    id: row.external_key || row.id,
    name: row.name,
    mark: Number(row.mark),
    image: row.image_url,
  };
}

export function rowsToAthletesByEvent(rows: AthleteRow[]): AthletesByEvent {
  const result: AthletesByEvent = {};
  for (const row of rows) {
    if (!result[row.event_slug]) {
      result[row.event_slug] = { male: [], female: [] };
    }
    const bucket = row.gender === 'male'
      ? result[row.event_slug].male
      : result[row.event_slug].female;
    bucket.push(rowToAthlete(row));
  }
  for (const slug of Object.keys(result)) {
    result[slug].male.sort((a, b) => b.mark - a.mark);
    result[slug].female.sort((a, b) => b.mark - a.mark);
  }
  return result;
}

export function rowsToAthletesWithMeta(rows: AthleteRow[], highlights: HighlightRow[]): AthleteWithMeta[] {
  const idToExternalKey: Record<string, string> = {};
  for (const row of rows) {
    idToExternalKey[row.id] = row.external_key || row.id;
  }

  const highlightsByExternalKey: Record<string, AthleteHighlightData[]> = {};
  for (const h of highlights) {
    const key = idToExternalKey[h.athlete_id] ?? h.athlete_id;
    if (!highlightsByExternalKey[key]) {
      highlightsByExternalKey[key] = [];
    }
    highlightsByExternalKey[key].push({
      tier: h.tier as 'gold' | 'silver' | 'bronze',
      label: h.label,
      sortOrder: h.sort_order,
    });
  }

  return rows.map((row) => {
    const localId = row.external_key || row.id;
    return {
      id: localId,
      name: row.name,
      mark: Number(row.mark),
      image: row.image_url,
      eventSlug: row.event_slug,
      gender: row.gender as 'male' | 'female',
      bio: row.bio ?? '',
      highlights: (highlightsByExternalKey[localId] ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    };
  });
}

export async function fetchAthletesFromDB(): Promise<AthletesByEvent | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from('athletes')
      .select('id, external_key, event_slug, gender, name, mark, image_url, bio')
      .order('mark', { ascending: false });

    if (error || !data || data.length === 0) return null;
    return rowsToAthletesByEvent(data as AthleteRow[]);
  } catch {
    return null;
  }
}

export async function fetchAthletesWithMetaFromDB(): Promise<AthleteWithMeta[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseServiceClient();
    const [athletesResult, highlightsResult] = await Promise.all([
      client
        .from('athletes')
        .select('id, external_key, event_slug, gender, name, mark, image_url, bio')
        .order('mark', { ascending: false }),
      client
        .from('athlete_highlights')
        .select('id, athlete_id, tier, label, sort_order')
        .order('sort_order', { ascending: true }),
    ]);

    if (athletesResult.error || !athletesResult.data || athletesResult.data.length === 0) return null;
    const athletes = athletesResult.data as AthleteRow[];

    const idToExternalKey: Record<string, string> = {};
    for (const a of athletes) {
      idToExternalKey[a.id] = a.external_key;
    }

    const mappedHighlights = (highlightsResult.data ?? []).map((h: any) => ({
      ...h,
      athlete_id: idToExternalKey[h.athlete_id] ?? h.athlete_id,
    })) as HighlightRow[];

    return rowsToAthletesWithMeta(athletes, mappedHighlights);
  } catch {
    return null;
  }
}

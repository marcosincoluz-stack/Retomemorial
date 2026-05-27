import { EVENTS, getAthleteCostFromList, type AthletesByEvent } from "@/lib/data";

export type EventResultRow = {
  eventSlug: string;
  athleteId: string;
  mark: number | null;
  position: number | null;
};

export type AthleteScore = {
  athleteId: string;
  eventSlug: string;
  position: number;
  basePoints: number;
  beatsRetoMark: boolean;
  retoBonus: boolean;
  finalPoints: number;
  gender: "male" | "female";
  mark: number | null;
};

export type ParticipationPick = {
  eventSlug: string;
  maleExternalKey: string | null;
  femaleExternalKey: string | null;
  winnerExternalKey: string | null;
};

export function calculateEventScores(
  eventSlug: string,
  results: EventResultRow[],
  athletesByEvent: AthletesByEvent
): AthleteScore[] {
  const event = EVENTS.find((e) => e.slug === eventSlug);
  if (!event) return [];

  const eventAthletes = athletesByEvent[eventSlug];
  if (!eventAthletes) return [];

  const athleteGender: Record<string, "male" | "female"> = {};
  for (const athlete of eventAthletes.male) {
    athleteGender[athlete.id] = "male";
  }
  for (const athlete of eventAthletes.female) {
    athleteGender[athlete.id] = "female";
  }

  const resultByAthlete: Record<string, EventResultRow> = {};
  for (const r of results) {
    if (r.eventSlug === eventSlug) {
      resultByAthlete[r.athleteId] = r;
    }
  }

  const allEntries: {
    athleteId: string;
    mark: number | null;
    position: number | null;
    gender: "male" | "female";
  }[] = [];

  for (const athlete of [
    ...eventAthletes.male,
    ...eventAthletes.female,
  ]) {
    const result = resultByAthlete[athlete.id];
    if (
      result &&
      (
        result.position !== null ||
        (result.mark !== null && result.mark !== undefined)
      )
    ) {
      allEntries.push({
        athleteId: athlete.id,
        mark: result.mark,
        position: result.position,
        gender: athleteGender[athlete.id],
      });
    }
  }

  allEntries.sort((a, b) => {
    if (a.position !== null && b.position !== null) {
      return a.position - b.position;
    }

    if (a.position !== null) return -1;
    if (b.position !== null) return 1;

    const aMark = a.mark ?? Number.NEGATIVE_INFINITY;
    const bMark = b.mark ?? Number.NEGATIVE_INFINITY;
    return bMark - aMark;
  });

  return allEntries.map((entry, index) => {
    const position = entry.position ?? index + 1;
    const basePoints = position <= 12 ? 13 - position : 0;
    const gender = entry.gender;
    const markToBeat = event.markToBeat[gender] ?? 0;
    const beatsRetoMark = entry.mark !== null && entry.mark >= markToBeat;

    return {
      athleteId: entry.athleteId,
      eventSlug,
      position,
      basePoints,
      beatsRetoMark,
      retoBonus: false,
      finalPoints: basePoints,
      gender,
      mark: entry.mark,
    };
  });
}

export type ParticipationBreakdown = {
  totalScore: number;
  totalInvested: number;
  efficiency: number;
  events: Record<
    string,
    {
      male: {
        athleteId: string;
        points: number;
        retoBonus: boolean;
      } | null;
      female: {
        athleteId: string;
        points: number;
        retoBonus: boolean;
      } | null;
      winner: {
        athleteId: string;
        points: number;
        retoBonus: boolean;
      } | null;
    }
  >;
};

function isRealAthleteKey(value: string | null): value is string {
  return Boolean(value && value !== "none" && value !== "both");
}

export function calculateTotalInvested(
  picks: ParticipationPick[],
  athletesByEvent: AthletesByEvent
): number {
  return picks.reduce((total, pick) => {
    const eventPool = athletesByEvent[pick.eventSlug];
    const maleCost = isRealAthleteKey(pick.maleExternalKey)
      ? getAthleteCostFromList(pick.maleExternalKey, eventPool)
      : 0;
    const femaleCost = isRealAthleteKey(pick.femaleExternalKey)
      ? getAthleteCostFromList(pick.femaleExternalKey, eventPool)
      : 0;

    return total + maleCost + femaleCost;
  }, 0);
}

export function calculateParticipationScore(
  picks: ParticipationPick[],
  scoresByEvent: Record<string, AthleteScore[]>,
  athletesByEvent: AthletesByEvent
): ParticipationBreakdown {
  let totalScore = 0;
  const events: ParticipationBreakdown["events"] = {};
  const totalInvested = calculateTotalInvested(picks, athletesByEvent);

  for (const pick of picks) {
    const scores = scoresByEvent[pick.eventSlug] ?? [];
    const scoreMap = new Map(scores.map((s) => [s.athleteId, s]));

    const getScore = (id: string | null) => {
      if (!isRealAthleteKey(id)) return null;
      const s = scoreMap.get(id);
      if (!s) return null;

      const isSelectedReto = pick.winnerExternalKey === id || pick.winnerExternalKey === "both";
      const retoBonus = isSelectedReto && s.beatsRetoMark;
      const points = retoBonus ? s.basePoints * 2 : s.basePoints;

      return { athleteId: id, points, retoBonus };
    };

    const maleScore = getScore(pick.maleExternalKey);
    const femaleScore = getScore(pick.femaleExternalKey);
    const winnerScore = isRealAthleteKey(pick.winnerExternalKey)
      ? getScore(pick.winnerExternalKey)
      : pick.winnerExternalKey === "both"
        ? { athleteId: "both", points: 0, retoBonus: Boolean(maleScore?.retoBonus || femaleScore?.retoBonus) }
        : null;

    if (maleScore) totalScore += maleScore.points;
    if (femaleScore) totalScore += femaleScore.points;

    events[pick.eventSlug] = {
      male: maleScore,
      female: femaleScore,
      winner: winnerScore ? { ...winnerScore, points: 0 } : null,
    };
  }

  const efficiency = totalInvested > 0 ? (totalScore / totalInvested) * 100 : 0;

  return { totalScore, totalInvested, efficiency, events };
}

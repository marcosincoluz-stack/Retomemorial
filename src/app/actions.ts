"use server";

import { EVENTS } from "@/lib/data";
import { generateReferenceNumber } from "@/lib/utils";
import { addMinutes, isAfter, isBefore, } from "date-fns";

export type ParticipationResult = {
    success: boolean;
    message?: string;
    reference?: string;
};

// Mock database for checking sequence
let sequenceCounter = {
    disco: 487,
    jabalina: 112,
    longitud: 305,
};

export async function validateAndTimeCheck(eventSlug: string): Promise<{
    allowed: boolean;
    reason?: string;
    serverTime?: string;
}> {
    const event = EVENTS.find((e) => e.slug === eventSlug);
    if (!event) {
        return { allowed: false, reason: "Evento no encontrado." };
    }

    const now = new Date();
    const startTime = new Date(event.startTime);
    const closeTime = addMinutes(startTime, 15);

    // In a real scenario, we might also want to check if it has *started* yet,
    // but the requirement only mentions "close_time = start_time + 15 min".
    // Assuming users can participate *before* it starts too?
    // "Regla: el usuario puede participar hasta 15 minutos despu\u00e9s del inicio oficial"
    // Usually this implies window is Open until Start+15. 

    if (isAfter(now, closeTime)) {
        return { allowed: false, reason: "El plazo de participaci\u00f3n ha finalizado." };
    }

    return { allowed: true, serverTime: now.toISOString() };
}

export async function submitParticipation(
    eventSlug: string,
    maleAthleteId: string,
    femaleAthleteId: string
): Promise<ParticipationResult> {
    const validation = await validateAndTimeCheck(eventSlug);
    if (!validation.allowed) {
        return { success: false, message: validation.reason };
    }

    // Generate Reference
    // In a real app, this would be a DB transaction
    const seq = (sequenceCounter as any)[eventSlug] || 1;
    (sequenceCounter as any)[eventSlug] = seq + 1;

    const ref = generateReferenceNumber(eventSlug, seq);

    // Here save to DB...
    console.log(`Saving participation: ${eventSlug}, ${maleAthleteId}, ${femaleAthleteId}, ${ref}`);

    return { success: true, reference: ref };
}

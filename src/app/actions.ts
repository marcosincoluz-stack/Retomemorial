"use server";

import { EVENTS } from "@/lib/data";
import { generateReferenceNumber } from "@/lib/utils";
import { addMinutes, isAfter, isBefore, } from "date-fns";

export type FullParticipationResult = {
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

// Mock participations DB
let mockParticipations: any[] = [];

export async function submitFullParticipation(
    selections: Record<string, { maleId: string | null; femaleId: string | null }>
): Promise<FullParticipationResult> {
    // Check if all are selected (3 events * 2 athletes = 6)
    const allSelected = EVENTS.every(event =>
        selections[event.slug]?.maleId && selections[event.slug]?.femaleId
    );

    if (!allSelected) {
        return { success: false, message: "Debes seleccionar todos los atletas." };
    }

    // Check time for all events
    for (const event of EVENTS) {
        const validation = await validateAndTimeCheck(event.slug);
        if (!validation.allowed) {
            return { success: false, message: `El evento ${event.name} ha cerrado.` };
        }
    }

    // Generate Unified Reference
    const seq = Object.values(sequenceCounter).reduce((a, b) => a + b, 0);
    const ref = `RM-${seq.toString().padStart(4, '0')}`;

    // Save to Mock DB
    mockParticipations.push({
        reference: ref,
        selections,
        delivered: false,
        createdAt: new Date().toISOString()
    });

    console.log(`Saving full participation: ${ref}`, selections);

    return { success: true, reference: ref };
}

export async function getParticipation(ref: string) {
    const part = mockParticipations.find(p => p.reference === ref);
    if (!part) return null;
    return part;
}

export async function markDelivered(ref: string) {
    const part = mockParticipations.find(p => p.reference === ref);
    if (part) {
        part.delivered = true;
        return true;
    }
    return false;
}

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
    // Allow partial participation: at least one slot must be selected.
    const selectedEventSlugs = EVENTS.filter((event) => {
        const eventSelection = selections[event.slug];
        return Boolean(eventSelection?.maleId || eventSelection?.femaleId);
    }).map((event) => event.slug);

    if (selectedEventSlugs.length === 0) {
        return { success: false, message: "Debes seleccionar al menos un atleta." };
    }

    // Validate time only for events where the user picked at least one athlete.
    for (const eventSlug of selectedEventSlugs) {
        const event = EVENTS.find((item) => item.slug === eventSlug);
        if (!event) continue;
        const validation = await validateAndTimeCheck(event.slug);
        if (!validation.allowed) {
            return { success: false, message: `El evento ${event.name} ha cerrado.` };
        }
    }

    // Normalize payload to known event keys for downstream consumers.
    const normalizedSelections = EVENTS.reduce((acc, event) => {
        const current = selections[event.slug] ?? { maleId: null, femaleId: null };
        acc[event.slug] = {
            maleId: current.maleId ?? null,
            femaleId: current.femaleId ?? null,
        };
        return acc;
    }, {} as Record<string, { maleId: string | null; femaleId: string | null }>);

    // Generate Unified Reference
    const seq = Object.values(sequenceCounter).reduce((a, b) => a + b, 0);
    const ref = `RM-${seq.toString().padStart(4, '0')}`;

    // Save to Mock DB
    mockParticipations.push({
        reference: ref,
        selections: normalizedSelections,
        delivered: false,
        createdAt: new Date().toISOString()
    });

    console.log(`Saving full participation: ${ref}`, normalizedSelections);

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

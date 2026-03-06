"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { EVENTS, ATHLETES } from "@/lib/data";
import { submitFullParticipation } from "@/app/actions";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { motion, AnimatePresence } from "framer-motion";
import { MoveLeft, Plus, Check, Lock, Search, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

const loadingStates = [
    { text: "Registrando tu equipo unificado..." },
    { text: "Verificando los 6 atletas seleccionados..." },
    { text: "Generando tu boleto premium..." },
    { text: "Preparando acceso VIP..." },
    { text: "¡Todo listo! Tu apuesta ha sido registrada. 🎟️" },
];

type AthleteSlotData = {
    name: string;
    image: string;
};

type AthletePreviewData = {
    id: string;
    name: string;
    image: string;
    mark: number;
    bio: string;
    highlights: AthleteHighlight[];
    eventName: string;
    genderKey: "male" | "female";
    genderLabel: "M" | "F";
};

type HighlightTier = "gold" | "silver" | "bronze";

type AthleteHighlight = {
    tier: HighlightTier;
    label: string;
};

const ATHLETE_BIOS: Record<string, string> = {
    dm1: "Discóbolo riojano de La Rioja Atletismo. En marzo de 2025 fue bronce absoluto de España con 61,15 m y oro sub-23 en el Nacional de Lanzamientos de Invierno. También compitió internacionalmente en categorías sub-20 y sub-23.",
    dm2: "Especialista hispano-cubano del Tenerife CajaCanarias. Campeón de España absoluto de disco en 2021, 2023 y 2025; en 2025 ganó con 64,53 m y récord del campeonato. Fue oro europeo sub-18 y sub-20, y doble bronce europeo sub-23.",
    dm3: "Discóbolo universitario (UC3M) en progresión dentro del circuito nacional. Figura en el Campeonato de España Universitario 2024 en disco (2 kg), compitiendo en categoría masculina.",
    dm4: "Lanzador ucraniano afincado en Logroño, habitual en competiciones nacionales con Atletismo Numantino. En 2025 fue subcampeón sub-23 en el Nacional de Invierno (54,68 m) y 4.º en el Europeo sub-23 con 59,85 m.",
    dm5: "Atleta del Trops-Cueva de Nerja especializado en disco. Fue campeón de España sub-20 en 2025 (49,76 m) y posteriormente campeón de España sub-23 (53,61 m), además de entrar en la preselección española sub-23 para la Copa de Europa de Lanzamientos 2026.",
};

const ATHLETE_HIGHLIGHTS: Record<string, AthleteHighlight[]> = {
    dm1: [
        { tier: "gold", label: "Oro sub-23 en invierno (2025)" },
        { tier: "bronze", label: "Bronce de España absoluto (2025)" },
        { tier: "silver", label: "Marca destacada: 61,15 m" },
    ],
    dm2: [
        { tier: "gold", label: "Campeón de España absoluto (2021, 2023, 2025)" },
        { tier: "silver", label: "Récord de campeonato: 64,53 m (2025)" },
        { tier: "bronze", label: "Doble bronce europeo sub-23" },
    ],
    dm3: [
        { tier: "gold", label: "Participación en CEU 2024 (disco 2 kg)" },
        { tier: "silver", label: "Proyección dentro del circuito nacional" },
        { tier: "bronze", label: "Perfil universitario competitivo" },
    ],
    dm4: [
        { tier: "gold", label: "4.º en Europeo sub-23 (2025)" },
        { tier: "silver", label: "Subcampeón de España sub-23 (2025)" },
        { tier: "silver", label: "Plata nacional de invierno (54,68 m)" },
    ],
    dm5: [
        { tier: "gold", label: "Campeón de España sub-23 (2025)" },
        { tier: "silver", label: "Campeón de España sub-20 (2025)" },
        { tier: "bronze", label: "Preselección Copa de Europa 2026" },
    ],
};

const MEDAL_META: Record<HighlightTier, { badge: string; cardClass: string; badgeClass: string; iconClass: string }> = {
    gold: {
        badge: "ORO",
        cardClass: "border-amber-300/25 bg-amber-300/[0.06]",
        badgeClass: "bg-amber-300/20 text-amber-100 border border-amber-200/35",
        iconClass: "text-amber-200",
    },
    silver: {
        badge: "PLATA",
        cardClass: "border-slate-200/20 bg-slate-200/[0.05]",
        badgeClass: "bg-slate-200/18 text-slate-100 border border-slate-200/30",
        iconClass: "text-slate-200",
    },
    bronze: {
        badge: "BRONCE",
        cardClass: "border-orange-300/20 bg-orange-300/[0.05]",
        badgeClass: "bg-orange-300/18 text-orange-100 border border-orange-200/30",
        iconClass: "text-orange-200",
    },
};

type BurstRect = {
    x: number;
    y: number;
    w: number;
    h: number;
};

type SelectionBurst = {
    id: string;
    athlete: AthleteSlotData;
    eventSlug: string;
    genderKey: "male" | "female";
    athleteId: string;
    gender: "M" | "F";
    from: BurstRect;
    to: BurstRect;
};

export default function UnifiedSelectionPage() {
    const router = useRouter();
    const athleteListRef = useRef<HTMLElement | null>(null);
    const slotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const burstCounterRef = useRef(0);

    const [activeEventSlug, setActiveEventSlug] = useState<string>('disco');
    const [genderFilter, setGenderFilter] = useState<"male" | "female">("male");

    const [selections, setSelections] = useState<Record<string, { maleId: string | null; femaleId: string | null }>>({
        disco: { maleId: null, femaleId: null },
        jabalina: { maleId: null, femaleId: null },
        longitud: { maleId: null, femaleId: null },
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectionBurst, setSelectionBurst] = useState<SelectionBurst | null>(null);
    const [previewAthlete, setPreviewAthlete] = useState<AthletePreviewData | null>(null);

    const activeEvent = EVENTS.find(e => e.slug === activeEventSlug) || EVENTS[0];
    const eventAthletes = ATHLETES[activeEventSlug as keyof typeof ATHLETES];

    const filteredAthletes = useMemo(() => {
        if (!eventAthletes) return [];
        const pool = genderFilter === 'male' ? eventAthletes.male : eventAthletes.female;
        return pool.filter(athlete =>
            athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [eventAthletes, searchQuery, genderFilter]);

    const selectedAthleteId = useMemo(() => {
        const currentSelection = selections[activeEventSlug];
        return genderFilter === "male" ? currentSelection.maleId : currentSelection.femaleId;
    }, [selections, activeEventSlug, genderFilter]);

    useEffect(() => {
        athleteListRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }, [activeEventSlug, genderFilter]);

    const handleToggleAthlete = (id: string) => {
        if (selectionBurst) return;

        const isSelecting = selectedAthleteId !== id;

        if (isSelecting && typeof window !== "undefined") {
            const pool = genderFilter === "male" ? eventAthletes?.male : eventAthletes?.female;
            const athlete = pool?.find((candidate) => candidate.id === id);
            const slotKey = `${activeEventSlug}-${genderFilter}`;
            const destination = slotRefs.current[slotKey]?.getBoundingClientRect();

            if (athlete && destination) {
                const vw = window.innerWidth;
                const vh = window.innerHeight;
                const cardAspect = 1.32;
                const preferredW = Math.min(vw * 0.86, 430);
                const preferredH = preferredW * cardAspect;
                const startH = Math.min(vh * 0.78, preferredH);
                const startW = startH / cardAspect;

                setSelectionBurst({
                    id: `${id}-${burstCounterRef.current++}`,
                    athlete: { name: athlete.name, image: athlete.image },
                    eventSlug: activeEventSlug,
                    genderKey: genderFilter,
                    athleteId: id,
                    gender: genderFilter === "male" ? "M" : "F",
                    from: {
                        x: (vw - startW) / 2,
                        y: Math.max(14, (vh - startH) / 2 - 24),
                        w: startW,
                        h: startH,
                    },
                    to: {
                        x: destination.left,
                        y: destination.top,
                        w: destination.width,
                        h: destination.height,
                    },
                });
                return;
            }
        }

        setSelections(prev => {
            const current = { ...prev[activeEventSlug] };
            if (genderFilter === 'male') {
                current.maleId = current.maleId === id ? null : id;
            } else {
                current.femaleId = current.femaleId === id ? null : id;
            }
            return { ...prev, [activeEventSlug]: current };
        });
    };

    const isComplete = useMemo(() => {
        return EVENTS.every(e => selections[e.slug].maleId && selections[e.slug].femaleId);
    }, [selections]);

    const isPreviewSelected = useMemo(() => {
        if (!previewAthlete) return false;
        const isPendingSelected = Boolean(
            selectionBurst &&
            selectionBurst.eventSlug === activeEventSlug &&
            selectionBurst.genderKey === genderFilter &&
            selectionBurst.athleteId === previewAthlete.id
        );
        return selectedAthleteId === previewAthlete.id || isPendingSelected;
    }, [previewAthlete, selectionBurst, activeEventSlug, genderFilter, selectedAthleteId]);

    const handleSelectFromPreview = () => {
        if (!previewAthlete) return;
        const athleteId = previewAthlete.id;
        setPreviewAthlete(null);
        handleToggleAthlete(athleteId);
    };

    const handleConfirm = async () => {
        if (!isComplete) return;
        setLoading(true);
    };

    const onLoaderComplete = async () => {
        try {
            const result = await submitFullParticipation(selections);
            if (result.success && result.reference) {
                window.location.href = `/confirmation/${result.reference}`;
            } else {
                setLoading(false);
                setErrorMsg(result.message || "Error al registrar.");
            }
        } catch {
            setLoading(false);
            setErrorMsg("Error de conexión.");
        }
    };

    const getAthleteById = (id: string | null, event: string, gender: 'male' | 'female'): AthleteSlotData | null => {
        if (!id) return null;
        const athletes = ATHLETES[event as keyof typeof ATHLETES];
        return athletes[gender].find(a => a.id === id) ?? null;
    };

    return (
        <main className="h-[100dvh] bg-[#0A0A0A] text-white font-sans antialiased selection:bg-zinc-800 overflow-hidden overscroll-none">
            <div className="relative h-full flex flex-col">
                {/* Header - Centered Layout */}
                <header className="sticky top-0 z-50 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.25rem)] sm:pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-1.5 sm:pb-3 bg-[#0A0A0A]/95 backdrop-blur-md flex items-center justify-between gap-2">
                    <button
                        onClick={() => router.back()}
                        className="size-9 sm:size-10 flex items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10 border border-white/5 active:scale-95"
                    >
                        <MoveLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>

                    <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-semibold text-zinc-500 tracking-tight">5/6</span>
                        <div className="flex gap-1 items-center">
                            {[1, 2, 3, 4, 5, 6].map((dot) => (
                                <div
                                    key={dot}
                                    className={cn(
                                        "h-[3px] w-3 rounded-full transition-all duration-300",
                                        dot <= 5 ? "bg-zinc-100" : "bg-zinc-800"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </header>

                {/* Team Grid - 6 independent stickers */}
                <section className="px-4 sm:px-6 my-1.5 sm:my-4 relative z-10">
                    <div className="relative z-10 grid grid-cols-3 gap-1.5 sm:gap-3 mb-1.5 sm:mb-2">
                        {EVENTS.map((event) => (
                            <span
                                key={event.slug}
                                className={cn(
                                    "text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] text-center transition-colors duration-300",
                                    activeEventSlug === event.slug ? "text-white" : "text-zinc-600"
                                )}
                            >
                                {event.name}
                            </span>
                        ))}
                    </div>

                    <div className="relative z-10 grid grid-cols-3 gap-1.5 sm:gap-3 [perspective:1200px]">
                        {EVENTS.map((event, index) => (
                            <AthleteSlot
                                key={`${event.slug}-male`}
                                athlete={getAthleteById(selections[event.slug].maleId, event.slug, "male")}
                                gender="M"
                                isActive={activeEventSlug === event.slug && genderFilter === "male"}
                                floatIndex={index}
                                slotRef={(node) => {
                                    slotRefs.current[`${event.slug}-male`] = node;
                                }}
                                onClick={() => {
                                    setActiveEventSlug(event.slug);
                                    setGenderFilter("male");
                                }}
                            />
                        ))}

                        {EVENTS.map((event, index) => (
                            <AthleteSlot
                                key={`${event.slug}-female`}
                                athlete={getAthleteById(selections[event.slug].femaleId, event.slug, "female")}
                                gender="F"
                                isActive={activeEventSlug === event.slug && genderFilter === "female"}
                                floatIndex={index + 3}
                                slotRef={(node) => {
                                    slotRefs.current[`${event.slug}-female`] = node;
                                }}
                                onClick={() => {
                                    setActiveEventSlug(event.slug);
                                    setGenderFilter("female");
                                }}
                            />
                        ))}
                    </div>
                </section>

                {/* Gender + Search Row */}
                <div className="px-4 mb-1.5 sm:mb-3 pt-0.5">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                        <div className="flex p-1 bg-[#141414] rounded-[16px] border border-white/5 shadow-inner">
                            <button
                                onClick={() => setGenderFilter('male')}
                                className={cn(
                                    "px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-[12px] text-[12px] sm:text-[13px] font-bold transition-all duration-300 whitespace-nowrap",
                                    genderFilter === 'male' ? "bg-[#252525] text-white shadow-md ring-1 ring-white/5" : "text-zinc-600 hover:text-white/60"
                                )}
                            >
                                Masculino
                            </button>
                            <button
                                onClick={() => setGenderFilter('female')}
                                className={cn(
                                    "px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-[12px] text-[12px] sm:text-[13px] font-bold transition-all duration-300 whitespace-nowrap",
                                    genderFilter === 'female' ? "bg-[#252525] text-white shadow-md ring-1 ring-white/5" : "text-zinc-600 hover:text-white/60"
                                )}
                            >
                                Femenina
                            </button>
                        </div>

                        <label className="h-10 w-[120px] sm:w-[138px] rounded-[14px] border border-white/10 bg-[#121212] flex items-center gap-1.5 px-2.5 text-zinc-300 focus-within:border-white/20 focus-within:bg-[#171717] transition-colors">
                            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar"
                                className="w-full bg-transparent border-0 outline-none text-[16px] sm:text-[13px] text-zinc-200 placeholder:text-zinc-600"
                            />
                        </label>
                    </div>
                </div>

                {/* Athlete List Section - Bubble Cards */}
                <section ref={athleteListRef} className="px-4 sm:px-6 flex flex-col flex-1 min-h-0 relative z-10 overflow-y-auto ios-scroll overscroll-contain pb-20 sm:pb-24">
                    <div className="space-y-2.5 sm:space-y-3">
                        {filteredAthletes.map((athlete) => {
                            const isPendingSelected = Boolean(
                                selectionBurst &&
                                selectionBurst.eventSlug === activeEventSlug &&
                                selectionBurst.genderKey === genderFilter &&
                                selectionBurst.athleteId === athlete.id
                            );
                            const isSelected = selectedAthleteId === athlete.id || isPendingSelected;
                            return (
                                <div
                                    key={`${genderFilter}-${athlete.id}`}
                                    className={cn(
                                        "p-2 sm:p-2.5 rounded-[22px] sm:rounded-[28px] flex items-center gap-2.5 sm:gap-3 bg-[#0d0d0d] border transition-all duration-300 group",
                                        isSelected ? "border-white/10 bg-[#141414]" : "border-white/5"
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setPreviewAthlete({
                                            id: athlete.id,
                                            name: athlete.name,
                                            image: athlete.image,
                                            mark: athlete.mark,
                                            bio: ATHLETE_BIOS[athlete.id] ?? `Atleta especialista en ${activeEvent.name.toLowerCase()} con enfoque competitivo y regularidad en grandes eventos.`,
                                            highlights: ATHLETE_HIGHLIGHTS[athlete.id] ?? [
                                                { tier: "gold", label: "Rendimiento consistente en temporada" },
                                                { tier: "silver", label: "Competidor habitual en pruebas oficiales" },
                                                { tier: "bronze", label: `Mejor marca registrada: ${athlete.mark.toFixed(2)} m` },
                                            ],
                                            eventName: activeEvent.name,
                                            genderKey: genderFilter,
                                            genderLabel: genderFilter === "male" ? "M" : "F",
                                        })}
                                        className="relative p-0.5 rounded-[18px] border border-white/10 group-hover:border-white/20 transition-colors"
                                    >
                                        <img src={athlete.image} alt={athlete.name} className="size-12 sm:size-14 rounded-[12px] sm:rounded-[14px] object-cover saturate-[1.12] transition-all duration-500" />
                                    </button>
                                    <div className="flex-1 px-1">
                                        <p className="font-bold text-[15px] sm:text-base leading-tight tracking-tight text-white/90">{athlete.name}</p>
                                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.12em] mt-1 flex items-center gap-1">
                                            {activeEvent.name} <span className="size-1 rounded-full bg-zinc-800" /> {athlete.mark}m
                                        </p>
                                    </div>
                                    <button
                                        disabled={Boolean(selectionBurst)}
                                        onClick={() => handleToggleAthlete(athlete.id)}
                                        className={cn(
                                            "size-9 sm:size-10 rounded-full flex items-center justify-center transition-all duration-250 active:scale-95",
                                            selectionBurst && "pointer-events-none opacity-60",
                                            isSelected
                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                                : "bg-transparent border border-white/15 text-white/65 hover:border-white/28 hover:text-white/85"
                                        )}
                                    >
                                        {isSelected ? <Check className="w-5 h-5" strokeWidth={3} /> : <Plus className="w-5 h-5" strokeWidth={1.8} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {filteredAthletes.length === 0 && (
                        <div className="py-20 text-center opacity-40">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No se hallaron atletas</p>
                        </div>
                    )}
                </section>

                {/* Sticky Footer CTA - Centered Pill */}
                <div className="absolute bottom-0 inset-x-0 px-4 sm:px-8 pt-3 sm:pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.85rem)] sm:pb-[calc(env(safe-area-inset-bottom,0px)+1.1rem)] bg-gradient-to-t from-black via-black/90 to-transparent z-50">
                    {errorMsg && (
                        <p className="mb-3 text-center text-xs font-medium text-red-400">{errorMsg}</p>
                    )}
                    <button
                        disabled={!isComplete}
                        onClick={handleConfirm}
                        className={cn(
                            "w-full h-14 sm:h-14 rounded-[36px] font-black text-[15px] sm:text-[16px] uppercase tracking-[0.2em] sm:tracking-widest flex items-center justify-center gap-3 transition-all duration-500",
                            isComplete
                                ? "bg-white text-black active:scale-[0.98] opacity-100"
                                : "bg-[#444444] text-black/40 cursor-not-allowed opacity-80"
                        )}
                    >
                        Confirmar Todo
                        {!isComplete && <Lock className="w-4 h-4 mb-0.5" />}
                    </button>
                </div>
            </div>

            <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={1000} onComplete={onLoaderComplete} />

            <AnimatePresence>
                {selectionBurst && (
                    <motion.div className="pointer-events-none fixed inset-0 z-[120]" style={{ perspective: 1600 }}>
                        <motion.div
                            initial={{
                                left: selectionBurst.from.x,
                                top: selectionBurst.from.y,
                                width: selectionBurst.from.w,
                                height: selectionBurst.from.h,
                                borderRadius: 22,
                                opacity: 1,
                                rotateX: -26,
                                rotateY: 18,
                                rotateZ: -2,
                                scale: 1,
                                boxShadow: "0 40px 110px rgba(0,0,0,0.72)",
                            }}
                            animate={{
                                left: [
                                    selectionBurst.from.x,
                                    selectionBurst.from.x + 3,
                                    selectionBurst.from.x + (selectionBurst.to.x - selectionBurst.from.x) * 0.48 + 20,
                                    selectionBurst.to.x - 6,
                                    selectionBurst.to.x,
                                ],
                                top: [
                                    selectionBurst.from.y,
                                    selectionBurst.from.y - 2,
                                    selectionBurst.from.y + (selectionBurst.to.y - selectionBurst.from.y) * 0.45 - 28,
                                    selectionBurst.to.y + 3,
                                    selectionBurst.to.y,
                                ],
                                width: [
                                    selectionBurst.from.w,
                                    selectionBurst.from.w,
                                    selectionBurst.from.w * 0.88,
                                    selectionBurst.to.w * 1.02,
                                    selectionBurst.to.w,
                                ],
                                height: [
                                    selectionBurst.from.h,
                                    selectionBurst.from.h,
                                    selectionBurst.from.h * 0.88,
                                    selectionBurst.to.h * 1.02,
                                    selectionBurst.to.h,
                                ],
                                borderRadius: [22, 22, 20, 15, 14],
                                opacity: 1,
                                rotateX: [-26, -22, 16, -5, 0],
                                rotateY: [18, 15, -16, 6, 0],
                                rotateZ: [-2, -1, 2.4, -0.8, 0],
                                scale: [1, 1, 1, 1, 1],
                                boxShadow: [
                                    "0 40px 110px rgba(0,0,0,0.72)",
                                    "0 42px 114px rgba(0,0,0,0.74)",
                                    "0 24px 76px rgba(0,0,0,0.62)",
                                    "0 14px 38px rgba(0,0,0,0.5)",
                                    "0 8px 22px rgba(0,0,0,0.38)",
                                ],
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.92,
                                times: [0, 0.18, 0.62, 0.86, 1],
                                ease: [0.2, 0.92, 0.25, 1],
                            }}
                            onAnimationComplete={() => {
                                setSelections((prev) => {
                                    const current = { ...prev[selectionBurst.eventSlug] };
                                    if (selectionBurst.genderKey === "male") {
                                        current.maleId = selectionBurst.athleteId;
                                    } else {
                                        current.femaleId = selectionBurst.athleteId;
                                    }
                                    return { ...prev, [selectionBurst.eventSlug]: current };
                                });
                                if (typeof window !== "undefined") {
                                    window.requestAnimationFrame(() => setSelectionBurst(null));
                                } else {
                                    setSelectionBurst(null);
                                }
                            }}
                            className="absolute overflow-hidden border border-white/20 bg-[#111111]"
                            style={{ transformStyle: "preserve-3d", transformPerspective: 1600, transformOrigin: "center center", willChange: "transform,left,top,width,height" }}
                        >
                            <motion.div
                                className="absolute inset-0 p-1"
                                animate={{
                                    rotateX: [0, 0, 8, -2, 0],
                                    rotateY: [0, 0, -9, 3, 0],
                                    y: [0, 0, -8, 2, 0],
                                }}
                                transition={{
                                    duration: 0.92,
                                    times: [0, 0.18, 0.62, 0.86, 1],
                                    ease: [0.2, 0.92, 0.25, 1],
                                }}
                                style={{ transformStyle: "preserve-3d" }}
                            >
                                <div className="flex h-full w-full flex-col rounded-[12px] border-0 bg-[#1F2121] p-1.5">
                                    <div className="mx-0.5 flex-1 min-h-0">
                                        <motion.div
                                            className="relative h-full w-full"
                                            animate={{
                                                scale: [1.03, 1.03, 1.01, 1, 1],
                                                rotateZ: [0, 0, -0.8, 0.3, 0],
                                            }}
                                            transition={{
                                                duration: 0.92,
                                                times: [0, 0.18, 0.62, 0.86, 1],
                                                ease: [0.2, 0.92, 0.25, 1],
                                            }}
                                            style={{ transform: "translateZ(8px)" }}
                                        >
                                        <img
                                            src={selectionBurst.athlete.image}
                                            alt={selectionBurst.athlete.name}
                                            className="absolute inset-0 h-full w-full rounded-[10px] bg-[#000000] object-cover saturate-[1.15]"
                                        />
                                        <div className="absolute inset-0 rounded-[10px] bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                                        </motion.div>
                                    </div>
                                    <motion.div
                                        className="mt-1 flex flex-shrink-0 items-center justify-between px-1 pb-0.5 pt-0.5 font-mono text-white"
                                        animate={{
                                            y: [0, 0, 5, -1, 0],
                                            rotateX: [0, 0, -7, 2, 0],
                                        }}
                                        transition={{
                                            duration: 0.92,
                                            times: [0, 0.18, 0.62, 0.86, 1],
                                            ease: [0.2, 0.92, 0.25, 1],
                                        }}
                                        style={{ transform: "translateZ(24px)" }}
                                    >
                                        <span className="text-[8px] font-semibold truncate pr-2">{selectionBurst.athlete.name.split(" ")[0]}</span>
                                        <span className="text-[8px] text-gray-300 opacity-70">#{selectionBurst.gender}</span>
                                    </motion.div>
                                </div>

                                <motion.div
                                    className="absolute top-1.5 right-1.5 size-4 sm:size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
                                    animate={{
                                        x: [0, 0, -6, 2, 0],
                                        y: [0, 0, 6, -2, 0],
                                        rotateZ: [0, 0, 9, -3, 0],
                                        scale: [1, 1, 0.92, 1.02, 1],
                                    }}
                                    transition={{
                                        duration: 0.92,
                                        times: [0, 0.18, 0.62, 0.86, 1],
                                        ease: [0.2, 0.92, 0.25, 1],
                                    }}
                                    style={{ transform: "translateZ(36px)" }}
                                >
                                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3.6} />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {previewAthlete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[130] bg-black"
                    >
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[220px] sm:h-[280px] bg-white/10 blur-[92px] rounded-full mix-blend-screen pointer-events-none" />

                        <div className="relative h-full overflow-y-auto ios-scroll pb-28">
                            <header className="sticky top-0 z-40 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-3 flex items-center justify-between bg-transparent">
                                <button
                                    type="button"
                                    onClick={() => setPreviewAthlete(null)}
                                    className="size-9 sm:size-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white transition hover:bg-white/10"
                                >
                                    <MoveLeft className="w-4 h-4" />
                                </button>
                                <div className="size-9 sm:size-10" />
                            </header>

                            <section className="-mt-8 sm:-mt-12">
                                <div className="w-full h-[40vh] min-h-[250px] max-h-[350px] sm:h-auto sm:aspect-[4/5] relative">
                                    <img
                                        src={previewAthlete.image}
                                        alt={previewAthlete.name}
                                        className="w-full h-full object-cover object-top saturate-[1.15]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
                                    <div className="absolute bottom-4 left-4 right-4 sm:bottom-6">
                                        <h2 className="text-[30px] sm:text-4xl font-bold tracking-tight text-white leading-none">{previewAthlete.name}</h2>
                                        <p className="mt-1 text-[12px] sm:text-[14px] font-medium text-white/70 tracking-wide uppercase">
                                            {previewAthlete.eventName}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-4 pt-4 pb-5 sm:py-6 flex flex-col gap-4 sm:gap-5">
                                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                                        <div className="rounded-[16px] p-3.5 sm:p-4 h-[80px] sm:h-[90px] border border-white/10 bg-white/[0.05] backdrop-blur-md flex flex-col justify-center gap-1">
                                            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Mejor Marca</span>
                                            <span className="text-[24px] sm:text-2xl font-bold text-white tracking-tight leading-none">
                                                {previewAthlete.mark.toFixed(2)}
                                                <span className="text-[16px] sm:text-lg text-white/50">m</span>
                                            </span>
                                        </div>
                                        <div className="rounded-[16px] p-3.5 sm:p-4 h-[80px] sm:h-[90px] border border-white/10 bg-white/[0.05] backdrop-blur-md flex flex-col justify-center gap-1">
                                            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Categoría</span>
                                            <span className="text-[13px] sm:text-sm font-bold text-white tracking-tight leading-tight">
                                                {previewAthlete.genderLabel === "M" ? "Masculina" : "Femenina"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[13px] font-semibold text-white">Logros</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {previewAthlete.highlights.slice(0, 3).map((item, idx) => {
                                                const meta = MEDAL_META[item.tier];
                                                return (
                                                    <div
                                                        key={`${previewAthlete.id}-hl-${idx}`}
                                                        className={cn(
                                                            "rounded-[14px] px-3 py-2.5 flex flex-col gap-2",
                                                            meta.cardClass
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className={cn("inline-flex h-5 px-2 rounded-full text-[10px] font-black tracking-[0.08em] items-center", meta.badgeClass)}>
                                                                {meta.badge}
                                                            </span>
                                                            <Medal className={cn("w-3.5 h-3.5", meta.iconClass)} />
                                                        </div>
                                                        <p className="text-[12px] leading-snug text-white/85">{item.label}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <h3 className="text-[13px] font-semibold text-white">Biografía</h3>
                                        <p className="text-[13px] sm:text-[14px] leading-relaxed text-white/70 font-light">
                                            {previewAthlete.bio}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="absolute bottom-0 inset-x-0 p-4 pt-12 bg-gradient-to-t from-black via-black/95 to-transparent z-50 backdrop-blur-[4px]">
                            <button
                                type="button"
                                disabled={Boolean(selectionBurst)}
                                onClick={handleSelectFromPreview}
                                className={cn(
                                    "w-full h-14 rounded-full font-bold text-[15px] tracking-wide transition-all flex items-center justify-center gap-2",
                                    isPreviewSelected
                                        ? "bg-emerald-500 text-white"
                                        : "bg-white text-black active:scale-95"
                                )}
                            >
                                {isPreviewSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                {isPreviewSelected ? "Seleccionado" : "Añadir al Equipo"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}

function AthleteSlot({
    athlete,
    gender,
    isActive,
    floatIndex,
    slotRef,
    onClick,
}: {
    athlete: AthleteSlotData | null;
    gender: "M" | "F";
    isActive: boolean;
    floatIndex: number;
    slotRef?: (node: HTMLButtonElement | null) => void;
    onClick: () => void;
}) {
    const floatClass = ["team-sticker-a", "team-sticker-b", "team-sticker-c"][floatIndex % 3];

    return (
        <motion.button
            type="button"
            onClick={onClick}
            ref={slotRef}
            style={{
                transformStyle: "preserve-3d",
                willChange: athlete ? "transform" : undefined,
                animationDelay: athlete ? `${floatIndex * 0.18}s` : undefined,
                backfaceVisibility: "visible",
                WebkitBackfaceVisibility: "visible",
            }}
            className={cn(
                "aspect-[3/3.5] sm:aspect-[4/6] rounded-[14px] sm:rounded-[22px] border relative transition-all duration-500 overflow-hidden",
                athlete && "team-sticker",
                athlete && floatClass,
                isActive
                    ? "border-white ring-1 ring-white/20 z-20"
                    : athlete
                        ? "border-white/10 bg-[#0a0a0a] z-10"
                        : "border-white/25 border-dashed bg-white/[0.04] backdrop-blur-xl backdrop-saturate-150 z-10"
            )}
        >
            <AnimatePresence mode="wait">
                {athlete ? (
                    <motion.div
                        key="athlete"
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 p-1"
                    >
                        <div
                            className="flex h-full w-full flex-col rounded-[12px] border-0 bg-[#1F2121] p-1.5"
                            style={{
                                transformStyle: "preserve-3d",
                                transform: "none",
                                opacity: 1,
                            }}
                        >
                            <div className="mx-0.5 flex-1 min-h-0">
                                <div className="relative h-full w-full" style={{ transform: "translateZ(8px)" }}>
                                    <img
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full rounded-[10px] bg-[#000000] object-cover saturate-[1.15]"
                                        alt={athlete.name}
                                        src={athlete.image}
                                        style={{
                                            boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                                            opacity: 1,
                                        }}
                                    />
                                    <div className="absolute inset-0 rounded-[10px] bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                                </div>
                            </div>

                            <div className="mt-1 flex flex-shrink-0 items-center justify-between px-1 pb-0.5 pt-0.5 font-mono text-white" style={{ transform: "translateZ(24px)" }}>
                                <div className="text-[8px] font-semibold truncate pr-1">{athlete.name.split(" ")[0]}</div>
                                <div className="text-[8px] text-gray-300 opacity-70">#{gender}</div>
                            </div>
                        </div>

                        <div
                            className="absolute top-1.5 right-1.5 size-4 sm:size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center z-30 shadow-[0_0_0_1px_rgba(255,255,255,0.18)]"
                            style={{ transform: "translateZ(36px)" }}
                        >
                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3.6} />
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        className="absolute inset-0 flex flex-col items-center justify-center group"
                    >
                        <div className="flex flex-col items-center gap-2 transition-all duration-500 group-hover:scale-[1.04]">
                            <Plus className="w-6 h-6 text-zinc-200/85" strokeWidth={3} />
                            <span className="text-[11px] font-black text-zinc-200/65 tracking-[0.18em] leading-none">{gender}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}

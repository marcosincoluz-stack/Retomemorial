"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { EVENTS, ATHLETES } from "@/lib/data";
import { submitFullParticipation } from "@/app/actions";
import { MultiStepLoader } from "@/components/ui/multi-step-loader";
import { motion, AnimatePresence } from "framer-motion";
import { MoveLeft, Search, Plus, Check, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const loadingStates = [
    { text: "Registrando tu equipo unificado..." },
    { text: "Verificando los 6 atletas seleccionados..." },
    { text: "Generando tu boleto premium..." },
    { text: "Preparando acceso VIP..." },
    { text: "¡Todo listo! Tu apuesta ha sido registrada. 🎟️" },
];

export default function UnifiedSelectionPage() {
    const router = useRouter();
    const params = useParams();

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

    const activeEvent = EVENTS.find(e => e.slug === activeEventSlug) || EVENTS[0];
    const eventAthletes = ATHLETES[activeEventSlug as keyof typeof ATHLETES];

    const filteredAthletes = useMemo(() => {
        if (!eventAthletes) return [];
        const pool = genderFilter === 'male' ? eventAthletes.male : eventAthletes.female;
        return pool.filter(athlete =>
            athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [eventAthletes, searchQuery, genderFilter]);

    const handleToggleAthlete = (id: string) => {
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
        } catch (error) {
            setLoading(false);
            setErrorMsg("Error de conexión.");
        }
    };

    const getAthleteById = (id: string | null, event: string, gender: 'male' | 'female') => {
        if (!id) return null;
        const athletes = ATHLETES[event as keyof typeof ATHLETES];
        return athletes[gender].find(a => a.id === id);
    };

    return (
        <main className="min-h-screen bg-black text-white font-sans antialiased selection:bg-green-500/30 overflow-x-hidden">
            <div className="relative min-h-screen flex flex-col pb-36">

                {/* Header - Centered Layout */}
                <header className="sticky top-0 z-50 px-6 pt-10 pb-6 bg-black/95 backdrop-blur-md flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="size-11 flex items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10 border border-white/5 active:scale-95"
                    >
                        <MoveLeft className="w-5 h-5" />
                    </button>

                    <h1 className="text-xl font-bold tracking-tight text-white translate-x-1">Reto Memorial</h1>

                    <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-black text-zinc-500 tracking-tighter">5/6</span>
                        <div className="flex gap-1.5 items-center">
                            {[1, 2, 3, 4, 5, 6].map((dot) => (
                                <div
                                    key={dot}
                                    className={cn(
                                        "size-1.5 rounded-full transition-all duration-300",
                                        dot <= 5 ? "bg-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.3)]" : "bg-zinc-800 scale-90"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </header>

                {/* Selection Matrix - High Fidelity 3x2 Grid */}
                <section className="px-6 my-8 grid grid-cols-3 gap-3.5 relative z-10">
                    {EVENTS.map(event => (
                        <div key={event.slug} className="flex flex-col gap-4">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-[0.25em] text-center transition-colors duration-300",
                                activeEventSlug === event.slug ? "text-white" : "text-zinc-600"
                            )}>
                                {event.name}
                            </span>

                            {/* Male Slot */}
                            <AthleteSlot
                                athlete={getAthleteById(selections[event.slug].maleId, event.slug, 'male')}
                                gender="M"
                                isActive={activeEventSlug === event.slug && genderFilter === 'male'}
                                onClick={() => { setActiveEventSlug(event.slug); setGenderFilter('male'); }}
                            />

                            {/* Female Slot */}
                            <AthleteSlot
                                athlete={getAthleteById(selections[event.slug].femaleId, event.slug, 'female')}
                                gender="F"
                                isActive={activeEventSlug === event.slug && genderFilter === 'female'}
                                onClick={() => { setActiveEventSlug(event.slug); setGenderFilter('female'); }}
                            />
                        </div>
                    ))}
                </section>

                {/* Gender Pill Selector - Rounded Large Design */}
                <div className="px-12 mb-10 pt-2">
                    <div className="flex p-1.5 bg-[#141414] rounded-[24px] border border-white/5 shadow-inner">
                        <button
                            onClick={() => setGenderFilter('male')}
                            className={cn(
                                "flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all duration-300",
                                genderFilter === 'male' ? "bg-[#252525] text-white shadow-2xl ring-1 ring-white/5" : "text-zinc-600 hover:text-white/60"
                            )}
                        >
                            Masculino
                        </button>
                        <button
                            onClick={() => setGenderFilter('female')}
                            className={cn(
                                "flex-1 py-3.5 rounded-[18px] text-sm font-bold transition-all duration-300",
                                genderFilter === 'female' ? "bg-[#252525] text-white shadow-2xl ring-1 ring-white/5" : "text-zinc-600 hover:text-white/60"
                            )}
                        >
                            Femenina
                        </button>
                    </div>
                </div>

                {/* Athlete List Section - Bubble Cards */}
                <section className="px-6 flex flex-col flex-1 relative z-10 pb-10">
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredAthletes.map((athlete) => {
                                const isSelected = selections[activeEventSlug].maleId === athlete.id || selections[activeEventSlug].femaleId === athlete.id;
                                return (
                                    <motion.div
                                        layout
                                        key={athlete.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className={cn(
                                            "p-3 rounded-[32px] flex items-center gap-4 bg-[#0d0d0d] border transition-all duration-300 group",
                                            isSelected ? "border-white/10 bg-[#141414]" : "border-white/5"
                                        )}
                                    >
                                        <div className="relative p-0.5 rounded-[18px] border border-yellow-500/20 group-hover:border-yellow-500/40 transition-colors">
                                            <img src={athlete.image} className="size-16 rounded-[16px] object-cover grayscale contrast-125 saturate-0 group-hover:grayscale-0 transition-all duration-500" />
                                        </div>
                                        <div className="flex-1 px-1">
                                            <p className="font-bold text-lg leading-tight tracking-tight text-white/90">{athlete.name}</p>
                                            <p className="text-[11px] text-zinc-600 font-black uppercase tracking-[0.15em] mt-1.5 flex items-center gap-1.5">
                                                {activeEvent.name} <span className="size-1 rounded-full bg-zinc-800" /> {athlete.mark}m
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleToggleAthlete(athlete.id)}
                                            className={cn(
                                                "size-12 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90",
                                                isSelected
                                                    ? "bg-white text-black shadow-lg"
                                                    : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {isSelected ? <Check className="w-6 h-6" strokeWidth={3} /> : <Plus className="w-6 h-6" strokeWidth={2} />}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {filteredAthletes.length === 0 && (
                        <div className="py-20 text-center opacity-40">
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No se hallaron atletas</p>
                        </div>
                    )}
                </section>

                {/* Sticky Footer CTA - Centered Pill */}
                <div className="fixed bottom-0 inset-x-0 p-8 pt-4 bg-gradient-to-t from-black via-black/80 to-transparent z-50">
                    <button
                        disabled={!isComplete}
                        onClick={handleConfirm}
                        className={cn(
                            "w-full h-18 py-5 rounded-[40px] font-black text-[17px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-500",
                            isComplete
                                ? "bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-[0.98] opacity-100"
                                : "bg-[#444444] text-black/40 cursor-not-allowed opacity-80"
                        )}
                    >
                        Confirmar Todo
                        {!isComplete && <Lock className="w-4.5 h-4.5 mb-0.5" />}
                    </button>
                </div>
            </div>

            <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={1000} onComplete={onLoaderComplete} />
        </main>
    );
}

function AthleteSlot({ athlete, gender, isActive, onClick }: any) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "aspect-[4/6] rounded-[34px] border relative transition-all duration-500 overflow-hidden cursor-pointer",
                isActive
                    ? "border-yellow-500 ring-4 ring-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.2)] scale-[1.05] z-20"
                    : "border-white/5 bg-[#0a0a0a] scale-100 z-10",
                athlete ? "border-transparent" : "border-dashed"
            )}
        >
            <AnimatePresence mode="wait">
                {athlete ? (
                    <motion.div
                        key="athlete"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                    >
                        <img src={athlete.image} className="w-full h-full object-cover grayscale contrast-110 saturate-0 opacity-80 brightness-[0.85]" />
                        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/30 to-transparent" />

                        {/* High Vis Checkmark Badge */}
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute top-2.5 right-2.5 size-6 rounded-full bg-[#10b981] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] z-30"
                        >
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                        </motion.div>

                        <div className="absolute bottom-3 inset-x-0 text-center z-20">
                            <span className="text-[11px] font-black uppercase text-white tracking-[0.2em]">{gender}</span>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="empty"
                        className="absolute inset-0 flex flex-col items-center justify-center group"
                    >
                        <div className="flex flex-col items-center gap-1.5 transition-all duration-500 group-hover:scale-110">
                            <Plus className="w-6 h-6 text-zinc-800" strokeWidth={3} />
                            <span className="text-[12px] font-black text-zinc-800 tracking-tighter leading-none">{gender}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

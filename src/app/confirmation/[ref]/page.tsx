"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getParticipation } from "@/app/actions";
import { EVENTS, ATHLETES } from "@/lib/data";
import { Meteors } from "@/components/ui/meteors";
import { Confetti } from "@/components/ui/confetti";
import SparklesText from "@/components/ui/sparkles-text";
import { Download, Share2, ArrowLeft, CheckCircle2, Ticket } from "lucide-react";
import * as htmlToImage from "html-to-image";

type SelectionsMap = Record<string, { maleId: string | null; femaleId: string | null }>;

type Participation = {
    reference: string;
    selections: SelectionsMap;
    delivered: boolean;
    createdAt: string;
};

type AthleteWithResult = {
    id: string;
    name: string;
    image: string;
    event: string;
    gender: "M" | "F";
};

type ConfirmationData = {
    participation: Participation;
    fullTeam: AthleteWithResult[];
};

export default function ConfirmationPage() {
    const params = useParams();
    const router = useRouter();
    const ref = params.ref as string;

    const [data, setData] = useState<ConfirmationData | null>(null);
    const [loading, setLoading] = useState(true);
    const ticketRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchParticipation() {
            const participation = (await getParticipation(ref)) as Participation | null;
            if (participation && participation.selections) {
                // Map selections to athlete objects
                const fullTeam: AthleteWithResult[] = [];
                EVENTS.forEach(event => {
                    const eventSelection = participation.selections[event.slug];
                    const athletes = ATHLETES[event.slug as keyof typeof ATHLETES];

                    const male = athletes.male.find((a) => a.id === eventSelection.maleId);
                    const female = athletes.female.find((a) => a.id === eventSelection.femaleId);

                    if (male) fullTeam.push({ ...male, event: event.name, gender: 'M' });
                    if (female) fullTeam.push({ ...female, event: event.name, gender: 'F' });
                });

                setData({ participation, fullTeam });
            }
            setLoading(false);
        }
        fetchParticipation();
    }, [ref]);

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        try {
            const dataUrl = await htmlToImage.toPng(ticketRef.current, { quality: 0.95 });
            const link = document.createElement("a");
            link.download = `memorial-ticket-${ref}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error("Error downloading image", err);
        }
    };

    if (loading) {
        return <div className="min-h-dvh bg-slate-50 flex items-center justify-center text-slate-900">Cargando...</div>;
    }

    if (!data) {
        return (
            <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center text-slate-900 px-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Ticket no encontrado</h1>
                <p className="text-slate-500 mb-8">La referencia {ref} no existe en nuestros registros.</p>
                <button onClick={() => router.push("/")} className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold">
                    Volver al inicio
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-dvh bg-slate-50 overflow-x-hidden relative flex flex-col items-center pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] px-4">
            {/* Background Magic */}
            <div className="fixed inset-0 z-0">
                <Meteors number={15} />
                <div className="absolute top-0 inset-x-0 h-[50vh] bg-[radial-gradient(circle_at_50%_-10%,rgba(99,102,241,0.16)_0%,rgba(255,255,255,0)70%)] pointer-events-none" />
            </div>

            <Confetti
                className="fixed inset-0 z-50 pointer-events-none"
                options={{
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.4 }
                }}
            />

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">

                {/* Header Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 mb-8 backdrop-blur-md">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Reto Completado</span>
                    <span className="w-px h-3 bg-slate-300 mx-1" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Step 6/6</span>
                </div>

                <style jsx global>{`
                    .ticket-shadow {
                        box-shadow: 0 30px 60px -15px rgba(0,0,0,0.8);
                    }
                `}</style>

                {/* The Ticket (Unified 6-athlete Design) */}
                <div
                    ref={ticketRef}
                    className="w-full bg-white/90 border border-slate-200 rounded-[2.5rem] p-6 text-center ticket-shadow relative overflow-hidden backdrop-blur-xl"
                >
                    {/* Glowing Accents */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-300/25 rounded-full blur-[80px]" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-cyan-300/25 rounded-full blur-[80px]" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="size-16 rounded-3xl bg-slate-100 flex items-center justify-center border border-slate-200 mb-6">
                            <Ticket className="w-8 h-8 text-slate-800" />
                        </div>

                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Ticket Final</h2>
                        <h1 className="text-3xl font-black text-slate-900 mb-8 tracking-tighter">PREMIUM PASS</h1>

                        {/* Athlete Grid (6 Athletes) */}
                        <div className="w-full bg-slate-100/70 rounded-3xl p-4 border border-slate-200 mb-8">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                                Tu Selección ({data.fullTeam.length} {data.fullTeam.length === 1 ? "Cromo" : "Cromos"})
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {data.fullTeam.map((athlete) => (
                                    <div key={athlete.id} className="flex flex-col items-center">
                                        <div className="relative size-16 rounded-2xl overflow-hidden border border-slate-200 mb-1.5 contrast-110">
                                            <img src={athlete.image} alt={athlete.name} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                            <span className="absolute bottom-1 right-1.5 text-[8px] font-black text-white">{athlete.gender}</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-900 uppercase truncate w-full px-1">{athlete.name.split(' ')[0]}</p>
                                        <p className="text-[7px] font-medium text-slate-500 uppercase tracking-tighter">{athlete.event}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Reference Section */}
                        <div className="w-full pt-6 border-t border-dashed border-slate-200 flex flex-col items-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Ref. de Validación</p>
                            <SparklesText
                                text={ref}
                                className="text-4xl font-mono font-black text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                            />

                            {/* Mock QR Area */}
                            <div className="mt-8 size-24 bg-white p-2 rounded-2xl shadow-xl">
                                <img src="/qr-placeholder.png" alt="QR Code" className="w-full h-full opacity-90" />
                            </div>
                            <p className="mt-4 text-[9px] font-medium text-slate-500 uppercase tracking-widest">Escanea en el acceso</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 w-full mt-10">
                    <button
                        onClick={handleDownload}
                        className="h-14 flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-2xl text-slate-900 font-bold hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <Download className="w-5 h-5 text-slate-500" />
                        <span className="text-sm">Bajar</span>
                    </button>
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: "Ticket Memorial 2026",
                                    text: `¡Tengo mi equipo listo! Mi referencia es ${ref}`,
                                    url: window.location.href
                                });
                            }
                        }}
                        className="h-14 flex items-center justify-center gap-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="text-sm">Enviar</span>
                    </button>
                </div>

                <button
                    onClick={() => router.push("/")}
                    className="mt-12 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Nueva Apuesta
                </button>

            </div>
        </main>
    );
}

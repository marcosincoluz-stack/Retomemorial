"use client";

import React, { useState } from "react";
import { getParticipation, markDelivered } from "@/app/actions";
import { EVENTS, ATHLETES } from "@/lib/data";
import { DotPattern } from "@/components/ui/dot-pattern";
import { Search, CheckCircle2 } from "lucide-react";

export default function AdminPage() {
    const [ref, setRef] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ref.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        const data = await getParticipation(ref.trim().toUpperCase());

        if (data) {
            const event = EVENTS.find((evt) => evt.slug === data.eventSlug);
            const athletes = ATHLETES[data.eventSlug as keyof typeof ATHLETES];
            const male = athletes?.male.find((a) => a.id === data.maleAthleteId);
            const female = athletes?.female.find((a) => a.id === data.femaleAthleteId);

            setResult({ ...data, event, male, female });
        } else {
            setError("No se ha encontrado ninguna participaci\u00F3n con esa referencia.");
        }
        setLoading(false);
    };

    const handleDeliver = async () => {
        if (!result) return;
        setLoading(true);
        const success = await markDelivered(result.reference);
        if (success) {
            setResult({ ...result, delivered: true });
        }
        setLoading(false);
    };

    return (
        <main className="min-h-screen bg-slate-50 text-slate-900 relative p-6 md:p-12 flex flex-col items-center">
            <DotPattern
                className="fixed inset-0 z-0 opacity-30"
                cx={1} cy={1} cr={1}
            />

            <div className="relative z-10 w-full max-w-xl">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 mb-8 border-b border-slate-200 pb-4">
                    Control de Premios
                </h1>

                <form onSubmit={handleSearch} className="mb-10">
                    <div className="relative flex items-center">
                        <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={ref}
                            onChange={(e) => setRef(e.target.value)}
                            placeholder="Referencia (Ej: 2026-DIS-00487)"
                            className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-32 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 font-mono text-lg uppercase"
                        />
                        <button
                            type="submit"
                            disabled={loading || !ref.trim()}
                            className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg px-6 transition disabled:opacity-50"
                        >
                            Buscar
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-center">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-[0_18px_50px_rgba(15,23,42,0.1)]">
                        <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-6">
                            <div>
                                <p className="text-slate-500 text-sm uppercase tracking-wider font-bold mb-1">Referencia</p>
                                <p className="text-2xl font-mono text-emerald-600">{result.reference}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 text-sm uppercase tracking-wider font-bold mb-1">Estado</p>
                                {result.delivered ? (
                                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold border border-green-500/30">
                                        <CheckCircle2 className="w-4 h-4" /> Entregado
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm font-bold border border-yellow-500/30">
                                        Pendiente
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-slate-500 text-sm uppercase tracking-wider font-bold mb-3">Prueba</p>
                            <h2 className="text-2xl font-bold text-slate-900">{result.event?.title}</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-3">Masculino</p>
                                <img src={result.male?.image} alt={result.male?.name} className="w-16 h-16 rounded-full object-cover mx-auto mb-2 opacity-80" />
                                <p className="font-medium text-sm text-slate-700 line-clamp-1">{result.male?.name}</p>
                            </div>
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-3">Femenina</p>
                                <img src={result.female?.image} alt={result.female?.name} className="w-16 h-16 rounded-full object-cover mx-auto mb-2 opacity-80" />
                                <p className="font-medium text-sm text-slate-700 line-clamp-1">{result.female?.name}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleDeliver}
                            disabled={result.delivered || loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold py-4 rounded-xl shadow-lg transition-colors text-lg flex justify-center items-center gap-2"
                        >
                            {result.delivered ? (
                                <>
                                    <CheckCircle2 className="w-6 h-6" /> Premio ya entregado
                                </>
                            ) : (
                                "Marcar como Entregado"
                            )}
                        </button>
                        <p className="text-center text-slate-500 text-xs mt-4">
                            {new Date(result.createdAt).toLocaleString()}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

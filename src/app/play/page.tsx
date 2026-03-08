"use client";

import { EVENTS } from "@/lib/data";
import Link from "next/link";
import { MoveLeft, MousePointerClick } from "lucide-react";
import { motion } from "framer-motion";
import { ProgressiveImage } from "@/components/ui/progressive-image";

export default function PlayPage() {
    return (
        <main className="h-[100dvh] bg-slate-50 text-slate-900 w-full overflow-hidden overscroll-none flex flex-col px-4 md:px-10 pt-[calc(env(safe-area-inset-top,0px)+1rem)] md:pt-10 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] md:pb-8 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-indigo-300/30 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-violet-300/30 blur-[100px] md:blur-[120px] rounded-full mix-blend-multiply" />
            </div>

            <div className="max-w-7xl mx-auto w-full flex flex-col items-center flex-1 min-h-0 overflow-hidden">
                <header className="w-full flex items-center mb-2 md:mb-6">
                    <Link
                        href="/"
                        aria-label="Volver al inicio"
                        className="size-9 sm:size-10 flex items-center justify-center rounded-full bg-white text-slate-800 transition-all hover:bg-slate-100 border border-slate-200 active:scale-95 shadow-sm"
                    >
                        <MoveLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </Link>
                </header>

                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="w-full mb-2 sm:mb-3 flex items-center justify-end gap-2 px-1"
                >
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] text-slate-600">
                        <MousePointerClick className="w-3.5 h-3.5 text-slate-500" />
                        Toca una carta
                    </div>
                </motion.div>

                {/* Comet Cards Carousel - Mobile First */}
                <div className="w-full flex-1 min-h-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-3 sm:gap-6 px-1 pr-14 sm:px-4 sm:pr-4 pb-3 md:pb-4 scrollbar-hide select-none touch-pan-x scroll-smooth justify-start md:justify-center items-center">
                    {EVENTS.map((event, index) => (
                        <Link
                            href={`/event/${event.slug}`}
                            key={event.slug}
                            aria-label={`Abrir reto de ${event.name}`}
                            className="flex-shrink-0 snap-start py-2 md:py-4 first:ml-1 last:mr-2 sm:last:mr-0"
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            <motion.div
                                initial={{
                                    opacity: 0,
                                    scale: 0.94,
                                    y: 8,
                                    rotateX: 6,
                                    rotateY: index % 2 === 0 ? -4 : 4,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    y: [0, -4, 0],
                                    x: [0, index % 2 === 0 ? 1 : -1, 0],
                                    rotateX: [0, 1.8, -1.4, 0],
                                    rotateY: [
                                        index % 2 === 0 ? -2 : 2,
                                        index % 2 === 0 ? 2.5 : -2.5,
                                        index % 2 === 0 ? -1.6 : 1.6,
                                        index % 2 === 0 ? -2 : 2,
                                    ],
                                    rotateZ: [0, index % 2 === 0 ? 0.45 : -0.45, 0],
                                }}
                                transition={{
                                    delay: index * 0.1,
                                    opacity: { duration: 0.35 },
                                    scale: { duration: 0.35 },
                                    y: { duration: 5.2, repeat: Infinity, ease: "easeInOut" },
                                    x: { duration: 5.8, repeat: Infinity, ease: "easeInOut" },
                                    rotateX: { duration: 6.4, repeat: Infinity, ease: "easeInOut" },
                                    rotateY: { duration: 7.2, repeat: Infinity, ease: "easeInOut" },
                                    rotateZ: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                                }}
                                style={{ transformStyle: "preserve-3d", perspective: 1200 }}
                            >
                                <div
                                    className="flex w-[72vw] max-w-[282px] sm:w-[290px] md:w-[320px] cursor-pointer flex-col items-stretch rounded-[24px] border border-slate-200/80 bg-white/90 p-1.5 md:p-2.5 transition-all hover:bg-white group/card overflow-hidden shadow-[0_16px_35px_rgba(15,23,42,0.12)]"
                                    style={{
                                        transformStyle: "preserve-3d",
                                    }}
                                >
                                    <div
                                        className="mx-1 flex-1 transition-transform duration-500 ease-out group-hover/card:[transform:translateZ(40px)]"
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        <div className="relative mt-1 aspect-[3/4.2] w-full overflow-hidden rounded-[18px]">
                                            <ProgressiveImage
                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                                                alt={event.name}
                                                src={event.image}
                                                wrapperClassName="absolute inset-0"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-slate-900/5 to-transparent opacity-40" />
                                        </div>
                                    </div>

                                    <div
                                        className="mt-4 flex flex-shrink-0 items-center justify-between px-4 py-3 font-mono text-slate-900 transition-transform duration-500 group-hover/card:[transform:translateZ(20px)]"
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-500 uppercase tracking-[0.2em] mb-2">Marca a superar</span>
                                            <div className="flex gap-6 items-center">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] text-slate-500 uppercase font-bold mb-1">Hombres</span>
                                                    <div className="text-lg font-bold tracking-tight text-slate-900">
                                                        {event.markToBeat.male}m
                                                    </div>
                                                </div>
                                                <div className="flex flex-col border-l border-slate-200 pl-6">
                                                    <span className="text-[11px] text-slate-500 uppercase font-bold mb-1">Mujeres</span>
                                                    <div className="text-lg font-bold tracking-tight text-slate-900">
                                                        {event.markToBeat.female}m
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs bg-slate-100 px-3 py-2 rounded-lg text-slate-700 font-bold transition-all border border-slate-200 group-hover/card:bg-slate-200/80">
                                            #{event.id.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}

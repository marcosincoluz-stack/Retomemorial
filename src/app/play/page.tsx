"use client";

import { CometCard } from "@/components/ui/comet-card";
import { EVENTS } from "@/lib/data";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PlayPage() {
    return (
        <main className="min-h-screen bg-black text-white w-full overflow-x-hidden flex flex-col p-4 md:p-10 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-indigo-500/10 blur-[100px] md:blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-purple-500/10 blur-[100px] md:blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="max-w-7xl mx-auto w-full flex flex-col items-center flex-1">
                <header className="w-full flex items-center mb-8 md:mb-16">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group"
                    >
                        <MoveLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium font-mono text-sm tracking-widest uppercase">Volver</span>
                    </Link>
                </header>

                {/* Comet Cards Carousel - Mobile First */}
                <div className="w-full flex overflow-x-auto snap-x snap-mandatory gap-6 md:gap-8 px-4 pb-12 scrollbar-hide select-none touch-pan-x justify-start md:justify-center items-center h-full">
                    {EVENTS.map((event, index) => (
                        <Link
                            href={`/event/${event.slug}`}
                            key={event.slug}
                            className="flex-shrink-0 snap-center py-6 md:py-10"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    rotate: [0, index % 2 === 0 ? 0.5 : -0.5, 0],
                                    y: [0, -4, 0]
                                }}
                                transition={{
                                    delay: index * 0.1,
                                    rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                                    y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                                }}
                            >
                                <CometCard rotateDepth={15} translateDepth={15}>
                                    <div
                                        className="flex w-[82vw] sm:w-[320px] md:w-[340px] cursor-pointer flex-col items-stretch rounded-[24px] border border-white/5 bg-[#141414] p-2 md:p-3 transition-all hover:bg-[#1a1a1a] group/card overflow-hidden"
                                        style={{
                                            transformStyle: "preserve-3d",
                                        }}
                                    >
                                        {/* Inner Image Container with Z translation */}
                                        <div
                                            className="mx-1 flex-1 transition-transform duration-500 ease-out group-hover/card:[transform:translateZ(40px)]"
                                            style={{ transformStyle: "preserve-3d" }}
                                        >
                                            <div className="relative mt-1 aspect-[3/4.2] w-full overflow-hidden rounded-[18px]">
                                                <img
                                                    loading="lazy"
                                                    className="absolute inset-0 h-full w-full object-cover contrast-[0.9] brightness-90 transition-transform duration-700 group-hover/card:scale-110"
                                                    alt={event.name}
                                                    src={event.image}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />
                                            </div>
                                        </div>

                                        <div
                                            className="mt-4 flex flex-shrink-0 items-center justify-between px-4 py-3 font-mono text-white transition-transform duration-500 group-hover/card:[transform:translateZ(20px)]"
                                            style={{ transformStyle: "preserve-3d" }}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs text-zinc-400 uppercase tracking-[0.2em] mb-2">Marca a superar</span>
                                                <div className="flex gap-6 items-center">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] text-zinc-500 uppercase font-bold mb-1">Hombres</span>
                                                        <div className="text-lg font-bold tracking-tight text-white">
                                                            {event.markToBeat.male}{event.id === 'longitud' ? 'm' : 'm'}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col border-l border-white/10 pl-6">
                                                        <span className="text-[11px] text-zinc-500 uppercase font-bold mb-1">Mujeres</span>
                                                        <div className="text-lg font-bold tracking-tight text-white">
                                                            {event.markToBeat.female}{event.id === 'longitud' ? 'm' : 'm'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs bg-white/10 px-3 py-2 rounded-lg text-white font-bold transition-all border border-white/10 group-hover/card:bg-white/20">
                                                #{event.id.toUpperCase()}
                                            </div>
                                        </div>

                                        {/* Glare/Glow Overlay */}
                                        <div className="absolute inset-0 rounded-[24px] opacity-0 group-hover/card:opacity-10 transition-opacity duration-500 pointer-events-none bg-white/10" />
                                    </div>
                                </CometCard>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Tutorial steps refined for responsive */}
                <div className="flex-none mt-auto pt-8 border-t border-white/5 w-full max-w-4xl mx-auto px-4 md:px-0">
                    <div className="grid grid-cols-3 gap-3 md:gap-12 pb-8">
                        {[
                            { n: "1", t: "Elige", d: "Tu prueba" },
                            { n: "2", t: "Marca", d: "Tu apuesta" },
                            { n: "3", t: "Gana", d: "El premio" }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center md:items-start gap-2 text-center md:text-left">
                                <div className="flex-none w-6 h-6 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-[9px] font-bold text-neutral-500">
                                    {step.n}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-widest">{step.t}</h4>
                                    <p className="hidden md:block text-[10px] text-zinc-500 mt-0.5">{step.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Swipe Assist Indicator */}
                <div className="mt-4 mb-8 text-center animate-pulse md:hidden">
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                        Desliza para explorar
                    </p>
                </div>
            </div>
        </main>
    );
}

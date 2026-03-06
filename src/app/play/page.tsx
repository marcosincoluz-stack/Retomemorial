"use client";

import { EVENTS } from "@/lib/data";
import Link from "next/link";
import { MoveLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function PlayPage() {
    return (
        <main className="h-[100dvh] bg-black text-white w-full overflow-hidden overscroll-none flex flex-col px-4 md:px-10 pt-[calc(env(safe-area-inset-top,0px)+1rem)] md:pt-10 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] md:pb-8 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-indigo-500/10 blur-[100px] md:blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[80vw] md:w-[50vw] h-[80vw] md:h-[50vw] bg-purple-500/10 blur-[100px] md:blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <div className="max-w-7xl mx-auto w-full flex flex-col items-center flex-1 min-h-0 overflow-hidden">
                <header className="w-full flex items-center mb-2 md:mb-6">
                    <Link
                        href="/"
                        className="size-9 sm:size-10 flex items-center justify-center rounded-full bg-white/5 text-white transition-all hover:bg-white/10 border border-white/5 active:scale-95"
                    >
                        <MoveLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </Link>
                </header>

                {/* Comet Cards Carousel - Mobile First */}
                <div className="w-full flex-1 min-h-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-5 md:gap-8 px-2 md:px-4 pb-3 md:pb-4 scrollbar-hide select-none touch-pan-x justify-start md:justify-center items-center">
                    {EVENTS.map((event, index) => (
                        <Link
                            href={`/event/${event.slug}`}
                            key={event.slug}
                            className="flex-shrink-0 snap-center py-2 md:py-4"
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
                                    className="flex w-[82vw] sm:w-[320px] md:w-[340px] cursor-pointer flex-col items-stretch rounded-[24px] border border-white/5 bg-[#141414] p-2 md:p-3 transition-all hover:bg-[#1a1a1a] group/card overflow-hidden"
                                    style={{
                                        transformStyle: "preserve-3d",
                                    }}
                                >
                                    <div
                                        className="mx-1 flex-1 transition-transform duration-500 ease-out group-hover/card:[transform:translateZ(40px)]"
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        <div className="relative mt-1 aspect-[3/4.2] w-full overflow-hidden rounded-[18px]">
                                            <img
                                                loading="lazy"
                                                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                                                alt={event.name}
                                                src={event.image}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-black/5 to-transparent opacity-45" />
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
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}

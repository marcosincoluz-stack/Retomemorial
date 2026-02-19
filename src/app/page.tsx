"use client";

import { GlareCard } from "@/components/ui/glare-card";
import { EVENTS } from "@/lib/data";
import Link from "next/link";
import { Trophy, Target, MousePointer2 } from "lucide-react";

export default function Home() {
  return (
    <main className="h-screen bg-black text-white w-full overflow-hidden flex flex-col p-6 md:p-10">
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
        <div className="flex-none">
          <h2 className="text-2xl md:text-5xl font-bold text-neutral-200 dark:text-neutral-200 font-sans tracking-tight">
            Memorial 2026
          </h2>
          <p className="mt-1 text-neutral-400 text-xs md:text-base">
            Desliza para elegir la prueba. Participa y vive la emoción.
          </p>
        </div>

        {/* Glare Cards Carousel */}
        <div className="flex-1 min-h-0 mt-4 md:mt-8 flex items-center">
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-2 w-full pb-6 scrollbar-hide select-none touch-pan-x">
            {EVENTS.map((event) => (
              <Link href={`/event/${event.slug}`} key={event.slug} className="w-[75vw] md:w-[300px] h-[58vh] md:h-[480px] flex-shrink-0 snap-center">
                <GlareCard className="flex flex-col items-center justify-end w-full h-full overflow-hidden">
                  <img
                    className="h-full w-full absolute inset-0 object-cover scale-[1.12] translate-y-[-2%]"
                    src={event.image}
                    alt={event.title}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent p-4 flex flex-col justify-end">
                    <h3 className="font-bold text-white text-xl md:text-2xl leading-tight">{event.title}</h3>
                    <p className="font-normal text-xs md:text-sm text-neutral-300 mt-1 line-clamp-1">
                      {event.description}
                    </p>
                  </div>
                </GlareCard>
              </Link>
            ))}
          </div>
        </div>

        {/* Shadcn UI Style Tutorial Steps */}
        <div className="flex-none mt-auto pt-6 border-t border-white/5">
          <div className="grid grid-cols-3 gap-2 md:gap-8 max-w-4xl mx-auto">
            {[
              { n: "1", t: "Elige", d: "Selecciona tu prueba" },
              { n: "2", t: "Acierta", d: "Pon tu marca" },
              { n: "3", t: "Gana", d: "Llévate el premio" }
            ].map((step, i) => (
              <div key={i} className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 text-center md:text-left group">
                <div className="flex-none w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold text-neutral-500 group-hover:border-white/40 group-hover:text-white transition-colors">
                  {step.n}
                </div>
                <div className="min-w-0">
                  <h4 className="text-[10px] md:text-xs font-semibold text-neutral-200 uppercase tracking-wider">{step.t}</h4>
                  <p className="hidden md:block text-[10px] text-neutral-500 mt-0.5 truncate">{step.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}


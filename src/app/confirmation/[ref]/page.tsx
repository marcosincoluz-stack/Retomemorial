"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getParticipation } from "@/app/actions";
import { ATHLETES, EVENTS } from "@/lib/data";
import { CheckCircle2, Download, Plus, Share2, Ticket } from "lucide-react";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import * as htmlToImage from "html-to-image";

type SelectionsMap = Record<string, { maleId: string | null; femaleId: string | null }>;

type Participation = {
  reference: string;
  selections: SelectionsMap;
  delivered: boolean;
  createdAt: string;
};

type ConfirmationData = {
  participation: Participation;
};

type TicketSlot = {
  key: string;
  eventName: string;
  gender: "M" | "F";
  athleteName: string;
  athleteImage: string | null;
  filled: boolean;
};

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const ref = decodeURIComponent(params.ref as string);

  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchParticipation() {
      const participation = (await getParticipation(ref)) as Participation | null;
      if (participation?.selections) {
        setData({ participation });
      }
      setLoading(false);
    }
    void fetchParticipation();
  }, [ref]);

  const ticketSlots = useMemo<TicketSlot[]>(() => {
    if (!data) return [];

    return EVENTS.flatMap((event) => {
      const eventSelection = data.participation.selections[event.slug] ?? {
        maleId: null,
        femaleId: null,
      };
      const athletes = ATHLETES[event.slug as keyof typeof ATHLETES];
      const male = athletes.male.find((athlete) => athlete.id === eventSelection.maleId);
      const female = athletes.female.find((athlete) => athlete.id === eventSelection.femaleId);

      return [
        {
          key: `${event.slug}-M`,
          eventName: event.name,
          gender: "M" as const,
          athleteName: male?.name ?? "Sin elegir",
          athleteImage: male?.image ?? null,
          filled: Boolean(male),
        },
        {
          key: `${event.slug}-F`,
          eventName: event.name,
          gender: "F" as const,
          athleteName: female?.name ?? "Sin elegir",
          athleteImage: female?.image ?? null,
          filled: Boolean(female),
        },
      ];
    });
  }, [data]);

  const completedSlotsCount = ticketSlots.filter((slot) => slot.filled).length;

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(ticketRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `memorial-ticket-${ref}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error downloading ticket image", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Ticket Memorial",
        text: `Ya tengo mi ticket. Referencia: ${ref}`,
        url: window.location.href,
      });
      return;
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="h-[100dvh] bg-slate-50 text-slate-900 flex items-center justify-center">
        Cargando ticket...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-[100dvh] bg-slate-50 text-slate-900 px-6 flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold mb-3">Ticket no encontrado</h1>
        <p className="text-sm text-slate-500 mb-8">
          La referencia {ref} no existe en nuestros registros.
        </p>
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-slate-900 text-white px-8 py-3 font-semibold"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-slate-50 text-slate-900">
      <div className="max-w-md mx-auto w-full h-full flex flex-col px-4 pb-[calc(env(safe-area-inset-bottom,0px)+10px)]">
        <div className="pt-[calc(env(safe-area-inset-top,0px)+8px)] pb-2" />

        <section className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 mb-1.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black tracking-tight">Ticket confirmado</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Equipo listo para el Reto Memorial
          </p>
        </section>

        <section className="flex-1 min-h-0">
          <div
            ref={ticketRef}
            className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm p-3 flex flex-col"
          >
            <div className="flex items-start justify-between pb-2 border-b border-slate-100">
              <div>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-[0.14em]">
                  Evento Oficial
                </p>
                <h3 className="text-base font-black mt-0.5">Reto Memorial</h3>
              </div>
              <Ticket className="w-4 h-4 text-slate-400 mt-0.5" />
            </div>

            <div className="pt-2 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Cromos del equipo
                </p>
                <p className="text-[10px] font-bold text-slate-600">
                  {completedSlotsCount}/6
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {ticketSlots.map((slot, index) => (
                  <TicketSlotCard key={slot.key} slot={slot} index={index} />
                ))}
              </div>

              <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 text-center">
                  Referencia
                </p>
                <p className="text-sm font-mono font-black text-slate-900 tracking-[0.1em] text-center mt-0.5">
                  {ref}
                </p>
                <div className="mt-1.5 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                  <div className="flex gap-[3px] opacity-85">
                    <div className="w-[2px] h-4 bg-slate-500" />
                    <div className="w-[4px] h-4 bg-slate-500" />
                    <div className="w-[1px] h-4 bg-slate-500" />
                    <div className="w-[3px] h-4 bg-slate-500" />
                    <div className="w-[2px] h-4 bg-slate-500" />
                    <div className="w-[5px] h-4 bg-slate-500" />
                    <div className="w-[1px] h-4 bg-slate-500" />
                    <div className="w-[2px] h-4 bg-slate-500" />
                    <div className="w-[4px] h-4 bg-slate-500" />
                    <div className="w-[3px] h-4 bg-slate-500" />
                    <div className="w-[1px] h-4 bg-slate-500" />
                    <div className="w-[2px] h-4 bg-slate-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pt-2.5 grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            className="h-11 bg-slate-900 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Descargar
          </button>
          <button
            onClick={handleShare}
            className="h-11 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
        </footer>
      </div>
    </main>
  );
}

function TicketSlotCard({ slot, index }: { slot: TicketSlot; index: number }) {
  const floatClass = ["team-sticker-a", "team-sticker-b", "team-sticker-c"][index % 3];

  if (!slot.filled || !slot.athleteImage) {
    return (
      <div className="aspect-[3/3.5] rounded-[14px] border border-dashed border-slate-300/90 bg-white/45 backdrop-blur-xl backdrop-saturate-150 relative overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center group">
          <div className="flex flex-col items-center gap-2 transition-all duration-500 group-hover:scale-[1.04]">
            <Plus className="w-6 h-6 text-slate-500/90" strokeWidth={2.6} />
            <span className="text-[11px] font-black text-slate-500/80 tracking-[0.18em] leading-none">{slot.gender}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`aspect-[3/3.5] rounded-[14px] border relative transition-all duration-500 overflow-hidden border-[#c9b07a]/60 bg-[#fffcf4] z-10 shadow-[0_12px_28px_rgba(15,23,42,0.08)] team-sticker ${floatClass}`}
      style={{
        transformStyle: "preserve-3d",
        animationDelay: `${-(index % 3) * 1.35}s`,
        willChange: "transform",
        backfaceVisibility: "visible",
        WebkitBackfaceVisibility: "visible",
      }}
    >
      <div className="absolute inset-0 p-1">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(198,167,98,0.14),rgba(255,255,255,0.02)_34%,rgba(167,136,80,0.12)_67%,rgba(255,255,255,0.01))]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(201,176,122,0.26)]" />
        <div
          className="flex h-full w-full flex-col rounded-[12px] border border-[#dcc79c]/80 bg-[#fffdf8]/95 p-1.5"
          style={{
            transformStyle: "preserve-3d",
            transform: "none",
            opacity: 1,
          }}
        >
          <div className="mx-0.5 flex-1 min-h-0">
            <div className="relative h-full w-full" style={{ transform: "translateZ(8px)" }}>
              <ProgressiveImage
                className="absolute inset-0 h-full w-full rounded-[10px] bg-slate-200 object-cover saturate-[1.15]"
                alt={slot.athleteName}
                src={slot.athleteImage}
                wrapperClassName="absolute inset-0 rounded-[10px]"
                style={{
                  boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                  opacity: 1,
                }}
              />
              <div className="absolute inset-0 rounded-[10px] bg-gradient-to-t from-slate-900/36 via-slate-900/8 to-transparent" />
              <div className="absolute inset-0 rounded-[10px] bg-[linear-gradient(125deg,rgba(194,163,92,0.16),rgba(255,255,255,0.01)_42%,rgba(160,131,76,0.14)_74%)] mix-blend-soft-light" />
              <div className="absolute inset-0 rounded-[10px] bg-[radial-gradient(circle_at_18%_12%,rgba(225,204,158,0.18),rgba(255,255,255,0)_44%)] mix-blend-screen" />
            </div>
          </div>

          <div
            className="mt-1 flex flex-shrink-0 items-center justify-between px-1 pb-0.5 pt-0.5 font-mono text-slate-900"
            style={{ transform: "translateZ(24px)" }}
          >
            <div className="text-[8px] font-semibold truncate pr-1">{slot.athleteName.split(" ")[0]}</div>
            <div className="text-[8px] text-slate-500 opacity-80">#{slot.gender}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getParticipation, getAthletesData } from "@/app/actions";
import { ATHLETES, EVENTS, getAthleteCost, type AthletesByEvent } from "@/lib/data";
import { CheckCircle2, Download, Plus, Share2, Ticket, Trophy } from "lucide-react";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { getLeaderboard, type LeaderboardEntry, type LeaderboardMeta } from "@/app/admin/actions";
import * as htmlToImage from "html-to-image";

type SelectionsMap = Record<
  string,
  { maleId: string | null; femaleId: string | null; winnerId?: string | null }
>;

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
  cost: number;
  isChallengeWinner: boolean;
};

const DEFAULT_LEADERBOARD_META: LeaderboardMeta = {
  resultsComplete: false,
  winnersCutoff: 10,
  resultsStatus: "pending",
  completedResults: 0,
  expectedResults: 0,
};

export default function ConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const ref = decodeURIComponent(params.ref as string);

  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [athletesData, setAthletesData] = useState<AthletesByEvent>(ATHLETES);
  const [leaderboardMeta, setLeaderboardMeta] = useState<LeaderboardMeta>(DEFAULT_LEADERBOARD_META);
  const [ticketLeaderboardEntry, setTicketLeaderboardEntry] = useState<LeaderboardEntry | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAthletesData().then((data) => {
      if (!cancelled) setAthletesData(data);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    async function fetchParticipation() {
      const [participation, leaderboard] = await Promise.all([
        getParticipation(ref) as Promise<Participation | null>,
        getLeaderboard(),
      ]);
      if (participation?.selections) {
        setData({ participation });
      }
      if (leaderboard.ok && leaderboard.data) {
        setLeaderboardMeta(leaderboard.meta ?? DEFAULT_LEADERBOARD_META);
        setTicketLeaderboardEntry(
          leaderboard.data.find((entry) => entry.reference === ref) ?? null
        );
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
        winnerId: null,
      };
      const athletes = athletesData[event.slug as keyof typeof athletesData];
      const male = athletes.male.find((athlete) => athlete.id === eventSelection.maleId);
      const female = athletes.female.find((athlete) => athlete.id === eventSelection.femaleId);

      const maleCost = male ? getAthleteCost(male.id, event.slug, "male") : 0;
      const femaleCost = female ? getAthleteCost(female.id, event.slug, "female") : 0;

      const isWinnerMale = Boolean(
        male &&
          eventSelection.winnerId &&
          (eventSelection.winnerId === male.id || eventSelection.winnerId === "both")
      );
      const isWinnerFemale = Boolean(
        female &&
          eventSelection.winnerId &&
          (eventSelection.winnerId === female.id || eventSelection.winnerId === "both")
      );

      return [
        {
          key: `${event.slug}-M`,
          eventName: event.name,
          gender: "M" as const,
          athleteName: male?.name ?? "Sin elegir",
          athleteImage: male?.image ?? null,
          filled: Boolean(male),
          cost: maleCost,
          isChallengeWinner: isWinnerMale,
        },
        {
          key: `${event.slug}-F`,
          eventName: event.name,
          gender: "F" as const,
          athleteName: female?.name ?? "Sin elegir",
          athleteImage: female?.image ?? null,
          filled: Boolean(female),
          cost: femaleCost,
          isChallengeWinner: isWinnerFemale,
        },
      ];
    });
  }, [data, athletesData]);

  const completedSlotsCount = ticketSlots.filter((slot) => slot.filled).length;

  const totalSpentPoints = useMemo(() => {
    return ticketSlots.reduce((acc, slot) => acc + (slot.cost || 0), 0);
  }, [ticketSlots]);

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    try {
      const options = {
        quality: 0.95,
        pixelRatio: 4, // 4x resolution for crystal-clear exports
        cacheBust: true,
        skipFonts: true,
      };

      // Disable animations and 3D transforms during capture to prevent pixelation/blurriness
      ticketRef.current.classList.add("downloading");

      // 1. Pre-warm cache and prepare image resources.
      await htmlToImage.toPng(ticketRef.current, options);

      // 2. Wait briefly to allow full decoding/drawing on canvas.
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 3. Perform the actual capture.
      const dataUrl = await htmlToImage.toPng(ticketRef.current, options);

      // Restore animations and 3D transforms
      ticketRef.current.classList.remove("downloading");

      const link = document.createElement("a");
      link.download = `memorial-ticket-${ref}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error downloading ticket image", error);
      if (ticketRef.current) {
        ticketRef.current.classList.remove("downloading");
      }
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

        <section className="text-center pb-2 conf-header-section">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 mb-1.5 conf-header-icon">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black tracking-tight conf-header-title">Ticket confirmado</h2>
          <p className="text-slate-500 text-xs mt-0.5 conf-header-desc">
            Equipo listo para el Reto Memorial
          </p>
        </section>

        {leaderboardMeta.resultsStatus !== "pending" && ticketLeaderboardEntry && (
          <section className={`mb-2 rounded-2xl border px-3 py-2.5 ${
            leaderboardMeta.resultsComplete && ticketLeaderboardEntry.isWinner
              ? "border-amber-300 bg-amber-50 text-amber-950"
              : leaderboardMeta.resultsComplete
              ? "border-slate-200 bg-white text-slate-700"
              : "border-sky-200 bg-sky-50 text-sky-900"
          }`}>
            <div className="flex items-center gap-2">
              <Trophy className={`h-4 w-4 shrink-0 ${
                leaderboardMeta.resultsComplete && ticketLeaderboardEntry.isWinner
                  ? "text-amber-600"
                  : "text-slate-500"
              }`} />
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.12em]">
                  {leaderboardMeta.resultsComplete
                    ? ticketLeaderboardEntry.isWinner
                      ? "Ticket ganador"
                      : "Clasificación final"
                    : "Resultados parciales"}
                </p>
                <p className="text-xs font-semibold leading-snug">
                  Puesto #{ticketLeaderboardEntry.rank} · Efic.{" "}
                  {ticketLeaderboardEntry.efficiency % 1 === 0
                    ? ticketLeaderboardEntry.efficiency
                    : ticketLeaderboardEntry.efficiency.toFixed(1)}
                  {leaderboardMeta.resultsComplete && ticketLeaderboardEntry.isWinner
                    ? " · Enséñalo al staff"
                    : ""}
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="flex-1 flex flex-col justify-center min-h-0 py-2">
          <div
            ref={ticketRef}
            className="h-auto rounded-2xl border border-slate-200 bg-white shadow-sm p-3 flex flex-col conf-ticket-card"
          >
            <div className="pt-1 flex flex-col gap-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Cromos del equipo
                </p>
                <p className="text-[10px] font-bold text-slate-600">
                  {completedSlotsCount}/{EVENTS.length * 2}
                </p>
              </div>

              <div className={`grid gap-2 conf-slot-grid ${EVENTS.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {ticketSlots.map((slot, index) => (
                  <TicketSlotCard key={slot.key} slot={slot} index={index} />
                ))}
              </div>

              <div className="mt-1 flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 conf-points-banner">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
                  Puntos invertidos
                </span>
                <span className="text-sm font-mono font-black text-slate-900">
                  {totalSpentPoints} / 35 pts
                </span>
              </div>

              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 conf-ref-box">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500 text-center">
                  Referencia
                </p>
                <p className="text-sm font-mono font-black text-slate-900 tracking-[0.1em] text-center mt-0.5">
                  {ref}
                </p>
                <div className="mt-1 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center overflow-hidden conf-barcode-graphic">
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

        {/* Reto Memorial Live redirection button */}
        <div className="pb-2.5 flex-shrink-0">
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] border border-slate-800 relative overflow-hidden group"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="tracking-wide">Reto Memorial Live</span>
            </div>
          </button>
        </div>

        <footer className="pt-2.5 grid grid-cols-2 gap-2 conf-footer">
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
      <div className="aspect-[3/3.6] rounded-[14px] border border-dashed border-slate-300/90 bg-white/45 backdrop-blur-xl backdrop-saturate-150 relative overflow-hidden conf-slot-card">
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
      className={`aspect-[3/3.6] rounded-[14px] border relative transition-all duration-500 overflow-hidden border-[#c9b07a]/60 bg-[#fffcf4] z-10 shadow-[0_12px_28px_rgba(15,23,42,0.08)] team-sticker conf-slot-card ${floatClass}`}
      style={{
        animationDelay: `${-(index % 3) * 1.35}s`,
      }}
    >
      {slot.isChallengeWinner && (
        <div
          className="absolute top-1.5 left-1.5 z-30 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-amber-950 text-[7px] font-black uppercase tracking-wider shadow-[0_2px_8px_rgba(245,158,11,0.4)] border border-amber-200/50"
        >
          <Trophy className="w-2.5 h-2.5" strokeWidth={3} />
          <span>x2</span>
        </div>
      )}
      <div className="absolute inset-0 p-1">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(198,167,98,0.14),rgba(255,255,255,0.02)_34%,rgba(167,136,80,0.12)_67%,rgba(255,255,255,0.01))]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(201,176,122,0.26)]" />
        <div
          className="flex h-full w-full flex-col rounded-[12px] border border-[#dcc79c]/80 bg-[#fffdf8]/95 p-1.5"
        >
          <div className="mx-0.5 flex-1 min-h-0">
            <div className="relative h-full w-full">
              <div
                className="absolute inset-0 h-full w-full rounded-[10px] bg-slate-200"
                style={{
                  backgroundImage: `url(${slot.athleteImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                }}
              />
              <div className="absolute inset-0 rounded-[10px] bg-gradient-to-t from-slate-900/36 via-slate-900/8 to-transparent" />
              {/* Subtle gold overlay tint without using mix-blend-mode to preserve 3x rasterization sharpness */}
              <div className="absolute inset-0 rounded-[10px] bg-[linear-gradient(125deg,rgba(194,163,92,0.06),transparent_60%,rgba(160,131,76,0.06))]" />
            </div>
          </div>

          <div
            className="mt-1 flex flex-shrink-0 items-center justify-between px-1 pb-0.5 pt-0.5 font-mono text-slate-900"
          >
            <div className="text-[8px] font-semibold truncate pr-1">{slot.athleteName.split(" ")[0]}</div>
            <div className="text-[8px] text-slate-600 font-bold bg-amber-100 px-1 rounded-sm">
              {slot.cost} pts
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

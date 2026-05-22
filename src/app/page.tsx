"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ATHLETES, EVENTS } from "@/lib/data";
import { getExistingParticipationForDevice, getAthletePopularityStats, isDeviceLocked, clearDeviceLock } from "@/app/actions";
import { CometCard } from "@/components/ui/comet-card";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { getOrCreateDeviceId } from "@/lib/device-id";
import { Flame, Trophy, ExternalLink, AlertTriangle } from "lucide-react";

const AnimatedBackground = ({ lowMotion }: { lowMotion: boolean }) => {
  if (lowMotion) {
    return (
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(65% 48% at 16% 8%, rgba(99,102,241,0.18) 0%, rgba(255,255,255,0) 70%), radial-gradient(55% 42% at 88% 30%, rgba(168,85,247,0.13) 0%, rgba(255,255,255,0) 72%), radial-gradient(72% 52% at 32% 96%, rgba(14,165,233,0.1) 0%, rgba(255,255,255,0) 70%), #f5f7fb",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden bg-slate-50">
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[20%] -left-[10%] w-[80vw] h-[80vw] bg-indigo-400/20 blur-[100px] rounded-full mix-blend-multiply"
      />
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] -right-[20%] w-[70vw] h-[70vw] bg-violet-400/18 blur-[100px] rounded-full mix-blend-multiply"
      />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-[10%] left-[10%] w-[90vw] h-[90vw] bg-cyan-400/16 blur-[120px] rounded-full mix-blend-multiply"
      />
    </div>
  );
};

const ProgressBar = ({ step }: { step: number }) => (
  <div
    className="flex space-x-2 mx-auto"
    role="progressbar"
    aria-label="Progreso del onboarding"
    aria-valuemin={1}
    aria-valuemax={3}
    aria-valuenow={step}
  >
    {[1, 2, 3].map((s) => (
      <div
        key={s}
        className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s === step
            ? "bg-slate-900 shadow-[0_0_10px_rgba(15,23,42,0.3)]"
            : "bg-slate-300"
          }`}
      />
    ))}
  </div>
);

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="mt-8 mb-4">
      <div className="text-[64px] font-bold tracking-tighter text-slate-900 tabular-nums flex items-center justify-center">
        {String(minutes).padStart(2, "0")}
        <span className="mb-2 mx-1">:</span>
        {String(seconds).padStart(2, "0")}
      </div>
      <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">Tiempo restante</p>
    </div>
  );
};

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

const lowMotionVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 44 : -44,
    opacity: 0
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 44 : -44,
    opacity: 0
  })
};

const ctaFooterClass = "absolute inset-x-0 bottom-0 px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-4";

type StickerCard = {
  id: string;
  name: string;
  image: string;
  event: string;
  gender: "M" | "F";
};

type DeviceParticipationSummary = {
  reference: string;
  selectedSlotsCount: number;
  createdAt?: string;
  selections?: Record<string, { maleId: string | null; femaleId: string | null; winnerId: string | null }>;
};

const EVENT_LABELS: Record<keyof typeof ATHLETES, string> = {
  disco: "Disco",
  jabalina: "Jabalina",
  longitud: "Longitud",
};

const shuffleArray = <T,>(values: T[]) => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const BASE_STICKER_CARDS: StickerCard[] = ATHLETES.disco.male.slice(0, 3).map((athlete) => ({
  id: athlete.id,
  name: athlete.name,
  image: athlete.image,
  event: "Disco",
  gender: "M",
}));

const RANDOM_STICKER_POOL: StickerCard[] = (
  Object.entries(ATHLETES) as Array<
    [keyof typeof ATHLETES, (typeof ATHLETES)[keyof typeof ATHLETES]]
  >
).flatMap(([eventSlug, eventAthletes]) =>
  (["male", "female"] as const).flatMap((genderKey) =>
    eventAthletes[genderKey]
      .filter(
        (athlete) =>
          typeof athlete.image === "string" && athlete.image.length > 0
      )
      .map((athlete) => ({
        id: athlete.id,
        name: athlete.name,
        image: athlete.image,
        event: EVENT_LABELS[eventSlug],
        gender: genderKey === "male" ? "M" : "F",
      }))
  )
);



const formatName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  const initial = parts[0].charAt(0).toUpperCase();
  const surname = parts.slice(1).join(" ");
  return `${initial}. ${surname}`;
};

const getLiveParticipantCount = (ref: string) => {
  let hash = 0;
  for (let i = 0; i < ref.length; i++) {
    hash = ref.charCodeAt(i) + ((hash << 5) - hash);
  }
  const base = Math.abs(hash) % 500 + 850;
  return base;
};

export default function OnboardingPage() {
  const [[page, direction], setPage] = useState([1, 0]);
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const spinBoostRef = useRef(0);
  const randomQueueRef = useRef<StickerCard[]>([]);
  const previousActiveIndexRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [heroSpin, setHeroSpin] = useState(0);
  const [stickerCards, setStickerCards] =
    useState<StickerCard[]>(BASE_STICKER_CARDS);
  const [checkingDeviceLock, setCheckingDeviceLock] = useState(true);
  const [deviceParticipation, setDeviceParticipation] =
    useState<DeviceParticipationSummary | null>(null);
  const [popularityStats, setPopularityStats] = useState<Record<string, number>>({});
  const [dashboardEventSlug, setDashboardEventSlug] = useState<string>("jabalina");
  const [liveOffset, setLiveOffset] = useState(0);

  useEffect(() => {
    if (!deviceParticipation) return;
    const timer = setInterval(() => {
      setLiveOffset(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 5000);
    return () => clearInterval(timer);
  }, [deviceParticipation]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px), (pointer: coarse)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();

    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runDeviceCheck = async () => {
      try {
        // Fast cookie-only check first — most reliable
        const locked = await isDeviceLocked();
        if (cancelled) return;

        if (locked) {
          // Cookie confirms device has a bet — now fetch the full details
          try {
            const deviceId = await getOrCreateDeviceId();
            const result = await getExistingParticipationForDevice(deviceId ?? undefined);
            if (cancelled) return;

            if (result.found && result.reference) {
              setDeviceParticipation({
                reference: result.reference,
                selectedSlotsCount: result.selectedSlotsCount ?? 0,
                createdAt: result.createdAt,
                selections: result.selections,
              });

              const stats = await getAthletePopularityStats();
              if (!cancelled) {
                setPopularityStats(stats);
              }
            } else {
              // Cookie exists but DB data missing
              if (result.error) {
                // DB fetch failed (temporary connection error) — keep lock to prevent double bets
                setDeviceParticipation({
                  reference: "—",
                  selectedSlotsCount: 0,
                });
              } else {
                // Orphaned cookie (DB truncated or mock DB reset). Auto-heal state.
                await clearDeviceLock();
                if (!cancelled) {
                  setDeviceParticipation(null);
                }
              }
            }
          } catch {
            // DB fetch failed but cookie confirmed lock — block with minimal info
            if (!cancelled) {
              setDeviceParticipation({
                reference: "—",
                selectedSlotsCount: 0,
              });
            }
          }
        }
      } catch {
        // Cookie check itself failed — allow through (resilience)
      } finally {
        if (!cancelled) setCheckingDeviceLock(false);
      }
    };

    void runDeviceCheck();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const usedIds = new Set(BASE_STICKER_CARDS.map((card) => card.id));
    randomQueueRef.current = shuffleArray(
      RANDOM_STICKER_POOL.filter((card) => !usedIds.has(card.id))
    );
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, []);

  useEffect(() => {
    if (page !== 1) return;
    const intervalId = window.setInterval(() => {
      const boost = spinBoostRef.current;
      const nextSpin = 0.2 + boost;
      setHeroSpin((prev) => (prev + nextSpin + 360) % 360);
      spinBoostRef.current = boost * 0.915;
    }, 33);
    return () => window.clearInterval(intervalId);
  }, [page]);

  const lowMotion = prefersReducedMotion || isMobileViewport;
  const activeStickerIndex = (() => {
    const step = 360 / stickerCards.length;
    return Math.round(((360 - heroSpin) % 360) / step) % stickerCards.length;
  })();

  const getNextRandomCard = (excludeIds: Set<string>) => {
    if (!RANDOM_STICKER_POOL.length) return null;

    if (randomQueueRef.current.length === 0) {
      const available = RANDOM_STICKER_POOL.filter(
        (card) => !excludeIds.has(card.id)
      );
      randomQueueRef.current = shuffleArray(
        available.length ? available : RANDOM_STICKER_POOL
      );
    }

    for (let i = 0; i < randomQueueRef.current.length; i += 1) {
      const candidate = randomQueueRef.current.shift();
      if (!candidate) break;
      if (!excludeIds.has(candidate.id)) return candidate;
      randomQueueRef.current.push(candidate);
    }

    return null;
  };

  useEffect(() => {
    if (page !== 1 || stickerCards.length < 3) return;

    const previousIndex = previousActiveIndexRef.current;
    previousActiveIndexRef.current = activeStickerIndex;

    if (previousIndex == null || previousIndex === activeStickerIndex) return;

    const length = stickerCards.length;
    const forwardDelta = (activeStickerIndex - previousIndex + length) % length;
    const movingForward = forwardDelta === 1;
    const replaceIndex = movingForward
      ? (activeStickerIndex + 2) % length
      : (activeStickerIndex + length - 2) % length;

    setStickerCards((prev) => {
      const next = [...prev];
      const usedIds = new Set(next.map((card) => card.id));
      usedIds.delete(next[replaceIndex].id);
      const randomCard = getNextRandomCard(usedIds);
      if (!randomCard) return prev;
      next[replaceIndex] = randomCard;
      return next;
    });
  }, [activeStickerIndex, page, stickerCards.length]);

  const paginate = (newDirection: number) => {
    const nextStep = page + newDirection;
    if (nextStep >= 1 && nextStep <= 3) {
      setPage([nextStep, newDirection]);
    }
  };

  const skip = () => router.push("/event/disco");

  const addSpinImpulse = (delta: number) => {
    if (page !== 1) return;
    const next = spinBoostRef.current + delta * 0.0078;
    spinBoostRef.current = Math.max(-6, Math.min(6, next));
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    addSpinImpulse(event.deltaY);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (page !== 1) return;

    event.preventDefault();
    const touch = event.changedTouches[0];
    if (!touchMoveRef.current) {
      touchMoveRef.current = { x: touch.clientX, y: touch.clientY };
      return;
    }

    const deltaX = touch.clientX - touchMoveRef.current.x;
    const deltaY = touch.clientY - touchMoveRef.current.y;
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };

    // Support vertical and horizontal drag so mobile users can accelerate naturally.
    const dragDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : -deltaY;
    setHeroSpin((prev) => (prev + dragDelta * 0.24 + 360) % 360);
    addSpinImpulse(dragDelta * 0.95);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) {
      touchMoveRef.current = null;
      return;
    }

    // Step 1 reserves gesture control for the card carousel/spin.
    // Wizard pagination continues via the CTA button.
    if (page === 1) {
      touchMoveRef.current = null;
      touchStartRef.current = null;
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Trigger swipe only when horizontal intent is clear, so vertical scroll stays fluid.
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
      touchMoveRef.current = null;
      touchStartRef.current = null;
      return;
    }

    if (deltaX < 0 && page < 3) {
      paginate(1);
    } else if (deltaX > 0 && page > 1) {
      paginate(-1);
    }
    touchMoveRef.current = null;
    touchStartRef.current = null;
  };

  if (checkingDeviceLock) {
    return (
      <main className="min-h-dvh h-[100dvh] w-full relative overflow-hidden bg-slate-50">
        <AnimatedBackground lowMotion={lowMotion} />
        <div className="relative z-10 h-full max-w-md mx-auto px-6 flex flex-col items-center justify-center text-center">
          <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
            Verificando dispositivo
          </p>
        </div>
      </main>
    );
  }

  if (deviceParticipation) {
    const selections = deviceParticipation.selections || {};
    const activeEvents = EVENTS.filter((e) => {
      const sel = selections[e.slug];
      return sel && (sel.maleId || sel.femaleId);
    });

    const getAthleteById = (id: string | null, event: string, gender: "male" | "female") => {
      if (!id) return null;
      const eventAthletes = ATHLETES[event as keyof typeof ATHLETES];
      if (!eventAthletes) return null;
      const found = eventAthletes[gender].find((a) => a.id === id);
      return found ? { id: found.id, name: found.name, image: found.image } : null;
    };

    const eventAthletes = ATHLETES[dashboardEventSlug as keyof typeof ATHLETES] || { male: [], female: [] };
    const combinedAthletes = [
      ...eventAthletes.male.map((a) => ({ ...a, gender: "M" as const })),
      ...eventAthletes.female.map((a) => ({ ...a, gender: "F" as const })),
    ];
    // Sort by popularity percentage (descending)
    const sortedAthletes = [...combinedAthletes].sort((a, b) => {
      const popA = popularityStats[a.id] ?? 0;
      const popB = popularityStats[b.id] ?? 0;
      return popB - popA;
    });

    const participantCount = getLiveParticipantCount(deviceParticipation.reference) + liveOffset;

    return (
      <main className="min-h-dvh h-[100dvh] w-full relative overflow-hidden bg-slate-50 flex flex-col font-sans select-none">
        <AnimatedBackground lowMotion={lowMotion} />

        {/* Live Stats Header */}
        <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
          <div className="relative flex justify-center items-center px-6 h-16 max-w-3xl mx-auto">
            <div className="absolute left-6 text-slate-600 p-2 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">sports_score</span>
            </div>
            <h1 className="text-slate-800 tracking-tight italic text-[20px] sm:text-[22px] uppercase font-black">
              Reto Memorial Live
            </h1>
          </div>
        </header>

        {/* Main Stats Area */}
        <div className="relative z-10 flex-1 max-w-3xl mx-auto w-full px-6 pt-24 pb-36 flex flex-col min-h-0">
          {/* Tab Switcher */}
          <div className="flex bg-slate-200/75 border border-slate-300/40 rounded-full p-1 self-center w-full max-w-md shadow-inner mb-5 shrink-0">
            <button
              onClick={() => setDashboardEventSlug("jabalina")}
              className={`flex-1 py-2 px-4 rounded-full text-[15px] sm:text-[16px] text-center font-bold tracking-wider uppercase transition-all duration-300 ${
                dashboardEventSlug === "jabalina"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Jabalina
            </button>
            <button
              onClick={() => setDashboardEventSlug("disco")}
              className={`flex-1 py-2 px-4 rounded-full text-[15px] sm:text-[16px] text-center font-bold tracking-wider uppercase transition-all duration-300 ${
                dashboardEventSlug === "disco"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Disco
            </button>
          </div>

          {/* Scrollable Leaderboard List */}
          <div className="flex-grow overflow-y-auto ios-scroll overscroll-contain pr-1 flex flex-col gap-2.5">
            {sortedAthletes.map((athlete, index) => {
              const rank = index + 1;
              const pop = popularityStats[athlete.id] ?? 0;
              const formattedName = formatName(athlete.name);

              const userSelectedThis =
                selections[dashboardEventSlug]?.maleId === athlete.id ||
                selections[dashboardEventSlug]?.femaleId === athlete.id;

              let progressBgClass = "bg-indigo-500";
              let rankColorClass = "text-slate-500";

              if (rank === 1) {
                rankColorClass = "text-amber-500 font-extrabold";
                progressBgClass = "bg-amber-400";
              } else if (rank === 2) {
                rankColorClass = "text-slate-400 font-extrabold";
                progressBgClass = "bg-slate-300";
              } else if (rank === 3) {
                rankColorClass = "text-amber-700 font-extrabold";
                progressBgClass = "bg-amber-600";
              } else if (rank > 5 && rank <= 8) {
                progressBgClass = "bg-indigo-400 opacity-60";
              }

              if (rank <= 8) {
                return (
                  <div
                    key={athlete.id}
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl border transition-all duration-300 ${
                      userSelectedThis
                        ? "bg-indigo-50/50 border-indigo-200 shadow-[0_2px_8px_rgba(99,102,241,0.08)]"
                        : "bg-white/90 border-slate-200/80 shadow-sm"
                    }`}
                  >
                    <span className={`w-6 text-center text-sm font-bold ${rankColorClass}`}>{rank}</span>
                    <span className="material-symbols-outlined text-slate-400 text-[20px]">flag</span>
                    <span className={`w-28 text-xs font-semibold text-slate-800 truncate uppercase ${userSelectedThis ? "font-bold text-indigo-900" : ""}`}>
                      {formattedName}
                    </span>
                    <div className="flex-grow h-3.5 bg-slate-100 rounded-full overflow-hidden flex relative">
                      <div
                        className={`h-full rounded-r-full transition-all duration-1000 ${progressBgClass}`}
                        style={{ width: `${Math.max(4, pop)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-xs font-bold text-slate-700">{pop}%</span>
                  </div>
                );
              } else {
                const opacityClass = rank === 9 ? "opacity-60" : rank === 10 ? "opacity-40" : "opacity-25";
                return (
                  <div
                    key={athlete.id}
                    className={`flex items-center gap-3 py-2 px-3 transition-opacity ${opacityClass}`}
                  >
                    <span className="w-6 text-center text-xs font-semibold text-slate-400">{rank}</span>
                    <span className="material-symbols-outlined text-slate-300 text-[18px]">flag</span>
                    <span className="w-28 text-xs text-slate-500 truncate uppercase">{formattedName}</span>
                    <div className="flex-grow h-3.5 bg-slate-100/50 rounded-full overflow-hidden flex relative" />
                    <span className="w-12 text-right font-mono text-xs text-slate-400">{pop}%</span>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Floating Bottom Sheet Card */}
        <div className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-2xl border-t border-slate-200/80 shadow-[0_-8px_32px_0_rgba(15,23,42,0.08)] px-6 py-4 pb-safe flex justify-center">
          <div className="w-full max-w-3xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold">Apuesta realizada</span>
                  <span className="material-symbols-outlined text-[13px]">check</span>
                </div>
                <span className="font-mono text-xs text-slate-500 font-bold">{deviceParticipation.reference}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[11px] text-slate-500 font-semibold leading-none">
                  {participantCount.toLocaleString()} en directo
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/confirmation/${deviceParticipation.reference}`)}
              className="w-full bg-slate-900 hover:bg-slate-800 transition-all text-white font-bold text-sm py-3 rounded-full shadow-md shadow-slate-200 active:scale-[0.98]"
            >
              Ver mi apuesta
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh h-[100dvh] w-full relative overflow-hidden overscroll-none font-sans selection:bg-slate-200 touch-pan-y">
      <AnimatedBackground lowMotion={lowMotion} />

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={page}
          custom={direction}
          variants={lowMotion ? lowMotionVariants : variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={lowMotion ? {
            x: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.18, ease: "easeOut" }
          } : {
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="flex flex-col h-[100dvh] max-w-md mx-auto w-full relative z-10"
        >
          {page === 1 && (
            <>
              <header className="w-full pt-[calc(env(safe-area-inset-top,0px)+1rem)] px-6 flex flex-col gap-4">
                <ProgressBar step={1} />
                <div className="flex justify-end w-full">
                  <button
                    onClick={skip}
                    aria-label="Saltar onboarding"
                    className="text-[15px] font-medium text-slate-500 hover:text-slate-800 transition-colors py-2 px-4 rounded-full active:bg-slate-200/70"
                  >
                    Saltar
                  </button>
                </div>
              </header>

              <div className="flex-grow flex flex-col px-0 pb-28 overflow-hidden">
                <div className="text-center px-6 pt-2 pb-1 pointer-events-none">
                  <h2 className="mx-auto mt-3 max-w-[320px] text-[20px] sm:text-2xl font-semibold tracking-tight text-slate-700 uppercase italic leading-[1.2]">
                    Selecciona tus atletas y completa tu equipo para el reto.
                  </h2>
                </div>

                <div className="mt-2 flex-1 min-h-0 flex flex-col justify-center">
                  <div className="relative h-[380px] sm:h-[420px] w-full max-w-md mx-auto [perspective:1300px] [transform-style:preserve-3d]">
                    {stickerCards.map((card, index) => {
                      const angleDeg = heroSpin + (360 / stickerCards.length) * index;
                      const angleRad = (angleDeg * Math.PI) / 180;
                      const phase = heroSpin * 0.06 + index * 1.41;
                      const x = Math.sin(angleRad) * 132 + Math.sin(phase * 1.2) * 7;
                      const z = Math.cos(angleRad) * 192 + Math.sin(phase * 1.4) * 14;
                      const y = Math.sin(angleRad * 1.2) * 11 + Math.cos(phase * 1.5) * 5;
                      const depthFactor = (Math.cos(angleRad) + 1) / 2;
                      const scale = 0.62 + depthFactor * 0.42 + Math.sin(phase * 1.2) * 0.01;
                      const opacity = 0.36 + depthFactor * 0.64;
                      const rotateY = -Math.sin(angleRad) * 56 + Math.sin(phase * 1.1) * 6;
                      const rotateX = 10 - depthFactor * 10 + Math.cos(phase * 1.2) * 3.5;
                      const rotateZ = Math.sin(phase * 1.45) * 2.2;

                      return (
                        <motion.article
                          key={card.id}
                          className="absolute left-1/2 top-1/2 w-[176px] sm:w-[194px] aspect-[3/4.35] rounded-[18px] [transform-style:preserve-3d]"
                          style={{
                            transform: `translate3d(calc(-50% + ${x}px), calc(-50% + ${y}px), ${z}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
                            opacity,
                            zIndex: Math.round(depthFactor * 100),
                            backfaceVisibility: "visible",
                          }}
                        >
                          <CometCard rotateDepth={6} translateDepth={4} className="h-full w-full">
                            <button
                              type="button"
                              className="relative flex h-full w-full cursor-pointer flex-col items-stretch rounded-[16px] border-0 bg-[#2A2D31] p-2 md:p-3"
                              aria-label={`Ver cromo de ${card.name}`}
                              style={{ transformStyle: "preserve-3d", transform: "none", opacity: 1 }}
                            >
                              <div className="mx-1 flex-1">
                                <div className="relative mt-1.5 aspect-[3/4] w-full">
                                  <ProgressiveImage
                                    className="absolute inset-0 h-full w-full rounded-[14px] bg-[#000000] object-cover contrast-[0.9] saturate-[1.05]"
                                    alt={card.name}
                                    src={card.image}
                                    wrapperClassName="absolute inset-0 rounded-[14px]"
                                    skeletonClassName="bg-slate-300/60"
                                    style={{
                                      boxShadow: "rgba(0, 0, 0, 0.05) 0px 5px 6px 0px",
                                      opacity: 1,
                                    }}
                                  />
                                  <div className="absolute inset-0 rounded-[14px] bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                                  <div className="absolute top-1.5 left-1.5 rounded-full border border-white/35 bg-black/45 px-1.5 py-0.5 text-[8px] font-black text-white tracking-[0.08em]">
                                    {card.event} · {card.gender}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 flex flex-shrink-0 items-center justify-between p-2.5 font-mono text-white">
                                <div className="text-[10px] font-semibold tracking-[0.06em] truncate pr-2">{card.name}</div>
                                <div className="text-[10px] text-gray-300 opacity-60">#DIS</div>
                              </div>
                            </button>
                          </CometCard>
                        </motion.article>
                      );
                    })}
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-[11px] uppercase tracking-[0.22em] font-black text-slate-500">
                      {stickerCards[activeStickerIndex]?.event ?? "Disco"} ·{" "}
                      {stickerCards[activeStickerIndex]?.gender === "F"
                        ? "Femenina"
                        : "Masculino"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {stickerCards[activeStickerIndex]?.name}
                    </p>
                  </div>
                </div>
              </div>

              <footer className={ctaFooterClass}>
                <button
                  onClick={() => paginate(1)}
                  aria-label="Ir al siguiente paso"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[17px] py-4 px-6 rounded-full transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
                >
                  <span>Continuar</span>
                </button>
              </footer>
            </>
          )}

          {page === 2 && (
            <>
              <header className="w-full pt-[calc(env(safe-area-inset-top,0px)+1rem)] px-6 flex flex-col gap-4">
                <ProgressBar step={2} />
                <div className="h-9" />
              </header>

              <div className="flex-1 flex flex-col px-6 pt-5 pb-28 overflow-hidden [transform:translateZ(0)]">
                <div className="mb-8 text-center pointer-events-none">
                  <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-slate-900 uppercase italic">Instrucciones</h1>
                  <p className="text-slate-600 text-[16px] leading-relaxed px-4">
                    Haz tu equipo con atletas femeninos y masculinos, elige a los ganadores y gana premios.
                  </p>
                </div>

                <div className="flex flex-col gap-6 mt-2 pointer-events-none">
                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 text-slate-900">
                      <span className="material-symbols-outlined text-[28px] font-light">groups</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[17px] text-slate-900 mb-1 tracking-tight">Haz tu equipo</h3>
                      <p className="text-[14px] text-slate-600 leading-snug">Selecciona atletas femeninos y masculinos para cada prueba.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 text-slate-900">
                      <span className="material-symbols-outlined text-[28px] font-light">sprint</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[17px] text-slate-900 mb-1 tracking-tight">Elige ganadores</h3>
                      <p className="text-[14px] text-slate-600 leading-snug">Escoge quién ganará cada prueba del reto.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 text-slate-900">
                      <span className="material-symbols-outlined text-[28px] font-light">workspace_premium</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[17px] text-slate-900 mb-1 tracking-tight">Gana premios</h3>
                      <p className="text-[14px] text-slate-600 leading-snug">Premio si algún atleta de tu equipo supera la marca del reto, y premio gordo para quien acierte más ganadores.</p>
                    </div>
                  </div>
                </div>

              </div>

              <footer className={ctaFooterClass}>
                <button
                  onClick={() => paginate(1)}
                  aria-label="Ir al último paso"
                  className="w-full py-4 bg-slate-900 text-white rounded-full font-semibold text-[17px] shadow-sm hover:bg-slate-800 transition-colors active:scale-[0.98] flex items-center justify-center"
                >
                  Continuar
                </button>
              </footer>
            </>
          )}

          {page === 3 && (
            <>
              <header className="w-full pt-[calc(env(safe-area-inset-top,0px)+1rem)] px-6 flex flex-col gap-4">
                <ProgressBar step={3} />
                <div className="h-9" />
              </header>

              <main className="flex-1 px-6 pb-28 flex flex-col justify-center items-center text-center pointer-events-none">
                <h1 className="text-5xl font-semibold tracking-tight text-slate-900 mb-4">
                  ¡Todo listo!
                </h1>
                <p className="text-slate-600 text-[17px] leading-relaxed max-w-[280px] mb-4">
                  Empieza el reto y demuestra tus conocimientos de atletismo.
                </p>

                <CountdownTimer />
              </main>

              <footer className={ctaFooterClass}>
                <button
                  onClick={() => router.push("/event/disco")}
                  aria-label="Empezar y crear equipo"
                  className="bg-slate-900 text-white font-semibold py-4 px-12 rounded-full text-[17px] hover:bg-slate-800 transition-all active:scale-95 duration-200 shadow-[0_4px_20_rgba(15,23,42,0.2)] w-full max-w-[280px] mx-auto flex items-center justify-center"
                >
                  Empezar
                </button>
              </footer>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

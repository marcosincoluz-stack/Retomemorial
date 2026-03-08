"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ATHLETES } from "@/lib/data";
import { getExistingParticipationForDevice } from "@/app/actions";
import { CometCard } from "@/components/ui/comet-card";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { getOrCreateDeviceId } from "@/lib/device-id";

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

const BASE_STICKER_CARDS: StickerCard[] = ATHLETES.disco.male.map((athlete) => ({
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
          typeof athlete.image === "string" && athlete.image.startsWith("/")
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
        const deviceId = await getOrCreateDeviceId();
        const result = await getExistingParticipationForDevice(deviceId ?? undefined);
        if (cancelled) return;

        if (result.found && result.reference) {
          setDeviceParticipation({
            reference: result.reference,
            selectedSlotsCount: result.selectedSlotsCount ?? 0,
            createdAt: result.createdAt,
          });
        }
      } catch {
        // If lookup fails, keep onboarding available.
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

  const skip = () => router.push("/play");

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
    return (
      <main className="min-h-dvh h-[100dvh] w-full relative overflow-hidden bg-slate-50">
        <AnimatedBackground lowMotion={lowMotion} />
        <div className="relative z-10 h-full max-w-md mx-auto px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] flex flex-col">
          <div className="rounded-3xl border border-slate-200 bg-white/90 shadow-[0_20px_60px_rgba(15,23,42,0.1)] p-6 mt-auto mb-auto">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Apuesta ya registrada
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              Ya participaste con este dispositivo
            </h1>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Solo se permite una apuesta por dispositivo.
            </p>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                Referencia
              </p>
              <p className="mt-1 font-mono text-lg font-black text-slate-900 tracking-[0.08em]">
                {deviceParticipation.reference}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Huecos seleccionados:{" "}
                <span className="font-bold text-slate-700">
                  {deviceParticipation.selectedSlotsCount}/6
                </span>
              </p>
              {deviceParticipation.createdAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Registrada: {new Date(deviceParticipation.createdAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => router.push(`/confirmation/${deviceParticipation.reference}`)}
              className="h-12 rounded-full bg-slate-900 text-white font-semibold text-base active:scale-[0.98]"
            >
              Ver mi ticket
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

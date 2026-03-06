"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const AnimatedBackground = ({ lowMotion }: { lowMotion: boolean }) => {
  if (lowMotion) {
    return (
      <div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(65% 48% at 16% 8%, rgba(99,102,241,0.22) 0%, rgba(0,0,0,0) 70%), radial-gradient(55% 42% at 88% 30%, rgba(168,85,247,0.16) 0%, rgba(0,0,0,0) 72%), radial-gradient(72% 52% at 32% 96%, rgba(14,165,233,0.14) 0%, rgba(0,0,0,0) 70%), #000",
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden bg-black">
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
        className="absolute -top-[20%] -left-[10%] w-[80vw] h-[80vw] bg-indigo-500/20 blur-[100px] rounded-full mix-blend-screen"
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
        className="absolute top-[20%] -right-[20%] w-[70vw] h-[70vw] bg-purple-500/20 blur-[100px] rounded-full mix-blend-screen"
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
        className="absolute -bottom-[10%] left-[10%] w-[90vw] h-[90vw] bg-blue-500/15 blur-[120px] rounded-full mix-blend-screen"
      />
    </div>
  );
};

const ProgressBar = ({ step }: { step: number }) => (
  <div className="flex space-x-2 mx-auto">
    {[1, 2, 3].map((s) => (
      <div
        key={s}
        className={`h-1.5 w-8 rounded-full transition-all duration-300 ${s === step
            ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
            : "bg-white/20"
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
      <div className="text-[64px] font-bold tracking-tighter text-white tabular-nums flex items-center justify-center drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        {String(minutes).padStart(2, "0")}
        <span className="mb-2 mx-1">:</span>
        {String(seconds).padStart(2, "0")}
      </div>
      <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em]">Tiempo restante</p>
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

export default function OnboardingPage() {
  const [[page, direction], setPage] = useState([1, 0]);
  const router = useRouter();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobileViewport, setIsMobileViewport] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px), (pointer: coarse)");
    const syncViewport = () => setIsMobileViewport(mediaQuery.matches);
    syncViewport();

    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
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

  const lowMotion = prefersReducedMotion || isMobileViewport;

  const paginate = (newDirection: number) => {
    const nextStep = page + newDirection;
    if (nextStep >= 1 && nextStep <= 3) {
      setPage([nextStep, newDirection]);
    }
  };

  const skip = () => router.push("/play");

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    // Trigger swipe only when horizontal intent is clear, so vertical scroll stays fluid.
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
      return;
    }

    if (deltaX < 0 && page < 3) {
      paginate(1);
    } else if (deltaX > 0 && page > 1) {
      paginate(-1);
    }
  };

  return (
    <main className="min-h-dvh h-[100dvh] w-full relative overflow-hidden overscroll-none font-sans selection:bg-zinc-800 touch-pan-y">
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
          onTouchEnd={handleTouchEnd}
          className="flex flex-col h-[100dvh] max-w-md mx-auto w-full relative z-10"
        >
          {page === 1 && (
            <>
              <header className="w-full pt-[calc(env(safe-area-inset-top,0px)+1rem)] px-6 flex flex-col gap-4">
                <ProgressBar step={1} />
                <div className="flex justify-end w-full">
                  <button
                    onClick={skip}
                    className="text-[15px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors py-2 px-4 rounded-full active:bg-white/5"
                  >
                    Skip
                  </button>
                </div>
              </header>

              <div className="flex-grow flex flex-col justify-center items-center px-6 pb-28">
                <div className="text-center w-full mb-12 px-2 pointer-events-none">
                  <h1 className="text-[40px] leading-[1.1] font-bold mb-4 tracking-tight text-white">
                    Bienvenido/a
                  </h1>
                  <p className="text-zinc-400 text-[17px] leading-relaxed font-normal">
                    Elige a tus atletas favoritos para el Reto Memorial.
                  </p>
                </div>
              </div>

              <footer className={ctaFooterClass}>
                <button
                  onClick={() => paginate(1)}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-semibold text-[17px] py-4 px-6 rounded-full transition-all flex justify-center items-center gap-2 active:scale-[0.98]"
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
                  <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-white uppercase italic">Instrucciones</h1>
                  <p className="text-zinc-400 text-[16px] leading-relaxed px-4">
                    Sigue estos pasos para participar y ganar en el evento deportivo.
                  </p>
                </div>

                <div className="flex flex-col gap-6 mt-2 pointer-events-none">
                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 text-white">
                      <span className="material-symbols-outlined text-[28px] font-light">groups</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[17px] text-white mb-1 tracking-tight">Elige atletas</h3>
                      <p className="text-[14px] text-zinc-400 leading-snug">Selecciona 1 masculino y 1 femenino por cada prueba.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 text-white">
                      <span className="material-symbols-outlined text-[28px] font-light">sprint</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[17px] text-white mb-1 tracking-tight">Supera la marca</h3>
                      <p className="text-[14px] text-zinc-400 leading-snug">Tus atletas elegidos deben superar las marcas establecidas.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="pt-0.5 text-white">
                      <span className="material-symbols-outlined text-[28px] font-light">workspace_premium</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[17px] text-white mb-1 tracking-tight">Gana premios</h3>
                      <p className="text-[14px] text-zinc-400 leading-snug">Acumula aciertos y llévate las recompensas del reto.</p>
                    </div>
                  </div>
                </div>

              </div>

              <footer className={ctaFooterClass}>
                <button
                  onClick={() => paginate(1)}
                  className="w-full py-4 bg-white text-black rounded-full font-semibold text-[17px] shadow-sm hover:bg-zinc-100 transition-colors active:scale-[0.98] flex items-center justify-center"
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
                <h1 className="text-5xl font-semibold tracking-tight text-white mb-4">
                  ¡Todo listo!
                </h1>
                <p className="text-zinc-400 text-[17px] leading-relaxed max-w-[280px] mb-4">
                  Empieza el reto y demuestra tus conocimientos de atletismo.
                </p>

                <CountdownTimer />
              </main>

              <footer className={ctaFooterClass}>
                <button
                  onClick={() => router.push("/play")}
                  className="bg-white text-black font-semibold py-4 px-12 rounded-full text-[17px] hover:bg-zinc-100 transition-all active:scale-95 duration-200 shadow-[0_4px_20_rgba(255,255,255,0.15)] w-full max-w-[280px] mx-auto flex items-center justify-center"
                >
                  Start
                </button>
              </footer>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

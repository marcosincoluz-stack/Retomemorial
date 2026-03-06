"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, PanInfo } from "framer-motion";

const AnimatedBackground = () => (
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

export default function OnboardingPage() {
  const [[page, direction], setPage] = useState([1, 0]);
  const router = useRouter();

  const paginate = (newDirection: number) => {
    const nextStep = page + newDirection;
    if (nextStep >= 1 && nextStep <= 3) {
      setPage([nextStep, newDirection]);
    }
  };

  const skip = () => router.push("/play");

  const handleDragEnd = (event: any, info: PanInfo) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -swipeThreshold || velocity < -velocityThreshold) {
      if (page < 3) paginate(1);
    } else if (offset > swipeThreshold || velocity > velocityThreshold) {
      if (page > 1) paginate(-1);
    }
  };

  return (
    <main className="min-h-screen w-full relative overflow-hidden font-sans selection:bg-zinc-800 touch-none">
      <AnimatedBackground />

      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="flex flex-col min-h-screen max-w-md mx-auto w-full relative z-10 cursor-grab active:cursor-grabbing"
        >
          {page === 1 && (
            <>
              <header className="w-full pt-14 px-6 flex flex-col gap-4">
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

              <div className="flex-grow flex flex-col justify-center items-center px-6">
                <div className="text-center w-full mb-12 px-2 pointer-events-none">
                  <h1 className="text-[40px] leading-[1.1] font-bold mb-4 tracking-tight text-white">
                    Bienvenido/a
                  </h1>
                  <p className="text-zinc-400 text-[17px] leading-relaxed font-normal">
                    Elige a tus atletas favoritos para el Reto Memorial.
                  </p>
                </div>
              </div>

              <footer className="w-full px-6 pb-12 pt-4 mt-auto">
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
              <header className="w-full pt-14 px-6 flex flex-col gap-4">
                <ProgressBar step={2} />
                <div className="h-9" />
              </header>

              <div className="flex-1 flex flex-col px-6 pt-10 pb-12 overflow-y-auto">
                <div className="mb-14 text-center pointer-events-none">
                  <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-white uppercase italic">Instrucciones</h1>
                  <p className="text-zinc-400 text-[16px] leading-relaxed px-4">
                    Sigue estos pasos para participar y ganar en el evento deportivo.
                  </p>
                </div>

                <div className="flex flex-col gap-10 mt-4 pointer-events-none">
                  <div className="flex items-start gap-5">
                    <div className="pt-0.5 text-white">
                      <span className="material-symbols-outlined text-[32px] font-light">groups</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[18px] text-white mb-1.5 tracking-tight">Elige atletas</h3>
                      <p className="text-[15px] text-zinc-400 leading-snug">Selecciona 1 masculino y 1 femenino por cada prueba.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="pt-0.5 text-white">
                      <span className="material-symbols-outlined text-[32px] font-light">sprint</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[18px] text-white mb-1.5 tracking-tight">Supera la marca</h3>
                      <p className="text-[15px] text-zinc-400 leading-snug">Tus atletas elegidos deben superar las marcas establecidas.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-5">
                    <div className="pt-0.5 text-white">
                      <span className="material-symbols-outlined text-[32px] font-light">workspace_premium</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[18px] text-white mb-1.5 tracking-tight">Gana premios</h3>
                      <p className="text-[15px] text-zinc-400 leading-snug">Acumula aciertos y llévate las recompensas del reto.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-12 pb-12">
                  <button
                    onClick={() => paginate(1)}
                    className="w-full py-4 bg-white text-black rounded-full font-semibold text-[17px] shadow-sm hover:bg-zinc-100 transition-colors active:scale-[0.98] flex items-center justify-center"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </>
          )}

          {page === 3 && (
            <>
              <header className="w-full pt-14 px-6 flex flex-col gap-4">
                <ProgressBar step={3} />
                <div className="h-9" />
              </header>

              <main className="flex-1 px-6 flex flex-col justify-center items-center text-center pointer-events-none">
                <h1 className="text-5xl font-semibold tracking-tight text-white mb-4">
                  ¡Todo listo!
                </h1>
                <p className="text-zinc-400 text-[17px] leading-relaxed max-w-[280px] mb-4">
                  Empieza el reto y demuestra tus conocimientos de atletismo.
                </p>

                <CountdownTimer />
              </main>

              <footer className="px-6 pb-16 pt-4 flex justify-center">
                <button
                  onClick={() => router.push("/play")}
                  className="bg-white text-black font-semibold py-4 px-12 rounded-full text-[17px] hover:bg-zinc-100 transition-all active:scale-95 duration-200 shadow-[0_4px_20_rgba(255,255,255,0.15)] w-full flex items-center justify-center max-w-[280px]"
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

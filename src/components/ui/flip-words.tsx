"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type FlipWordsProps = {
  words: string[];
  duration?: number;
  className?: string;
};

export function FlipWords({ words, duration = 2200, className }: FlipWordsProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!words.length) return;
    const intervalId = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, duration);
    return () => window.clearInterval(intervalId);
  }, [words, duration]);

  if (!words.length) return null;

  return (
    <span className={cn("inline-block align-baseline", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 10, opacity: 0, filter: "blur(5px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -10, opacity: 0, filter: "blur(5px)" }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}


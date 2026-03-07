"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  encryptedClassName?: string;
  revealedClassName?: string;
  revealDelayMs?: number;
  className?: string;
};

const ENCRYPTED_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+?";

const randomChar = () => ENCRYPTED_CHARS[Math.floor(Math.random() * ENCRYPTED_CHARS.length)];

export function EncryptedText({
  text,
  encryptedClassName,
  revealedClassName,
  revealDelayMs = 45,
  className,
}: EncryptedTextProps) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [noiseTick, setNoiseTick] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    setNoiseTick(0);
  }, [text]);

  useEffect(() => {
    const revealInterval = window.setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= chars.length) {
          window.clearInterval(revealInterval);
          return prev;
        }
        return prev + 1;
      });
    }, revealDelayMs);

    return () => window.clearInterval(revealInterval);
  }, [chars.length, revealDelayMs]);

  useEffect(() => {
    if (revealedCount >= chars.length) return;
    const scrambleInterval = window.setInterval(() => {
      setNoiseTick((prev) => prev + 1);
    }, 48);
    return () => window.clearInterval(scrambleInterval);
  }, [revealedCount, chars.length]);

  return (
    <span className={cn("inline", className)} aria-label={text}>
      {chars.map((char, index) => {
        const isRevealed = index < revealedCount;
        const displayChar = isRevealed ? char : char === " " ? "\u00A0" : randomChar();
        return (
          <span
            key={`${index}-${noiseTick}`}
            className={cn(isRevealed ? revealedClassName : encryptedClassName)}
          >
            {displayChar}
          </span>
        );
      })}
    </span>
  );
}


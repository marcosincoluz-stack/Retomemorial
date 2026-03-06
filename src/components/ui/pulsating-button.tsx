"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface PulsatingButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    pulseColor?: string;
    duration?: string;
}

export function PulsatingButton({
    className,
    children,
    pulseColor = "rgba(16, 185, 129, 0.5)",
    duration = "1.5s",
    ...props
}: PulsatingButtonProps) {
    return (
        <button
            className={cn(
                "relative flex cursor-pointer items-center justify-center rounded-lg px-8 py-3 text-center text-white font-bold bg-green-500",
                className
            )}
            {...props}
        >
            <div className="relative z-10">{children}</div>
            <div
                className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-lg bg-inherit opacity-70"
                style={{
                    boxShadow: `0 0 0 0 ${pulseColor}`,
                    animation: `pulse ${duration} cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                }}
            />
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 ${pulseColor};
          }
          70% {
            box-shadow: 0 0 0 10px transparent;
          }
          100% {
            box-shadow: 0 0 0 0 transparent;
          }
        }
      `}} />
        </button>
    );
}

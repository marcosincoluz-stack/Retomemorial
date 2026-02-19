"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface TypingAnimationProps {
    children: string;
    className?: string;
    duration?: number;
    delay?: number;
    as?: React.ElementType;
}

export default function TypingAnimation({
    children,
    className,
    duration = 200,
    delay = 0,
    as: Component = "div",
}: TypingAnimationProps) {
    const [displayedText, setDisplayedText] = useState<string>("");
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            setStarted(true);
        }, delay);
        return () => clearTimeout(startTimeout);
    }, [delay]);

    useEffect(() => {
        if (!started) return;

        let i = 0;
        const typingEffect = setInterval(() => {
            if (i < children.length) {
                setDisplayedText(children.substring(0, i + 1));
                i++;
            } else {
                clearInterval(typingEffect);
            }
        }, duration);

        return () => {
            clearInterval(typingEffect);
        };
    }, [children, duration, started]);

    return (
        <Component
            className={cn(
                "font-display text-center text-4xl font-bold leading-[5rem] tracking-[-0.02em] drop-shadow-sm",
                className,
            )}
        >
            {displayedText}
        </Component>
    );
}

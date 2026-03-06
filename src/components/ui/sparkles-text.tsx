"use client";

import { CSSProperties, ReactElement, useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface Sparkle {
    id: string;
    x: number;
    y: number;
    color: string;
    delay: number;
    scale: number;
    lifespan: number;
}

interface SparklesTextProps {
    /**
     * @default <div />
     * @type ReactElement
     * @description
     * The component to be rendered as the text
     * */
    as?: ReactElement;

    /**
     * @default ""
     * @type string
     * @description
     * The className of the component
     */
    className?: string;

    /**
     * @default ""
     * @type string
     * @description
     * The text to be rendered
     * */
    text: string;

    /**
     * @default 10
     * @type number
     * @description
     * The count of sparkles to be rendered
     * */
    sparklesCount?: number;

    /**
     * @default []
     * @type string[]
     * @description
     * The colors of the sparkles
     * */
    colors?: string[];
}

const SparklesText = ({
    text,
    colors = ["#FFC700"],
    className,
    sparklesCount = 10,
    ...props
}: SparklesTextProps) => {
    const [sparkles, setSparkles] = useState<Sparkle[]>([]);

    useEffect(() => {
        const generateSparkle = (): Sparkle => ({
            id: Math.random().toString(36).substring(7),
            x: Math.random() * 100,
            y: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 2,
            scale: Math.random() * 1 + 0.3,
            lifespan: Math.random() * 10 + 5,
        });

        const newSparkles = Array.from({ length: sparklesCount }, generateSparkle);
        setSparkles(newSparkles);

        const interval = setInterval(() => {
            setSparkles((currentSparkles) =>
                currentSparkles.map((sparkle) => {
                    if (sparkle.lifespan <= 0) {
                        return generateSparkle();
                    } else {
                        return { ...sparkle, lifespan: sparkle.lifespan - 0.1 };
                    }
                }),
            );
        }, 100);

        return () => clearInterval(interval);
    }, [colors, sparklesCount]);

    return (
        <div
            className={cn("text-6xl font-bold relative group", className)}
            {...props}
        >
            <span className="relative z-10">{text}</span>
            {sparkles.map((sparkle) => (
                <motion.span
                    key={sparkle.id}
                    className="absolute inline-block pointer-events-none z-20"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, sparkle.scale, 0],
                        rotate: [0, 180],
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatDelay: sparkle.delay,
                        ease: "easeInOut",
                    }}
                    style={{
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}%`,
                    }}
                >
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill={sparkle.color}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                </motion.span>
            ))}
        </div>
    );
};

export default SparklesText;

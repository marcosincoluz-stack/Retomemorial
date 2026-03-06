"use client";

import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate, useInView } from "framer-motion";
import { useEffect } from "react";

export const TypewriterEffectSmooth = ({
    words,
    className,
    cursorClassName,
}: {
    words: {
        text: string;
        className?: string;
    }[];
    className?: string;
    cursorClassName?: string;
}) => {
    // split text inside of words into array of characters
    const wordsArray = words.map((word) => {
        return {
            ...word,
            text: word.text.split(""),
        };
    });
    const [scope, animate] = useAnimate();
    const isInView = useInView(scope);
    useEffect(() => {
        if (isInView) {
            animate(
                "div",
                {
                    opacity: 1,
                    display: "inline-block",
                },
                {
                    duration: 0.05,
                    delay: stagger(0.05),
                }
            );
        }
    }, [isInView, animate]);

    const renderWords = () => {
        return (
            <div ref={scope} className="inline-block">
                {wordsArray.map((word, idx) => {
                    return (
                        <div key={`word-${idx}`} className="inline-block">
                            {word.text.map((char, index) => (
                                <motion.div
                                    initial={{
                                        opacity: 0,
                                        display: "none",
                                    }}
                                    key={`char-${index}`}
                                    className={cn(
                                        `text-white opacity-0 hidden`,
                                        word.className
                                    )}
                                >
                                    {char}
                                </motion.div>
                            ))}
                            &nbsp;
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className={cn("flex space-x-1", className)}>
            <motion.div
                className="overflow-hidden pb-2"
                initial={{
                    width: "0%",
                }}
                whileInView={{
                    width: "fit-content",
                }}
                transition={{
                    duration: 0.8,
                    ease: "circOut",
                    delay: 0.2,
                }}
            >
                <div
                    className="text-2xl sm:text-3xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-center"
                    style={{ whiteSpace: "nowrap" }}
                >
                    {renderWords()}
                </div>
            </motion.div>
            <motion.span
                initial={{
                    opacity: 0,
                }}
                animate={{
                    opacity: 1,
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                className={cn(
                    "inline-block rounded-sm w-[4px] h-6 sm:h-8 md:h-10 lg:h-12 bg-green-500",
                    cursorClassName
                )}
            ></motion.span>
        </div>
    );
};

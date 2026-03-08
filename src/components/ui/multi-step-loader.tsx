"use client";
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const CheckIcon = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className={cn("w-6 h-6", className)}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
        </svg>
    );
};

const CheckFilled = ({ className }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn("w-6 h-6", className)}
        >
            <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
            />
        </svg>
    );
};

export type LoadingState = {
    text: string;
};

const LoaderCore = ({
    loadingStates,
    value = 0,
}: {
    loadingStates: LoadingState[];
    value?: number;
}) => {
    return (
        <div className="flex relative justify-start max-w-xl mx-auto flex-col mt-28 md:mt-32 px-4">
            {loadingStates.map((condition, index) => {
                const distance = Math.abs(index - value);
                const opacity = Math.max(1 - distance * 0.1, 0.78);

                return (
                    <motion.div
                        key={index}
                        className={cn(
                            "text-left flex gap-2.5 mb-4",
                            index > value ? "text-slate-300" : "text-white"
                        )}
                        initial={{ opacity: 0, y: -(value * 40) }}
                        animate={{ opacity: opacity, y: -(value * 40) }}
                        transition={{ duration: 0.45 }}
                    >
                        <div className="shrink-0">
                            {index > value ? (
                                <CheckIcon className="text-slate-300 w-6 h-6 md:w-7 md:h-7" />
                            ) : (
                                <motion.div
                                    className="w-6 h-6 md:w-7 md:h-7 text-emerald-400"
                                    initial={{ opacity: 0.6, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.12, duration: 0.2 }}
                                >
                                    <CheckFilled className="text-emerald-400" />
                                </motion.div>
                            )}
                        </div>
                        <span
                            className={cn(
                                "text-white text-[17px] md:text-xl font-semibold tracking-tight drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]",
                                value === index
                                    ? "opacity-100"
                                    : index < value
                                        ? "opacity-90"
                                        : "opacity-80"
                            )}
                        >
                            {condition.text}
                        </span>
                    </motion.div>
                );
            })}
            <div className="mt-1 flex items-center gap-2 pl-[34px]">
                {loadingStates.map((_state, index) => (
                    <span
                        key={index}
                        className={cn(
                            "h-1 rounded-full transition-all duration-300",
                            index <= value ? "w-5 bg-emerald-300" : "w-2 bg-slate-500"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};

export const MultiStepLoader = ({
    loadingStates,
    loading,
    duration = 2000,
    loop = false,
    onComplete,
}: {
    loadingStates: LoadingState[];
    loading?: boolean;
    duration?: number;
    loop?: boolean;
    onComplete?: () => void;
}) => {
    const [currentState, setCurrentState] = useState(0);

    useEffect(() => {
        if (!loading) {
            setCurrentState(0);
            return;
        }
        const timeout = setTimeout(() => {
            if (currentState === loadingStates.length - 1) {
                if (loop) setCurrentState(0);
                else if (onComplete) onComplete();
            } else {
                setCurrentState((prevState) => prevState + 1);
            }
        }, duration);

        return () => clearTimeout(timeout);
    }, [currentState, loading, loop, loadingStates.length, duration, onComplete]);

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center bg-slate-950"
                >
                    <div className="h-96 relative">
                        <LoaderCore value={currentState} loadingStates={loadingStates} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

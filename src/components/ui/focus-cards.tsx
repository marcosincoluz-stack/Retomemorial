"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const Card = React.memo(
    ({
        card,
        index,
        hovered,
        setHovered,
        selected,
        onSelect,
    }: {
        card: any;
        index: number;
        hovered: number | null;
        setHovered: React.Dispatch<React.SetStateAction<number | null>>;
        selected: boolean;
        onSelect: () => void;
    }) => {
        return (
            <div
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
                onClick={onSelect}
                className={cn(
                    "rounded-xl relative bg-neutral-900 overflow-hidden h-60 md:h-72 w-full transition-all duration-300 ease-out cursor-pointer",
                    hovered !== null && hovered !== index && "blur-sm scale-[0.98]",
                    selected && "ring-4 ring-green-500 scale-[1.02]"
                )}
            >
                <img
                    src={card.image}
                    alt={card.name}
                    className="object-cover absolute inset-0 w-full h-full"
                />
                <div
                    className={cn(
                        "absolute inset-0 bg-black/60 flex items-end py-4 px-4 transition-opacity duration-300",
                        hovered === index || selected ? "opacity-100" : "opacity-0"
                    )}
                >
                    <div className="w-full">
                        <div className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200">
                            {card.name}
                        </div>
                        {card.mark && (
                            <div className="text-neutral-300 text-sm mt-1">
                                Marca personal: <span className="font-bold text-green-400">{card.mark}</span>
                            </div>
                        )}
                        {selected && (
                            <div className="text-green-500 font-bold uppercase tracking-wider text-xs mt-2 flex items-center gap-1">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                Seleccionado
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
);
Card.displayName = "Card";

export function FocusCards({
    cards,
    selectedId,
    onSelect,
}: {
    cards: any[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-4 max-w-7xl mx-auto w-full">
            {cards.map((card, index) => (
                <Card
                    key={card.id || index}
                    card={card}
                    index={index}
                    hovered={hovered}
                    setHovered={setHovered}
                    selected={selectedId === card.id}
                    onSelect={() => onSelect(card.id)}
                />
            ))}
        </div>
    );
}

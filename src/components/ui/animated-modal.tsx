"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ModalContext = createContext<{
    open: boolean;
    setOpen: (open: boolean) => void;
}>({
    open: false,
    setOpen: () => { },
});

export const ModalProvider = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    return (
        <ModalContext.Provider value={{ open, setOpen }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};

export function Modal({ children }: { children: React.ReactNode }) {
    return <ModalProvider>{children}</ModalProvider>;
}

export const ModalTrigger = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const { setOpen } = useModal();
    return (
        <div
            className={cn(className)}
            onClick={() => setOpen(true)}
        >
            {children}
        </div>
    );
};

export const ModalBody = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    const { open, setOpen } = useModal();

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <React.Fragment>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
                        onClick={() => setOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                "w-[90%] md:max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden relative",
                                className
                            )}
                        >
                            <button
                                className="absolute top-4 right-4 bg-neutral-800 rounded-full p-2 text-neutral-400 hover:text-white"
                                onClick={() => setOpen(false)}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M18 6l-12 12" />
                                    <path d="M6 6l12 12" />
                                </svg>
                            </button>
                            {children}
                        </motion.div>
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>
    );
};

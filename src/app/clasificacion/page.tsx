"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClasificacionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/?tab=clasificacion");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Redirigiendo a clasificación
        </p>
      </div>
    </main>
  );
}

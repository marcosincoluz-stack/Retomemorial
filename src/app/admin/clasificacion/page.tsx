"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  getLeaderboard,
  type LeaderboardEntry,
  type LeaderboardMeta,
} from "@/app/admin/actions";
import { EVENTS } from "@/lib/data";
import { Info, Loader2, RefreshCw, Trophy } from "lucide-react";

const DEFAULT_LEADERBOARD_META: LeaderboardMeta = {
  resultsComplete: false,
  winnersCutoff: 10,
  resultsStatus: "pending",
  completedResults: 0,
  expectedResults: 0,
};

export default function ClasificacionTab() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  const [meta, setMeta] = useState<LeaderboardMeta>(DEFAULT_LEADERBOARD_META);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getLeaderboard();
    if (result.ok && result.data) {
      setEntries(result.data);
      setMeta(result.meta ?? DEFAULT_LEADERBOARD_META);
    } else {
      setMeta(result.meta ?? DEFAULT_LEADERBOARD_META);
      setError(result.message ?? "No se pudo cargar la clasificación.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleDetails = (ref: string) => {
    setShowDetails((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) {
        next.delete(ref);
      } else {
        next.add(ref);
      }
      return next;
    });
  };

  const filteredEntries = entries.filter((e) =>
    e.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.nickname && e.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const winnerEntries = entries.filter((entry) => entry.isWinner);
  const statusLabel =
    meta.resultsStatus === "complete"
      ? "Resultados completos"
      : meta.resultsStatus === "partial"
      ? "Resultados parciales"
      : "Resultados pendientes";

  const formatNumber = (value: number) => {
    if (value === 0) return "—";
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Cargando clasificación...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={loadData} className="mt-3 text-sm font-bold text-red-600 hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por referencia..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <button
          onClick={loadData}
          className="size-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className={`mb-4 rounded-2xl border p-4 ${
        meta.resultsStatus === "complete"
          ? "border-emerald-200 bg-emerald-50"
          : meta.resultsStatus === "partial"
          ? "border-sky-200 bg-sky-50"
          : "border-slate-200 bg-white"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Estado de resultados
            </p>
            <p className="mt-1 text-sm font-extrabold text-slate-900">
              {statusLabel}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {meta.completedResults}/{meta.expectedResults || "?"} resultados con posición guardada.
              {" "}Los ganadores se activan al cerrar todas las pruebas.
            </p>
          </div>
          <span className="rounded-full bg-white/80 border border-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-slate-600">
            Top {meta.winnersCutoff}
          </span>
        </div>

        {meta.resultsComplete && winnerEntries.length > 0 && (
          <div className="mt-3 border-t border-emerald-200/70 pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
              Ganadores detectados
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {winnerEntries.map((entry) => (
                <span
                  key={entry.reference}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-emerald-200 px-2.5 py-1 text-[11px] font-bold text-emerald-900"
                >
                  <Trophy className="h-3 w-3 text-emerald-600" />
                  #{entry.rank} {entry.nickname || entry.reference}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500">
          {filteredEntries.length} entrada{filteredEntries.length !== 1 ? "s" : ""}
          {entries.length !== filteredEntries.length && ` de ${entries.length}`}
        </p>
        <p className="inline-flex items-center gap-1 text-xs text-slate-400" title="Puntuación = Puntos ganados ÷ Puntos invertidos × 100">
          <Info className="h-3 w-3" />
          Ganados ÷ invertidos × 100
        </p>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">
            {entries.length === 0
              ? "Aún no hay resultados. Introduce resultados en la pestaña Resultados."
              : "No se encontraron entradas."}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredEntries.map((entry) => {
            const isTop3 = entry.rank <= 3;
            const isExpanded = showDetails.has(entry.reference);

            return (
              <div key={entry.reference}>
                <button
                  onClick={() => toggleDetails(entry.reference)}
                  className={`w-full rounded-xl border p-3 text-left transition-colors ${
                    isTop3
                      ? entry.rank === 1
                        ? "bg-amber-50/80 border-amber-200 hover:bg-amber-50"
                        : entry.rank === 2
                        ? "bg-slate-50 border-slate-200 hover:bg-white"
                        : "bg-orange-50/80 border-orange-200 hover:bg-orange-50"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex size-7 items-center justify-center rounded-lg text-xs font-black ${
                        entry.rank === 1
                          ? "bg-amber-200 text-amber-800"
                          : entry.rank === 2
                          ? "bg-slate-200 text-slate-600"
                          : entry.rank === 3
                          ? "bg-orange-200 text-orange-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {entry.rank <= 3 ? <Trophy className="w-3 h-3" /> : entry.rank}
                      </span>
                      <div className="min-w-0">
                        {entry.nickname ? (
                          <>
                            <p className="text-sm font-extrabold text-slate-900 truncate">
                              {entry.nickname}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              <span className="font-mono tracking-wider">{entry.reference}</span>
                              {" · "}{new Date(entry.createdAt).toLocaleString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}
                              {" · "}{entry.selectedSlotsCount} huecos
                              {entry.delivered && " · Entregado"}
                              {entry.isWinner && " · Ganador"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-mono text-sm font-bold text-slate-900 truncate">
                              {entry.reference}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(entry.createdAt).toLocaleString("es-ES", {
                                day: "numeric",
                                month: "short",
                              })}
                              {" · "}{entry.selectedSlotsCount} huecos
                              {entry.delivered && " · Entregado"}
                              {entry.isWinner && " · Ganador"}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-black ${
                        entry.efficiency > 0
                          ? entry.rank === 1 ? "text-amber-600" : "text-slate-900"
                          : "text-slate-300"
                      }`}>
                        {formatNumber(entry.efficiency)}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">efic.</p>
                      <p className="text-[10px] text-slate-400">
                        {formatNumber(entry.totalScore)} / {formatNumber(entry.totalInvested)}
                      </p>
                    </div>
                  </div>
                </button>

                {isExpanded && Object.keys(entry.breakdown).length > 0 && (
                  <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {EVENTS.map((event) => {
                        const eventBreakdown = entry.breakdown[event.slug];
                        if (!eventBreakdown) return null;

                        const slots = [
                          { label: "M", data: eventBreakdown.male },
                          { label: "F", data: eventBreakdown.female },
                          { label: "Reto", data: eventBreakdown.winner },
                        ].filter((s) => s.data !== null) as { label: string; data: { athleteId: string; points: number; retoBonus: boolean } }[];

                        return (
                          <div key={event.slug} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                              {event.name}
                            </p>
                            {slots.length === 0 ? (
                              <p className="text-[11px] text-slate-400">Sin datos</p>
                            ) : (
                              <div className="space-y-0.5">
                                {slots.map((slot, i) => (
                                  <div key={i} className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] text-slate-500 font-semibold">{slot.label}</span>
                                    <span className={`text-[11px] font-bold ${
                                      slot.data.retoBonus ? "text-emerald-600" : "text-slate-700"
                                    }`}>
                                      {slot.label === "Reto"
                                        ? slot.data.retoBonus ? "x2 activo" : "reto"
                                        : `${slot.data.points}${slot.data.retoBonus ? " x2" : ""}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

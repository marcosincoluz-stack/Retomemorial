"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  getEventResults,
  saveEventResultsAction,
  type EventResultEntry,
  type EventResultsData,
} from "@/app/admin/actions";
import { EVENTS } from "@/lib/data";
import { Loader2, Save, Trophy } from "lucide-react";

type DirtyMark = Record<string, string>;

export default function ResultsTab() {
  const [data, setData] = useState<EventResultsData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEvent, setActiveEvent] = useState(EVENTS[0]?.slug ?? "");
  const [dirtyMarks, setDirtyMarks] = useState<DirtyMark>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getEventResults();
    if (result.ok && result.data) {
      setData(result.data);
    } else {
      setError(result.message ?? "No se pudieron cargar los resultados.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const currentData = data?.find((d) => d.eventSlug === activeEvent);

  const handleMarkChange = (athleteId: string, value: string) => {
    setDirtyMarks((prev) => ({ ...prev, [athleteId]: value }));
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!currentData) return;

    setSaving(true);
    setSaveMessage(null);

    const results = currentData.results.map((r) => {
      const dirtyValue = dirtyMarks[r.athleteId];
      const mark = dirtyValue !== undefined
        ? (dirtyValue.trim() === "" ? null : parseFloat(dirtyValue))
        : r.mark;
      return {
        athleteDbId: r.athleteDbId,
        mark: mark !== null && !isNaN(mark!) ? mark : null,
      };
    });

    const result = await saveEventResultsAction(activeEvent, results);

    if (result.ok) {
      setDirtyMarks({});
      setSaveMessage("Resultados guardados correctamente.");
      await loadResults();
    } else {
      setSaveMessage(result.message ?? "Error al guardar.");
    }

    setSaving(false);
  };

  const getDisplayMark = (entry: EventResultEntry): string => {
    const dirty = dirtyMarks[entry.athleteId];
    if (dirty !== undefined) return dirty;
    if (entry.mark !== null && entry.mark !== undefined) return entry.mark.toString();
    return "";
  };

  const getMarkToBeat = (eventSlug: string, gender: "male" | "female"): number | null => {
    const event = EVENTS.find((e) => e.slug === eventSlug);
    if (!event) return null;
    return event.markToBeat[gender] ?? null;
  };

  const hasDirtyMarks = Object.keys(dirtyMarks).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Cargando resultados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={loadResults} className="mt-3 text-sm font-bold text-red-600 hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {EVENTS.map((event) => (
          <button
            key={event.slug}
            onClick={() => { setActiveEvent(event.slug); setDirtyMarks({}); setSaveMessage(null); }}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
              activeEvent === event.slug
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {event.name}
          </button>
        ))}
      </div>

      {currentData && (
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                Resultados — {currentData.eventName}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Introduce la marca de cada atleta. El sistema calcula posiciones y puntuación automáticamente.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Pos</th>
                  <th className="text-left px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Atleta</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Género</th>
                  <th className="text-right px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Marca a batir</th>
                  <th className="text-right px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Marca real</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Reto x2</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Pts</th>
                </tr>
              </thead>
              <tbody>
                {currentData.results.map((entry, index) => {
                  const markToBeat = getMarkToBeat(currentData.eventSlug, entry.athleteGender);
                  const hasRetoBonus = entry.retoBonus;
                  const displayMark = getDisplayMark(entry);
                  const currentMarkValue = dirtyMarks[entry.athleteId] !== undefined
                    ? (dirtyMarks[entry.athleteId].trim() === "" ? null : parseFloat(dirtyMarks[entry.athleteId]))
                    : entry.mark;
                  const isCurrentlyAboveMark = currentMarkValue !== null && markToBeat !== null && currentMarkValue >= markToBeat;

                  return (
                    <tr
                      key={entry.athleteId}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-2.5">
                        {entry.position !== null ? (
                          <span className={`inline-flex size-6 items-center justify-center rounded-lg text-xs font-black ${
                            entry.position <= 3
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {entry.position}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-bold text-slate-900">{entry.athleteName}</span>
                        <span className="ml-2 text-[10px] font-mono text-slate-400">#{entry.athleteId}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                          entry.athleteGender === "male"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-pink-50 text-pink-700 border border-pink-200"
                        }`}>
                          {entry.athleteGender === "male" ? "M" : "F"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-slate-500">
                        {markToBeat !== null ? `${markToBeat.toFixed(2)}m` : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={displayMark}
                          onChange={(e) => handleMarkChange(entry.athleteId, e.target.value)}
                          placeholder="—"
                          className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-right font-mono outline-none focus:border-slate-400 focus:bg-white transition-colors"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {isCurrentlyAboveMark ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                            <Trophy className="w-3 h-3" />
                            x2
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        {entry.score !== null ? (
                          <span className={`font-black ${
                            entry.score > 0
                              ? hasRetoBonus ? "text-emerald-600" : "text-slate-900"
                              : "text-slate-400"
                          }`}>
                            {hasRetoBonus ? `${entry.score}` : entry.score}
                            {hasRetoBonus && entry.score !== null && (
                              <span className="text-[9px] text-emerald-500 ml-0.5">(x2)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {currentData.results.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              No hay atletas para este evento.
            </div>
          )}

          {saveMessage && (
            <div className={`px-5 py-3 text-sm font-medium border-t ${
              saveMessage.includes("Error") || saveMessage.includes("error")
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}>
              {saveMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  getAthletesList,
  upsertAthlete,
  deleteAthleteAction,
  upsertHighlightAction,
  deleteHighlightAction,
  uploadAthleteImageAction,
  type AdminAthlete,
  type AdminHighlight,
} from "@/app/admin/actions";
import { EVENTS } from "@/lib/data";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  Loader2,
  Trophy,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

type AthletesTabProps = {
  initialData?: AdminAthlete[];
};

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  gold: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  silver: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" },
  bronze: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300" },
};

const TIER_LABELS: Record<string, string> = {
  gold: "Oro",
  silver: "Plata",
  bronze: "Bronce",
};

function buildExternalKeyPrefix(eventSlug: string, gender: "male" | "female") {
  const eventInitial = eventSlug.trim().charAt(0).toLowerCase();
  const genderInitial = gender === "male" ? "m" : "f";
  return `${eventInitial}${genderInitial}`;
}

function getNextExternalKeyFromList(
  existingExternalKeys: string[],
  eventSlug: string,
  gender: "male" | "female"
) {
  const prefix = buildExternalKeyPrefix(eventSlug, gender);
  const pattern = new RegExp(`^${prefix}(\\d+)$`);
  let maxSuffix = 0;

  for (const key of existingExternalKeys) {
    const match = pattern.exec(key.toLowerCase());
    if (!match) continue;
    const suffix = Number.parseInt(match[1], 10);
    if (Number.isFinite(suffix) && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  }

  return `${prefix}${maxSuffix + 1}`;
}

export default function AthletesTab({ initialData }: AthletesTabProps) {
  const [athletes, setAthletes] = useState<AdminAthlete[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingAthlete, setEditingAthlete] = useState<AdminAthlete | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    setLoading(true);
    setError(null);
    const result = await getAthletesList();
    if (result.ok && result.data) {
      setAthletes(result.data);
    } else {
      setError(result.message ?? "No se pudieron cargar los atletas.");
    }
    setLoading(false);
  };

  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (filterEvent !== "all" && a.eventSlug !== filterEvent) return false;
      if (filterGender !== "all" && a.gender !== filterGender) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!a.name.toLowerCase().includes(q) && !a.externalKey.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [athletes, filterEvent, filterGender, searchQuery]);

  const handleDelete = async (athleteId: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    setDeleting(athleteId);
    const result = await deleteAthleteAction(athleteId);
    if (result.ok) {
      setAthletes((prev) => prev.filter((a) => a.id !== athleteId));
    } else {
      alert(result.message ?? "No se pudo eliminar el atleta.");
    }
    setDeleting(null);
  };

  const handleSave = async (data: {
    externalKey?: string;
    eventSlug: string;
    gender: "male" | "female";
    name: string;
    mark: number;
    imageUrl: string;
    bio: string;
    highlights: AdminHighlight[];
  }) => {
    setSaving(true);
    const result = await upsertAthlete(data);
    if (result.ok && result.data) {
      if (editingAthlete) {
        setAthletes((prev) =>
          prev.map((a) => (a.id === result.data!.id ? result.data! : a))
        );
      } else {
        setAthletes((prev) => [...prev, result.data!]);
      }
      setEditingAthlete(null);
      setIsCreating(false);
    } else {
      alert(result.message ?? "No se pudo guardar el atleta.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        <span className="ml-2 text-sm text-slate-500">Cargando atletas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button onClick={loadAthletes} className="mt-3 text-sm font-bold text-red-600 hover:underline">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div>
      {(isCreating || editingAthlete) && (
        <AthleteFormModal
          athlete={editingAthlete}
          existingExternalKeys={athletes.map((item) => item.externalKey)}
          saving={saving}
          onSave={handleSave}
          onClose={() => { setEditingAthlete(null); setIsCreating(false); }}
        />
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="all">Todos los eventos</option>
          {EVENTS.map((e) => (
            <option key={e.slug} value={e.slug}>{e.name}</option>
          ))}
        </select>

        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="all">Masculino + Femenino</option>
          <option value="male">Masculino</option>
          <option value="female">Femenino</option>
        </select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar atleta..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Añadir atleta
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Mostrando {filteredAthletes.length} de {athletes.length} atletas
      </p>

      <div className="space-y-2">
        {filteredAthletes.map((athlete) => (
          <AthleteRow
            key={athlete.id}
            athlete={athlete}
            deleting={deleting === athlete.id}
            onEdit={() => setEditingAthlete(athlete)}
            onDelete={() => handleDelete(athlete.id, athlete.name)}
          />
        ))}
        {filteredAthletes.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">No se encontraron atletas.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AthleteRow({
  athlete,
  deleting,
  onEdit,
  onDelete,
}: {
  athlete: AdminAthlete;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const eventName = EVENTS.find((e) => e.slug === athlete.eventSlug)?.name ?? athlete.eventSlug;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-3">
      <div className="size-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
        {athlete.imageUrl ? (
          <ProgressiveImage
            src={athlete.imageUrl}
            alt={athlete.name}
            wrapperClassName="size-full"
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full flex items-center justify-center text-slate-400">
            <Trophy className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-slate-900 truncate">{athlete.name}</p>
          <span className="text-[10px] font-mono font-bold text-slate-400">#{athlete.externalKey}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-semibold text-slate-500">{eventName}</span>
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {athlete.gender === "male" ? "M" : "F"}
          </span>
          <span className="text-[11px] font-mono text-slate-600">{athlete.mark}m</span>
        </div>
        {athlete.highlights.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {athlete.highlights.slice(0, 2).map((h) => {
              const colors = TIER_COLORS[h.tier] ?? TIER_COLORS.bronze;
              return (
                <span key={h.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text} ${colors.border} border`}>
                  {TIER_LABELS[h.tier]}: {h.label}
                </span>
              );
            })}
            {athlete.highlights.length > 2 && (
              <span className="text-[9px] text-slate-400 font-semibold">+{athlete.highlights.length - 2}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="size-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="size-8 rounded-lg border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Eliminar"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 text-red-500 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-red-500" />}
        </button>
      </div>
    </div>
  );
}

function AthleteFormModal({
  athlete,
  existingExternalKeys,
  saving,
  onSave,
  onClose,
}: {
  athlete: AdminAthlete | null;
  existingExternalKeys: string[];
  saving: boolean;
  onSave: (data: {
    externalKey?: string;
    eventSlug: string;
    gender: "male" | "female";
    name: string;
    mark: number;
    imageUrl: string;
    bio: string;
    highlights: AdminHighlight[];
  }) => void;
  onClose: () => void;
}) {
  const isEditing = athlete !== null;

  const [eventSlug, setEventSlug] = useState(athlete?.eventSlug ?? EVENTS[0].slug);
  const [gender, setGender] = useState<"male" | "female">(athlete?.gender ?? "male");
  const [name, setName] = useState(athlete?.name ?? "");
  const [mark, setMark] = useState(athlete?.mark?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(athlete?.imageUrl ?? "");
  const [bio, setBio] = useState(athlete?.bio ?? "");
  const [highlights, setHighlights] = useState<AdminHighlight[]>(athlete?.highlights ?? []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newHighlightTier, setNewHighlightTier] = useState<"gold" | "silver" | "bronze">("gold");
  const [newHighlightLabel, setNewHighlightLabel] = useState("");

  const autoExternalKeyPreview = useMemo(() => {
    if (isEditing) return athlete.externalKey;
    return getNextExternalKeyFromList(existingExternalKeys, eventSlug, gender);
  }, [isEditing, athlete, existingExternalKeys, eventSlug, gender]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadAthleteImageAction(formData);
    if (result.ok && result.url) {
      setImageUrl(result.url);
    } else {
      alert(result.message ?? "No se pudo subir la imagen.");
    }
    setUploading(false);
  };

  const addHighlight = () => {
    if (!newHighlightLabel.trim()) return;
    setHighlights((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        tier: newHighlightTier,
        label: newHighlightLabel.trim(),
        sortOrder: prev.length,
      },
    ]);
    setNewHighlightLabel("");
  };

  const removeHighlight = (id: string) => {
    setHighlights((prev) => {
      const filtered = prev.filter((h) => h.id !== id);
      return filtered.map((h, i) => ({ ...h, sortOrder: i }));
    });
  };

  const moveHighlight = (index: number, direction: "up" | "down") => {
    setHighlights((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((h, i) => ({ ...h, sortOrder: i }));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mark) return;

    onSave({
      externalKey: isEditing ? athlete.externalKey : undefined,
      eventSlug,
      gender,
      name: name.trim(),
      mark: parseFloat(mark),
      imageUrl,
      bio,
      highlights,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900">
            {isEditing ? "Editar atleta" : "Nuevo atleta"}
          </h2>
          <button onClick={onClose} className="size-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">ID externo {isEditing ? "" : "(auto)"}</span>
              <input
                value={autoExternalKeyPreview}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 font-mono"
                placeholder="dm1"
                disabled
                readOnly
              />
              {!isEditing && (
                <span className="mt-1 block text-[10px] text-slate-500">
                  Se asigna automáticamente al guardar.
                </span>
              )}
            </label>

            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Marca (m)</span>
              <input
                type="number"
                step="0.01"
                value={mark}
                onChange={(e) => setMark(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 font-mono"
                placeholder="64.53"
                required
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombre completo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              placeholder="Yasiel Sotero"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Evento</span>
              <select
                value={eventSlug}
                onChange={(e) => setEventSlug(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                {EVENTS.map((e) => (
                  <option key={e.slug} value={e.slug}>{e.name}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Género</span>
              <div className="mt-1 flex rounded-xl border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`flex-1 py-2 text-sm font-bold transition-colors ${
                    gender === "male" ? "bg-slate-900 text-white" : "bg-white text-slate-500"
                  }`}
                >
                  Masculino
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`flex-1 py-2 text-sm font-bold transition-colors ${
                    gender === "female" ? "bg-slate-900 text-white" : "bg-white text-slate-500"
                  }`}
                >
                  Femenino
                </button>
              </div>
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Foto</span>
            <div className="mt-1 flex items-center gap-3">
              {imageUrl && (
                <div className="size-14 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                  <ProgressiveImage
                    src={imageUrl}
                    alt="Preview"
                    wrapperClassName="size-full"
                    className="size-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {uploading ? "Subiendo..." : "Subir foto"}
                </button>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-400 font-mono"
                  placeholder="/foto.jpg o URL"
                />
              </div>
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 resize-none"
              placeholder="Descripción del atleta..."
            />
          </label>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Highlights / Logros</span>
            <div className="mt-2 space-y-2">
              {highlights.map((h, index) => (
                <div key={h.id} className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${TIER_COLORS[h.tier].bg} ${TIER_COLORS[h.tier].text} ${TIER_COLORS[h.tier].border} border shrink-0`}>
                    {TIER_LABELS[h.tier]}
                  </span>
                  <span className="text-sm text-slate-700 flex-1 truncate">{h.label}</span>
                  <div className="flex gap-0.5 shrink-0">
                    <button type="button" onClick={() => moveHighlight(index, "up")} disabled={index === 0} className="size-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => moveHighlight(index, "down")} disabled={index === highlights.length - 1} className="size-6 rounded border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-30">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => removeHighlight(h.id)} className="size-6 rounded border border-red-200 flex items-center justify-center hover:bg-red-50">
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2">
                <select value={newHighlightTier} onChange={(e) => setNewHighlightTier(e.target.value as any)} className="rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-bold outline-none">
                  <option value="gold">Oro</option>
                  <option value="silver">Plata</option>
                  <option value="bronze">Bronce</option>
                </select>
                <input
                  value={newHighlightLabel}
                  onChange={(e) => setNewHighlightLabel(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400"
                  placeholder="Logro o medalla..."
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHighlight(); } }}
                />
                <button type="button" onClick={addHighlight} className="size-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 shrink-0">
                  <Plus className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear atleta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

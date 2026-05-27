"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DotPattern } from "@/components/ui/dot-pattern";
import {
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getAdminSessionState,
  getBetByReference,
  deleteBetByReference,
  markBetAsDelivered,
  getResetPreview,
  resetCompetitionData,
  type AdminBetDetail,
  type AdminDashboard,
  type ResetPreview,
} from "@/app/admin/actions";
import {
  Search,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Trophy,
  BarChart3,
  Trash2,
  Users,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { ProgressiveImage } from "@/components/ui/progressive-image";
import { ATHLETES, getAthleteCost } from "@/lib/data";
import AthletesTab from "@/app/admin/athletes/page";
import ResultsTab from "@/app/admin/results/page";
import ClasificacionTab from "@/app/admin/clasificacion/page";

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

type TabKey = "resumen" | "atletas" | "apuestas" | "resultados" | "clasificacion";

const findAthleteCost = (athleteId: string) => {
  for (const [eventSlug, genders] of Object.entries(ATHLETES)) {
    for (const [genderKey, list] of Object.entries(genders)) {
      if (list.some(a => a.id === athleteId)) {
        return getAthleteCost(athleteId, eventSlug, genderKey as "male" | "female");
      }
    }
  }
  return 0;
};

const isAthleteChallengeWinner = (
  athleteId: string,
  selections: Record<string, { maleId: string | null; femaleId: string | null; winnerId: string | null }>
) => {
  if (!selections) return false;
  for (const selection of Object.values(selections)) {
    if (selection.winnerId === "both" && (selection.maleId === athleteId || selection.femaleId === athleteId)) {
      return true;
    }
    if (selection.winnerId === athleteId) {
      return true;
    }
  }
  return false;
};

export default function AdminPage() {
  const pendingPreviewLimit = 5;
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [searchRef, setSearchRef] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [deleteLoadingRef, setDeleteLoadingRef] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [betDetail, setBetDetail] = useState<AdminBetDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("resumen");
  const [showAllPending, setShowAllPending] = useState(false);
  const [resetPreview, setResetPreview] = useState<ResetPreview | null>(null);
  const [loadingResetPreview, setLoadingResetPreview] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetConfirmationChecked, setResetConfirmationChecked] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState("");
  const [resettingCompetitionData, setResettingCompetitionData] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated" || activeTab !== "apuestas") return;
    void loadResetPreview();
  }, [authStatus, activeTab]);

  const pendingTickets = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.recentBets.filter((item) => !item.delivered);
  }, [dashboard]);

  const visiblePendingTickets = useMemo(() => {
    if (showAllPending) return pendingTickets;
    return pendingTickets.slice(0, pendingPreviewLimit);
  }, [pendingTickets, showAllPending]);

  const hasMorePendingThanPreview = pendingTickets.length > pendingPreviewLimit;

  const searchedBetTotalSpentPoints = useMemo(() => {
    if (!betDetail) return 0;
    return betDetail.athletes.reduce((acc, athlete) => {
      return acc + findAthleteCost(athlete.id);
    }, 0);
  }, [betDetail]);

  const bootstrap = async () => {
    setAuthStatus("loading");
    const session = await getAdminSessionState();
    if (!session.authenticated) {
      setAuthStatus("unauthenticated");
      return;
    }

    setAuthStatus("authenticated");
    await refreshDashboard();
  };

  const refreshDashboard = async () => {
    setLoadingDashboard(true);
    setDashboardError(null);

    const response = await getAdminDashboard();
    if (!response.ok) {
      if (response.unauthorized) {
        setAuthStatus("unauthenticated");
      } else {
        setDashboardError(response.message ?? "No se pudieron cargar las métricas.");
      }
      setLoadingDashboard(false);
      return;
    }

    setDashboard(response.data ?? null);
    setLoadingDashboard(false);
  };

  const loadResetPreview = async () => {
    setLoadingResetPreview(true);
    setResetError(null);

    const response = await getResetPreview();
    if (!response.ok) {
      if (response.unauthorized) {
        setAuthStatus("unauthenticated");
      } else {
        setResetError(response.message ?? "No se pudo cargar el impacto del reset.");
      }
      setLoadingResetPreview(false);
      return;
    }

    setResetPreview(response.data ?? null);
    setLoadingResetPreview(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    const result = await adminLogin(email.trim(), password);
    if (!result.ok) {
      setLoginError(result.message ?? "No se pudo iniciar sesión.");
      return;
    }

    setEmail("");
    setPassword("");
    setAuthStatus("authenticated");
    await refreshDashboard();
  };

  const handleLogout = async () => {
    await adminLogout();
    setDashboard(null);
    setBetDetail(null);
    setSearchRef("");
    setAuthStatus("unauthenticated");
  };

  const handleSearchBet = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedRef = searchRef.trim().toUpperCase();
    if (!normalizedRef) return;

    setSearchLoading(true);
    setSearchError(null);
    setBetDetail(null);

    const response = await getBetByReference(normalizedRef);
    if (!response.ok) {
      if (response.unauthorized) {
        setAuthStatus("unauthenticated");
      } else {
        setSearchError(response.message ?? "No se encontró la apuesta.");
      }
      setSearchLoading(false);
      return;
    }

    setBetDetail(response.data ?? null);
    setSearchLoading(false);
  };

  const handleMarkDelivered = async () => {
    if (!betDetail) return;

    const response = await markBetAsDelivered(betDetail.reference);
    if (!response.ok) {
      if (response.unauthorized) {
        setAuthStatus("unauthenticated");
      } else {
        setSearchError(response.message ?? "No se pudo marcar como entregado.");
      }
      return;
    }

    const refreshed = await getBetByReference(betDetail.reference);
    if (refreshed.ok && refreshed.data) {
      setBetDetail(refreshed.data);
    }
    await refreshDashboard();
  };

  const handleDeleteBet = async (reference: string) => {
    const normalizedReference = reference.trim().toUpperCase();
    if (!normalizedReference) return;

    const confirmed = window.confirm(
      `¿Borrar la apuesta ${normalizedReference}? Esta acción elimina también sus picks, bloqueo de dispositivo y puntuación.`
    );
    if (!confirmed) return;

    setDeleteLoadingRef(normalizedReference);
    setSearchError(null);

    const response = await deleteBetByReference(normalizedReference);
    setDeleteLoadingRef(null);

    if (!response.ok) {
      if (response.unauthorized) {
        setAuthStatus("unauthenticated");
      } else {
        setSearchError(response.message ?? "No se pudo borrar la apuesta.");
      }
      return;
    }

    if (betDetail?.reference === normalizedReference) {
      setBetDetail(null);
    }
    if (searchRef.trim().toUpperCase() === normalizedReference) {
      setSearchRef("");
    }
    await refreshDashboard();
  };

  const handleResetCompetitionData = async () => {
    if (!resetConfirmationChecked) {
      setResetError("Debes confirmar que entiendes la operación.");
      return;
    }

    if (resetConfirmationText.trim().toUpperCase() !== "RESET") {
      setResetError("Escribe RESET para desbloquear la operación.");
      return;
    }

    const confirmed = window.confirm(
      "Se borrarán TODAS las apuestas, resultados y clasificación actual. ¿Quieres continuar?"
    );
    if (!confirmed) return;

    setResettingCompetitionData(true);
    setResetError(null);
    setResetSuccess(null);

    const response = await resetCompetitionData();
    setResettingCompetitionData(false);

    if (!response.ok) {
      if (response.unauthorized) {
        setAuthStatus("unauthenticated");
      } else {
        setResetError(response.message ?? "No se pudo ejecutar el reset.");
      }
      return;
    }

    setResetSuccess(
      `Reset completado (${new Date(response.executedAt ?? Date.now()).toLocaleString()}). ` +
      `Apuestas: ${response.deleted?.participations ?? 0}, resultados: ${response.deleted?.results ?? 0}, puntuaciones: ${response.deleted?.scores ?? 0}.`
    );
    setBetDetail(null);
    setSearchRef("");
    setShowAllPending(false);
    setResetConfirmationChecked(false);
    setResetConfirmationText("");

    await Promise.all([refreshDashboard(), loadResetPreview()]);
  };

  if (authStatus === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <p className="text-slate-500 font-semibold">Cargando panel admin...</p>
      </main>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 relative p-6 md:p-12 flex flex-col items-center justify-center">
        <DotPattern className="fixed inset-0 z-0 opacity-25" cx={1} cy={1} cr={1} />
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Admin Memorial</h1>
              <p className="text-xs text-slate-500 uppercase tracking-[0.12em]">
                Acceso restringido
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder="admin@tudominio.com"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                Contraseña
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {loginError && (
              <p className="text-sm text-red-600 font-medium">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 text-white font-bold py-3.5 hover:bg-slate-800 transition-colors"
            >
              Entrar al panel
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 relative p-5 md:p-10">
      <DotPattern className="fixed inset-0 z-0 opacity-20" cx={1} cy={1} cr={1} />

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Panel Admin</h1>
            <p className="text-xs md:text-sm text-slate-500 uppercase tracking-[0.14em]">
              Estadísticas y control
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </header>

        <nav className="mb-6 flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button onClick={() => setActiveTab("resumen")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "resumen" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>Resumen</button>
          <button onClick={() => setActiveTab("atletas")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "atletas" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>Atletas</button>
          <button onClick={() => setActiveTab("apuestas")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "apuestas" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>Apuestas</button>
          <button onClick={() => setActiveTab("resultados")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "resultados" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>Resultados</button>
          <button onClick={() => setActiveTab("clasificacion")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "clasificacion" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"}`}>Clasificación</button>
        </nav>

        {activeTab === "atletas" && <AthletesTab />}

        {activeTab === "resultados" && <ResultsTab />}

        {activeTab === "clasificacion" && <ClasificacionTab />}

        {activeTab === "resumen" && (
          <>
            {dashboardError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                {dashboardError}
              </div>
            )}

            {loadingDashboard && !dashboard ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 font-semibold">
                Cargando métricas...
              </div>
            ) : null}

            {dashboard && (
              <>
                <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                  <MetricCard label="Total apuestas" value={dashboard.overview.totalApuestas} icon={<BarChart3 className="w-4 h-4" />} />
                  <MetricCard label="Entregadas" value={dashboard.overview.totalEntregadas} icon={<CheckCircle2 className="w-4 h-4" />} />
                  <MetricCard label="Pendientes" value={dashboard.overview.totalPendientes} icon={<Users className="w-4 h-4" />} />
                  <MetricCard label="Apuestas hoy" value={dashboard.overview.apuestasHoy} icon={<BarChart3 className="w-4 h-4" />} />
                  <MetricCard label="Huecos seleccionados" value={dashboard.overview.huecosSeleccionados} icon={<Trophy className="w-4 h-4" />} />
                </section>

                <section className="mb-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5">
                    <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500 mb-3">
                      Favorito del público por prueba (%)
                    </h2>
                    <EventFavoritesCharts items={dashboard.eventFavorites} />
                  </div>
                </section>

                <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5">
                  <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500 mb-3">
                    Eventos
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {dashboard.eventStats.map((stat) => (
                      <div key={stat.eventSlug} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <p className="font-bold text-slate-900">{stat.eventName}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Tickets con selección: <b>{stat.ticketsConSeleccion}</b>
                        </p>
                        <p className="text-xs text-slate-500">
                          M: <b>{stat.seleccionesMasculinas}</b> · F: <b>{stat.seleccionesFemeninas}</b>
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </>
        )}

        {activeTab === "apuestas" && (
          <>
            {dashboardError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                {dashboardError}
              </div>
            )}

            {loadingDashboard && !dashboard ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 font-semibold">
                Cargando...
              </div>
            ) : null}

            {dashboard && (
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500 mb-3">
                  Buscar ticket
                </h2>
                <form onSubmit={handleSearchBet} className="relative mb-3">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    value={searchRef}
                    onChange={(event) => setSearchRef(event.target.value)}
                    placeholder="RM-XXXX-XXX"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-28 font-mono uppercase outline-none focus:border-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={searchLoading || !searchRef.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 rounded-lg bg-slate-900 text-white px-4 text-sm font-bold disabled:opacity-50"
                  >
                    Buscar
                  </button>
                </form>

                {searchError && (
                  <p className="text-sm text-red-600 font-medium mb-2">{searchError}</p>
                )}

                {betDetail && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em]">Referencia</p>
                        <p className="font-mono text-lg font-black text-slate-900">{betDetail.reference}</p>
                      </div>
                      {betDetail.delivered ? (
                        <span className="rounded-full border border-emerald-300 bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-bold">
                          Entregado
                        </span>
                      ) : (
                        <span className="rounded-full border border-amber-300 bg-amber-100 text-amber-700 px-3 py-1 text-xs font-bold">
                          Pendiente
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                      <p>
                        Huecos seleccionados: <b>{betDetail.selectedSlotsCount}</b>
                      </p>
                      <p>
                        Puntos gastados: <b className="font-mono text-slate-900">{searchedBetTotalSpentPoints} / 35</b>
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {new Date(betDetail.createdAt).toLocaleString()}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {betDetail.athletes.map((athlete) => (
                        <div key={`${betDetail.reference}-${athlete.id}`} className="rounded-xl border border-slate-200 bg-white p-2 relative overflow-hidden">
                          {isAthleteChallengeWinner(athlete.id, betDetail.selections) && (
                            <div className="absolute top-0 right-0 z-10 flex items-center gap-0.5 px-1 py-0.5 rounded-bl bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[8px] font-black uppercase tracking-wider shadow border-l border-b border-amber-200/50">
                              <Trophy className="w-2.5 h-2.5" />
                              <span>x2</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <ProgressiveImage
                              src={athlete.image}
                              alt={athlete.name}
                              wrapperClassName="size-10 rounded-lg"
                              className="h-full w-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{athlete.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-[10px] uppercase text-slate-500 font-semibold">
                                  {athlete.eventName} · {athlete.gender}
                                </p>
                                <span className="inline-flex items-center px-1 rounded-sm text-[8px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                  {findAthleteCost(athlete.id)} pts
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleMarkDelivered}
                        disabled={betDetail.delivered}
                        className="rounded-xl bg-emerald-600 text-white py-3 font-bold disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        {betDetail.delivered ? "Ticket ya entregado" : "Marcar como entregado"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBet(betDetail.reference)}
                        disabled={deleteLoadingRef === betDetail.reference}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteLoadingRef === betDetail.reference ? "Borrando..." : "Borrar apuesta"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500 mb-3">
                  Tickets pendientes recientes
                </h2>
                <div className="space-y-2">
                  {pendingTickets.length === 0 && (
                    <p className="text-sm text-slate-500">No hay tickets pendientes.</p>
                  )}
                  {visiblePendingTickets.map((ticket) => (
                    <div
                      key={ticket.reference}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-mono text-sm font-bold text-slate-900">{ticket.reference}</p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(ticket.createdAt).toLocaleString()} · {ticket.selectedSlotsCount} huecos
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchRef(ticket.reference);
                          }}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBet(ticket.reference)}
                          disabled={deleteLoadingRef === ticket.reference}
                          className="inline-flex size-7 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Borrar apuesta"
                          aria-label={`Borrar apuesta ${ticket.reference}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {hasMorePendingThanPreview && (
                    <button
                      type="button"
                      onClick={() => setShowAllPending((value) => !value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {showAllPending
                        ? "Ver menos"
                        : `Ver todos (${pendingTickets.length})`}
                    </button>
                  )}
                </div>
              </div>

              <div className="xl:col-span-2 rounded-3xl border border-red-200 bg-red-50/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-black uppercase tracking-[0.14em] text-red-700">
                      Reset competición
                    </h2>
                    <p className="text-xs text-red-700/90 mt-1">
                      Limpia datos de test: apuestas, resultados y clasificación calculada.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadResetPreview()}
                    disabled={loadingResetPreview || resettingCompetitionData}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    {loadingResetPreview ? "Cargando..." : "Actualizar impacto"}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
                  <ResetMetricCard label="Apuestas" value={resetPreview?.participations ?? 0} />
                  <ResetMetricCard label="Picks" value={resetPreview?.picks ?? 0} />
                  <ResetMetricCard label="Locks" value={resetPreview?.locks ?? 0} />
                  <ResetMetricCard label="Resultados" value={resetPreview?.results ?? 0} />
                  <ResetMetricCard label="Puntuaciones" value={resetPreview?.scores ?? 0} />
                </div>

                <div className="mt-4 rounded-2xl border border-red-200 bg-white p-3.5">
                  <label className="flex items-start gap-2.5 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={resetConfirmationChecked}
                      onChange={(event) => setResetConfirmationChecked(event.target.checked)}
                      className="mt-0.5 size-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                      disabled={resettingCompetitionData}
                    />
                    <span className="leading-snug">
                      Confirmo que quiero borrar datos de test antes del día de competición.
                    </span>
                  </label>

                  <label className="block mt-3">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Escribe RESET para continuar
                    </span>
                    <input
                      value={resetConfirmationText}
                      onChange={(event) => setResetConfirmationText(event.target.value.toUpperCase())}
                      placeholder="RESET"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-red-300"
                      disabled={resettingCompetitionData}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void handleResetCompetitionData()}
                    disabled={
                      resettingCompetitionData ||
                      !resetConfirmationChecked ||
                      resetConfirmationText.trim().toUpperCase() !== "RESET"
                    }
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resettingCompetitionData ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Ejecutando reset...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4" />
                        Ejecutar reset
                      </>
                    )}
                  </button>
                </div>

                {resetError && (
                  <p className="mt-3 text-sm font-medium text-red-700">{resetError}</p>
                )}

                {resetSuccess && (
                  <p className="mt-3 text-sm font-medium text-emerald-700">{resetSuccess}</p>
                )}
              </div>
            </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function ResetMetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-red-200 bg-white px-2.5 py-2">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-red-500">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.12em] font-black text-slate-500">
          {label}
        </p>
        <span className="text-slate-400">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function EventFavoritesCharts({
  items,
}: {
  items: AdminDashboard["eventFavorites"];
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        Aún no hay apuestas suficientes para mostrar el gráfico.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
      {items.map((eventBlock) => (
        <div key={eventBlock.eventSlug} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-700">
              {eventBlock.eventName}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold">
              {eventBlock.totalVotos} votos
            </p>
          </div>

          {eventBlock.athletes.length === 0 ? (
            <p className="text-xs text-slate-500">Sin datos todavía.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-2.5">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={buildRadarData(eventBlock.athletes)}
                    margin={{ top: 10, right: 8, bottom: 10, left: 8 }}
                  >
                    <PolarGrid stroke="#cbd5e1" strokeOpacity={0.8} />
                    <PolarAngleAxis
                      dataKey="shortName"
                      tickFormatter={(value) => (value === "·" ? "" : value)}
                      tick={{ fill: "#334155", fontSize: 10, fontWeight: 700 }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tickCount={5}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <RechartsTooltip
                      formatter={(value, _name, item) => {
                        const payload = item?.payload as
                          | { votes?: number; name?: string; synthetic?: boolean }
                          | undefined;
                        if (payload?.synthetic) {
                          return ["0.0% · 0 votos", "Sin selección"];
                        }
                        return [
                          `${Number(value ?? 0).toFixed(1)}% · ${payload?.votes ?? 0} votos`,
                          payload?.name ?? "Atleta",
                        ];
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        borderColor: "#e2e8f0",
                        boxShadow: "0 8px 32px rgba(15, 23, 42, 0.12)",
                      }}
                    />
                    <Radar
                      name="Porcentaje de apuesta"
                      dataKey="percentage"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.26}
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: "#1d4ed8" }}
                      animationDuration={700}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-1.5">
                {eventBlock.athletes.slice(0, 3).map((athlete, index) => (
                  <div
                    key={`${eventBlock.eventSlug}-${athlete.athleteId}`}
                    className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1.5"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="w-4 text-[11px] font-black text-slate-500">{index + 1}</span>
                      <ProgressiveImage
                        src={athlete.image}
                        alt={athlete.name}
                        wrapperClassName="size-6 rounded-md"
                        className="h-full w-full object-cover"
                      />
                      <p className="truncate text-[11px] font-bold text-slate-800">{athlete.name}</p>
                    </div>
                    <p className="text-[11px] font-black text-slate-700">{athlete.porcentaje.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function compactName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

type RadarDatum = {
  athleteId: string;
  name: string;
  shortName: string;
  percentage: number;
  votes: number;
  gender: "M" | "F";
  synthetic?: boolean;
};

function buildRadarData(
  athletes: AdminDashboard["eventFavorites"][number]["athletes"]
): RadarDatum[] {
  const ranked = athletes.slice(0, 5).map((athlete) => ({
    athleteId: athlete.athleteId,
    name: athlete.name,
    shortName: compactName(athlete.name),
    percentage: Number(athlete.porcentaje.toFixed(1)),
    votes: athlete.votos,
    gender: athlete.gender,
  }));

  const axisCount = 5;
  const slots: RadarDatum[] = Array.from({ length: axisCount }, (_, index) => ({
    athleteId: `synthetic-${index}`,
    name: "Sin selección",
    shortName: "·",
    percentage: 0,
    votes: 0,
    gender: "M",
    synthetic: true,
  }));

  ranked.forEach((athlete, index) => {
    const position = Math.floor((index * axisCount) / ranked.length);
    slots[position] = athlete;
  });

  return slots;
}

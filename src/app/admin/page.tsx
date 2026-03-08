"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DotPattern } from "@/components/ui/dot-pattern";
import {
  adminLogin,
  adminLogout,
  getAdminDashboard,
  getAdminSessionState,
  getBetByReference,
  markBetAsDelivered,
  type AdminBetDetail,
  type AdminDashboard,
} from "@/app/admin/actions";
import {
  Search,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Trophy,
  BarChart3,
  Users,
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

type AuthStatus = "loading" | "unauthenticated" | "authenticated";

export default function AdminPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  const [searchRef, setSearchRef] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [betDetail, setBetDetail] = useState<AdminBetDetail | null>(null);

  useEffect(() => {
    void bootstrap();
  }, []);

  const recentPending = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.recentBets.filter((item) => !item.delivered).slice(0, 5);
  }, [dashboard]);

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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    const result = await adminLogin(username.trim(), password);
    if (!result.ok) {
      setLoginError(result.message ?? "No se pudo iniciar sesión.");
      return;
    }

    setUsername("");
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
                Usuario
              </span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
                placeholder="admin"
                autoComplete="username"
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
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900">Panel Admin</h1>
            <p className="text-xs md:text-sm text-slate-500 uppercase tracking-[0.14em]">
              Estadísticas y control de apuestas
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

                    <p className="text-xs text-slate-500 mb-2">
                      Huecos seleccionados: <b>{betDetail.selectedSlotsCount}</b>
                    </p>
                    <p className="text-xs text-slate-500 mb-3">
                      {new Date(betDetail.createdAt).toLocaleString()}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {betDetail.athletes.map((athlete) => (
                        <div key={`${betDetail.reference}-${athlete.id}`} className="rounded-xl border border-slate-200 bg-white p-2">
                          <div className="flex items-center gap-2">
                            <ProgressiveImage
                              src={athlete.image}
                              alt={athlete.name}
                              wrapperClassName="size-10 rounded-lg"
                              className="h-full w-full object-cover"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{athlete.name}</p>
                              <p className="text-[10px] uppercase text-slate-500 font-semibold">
                                {athlete.eventName} · {athlete.gender}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleMarkDelivered}
                      disabled={betDetail.delivered}
                      className="w-full rounded-xl bg-emerald-600 text-white py-3 font-bold disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      {betDetail.delivered ? "Ticket ya entregado" : "Marcar como entregado"}
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500 mb-3">
                  Tickets pendientes recientes
                </h2>
                <div className="space-y-2">
                  {recentPending.length === 0 && (
                    <p className="text-sm text-slate-500">No hay tickets pendientes.</p>
                  )}
                  {recentPending.map((ticket) => (
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
                      <button
                        type="button"
                        onClick={() => {
                          setSearchRef(ticket.reference);
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700"
                      >
                        Ver
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
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

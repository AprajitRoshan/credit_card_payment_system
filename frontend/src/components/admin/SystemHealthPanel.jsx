import { useCallback, useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import api from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import ChartTooltip from "../charts/ChartTooltip";
import { STATUS_COLORS, getChartTheme } from "../charts/chartTheme";

const REFRESH_INTERVAL_MS = 30000;

/* =========================================================
   HELPERS
========================================================= */

const STATUS_META = {
    healthy: { label: "Healthy", icon: "✓", color: STATUS_COLORS.good },
    up: { label: "Up", icon: "✓", color: STATUS_COLORS.good },
    degraded: { label: "Degraded", icon: "!", color: STATUS_COLORS.warning },
    down: { label: "Down", icon: "×", color: STATUS_COLORS.critical },
    unknown: { label: "Unknown", icon: "?", color: "#94a3b8" },
};

function formatUptime(seconds) {
    const total = Number(seconds || 0);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatMs(value) {
    if (value === null || value === undefined) return "—";
    return `${Number(value).toFixed(0)} ms`;
}

function formatHour(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* Status is always icon + label, never colour alone. */
function StatusPill({ status }) {
    const meta = STATUS_META[status] || STATUS_META.unknown;

    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
            style={{
                color: meta.color,
                borderColor: `${meta.color}55`,
                background: `${meta.color}14`,
            }}
        >
            <span aria-hidden="true">{meta.icon}</span>
            {meta.label}
        </span>
    );
}

function MetricTile({ label, value, hint }) {
    return (
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-900/60">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {value}
            </p>

            {hint && (
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {hint}
                </p>
            )}
        </div>
    );
}

/* =========================================================
   SYSTEM HEALTH PANEL
========================================================= */

export default function SystemHealthPanel() {
    const { darkMode } = useTheme();
    const theme = getChartTheme(darkMode);

    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadHealth = useCallback(async () => {
        try {
            setError("");

            const response = await api.get("/admin/system-health/");

            setHealth(response.data);
        } catch (err) {
            console.error("System health error:", err);
            setError("Unable to load system health.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHealth();

        const timer = setInterval(loadHealth, REFRESH_INTERVAL_MS);

        return () => clearInterval(timer);
    }, [loadHealth]);

    const hourly = (health?.hourly || []).map((row) => ({
        ...row,
        label: formatHour(row.hour),
    }));

    return (
        <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-[#111827]">
            {/* =============================================
                HEADER
            ============================================= */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            System Health
                        </h3>

                        {health && <StatusPill status={health.status} />}
                    </div>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        API response times and errors over the last{" "}
                        {health?.window_hours || 24} hours · refreshes every 30s
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadHealth}
                    className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {loading && !health && (
                <div className="mt-6 h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            )}

            {health && (
                <>
                    {/* =========================================
                        SERVICES
                    ========================================= */}

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {[
                            ["Django API", health.services.django, `Uptime ${formatUptime(health.uptime_seconds)}`],
                            ["Database", health.services.database, formatMs(health.services.database.latency_ms)],
                            ["Payment API (FastAPI)", health.services.fastapi, health.services.fastapi.latency_ms !== null ? formatMs(health.services.fastapi.latency_ms) : health.services.fastapi.detail || "Unreachable"],
                        ].map(([name, service, detail]) => (
                            <div
                                key={name}
                                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700/50 dark:bg-slate-900/60"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {name}
                                    </p>

                                    <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                        {detail}
                                    </p>
                                </div>

                                <StatusPill status={service.status} />
                            </div>
                        ))}
                    </div>

                    {/* =========================================
                        METRICS
                    ========================================= */}

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <MetricTile
                            label="Requests"
                            value={health.metrics.total_requests.toLocaleString("en-IN")}
                        />
                        <MetricTile
                            label="Avg Response"
                            value={formatMs(health.metrics.avg_response_ms)}
                        />
                        <MetricTile
                            label="P95 Response"
                            value={formatMs(health.metrics.p95_response_ms)}
                            hint={`Max ${formatMs(health.metrics.max_response_ms)}`}
                        />
                        <MetricTile
                            label="Error Rate"
                            value={`${health.metrics.error_rate.toFixed(2)}%`}
                            hint={`${health.metrics.server_errors} server · ${health.metrics.client_errors} client`}
                        />
                        <MetricTile
                            label="Open Fraud Cases"
                            value={health.fraud.open_cases}
                            hint={`${health.fraud.flagged_in_window} flagged in window`}
                        />
                    </div>

                    {/* =========================================
                        HOURLY TRAFFIC CHART
                    ========================================= */}

                    <div className="mt-6">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Requests per hour
                        </p>

                        {hourly.length === 0 ? (
                            <p className="mt-3 text-sm text-slate-400">
                                No API traffic recorded yet.
                            </p>
                        ) : (
                            <div className="mt-3 h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={hourly}
                                        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
                                        barGap={2}
                                        barCategoryGap="20%"
                                    >
                                        <CartesianGrid stroke={theme.grid} vertical={false} />

                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: theme.axis, fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fill: theme.axis, fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={40}
                                        />

                                        <Tooltip
                                            cursor={{ fill: theme.cursor }}
                                            content={<ChartTooltip />}
                                        />

                                        <Legend
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: 12, color: theme.axis }}
                                        />

                                        <Bar
                                            dataKey="requests"
                                            name="Requests"
                                            fill={theme.primary}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={28}
                                        />

                                        <Bar
                                            dataKey="errors"
                                            name="Server errors"
                                            fill={STATUS_COLORS.critical}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={28}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>

                    {/* =========================================
                        SLOWEST ENDPOINTS + RECENT ERRORS
                    ========================================= */}

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Slowest endpoints
                            </p>

                            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700/50">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <tr>
                                            <th className="px-3 py-2">Endpoint</th>
                                            <th className="px-3 py-2 text-right">Calls</th>
                                            <th className="px-3 py-2 text-right">Avg</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {health.slowest_endpoints.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-3 py-4 text-center text-slate-400">
                                                    No data yet
                                                </td>
                                            </tr>
                                        )}

                                        {health.slowest_endpoints.map((row) => (
                                            <tr
                                                key={`${row.service}-${row.method}-${row.path}`}
                                                className="border-t border-slate-100 dark:border-slate-700/50"
                                            >
                                                <td className="px-3 py-2">
                                                    <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                        {row.method}
                                                    </span>
                                                    <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                                                        {row.path}
                                                    </span>
                                                    <span className="ml-2 text-[10px] uppercase text-slate-400">
                                                        {row.service}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                                                    {row.requests}
                                                </td>
                                                <td className="px-3 py-2 text-right font-semibold text-slate-900 dark:text-white">
                                                    {formatMs(row.avg_response_ms)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Recent errors
                            </p>

                            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                                {health.recent_errors.length === 0 ? (
                                    <p className="rounded-xl border border-slate-100 p-4 text-sm text-slate-400 dark:border-slate-700/50">
                                        No server errors recorded. ✓
                                    </p>
                                ) : (
                                    health.recent_errors.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rounded-xl border border-red-500/15 bg-red-500/5 p-3"
                                        >
                                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                                <span className="font-bold text-red-600 dark:text-red-400">
                                                    {item.status_code}
                                                </span>
                                                <span className="font-mono text-slate-700 dark:text-slate-200">
                                                    {item.method} {item.path}
                                                </span>
                                                <span className="ml-auto text-slate-400">
                                                    {new Date(item.created_at).toLocaleString("en-IN")}
                                                </span>
                                            </div>

                                            {item.error_message && (
                                                <p className="mt-1.5 break-words font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                                    {item.error_message}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}

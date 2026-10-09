import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import api from "../services/api";
import { downloadFile } from "../services/download";
import { useTheme } from "../context/ThemeContext";
import ChartTooltip from "../components/charts/ChartTooltip";
import {
    STATUS_COLORS,
    formatCompactCurrency,
    formatCurrency,
    getChartTheme,
    titleCase,
} from "../components/charts/chartTheme";

/* =========================================================
   CONSTANTS
========================================================= */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// Captured once at load so render stays pure.
const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

const STATUS_SLICES = [
    { key: "successful", label: "Successful", color: STATUS_COLORS.good },
    { key: "failed", label: "Failed", color: STATUS_COLORS.critical },
    { key: "pending", label: "Pending", color: STATUS_COLORS.warning },
];

/* =========================================================
   ICONS
========================================================= */

function DownloadIcon({ size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M5 21h14" />
        </svg>
    );
}

/* =========================================================
   LAYOUT HELPERS
========================================================= */

function Panel({ title, subtitle, children, className = "" }) {
    return (
        <section
            className={`
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-sm
                dark:border-slate-700/60
                dark:bg-[#111827]
                ${className}
            `}
        >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {title}
            </h3>

            {subtitle && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {subtitle}
                </p>
            )}

            <div className="mt-5">{children}</div>
        </section>
    );
}

function StatTile({ label, value, hint }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-[#111827]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
            </p>

            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {value}
            </p>

            {hint && (
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                    {hint}
                </p>
            )}
        </div>
    );
}

function EmptyChart({ message }) {
    return (
        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
            {message}
        </div>
    );
}

/* =========================================================
   ANALYTICS PAGE
========================================================= */

export default function Analytics() {
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const theme = getChartTheme(darkMode);

    const [month, setMonth] = useState(TODAY.getMonth() + 1);
    const [year, setYear] = useState(CURRENT_YEAR);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exporting, setExporting] = useState("");

    /* =====================================================
       LOAD
    ===================================================== */

    const loadAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/transactions/analytics/",
                { params: { month, year } }
            );

            setData(response.data);
        } catch (err) {
            console.error("Analytics error:", err);

            if (err.response?.status === 401) {
                navigate("/login", { replace: true });
                return;
            }

            setError(
                err.response?.data?.detail ||
                "Unable to load analytics. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [month, year, navigate]);

    useEffect(() => {
        if (!localStorage.getItem("access_token")) {
            navigate("/login", { replace: true });
            return;
        }

        loadAnalytics();
    }, [loadAnalytics, navigate]);

    /* =====================================================
       EXPORT
    ===================================================== */

    const handleExport = async (format) => {
        try {
            setExporting(format);
            setError("");

            await downloadFile(
                `/transactions/analytics/export/${format}/`,
                `analytics_summary_${year}_${String(month).padStart(2, "0")}.${format}`,
                { month, year }
            );
        } catch (err) {
            console.error("Export error:", err);
            setError(`Unable to export the ${format.toUpperCase()} file.`);
        } finally {
            setExporting("");
        }
    };

    /* =====================================================
       CHART DATA
    ===================================================== */

    const trend = data?.monthly_trend || [];

    const categories = useMemo(
        () =>
            (data?.category_expenses || []).map((item) => ({
                name: titleCase(item.category),
                amount: item.amount,
                count: item.count,
            })),
        [data]
    );

    const statusSlices = useMemo(
        () =>
            STATUS_SLICES.map((slice) => ({
                name: slice.label,
                value: data?.transaction_counts?.[slice.key] || 0,
                color: slice.color,
            })).filter((slice) => slice.value > 0),
        [data]
    );

    const totalTransactions = statusSlices.reduce(
        (sum, slice) => sum + slice.value,
        0
    );

    const utilization = data?.credit_utilization;

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#080f1d]">
            {/* =============================================
                HEADER
            ============================================= */}

            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-[#0f172a]/95">
                <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 pr-20 sm:px-8 sm:pr-20">
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                            CreditPay
                        </h1>

                        <p className="text-xs text-slate-400">
                            Card Usage Analytics
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                    >
                        Dashboard
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
                {/* =========================================
                    TITLE + FILTERS
                ========================================= */}

                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                            Insights
                        </p>

                        <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                            Spending Analytics
                        </h2>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                            Monthly spending, category breakdown and
                            credit utilization across your cards.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            aria-label="Month"
                            value={month}
                            onChange={(e) => setMonth(Number(e.target.value))}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-blue-500/20"
                        >
                            {MONTHS.map((name, index) => (
                                <option key={name} value={index + 1}>
                                    {name}
                                </option>
                            ))}
                        </select>

                        <select
                            aria-label="Year"
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-blue-500/20"
                        >
                            {YEAR_OPTIONS.map((value) => (
                                <option key={value} value={value}>
                                    {value}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => handleExport("csv")}
                            disabled={!!exporting || loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <DownloadIcon />
                            {exporting === "csv" ? "Exporting…" : "CSV"}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleExport("pdf")}
                            disabled={!!exporting || loading}
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
                        >
                            <DownloadIcon />
                            {exporting === "pdf" ? "Exporting…" : "PDF"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {loading && !data ? (
                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-28 animate-pulse rounded-2xl bg-white dark:bg-[#111827]"
                            />
                        ))}
                    </div>
                ) : data && (
                    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
                        {/* =====================================
                            STAT TILES
                        ===================================== */}

                        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            <StatTile
                                label="Monthly Spending"
                                value={formatCurrency(data.monthly_spending)}
                                hint={data.period_label}
                            />

                            <StatTile
                                label="Transactions"
                                value={totalTransactions}
                                hint={`${data.transaction_counts.successful} successful`}
                            />

                            <StatTile
                                label="Credit Utilization"
                                value={`${utilization.percentage.toFixed(1)}%`}
                                hint={`${formatCurrency(utilization.total_used)} of ${formatCurrency(utilization.total_limit)}`}
                            />

                            <StatTile
                                label="Flagged Payments"
                                value={data.transaction_counts.flagged}
                                hint="By fraud detection this month"
                            />
                        </div>

                        {/* =====================================
                            LINE — MONTHLY TREND
                        ===================================== */}

                        <Panel
                            className="mt-6"
                            title="Monthly Spending Trend"
                            subtitle="Successful spending over the last 6 months"
                        >
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={trend}
                                        margin={{ top: 10, right: 16, left: 4, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            stroke={theme.grid}
                                            vertical={false}
                                        />

                                        <XAxis
                                            dataKey="label"
                                            tick={{ fill: theme.axis, fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />

                                        <YAxis
                                            tickFormatter={formatCompactCurrency}
                                            tick={{ fill: theme.axis, fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={64}
                                        />

                                        <Tooltip
                                            cursor={{ stroke: theme.axis, strokeDasharray: "3 3" }}
                                            content={<ChartTooltip valueFormatter={formatCurrency} />}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="spending"
                                            name="Spending"
                                            stroke={theme.primary}
                                            strokeWidth={2}
                                            dot={{ r: 4, fill: theme.primary, stroke: theme.surface, strokeWidth: 2 }}
                                            activeDot={{ r: 6, stroke: theme.surface, strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Panel>

                        <div className="mt-6 grid gap-6 lg:grid-cols-5">
                            {/* =================================
                                BAR — CATEGORIES
                            ================================= */}

                            <Panel
                                className="lg:col-span-3"
                                title="Category-wise Expenses"
                                subtitle={`Successful spending in ${data.period_label}`}
                            >
                                {categories.length === 0 ? (
                                    <EmptyChart message="No successful spending this month" />
                                ) : (
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={categories}
                                                margin={{ top: 20, right: 8, left: 4, bottom: 0 }}
                                                barCategoryGap="28%"
                                            >
                                                <CartesianGrid
                                                    stroke={theme.grid}
                                                    vertical={false}
                                                />

                                                <XAxis
                                                    dataKey="name"
                                                    tick={{ fill: theme.axis, fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />

                                                <YAxis
                                                    tickFormatter={formatCompactCurrency}
                                                    tick={{ fill: theme.axis, fontSize: 12 }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    width={64}
                                                />

                                                <Tooltip
                                                    cursor={{ fill: theme.cursor }}
                                                    content={<ChartTooltip valueFormatter={formatCurrency} />}
                                                />

                                                <Bar
                                                    dataKey="amount"
                                                    name="Spent"
                                                    fill={theme.primary}
                                                    radius={[4, 4, 0, 0]}
                                                    maxBarSize={56}
                                                    label={{
                                                        position: "top",
                                                        fill: theme.axis,
                                                        fontSize: 11,
                                                        formatter: formatCompactCurrency,
                                                    }}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </Panel>

                            {/* =================================
                                PIE — STATUS BREAKDOWN
                            ================================= */}

                            <Panel
                                className="lg:col-span-2"
                                title="Transaction Status"
                                subtitle={`${totalTransactions} transactions in ${data.period_label}`}
                            >
                                {statusSlices.length === 0 ? (
                                    <EmptyChart message="No transactions this month" />
                                ) : (
                                    <>
                                        <div className="h-52">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={statusSlices}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        innerRadius="58%"
                                                        outerRadius="88%"
                                                        paddingAngle={2}
                                                        stroke={theme.surface}
                                                        strokeWidth={2}
                                                    >
                                                        {statusSlices.map((slice) => (
                                                            <Cell key={slice.name} fill={slice.color} />
                                                        ))}
                                                    </Pie>

                                                    <Tooltip content={<ChartTooltip />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Legend doubles as the value table */}
                                        <ul className="mt-4 space-y-2">
                                            {statusSlices.map((slice) => (
                                                <li
                                                    key={slice.name}
                                                    className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                                                >
                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{ background: slice.color }}
                                                    />

                                                    {slice.name}

                                                    <span className="ml-auto font-semibold text-slate-900 dark:text-white">
                                                        {slice.value}
                                                    </span>

                                                    <span className="w-12 text-right text-xs text-slate-400">
                                                        {((slice.value / totalTransactions) * 100).toFixed(0)}%
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </Panel>
                        </div>

                        {/* =====================================
                            CREDIT UTILIZATION BY CARD
                        ===================================== */}

                        <Panel
                            className="mt-6"
                            title="Credit Utilization by Card"
                            subtitle="Used credit as a share of each card's limit"
                        >
                            {data.cards.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    No cards added yet.
                                </p>
                            ) : (
                                <div className="space-y-5">
                                    {data.cards.map((card) => {
                                        const pct = Math.min(card.utilization_percentage, 100);
                                        const barColor =
                                            pct >= 90
                                                ? STATUS_COLORS.critical
                                                : pct >= 70
                                                    ? STATUS_COLORS.warning
                                                    : theme.primary;

                                        return (
                                            <div key={card.card_id}>
                                                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                                                        {card.masked_card_number}
                                                    </span>

                                                    <span className="text-slate-500 dark:text-slate-400">
                                                        {formatCurrency(card.used_credit)} of{" "}
                                                        {formatCurrency(card.credit_limit)}
                                                        <span className="ml-2 font-bold text-slate-900 dark:text-white">
                                                            {card.utilization_percentage.toFixed(1)}%
                                                        </span>
                                                    </span>
                                                </div>

                                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${pct}%`, background: barColor }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Panel>
                    </div>
                )}
            </main>
        </div>
    );
}

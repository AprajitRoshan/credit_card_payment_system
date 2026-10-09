import { useCallback, useEffect, useState } from "react";

import api from "../../services/api";
import { formatCurrency, titleCase } from "../charts/chartTheme";

/* =========================================================
   CONSTANTS
========================================================= */

const FILTERS = [
    { value: "OPEN", label: "Open" },
    { value: "CONFIRMED_FRAUD", label: "Confirmed" },
    { value: "FALSE_POSITIVE", label: "False positive" },
    { value: "", label: "All" },
];

const REVIEW_STYLES = {
    OPEN: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400",
    CONFIRMED_FRAUD: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400",
    FALSE_POSITIVE: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400",
};

/* =========================================================
   FRAUD LOG PANEL
========================================================= */

export default function FraudLogPanel({ canReview }) {
    const [logs, setLogs] = useState([]);
    const [count, setCount] = useState(0);
    const [openCount, setOpenCount] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState("OPEN");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [savingId, setSavingId] = useState(null);

    const pageSize = 5;
    const totalPages = Math.max(Math.ceil(count / pageSize), 1);

    const loadLogs = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const params = { page, limit: pageSize };

            if (filter) params.review_status = filter;

            const response = await api.get("/fraud/logs/", { params });

            setLogs(response.data.results);
            setCount(response.data.count);
            setOpenCount(response.data.open_count);
        } catch (err) {
            console.error("Fraud log error:", err);
            setError("Unable to load fraud logs.");
        } finally {
            setLoading(false);
        }
    }, [page, filter]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const review = async (log, reviewStatus) => {
        try {
            setSavingId(log.id);
            setError("");

            await api.patch(`/fraud/logs/${log.id}/review/`, {
                review_status: reviewStatus,
            });

            await loadLogs();
        } catch (err) {
            console.error("Fraud review error:", err);
            setError(
                err.response?.status === 403
                    ? "Your role cannot review fraud cases."
                    : "Unable to update the fraud case."
            );
        } finally {
            setSavingId(null);
        }
    };

    return (
        <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/60 dark:bg-[#111827]">
            {/* =============================================
                HEADER
            ============================================= */}

            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700/60">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                            Fraud Detection Log
                        </h3>

                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400">
                            ! {openCount} open
                        </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Payments flagged by the rule engine. Customers
                        are emailed automatically.
                    </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {FILTERS.map((item) => (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => {
                                setFilter(item.value);
                                setPage(1);
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === item.value
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mx-6 mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* =============================================
                TABLE
            ============================================= */}

            <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                    <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-4 py-3">Payment</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3">Rules triggered</th>
                            <th className="px-4 py-3">Alert</th>
                            <th className="px-4 py-3">Status</th>
                            {canReview && <th className="px-6 py-3 text-right">Review</th>}
                        </tr>
                    </thead>

                    <tbody>
                        {loading && logs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8">
                                    <div className="h-6 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                                </td>
                            </tr>
                        )}

                        {!loading && logs.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                                    No fraud cases in this view.
                                </td>
                            </tr>
                        )}

                        {logs.map((log) => (
                            <tr
                                key={log.id}
                                className="border-t border-slate-100 align-top dark:border-slate-700/50"
                            >
                                <td className="px-6 py-4">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {log.username}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(log.created_at).toLocaleString("en-IN")}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                                    <p>#{log.payment_id}</p>
                                    <p className="text-xs text-slate-400">
                                        {log.masked_card_number || `Card ${log.card_id}`}
                                    </p>
                                </td>

                                <td className="px-4 py-4 text-right font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(log.amount)}
                                </td>

                                <td className="px-4 py-4">
                                    <div className="flex max-w-xs flex-wrap gap-1">
                                        {log.rules.map((rule) => (
                                            <span
                                                key={rule}
                                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                {titleCase(rule)}
                                            </span>
                                        ))}
                                    </div>

                                    {(log.device_id || log.location_id) && (
                                        <p className="mt-1.5 text-[11px] text-slate-400">
                                            {log.location_id}
                                            {log.device_id && ` · device ${log.device_id.slice(0, 8)}`}
                                        </p>
                                    )}
                                </td>

                                <td className="px-4 py-4 text-xs font-semibold">
                                    {log.alert_sent ? (
                                        <span className="text-emerald-600 dark:text-emerald-400">✓ Emailed</span>
                                    ) : (
                                        <span className="text-slate-400">— Not sent</span>
                                    )}
                                </td>

                                <td className="px-4 py-4">
                                    <span
                                        className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${REVIEW_STYLES[log.review_status]}`}
                                    >
                                        {titleCase(log.review_status)}
                                    </span>

                                    {log.reviewed_by_username && (
                                        <p className="mt-1 text-[11px] text-slate-400">
                                            by {log.reviewed_by_username}
                                        </p>
                                    )}
                                </td>

                                {canReview && (
                                    <td className="px-6 py-4 text-right">
                                        {log.review_status === "OPEN" ? (
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={savingId === log.id}
                                                    onClick={() => review(log, "CONFIRMED_FRAUD")}
                                                    className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                                                >
                                                    Confirm
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={savingId === log.id}
                                                    onClick={() => review(log, "FALSE_POSITIVE")}
                                                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={savingId === log.id}
                                                onClick={() => review(log, "OPEN")}
                                                className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-60 dark:text-blue-400"
                                            >
                                                Reopen
                                            </button>
                                        )}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* =============================================
                PAGINATION
            ============================================= */}

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-sm text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                <span>
                    {count} case{count !== 1 ? "s" : ""}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => current - 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40 dark:border-slate-700"
                    >
                        Prev
                    </button>

                    <span>
                        {page} / {totalPages}
                    </span>

                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((current) => current + 1)}
                        className="rounded-lg border border-slate-200 px-3 py-1 font-semibold disabled:opacity-40 dark:border-slate-700"
                    >
                        Next
                    </button>
                </div>
            </div>
        </section>
    );
}

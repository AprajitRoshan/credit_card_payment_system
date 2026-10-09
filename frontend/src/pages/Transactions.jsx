import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

/* =========================================================
   CONSTANTS
========================================================= */

const PAGE_SIZE = 10;

const EMPTY_FILTERS = {
    status: "",
    fraudStatus: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
    cardNumber: "",
};

const SORT_OPTIONS = [
    { value: "-created_at", label: "Newest first" },
    { value: "created_at", label: "Oldest first" },
    { value: "-amount", label: "Amount: high to low" },
    { value: "amount", label: "Amount: low to high" },
    { value: "status", label: "Status" },
];

const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-500/20";

const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

/* =========================================================
   HELPERS
========================================================= */

function buildParams(filters, page, ordering) {
    const params = {
        page,
        limit: PAGE_SIZE,
        ordering,
    };

    if (filters.status) params.status = filters.status;
    if (filters.fraudStatus) params.fraud_status = filters.fraudStatus;
    if (filters.minAmount) params.min_amount = filters.minAmount;
    if (filters.maxAmount) params.max_amount = filters.maxAmount;
    if (filters.startDate) params.start_date = filters.startDate;
    if (filters.endDate) params.end_date = filters.endDate;
    if (filters.cardNumber) params.card_number = filters.cardNumber;

    return params;
}

function apiErrorMessage(err) {
    const data = err.response?.data;

    if (data && typeof data === "object") {
        const first = Object.values(data)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }

    return "Unable to load transactions.";
}

/* =========================================================
   TRANSACTIONS
========================================================= */

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [count, setCount] = useState(0);

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
    const [page, setPage] = useState(1);
    const [ordering, setOrdering] = useState("-created_at");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const totalPages = Math.max(Math.ceil(count / PAGE_SIZE), 1);

    /* =====================================================
       LOAD (server-side filtering, sorting, pagination)
    ===================================================== */

    const loadTransactions = useCallback(async () => {
        try {
            setError("");
            setLoading(true);

            const response = await api.get("/transactions/", {
                params: buildParams(appliedFilters, page, ordering),
            });

            setTransactions(response.data.results || []);
            setCount(response.data.count || 0);
        } catch (err) {
            console.error("Error loading transactions:", err);
            setError(apiErrorMessage(err));
            setTransactions([]);
            setCount(0);
        } finally {
            setLoading(false);
        }
    }, [appliedFilters, page, ordering]);

    useEffect(() => {
        loadTransactions();
    }, [loadTransactions]);

    const updateFilter = (name) => (event) => {
        setFilters((current) => ({
            ...current,
            [name]: event.target.value,
        }));
    };

    const handleFilter = (event) => {
        event.preventDefault();

        if (
            filters.minAmount &&
            filters.maxAmount &&
            Number(filters.minAmount) > Number(filters.maxAmount)
        ) {
            setError("Min amount cannot be greater than max amount.");
            return;
        }

        if (
            filters.startDate &&
            filters.endDate &&
            filters.startDate > filters.endDate
        ) {
            setError("Start date cannot be after end date.");
            return;
        }

        setPage(1);
        setAppliedFilters(filters);
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setAppliedFilters(EMPTY_FILTERS);
        setPage(1);
    };

    const getStatusStyle = (transactionStatus) => {
        if (transactionStatus === "SUCCESS") {
            return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25";
        }

        if (transactionStatus === "FAILED") {
            return "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/25";
        }

        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25";
    };

    const getStatusIcon = (transactionStatus) => {
        if (transactionStatus === "SUCCESS") return "✓";
        if (transactionStatus === "FAILED") return "×";
        return "…";
    };

    const formatAmount = (amount) =>
        Number(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const firstItem = count === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const lastItem = Math.min(page * PAGE_SIZE, count);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#080f1d]">
            {/* Navbar */}
            <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#0f172a]/95">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <Link
                        to="/dashboard"
                        className="text-lg font-bold tracking-tight text-slate-900 transition hover:text-blue-600 dark:text-white"
                    >
                        Credit Card Payment System
                    </Link>

                    <div className="mr-14 flex items-center gap-1">
                        <Link
                            to="/analytics"
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                        >
                            Analytics
                        </Link>

                        <Link
                            to="/dashboard"
                            className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
                {/* Header */}
                <div className="mb-8">
                    <p className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400">
                        PAYMENT ACTIVITY
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        Transaction History
                    </h2>

                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Search, filter and sort all your payment transactions.
                    </p>
                </div>

                {/* Filters */}
                <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-6 dark:border-slate-700/60 dark:bg-[#111827] dark:shadow-none">
                    <div className="mb-5">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Advanced Search
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Combine filters to narrow down your history.
                        </p>
                    </div>

                    <form
                        onSubmit={handleFilter}
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                    >
                        <div>
                            <label className={labelClass} htmlFor="status">
                                Status
                            </label>

                            <select
                                id="status"
                                value={filters.status}
                                onChange={updateFilter("status")}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="PENDING">Pending</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="card">
                                Card (last digits)
                            </label>

                            <input
                                id="card"
                                type="text"
                                inputMode="numeric"
                                maxLength={19}
                                value={filters.cardNumber}
                                onChange={updateFilter("cardNumber")}
                                placeholder="e.g. 1111"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="minAmount">
                                Min Amount
                            </label>

                            <input
                                id="minAmount"
                                type="number"
                                min="0"
                                value={filters.minAmount}
                                onChange={updateFilter("minAmount")}
                                placeholder="Minimum"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="maxAmount">
                                Max Amount
                            </label>

                            <input
                                id="maxAmount"
                                type="number"
                                min="0"
                                value={filters.maxAmount}
                                onChange={updateFilter("maxAmount")}
                                placeholder="Maximum"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="startDate">
                                From
                            </label>

                            <input
                                id="startDate"
                                type="date"
                                value={filters.startDate}
                                onChange={updateFilter("startDate")}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="endDate">
                                To
                            </label>

                            <input
                                id="endDate"
                                type="date"
                                value={filters.endDate}
                                onChange={updateFilter("endDate")}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass} htmlFor="fraud">
                                Fraud Check
                            </label>

                            <select
                                id="fraud"
                                value={filters.fraudStatus}
                                onChange={updateFilter("fraudStatus")}
                                className={inputClass}
                            >
                                <option value="">All</option>
                                <option value="CLEAR">Clear</option>
                                <option value="FLAGGED">Flagged</option>
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </section>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Summary + sort */}
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {count > 0 ? (
                            <>
                                Showing{" "}
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {firstItem}–{lastItem}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {count}
                                </span>{" "}
                                transaction{count !== 1 ? "s" : ""}
                            </>
                        ) : (
                            !loading && "No matching transactions"
                        )}
                    </p>

                    <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        Sort by
                        <select
                            value={ordering}
                            onChange={(e) => {
                                setOrdering(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Transactions */}
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-slate-700/60 dark:bg-[#111827] dark:shadow-none">
                    {loading ? (
                        <div className="space-y-4 p-6">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div
                                    key={item}
                                    className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                                />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                >
                                    <rect x="3" y="4" width="18" height="16" rx="2" />
                                    <path d="M7 9h10" />
                                    <path d="M7 13h6" />
                                </svg>
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-slate-800 dark:text-slate-100">
                                No transactions found
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Try changing your filters or make a payment.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full">
                                    <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700/60 dark:bg-slate-900/60">
                                        <tr>
                                            {[
                                                "Transaction",
                                                "Payment ID",
                                                "Amount",
                                                "Category",
                                                "Status",
                                                "Date",
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {transactions.map((transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className="group border-b border-slate-100 transition last:border-0 hover:bg-blue-50/40 dark:border-slate-700/50 dark:hover:bg-slate-800/40"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-10 w-10 items-center justify-center rounded-xl border ${getStatusStyle(transaction.status)}`}
                                                        >
                                                            {getStatusIcon(transaction.status)}
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                                Transaction #{transaction.id}
                                                            </p>

                                                            {transaction.fraud_status === "FLAGGED" ? (
                                                                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                                                    ! Flagged for review
                                                                </p>
                                                            ) : (
                                                                <p className="text-xs text-slate-400">
                                                                    Payment activity
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 font-medium text-slate-600 dark:text-slate-300">
                                                    #{transaction.payment_id}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        ₹{formatAmount(transaction.amount)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-sm font-medium capitalize text-slate-500 dark:text-slate-400">
                                                    {String(transaction.category || "other").toLowerCase()}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(transaction.status)}`}
                                                    >
                                                        <span>{getStatusIcon(transaction.status)}</span>
                                                        {transaction.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(transaction.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="divide-y divide-slate-100 md:hidden dark:divide-slate-700/60">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    Transaction #{transaction.id}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Payment #{transaction.payment_id}
                                                </p>

                                                {transaction.fraud_status === "FLAGGED" && (
                                                    <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                                                        ! Flagged for review
                                                    </p>
                                                )}
                                            </div>

                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusStyle(transaction.status)}`}
                                            >
                                                {transaction.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Amount
                                                </p>

                                                <p className="mt-1 font-bold text-slate-900 dark:text-white">
                                                    ₹{formatAmount(transaction.amount)}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Category
                                                </p>

                                                <p className="mt-1 font-semibold capitalize text-slate-700 dark:text-slate-200">
                                                    {String(transaction.category || "other").toLowerCase()}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-xs text-slate-400">
                                            {new Date(transaction.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    {count > PAGE_SIZE && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 text-sm dark:border-slate-700/60">
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((current) => current - 1)}
                                className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                ← Previous
                            </button>

                            <span className="text-slate-500 dark:text-slate-400">
                                Page{" "}
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {page}
                                </span>{" "}
                                of {totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((current) => current + 1)}
                                className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [status, setStatus] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadTransactions = async (params = {}) => {
        try {
            setError("");
            setLoading(true);

            const response = await api.get("/transactions/", {
                params,
            });

            setTransactions(response.data);
        } catch (err) {
            console.error("Error loading transactions:", err);
            setError("Unable to load transactions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
    }, []);

    const handleFilter = (event) => {
        event.preventDefault();

        const params = {};

        if (status) params.status = status;
        if (minAmount) params.min_amount = minAmount;
        if (maxAmount) params.max_amount = maxAmount;
        if (date) params.date = date;

        loadTransactions(params);
    };

    const clearFilters = () => {
        setStatus("");
        setMinAmount("");
        setMaxAmount("");
        setDate("");
        loadTransactions();
    };

    const getStatusStyle = (transactionStatus) => {
        if (transactionStatus === "SUCCESS") {
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
        }

        if (transactionStatus === "FAILED") {
            return "bg-red-100 text-red-700 border-red-200";
        }

        return "bg-amber-100 text-amber-700 border-amber-200";
    };

    const getStatusIcon = (transactionStatus) => {
        if (transactionStatus === "SUCCESS") return "✓";
        if (transactionStatus === "FAILED") return "×";
        return "…";
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Navbar */}
            <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <Link
                        to="/dashboard"
                        className="text-lg font-bold tracking-tight text-slate-900 transition hover:text-blue-600"
                    >
                        Credit Card Payment System
                    </Link>

                    <Link
                        to="/dashboard"
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                        Dashboard
                    </Link>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
                {/* Header */}
                <div className="mb-8">
                    <p className="text-sm font-bold tracking-widest text-blue-600">
                        PAYMENT ACTIVITY
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Transaction History
                    </h2>

                    <p className="mt-2 text-slate-500">
                        View and filter all your payment transactions.
                    </p>
                </div>

                {/* Filters */}
                <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-6">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Filter Transactions
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Narrow down your transaction history.
                            </p>
                        </div>

                        <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <path d="M4 6h16" />
                                <path d="M7 12h10" />
                                <path d="M10 18h4" />
                            </svg>
                        </div>
                    </div>

                    <form
                        onSubmit={handleFilter}
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
                    >
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Status
                            </label>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            >
                                <option value="">All</option>
                                <option value="PENDING">Pending</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Min Amount
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                placeholder="Minimum"
                                className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Max Amount
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                placeholder="Maximum"
                                className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Date
                            </label>

                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60"
                            >
                                Filter
                            </button>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </section>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {/* Summary */}
                {!loading && transactions.length > 0 && (
                    <div className="mb-5 flex items-center justify-between">
                        <p className="text-sm text-slate-500">
                            Showing{" "}
                            <span className="font-semibold text-slate-800">
                                {transactions.length}
                            </span>{" "}
                            transaction
                            {transactions.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                )}

                {/* Transactions */}
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
                    {loading ? (
                        <div className="space-y-4 p-6">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div
                                    key={item}
                                    className="h-14 animate-pulse rounded-xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                <svg
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                >
                                    <rect
                                        x="3"
                                        y="4"
                                        width="18"
                                        height="16"
                                        rx="2"
                                    />
                                    <path d="M7 9h10" />
                                    <path d="M7 13h6" />
                                </svg>
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-slate-800">
                                No transactions found
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Try changing your filters or make a payment.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full">
                                    <thead className="border-b border-slate-200 bg-slate-50">
                                        <tr>
                                            {[
                                                "Transaction",
                                                "Payment ID",
                                                "Amount",
                                                "Currency",
                                                "Status",
                                                "Date",
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
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
                                                className="group border-b border-slate-100 transition last:border-0 hover:bg-blue-50/40"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${transaction.status ===
                                                                    "SUCCESS"
                                                                    ? "bg-emerald-50 text-emerald-600"
                                                                    : transaction.status ===
                                                                        "FAILED"
                                                                        ? "bg-red-50 text-red-600"
                                                                        : "bg-amber-50 text-amber-600"
                                                                }`}
                                                        >
                                                            {getStatusIcon(
                                                                transaction.status
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-slate-800">
                                                                Transaction #
                                                                {transaction.id}
                                                            </p>

                                                            <p className="text-xs text-slate-400">
                                                                Payment activity
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5 font-medium text-slate-600">
                                                    #{transaction.payment_id}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="font-bold text-slate-900">
                                                        ₹
                                                        {Number(
                                                            transaction.amount
                                                        ).toLocaleString("en-IN", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-sm font-medium text-slate-500">
                                                    {transaction.currency}
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                                                            transaction.status
                                                        )}`}
                                                    >
                                                        <span>
                                                            {getStatusIcon(
                                                                transaction.status
                                                            )}
                                                        </span>
                                                        {transaction.status}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-500">
                                                    {new Date(
                                                        transaction.created_at
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="divide-y divide-slate-100 md:hidden">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="p-5 transition hover:bg-slate-50"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="font-semibold text-slate-900">
                                                    Transaction #
                                                    {transaction.id}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Payment #{transaction.payment_id}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusStyle(
                                                    transaction.status
                                                )}`}
                                            >
                                                {transaction.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Amount
                                                </p>

                                                <p className="mt-1 font-bold text-slate-900">
                                                    ₹{transaction.amount}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Currency
                                                </p>

                                                <p className="mt-1 font-semibold text-slate-700">
                                                    {transaction.currency}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-4 text-xs text-slate-400">
                                            {new Date(
                                                transaction.created_at
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>
        </div>
    );
}
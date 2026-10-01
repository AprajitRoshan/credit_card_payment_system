import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Transactions() {
    const [transactions, setTransactions] = useState([]);
    const [status, setStatus] = useState("");
    const [minAmount, setMinAmount] = useState("");
    const [maxAmount, setMaxAmount] = useState("");
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadTransactions = async () => {
        setLoading(true);
        setError("");

        try {
            const params = {};

            if (status) params.status = status;
            if (minAmount) params.min_amount = minAmount;
            if (maxAmount) params.max_amount = maxAmount;
            if (date) params.date = date;

            const response = await api.get("/transactions/", {
                params,
            });

            setTransactions(response.data);
        } catch (err) {
            console.error(err);
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
        loadTransactions();
    };

    const clearFilters = () => {
        setStatus("");
        setMinAmount("");
        setMaxAmount("");
        setDate("");

        setTimeout(() => {
            loadTransactions();
        }, 0);
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-800">
                    Credit Card Payment System
                </h1>

                <Link
                    to="/dashboard"
                    className="text-blue-600 font-semibold hover:underline"
                >
                    Dashboard
                </Link>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">
                        Transaction History
                    </h2>

                    <p className="text-slate-500 mt-2">
                        View and filter your payment transactions.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-5">
                        Filters
                    </h3>

                    <form
                        onSubmit={handleFilter}
                        className="grid md:grid-cols-2 lg:grid-cols-5 gap-4"
                    >
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Status
                            </label>

                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
                            >
                                <option value="">All</option>
                                <option value="PENDING">Pending</option>
                                <option value="SUCCESS">Success</option>
                                <option value="FAILED">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Min Amount
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                placeholder="Minimum"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Max Amount
                            </label>

                            <input
                                type="number"
                                min="0"
                                value={maxAmount}
                                onChange={(e) => setMaxAmount(e.target.value)}
                                placeholder="Maximum"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Date
                            </label>

                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700"
                            >
                                Filter
                            </button>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-semibold hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-100 text-red-700 px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="p-10 text-center text-slate-500">
                            Loading transactions...
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            No transactions found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            ID
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            Payment ID
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            Amount
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            Currency
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            Status
                                        </th>
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">
                                            Date
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {transactions.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="border-t border-slate-200"
                                        >
                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                #{transaction.id}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                #{transaction.payment_id}
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-slate-800">
                                                ₹{transaction.amount}
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {transaction.currency}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${transaction.status === "SUCCESS"
                                                            ? "bg-green-100 text-green-700"
                                                            : transaction.status === "FAILED"
                                                                ? "bg-red-100 text-red-700"
                                                                : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                >
                                                    {transaction.status}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-slate-600">
                                                {new Date(transaction.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
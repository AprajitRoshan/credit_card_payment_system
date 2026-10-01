import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            navigate("/login");
            return;
        }

        const loadDashboard = async () => {
            try {
                setError("");

                const response = await api.get("/admin/dashboard/");

                setDashboard(response.data);
            } catch (err) {
                console.error("Admin dashboard error:", err);

                if (err.response?.status === 401) {
                    setError(
                        "You are not authorized to access the Admin Dashboard."
                    );
                } else if (err.response?.status === 403) {
                    setError(
                        "Admin access is required to view this dashboard."
                    );
                } else {
                    setError(
                        "Unable to load the Admin Dashboard. Please try again."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [navigate]);

    const handleExport = async () => {
        try {
            const response = await api.get(
                "/admin/transactions/export/",
                {
                    responseType: "blob",
                }
            );

            const url = window.URL.createObjectURL(
                new Blob([response.data], {
                    type: "text/csv",
                })
            );

            const link = document.createElement("a");

            link.href = url;
            link.setAttribute(
                "download",
                "transactions.csv"
            );

            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("CSV export error:", err);

            setError(
                "Unable to export transactions. Admin access is required."
            );
        }
    };

    if (loading) {
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
                    <div className="bg-white rounded-2xl shadow-lg p-10 text-center">
                        <p className="text-slate-600">
                            Loading Admin Dashboard...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

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
                        Admin Dashboard
                    </h2>

                    <p className="text-slate-500 mt-2">
                        Monitor users, cards, transactions and payment activity.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-100 border border-red-200 text-red-700 rounded-xl px-5 py-4">
                        {error}
                    </div>
                )}

                {dashboard && (
                    <>
                        {/* Main Statistics */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl shadow p-6">
                                <p className="text-slate-500">
                                    Total Users
                                </p>

                                <p className="text-3xl font-bold text-slate-800 mt-2">
                                    {dashboard.total_users}
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow p-6">
                                <p className="text-slate-500">
                                    Total Cards
                                </p>

                                <p className="text-3xl font-bold text-slate-800 mt-2">
                                    {dashboard.total_cards}
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow p-6">
                                <p className="text-slate-500">
                                    Total Transactions
                                </p>

                                <p className="text-3xl font-bold text-slate-800 mt-2">
                                    {dashboard.total_transactions}
                                </p>
                            </div>
                        </div>

                        {/* Payment Statistics */}
                        <div className="grid md:grid-cols-3 gap-6 mt-6">
                            <div className="bg-white rounded-2xl shadow p-6">
                                <p className="text-slate-500">
                                    Successful Payments
                                </p>

                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {dashboard.successful_transactions}
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow p-6">
                                <p className="text-slate-500">
                                    Failed Payments
                                </p>

                                <p className="text-3xl font-bold text-red-600 mt-2">
                                    {dashboard.failed_transactions}
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow p-6">
                                <p className="text-slate-500">
                                    Pending Payments
                                </p>

                                <p className="text-3xl font-bold text-yellow-600 mt-2">
                                    {dashboard.pending_transactions}
                                </p>
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="bg-white rounded-2xl shadow p-6 mt-6">
                            <p className="text-slate-500">
                                Total Successful Payment Amount
                            </p>

                            <p className="text-3xl font-bold text-slate-800 mt-2">
                                ₹{Number(
                                    dashboard.total_payment_amount
                                ).toFixed(2)}
                            </p>
                        </div>

                        {/* Daily Summary */}
                        <div className="bg-white rounded-2xl shadow p-6 mt-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">
                                        Daily Payment Summary
                                    </h3>

                                    <p className="text-slate-500 mt-1">
                                        {dashboard.daily_summary.date}
                                    </p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6 mt-6">
                                <div className="border border-slate-200 rounded-xl p-5">
                                    <p className="text-slate-500">
                                        Successful Payments
                                    </p>

                                    <p className="text-2xl font-bold text-green-600 mt-2">
                                        {
                                            dashboard.daily_summary
                                                .successful_payments
                                        }
                                    </p>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-5">
                                    <p className="text-slate-500">
                                        Failed Payments
                                    </p>

                                    <p className="text-2xl font-bold text-red-600 mt-2">
                                        {
                                            dashboard.daily_summary
                                                .failed_payments
                                        }
                                    </p>
                                </div>

                                <div className="border border-slate-200 rounded-xl p-5">
                                    <p className="text-slate-500">
                                        Successful Amount
                                    </p>

                                    <p className="text-2xl font-bold text-slate-800 mt-2">
                                        ₹{Number(
                                            dashboard.daily_summary
                                                .successful_amount
                                        ).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CSV Export */}
                        <div className="bg-white rounded-2xl shadow p-6 mt-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                Transaction Export
                            </h3>

                            <p className="text-slate-500 mt-2">
                                Download all transactions as a CSV file.
                            </p>

                            <button
                                onClick={handleExport}
                                className="mt-5 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
                            >
                                Export Transactions CSV
                            </button>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
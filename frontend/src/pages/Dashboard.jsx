import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const dashboardApi = "http://127.0.0.1:8001/api";

function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatTime(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function StatusBadge({ status }) {
    const normalized = String(status || "").toUpperCase();

    const styles = {
        SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
        FAILED: "bg-red-50 text-red-700 border-red-200",
        PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles[normalized] ||
                "bg-slate-50 text-slate-600 border-slate-200"
                }`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {normalized || "UNKNOWN"}
        </span>
    );
}

function StatCard({ icon, title, value, subtitle, className = "" }) {
    return (
        <div
            className={`dashboard-stat-card group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg ${className}`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                        {value}
                    </p>

                    {subtitle && (
                        <p className="mt-1 text-xs text-slate-400">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 transition-transform duration-300 group-hover:scale-110">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[#f5f7fb]">
            <div className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
                    <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
                <div className="animate-pulse">
                    <div className="h-8 w-64 rounded bg-slate-200" />
                    <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-200" />

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-32 rounded-2xl bg-white"
                            />
                        ))}
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        <div className="h-64 rounded-2xl bg-white lg:col-span-1" />
                        <div className="h-64 rounded-2xl bg-white lg:col-span-2" />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [summary, setSummary] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        const loadDashboard = async () => {
            try {
                setError("");

                /*
                 * User information comes from Django.
                 */
                const userResponse = await api.get("/auth/me/");
                setUser(userResponse.data);

                /*
                 * Dashboard summary comes from FastAPI.
                 */
                const dashboardResponse = await fetch(
                    `${dashboardApi}/dashboard/summary`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!dashboardResponse.ok) {
                    if (
                        dashboardResponse.status === 401 ||
                        dashboardResponse.status === 403
                    ) {
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("refresh_token");

                        navigate("/login", { replace: true });
                        return;
                    }

                    throw new Error(
                        "Unable to load dashboard information."
                    );
                }

                const dashboardData = await dashboardResponse.json();

                setSummary(dashboardData);
            } catch (err) {
                console.error("Dashboard error:", err);

                /*
                 * Only authentication failure should send the user
                 * back to login.
                 */
                if (err.response?.status === 401) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");

                    navigate("/login", { replace: true });
                    return;
                }

                setError(
                    "Unable to load dashboard data. Please try again."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const refresh = localStorage.getItem("refresh_token");

            if (refresh) {
                await api.post("/auth/logout/", {
                    refresh,
                });
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            navigate("/login", { replace: true });
        }
    };

    const totalSpent = Number(summary?.total_amount_spent || 0);

    const availableCredit = Number(
        summary?.available_credit_limit || 0
    );

    const totalCreditLimit = Math.max(
        totalSpent + availableCredit,
        0
    );

    const creditUsedPercentage =
        totalCreditLimit > 0
            ? Math.min(
                (totalSpent / totalCreditLimit) * 100,
                100
            )
            : 0;

    const transactions = useMemo(
        () => summary?.last_5_transactions || [],
        [summary]
    );

    if (loading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="dashboard-page min-h-screen bg-[#f5f7fb]">
            {/* =========================
                TOP NAVIGATION
            ========================= */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                    <Link
                        to="/dashboard"
                        className="group flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">
                            ₹
                        </div>

                        <div>
                            <h1 className="text-base font-bold text-slate-900 sm:text-lg">
                                CreditPay
                            </h1>

                            <p className="hidden text-xs text-slate-400 sm:block">
                                Credit Card Payment System
                            </p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-800">
                                {user?.username || "User"}
                            </p>

                            <p className="text-xs text-slate-400">
                                Account
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* =========================
                MAIN CONTENT
            ========================= */}
            <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-9">
                {/* Welcome */}
                <section className="dashboard-enter">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-semibold text-blue-600">
                                Personal Dashboard
                            </p>

                            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                Welcome
                                {user?.username
                                    ? `, ${user.username}`
                                    : ""}
                                !
                            </h2>

                            <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
                                Manage your cards, make payments and keep
                                track of your spending in one place.
                            </p>
                        </div>

                        <Link
                            to="/payment"
                            className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
                        >
                            <span className="text-lg">₹</span>
                            Make Payment
                        </Link>
                    </div>
                </section>

                {/* =========================
                    STAT CARDS
                ========================= */}
                <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon="₹"
                        title="Total Spent"
                        value={formatCurrency(totalSpent)}
                        subtitle="Successful transactions"
                    />

                    <StatCard
                        icon="↗"
                        title="Available Credit"
                        value={formatCurrency(availableCredit)}
                        subtitle="Currently available"
                    />

                    <StatCard
                        icon="▣"
                        title="Total Transactions"
                        value={summary?.total_transactions || 0}
                        subtitle="All transactions"
                    />

                    <StatCard
                        icon="◷"
                        title="This Month"
                        value={formatCurrency(
                            summary?.current_month_spending
                        )}
                        subtitle="Current month spending"
                    />
                </section>

                {/* =========================
                    QUICK ACTIONS
                ========================= */}
                <section className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Quick Actions
                            </h3>

                            <p className="text-sm text-slate-500">
                                Common actions at your fingertips
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Link
                            to="/cards"
                            className="dashboard-action group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600 transition-transform duration-300 group-hover:scale-110">
                                ▣
                            </div>

                            <div>
                                <p className="font-semibold text-slate-900">
                                    Manage Cards
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    View or remove cards
                                </p>
                            </div>

                            <span className="ml-auto text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-blue-500">
                                →
                            </span>
                        </Link>

                        <Link
                            to="/cards/add"
                            className="dashboard-action group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl text-emerald-600 transition-transform duration-300 group-hover:scale-110">
                                +
                            </div>

                            <div>
                                <p className="font-semibold text-slate-900">
                                    Add Card
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Save a new card
                                </p>
                            </div>

                            <span className="ml-auto text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-emerald-500">
                                →
                            </span>
                        </Link>

                        <Link
                            to="/payment"
                            className="dashboard-action group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-600 transition-transform duration-300 group-hover:scale-110">
                                ₹
                            </div>

                            <div>
                                <p className="font-semibold text-slate-900">
                                    Make Payment
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    Pay using a saved card
                                </p>
                            </div>

                            <span className="ml-auto text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-violet-500">
                                →
                            </span>
                        </Link>

                        <Link
                            to="/transactions"
                            className="dashboard-action group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-lg"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl text-amber-600 transition-transform duration-300 group-hover:scale-110">
                                ≡
                            </div>

                            <div>
                                <p className="font-semibold text-slate-900">
                                    Transactions
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    View payment history
                                </p>
                            </div>

                            <span className="ml-auto text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-amber-500">
                                →
                            </span>
                        </Link>
                    </div>
                </section>

                {/* =========================
                    CREDIT + MONTHLY SPENDING
                ========================= */}
                <section className="mt-6 grid gap-6 lg:grid-cols-5">
                    {/* Credit utilization */}
                    <div className="dashboard-enter rounded-2xl bg-slate-900 p-6 text-white shadow-lg lg:col-span-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-400">
                                    Credit Overview
                                </p>

                                <h3 className="mt-1 text-xl font-bold">
                                    Available Credit
                                </h3>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg">
                                ₹
                            </div>
                        </div>

                        <div className="mt-7">
                            <p className="text-3xl font-bold">
                                {formatCurrency(availableCredit)}
                            </p>

                            <p className="mt-1 text-sm text-slate-400">
                                available out of{" "}
                                {formatCurrency(totalCreditLimit)}
                            </p>
                        </div>

                        <div className="mt-6">
                            <div className="mb-2 flex justify-between text-xs text-slate-400">
                                <span>Credit used</span>
                                <span>
                                    {creditUsedPercentage.toFixed(0)}%
                                </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="credit-progress h-full rounded-full bg-blue-500"
                                    style={{
                                        width: `${creditUsedPercentage}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                            <span className="text-slate-400">
                                Total spent
                            </span>

                            <span className="font-semibold text-white">
                                {formatCurrency(totalSpent)}
                            </span>
                        </div>
                    </div>

                    {/* Spending snapshot */}
                    <div className="dashboard-enter rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Spending Snapshot
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-900">
                                    Your spending
                                </h3>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600">
                                ₹
                            </div>
                        </div>

                        <div className="mt-7 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 p-5 transition-colors duration-200 hover:bg-blue-50">
                                <p className="text-sm text-slate-500">
                                    This month
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {formatCurrency(
                                        summary?.current_month_spending
                                    )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Current month spending
                                </p>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-5 transition-colors duration-200 hover:bg-emerald-50">
                                <p className="text-sm text-slate-500">
                                    Total transactions
                                </p>

                                <p className="mt-2 text-2xl font-bold text-slate-900">
                                    {summary?.total_transactions || 0}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Across your account
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =========================
                    LAST 5 TRANSACTIONS
                ========================= */}
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">
                                Recent Transactions
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Your latest payment activity
                            </p>
                        </div>

                        <Link
                            to="/transactions"
                            className="w-fit rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                        >
                            View all →
                        </Link>
                    </div>

                    {error && (
                        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {transactions.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
                                ₹
                            </div>

                            <h4 className="mt-4 font-semibold text-slate-800">
                                No transactions yet
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                                Your recent payments will appear here.
                            </p>

                            <Link
                                to="/payment"
                                className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-md"
                            >
                                Make your first payment
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {transactions.map((transaction, index) => (
                                <div
                                    key={`${transaction.date}-${index}`}
                                    className="group flex flex-col gap-4 px-5 py-4 transition-colors duration-200 hover:bg-slate-50 sm:flex-row sm:items-center sm:px-6"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-4">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg text-slate-600 transition-all duration-200 group-hover:bg-blue-50 group-hover:text-blue-600">
                                            ₹
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(
                                                    transaction.amount
                                                )}
                                            </p>

                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                {transaction.masked_card_number ||
                                                    "Card unavailable"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-5 sm:justify-end">
                                        <div className="text-left sm:text-right">
                                            <p className="text-sm font-medium text-slate-700">
                                                {formatDate(
                                                    transaction.date
                                                )}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {formatTime(
                                                    transaction.date
                                                )}
                                            </p>
                                        </div>

                                        <StatusBadge
                                            status={transaction.status}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Admin */}
                {user?.is_staff && (
                    <div className="mt-6">
                        <Link
                            to="/admin"
                            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                        >
                            <div>
                                <p className="font-semibold text-slate-900">
                                    Admin Dashboard
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    Manage users, cards, transactions and
                                    payment summaries.
                                </p>
                            </div>

                            <span className="text-xl text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-600">
                                →
                            </span>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
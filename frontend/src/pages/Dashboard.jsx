import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const dashboardApi = "http://127.0.0.1:8001/api";

/* =========================================================
   HELPERS
========================================================= */

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

/* =========================================================
   ICONS
========================================================= */

function RupeeIcon({ size = 20 }) {
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
            <path d="M6 5h12" />
            <path d="M6 9h12" />
            <path d="M9 5c4.5 0 6 2 6 4s-1.5 4-6 4h-1" />
            <path d="m8 13 7 6" />
        </svg>
    );
}

function CreditCardIcon({ size = 20 }) {
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
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
            />
            <path d="M3 10h18" />
            <path d="M7 15h3" />
        </svg>
    );
}

function PlusIcon({ size = 20 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
        >
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </svg>
    );
}

function PaymentIcon({ size = 20 }) {
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
            <path d="M3 7h18" />
            <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            <path d="M7 15h4" />
        </svg>
    );
}

function TransactionIcon({ size = 20 }) {
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
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
        </svg>
    );
}

function ArrowUpRightIcon({ size = 18 }) {
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
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
        </svg>
    );
}

function ArrowRightIcon({ size = 17 }) {
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
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

function ChartIcon({ size = 20 }) {
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
            <path d="M4 19V5" />
            <path d="M4 19h16" />
            <path d="m7 15 4-4 3 2 5-6" />
        </svg>
    );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
    const normalized = String(status || "").toUpperCase();

    const styles = {
        SUCCESS:
            "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400",

        FAILED:
            "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400",

        PENDING:
            "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400",
    };

    return (
        <span
            className={`
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                px-3
                py-1
                text-[11px]
                font-bold
                tracking-wide
                ${styles[normalized] ||
                "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"}
            `}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {normalized || "UNKNOWN"}
        </span>
    );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    icon,
    title,
    value,
    subtitle,
    accent = "blue",
}) {
    const accents = {
        blue: {
            icon: "bg-blue-500/10 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400",
            glow: "group-hover:border-blue-500/30",
        },

        emerald: {
            icon: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
            glow: "group-hover:border-emerald-500/30",
        },

        violet: {
            icon: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
            glow: "group-hover:border-violet-500/30",
        },

        amber: {
            icon: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
            glow: "group-hover:border-amber-500/30",
        },
    };

    const currentAccent = accents[accent];

    return (
        <div
            className={`
                dashboard-stat-card
                group
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-lg
                dark:border-slate-700/60
                dark:bg-[#111827]
                ${currentAccent.glow}
            `}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {title}
                    </p>

                    <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[26px]">
                        {value}
                    </p>

                    {subtitle && (
                        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className={`
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        transition-transform
                        duration-300
                        group-hover:scale-105
                        ${currentAccent.icon}
                    `}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* =========================================================
   SKELETON
========================================================= */

function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#080f1d]">
            <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0f172a]">
                <div className="mx-auto max-w-[1400px] px-5 py-4 sm:px-8">
                    <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
            </div>

            <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:py-10">
                <div className="animate-pulse">
                    <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />

                    <div className="mt-3 h-10 w-72 rounded bg-slate-200 dark:bg-slate-800" />

                    <div className="mt-3 h-5 w-[520px] max-w-full rounded bg-slate-200 dark:bg-slate-800" />

                    <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-36 rounded-2xl bg-white dark:bg-[#111827]"
                            />
                        ))}
                    </div>

                    <div className="mt-7 grid gap-6 lg:grid-cols-5">
                        <div className="h-72 rounded-2xl bg-white dark:bg-[#111827] lg:col-span-2" />

                        <div className="h-72 rounded-2xl bg-white dark:bg-[#111827] lg:col-span-3" />
                    </div>
                </div>
            </main>
        </div>
    );
}

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [summary, setSummary] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            navigate("/login", { replace: true });
            return;
        }

        const loadDashboard = async () => {
            try {
                setError("");

                const userResponse = await api.get("/auth/me/");

                setUser(userResponse.data);

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
                        localStorage.removeItem(
                            "access_token"
                        );

                        localStorage.removeItem(
                            "refresh_token"
                        );

                        navigate("/login", {
                            replace: true,
                        });

                        return;
                    }

                    throw new Error(
                        "Unable to load dashboard information."
                    );
                }

                const dashboardData =
                    await dashboardResponse.json();

                setSummary(dashboardData);
            } catch (err) {
                console.error(
                    "Dashboard error:",
                    err
                );

                if (err.response?.status === 401) {
                    localStorage.removeItem(
                        "access_token"
                    );

                    localStorage.removeItem(
                        "refresh_token"
                    );

                    navigate("/login", {
                        replace: true,
                    });

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

    /* =====================================================
       LOGOUT
    ===================================================== */

    const handleLogout = async () => {
        try {
            const refresh =
                localStorage.getItem("refresh_token");

            if (refresh) {
                await api.post("/auth/logout/", {
                    refresh,
                });
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "refresh_token"
            );

            navigate("/login", {
                replace: true,
            });
        }
    };

    /* =====================================================
       CALCULATIONS
    ===================================================== */

    const totalSpent = Number(
        summary?.total_amount_spent || 0
    );

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

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return <DashboardSkeleton />;
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="dashboard-page min-h-screen bg-[#f5f7fb] dark:bg-[#080f1d]">
            {/* =================================================
                NAVIGATION
            ================================================= */}

            <header
                className="
                    sticky
                    top-0
                    z-30
                    border-b
                    border-slate-200
                    bg-white/95
                    shadow-sm
                    backdrop-blur-xl
                    dark:border-slate-800
                    dark:bg-[#0f172a]/95
                "
            >
                <div
                    className="
                        mx-auto
                        flex
                        max-w-[1400px]
                        items-center
                        justify-between
                        px-5
                        py-3.5
                        sm:px-8
                    "
                >
                    <Link
                        to="/dashboard"
                        className="group flex items-center gap-3"
                    >
                        <div
                            className="
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-600
                                text-white
                                shadow-lg
                                shadow-blue-600/20
                                transition-transform
                                duration-300
                                group-hover:scale-105
                            "
                        >
                            <RupeeIcon size={19} />
                        </div>

                        <div>
                            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                                CreditPay
                            </h1>

                            <p className="hidden text-[11px] text-slate-400 sm:block">
                                Credit Card Payment System
                            </p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                {user?.username ||
                                    "User"}
                            </p>

                            <p className="text-[11px] text-slate-400">
                                Account
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-4
                                py-2
                                text-sm
                                font-semibold
                                text-slate-700
                                shadow-sm
                                transition-all
                                duration-200
                                hover:border-red-200
                                hover:bg-red-50
                                hover:text-red-600
                                hover:shadow-md
                                dark:border-slate-700
                                dark:bg-slate-900
                                dark:text-slate-200
                                dark:hover:border-red-500/30
                                dark:hover:bg-red-500/10
                                dark:hover:text-red-400
                            "
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* =================================================
                MAIN
            ================================================= */}

            <main
                className="
                    mx-auto
                    w-full
                    max-w-[1400px]
                    px-5
                    py-8
                    sm:px-8
                    lg:px-10
                    lg:py-10
                "
            >
                {/* =================================================
                    HERO
                ================================================= */}

                <section className="dashboard-enter">
                    <div
                        className="
                            flex
                            flex-col
                            gap-6
                            lg:flex-row
                            lg:items-end
                            lg:justify-between
                        "
                    >
                        <div>
                            <div className="mb-3 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                                    Personal Dashboard
                                </p>
                            </div>

                            <h2
                                className="
                                    text-3xl
                                    font-bold
                                    tracking-tight
                                    text-slate-900
                                    dark:text-white
                                    sm:text-4xl
                                    lg:text-[42px]
                                "
                            >
                                Welcome
                                {user?.username
                                    ? `, ${user.username}`
                                    : ""}
                                !
                            </h2>

                            <p
                                className="
                                    mt-3
                                    max-w-2xl
                                    text-sm
                                    leading-6
                                    text-slate-500
                                    dark:text-slate-400
                                    sm:text-base
                                "
                            >
                                Manage your cards, make
                                payments and keep track of
                                your spending in one place.
                            </p>
                        </div>

                        <Link
                            to="/payment"
                            className="
                                inline-flex
                                w-fit
                                items-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-5
                                py-3
                                text-sm
                                font-bold
                                text-white
                                shadow-lg
                                shadow-blue-600/20
                                transition-all
                                duration-200
                                hover:-translate-y-0.5
                                hover:bg-blue-700
                                hover:shadow-xl
                                hover:shadow-blue-600/25
                            "
                        >
                            <RupeeIcon size={17} />
                            Make Payment
                        </Link>
                    </div>
                </section>

                {/* =================================================
                    STAT CARDS
                ================================================= */}

                <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon={<RupeeIcon size={19} />}
                        title="Total Spent"
                        value={formatCurrency(
                            totalSpent
                        )}
                        subtitle="Successful transactions"
                        accent="blue"
                    />

                    <StatCard
                        icon={<ArrowUpRightIcon size={19} />}
                        title="Available Credit"
                        value={formatCurrency(
                            availableCredit
                        )}
                        subtitle="Currently available"
                        accent="emerald"
                    />

                    <StatCard
                        icon={<CreditCardIcon size={19} />}
                        title="Total Transactions"
                        value={
                            summary?.total_transactions ||
                            0
                        }
                        subtitle="All transactions"
                        accent="violet"
                    />

                    <StatCard
                        icon={<ChartIcon size={19} />}
                        title="This Month"
                        value={formatCurrency(
                            summary?.current_month_spending
                        )}
                        subtitle="Current month spending"
                        accent="amber"
                    />
                </section>

                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}

                <section className="mt-9">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            Quick Actions
                        </h3>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Common actions at your fingertips
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Manage Cards */}

                        <Link
                            to="/cards"
                            className="
                                dashboard-action
                                group
                                flex
                                items-center
                                gap-4
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-blue-200
                                hover:shadow-lg
                                dark:border-slate-700/60
                                dark:bg-[#111827]
                                dark:hover:border-blue-500/30
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-12
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-blue-500/10
                                    text-blue-600
                                    transition-transform
                                    duration-300
                                    group-hover:scale-105
                                    dark:text-blue-400
                                "
                            >
                                <CreditCardIcon size={21} />
                            </div>

                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white">
                                    Manage Cards
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    View or remove cards
                                </p>
                            </div>

                            <span className="ml-auto text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600">
                                <ArrowRightIcon />
                            </span>
                        </Link>

                        {/* Add Card */}

                        <Link
                            to="/cards/add"
                            className="
                                dashboard-action
                                group
                                flex
                                items-center
                                gap-4
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-emerald-200
                                hover:shadow-lg
                                dark:border-slate-700/60
                                dark:bg-[#111827]
                                dark:hover:border-emerald-500/30
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-12
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-emerald-500/10
                                    text-emerald-600
                                    transition-transform
                                    duration-300
                                    group-hover:scale-105
                                    dark:text-emerald-400
                                "
                            >
                                <PlusIcon size={21} />
                            </div>

                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white">
                                    Add Card
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Save a new card
                                </p>
                            </div>

                            <span className="ml-auto text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-emerald-500 dark:text-slate-600">
                                <ArrowRightIcon />
                            </span>
                        </Link>

                        {/* Make Payment */}

                        <Link
                            to="/payment"
                            className="
                                dashboard-action
                                group
                                flex
                                items-center
                                gap-4
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-violet-200
                                hover:shadow-lg
                                dark:border-slate-700/60
                                dark:bg-[#111827]
                                dark:hover:border-violet-500/30
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-12
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-violet-500/10
                                    text-violet-600
                                    transition-transform
                                    duration-300
                                    group-hover:scale-105
                                    dark:text-violet-400
                                "
                            >
                                <PaymentIcon size={21} />
                            </div>

                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white">
                                    Make Payment
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Pay using a saved card
                                </p>
                            </div>

                            <span className="ml-auto text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-violet-500 dark:text-slate-600">
                                <ArrowRightIcon />
                            </span>
                        </Link>

                        {/* Transactions */}

                        <Link
                            to="/transactions"
                            className="
                                dashboard-action
                                group
                                flex
                                items-center
                                gap-4
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-amber-200
                                hover:shadow-lg
                                dark:border-slate-700/60
                                dark:bg-[#111827]
                                dark:hover:border-amber-500/30
                            "
                        >
                            <div
                                className="
                                    flex
                                    h-12
                                    w-12
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-amber-500/10
                                    text-amber-600
                                    transition-transform
                                    duration-300
                                    group-hover:scale-105
                                    dark:text-amber-400
                                "
                            >
                                <TransactionIcon size={21} />
                            </div>

                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white">
                                    Transactions
                                </p>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    View payment history
                                </p>
                            </div>

                            <span className="ml-auto text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-amber-500 dark:text-slate-600">
                                <ArrowRightIcon />
                            </span>
                        </Link>
                    </div>
                </section>

                {/* =================================================
                    CREDIT + SPENDING
                ================================================= */}

                <section className="mt-7 grid gap-5 lg:grid-cols-5">
                    {/* Credit Overview */}

                    <div
                        className="
                            dashboard-enter
                            relative
                            overflow-hidden
                            rounded-2xl
                            border
                            border-blue-500/20
                            bg-gradient-to-br
                            from-blue-950
                            via-slate-900
                            to-slate-950
                            p-6
                            text-white
                            shadow-xl
                            shadow-blue-950/10
                            lg:col-span-2
                            dark:border-blue-500/20
                        "
                    >
                        <div
                            className="
                                pointer-events-none
                                absolute
                                -right-20
                                -top-20
                                h-48
                                w-48
                                rounded-full
                                bg-blue-500/10
                                blur-3xl
                            "
                        />

                        <div className="relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/60">
                                        Credit Overview
                                    </p>

                                    <h3 className="mt-1.5 text-xl font-bold">
                                        Available Credit
                                    </h3>
                                </div>

                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-blue-200">
                                    <RupeeIcon size={19} />
                                </div>
                            </div>

                            <div className="mt-8">
                                <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                                    {formatCurrency(
                                        availableCredit
                                    )}
                                </p>

                                <p className="mt-2 text-sm text-slate-400">
                                    available out of{" "}
                                    <span className="font-medium text-slate-300">
                                        {formatCurrency(
                                            totalCreditLimit
                                        )}
                                    </span>
                                </p>
                            </div>

                            <div className="mt-7">
                                <div className="mb-2.5 flex justify-between text-xs">
                                    <span className="text-slate-400">
                                        Credit used
                                    </span>

                                    <span className="font-semibold text-slate-300">
                                        {creditUsedPercentage.toFixed(
                                            0
                                        )}
                                        %
                                    </span>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="
                                            credit-progress
                                            h-full
                                            rounded-full
                                            bg-gradient-to-r
                                            from-blue-500
                                            to-cyan-400
                                            shadow-lg
                                            shadow-blue-500/30
                                        "
                                        style={{
                                            width: `${creditUsedPercentage}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                                <span className="text-xs text-slate-400">
                                    Total spent
                                </span>

                                <span className="text-sm font-bold text-white">
                                    {formatCurrency(
                                        totalSpent
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Spending Snapshot */}

                    <div
                        className="
                            dashboard-enter
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            p-6
                            shadow-sm
                            lg:col-span-3
                            dark:border-slate-700/60
                            dark:bg-[#111827]
                        "
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Spending Snapshot
                                </p>

                                <h3 className="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">
                                    Your spending
                                </h3>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <ChartIcon size={20} />
                            </div>
                        </div>

                        <div className="mt-7 grid gap-4 sm:grid-cols-2">
                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-100
                                    bg-slate-50
                                    p-5
                                    transition-all
                                    duration-200
                                    hover:border-blue-100
                                    hover:bg-blue-50
                                    dark:border-slate-700/50
                                    dark:bg-slate-900/60
                                    dark:hover:border-blue-500/20
                                    dark:hover:bg-blue-500/5
                                "
                            >
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-blue-500" />

                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        This month
                                    </p>
                                </div>

                                <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(
                                        summary?.current_month_spending
                                    )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    Current month spending
                                </p>
                            </div>

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-100
                                    bg-slate-50
                                    p-5
                                    transition-all
                                    duration-200
                                    hover:border-emerald-100
                                    hover:bg-emerald-50
                                    dark:border-slate-700/50
                                    dark:bg-slate-900/60
                                    dark:hover:border-emerald-500/20
                                    dark:hover:bg-emerald-500/5
                                "
                            >
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Total transactions
                                    </p>
                                </div>

                                <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                                    {summary?.total_transactions ||
                                        0}
                                </p>

                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                    Across your account
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* =================================================
                    RECENT TRANSACTIONS
                ================================================= */}

                <section
                    className="
                        mt-7
                        overflow-hidden
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        shadow-sm
                        dark:border-slate-700/60
                        dark:bg-[#111827]
                    "
                >
                    <div
                        className="
                            flex
                            flex-col
                            gap-3
                            border-b
                            border-slate-100
                            px-5
                            py-5
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                            sm:px-6
                            dark:border-slate-700/60
                        "
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Recent Transactions
                                </h3>
                            </div>

                            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                                Your latest payment activity
                            </p>
                        </div>

                        <Link
                            to="/transactions"
                            className="
                                inline-flex
                                w-fit
                                items-center
                                gap-1.5
                                rounded-lg
                                px-3
                                py-2
                                text-sm
                                font-semibold
                                text-blue-600
                                transition-colors
                                hover:bg-blue-50
                                dark:text-blue-400
                                dark:hover:bg-blue-500/10
                            "
                        >
                            View all
                            <ArrowRightIcon size={15} />
                        </Link>
                    </div>

                    {error && (
                        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    {transactions.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <TransactionIcon size={24} />
                            </div>

                            <h4 className="mt-4 font-semibold text-slate-800 dark:text-slate-200">
                                No transactions yet
                            </h4>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Your recent payments will
                                appear here.
                            </p>

                            <Link
                                to="/payment"
                                className="
                                    mt-5
                                    inline-flex
                                    rounded-xl
                                    bg-blue-600
                                    px-5
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition-all
                                    hover:bg-blue-700
                                    hover:shadow-md
                                "
                            >
                                Make your first payment
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {transactions.map(
                                (transaction, index) => (
                                    <div
                                        key={`${transaction.date}-${index}`}
                                        className="
                                            group
                                            flex
                                            flex-col
                                            gap-4
                                            px-5
                                            py-5
                                            transition-colors
                                            duration-200
                                            hover:bg-slate-50
                                            sm:flex-row
                                            sm:items-center
                                            sm:px-6
                                            dark:hover:bg-slate-800/40
                                        "
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-4">
                                            <div
                                                className="
                                                    flex
                                                    h-11
                                                    w-11
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    bg-slate-100
                                                    text-slate-600
                                                    transition-all
                                                    duration-200
                                                    group-hover:bg-blue-50
                                                    group-hover:text-blue-600
                                                    dark:bg-slate-800
                                                    dark:text-slate-300
                                                    dark:group-hover:bg-blue-500/10
                                                    dark:group-hover:text-blue-400
                                                "
                                            >
                                                <RupeeIcon size={18} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-900 dark:text-white">
                                                    {formatCurrency(
                                                        transaction.amount
                                                    )}
                                                </p>

                                                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                                                    {transaction.masked_card_number ||
                                                        "Card unavailable"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-5 sm:justify-end">
                                            <div className="text-left sm:text-right">
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                    {formatDate(
                                                        transaction.date
                                                    )}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                    {formatTime(
                                                        transaction.date
                                                    )}
                                                </p>
                                            </div>

                                            <StatusBadge
                                                status={
                                                    transaction.status
                                                }
                                            />
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </section>

                {/* =================================================
                    ADMIN
                ================================================= */}

                {user?.is_staff && (
                    <div className="mt-7">
                        <Link
                            to="/admin"
                            className="
                                group
                                flex
                                items-center
                                justify-between
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-5
                                shadow-sm
                                transition-all
                                duration-300
                                hover:-translate-y-0.5
                                hover:border-slate-300
                                hover:shadow-md
                                dark:border-slate-700/60
                                dark:bg-[#111827]
                                dark:hover:border-slate-600
                            "
                        >
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white">
                                    Admin Dashboard
                                </p>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Manage users, cards,
                                    transactions and payment
                                    summaries.
                                </p>
                            </div>

                            <span className="text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-300">
                                <ArrowRightIcon size={20} />
                            </span>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
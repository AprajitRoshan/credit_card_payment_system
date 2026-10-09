import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { downloadFile } from "../services/download";
import SystemHealthPanel from "../components/admin/SystemHealthPanel";
import FraudLogPanel from "../components/admin/FraudLogPanel";

/* =========================================================
   ICONS
========================================================= */

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
            <path d="M7 15h4" />
        </svg>
    );
}

function DownloadIcon({ size = 18 }) {
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

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [dashboard, setDashboard] =
        useState(null);

    const [role, setRole] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    useEffect(() => {
        const token =
            localStorage.getItem(
                "access_token"
            );

        if (!token) {
            navigate("/login");
            return;
        }

        const loadDashboard = async () => {
            try {
                setError("");

                const [meResponse, response] =
                    await Promise.all([
                        api.get("/auth/me/"),
                        api.get(
                            "/admin/dashboard/"
                        ),
                    ]);

                setRole(meResponse.data.role);

                setDashboard(
                    response.data
                );
            } catch (err) {
                console.error(
                    "Admin dashboard error:",
                    err
                );

                if (
                    err.response?.status ===
                    401
                ) {
                    setError(
                        "You are not authorized to access the Admin Dashboard."
                    );
                } else if (
                    err.response?.status ===
                    403
                ) {
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

    const isAdmin = role === "ADMIN";

    const canReviewFraud =
        role === "ADMIN" || role === "SUPPORT";

    /* =====================================================
       EXPORT
    ===================================================== */

    const handleExport = async () => {
        try {
            setError("");

            await downloadFile(
                "/admin/transactions/export/",
                "transactions.csv"
            );
        } catch (err) {
            console.error(
                "CSV export error:",
                err
            );

            setError(
                "Unable to export transactions. Admin access is required."
            );
        }
    };

    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <div className="min-h-screen bg-[#080f1d]">
                <header className="border-b border-slate-800 bg-[#0f172a]">
                    <div className="mx-auto max-w-[1400px] px-5 py-4 sm:px-8">
                        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-800" />
                    </div>
                </header>

                <main className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
                    <div className="h-10 w-72 animate-pulse rounded-lg bg-slate-800" />

                    <div className="mt-8 grid gap-5 md:grid-cols-3">
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="h-32 animate-pulse rounded-2xl bg-[#111827]"
                                />
                            )
                        )}
                    </div>
                </main>
            </div>
        );
    }

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#080f1d]">
            {/* =============================================
                HEADER
            ============================================= */}

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
                        py-4
                        sm:px-8
                    "
                >
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                            CreditPay Admin
                        </h1>

                        <p className="text-xs text-slate-400">
                            Administration
                            {role && ` · ${role.replace("_", "-")}`}
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="
                            mr-14
                            rounded-xl
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            text-blue-600
                            transition
                            hover:bg-blue-50
                            dark:text-blue-400
                            dark:hover:bg-blue-500/10
                        "
                    >
                        Dashboard
                    </Link>
                </div>
            </header>

            <main
                className="
                    mx-auto
                    max-w-[1400px]
                    px-5
                    py-8
                    sm:px-8
                    lg:px-10
                    lg:py-10
                "
            >
                {/* =========================================
                    TITLE
                ========================================= */}

                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                        Administration
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        Admin Dashboard
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                        Monitor users, cards,
                        transactions, fraud alerts
                        and system health.
                    </p>
                </div>

                {/* =========================================
                    ERROR
                ========================================= */}

                {error && (
                    <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-medium text-red-500">
                        {error}
                    </div>
                )}

                {dashboard && (
                    <>
                        {/* =====================================
                            MAIN STATISTICS
                        ===================================== */}

                        <div className="mt-8 grid gap-5 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-[#111827]">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Total Users
                                </p>

                                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                                    {
                                        dashboard.total_users
                                    }
                                </p>
                            </div>

                            <div className="rounded-2xl border border-blue-500/20 bg-white p-6 shadow-sm dark:bg-[#111827]">
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                    Total Cards
                                </p>

                                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                                    {
                                        dashboard.total_cards
                                    }
                                </p>
                            </div>

                            <div className="rounded-2xl border border-violet-500/20 bg-white p-6 shadow-sm dark:bg-[#111827]">
                                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                    Total Transactions
                                </p>

                                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                                    {
                                        dashboard.total_transactions
                                    }
                                </p>
                            </div>
                        </div>

                        {/* =====================================
                            PAYMENT STATISTICS
                        ===================================== */}

                        <div className="mt-5 grid gap-5 md:grid-cols-3">
                            <div className="rounded-2xl border border-emerald-500/20 bg-white p-6 shadow-sm dark:bg-[#111827]">
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    Successful Payments
                                </p>

                                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                                    {
                                        dashboard.successful_transactions
                                    }
                                </p>
                            </div>

                            <div className="rounded-2xl border border-red-500/20 bg-white p-6 shadow-sm dark:bg-[#111827]">
                                <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                                    Failed Payments
                                </p>

                                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                                    {
                                        dashboard.failed_transactions
                                    }
                                </p>
                            </div>

                            <div className="rounded-2xl border border-amber-500/20 bg-white p-6 shadow-sm dark:bg-[#111827]">
                                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                    Pending Payments
                                </p>

                                <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                                    {
                                        dashboard.pending_transactions
                                    }
                                </p>
                            </div>
                        </div>

                        {/* =====================================
                            TOTAL PAYMENT
                        ===================================== */}

                        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-[#111827]">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Total Successful Payment
                                Amount
                            </p>

                            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                                ₹
                                {Number(
                                    dashboard.total_payment_amount
                                ).toLocaleString(
                                    "en-IN",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}
                            </p>
                        </div>

                        {/* =====================================
                            MANAGEMENT ACTIONS
                        ===================================== */}

                        <div className="mt-7">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Management
                            </h3>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                Administrative tools for
                                managing the system.
                            </p>

                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                <Link
                                    to="/admin/cards"
                                    className="
                                        group
                                        rounded-2xl
                                        border
                                        border-slate-200
                                        bg-white
                                        p-6
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
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            <CreditCardIcon />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                Card Management
                                            </p>

                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                View, block,
                                                unblock and
                                                manage credit
                                                limits.
                                            </p>
                                        </div>

                                        <span className="ml-auto text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-600">
                                            <ArrowRightIcon />
                                        </span>
                                    </div>
                                </Link>

                                {isAdmin && (
                                <button
                                    type="button"
                                    onClick={
                                        handleExport
                                    }
                                    className="
                                        group
                                        flex
                                        items-center
                                        gap-4
                                        rounded-2xl
                                        border
                                        border-slate-200
                                        bg-white
                                        p-6
                                        text-left
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
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <DownloadIcon />
                                    </div>

                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            Transaction Export
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            Download all
                                            transactions
                                            as CSV.
                                        </p>
                                    </div>
                                </button>
                                )}
                            </div>
                        </div>

                        {/* =====================================
                            SYSTEM HEALTH
                        ===================================== */}

                        <SystemHealthPanel />

                        {/* =====================================
                            FRAUD DETECTION
                        ===================================== */}

                        <FraudLogPanel
                            canReview={canReviewFraud}
                        />

                        {/* =====================================
                            DAILY SUMMARY
                        ===================================== */}

                        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-[#111827]">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Daily Payment Summary
                                </h3>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    {
                                        dashboard
                                            .daily_summary
                                            .date
                                    }
                                </p>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-3">
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-900/60">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Successful Payments
                                    </p>

                                    <p className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {
                                            dashboard
                                                .daily_summary
                                                .successful_payments
                                        }
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-900/60">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Failed Payments
                                    </p>

                                    <p className="mt-3 text-2xl font-bold text-red-600 dark:text-red-400">
                                        {
                                            dashboard
                                                .daily_summary
                                                .failed_payments
                                        }
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700/50 dark:bg-slate-900/60">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        Successful Amount
                                    </p>

                                    <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                                        ₹
                                        {Number(
                                            dashboard
                                                .daily_summary
                                                .successful_amount
                                        ).toLocaleString(
                                            "en-IN",
                                            {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            }
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
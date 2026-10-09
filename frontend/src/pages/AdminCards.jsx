import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

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

function ArrowLeftIcon({ size = 16 }) {
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
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
        </svg>
    );
}

function ShieldIcon({ size = 19 }) {
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
            <path d="M12 3 20 6v5c0 5-3.4 8.7-8 10-4.6-1.3-8-5-8-10V6l8-3Z" />
        </svg>
    );
}

function ActivityIcon({ size = 18 }) {
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
            <path d="m7 15 3-4 3 2 4-6" />
        </svg>
    );
}

function LockIcon({ size = 17 }) {
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
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
            />

            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString(
        "en-IN",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    )}`;
}

function formatDateTime(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

/* =========================================================
   STATUS
========================================================= */

function CardStatus({ blocked }) {
    if (blocked) {
        return (
            <span
                className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    border-red-500/20
                    bg-red-500/10
                    px-3
                    py-1
                    text-xs
                    font-bold
                    text-red-500
                "
            >
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                BLOCKED
            </span>
        );
    }

    return (
        <span
            className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                border
                border-emerald-500/20
                bg-emerald-500/10
                px-3
                py-1
                text-xs
                font-bold
                text-emerald-500
            "
        >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            ACTIVE
        </span>
    );
}

function TransactionStatus({ status }) {
    const normalized =
        String(status || "").toUpperCase();

    if (normalized === "SUCCESS") {
        return (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-500">
                SUCCESS
            </span>
        );
    }

    if (normalized === "FAILED") {
        return (
            <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-500">
                FAILED
            </span>
        );
    }

    return (
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-500">
            PENDING
        </span>
    );
}

/* =========================================================
   ADMIN CARDS
========================================================= */

export default function AdminCards() {
    const [cards, setCards] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [updatingId, setUpdatingId] =
        useState(null);

    const [editingLimit, setEditingLimit] =
        useState({});

    const [activityCard, setActivityCard] =
        useState(null);

    /* =====================================================
       LOAD
    ===================================================== */

    const loadCards = async () => {
        try {
            setError("");

            const response = await api.get(
                "/admin/cards/"
            );

            setCards(response.data);
        } catch (err) {
            console.error(
                "Admin cards error:",
                err
            );

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                setError(
                    "Admin access is required to manage cards."
                );
            } else {
                setError(
                    "Unable to load card management data."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCards();
    }, []);

    /* =====================================================
       UPDATE
    ===================================================== */

    const updateCard = async (
        cardId,
        payload
    ) => {
        try {
            setUpdatingId(cardId);
            setError("");

            const response = await api.patch(
                `/admin/cards/${cardId}/`,
                payload
            );

            setCards((currentCards) =>
                currentCards.map((card) =>
                    card.id === cardId
                        ? {
                            ...card,
                            ...response.data,
                        }
                        : card
                )
            );

            setEditingLimit((current) => ({
                ...current,
                [cardId]: "",
            }));
        } catch (err) {
            console.error(
                "Card update error:",
                err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to update card."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    /* =====================================================
       CREDIT LIMIT
    ===================================================== */

    const handleLimitUpdate = (card) => {
        const value =
            editingLimit[card.id];

        if (!value) {
            setError(
                "Enter a credit limit first."
            );

            return;
        }

        const numericValue =
            Number(value);

        if (
            Number.isNaN(numericValue) ||
            numericValue <= 0
        ) {
            setError(
                "Credit limit must be a positive number."
            );

            return;
        }

        updateCard(card.id, {
            credit_limit: numericValue,
        });
    };

    /* =====================================================
       COUNTS
    ===================================================== */

    const activeCards = cards.filter(
        (card) => !card.is_blocked
    ).length;

    const blockedCards = cards.filter(
        (card) => card.is_blocked
    ).length;

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
                    <Link
                        to="/admin"
                        className="flex items-center gap-3"
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
                            "
                        >
                            <CreditCardIcon />
                        </div>

                        <div>
                            <h1 className="font-bold text-slate-900 dark:text-white">
                                Card Management
                            </h1>

                            <p className="text-xs text-slate-400">
                                CreditPay Admin
                            </p>
                        </div>
                    </Link>

                    <Link
                        to="/admin"
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            px-3
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
                        <ArrowLeftIcon />
                        Admin Dashboard
                    </Link>
                </div>
            </header>

            {/* =============================================
                MAIN
            ============================================= */}

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
                {/* Page heading */}

                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                        Administration
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        Card Management
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                        View all customer cards, manage
                        credit limits, control card status
                        and monitor card activity.
                    </p>
                </div>

                {/* =============================================
                    SUMMARY
                ============================================= */}

                <div className="mt-8 grid gap-5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-[#111827]">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Total Cards
                        </p>

                        <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                            {cards.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-white p-5 shadow-sm dark:bg-[#111827]">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Active Cards
                        </p>

                        <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                            {activeCards}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-white p-5 shadow-sm dark:bg-[#111827]">
                        <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                            Blocked Cards
                        </p>

                        <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                            {blockedCards}
                        </p>
                    </div>
                </div>

                {/* =============================================
                    ERROR
                ============================================= */}

                {error && (
                    <div
                        className="
                            mt-6
                            rounded-2xl
                            border
                            border-red-500/20
                            bg-red-500/10
                            px-5
                            py-4
                            text-sm
                            font-medium
                            text-red-500
                        "
                    >
                        {error}
                    </div>
                )}

                {/* =============================================
                    LOADING
                ============================================= */}

                {loading ? (
                    <div className="mt-7 space-y-4">
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={item}
                                    className="
                                        h-56
                                        animate-pulse
                                        rounded-2xl
                                        bg-white
                                        dark:bg-[#111827]
                                    "
                                />
                            )
                        )}
                    </div>
                ) : cards.length === 0 ? (
                    /* =========================================
                       EMPTY
                    ========================================= */

                    <div
                        className="
                            mt-7
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            px-6
                            py-20
                            text-center
                            dark:border-slate-700/60
                            dark:bg-[#111827]
                        "
                    >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                            <ShieldIcon size={30} />
                        </div>

                        <p className="mt-5 font-semibold text-slate-900 dark:text-white">
                            No cards found
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            There are currently no cards
                            registered in the system.
                        </p>
                    </div>
                ) : (
                    /* =========================================
                       CARDS
                    ========================================= */

                    <div className="mt-7 space-y-5">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className="
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
                                {/* Card header */}

                                <div className="border-b border-slate-100 p-5 dark:border-slate-700/60 sm:p-6">
                                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                                <CreditCardIcon />
                                            </div>

                                            <div>
                                                <p className="font-mono text-base font-bold text-slate-900 dark:text-white">
                                                    {
                                                        card.masked_card_number
                                                    }
                                                </p>

                                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                    Card #{card.id}
                                                </p>
                                            </div>
                                        </div>

                                        <CardStatus
                                            blocked={
                                                card.is_blocked
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Details */}

                                <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Card Holder
                                        </p>

                                        <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">
                                            {
                                                card.card_holder_name
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Account
                                        </p>

                                        <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">
                                            {
                                                card.username
                                            }
                                        </p>

                                        <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-500">
                                            {
                                                card.email
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Card Type
                                        </p>

                                        <p className="mt-2 font-semibold text-slate-800 dark:text-slate-200">
                                            {
                                                card.card_type
                                            }
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            Expires{" "}
                                            {String(
                                                card.expiry_month
                                            ).padStart(
                                                2,
                                                "0"
                                            )}
                                            /
                                            {
                                                card.expiry_year
                                            }
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            Credit Limit
                                        </p>

                                        <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(
                                                card.credit_limit
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Controls */}

                                <div className="border-t border-slate-100 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-900/40 sm:p-6">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        {/* Block */}

                                        <button
                                            type="button"
                                            disabled={
                                                updatingId ===
                                                card.id
                                            }
                                            onClick={() =>
                                                updateCard(
                                                    card.id,
                                                    {
                                                        is_blocked:
                                                            !card.is_blocked,
                                                    }
                                                )
                                            }
                                            className={
                                                card.is_blocked
                                                    ? `
                                                        inline-flex
                                                        items-center
                                                        justify-center
                                                        gap-2
                                                        rounded-xl
                                                        border
                                                        border-emerald-500/25
                                                        bg-emerald-500/10
                                                        px-4
                                                        py-2.5
                                                        text-sm
                                                        font-bold
                                                        text-emerald-600
                                                        transition
                                                        hover:bg-emerald-500/15
                                                        dark:text-emerald-400
                                                    `
                                                    : `
                                                        inline-flex
                                                        items-center
                                                        justify-center
                                                        gap-2
                                                        rounded-xl
                                                        border
                                                        border-red-500/25
                                                        bg-red-500/10
                                                        px-4
                                                        py-2.5
                                                        text-sm
                                                        font-bold
                                                        text-red-600
                                                        transition
                                                        hover:bg-red-500/15
                                                        dark:text-red-400
                                                    `
                                            }
                                        >
                                            <LockIcon />

                                            {updatingId ===
                                                card.id
                                                ? "Updating..."
                                                : card.is_blocked
                                                    ? "Unblock Card"
                                                    : "Block Card"}
                                        </button>

                                        {/* Other controls */}

                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <input
                                                type="number"
                                                min="1"
                                                placeholder="New credit limit"
                                                value={
                                                    editingLimit[
                                                    card.id
                                                    ] ||
                                                    ""
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    setEditingLimit(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,
                                                            [card.id]:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                                }
                                                className="
                                                    w-full
                                                    rounded-xl
                                                    border
                                                    border-slate-300
                                                    bg-white
                                                    px-4
                                                    py-2.5
                                                    text-sm
                                                    text-slate-800
                                                    outline-none
                                                    focus:border-blue-500
                                                    focus:ring-4
                                                    focus:ring-blue-500/10
                                                    dark:border-slate-600
                                                    dark:bg-[#0d1627]
                                                    dark:text-white
                                                    sm:w-52
                                                "
                                            />

                                            <button
                                                type="button"
                                                disabled={
                                                    updatingId ===
                                                    card.id
                                                }
                                                onClick={() =>
                                                    handleLimitUpdate(
                                                        card
                                                    )
                                                }
                                                className="
                                                    rounded-xl
                                                    bg-blue-600
                                                    px-4
                                                    py-2.5
                                                    text-sm
                                                    font-bold
                                                    text-white
                                                    transition
                                                    hover:bg-blue-700
                                                    disabled:opacity-60
                                                "
                                            >
                                                Update Limit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActivityCard(
                                                        card
                                                    )
                                                }
                                                className="
                                                    inline-flex
                                                    items-center
                                                    justify-center
                                                    gap-2
                                                    rounded-xl
                                                    border
                                                    border-slate-300
                                                    px-4
                                                    py-2.5
                                                    text-sm
                                                    font-bold
                                                    text-slate-700
                                                    transition
                                                    hover:bg-white
                                                    dark:border-slate-600
                                                    dark:text-slate-300
                                                    dark:hover:bg-slate-800
                                                "
                                            >
                                                <ActivityIcon />
                                                Activity
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* =============================================
                ACTIVITY MODAL
            ============================================= */}

            {activityCard && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[100]
                        flex
                        items-center
                        justify-center
                        bg-slate-950/75
                        p-5
                        backdrop-blur-sm
                    "
                    onClick={() =>
                        setActivityCard(null)
                    }
                >
                    <div
                        className="
                            max-h-[85vh]
                            w-full
                            max-w-2xl
                            overflow-y-auto
                            rounded-2xl
                            border
                            border-slate-700
                            bg-[#111827]
                            p-6
                            shadow-2xl
                        "
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                    Card Activity
                                </p>

                                <h3 className="mt-2 font-mono text-lg font-bold text-white">
                                    {
                                        activityCard.masked_card_number
                                    }
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    {
                                        activityCard.username
                                    }{" "}
                                    •{" "}
                                    {
                                        activityCard.email
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setActivityCard(
                                        null
                                    )
                                }
                                className="
                                    rounded-lg
                                    px-3
                                    py-2
                                    text-slate-400
                                    transition
                                    hover:bg-slate-800
                                    hover:text-white
                                "
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-6 divide-y divide-slate-700/60">
                            {activityCard.activity?.length ? (
                                activityCard.activity.map(
                                    (transaction) => (
                                        <div
                                            key={
                                                transaction.id
                                            }
                                            className="
                                                flex
                                                items-center
                                                justify-between
                                                gap-4
                                                py-4
                                            "
                                        >
                                            <div>
                                                <p className="font-bold text-white">
                                                    {formatCurrency(
                                                        transaction.amount
                                                    )}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Payment #
                                                    {
                                                        transaction.payment_id
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatDateTime(
                                                        transaction.created_at
                                                    )}
                                                </p>
                                            </div>

                                            <TransactionStatus
                                                status={
                                                    transaction.status
                                                }
                                            />
                                        </div>
                                    )
                                )
                            ) : (
                                <div className="py-10 text-center">
                                    <ActivityIcon
                                        size={28}
                                    />

                                    <p className="mt-3 text-sm text-slate-500">
                                        No recent activity.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
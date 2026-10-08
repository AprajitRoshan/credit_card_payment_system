import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function CreditCardIcon({ size = 22 }) {
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

function PlusIcon({ size = 18 }) {
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

function TrashIcon({ size = 17 }) {
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
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 15H6L5 6" />
        </svg>
    );
}

function EmptyCardIcon() {
    return (
        <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
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

export default function Cards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState(null);

    const loadCards = async () => {
        try {
            setError("");

            const response = await api.get("/cards/");

            setCards(response.data);
        } catch (err) {
            console.error(
                "Error loading cards:",
                err
            );

            setError(
                "Unable to load your cards."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCards();
    }, []);

    const handleDelete = async (cardId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this card?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setDeletingId(cardId);

            await api.delete(
                `/cards/${cardId}/`
            );

            setCards((currentCards) =>
                currentCards.filter(
                    (card) =>
                        card.id !== cardId
                )
            );
        } catch (err) {
            console.error(
                "Error deleting card:",
                err
            );

            setError(
                "Unable to delete the card."
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f7fb] dark:bg-[#080f1d]">
            {/* =================================================
                NAVIGATION
            ================================================= */}

            <nav
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
                        to="/dashboard"
                        className="
                            flex
                            items-center
                            gap-3
                            text-lg
                            font-bold
                            tracking-tight
                            text-slate-900
                            transition
                            hover:text-blue-600
                            dark:text-white
                            dark:hover:text-blue-400
                        "
                    >
                        <div
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-600
                                text-white
                                shadow-md
                                shadow-blue-600/20
                            "
                        >
                            <CreditCardIcon size={18} />
                        </div>

                        <span>CreditPay</span>
                    </Link>

                    <Link
                        to="/dashboard"
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
                        <ArrowLeftIcon size={15} />
                        Dashboard
                    </Link>
                </div>
            </nav>

            {/* =================================================
                MAIN
            ================================================= */}

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
                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <section
                    className="
                        flex
                        flex-col
                        gap-6
                        sm:flex-row
                        sm:items-end
                        sm:justify-between
                    "
                >
                    <div>
                        <div className="mb-3 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                                Card Management
                            </p>
                        </div>

                        <h1
                            className="
                                text-3xl
                                font-bold
                                tracking-tight
                                text-slate-900
                                dark:text-white
                                sm:text-4xl
                            "
                        >
                            My Cards
                        </h1>

                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                            Manage your saved credit and
                            debit cards securely.
                        </p>
                    </div>

                    <Link
                        to="/cards/add"
                        className="
                            group
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
                        "
                    >
                        <PlusIcon
                            size={17}
                        />

                        Add Card
                    </Link>
                </section>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div
                        className="
                            mt-7
                            flex
                            items-center
                            gap-3
                            rounded-2xl
                            border
                            border-red-200
                            bg-red-50
                            px-5
                            py-4
                            text-sm
                            font-medium
                            text-red-700
                            dark:border-red-500/25
                            dark:bg-red-500/10
                            dark:text-red-400
                        "
                    >
                        <span
                            className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-red-100
                                font-bold
                                dark:bg-red-500/15
                            "
                        >
                            !
                        </span>

                        {error}
                    </div>
                )}

                {/* =================================================
                    LOADING
                ================================================= */}

                {loading ? (
                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        {[1, 2].map((item) => (
                            <div
                                key={item}
                                className="
                                    h-[390px]
                                    animate-pulse
                                    rounded-3xl
                                    border
                                    border-slate-200
                                    bg-white
                                    shadow-sm
                                    dark:border-slate-700/60
                                    dark:bg-[#111827]
                                "
                            />
                        ))}
                    </div>
                ) : cards.length === 0 ? (
                    /* =================================================
                       EMPTY STATE
                    ================================================= */

                    <div
                        className="
                            mt-8
                            rounded-3xl
                            border
                            border-slate-200
                            bg-white
                            px-6
                            py-20
                            text-center
                            shadow-sm
                            dark:border-slate-700/60
                            dark:bg-[#111827]
                        "
                    >
                        <div
                            className="
                                mx-auto
                                flex
                                h-20
                                w-20
                                items-center
                                justify-center
                                rounded-2xl
                                bg-blue-500/10
                                text-blue-600
                                dark:text-blue-400
                            "
                        >
                            <EmptyCardIcon />
                        </div>

                        <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
                            No saved cards
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Add your first credit or
                            debit card to start making
                            payments.
                        </p>

                        <Link
                            to="/cards/add"
                            className="
                                mt-7
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-5
                                py-3
                                text-sm
                                font-bold
                                text-white
                                transition
                                hover:bg-blue-700
                                hover:shadow-lg
                            "
                        >
                            <PlusIcon size={17} />
                            Add Your First Card
                        </Link>
                    </div>
                ) : (
                    /* =================================================
                       CARDS
                    ================================================= */

                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className="
                                    group
                                    overflow-hidden
                                    rounded-3xl
                                    border
                                    border-slate-200
                                    bg-white
                                    shadow-sm
                                    transition-all
                                    duration-300
                                    hover:-translate-y-1
                                    hover:shadow-xl
                                    dark:border-slate-700/60
                                    dark:bg-[#111827]
                                "
                            >
                                {/* =================================
                                    VISUAL CARD
                                ================================= */}

                                <div
                                    className={`
                                        relative
                                        min-h-[250px]
                                        overflow-hidden
                                        p-7
                                        text-white
                                        ${card.card_type ===
                                            "CREDIT"
                                            ? "bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800"
                                            : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950"
                                        }
                                    `}
                                >
                                    {/* Decorative glow */}

                                    <div
                                        className="
                                            pointer-events-none
                                            absolute
                                            -right-16
                                            -top-16
                                            h-44
                                            w-44
                                            rounded-full
                                            bg-white/10
                                            blur-sm
                                        "
                                    />

                                    <div
                                        className="
                                            pointer-events-none
                                            absolute
                                            -bottom-24
                                            right-16
                                            h-48
                                            w-48
                                            rounded-full
                                            bg-white/5
                                            blur-sm
                                        "
                                    />

                                    <div className="relative">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                                                    {card.card_type}
                                                </p>

                                                <p className="mt-1 text-sm font-medium text-white/80">
                                                    PAYMENT CARD
                                                </p>
                                            </div>

                                            <div
                                                className="
                                                    flex
                                                    h-10
                                                    w-13
                                                    items-center
                                                    justify-center
                                                    rounded-lg
                                                    border
                                                    border-white/15
                                                    bg-white/10
                                                    backdrop-blur-sm
                                                "
                                            >
                                                <div className="h-5 w-7 rounded-md border border-white/50 bg-white/10" />
                                            </div>
                                        </div>

                                        <p className="mt-12 font-mono text-xl tracking-[0.16em] sm:text-2xl">
                                            {
                                                card.masked_card_number
                                            }
                                        </p>

                                        <div className="mt-9 flex items-end justify-between">
                                            <div>
                                                <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">
                                                    Card Holder
                                                </p>

                                                <p className="mt-1 text-sm font-semibold uppercase tracking-wide">
                                                    {
                                                        card.card_holder_name
                                                    }
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">
                                                    Expires
                                                </p>

                                                <p className="mt-1 text-sm font-semibold">
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
                                        </div>
                                    </div>
                                </div>

                                {/* =================================
                                    DETAILS
                                ================================= */}

                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            className="
                                                rounded-xl
                                                border
                                                border-slate-100
                                                bg-slate-50
                                                p-4
                                                dark:border-slate-700/50
                                                dark:bg-slate-900/60
                                            "
                                        >
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                Card Number
                                            </p>

                                            <p className="mt-2 truncate font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                {
                                                    card.masked_card_number
                                                }
                                            </p>
                                        </div>

                                        <div
                                            className="
                                                rounded-xl
                                                border
                                                border-slate-100
                                                bg-slate-50
                                                p-4
                                                dark:border-slate-700/50
                                                dark:bg-slate-900/60
                                            "
                                        >
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                Card Type
                                            </p>

                                            <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                {card.card_type ===
                                                    "CREDIT"
                                                    ? "Credit Card"
                                                    : "Debit Card"}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            handleDelete(
                                                card.id
                                            )
                                        }
                                        disabled={
                                            deletingId ===
                                            card.id
                                        }
                                        className="
                                            mt-5
                                            flex
                                            w-full
                                            items-center
                                            justify-center
                                            gap-2
                                            rounded-xl
                                            border
                                            border-red-200
                                            bg-red-50
                                            py-3
                                            text-sm
                                            font-bold
                                            text-red-600
                                            transition-all
                                            duration-200
                                            hover:border-red-300
                                            hover:bg-red-100
                                            hover:text-red-700
                                            disabled:cursor-not-allowed
                                            disabled:opacity-60
                                            dark:border-red-500/25
                                            dark:bg-red-500/10
                                            dark:text-red-400
                                            dark:hover:border-red-500/40
                                            dark:hover:bg-red-500/15
                                            dark:hover:text-red-300
                                        "
                                    >
                                        {deletingId ===
                                            card.id ? (
                                            <>
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600 dark:border-red-500/30 dark:border-t-red-400" />
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <TrashIcon />
                                                Delete Card
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* =================================================
                    CARD COUNT
                ================================================= */}

                {cards.length > 0 &&
                    !loading && (
                        <p className="mt-6 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                            {cards.length} saved{" "}
                            {cards.length === 1
                                ? "card"
                                : "cards"}
                        </p>
                    )}
            </main>
        </div>
    );
}
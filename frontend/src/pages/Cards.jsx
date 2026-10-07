import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

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
            console.error("Error loading cards:", err);
            setError("Unable to load your cards.");
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

            await api.delete(`/cards/${cardId}/`);

            setCards((currentCards) =>
                currentCards.filter((card) => card.id !== cardId)
            );
        } catch (err) {
            console.error("Error deleting card:", err);
            setError("Unable to delete the card.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Navbar */}
            <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
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

            <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
                {/* Header */}
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-600">
                            <span className="h-2 w-2 rounded-full bg-blue-600" />
                            CARD MANAGEMENT
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                            My Cards
                        </h2>

                        <p className="mt-2 text-slate-500">
                            Manage your saved credit and debit cards securely.
                        </p>
                    </div>

                    <Link
                        to="/cards/add"
                        className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                    >
                        <span className="text-lg transition-transform group-hover:rotate-90">
                            +
                        </span>
                        Add Card
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
                            !
                        </span>
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {[1, 2].map((item) => (
                            <div
                                key={item}
                                className="h-72 animate-pulse rounded-3xl bg-white shadow-sm"
                            />
                        ))}
                    </div>
                ) : cards.length === 0 ? (
                    /* Empty state */
                    <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                            <svg
                                width="38"
                                height="38"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                            >
                                <rect x="3" y="5" width="18" height="14" rx="2" />
                                <path d="M3 10h18" />
                                <path d="M7 15h4" />
                            </svg>
                        </div>

                        <h3 className="mt-6 text-xl font-bold text-slate-900">
                            No saved cards
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-slate-500">
                            Add your first credit or debit card to start making
                            payments.
                        </p>

                        <Link
                            to="/cards/add"
                            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                        >
                            Add Your First Card
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2">
                        {cards.map((card, index) => (
                            <div
                                key={card.id}
                                className="group overflow-hidden rounded-3xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                            >
                                {/* Visual Card */}
                                <div
                                    className={`relative overflow-hidden p-6 text-white ${card.card_type === "CREDIT"
                                            ? "bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700"
                                            : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950"
                                        }`}
                                >
                                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10" />
                                    <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-white/5" />

                                    <div className="relative">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-bold tracking-[0.2em] text-white/70">
                                                    {card.card_type}
                                                </p>

                                                <p className="mt-1 text-sm font-medium text-white/80">
                                                    PAYMENT CARD
                                                </p>
                                            </div>

                                            <div className="flex h-9 w-12 items-center justify-center rounded-lg bg-white/15">
                                                <div className="h-5 w-7 rounded-md border border-white/50" />
                                            </div>
                                        </div>

                                        <p className="mt-9 font-mono text-xl tracking-[0.16em] sm:text-2xl">
                                            {card.masked_card_number}
                                        </p>

                                        <div className="mt-6 flex items-end justify-between">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-white/60">
                                                    Card Holder
                                                </p>

                                                <p className="mt-1 text-sm font-semibold uppercase">
                                                    {card.card_holder_name}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest text-white/60">
                                                    Expires
                                                </p>

                                                <p className="mt-1 text-sm font-semibold">
                                                    {String(card.expiry_month).padStart(
                                                        2,
                                                        "0"
                                                    )}
                                                    /{card.expiry_year}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Details */}
                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-xs font-medium text-slate-500">
                                                Card Number
                                            </p>

                                            <p className="mt-1 truncate font-mono text-sm font-semibold text-slate-800">
                                                {card.masked_card_number}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-4">
                                            <p className="text-xs font-medium text-slate-500">
                                                Card Type
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                                {card.card_type === "CREDIT"
                                                    ? "Credit Card"
                                                    : "Debit Card"}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDelete(card.id)}
                                        disabled={deletingId === card.id}
                                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {deletingId === card.id ? (
                                            "Deleting..."
                                        ) : (
                                            <>
                                                <svg
                                                    width="17"
                                                    height="17"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                >
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M19 6l-1 15H6L5 6" />
                                                </svg>
                                                Delete Card
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {cards.length > 0 && !loading && (
                    <p className="mt-6 text-center text-sm text-slate-400">
                        {cards.length} saved {cards.length === 1 ? "card" : "cards"}
                    </p>
                )}
            </main>
        </div>
    );
}
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const paymentApi = "http://127.0.0.1:8001/api";

const CATEGORIES = [
    "SHOPPING",
    "FOOD",
    "TRAVEL",
    "BILLS",
    "ENTERTAINMENT",
    "OTHER",
];

/* =========================================================
   FRAUD SIGNALS

   A random device id is kept per browser, and the browser
   time zone is used as a coarse location. The FastAPI fraud
   service flags rapid payments from different devices or
   locations.
========================================================= */

function getDeviceId() {
    try {
        let deviceId = localStorage.getItem("device_id");

        if (!deviceId) {
            deviceId =
                window.crypto?.randomUUID?.() ||
                `${Date.now()}-${Math.random().toString(36).slice(2)}`;

            localStorage.setItem("device_id", deviceId);
        }

        return deviceId;
    } catch {
        return null;
    }
}

function getLocationId() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch {
        return null;
    }
}

function errorDetail(data, fallback) {
    if (!data) return fallback;

    if (typeof data.detail === "string") return data.detail;

    if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        return data.detail[0].msg;
    }

    return fallback;
}

export default function Payment() {
    const [user, setUser] = useState(null);
    const [cards, setCards] = useState([]);
    const [cardId, setCardId] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("OTHER");
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setError("");

                const userResponse = await api.get("/auth/me/");
                setUser(userResponse.data);

                const cardsResponse = await api.get("/cards/");
                setCards(cardsResponse.data);

                const usableCard = cardsResponse.data.find(
                    (card) => !card.is_blocked
                );

                if (usableCard) {
                    setCardId(String(usableCard.id));
                }
            } catch (err) {
                console.error(err);
                setError("Unable to load payment information.");
            }
        };

        loadData();
    }, []);

    const selectedCard = cards.find(
        (card) => String(card.id) === String(cardId)
    );

    const createPayment = async (event) => {
        event.preventDefault();
        setError("");
        setPayment(null);

        if (!cardId) {
            setError("Please select a card.");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            setError("Please enter a valid payment amount.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(
                `${paymentApi}/payments/?user_id=${user.id}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        card_id: Number(cardId),
                        amount: Number(amount),
                        currency: "INR",
                        category,
                        device_id: getDeviceId(),
                        location_id: getLocationId(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    errorDetail(data, "Payment creation failed.")
                );
            }

            setPayment(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to create payment.");
        } finally {
            setLoading(false);
        }
    };

    const processPayment = async () => {
        if (!payment?.id) return;

        setError("");
        setProcessing(true);

        try {
            const response = await fetch(
                `${paymentApi}/payments/${payment.id}/process`,
                {
                    method: "POST",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    errorDetail(data, "Payment processing failed.")
                );
            }

            setPayment(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "Unable to process payment.");
        } finally {
            setProcessing(false);
        }
    };

    const resetPayment = () => {
        setPayment(null);
        setAmount("");
        setError("");
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

            <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
                <div className="mb-8">
                    <p className="text-sm font-bold tracking-widest text-blue-600">
                        SECURE PAYMENT
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                        Make Payment
                    </h2>

                    <p className="mt-2 text-slate-500">
                        Pay securely using one of your saved cards.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {!payment ? (
                    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
                        {/* Card preview */}
                        <section>
                            <div
                                className={`relative overflow-hidden rounded-3xl p-7 text-white shadow-2xl transition-all duration-500 ${selectedCard?.card_type === "DEBIT"
                                        ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950"
                                        : "bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700"
                                    }`}
                            >
                                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
                                <div className="absolute -bottom-20 left-20 h-48 w-48 rounded-full bg-white/5" />

                                <div className="relative">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-xs font-bold tracking-[0.25em] text-white/70">
                                                {selectedCard?.card_type ||
                                                    "CREDIT"}
                                            </p>

                                            <p className="mt-1 text-sm text-white/70">
                                                PAYMENT CARD
                                            </p>
                                        </div>

                                        <div className="h-10 w-14 rounded-lg border border-white/30 bg-white/10 p-2">
                                            <div className="h-full rounded bg-white/20" />
                                        </div>
                                    </div>

                                    <p className="mt-12 font-mono text-xl tracking-[0.13em] sm:text-2xl">
                                        {selectedCard
                                            ? selectedCard.masked_card_number
                                            : "•••• •••• •••• ••••"}
                                    </p>

                                    <div className="mt-10 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-white/60">
                                                Card Holder
                                            </p>

                                            <p className="mt-1 max-w-[180px] truncate text-sm font-semibold uppercase">
                                                {selectedCard?.card_holder_name ||
                                                    "YOUR NAME"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest text-white/60">
                                                Expires
                                            </p>

                                            <p className="mt-1 text-sm font-semibold">
                                                {selectedCard
                                                    ? `${String(
                                                        selectedCard.expiry_month
                                                    ).padStart(2, "0")}/${selectedCard.expiry_year
                                                    }`
                                                    : "MM/YYYY"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            Payment amount
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-slate-900">
                                            ₹
                                            {amount
                                                ? Number(amount).toLocaleString(
                                                    "en-IN"
                                                )
                                                : "0"}
                                        </p>
                                    </div>

                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        ₹
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Payment form */}
                        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
                            <div className="mb-7">
                                <h3 className="text-xl font-bold text-slate-900">
                                    Payment Details
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Select your card and enter the payment
                                    amount.
                                </p>
                            </div>

                            {cards.length === 0 ? (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                                    <p className="font-semibold text-amber-900">
                                        No saved cards
                                    </p>

                                    <p className="mt-1 text-sm text-amber-700">
                                        Add a card before making a payment.
                                    </p>

                                    <Link
                                        to="/cards/add"
                                        className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700"
                                    >
                                        Add Card
                                    </Link>
                                </div>
                            ) : (
                                <form
                                    onSubmit={createPayment}
                                    className="space-y-6"
                                >
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Select Card
                                        </label>

                                        <select
                                            value={cardId}
                                            onChange={(e) =>
                                                setCardId(e.target.value)
                                            }
                                            required
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        >
                                            <option value="">
                                                Select a card
                                            </option>

                                            {cards.map((card) => (
                                                <option
                                                    key={card.id}
                                                    value={card.id}
                                                    disabled={card.is_blocked}
                                                >
                                                    {card.card_type} - ****{" "}
                                                    {card.last_four_digits}
                                                    {card.is_blocked ? " (blocked)" : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Payment Amount
                                        </label>

                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-slate-400">
                                                ₹
                                            </span>

                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                value={amount}
                                                onChange={(e) =>
                                                    setAmount(e.target.value)
                                                }
                                                placeholder="Enter amount"
                                                required
                                                className="w-full rounded-xl border border-slate-300 py-4 pl-10 pr-4 text-lg font-semibold outline-none transition placeholder:text-base placeholder:font-normal focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Category
                                        </label>

                                        <select
                                            value={category}
                                            onChange={(e) =>
                                                setCategory(e.target.value)
                                            }
                                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                        >
                                            {CATEGORIES.map((item) => (
                                                <option key={item} value={item}>
                                                    {item.charAt(0) +
                                                        item.slice(1).toLowerCase()}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                                ✓
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Secure payment
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    Your card details remain
                                                    protected.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || cards.length === 0}
                                        className="w-full rounded-xl bg-blue-600 py-4 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading
                                            ? "Creating Payment..."
                                            : "Continue Payment"}
                                    </button>
                                </form>
                            )}
                        </section>
                    </div>
                ) : (
                    /* Payment result */
                    <div className="mx-auto max-w-2xl">
                        <div className="overflow-hidden rounded-3xl bg-white shadow-xl">
                            <div
                                className={`px-6 py-8 text-center ${payment.status === "SUCCESS"
                                        ? "bg-emerald-50"
                                        : payment.status === "FAILED"
                                            ? "bg-red-50"
                                            : "bg-amber-50"
                                    }`}
                            >
                                <div
                                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl ${payment.status === "SUCCESS"
                                            ? "bg-emerald-100 text-emerald-600"
                                            : payment.status === "FAILED"
                                                ? "bg-red-100 text-red-600"
                                                : "bg-amber-100 text-amber-600"
                                        }`}
                                >
                                    {payment.status === "SUCCESS"
                                        ? "✓"
                                        : payment.status === "FAILED"
                                            ? "!"
                                            : "…"}
                                </div>

                                <h3 className="mt-4 text-2xl font-bold text-slate-900">
                                    {payment.status === "PENDING"
                                        ? "Payment Created"
                                        : `Payment ${payment.status}`}
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Payment ID #{payment.id}
                                </p>
                            </div>

                            <div className="p-6 sm:p-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between border-b border-slate-100 pb-4">
                                        <span className="text-slate-500">
                                            Payment ID
                                        </span>

                                        <span className="font-semibold text-slate-900">
                                            #{payment.id}
                                        </span>
                                    </div>

                                    <div className="flex justify-between border-b border-slate-100 pb-4">
                                        <span className="text-slate-500">
                                            Amount
                                        </span>

                                        <span className="text-lg font-bold text-slate-900">
                                            ₹{payment.amount}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-500">
                                            Status
                                        </span>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold ${payment.status === "SUCCESS"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : payment.status ===
                                                        "FAILED"
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            {payment.status}
                                        </span>
                                    </div>
                                </div>

                                {payment.fraud_status === "FLAGGED" && (
                                    <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                        <p className="font-semibold">
                                            ! This payment was flagged for review
                                        </p>

                                        <p className="mt-1 text-amber-700">
                                            Our fraud checks noticed unusual
                                            activity. A security alert has
                                            been emailed to you.
                                        </p>
                                    </div>
                                )}

                                {payment.status === "PENDING" && (
                                    <button
                                        onClick={processPayment}
                                        disabled={processing}
                                        className="mt-7 w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processing
                                            ? "Processing..."
                                            : "Process Payment"}
                                    </button>
                                )}

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                    <button
                                        onClick={resetPayment}
                                        className="flex-1 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                                    >
                                        Make Another Payment
                                    </button>

                                    <Link
                                        to="/transactions"
                                        className="flex-1 rounded-xl bg-blue-600 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
                                    >
                                        View Transactions
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
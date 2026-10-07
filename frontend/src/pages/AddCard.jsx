import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function AddCard() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        card_type: "CREDIT",
        card_holder_name: "",
        card_number: "",
        expiry_month: "",
        expiry_year: "",
        cvv: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleCardNumberChange = (event) => {
        const value = event.target.value.replace(/\D/g, "").slice(0, 19);

        setFormData((current) => ({
            ...current,
            card_number: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.post("/cards/", {
                card_type: formData.card_type,
                card_holder_name: formData.card_holder_name,
                card_number: formData.card_number,
                expiry_month: Number(formData.expiry_month),
                expiry_year: Number(formData.expiry_year),
                cvv: formData.cvv,
            });

            navigate("/cards");
        } catch (err) {
            console.error("Error adding card:", err);

            const responseData = err.response?.data;

            if (responseData) {
                if (typeof responseData === "string") {
                    setError(responseData);
                } else {
                    setError(
                        Object.entries(responseData)
                            .map(([field, message]) => `${field}: ${message}`)
                            .join(" | ")
                    );
                }
            } else {
                setError("Unable to add card. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const displayNumber = formData.card_number
        ? formData.card_number
            .padEnd(16, "•")
            .replace(/(.{4})/g, "$1 ")
            .trim()
        : "•••• •••• •••• ••••";

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
                        to="/cards"
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                        My Cards
                    </Link>
                </div>
            </nav>

            <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
                <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                    {/* Preview */}
                    <section className="order-2 lg:order-1">
                        <div className="mb-5">
                            <p className="text-sm font-bold tracking-widest text-blue-600">
                                NEW PAYMENT CARD
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-900">
                                Add Card
                            </h2>

                            <p className="mt-2 text-slate-500">
                                Save a card securely for future payments.
                            </p>
                        </div>

                        <div
                            className={`relative overflow-hidden rounded-3xl p-7 text-white shadow-2xl transition-all duration-500 ${formData.card_type === "CREDIT"
                                    ? "bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700"
                                    : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950"
                                }`}
                        >
                            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
                            <div className="absolute -bottom-20 left-20 h-48 w-48 rounded-full bg-white/5" />

                            <div className="relative">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold tracking-[0.25em] text-white/70">
                                            {formData.card_type}
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
                                    {displayNumber}
                                </p>

                                <div className="mt-10 flex items-end justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase tracking-widest text-white/60">
                                            Card Holder
                                        </p>

                                        <p className="mt-1 truncate text-sm font-semibold uppercase">
                                            {formData.card_holder_name ||
                                                "YOUR NAME"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] uppercase tracking-widest text-white/60">
                                            Expires
                                        </p>

                                        <p className="mt-1 text-sm font-semibold">
                                            {formData.expiry_month || "MM"}/
                                            {formData.expiry_year || "YYYY"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                            <div className="flex gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    ✓
                                </div>

                                <div>
                                    <p className="font-semibold text-blue-900">
                                        Your card details are protected
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-blue-700">
                                        Full card numbers and CVV are not stored
                                        by the application.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Form */}
                    <section className="order-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8 lg:order-2">
                        <div className="mb-7">
                            <h3 className="text-xl font-bold text-slate-900">
                                Card Details
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Enter the details below to save your card.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Card Type
                                </label>

                                <select
                                    name="card_type"
                                    value={formData.card_type}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                >
                                    <option value="CREDIT">Credit Card</option>
                                    <option value="DEBIT">Debit Card</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Card Holder Name
                                </label>

                                <input
                                    type="text"
                                    name="card_holder_name"
                                    value={formData.card_holder_name}
                                    onChange={handleChange}
                                    placeholder="Enter card holder name"
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Card Number
                                </label>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    name="card_number"
                                    value={formData.card_number}
                                    onChange={handleCardNumberChange}
                                    placeholder="Enter card number"
                                    maxLength="19"
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono tracking-wide outline-none transition placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Expiry Month
                                    </label>

                                    <input
                                        type="number"
                                        name="expiry_month"
                                        value={formData.expiry_month}
                                        onChange={handleChange}
                                        placeholder="MM"
                                        min="1"
                                        max="12"
                                        required
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        Expiry Year
                                    </label>

                                    <input
                                        type="number"
                                        name="expiry_year"
                                        value={formData.expiry_year}
                                        onChange={handleChange}
                                        placeholder="YYYY"
                                        required
                                        className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    CVV
                                </label>

                                <input
                                    type="password"
                                    inputMode="numeric"
                                    name="cvv"
                                    value={formData.cvv}
                                    onChange={handleChange}
                                    placeholder="Enter CVV"
                                    maxLength="4"
                                    required
                                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    CVV is used only for validation and is never
                                    stored.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-3 sm:flex-row">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Adding Card..." : "Add Card"}
                                </button>

                                <Link
                                    to="/cards"
                                    className="flex-1 rounded-xl border border-slate-300 py-3.5 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}
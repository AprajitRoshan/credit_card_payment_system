import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const paymentApi = "http://127.0.0.1:8001/api";

export default function Payment() {
    const [user, setUser] = useState(null);
    const [cards, setCards] = useState([]);
    const [cardId, setCardId] = useState("");
    const [amount, setAmount] = useState("");
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

                if (cardsResponse.data.length > 0) {
                    setCardId(String(cardsResponse.data[0].id));
                }
            } catch (err) {
                console.error(err);
                setError("Unable to load payment information.");
            }
        };

        loadData();
    }, []);

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
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    typeof data === "object"
                        ? JSON.stringify(data)
                        : "Payment creation failed."
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
                    typeof data === "object"
                        ? JSON.stringify(data)
                        : "Payment processing failed."
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

            <main className="max-w-2xl mx-auto px-6 py-10">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-slate-800">
                        Make Payment
                    </h2>

                    <p className="text-slate-500 mt-2">
                        Make a secure payment using your saved card.
                    </p>

                    {error && (
                        <div className="mt-6 rounded-lg bg-red-100 text-red-700 px-4 py-3">
                            {error}
                        </div>
                    )}

                    {!payment ? (
                        <form onSubmit={createPayment} className="mt-8 space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Select Card
                                </label>

                                <select
                                    value={cardId}
                                    onChange={(e) => setCardId(e.target.value)}
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a card</option>

                                    {cards.map((card) => (
                                        <option key={card.id} value={card.id}>
                                            {card.card_type} - **** {card.last_four_digits}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Payment Amount
                                </label>

                                <div className="relative">
                                    <span className="absolute left-4 top-3 text-slate-500">
                                        ₹
                                    </span>

                                    <input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        required
                                        className="w-full border border-slate-300 rounded-lg pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || cards.length === 0}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? "Creating Payment..." : "Make Payment"}
                            </button>
                        </form>
                    ) : (
                        <div className="mt-8">
                            <div className="rounded-xl border border-slate-200 p-6">
                                <h3 className="text-xl font-bold text-slate-800">
                                    Payment Created
                                </h3>

                                <div className="mt-5 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Payment ID</span>
                                        <span className="font-semibold">
                                            #{payment.id}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Amount</span>
                                        <span className="font-semibold">
                                            ₹{payment.amount}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Status</span>
                                        <span className="font-semibold text-yellow-600">
                                            {payment.status}
                                        </span>
                                    </div>
                                </div>

                                {payment.status === "PENDING" && (
                                    <button
                                        onClick={processPayment}
                                        disabled={processing}
                                        className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {processing ? "Processing..." : "Process Payment"}
                                    </button>
                                )}

                                {(payment.status === "SUCCESS" ||
                                    payment.status === "FAILED") && (
                                        <div
                                            className={`mt-6 rounded-lg px-4 py-4 text-center font-semibold ${payment.status === "SUCCESS"
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-red-100 text-red-700"
                                                }`}
                                        >
                                            Payment {payment.status}
                                        </div>
                                    )}
                            </div>

                            <Link
                                to="/transactions"
                                className="block text-center mt-6 text-blue-600 font-semibold hover:underline"
                            >
                                View Transactions
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
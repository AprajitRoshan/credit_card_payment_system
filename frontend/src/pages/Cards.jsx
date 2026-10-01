import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Cards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

        if (!confirmed) {
            return;
        }

        try {
            setError("");

            await api.delete(`/cards/${cardId}/`);

            setCards((currentCards) =>
                currentCards.filter((card) => card.id !== cardId)
            );
        } catch (err) {
            console.error("Error deleting card:", err);
            setError("Unable to delete the card.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Navigation */}
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

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800">
                            My Cards
                        </h2>

                        <p className="text-slate-500 mt-2">
                            Manage your saved credit and debit cards.
                        </p>
                    </div>

                    <Link
                        to="/cards/add"
                        className="bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700"
                    >
                        + Add Card
                    </Link>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-lg bg-red-100 text-red-700 px-4 py-3">
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="bg-white rounded-xl shadow p-8 text-center">
                        <p className="text-slate-600">Loading cards...</p>
                    </div>
                ) : cards.length === 0 ? (
                    /* No Cards */
                    <div className="bg-white rounded-xl shadow p-10 text-center">
                        <h3 className="text-xl font-semibold text-slate-700">
                            No saved cards
                        </h3>

                        <p className="text-slate-500 mt-2">
                            Add a card to make payments.
                        </p>

                        <Link
                            to="/cards/add"
                            className="inline-block mt-5 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700"
                        >
                            Add Your First Card
                        </Link>
                    </div>
                ) : (
                    /* Cards */
                    <div className="grid md:grid-cols-2 gap-6">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className="bg-white rounded-2xl shadow-lg p-6"
                            >
                                {/* Card Header */}
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-sm font-semibold text-blue-600">
                                            {card.card_type}
                                        </span>

                                        <h3 className="text-xl font-bold text-slate-800 mt-2">
                                            {card.card_holder_name}
                                        </h3>
                                    </div>

                                    <span className="text-slate-500 text-sm">
                                        **** {card.last_four_digits}
                                    </span>
                                </div>

                                {/* Card Information */}
                                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500">Card Number</p>

                                        <p className="font-semibold mt-1">
                                            {card.masked_card_number}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-slate-500">Expiry</p>

                                        <p className="font-semibold mt-1">
                                            {String(card.expiry_month).padStart(2, "0")}/
                                            {card.expiry_year}
                                        </p>
                                    </div>
                                </div>

                                {/* Delete */}
                                <button
                                    onClick={() => handleDelete(card.id)}
                                    className="mt-6 w-full bg-red-100 text-red-700 py-2.5 rounded-lg font-semibold hover:bg-red-200"
                                >
                                    Delete Card
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
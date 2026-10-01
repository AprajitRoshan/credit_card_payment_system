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

    return (
        <div className="min-h-screen bg-slate-100">
            <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-800">
                    Credit Card Payment System
                </h1>

                <Link
                    to="/cards"
                    className="text-blue-600 font-semibold hover:underline"
                >
                    My Cards
                </Link>
            </nav>

            <main className="max-w-2xl mx-auto px-6 py-10">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-slate-800">
                        Add Card
                    </h2>

                    <p className="text-slate-500 mt-2">
                        Add a new credit or debit card.
                    </p>

                    {error && (
                        <div className="mt-6 rounded-lg bg-red-100 text-red-700 px-4 py-3">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Card Type
                            </label>

                            <select
                                name="card_type"
                                value={formData.card_type}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="CREDIT">Credit Card</option>
                                <option value="DEBIT">Debit Card</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Card Holder Name
                            </label>

                            <input
                                type="text"
                                name="card_holder_name"
                                value={formData.card_holder_name}
                                onChange={handleChange}
                                placeholder="Enter card holder name"
                                required
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Card Number
                            </label>

                            <input
                                type="text"
                                name="card_number"
                                value={formData.card_number}
                                onChange={handleChange}
                                placeholder="Enter card number"
                                maxLength="16"
                                required
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Expiry Year
                                </label>

                                <input
                                    type="number"
                                    name="expiry_year"
                                    value={formData.expiry_year}
                                    onChange={handleChange}
                                    placeholder="YYYY"
                                    required
                                    className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                CVV
                            </label>

                            <input
                                type="password"
                                name="cvv"
                                value={formData.cvv}
                                onChange={handleChange}
                                placeholder="Enter CVV"
                                maxLength="4"
                                required
                                className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />

                            <p className="text-xs text-slate-500 mt-2">
                                CVV is used only for validation and is never stored.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? "Adding Card..." : "Add Card"}
                            </button>

                            <Link
                                to="/cards"
                                className="flex-1 text-center border border-slate-300 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-50"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
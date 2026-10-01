import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            navigate("/login");
            return;
        }

        const loadUser = async () => {
            try {
                const response = await api.get("/auth/me/");
                setUser(response.data);
            } catch (error) {
                console.error(error);

                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");

                navigate("/login");
            }
        };

        loadUser();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            const refresh = localStorage.getItem("refresh_token");

            if (refresh) {
                await api.post("/auth/logout/", {
                    refresh,
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            navigate("/login");
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Navbar */}
            <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-slate-800">
                    Credit Card Payment System
                </h1>

                <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
                >
                    Logout
                </button>
            </nav>

            {/* Dashboard */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-3xl font-bold text-slate-800">
                        Welcome{user?.username ? `, ${user.username}` : ""}!
                    </h2>

                    <p className="text-slate-500 mt-2">
                        Manage your cards, payments and transactions from here.
                    </p>

                    <div className="grid md:grid-cols-3 gap-6 mt-8">
                        <Link
                            to="/cards"
                            className="border border-slate-300 rounded-xl p-6 block hover:shadow-md hover:border-blue-500 transition cursor-pointer"
                        >
                            <h3 className="font-semibold text-lg text-slate-800">
                                My Cards
                            </h3>
                            <p className="text-slate-500 mt-2">
                                Manage your saved cards.
                            </p>
                        </Link>

                        <Link
                            to="/payment"
                            className="border border-slate-300 rounded-xl p-6 block hover:shadow-md hover:border-blue-500 transition cursor-pointer"
                        >
                            <h3 className="font-semibold text-lg text-slate-800">
                                Make Payment
                            </h3>
                            <p className="text-slate-500 mt-2">
                                Make a secure payment.
                            </p>
                        </Link>

                        <Link
                            to="/transactions"
                            className="border border-slate-300 rounded-xl p-6 block hover:shadow-md hover:border-blue-500 transition cursor-pointer"
                        >
                            <h3 className="font-semibold text-lg text-slate-800">
                                Transactions
                            </h3>
                            <p className="text-slate-500 mt-2">
                                View your payment history.
                            </p>
                        </Link>
                    </div>

                    <div className="mt-6">
                        <Link
                            to="/admin"
                            className="block bg-slate-800 text-white rounded-xl p-6 hover:bg-slate-900 transition"
                        >
                            <h3 className="font-semibold text-lg">
                                Admin Dashboard
                            </h3>
                            <p className="text-slate-300 mt-2">
                                View users, cards, transactions and payment summaries.
                            </p>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
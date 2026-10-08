import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

/* =========================================================
   ICONS
========================================================= */

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
            <path d="M7 15h4" />
        </svg>
    );
}

function ShieldIcon({ size = 20 }) {
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
            <path d="m8.5 12 2.2 2.2 4.8-4.8" />
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

function LockIcon({ size = 15 }) {
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
   ADD CARD
========================================================= */

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

    /* =====================================================
       FORM HANDLERS
    ===================================================== */

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleCardNumberChange = (event) => {
        const value = event.target.value
            .replace(/\D/g, "")
            .slice(0, 19);

        setFormData((current) => ({
            ...current,
            card_number: value,
        }));
    };

    /* =====================================================
       SUBMIT
    ===================================================== */

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await api.post("/cards/", {
                card_type: formData.card_type,
                card_holder_name:
                    formData.card_holder_name,
                card_number: formData.card_number,
                expiry_month: Number(
                    formData.expiry_month
                ),
                expiry_year: Number(
                    formData.expiry_year
                ),
                cvv: formData.cvv,
            });

            navigate("/cards");
        } catch (err) {
            console.error(
                "Error adding card:",
                err
            );

            const responseData =
                err.response?.data;

            if (responseData) {
                if (
                    typeof responseData ===
                    "string"
                ) {
                    setError(responseData);
                } else {
                    setError(
                        Object.entries(
                            responseData
                        )
                            .map(
                                ([
                                    field,
                                    message,
                                ]) =>
                                    `${field}: ${message}`
                            )
                            .join(" | ")
                    );
                }
            } else {
                setError(
                    "Unable to add card. Please try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
       CARD PREVIEW
    ===================================================== */

    const displayNumber =
        formData.card_number
            ? formData.card_number
                .padEnd(16, "•")
                .replace(
                    /(.{4})/g,
                    "$1 "
                )
                .trim()
            : "•••• •••• •••• ••••";

    const isCredit =
        formData.card_type === "CREDIT";

    return (
        <div
            className="
                min-h-screen
                bg-[#f5f7fb]
                dark:bg-[#080f1d]
            "
        >
            {/* =================================================
                NAVBAR
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
                            <CreditCardIcon
                                size={18}
                            />
                        </div>

                        <span>CreditPay</span>
                    </Link>

                    <Link
                        to="/cards"
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
                        <ArrowLeftIcon
                            size={15}
                        />
                        My Cards
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
                <div
                    className="
                        grid
                        gap-8
                        xl:grid-cols-[0.9fr_1.1fr]
                    "
                >
                    {/* =================================================
                        LEFT - PREVIEW
                    ================================================= */}

                    <section>
                        <div className="mb-6">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                                    New Payment Card
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
                                Add Card
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                                Save a card securely for
                                future payments.
                            </p>
                        </div>

                        {/* =================================================
                            CARD PREVIEW
                        ================================================= */}

                        <div
                            className={`
                                relative
                                min-h-[280px]
                                overflow-hidden
                                rounded-3xl
                                p-7
                                text-white
                                shadow-2xl
                                transition-all
                                duration-500
                                sm:p-8
                                ${isCredit
                                    ? "bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800 shadow-blue-950/20"
                                    : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 shadow-slate-950/30"
                                }
                            `}
                        >
                            {/* Decorative glow */}

                            <div
                                className="
                                    pointer-events-none
                                    absolute
                                    -right-20
                                    -top-20
                                    h-56
                                    w-56
                                    rounded-full
                                    bg-white/10
                                    blur-2xl
                                "
                            />

                            <div
                                className="
                                    pointer-events-none
                                    absolute
                                    -bottom-24
                                    left-20
                                    h-56
                                    w-56
                                    rounded-full
                                    bg-white/5
                                    blur-2xl
                                "
                            />

                            <div className="relative">
                                {/* Card top */}

                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/60">
                                            {
                                                formData.card_type
                                            }
                                        </p>

                                        <p className="mt-1 text-sm font-medium text-white/75">
                                            PAYMENT CARD
                                        </p>
                                    </div>

                                    <div
                                        className="
                                            flex
                                            h-11
                                            w-14
                                            items-center
                                            justify-center
                                            rounded-lg
                                            border
                                            border-white/20
                                            bg-white/10
                                            backdrop-blur-sm
                                        "
                                    >
                                        <div className="h-6 w-8 rounded-md border border-white/40 bg-white/10" />
                                    </div>
                                </div>

                                {/* Card number */}

                                <p
                                    className="
                                        mt-14
                                        font-mono
                                        text-xl
                                        font-medium
                                        tracking-[0.13em]
                                        text-white
                                        sm:text-2xl
                                    "
                                >
                                    {displayNumber}
                                </p>

                                {/* Card bottom */}

                                <div className="mt-10 flex items-end justify-between gap-6">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/50">
                                            Card Holder
                                        </p>

                                        <p className="mt-1 truncate text-sm font-semibold uppercase tracking-wide">
                                            {formData.card_holder_name ||
                                                "YOUR NAME"}
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/50">
                                            Expires
                                        </p>

                                        <p className="mt-1 text-sm font-semibold">
                                            {formData.expiry_month
                                                ? String(
                                                    formData.expiry_month
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )
                                                : "MM"}
                                            /
                                            {formData.expiry_year ||
                                                "YYYY"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* =================================================
                            SECURITY NOTICE
                        ================================================= */}

                        <div
                            className="
                                mt-5
                                rounded-2xl
                                border
                                border-blue-100
                                bg-blue-50
                                p-5
                                dark:border-blue-500/20
                                dark:bg-blue-500/5
                            "
                        >
                            <div className="flex gap-3">
                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-blue-100
                                        text-blue-600
                                        dark:bg-blue-500/10
                                        dark:text-blue-400
                                    "
                                >
                                    <ShieldIcon
                                        size={20}
                                    />
                                </div>

                                <div>
                                    <p className="font-semibold text-blue-900 dark:text-blue-300">
                                        Your card details are
                                        protected
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-blue-700 dark:text-blue-400/80">
                                        Full card numbers and
                                        CVV are not stored by
                                        the application.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Small security indicators */}

                        <div
                            className="
                                mt-4
                                grid
                                grid-cols-2
                                gap-3
                            "
                        >
                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2.5
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    px-4
                                    py-3
                                    text-xs
                                    font-medium
                                    text-slate-600
                                    dark:border-slate-700/60
                                    dark:bg-[#111827]
                                    dark:text-slate-400
                                "
                            >
                                <LockIcon
                                    size={14}
                                />
                                Encrypted connection
                            </div>

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2.5
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    px-4
                                    py-3
                                    text-xs
                                    font-medium
                                    text-slate-600
                                    dark:border-slate-700/60
                                    dark:bg-[#111827]
                                    dark:text-slate-400
                                "
                            >
                                <ShieldIcon
                                    size={15}
                                />
                                CVV not stored
                            </div>
                        </div>
                    </section>

                    {/* =================================================
                        RIGHT - FORM
                    ================================================= */}

                    <section
                        className="
                            rounded-3xl
                            border
                            border-slate-200
                            bg-white
                            p-6
                            shadow-sm
                            sm:p-8
                            dark:border-slate-700/60
                            dark:bg-[#111827]
                        "
                    >
                        <div className="mb-7">
                            <div className="flex items-center gap-3">
                                <div
                                    className="
                                        flex
                                        h-10
                                        w-10
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-blue-500/10
                                        text-blue-600
                                        dark:text-blue-400
                                    "
                                >
                                    <CreditCardIcon
                                        size={19}
                                    />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        Card Details
                                    </h2>

                                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                        Enter the details below
                                        to save your card.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {error && (
                            <div
                                className="
                                    mb-6
                                    rounded-xl
                                    border
                                    border-red-200
                                    bg-red-50
                                    px-4
                                    py-3
                                    text-sm
                                    font-medium
                                    leading-6
                                    text-red-700
                                    dark:border-red-500/25
                                    dark:bg-red-500/10
                                    dark:text-red-400
                                "
                            >
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            {/* Card type */}

                            <div>
                                <label
                                    htmlFor="card_type"
                                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Card Type
                                </label>

                                <select
                                    id="card_type"
                                    name="card_type"
                                    value={
                                        formData.card_type
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-slate-300
                                        bg-white
                                        px-4
                                        py-3
                                        text-sm
                                        text-slate-800
                                        outline-none
                                        transition
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-100
                                        dark:border-slate-600
                                        dark:bg-[#0d1627]
                                        dark:text-white
                                        dark:focus:border-blue-500
                                        dark:focus:ring-blue-500/10
                                    "
                                >
                                    <option value="CREDIT">
                                        Credit Card
                                    </option>

                                    <option value="DEBIT">
                                        Debit Card
                                    </option>
                                </select>
                            </div>

                            {/* Card holder */}

                            <div>
                                <label
                                    htmlFor="card_holder_name"
                                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Card Holder Name
                                </label>

                                <input
                                    id="card_holder_name"
                                    type="text"
                                    name="card_holder_name"
                                    value={
                                        formData.card_holder_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter card holder name"
                                    required
                                    autoComplete="cc-name"
                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-slate-300
                                        bg-white
                                        px-4
                                        py-3
                                        text-sm
                                        text-slate-800
                                        outline-none
                                        transition
                                        placeholder:text-slate-400
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-100
                                        dark:border-slate-600
                                        dark:bg-[#0d1627]
                                        dark:text-white
                                        dark:placeholder:text-slate-600
                                        dark:focus:border-blue-500
                                        dark:focus:ring-blue-500/10
                                    "
                                />
                            </div>

                            {/* Card number */}

                            <div>
                                <label
                                    htmlFor="card_number"
                                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    Card Number
                                </label>

                                <div className="relative">
                                    <input
                                        id="card_number"
                                        type="text"
                                        inputMode="numeric"
                                        name="card_number"
                                        value={
                                            formData.card_number
                                        }
                                        onChange={
                                            handleCardNumberChange
                                        }
                                        placeholder="Enter card number"
                                        maxLength="19"
                                        required
                                        autoComplete="cc-number"
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-white
                                            px-4
                                            py-3
                                            pr-11
                                            font-mono
                                            text-sm
                                            tracking-wide
                                            text-slate-800
                                            outline-none
                                            transition
                                            placeholder:font-sans
                                            placeholder:tracking-normal
                                            placeholder:text-slate-400
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                            dark:border-slate-600
                                            dark:bg-[#0d1627]
                                            dark:text-white
                                            dark:placeholder:text-slate-600
                                            dark:focus:border-blue-500
                                            dark:focus:ring-blue-500/10
                                        "
                                    />

                                    <span
                                        className="
                                            pointer-events-none
                                            absolute
                                            right-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                            dark:text-slate-600
                                        "
                                    >
                                        <CreditCardIcon
                                            size={18}
                                        />
                                    </span>
                                </div>
                            </div>

                            {/* Expiry */}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="expiry_month"
                                        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                                    >
                                        Expiry Month
                                    </label>

                                    <input
                                        id="expiry_month"
                                        type="number"
                                        name="expiry_month"
                                        value={
                                            formData.expiry_month
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="MM"
                                        min="1"
                                        max="12"
                                        required
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-white
                                            px-4
                                            py-3
                                            text-sm
                                            text-slate-800
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                            dark:border-slate-600
                                            dark:bg-[#0d1627]
                                            dark:text-white
                                            dark:placeholder:text-slate-600
                                            dark:focus:border-blue-500
                                            dark:focus:ring-blue-500/10
                                        "
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="expiry_year"
                                        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                                    >
                                        Expiry Year
                                    </label>

                                    <input
                                        id="expiry_year"
                                        type="number"
                                        name="expiry_year"
                                        value={
                                            formData.expiry_year
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="YYYY"
                                        required
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-white
                                            px-4
                                            py-3
                                            text-sm
                                            text-slate-800
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                            dark:border-slate-600
                                            dark:bg-[#0d1627]
                                            dark:text-white
                                            dark:placeholder:text-slate-600
                                            dark:focus:border-blue-500
                                            dark:focus:ring-blue-500/10
                                        "
                                    />
                                </div>
                            </div>

                            {/* CVV */}

                            <div>
                                <label
                                    htmlFor="cvv"
                                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                                >
                                    CVV
                                </label>

                                <div className="relative">
                                    <input
                                        id="cvv"
                                        type="password"
                                        inputMode="numeric"
                                        name="cvv"
                                        value={
                                            formData.cvv
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Enter CVV"
                                        maxLength="4"
                                        required
                                        autoComplete="cc-csc"
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-white
                                            px-4
                                            py-3
                                            pr-11
                                            text-sm
                                            text-slate-800
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-blue-500
                                            focus:ring-4
                                            focus:ring-blue-100
                                            dark:border-slate-600
                                            dark:bg-[#0d1627]
                                            dark:text-white
                                            dark:placeholder:text-slate-600
                                            dark:focus:border-blue-500
                                            dark:focus:ring-blue-500/10
                                        "
                                    />

                                    <span
                                        className="
                                            pointer-events-none
                                            absolute
                                            right-4
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                            dark:text-slate-600
                                        "
                                    >
                                        <LockIcon
                                            size={16}
                                        />
                                    </span>
                                </div>

                                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-500">
                                    CVV is used only for
                                    validation and is never
                                    stored.
                                </p>
                            </div>

                            {/* Actions */}

                            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row dark:border-slate-700/60">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="
                                        flex
                                        flex-1
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-xl
                                        bg-blue-600
                                        py-3.5
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
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                    "
                                >
                                    {loading && (
                                        <span
                                            className="
                                                h-4
                                                w-4
                                                animate-spin
                                                rounded-full
                                                border-2
                                                border-white/30
                                                border-t-white
                                            "
                                        />
                                    )}

                                    {loading
                                        ? "Adding Card..."
                                        : "Add Card"}
                                </button>

                                <Link
                                    to="/cards"
                                    className="
                                        flex
                                        flex-1
                                        items-center
                                        justify-center
                                        rounded-xl
                                        border
                                        border-slate-300
                                        py-3.5
                                        text-sm
                                        font-bold
                                        text-slate-700
                                        transition-all
                                        duration-200
                                        hover:bg-slate-50
                                        dark:border-slate-600
                                        dark:text-slate-300
                                        dark:hover:bg-slate-800
                                    "
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
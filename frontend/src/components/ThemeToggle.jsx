import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
    const { darkMode, toggleDarkMode } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={
                darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            }
            title={
                darkMode
                    ? "Switch to light mode"
                    : "Switch to dark mode"
            }
            className="
                fixed
                right-5
                top-4
                z-50
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                bg-white
                text-slate-600
                shadow-sm
                transition-all
                duration-300
                hover:scale-105
                hover:shadow-md
                dark:border-slate-700
                dark:bg-slate-800
                dark:text-slate-200
            "
        >
            {darkMode ? (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                </svg>
            ) : (
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3
                        7 7 0 0 0 21 12.79z"
                    />
                </svg>
            )}
        </button>
    );
}

export default ThemeToggle;
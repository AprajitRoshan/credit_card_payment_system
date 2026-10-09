/* =========================================================
   CHART THEME

   Categorical colours were checked with a colour-blind
   validator against the app's light (#ffffff) and dark
   (#111827) card surfaces. Use slots in order; never cycle.
   Status colours are reserved for SUCCESS / FAILED / PENDING
   style states and are always shown with a text label.
========================================================= */

export const CATEGORICAL = {
    light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"],
    dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300"],
};

export const STATUS_COLORS = {
    good: "#0ca30c",
    warning: "#fab219",
    serious: "#ec835a",
    critical: "#d03b3b",
};

export function getChartTheme(darkMode) {
    return {
        series: darkMode ? CATEGORICAL.dark : CATEGORICAL.light,
        primary: darkMode ? CATEGORICAL.dark[0] : CATEGORICAL.light[0],
        grid: darkMode ? "#1f2937" : "#eef2f7",
        axis: darkMode ? "#94a3b8" : "#64748b",
        surface: darkMode ? "#111827" : "#ffffff",
        cursor: darkMode ? "rgba(148, 163, 184, 0.08)" : "rgba(15, 23, 42, 0.04)",
    };
}

export function formatCurrency(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function formatCompactCurrency(value) {
    const number = Number(value || 0);

    if (number >= 100000) return `₹${(number / 100000).toFixed(1)}L`;
    if (number >= 1000) return `₹${(number / 1000).toFixed(1)}k`;

    return `₹${number.toFixed(0)}`;
}

export function titleCase(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

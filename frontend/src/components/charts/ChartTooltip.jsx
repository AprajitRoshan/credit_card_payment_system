/* =========================================================
   CHART TOOLTIP (shared by all Recharts charts)
========================================================= */

export default function ChartTooltip({
    active,
    payload,
    label,
    valueFormatter = (value) => value,
}) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {label !== undefined && (
                <p className="mb-1.5 font-semibold text-slate-900 dark:text-white">
                    {label}
                </p>
            )}

            {payload.map((item) => (
                <div
                    key={item.dataKey || item.name}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                    <span
                        className="h-2 w-2 rounded-full"
                        style={{
                            background:
                                item.color ||
                                item.payload?.fill,
                        }}
                    />

                    <span>{item.name}</span>

                    <span className="ml-auto pl-3 font-semibold text-slate-900 dark:text-white">
                        {valueFormatter(item.value)}
                    </span>
                </div>
            ))}
        </div>
    );
}

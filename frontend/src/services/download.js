import api from "./api";

/* =========================================================
   FILE DOWNLOAD HELPER

   Downloads an authenticated file (CSV / PDF) from the
   Django API and saves it with the server's filename.
========================================================= */

function filenameFromHeader(header, fallback) {
    if (!header) return fallback;

    const match = /filename="?([^";]+)"?/i.exec(header);

    return match ? match[1] : fallback;
}

export async function downloadFile(url, fallbackName, params = {}) {
    const response = await api.get(url, {
        params,
        responseType: "blob",
    });

    const filename = filenameFromHeader(
        response.headers["content-disposition"],
        fallbackName
    );

    const blobUrl = window.URL.createObjectURL(
        new Blob([response.data], {
            type:
                response.headers["content-type"] ||
                "application/octet-stream",
        })
    );

    const link = document.createElement("a");

    link.href = blobUrl;
    link.setAttribute("download", filename);

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(blobUrl);
}

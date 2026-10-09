"""
Cross-platform font registration for ReportLab PDFs.

The original statement code loaded C:\\Windows\\Fonts\\arial.ttf, which
fails inside Docker / Linux. This helper tries Arial on Windows, then
common Linux / macOS TrueType fonts that include the rupee sign, and
finally falls back to the built-in Helvetica font with "Rs." instead of
the rupee symbol.
"""

import os

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


FONT_CANDIDATES = [
    (
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\arialbd.ttf",
    ),
    (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ),
    (
        "/usr/share/fonts/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
    ),
    (
        "/Library/Fonts/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf",
    ),
    (
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    ),
]

_REGISTERED = None


def register_pdf_fonts():
    """
    Returns (regular_font, bold_font, currency_symbol).
    """
    global _REGISTERED

    if _REGISTERED:
        return _REGISTERED

    for regular_path, bold_path in FONT_CANDIDATES:
        if os.path.exists(regular_path) and os.path.exists(bold_path):
            try:
                pdfmetrics.registerFont(TTFont("AppFont", regular_path))
                pdfmetrics.registerFont(TTFont("AppFont-Bold", bold_path))
                _REGISTERED = ("AppFont", "AppFont-Bold", chr(0x20B9))
                return _REGISTERED
            except Exception:
                continue

    _REGISTERED = ("Helvetica", "Helvetica-Bold", "Rs.")
    return _REGISTERED

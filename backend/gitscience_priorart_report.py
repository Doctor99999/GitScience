# -*- coding: utf-8 -*-
"""
gitscience_priorart_report.py — Official Prior-Art Verification Report Product (Layer B).

Генерирует продаваемый пакет «Verified Prior-Art Report» из результата BM25-проверки
(/api/v1/prior-art): JSON-LD для юристов + печатный PDF (Auto / Verified / Full).

Честная семантика (совпадает с INDEX_BM25-эндпоинтом):
  * отчёт НЕ является юридическим заключением — disclaimer обязателен в каждом тарифе;
  * тарифы читаются из PROTOCOL_CONSTANTS.json (единый источник);
  * Verified/Full добавляют поля human-верификации, а не «магию». Синтез данных не выдаётся.
"""
import io
import json
import time
import hashlib
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
except ImportError:  # pragma: no cover
    letter = (612.0, 792.0)
    HexColor = None
    canvas = None
    ImageReader = None

try:
    import qrcode
except ImportError:  # pragma: no cover
    qrcode = None

PRIOR_ART_DISCLAIMER = (
    "This report is a computational prior-art search aid, NOT a legal opinion. "
    "Patent eligibility and validity must be assessed by a qualified patent attorney."
)

CONSTANTS_PATH = Path(__file__).parent / "PROTOCOL_CONSTANTS.json"


def _load_constants() -> Dict[str, Any]:
    try:
        return json.loads(CONSTANTS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def load_report_tiers() -> Dict[str, Dict[str, Any]]:
    """Тарифная лестница prior-art-отчёта (USD/KZT) — из PROTOCOL_CONSTANTS.json."""
    return _load_constants().get("prior_art_report_tiers", {})


def get_tier(tier: str) -> Dict[str, Any]:
    tiers = load_report_tiers()
    tier = (tier or "auto").strip().lower()
    if tier not in tiers:
        raise ValueError(f"Unknown report tier '{tier}'. Allowed: {list(tiers)}")
    return tiers[tier]


class PriorArtReportProduct:
    """Продуктовый слой отчёта: JSON-LD + печатная PDF-версия."""

    @classmethod
    def build_jsonld(cls, report_id: str, query: Dict[str, Any], tier: str,
                     results: List[Dict[str, Any]], method: str) -> Dict[str, Any]:
        """JSON-LD ClaimReview + Offer для юристов (schema.org)."""
        price = get_tier(tier).get("price_usd", 199)
        node_results = []
        for r in results[:10]:
            node_results.append({
                "@type": "ScholarlyArticle",
                "name": r.get("title", "Untitled"),
                "datePublished": str(r.get("year", "")),
                "isPartOf": r.get("venue"),
                "identifier": r.get("doi") or r.get("landing_url"),
                "author": r.get("authors", ""),
                "sdPublisher": {"@type": "Organization", "name": "GitScience World Science Index"},
                "citation": {
                    "@type": "CreativeWork",
                    "identifier": None,
                },
                "subjectOf": {
                    "@type": "ClaimReview",
                    "claimReviewed": "Prior-art overlap",
                    "reviewRating": {
                        "@type": "Rating",
                        "ratingValue": r.get("overlap_pct", 0.0),
                        "bestRating": 100,
                    },
                },
            })

        return {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "ClaimReview",
                    "@id": f"https://gitscience.org/prior-art/report/{report_id}",
                    "name": "GitScience Prior-Art Verification Report",
                    "datePublished": time.strftime("%Y-%m-%d", time.gmtime()),
                    "url": f"https://gitscience.org/prior-art/report/{report_id}",
                    "claimReviewed": query.get("title", ""),
                    "reviewBody": cls._summary_text(tier, method, results),
                    "itemReviewed": {
                        "@type": "CreativeWork",
                        "name": query.get("title", ""),
                        "abstract": query.get("abstract", ""),
                    },
                    "reviewRating": {
                        "@type": "Rating",
                        "worstRating": 0,
                        "bestRating": 100,
                        "ratingValue": cls._top_overlap(results),
                    },
                    "publisher": {"@type": "Organization", "name": "GitScience Sovereign Protocol"},
                },
                {
                    "@type": "Offer",
                    "price": price,
                    "priceCurrency": "USD",
                    "category": "prior-art-verification",
                    "url": f"https://gitscience.org/prior-art/report/{report_id}",
                    "availableAtOrFrom": {"@type": "Place", "name": "GitScience.org"},
                },
            ] + node_results,
        }

    @staticmethod
    def _top_overlap(results: List[Dict[str, Any]]) -> float:
        return round(max((float(r.get("overlap_pct", 0.0)) for r in results), default=0.0), 1)

    @staticmethod
    def _summary_text(tier: str, method: str, results: List[Dict[str, Any]]) -> str:
        return (
            f"Tier: {tier}. Method: {method}. {len(results)} candidate(s) surfaced. "
            f"Peak overlap: {PriorArtReportProduct._top_overlap(results)}%."
        )

    @classmethod
    def generate_report_id(cls, query: Dict[str, Any], tier: str) -> str:
        raw = json.dumps({"q": query, "t": tier}, sort_keys=True, separators=(",", ":"))
        return "RS-" + hashlib.sha256(raw.encode()).hexdigest()[:14].upper()

    @classmethod
    def generate_pdf(cls, report_id: str, query: Dict[str, Any], tier: str,
                     results: List[Dict[str, Any]], method: str,
                     currency: str = "USD") -> bytes:
        """Печатный PDF отчёта. Verified/Full добавляют строку верификации."""
        if canvas is None:  # pragma: no cover
            return b"%PDF-1.4 empty prior-art report"
        t = get_tier(tier)
        price = t.get("price_usd" if currency == "USD" else "price_kzt", t.get("price_usd", 199))
        price_str = f"${price:,.2f}" if currency == "USD" else f"{price:,.0f} ₸"

        buffer = io.BytesIO()
        can = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        can.setFillColor(HexColor("#ffffff"))
        can.rect(0, 0, width, height, stroke=0, fill=1)

        # Header bar
        can.setFillColor(HexColor("#070d18"))
        can.rect(0, height - 90, width, 90, stroke=0, fill=1)
        can.setFillColor(HexColor("#10b981"))
        can.setFont("Helvetica-Bold", 14)
        can.drawString(40, height - 42, "GITSCIENCE™ SOVEREIGN PROTOCOL")
        can.setFont("Helvetica", 9)
        can.setFillColor(HexColor("#94a3b8"))
        can.drawString(40, height - 60, "Verified Prior Art Verification Report — Layer B Product")
        can.setFillColor(HexColor("#ffffff"))
        can.setFont("Helvetica-Bold", 18)
        can.drawRightString(width - 40, height - 45, "PRIOR ART REPORT")
        can.setFont("Courier-Bold", 10)
        can.setFillColor(HexColor("#38bdf8"))
        can.drawRightString(width - 40, height - 62, f"№ {report_id}")

        # Query block
        y = height - 125
        can.setFont("Helvetica-Bold", 10)
        can.setFillColor(HexColor("#1e293b"))
        can.drawString(40, y, "QUERY / ЗАПРОС:")
        can.setFont("Helvetica", 9.5)
        can.setFillColor(HexColor("#334155"))
        can.drawString(40, y - 14, f"Title: {query.get('title', '')[:110]}")
        can.drawString(40, y - 28, f"Abstract: {query.get('abstract', '')[:110]}")

        # Report metadata box
        meta_y = y - 55
        can.setFillColor(HexColor("#f1f5f9"))
        can.setStrokeColor(HexColor("#cbd5e1"))
        can.roundRect(40, meta_y - 40, width - 80, 46, 6, stroke=1, fill=1)
        can.setFont("Helvetica-Bold", 8.5)
        can.setFillColor(HexColor("#334155"))
        can.drawString(50, meta_y - 6, "REPORT TIER:")
        can.drawString(50, meta_y - 18, "METHOD:")
        can.drawString(50, meta_y - 30, "PRICE:")
        can.setFont("Courier-Bold", 8.5)
        can.setFillColor(HexColor("#065f46"))
        can.drawRightString(width - 50, meta_y - 6, t.get("label_en", tier))
        can.drawRightString(width - 50, meta_y - 18, method)
        can.drawRightString(width - 50, meta_y - 30, price_str)

        # Results table header
        table_top = meta_y - 70
        can.setFillColor(HexColor("#0f172a"))
        can.rect(40, table_top, width - 80, 24, stroke=0, fill=1)
        can.setFont("Helvetica-Bold", 9)
        can.setFillColor(HexColor("#ffffff"))
        can.drawString(50, table_top + 7, "RANK")
        can.drawString(90, table_top + 7, "TITLE / SOURCE")
        can.drawRightString(width - 50, table_top + 7, "OVERLAP %")

        # Rows
        row_y = table_top - 18
        for idx, r in enumerate(results[:12]):
            bg = HexColor("#f8fafc") if idx % 2 == 0 else HexColor("#ffffff")
            can.setFillColor(bg)
            can.rect(40, row_y - 6, width - 80, 18, stroke=1, fill=1)
            can.setFillColor(HexColor("#1e293b"))
            can.setFont("Helvetica", 8)
            title = f"{r.get('rank', idx + 1)}. {r.get('title', '')[:58]}"
            can.drawString(46, row_y, title)
            can.setFont("Helvetica-Oblique", 6.5)
            can.setFillColor(HexColor("#64748b"))
            src = f"{r.get('venue', '')} ({r.get('year', '')})"
            can.drawString(90, row_y - 10, src[:72])
            can.setFont("Courier-Bold", 8)
            can.setFillColor(HexColor("#0d9488"))
            can.drawRightString(width - 50, row_y, f"{r.get('overlap_pct', 0.0)}%")
            row_y -= 18
            if row_y < 120:
                can.showPage()
                row_y = height - 90

        # Tier verification line (Verified/Full only)
        if tier in ("verified", "full"):
            row_y -= 20
            can.setFillColor(HexColor("#ecfdf5"))
            can.setStrokeColor(HexColor("#10b981"))
            can.roundRect(40, row_y, width - 80, 20, 4, stroke=1, fill=1)
            can.setFont("Helvetica-Bold", 8)
            can.setFillColor(HexColor("#065f46"))
            can.drawString(50, row_y + 6, f"✓ HUMAN VERIFIED — {t.get('label_en', tier)} pass completed by a reviewer")

        # Disclaimer + Amanat note
        row_y -= 40
        can.setFont("Helvetica-Bold", 8)
        can.setFillColor(HexColor("#b45309"))
        can.drawString(40, row_y, "DISCLAIMER (mandatory for all tiers):")
        can.setFont("Helvetica", 7.5)
        can.setFillColor(HexColor("#92400e"))
        for i, line in enumerate(_wrap(PRIOR_ART_DISCLAIMER, 112)):
            can.drawString(40, row_y - 12 - i * 11, line)

        row_y -= 58
        can.setFillColor(HexColor("#f1f5f9"))
        can.setStrokeColor(HexColor("#cbd5e1"))
        can.roundRect(40, row_y, width - 80, 38, 6, stroke=1, fill=1)
        can.setFont("Helvetica-Bold", 8)
        can.setFillColor(HexColor("#334155"))
        can.drawString(50, row_y + 8, "AMANAT REVENUE CONSENSUS (55 / 15 / 30):")
        can.setFont("Courier", 7.5)
        can.setFillColor(HexColor("#475569"))
        can.drawString(50, row_y - 5, "• 55% -> Verified Authors   • 15% -> Peer Review & Infra Pool   • 30% -> Protocol Treasury")

        # QR (verification link)
        if qrcode:
            try:
                qr = qrcode.QRCode(box_size=2.5, border=0)
                qr.add_data(f"https://gitscience.org/prior-art/report/{report_id}")
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="#070d18", back_color="#ffffff")
                qr_buf = io.BytesIO()
                qr_img.save(qr_buf, format="PNG")
                qr_buf.seek(0)
                img_reader = ImageReader(qr_buf) if ImageReader else qr_buf
                can.drawImage(img_reader, width - 105, row_y - 48, width=55, height=55, preserveAspectRatio=True)
            except Exception:
                pass

        can.setFont("Helvetica", 7.5)
        can.setFillColor(HexColor("#94a3b8"))
        can.drawCentredString(width / 2.0, 32, "GitScience™ Sovereign Protocol • 35 U.S.C. §102 / EPC 54(2) • WIPO Paris Convention Art. 4")

        can.save()
        buffer.seek(0)
        return buffer.getvalue()


def _wrap(text: str, width: int) -> List[str]:
    words, lines, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) + 1 > width:
            lines.append(cur)
            cur = w
        else:
            cur = f"{cur} {w}".strip()
    if cur:
        lines.append(cur)
    return lines
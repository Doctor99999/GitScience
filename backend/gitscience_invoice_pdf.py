# -*- coding: utf-8 -*-
"""
gitscience_invoice_pdf.py — Official B2B Institutional PDF Invoice Generator
Генерирует официальный счет-фактуру для медицинских центров и клиник (MaaS Licensing).
"""
import io
import time
import json
from pathlib import Path
from typing import Dict, Any, Optional

def _load_founder_wallet() -> str:
    """Единый источник идентичности основателя — PROTOCOL_CONSTANTS.json"""
    try:
        cfg = json.loads((Path(__file__).parent / "PROTOCOL_CONSTANTS.json").read_text(encoding="utf-8"))
        return cfg.get("founder", {}).get("wallet") or "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37"
    except Exception:
        return "0x71C2B09934D3E08A52e52d7da7DAbFAc484EFE37"

FOUNDER_WALLET_ADDRESS = _load_founder_wallet()

try:
    import qrcode
except ImportError:
    qrcode = None

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import ImageReader
except ImportError:
    letter = (612.0, 792.0)
    HexColor = None
    canvas = None
    ImageReader = None

class InstitutionalInvoicePDFGenerator:
    """Генератор официальных PDF инвойсов GitScience™ B2B Licensing."""

    @classmethod
    def generate_invoice_pdf(
        cls,
        invoice_id: str,
        hospital_name: str,
        tax_id_bin: str,
        registration_code: str,
        base_license_fee: float,
        fiat_currency: str = "USD"
    ) -> bytes:
        if not canvas:
            return b"%PDF-1.4 empty invoice"

        gross_up = base_license_fee * 0.20
        total_gross = base_license_fee + gross_up
        author_share = base_license_fee * 0.55
        infra_share = base_license_fee * 0.15
        founder_share = base_license_fee * 0.30

        buffer = io.BytesIO()
        can = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Background
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
        can.drawString(40, height - 60, "Global Scientific Prior Art & Clinical MaaS Licensing Gateway")

        can.setFillColor(HexColor("#ffffff"))
        can.setFont("Helvetica-Bold", 18)
        can.drawRightString(width - 40, height - 45, "INVOICE / СЧЕТ")

        can.setFont("Courier-Bold", 10)
        can.setFillColor(HexColor("#38bdf8"))
        can.drawRightString(width - 40, height - 62, f"№ {invoice_id}")

        # Invoice Info & Billed To
        y = height - 125
        can.setFont("Helvetica-Bold", 10)
        can.setFillColor(HexColor("#1e293b"))
        can.drawString(40, y, "BILLED TO / ПЛАТЕЛЬЩИК:")

        can.setFont("Helvetica", 9.5)
        can.setFillColor(HexColor("#334155"))
        y -= 16
        can.drawString(40, y, f"Institution: {hospital_name}")
        y -= 14
        can.drawString(40, y, f"Tax ID / BIN: {tax_id_bin}")
        y -= 14
        can.drawString(40, y, f"Licensed Model Code: {registration_code}")

        # Date & Status Box (Right Side)
        right_box_y = height - 165
        can.setFont("Helvetica", 9)
        can.setFillColor(HexColor("#64748b"))
        can.drawRightString(width - 40, right_box_y, f"Date: {time.strftime('%Y-%m-%d UTC', time.gmtime())}")
        can.drawRightString(width - 40, right_box_y - 14, "Payment Terms: Net 30 Days")
        can.drawRightString(width - 40, right_box_y - 28, "Currency: USD / USDT Equivalent")

        # Table Header
        table_top = y - 40
        can.setFillColor(HexColor("#0f172a"))
        can.rect(40, table_top, width - 80, 24, stroke=0, fill=1)

        can.setFont("Helvetica-Bold", 9)
        can.setFillColor(HexColor("#ffffff"))
        can.drawString(50, table_top + 7, "ITEM DESCRIPTION / НАИМЕНОВАНИЕ УСЛУГИ")
        can.drawRightString(width - 50, table_top + 7, "AMOUNT")

        # Table Rows
        row_y = table_top - 24
        can.setFillColor(HexColor("#f8fafc"))
        can.rect(40, row_y, width - 80, 24, stroke=1, fill=1)
        can.setFillColor(HexColor("#1e293b"))
        can.setFont("Helvetica", 8.5)
        can.drawString(50, row_y + 7, f"Institutional Clinical MaaS License ({registration_code}) - Base Fee")
        can.setFont("Courier-Bold", 9)
        can.drawRightString(width - 50, row_y + 7, f"${base_license_fee:,.2f}")

        row_y -= 24
        can.setFillColor(HexColor("#ffffff"))
        can.rect(40, row_y, width - 80, 24, stroke=1, fill=1)
        can.setFillColor(HexColor("#1e293b"))
        can.setFont("Helvetica", 8.5)
        can.drawString(50, row_y + 7, "B2B Institutional Gross-Up & Tax Compliance Surcharge (+20%)")
        can.setFont("Courier-Bold", 9)
        can.drawRightString(width - 50, row_y + 7, f"${gross_up:,.2f}")

        # Total Box
        row_y -= 32
        can.setFillColor(HexColor("#ecfdf5"))
        can.setStrokeColor(HexColor("#10b981"))
        can.rect(width - 240, row_y, 200, 28, stroke=1, fill=1)

        can.setFont("Helvetica-Bold", 10)
        can.setFillColor(HexColor("#065f46"))
        can.drawString(width - 230, row_y + 9, "TOTAL DUE:")
        can.setFont("Courier-Bold", 12)
        can.drawRightString(width - 50, row_y + 9, f"${total_gross:,.2f} {fiat_currency}")

        # Amanat Breakdown Note
        breakdown_y = row_y - 45
        can.setFillColor(HexColor("#f1f5f9"))
        can.setStrokeColor(HexColor("#cbd5e1"))
        can.roundRect(40, breakdown_y - 45, width - 80, 52, 6, stroke=1, fill=1)

        can.setFont("Helvetica-Bold", 8)
        can.setFillColor(HexColor("#334155"))
        can.drawString(50, breakdown_y - 2, "AMANAT REVENUE CONSENSUS ALLOCATION (55 / 15 / 30 RULE):")

        can.setFont("Courier", 7.5)
        can.setFillColor(HexColor("#475569"))
        can.drawString(50, breakdown_y - 15, f"• 55% Author Royalty Pool:        ${author_share:,.2f} (Distributed per CRediT CASRAI)")
        can.drawString(50, breakdown_y - 26, f"• 15% Peer Review & Infra Pool:   ${infra_share:,.2f} (Compensating node validators)")
        can.drawString(50, breakdown_y - 37, f"• 30% Protocol Founder Treasury:  ${founder_share:,.2f} (Salauat Yeshimov Foundation)")

        # Banking & Settlement Instructions
        bank_y = breakdown_y - 105
        can.setFont("Helvetica-Bold", 9)
        can.setFillColor(HexColor("#0f172a"))
        can.drawString(40, bank_y, "WIRE SETTLEMENT & CRYPTOGRAPHIC PAYMENT DETAILS:")

        can.setFont("Courier", 8)
        can.setFillColor(HexColor("#334155"))
        can.drawString(40, bank_y - 14, "Bank Name:      Sovereign Decentralized Science Settlement Vault")
        can.drawString(40, bank_y - 26, "IBAN / Account: KZ889260190440023412GSUSD")
        can.drawString(40, bank_y - 38, f"USDT / Web3:    {FOUNDER_WALLET_ADDRESS} (Polygon / Base)")
        can.drawString(40, bank_y - 50, f"Payment Memo:   INVOICE-{invoice_id}-{registration_code}")

        # QR Code for Payment / Verification
        if qrcode:
            try:
                qr = qrcode.QRCode(box_size=2.5, border=0)
                qr.add_data(f"https://gitscience.org/billing/invoice/{invoice_id}")
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="#070d18", back_color="#ffffff")
                qr_buf = io.BytesIO()
                qr_img.save(qr_buf, format="PNG")
                qr_buf.seek(0)
                img_reader = ImageReader(qr_buf) if ImageReader else qr_buf
                can.drawImage(img_reader, width - 105, bank_y - 56, width=65, height=65, preserveAspectRatio=True)
            except Exception:
                pass

        # Footer
        can.setFont("Helvetica", 7.5)
        can.setFillColor(HexColor("#94a3b8"))
        can.drawCentredString(width / 2.0, 32, "GitScience™ Sovereign Protocol • ISO 14721 OAIS • WIPO Paris Convention Art. 4")

        can.save()
        buffer.seek(0)
        return buffer.getvalue()

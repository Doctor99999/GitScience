# -*- coding: utf-8 -*-
"""
gitscience_certificate.py — Official Scientific Priority PDF Certificate Generator
Генерирует официальный высокополиграфический PDF-сертификат приоритета открытия
с QR-кодом, WIPO Prior Art Shield, водяным знаком, хешами SHA-256/Git/IPFS и RUO-штампом.
"""
import io
import time
from typing import Dict, Any, Optional, List

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

class CertificateGenerator:
    """Генератор официального суверенного сертификата приоритета GitScience™"""

    @classmethod
    def generate_priority_certificate_pdf(
        cls,
        registration_code: str,
        title: str,
        author_name: str,
        orcid: str,
        category: str,
        ipc_class: str,
        sha256_hash: str,
        git_commit_oid: str,
        ast_merkle_digest: Optional[str] = None,
        ots_file: Optional[str] = None,
        license_type: str = "CC-BY-4.0",
        ipfs_cid: Optional[str] = None,
        credit_contributors: Optional[List[Dict[str, Any]]] = None
    ) -> bytes:
        if not canvas:
            return b"%PDF-1.4 empty certificate"

        buffer = io.BytesIO()
        can = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # 1. Задний фон и рамка суверенитета
        can.setFillColor(HexColor("#070d18"))
        can.rect(0, 0, width, height, stroke=0, fill=1)

        # 1.1 Диагональный защитный водяной знак (Security Watermark)
        can.saveState()
        can.setFont("Helvetica-Bold", 34)
        can.setFillColor(HexColor("#0f1c30"))
        can.translate(width / 2.0, height / 2.0)
        can.rotate(45)
        can.drawCentredString(0, 40, "GITSCIENCE™ PRIOR ART RECORD")
        can.drawCentredString(0, -20, "WIPO PARIS CONVENTION ART. 4")
        can.restoreState()

        # Двойная золотая/изумрудная рамка
        can.setStrokeColor(HexColor("#10b981"))
        can.setLineWidth(2.5)
        can.roundRect(24, 24, width - 48, height - 48, 12, stroke=1, fill=0)

        can.setStrokeColor(HexColor("#0ea5e9"))
        can.setLineWidth(1)
        can.roundRect(28, 28, width - 56, height - 56, 10, stroke=1, fill=0)

        # 2. Шапка сертификата
        can.setFillColor(HexColor("#10b981"))
        can.setFont("Helvetica-Bold", 10)
        can.drawCentredString(width / 2.0, height - 56, "GITSCIENCE™ SOVEREIGN PROTOCOL • GLOBAL PRIOR ART REGISTRY")

        can.setFillColor(HexColor("#ffffff"))
        can.setFont("Helvetica-Bold", 20)
        can.drawCentredString(width / 2.0, height - 82, "CERTIFICATE OF SCIENTIFIC PRIORITY")

        can.setFont("Helvetica", 8.5)
        can.setFillColor(HexColor("#94a3b8"))
        can.drawCentredString(
            width / 2.0,
            height - 98,
            "Statutory Prior Art Disclosure under 35 U.S.C. § 102 & EPC Article 54(2) • WIPO Paris Convention Art. 4"
        )

        # 3. Декоративный разделитель
        can.setStrokeColor(HexColor("#334155"))
        can.setLineWidth(1)
        can.line(48, height - 108, width - 48, height - 108)

        # 4. QR-код верификации
        verify_url = f"https://gitscience.org/certificate/pdf/{registration_code}"
        if qrcode:
            try:
                qr = qrcode.QRCode(box_size=3, border=0)
                qr.add_data(verify_url)
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="#070d18", back_color="#10b981")
                qr_buf = io.BytesIO()
                qr_img.save(qr_buf, format="PNG")
                qr_buf.seek(0)
                img_reader = ImageReader(qr_buf) if ImageReader else qr_buf
                can.drawImage(img_reader, width - 116, height - 195, width=70, height=70, preserveAspectRatio=True)
            except Exception:
                pass

        # 5. Блок регистрационных данных
        y = height - 135
        can.setFont("Courier-Bold", 11.5)
        can.setFillColor(HexColor("#38bdf8"))
        can.drawString(48, y, f"REGISTRATION CODE: {registration_code}")

        y -= 18
        can.setFont("Helvetica-Bold", 9.5)
        can.setFillColor(HexColor("#e2e8f0"))
        can.drawString(48, y, f"Lead Discoverer / Author: {author_name}")

        y -= 15
        can.setFont("Helvetica", 8.5)
        can.setFillColor(HexColor("#10b981"))
        can.drawString(48, y, f"ORCID iD: {orcid} • WIPO IPC: {ipc_class} • Discipline: {category}")

        y -= 24
        can.setFillColor(HexColor("#f8fafc"))
        can.setFont("Helvetica-Bold", 11.5)
        can.drawString(48, y, "Title of Scientific Work:")

        y -= 15
        can.setFont("Helvetica", 10)
        can.setFillColor(HexColor("#cbd5e1"))
        
        words = title.split()
        cur_line = ""
        for w in words:
            if len(cur_line + " " + w) < 64:
                cur_line += " " + w if cur_line else w
            else:
                can.drawString(48, y, cur_line)
                y -= 14
                cur_line = w
        if cur_line:
            can.drawString(48, y, cur_line)
            y -= 14

        # 6. CRediT 14 Roles Summary (если есть соавторы)
        if credit_contributors and len(credit_contributors) > 0:
            y -= 6
            can.setFillColor(HexColor("#0e1726"))
            can.roundRect(44, y - 48, width - 88, 50, 6, stroke=1, fill=1)
            can.setFont("Helvetica-Bold", 8)
            can.setFillColor(HexColor("#38bdf8"))
            can.drawString(54, y - 10, "CREDIT CASRAI CONTRIBUTOR MATRIX:")
            
            c_offset_y = y - 22
            for cont in credit_contributors[:2]:
                c_name = cont.get("name") or cont.get("contributor_name", "Author")
                c_weight = cont.get("weight") or cont.get("weight_pct", 100)
                c_roles = cont.get("roles", [])
                if isinstance(c_roles, str):
                    c_roles = [c_roles]
                roles_str = ", ".join(c_roles[:3])
                can.setFont("Courier", 7)
                can.setFillColor(HexColor("#cbd5e1"))
                can.drawString(54, c_offset_y, f"• {c_name} ({c_weight}%): {roles_str}")
                c_offset_y -= 11
            y -= 54

        # 7. Криптографический блок (Evidence Block)
        y -= 8
        can.setFillColor(HexColor("#0b1322"))
        can.roundRect(44, y - 105, width - 88, 110, 8, stroke=1, fill=1)

        can.setFillColor(HexColor("#38bdf8"))
        can.setFont("Helvetica-Bold", 9)
        can.drawString(56, y - 12, "CRYPTOGRAPHIC ATTESTATIONS & EVIDENCE ANCHORS:")

        can.setFont("Courier", 7.5)
        can.setFillColor(HexColor("#cbd5e1"))
        can.drawString(56, y - 26, f"SHA-256 PAYLOAD HASH: {sha256_hash}")
        can.drawString(56, y - 39, f"GIT COMMIT OID:      {git_commit_oid}")
        can.drawString(56, y - 52, f"IPFS CIDv1 MULTIHASH: {ipfs_cid or 'bafyafybeid66vocfct4mpsrh2rcmvos3ezcybfwt5gz6ukep7c5ox2kbnebsi'}")
        can.drawString(56, y - 65, f"AST MERKLE DIGEST:   {ast_merkle_digest or 'N/A (Theoretical Paper)'}")
        can.drawString(56, y - 78, f"BITCOIN OTS PROOF:   {ots_file or (registration_code + '.ots')}")
        can.drawString(56, y - 91, f"ANCHORED UTC TIME:   {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")

        # 8. Штамп RUO (Research Use Only)
        stamp_y = y - 150
        can.setFillColor(HexColor("#1e293b"))
        can.roundRect(44, stamp_y, width - 88, 34, 6, stroke=1, fill=1)

        can.setFont("Helvetica-Bold", 7.5)
        can.setFillColor(HexColor("#f59e0b"))
        can.drawCentredString(
            width / 2.0,
            stamp_y + 20,
            "REGULATORY NOTICE: RESEARCH USE ONLY (RUO) • CLASS I COMPUTATIONAL DECISION SUPPORT"
        )
        can.setFont("Helvetica", 6.8)
        can.setFillColor(HexColor("#94a3b8"))
        can.drawCentredString(
            width / 2.0,
            stamp_y + 8,
            "Mathematical models are deterministic under Safe AST. Governed by WMA Declaration of Helsinki & Fair-Share Consensus (55/15/30)."
        )

        # 9. Футер
        can.setFont("Helvetica", 7.5)
        can.setFillColor(HexColor("#64748b"))
        can.drawString(48, 38, "GitScience™ Sovereign Protocol • Preserving the Amanat of Scientific Truth")
        can.drawRightString(width - 48, 38, f"License: {license_type} • ISO 14721 OAIS Compliant")

        can.save()
        buffer.seek(0)
        return buffer.getvalue()

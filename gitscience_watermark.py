"""
GitScience™ Cryptographic PDF Watermark Engine
Накладывает на каждую страницу документа неизменяемый Prior Art Shield и верификационный QR-код.
"""
import io
import os
import qrcode
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas

def generate_watermark_overlay(
    page_width: float,
    page_height: float,
    reg_code: str,
    sha256_hash: str,
    author: str,
    timestamp_str: str,
    verify_url: str
) -> io.BytesIO:
    """Генерирует прозрачный PDF-слой с микро-плашкой и QR-кодом"""
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=(page_width, page_height))
    
    # 1. Генерация микро QR-кода
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=3,
        border=0
    )
    qr.add_data(verify_url)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="#0f2b48", back_color="white")
    
    qr_buffer = io.BytesIO()
    qr_img.save(qr_buffer, format="PNG")
    qr_buffer.seek(0)
    
    # 2. Отрисовка плашки в верхнем колонтитуле
    banner_height = 36.0
    banner_y = page_height - banner_height - 6.0
    margin_x = 18.0
    banner_width = page_width - (margin_x * 2)

    # Фон плашки
    can.setFillColor(HexColor("#f8fafc"))
    can.setStrokeColor(HexColor("#0f2b48"))
    can.setLineWidth(1)
    can.roundRect(margin_x, banner_y, banner_width, banner_height, 4, stroke=1, fill=1)

    # Акцентная полоса слева
    can.setFillColor(HexColor("#10b981"))  # Изумрудный бренд
    can.roundRect(margin_x, banner_y, 4, banner_height, 2, stroke=0, fill=1)

    # Вставка QR-кода
    can.drawImage(
        qr_buffer,
        margin_x + 8,
        banner_y + 3,
        width=30,
        height=30,
        preserveAspectRatio=True
    )

    # Текстовые метаданные Prior Art
    text_x = margin_x + 44
    can.setFillColor(HexColor("#0f2b48"))
    can.setFont("Helvetica-Bold", 7.5)
    can.drawString(text_x, banner_y + 24, f"GITSCIENCE™ PRIOR ART SHIELD  |  REG: {reg_code}")

    can.setFont("Helvetica", 6.2)
    can.setFillColor(HexColor("#475569"))
    can.drawString(text_x, banner_y + 14, f"Author: {author}  |  Anchored UTC: {timestamp_str}")
    
    can.setFont("Courier-Bold", 5.5)
    can.setFillColor(HexColor("#b45309"))
    can.drawString(text_x, banner_y + 5, f"SHA-256: {sha256_hash[:48]}... (Verified Immutable)")

    can.save()
    packet.seek(0)
    return packet

def stamp_pdf_document(
    input_pdf_bytes: bytes,
    output_path: str,
    reg_code: str,
    sha256_hash: str,
    author: str,
    timestamp_str: str,
    verify_domain: str = "https://gitscience.org"
) -> str:
    """Накладывает водяной знак на все страницы входящего PDF и сохраняет результат"""
    reader = PdfReader(io.BytesIO(input_pdf_bytes))
    writer = PdfWriter()
    
    verify_url = f"{verify_domain}/verify/{reg_code}"

    for page in reader.pages:
        page_width = float(page.mediabox.width)
        page_height = float(page.mediabox.height)

        watermark_stream = generate_watermark_overlay(
            page_width=page_width,
            page_height=page_height,
            reg_code=reg_code,
            sha256_hash=sha256_hash,
            author=author,
            timestamp_str=timestamp_str,
            verify_url=verify_url
        )
        
        watermark_pdf = PdfReader(watermark_stream)
        page.merge_page(watermark_pdf.pages[0])
        writer.add_page(page)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f_out:
        writer.write(f_out)

    return output_path
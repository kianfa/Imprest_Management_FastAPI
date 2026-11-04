import io
import os
from pathlib import Path
from typing import List, Any
import httpx
from PIL import Image as PILImage

# ReportLab Core Imports
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image as RLImage
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Persian Shaping & BiDi
import arabic_reshaper
from bidi.algorithm import get_display

from app.models.record import ExpenseRecord
from app.utils.solar_date import get_current_jalali_date


# ==========================================
# 1. CROSS-PLATFORM FONT REGISTRATION
# ==========================================
def register_persian_font():
    """
    Registers a Persian TrueType font cross-platform:
    1. Checks the project's internal 'app/static/fonts/' folder (Works anywhere: Windows, Linux, Docker).
    2. Fallback: Checks Windows system fonts (C:/Windows/Fonts/tahoma.ttf).
    3. Fallback: Checks standard Linux system fonts (/usr/share/fonts/).
    """
    base_dir = Path(__file__).resolve().parent.parent  # points to 'app/'
    project_font_vazir = base_dir / "static" / "fonts" / "Vazirmatn-Regular.ttf"
    project_font_tahoma = base_dir / "static" / "fonts" / "tahoma.ttf"

    # Priority 1: Bundled project fonts (Recommended for Docker / Linux production)
    if project_font_vazir.exists():
        pdfmetrics.registerFont(TTFont("PersianFont", str(project_font_vazir)))
        pdfmetrics.registerFont(TTFont("PersianFont-Bold", str(project_font_vazir)))
        return

    if project_font_tahoma.exists():
        pdfmetrics.registerFont(TTFont("PersianFont", str(project_font_tahoma)))
        pdfmetrics.registerFont(TTFont("PersianFont-Bold", str(project_font_tahoma)))
        return

    # Priority 2: Local Windows fallback
    windows_tahoma = Path("C:/Windows/Fonts/tahoma.ttf")
    windows_tahoma_bd = Path("C:/Windows/Fonts/tahomabd.ttf")
    if windows_tahoma.exists():
        pdfmetrics.registerFont(TTFont("PersianFont", str(windows_tahoma)))
        pdfmetrics.registerFont(TTFont("PersianFont-Bold", str(windows_tahoma_bd if windows_tahoma_bd.exists() else windows_tahoma)))
        return

    # Priority 3: Standard Linux OS fallback
    linux_fonts = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for lf in linux_fonts:
        if Path(lf).exists():
            pdfmetrics.registerFont(TTFont("PersianFont", lf))
            pdfmetrics.registerFont(TTFont("PersianFont-Bold", lf))
            return

    # Final fallback if nothing else is found
    pdfmetrics.registerFont(TTFont("PersianFont", "Helvetica"))
    pdfmetrics.registerFont(TTFont("PersianFont-Bold", "Helvetica-Bold"))


# Register font on service initialization
register_persian_font()


# ==========================================
# 2. PERSIAN TEXT HELPER (Ligatures & RTL)
# ==========================================
def fa(text: Any) -> str:
    """Takes any text or number, reshapes Persian letters, and sets correct RTL direction."""
    if text is None:
        return ""
    text_str = str(text)
    if not text_str.strip():
        return ""
    reshaped = arabic_reshaper.reshape(text_str)
    return get_display(reshaped)


# ==========================================
# 3. PDF GENERATION ENGINE
# ==========================================
def export_records_to_pdf(
    records: List[ExpenseRecord],
    company_name: str = "Company",
    include_receipts: bool = True
) -> io.BytesIO:
    """
    Builds a professional A4 Landscape PDF with:
    - Persian header & metadata (Company name, Shamsi date)
    - Full expense records table with accounting totals
    - Attached receipt photos fetched from Supabase CDN
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=20,
        leftMargin=20,
        topMargin=25,
        bottomMargin=20
    )

    story = []

    # --- Styles ---
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name="TitleStyle",
        fontName="PersianFont-Bold",
        fontSize=16,
        alignment=1,  # Center
        textColor=colors.HexColor("#1F4E78")
    )
    meta_style = ParagraphStyle(
        name="MetaStyle",
        fontName="PersianFont",
        fontSize=10,
        alignment=2,  # Right-aligned for Persian
        textColor=colors.HexColor("#333333")
    )
    table_cell_style = ParagraphStyle(
        name="TableCell",
        fontName="PersianFont",
        fontSize=9,
        alignment=1,  # Center
        leading=11
    )
    table_header_style = ParagraphStyle(
        name="TableHeader",
        fontName="PersianFont-Bold",
        fontSize=9,
        alignment=1,
        textColor=colors.white,
        leading=11
    )

    # --- Header Information ---
    story.append(Paragraph(fa(f"گزارش صورت هزینه تنخواه - {company_name}"), title_style))
    story.append(Spacer(1, 10))

    today_shamsi = get_current_jalali_date()
    meta_text = f"تاریخ تهیه گزارش: {today_shamsi}   |   تعداد رکوردها: {len(records)}"
    story.append(Paragraph(fa(meta_text), meta_style))
    story.append(Spacer(1, 12))

    # --- Table Columns (RTL Order: Column 1 is rightmost in Persian) ---
    headers = [
        "ردیف",
        "شماره فاکتور",
        "کد پروژه",
        "تاریخ (شمسی)",
        "مبلغ (ریال)",
        "مرکز هزینه",
        "نوع هزینه",
        "توضیحات",
        "ثبت کننده"
    ]
    # Reverse columns for visual Right-to-Left table reading
    rtl_headers = list(reversed(headers))

    table_data = []
    # Header row
    table_data.append([Paragraph(fa(h), table_header_style) for h in rtl_headers])

    total_amount = 0.0
    for idx, r in enumerate(records, start=1):
        amount_val = float(r.amount) if r.amount else 0.0
        total_amount += amount_val

        row = [
            str(idx),
            r.invoice_no,
            r.project_code,
            r.record_date,
            f"{int(amount_val):,}",
            r.expense_center or "-",
            r.expense_type or "-",
            r.explanation or "-",
            r.created_by_name or "-"
        ]
        # Reverse row cells to match RTL headers
        rtl_row = list(reversed(row))
        table_data.append([Paragraph(fa(cell), table_cell_style) for cell in rtl_row])

    # Total Row at the bottom
    total_row = [
        "",  # row number
        "جمع کل",
        "",
        "",
        f"{int(total_amount):,}",
        "",
        "",
        "",
        ""
    ]
    table_data.append([Paragraph(fa(c), table_header_style) for c in list(reversed(total_row))])

    # Table Geometry (Column widths in points; total ~800 for A4 landscape)
    col_widths = [80, 150, 75, 75, 80, 70, 70, 70, 30]

    record_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    record_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1F4E78")),  # Navy Header
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CCCCCC")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor("#F9F9F9")]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#2C3E50")),  # Dark footer for totals
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(record_table)

    # --- Receipt Images Section ---
    if include_receipts:
        receipt_images_exist = any(r.images for r in records)
        if receipt_images_exist:
            client = httpx.Client(timeout=10.0)
            try:
                for r in records:
                    if not r.images:
                        continue

                    for img_obj in r.images:
                        # 1. Put EACH receipt on its OWN fresh full page!
                        story.append(PageBreak())

                        # 2. Clean header on top of the receipt
                        receipt_title = f"ضمیمه فاکتور: {r.invoice_no}   |   پروژه: {r.project_code}"
                        story.append(Paragraph(fa(receipt_title), title_style))
                        story.append(Spacer(1, 15))

                        try:
                            resp = client.get(img_obj.file_path)
                            if resp.status_code == 200:
                                img_bytes = io.BytesIO(resp.content)

                                # 3. HUGE Dimensions for A4 Landscape (Page is 842 x 595)
                                max_w = 700  # Wide enough to fill the entire page
                                max_h = 450  # Tall enough to fill the page without overflowing

                                with PILImage.open(img_bytes) as pil_img:
                                    w, h = pil_img.size
                                    aspect = h / float(w)

                                    display_width = max_w
                                    display_height = max_w * aspect

                                    if display_height > max_h:
                                        display_height = max_h
                                        display_width = max_h / aspect

                                img_bytes.seek(0)
                                rl_img = RLImage(img_bytes, width=display_width, height=display_height)
                                rl_img.hAlign = 'CENTER'  # Center on page

                                story.append(rl_img)
                        except Exception:
                            continue
            finally:
                client.close()

    # Build PDF into the in-memory buffer
    doc.build(story)
    buffer.seek(0)
    return buffer
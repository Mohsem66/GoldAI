import os
import urllib.request
import arabic_reshaper
from bidi.algorithm import get_display

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

FONT_PATH = "/tmp/Vazirmatn.ttf"
SYSTEM_FONT_PATH = "/rom/opt/flutter/engine/src/flutter/txt/third_party/fonts/NotoNaskhArabic-Regular.ttf"

# Robust Font Resolution
if not os.path.exists(FONT_PATH):
    if os.path.exists(SYSTEM_FONT_PATH):
        FONT_PATH = SYSTEM_FONT_PATH
    else:
        try:
            url = "https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Regular.ttf"
            urllib.request.urlretrieve(url, FONT_PATH)
        except Exception:
            FONT_PATH = None

if FONT_PATH and os.path.exists(FONT_PATH):
    pdfmetrics.registerFont(TTFont("PersianFont", FONT_PATH))
    ACTIVE_FONT = "PersianFont"
else:
    ACTIVE_FONT = "Helvetica"

def fa(text):
    """Helper to reshape and format Persian text for ReportLab PDF rendering."""
    if not text:
        return ""
    lines = str(text).split("\n")
    processed_lines = []
    for line in lines:
        reshaped = arabic_reshaper.reshape(line)
        bidi_text = get_display(reshaped)
        processed_lines.append(bidi_text)
    return "\n".join(processed_lines)

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont(ACTIVE_FONT, 9)
        self.setFillColor(colors.HexColor("#64748b"))

        # Footer
        footer_text = fa(f"کتابچه آموزش جامع و کاربردی اکسل  |  صفحه {self._pageNumber} از {page_count}")
        self.drawCentredString(A4[0] / 2.0, 1.2 * cm, footer_text)

        # Header bar (pages > 1)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(2 * cm, A4[1] - 1.5 * cm, A4[0] - 2 * cm, A4[1] - 1.5 * cm)
            header_text = fa("آموزش کامل اکسل (Excel 2024 / 365)")
            self.drawRightString(A4[0] - 2 * cm, A4[1] - 1.2 * cm, header_text)

        self.restoreState()

def build_pdf():
    pdf_filename = "Excel_Complete_Tutorial_Fa.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm
    )

    styles = getSampleStyleSheet()

    # Custom Persian Paragraph Styles
    title_style = ParagraphStyle(
        'FaTitle',
        parent=styles['Heading1'],
        fontName=ACTIVE_FONT,
        fontSize=22,
        leading=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'FaSubtitle',
        parent=styles['Normal'],
        fontName=ACTIVE_FONT,
        fontSize=12,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0284c7"),
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'FaH1',
        fontName=ACTIVE_FONT,
        fontSize=14,
        leading=20,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#0f766e"),
        spaceBefore=16,
        spaceAfter=10
    )

    h2_style = ParagraphStyle(
        'FaH2',
        fontName=ACTIVE_FONT,
        fontSize=11,
        leading=16,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'FaBody',
        fontName=ACTIVE_FONT,
        fontSize=9.5,
        leading=16,
        alignment=TA_RIGHT,
        textColor=colors.HexColor("#334155"),
        spaceAfter=8
    )

    code_style = ParagraphStyle(
        'FaCode',
        fontName=ACTIVE_FONT,
        fontSize=9,
        leading=14,
        alignment=TA_LEFT,
        textColor=colors.HexColor("#0f172a"),
        backColor=colors.HexColor("#f1f5f9"),
        borderColor=colors.HexColor("#cbd5e1"),
        borderWidth=0.5,
        borderPadding=6,
        spaceAfter=10,
        borderRadius=4
    )

    table_text_style = ParagraphStyle(
        'FaTableText',
        fontName=ACTIVE_FONT,
        fontSize=8.5,
        leading=13,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#1e293b")
    )

    table_header_style = ParagraphStyle(
        'FaTableHeader',
        fontName=ACTIVE_FONT,
        fontSize=9,
        leading=14,
        alignment=TA_CENTER,
        textColor=colors.white
    )

    story = []

    # Title & Header Banner
    story.append(Paragraph(fa("کتابچه آموزش جامع و کاربردی مایکروسافت اکسل"), title_style))
    story.append(Paragraph(fa("از مفاهیم پایه تا فرمول‌نویسی پیشرفته، توابع کاربردی و جداول پویای Pivot Table"), subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=15))

    # Chapter 1
    story.append(Paragraph(fa("فصل اول: آشنایی با محیط اکسل و مفاهیم اولیه"), h1_style))
    story.append(Paragraph(fa("نرم‌افزار مایکروسافت اکسل (Microsoft Excel) یک صفحه گسترده (Spreadsheet) قدرتمند است که برای سازمان‌دهی، تحلیل، محاسبه و بصری‌سازی داده‌ها استفاده می‌شود."), body_style))
    story.append(Paragraph(fa("مفاهیم کلیدی محیط اکسل:"), h2_style))

    basics_info = [
        [Paragraph(fa("توضیحات و کاربرد"), table_header_style), Paragraph(fa("عنوان بخش"), table_header_style)],
        [Paragraph(fa("محل قرارگیری دستورات و ابزارهای اصلی اکسل (Home, Insert, Page Layout)"), table_text_style), Paragraph(fa("نوار ابزار (Ribbon)"), table_text_style)],
        [Paragraph(fa("کوچک‌ترین واحد ذخیره داده که از برخورد سطر و ستون تشکیل می‌شود (مانند A1)"), table_text_style), Paragraph(fa("سلول (Cell)"), table_text_style)],
        [Paragraph(fa("نمایش آدرس سلول فعال در گوشه سمت چپ بالای صفحه"), table_text_style), Paragraph(fa("جعبه نام (Name Box)"), table_text_style)],
        [Paragraph(fa("محل درج و مشاهده فرمول‌ها و محتوای سلول انتخاب‌شده"), table_text_style), Paragraph(fa("نوار فرمول (Formula Bar)"), table_text_style)],
        [Paragraph(fa("برگه‌های کاری درون یک فایل اکسل که می‌توان برگه جدید ایجاد کرد"), table_text_style), Paragraph(fa("شیت (Worksheet)"), table_text_style)],
    ]
    t_basics = Table(basics_info, colWidths=[11 * cm, 5 * cm])
    t_basics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f766e")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_basics)
    story.append(Spacer(1, 12))

    # Chapter 2
    story.append(Paragraph(fa("فصل دوم: کلیدهای میانبر ضروری (Shortcuts)"), h1_style))
    story.append(Paragraph(fa("استفاده از میانبرهای کیبورد سرعت کار شما را در اکسل تا چند برابر افزایش می‌دهد:"), body_style))

    shortcuts_data = [
        [Paragraph(fa("عملکرد"), table_header_style), Paragraph(fa("کلید میانبر (Shortcut)"), table_header_style)],
        [Paragraph(fa("تبدیل محدوده به جدول هوشمند (Excel Table)"), table_text_style), Paragraph(fa("Ctrl + T"), table_text_style)],
        [Paragraph(fa("جمع‌زدن سریع اعداد سلول‌های بالایی یا کناری"), table_text_style), Paragraph(fa("Alt + ="), table_text_style)],
        [Paragraph(fa("باز کردن پنجره فرمت‌دهی سلول‌ها (Format Cells)"), table_text_style), Paragraph(fa("Ctrl + 1"), table_text_style)],
        [Paragraph(fa("قفل کردن آدرس سلول (مطلق‌سازی با علامت $)"), table_text_style), Paragraph(fa("F4"), table_text_style)],
        [Paragraph(fa("درج تاریخ امروز درون سلول"), table_text_style), Paragraph(fa("Ctrl + ;"), table_text_style)],
        [Paragraph(fa("انتخاب کل داده‌های پیوسته جدول"), table_text_style), Paragraph(fa("Ctrl + A"), table_text_style)],
    ]
    t_shortcuts = Table(shortcuts_data, colWidths=[11 * cm, 5 * cm])
    t_shortcuts.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0284c7")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_shortcuts)
    story.append(Spacer(1, 15))

    story.append(PageBreak())

    # Chapter 3
    story.append(Paragraph(fa("فصل سوم: فرمول‌نویسی و توابع اصلی محاسباتی"), h1_style))
    story.append(Paragraph(fa("تمام فرمول‌ها در اکسل با علامت مساوی (=) شروع می‌شوند. اولویت محاسبات ریاضی به ترتیب عبارتند از: پرانتز، توان، ضرب و تقسیم، جمع و تفریق."), body_style))

    story.append(Paragraph(fa("۱. توابع پایه محاسباتی:"), h2_style))
    story.append(Paragraph(fa("• تابع SUM: محاسبه مجموع مقادیر یک محدوده -> =SUM(A1:A10)"), body_style))
    story.append(Paragraph(fa("• تابع AVERAGE: محاسبه میانگین مقادیر -> =AVERAGE(B1:B20)"), body_style))
    story.append(Paragraph(fa("• تابع COUNT: شمارش سلول‌های حاوی عدد -> =COUNT(C1:C15)"), body_style))
    story.append(Paragraph(fa("• تابع MAX / MIN: یافتن بزرگ‌ترین و کوچک‌ترین مقدار -> =MAX(D1:D100)"), body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph(fa("۲. توابع شرطی (Conditional Functions):"), h2_style))
    story.append(Paragraph(fa("تابع شرطی IF برای بررسی یک شرط و بازگرداندن دو پاسخ متفاوت در صورت درستی یا نادرستی استفاده می‌شود:"), body_style))
    story.append(Paragraph("SYNTAX: =IF(Logical_Test, Value_if_true, Value_if_false)", code_style))
    story.append(Paragraph(fa("مثال: اگر نمره دانش‌آموز در سلول A1 بیشتر یا مساوی ۱۰ باشد عبارت 'قبول' و در غیر این صورت 'مردود' نمایش داده شود:"), body_style))
    story.append(Paragraph('EXAMPLE: =IF(A1 >= 10, "قبول", "مردود")', code_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph(fa("۳. توابع SUMIF و SUMIFS (جمع شرطی):"), h2_style))
    story.append(Paragraph(fa("برای جمع زدن مقادیر بر اساس یک یا چند شرط استفاده می‌شوند:"), body_style))
    story.append(Paragraph('SYNTAX: =SUMIFS(Sum_Range, Criteria_Range1, Criteria1, ...)', code_style))
    story.append(Paragraph(fa("مثال: جمع فروش محصولات برند 'Samsung' در منطقه 'Tehran':"), body_style))
    story.append(Paragraph('EXAMPLE: =SUMIFS(C2:C100, A2:A100, "Samsung", B2:B100, "Tehran")', code_style))

    story.append(Spacer(1, 12))

    # Chapter 4
    story.append(Paragraph(fa("فصل چهارم: توابع پیشرفته جستجو (VLOOKUP و XLOOKUP)"), h1_style))
    story.append(Paragraph(fa("توابع جستجو برای یافتن یک مقدار در یک جدول و بازگرداندن اطلاعات مرتبط از ستون‌های دیگر به کار می‌روند."), body_style))

    story.append(Paragraph(fa("۱. تابع VLOOKUP (جستجوی عمودی):"), h2_style))
    story.append(Paragraph(fa("این تابع یک مقدار را در ستون اول جدول جستجو کرده و مقدار هم‌سطح آن را از ستون مشخص‌شده می‌خواند."), body_style))
    story.append(Paragraph('SYNTAX: =VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])', code_style))
    story.append(Paragraph(fa("نکته مهم: مقدار range_lookup را معمولاً 0 یا FALSE بگذارید تا جستجوی دقیق (Exact Match) انجام شود."), body_style))

    story.append(Paragraph(fa("۲. تابع مدرن XLOOKUP (جایگزین هوشمند VLOOKUP):"), h2_style))
    story.append(Paragraph(fa("در نسخه‌های جدید اکسل (2021 و 365)، تابع XLOOKUP محدودیت‌های VLOOKUP (مانند عدم توانایی جستجو به سمت چپ) را کاملاً برطرف کرده است."), body_style))
    story.append(Paragraph('SYNTAX: =XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])', code_style))
    story.append(Paragraph(fa("مثال: جستجوی کد کارمندی (A2) در ستون کدها (E2:E100) و بازگرداندن نام (F2:F100):"), body_style))
    story.append(Paragraph('EXAMPLE: =XLOOKUP(A2, E2:E100, F2:F100, "یافت نشد")', code_style))

    story.append(PageBreak())

    # Chapter 5
    story.append(Paragraph(fa("فصل پنجم: جداول محوری (Pivot Tables) و تحلیل داده‌ها"), h1_style))
    story.append(Paragraph(fa("جدول محوری (Pivot Table) یکی از قوی‌ترین ابزارهای اکسل برای خلاصه‌سازی، خلاصه‌سازی پویا و تحلیل میلیون‌ها سطر داده بدون نیاز به فرمول‌نویسی است."), body_style))

    story.append(Paragraph(fa("مراحل ساخت Pivot Table:"), h2_style))
    story.append(Paragraph(fa("۱. کل جدول داده‌های خود را انتخاب کنید (یا کلید Ctrl + A را بزنید)."), body_style))
    story.append(Paragraph(fa("۲. از نوار ابزار بالا به تب Insert رفته و روی گزینه‌ی PivotTable کلیک کنید."), body_style))
    story.append(Paragraph(fa("۳. محل قرارگیری گزارش (در برگه جدید یا برگه فعلی) را تعیین کنید."), body_style))
    story.append(Paragraph(fa("۴. در پنجره PivotTable Fields، فیلدها را در ۴ ناحیه زیر درگ (Drag) کنید:"), body_style))

    pivot_fields = [
        [Paragraph(fa("کاربرد"), table_header_style), Paragraph(fa("ناحیه (Area)"), table_header_style)],
        [Paragraph(fa("فیلدهایی که می‌خواهید محاسبات روی آن‌ها انجام شود (مانند جمع فروش، میانگین قیمت)"), table_text_style), Paragraph(fa("Values"), table_text_style)],
        [Paragraph(fa("فیلدهایی که می‌خواهید به عنوان عناوین سطرها قرار گیرند (مانند نام محصولات)"), table_text_style), Paragraph(fa("Rows"), table_text_style)],
        [Paragraph(fa("فیلدهایی که به عنوان عناوین ستون‌ها ظاهر می‌شوند (مانند سال یا فصل)"), table_text_style), Paragraph(fa("Columns"), table_text_style)],
        [Paragraph(fa("فیلتر کردن کل گزارش بر اساس یک متغیر مشخص (مانند نام کشور یا شعب)"), table_text_style), Paragraph(fa("Filters"), table_text_style)],
    ]
    t_pivot = Table(pivot_fields, colWidths=[11 * cm, 5 * cm])
    t_pivot.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f766e")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_pivot)
    story.append(Spacer(1, 15))

    # Chapter 6
    story.append(Paragraph(fa("فصل ششم: کاندیشنال فرمتینگ و نمودارها (Conditional Formatting & Charts)"), h1_style))
    story.append(Paragraph(fa("بصری‌سازی داده‌ها به تصمیم‌گیری سریع‌تر مدیران و تحلیل‌گران کمک شایانی می‌کند."), body_style))

    story.append(Paragraph(fa("۱. فرمت‌دهی شرطی (Conditional Formatting):"), h2_style))
    story.append(Paragraph(fa("با استفاده از گزینه‌ی Conditional Formatting در تب Home می‌توانید رنگ سلول‌ها را بر اساس ارزش محتوای آن‌ها به صورت هوشمند تغییر دهید (مانند رنگ سبز برای سودها و قرمز برای زیان‌ها یا نمایش آیکون‌های رتبه‌بندی)."), body_style))

    story.append(Paragraph(fa("۲. رسم نمودارها (Charts):"), h2_style))
    story.append(Paragraph(fa("• نمودار ستونی (Column/Bar Chart): بهترین گزینه برای مقایسه مقادیر دسته‌های مختلف."), body_style))
    story.append(Paragraph(fa("• نمودار خطی (Line Chart): عالی برای نمایش روند تغییرات در طول زمان (Time Series)."), body_style))
    story.append(Paragraph(fa("• نمودار دایره‌ای (Pie Chart): مناسب برای نمایش سهم هر بخش از کل (درصدی)."), body_style))

    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=15))
    story.append(Paragraph(fa("پایان کتابچه آموزشی — تهیه شده برای کاربران محترم"), ParagraphStyle('EndStyle', parent=body_style, alignment=TA_CENTER, textColor=colors.HexColor("#64748b"))))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF Generated successfully: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()

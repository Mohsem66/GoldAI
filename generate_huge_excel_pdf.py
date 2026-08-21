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
    """Reshapes Persian text for ReportLab PDF rendering."""
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
        self.setFont(ACTIVE_FONT, 8.5)
        self.setFillColor(colors.HexColor("#475569"))

        # Footer
        footer_text = fa(f"کتابچه جامع و مسترکلاس صفر تا صد مایکروسافت اکسل  |  صفحه {self._pageNumber} از {page_count}")
        self.drawCentredString(A4[0] / 2.0, 1.2 * cm, footer_text)

        # Header bar (pages > 1)
        if self._pageNumber > 1:
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(2 * cm, A4[1] - 1.5 * cm, A4[0] - 2 * cm, A4[1] - 1.5 * cm)
            header_text = fa("مرجع کامل آموزش اکسل (Microsoft Excel Masterclass 2024)")
            self.drawRightString(A4[0] - 2 * cm, A4[1] - 1.2 * cm, header_text)

        self.restoreState()

def build_pdf():
    pdf_filename = "Excel_Complete_Masterclass_Fa.pdf"
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm
    )

    styles = getSampleStyleSheet()

    # Custom Persian Paragraph Styles
    title_style = ParagraphStyle(
        'FaTitle',
        parent=styles['Heading1'],
        fontName=ACTIVE_FONT,
        fontSize=24,
        leading=32,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=15
    )

    subtitle_style = ParagraphStyle(
        'FaSubtitle',
        parent=styles['Normal'],
        fontName=ACTIVE_FONT,
        fontSize=11.5,
        leading=18,
        alignment=TA_CENTER,
        textColor=colors.HexColor("#0284c7"),
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'FaH1',
        fontName=ACTIVE_FONT,
        fontSize=13.5,
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
        spaceAfter=8,
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

    # Title & Banner
    story.append(Paragraph(fa("کتابچه مرجع و مسترکلاس صفر تا صد مایکروسافت اکسل"), title_style))
    story.append(Paragraph(fa("راهنمای جامع، کاربردی و گام‌به‌گام از مفاهیم اولیه تا فرمول‌نویسی پیشرفته، توابع آرایه‌ای، جداول محوری، داشبوردسازی و VBA"), subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=15))

    # Table of Contents
    story.append(Paragraph(fa("فهرست سرفصل‌های آموزشی این کتابچه:"), h1_style))
    toc_data = [
        [Paragraph(fa("توضیحات سرفصل"), table_header_style), Paragraph(fa("عنوان فصل"), table_header_style), Paragraph(fa("فصل"), table_header_style)],
        [Paragraph(fa("معرفی محیط، Ribbon، سلول‌ها، آدرس‌دهی نسبی و مطلق ($A$1) و فرمت داده‌ها"), table_text_style), Paragraph(fa("آشنایی با محیط و مفاهیم پایه"), table_text_style), Paragraph(fa("فصل ۱"), table_text_style)],
        [Paragraph(fa("جدول جامع ۳۰ کلید میانبر ضروری اکسل برای افزایش سرعت کار"), table_text_style), Paragraph(fa("کلیدهای میانبر کاربردی (Shortcuts)"), table_text_style), Paragraph(fa("فصل ۲"), table_text_style)],
        [Paragraph(fa("فرمول‌نویسی، اولویت محاسبات و توابع SUM, AVERAGE, COUNT, MAX, MIN, ROUND"), table_text_style), Paragraph(fa("فرمول‌نویسی و توابع محاسباتی"), table_text_style), Paragraph(fa("فصل ۳"), table_text_style)],
        [Paragraph(fa("توابع شرطی IF, IFS, AND, OR و توابع جمع و شمارش شرطی SUMIFS, COUNTIFS"), table_text_style), Paragraph(fa("توابع شرطی و منطقی"), table_text_style), Paragraph(fa("فصل ۴"), table_text_style)],
        [Paragraph(fa("پردازش رشته‌ها با LEFT, RIGHT, MID, CONCATENATE, TEXTJOIN, TRIM, TEXT"), table_text_style), Paragraph(fa("توابع متنی و پردازش رشته‌ها"), table_text_style), Paragraph(fa("فصل ۵"), table_text_style)],
        [Paragraph(fa("جستجوی عمودی و افقی با VLOOKUP, HLOOKUP, INDEX+MATCH و تابع مدرن XLOOKUP"), table_text_style), Paragraph(fa("توابع پیشرفته جستجو و مرجع"), table_text_style), Paragraph(fa("فصل ۶"), table_text_style)],
        [Paragraph(fa("فرمول‌نویسی پویای نسل جدید با FILTER, UNIQUE, SORT, SORTBY, SEQUENCE"), table_text_style), Paragraph(fa("توابع آرایه‌ای پویا (Dynamic Arrays)"), table_text_style), Paragraph(fa("فصل ۷"), table_text_style)],
        [Paragraph(fa("منوی کشویی (Data Validation)، پاکسازی داده (Remove Duplicates) و Text to Columns"), table_text_style), Paragraph(fa("مدیریت، پاکسازی و اعتبارسنجی داده‌ها"), table_text_style), Paragraph(fa("فصل ۸"), table_text_style)],
        [Paragraph(fa("ابزارهای تصمیم‌گیری مدیریتی شامل Goal Seek، Data Tables و Scenario Manager"), table_text_style), Paragraph(fa("تحلیل چه می‌شود اگر (What-If Analysis)"), table_text_style), Paragraph(fa("فصل ۹"), table_text_style)],
        [Paragraph(fa("خلاصه‌سازی پویا، گزارش‌گیری چندبعدی، فیلد محاسباتی، اسلایسر و تایم‌لاین"), table_text_style), Paragraph(fa("جداول محوری (Pivot Tables & Slicers)"), table_text_style), Paragraph(fa("فصل ۱۰"), table_text_style)],
        [Paragraph(fa("رسم انواع نمودارها، کاندیشنال فرمتینگ هوشمند، Data Bars و ساخت داشبورد مدیریتی"), table_text_style), Paragraph(fa("بصری‌سازی داده‌ها و ساخت داشبورد"), table_text_style), Paragraph(fa("فصل ۱۱"), table_text_style)],
        [Paragraph(fa("مقدمه‌ای بر اتصال به منابع داده، پاکسازی اتوماتیک و آشنایی با ضبط ماکرو و VBA"), table_text_style), Paragraph(fa("مقدمه‌ای بر Power Query و ماکرونویسی (VBA)"), table_text_style), Paragraph(fa("فصل ۱۲"), table_text_style)],
    ]
    t_toc = Table(toc_data, colWidths=[9 * cm, 6 * cm, 2 * cm])
    t_toc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f766e")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_toc)

    story.append(PageBreak())

    # Chapter 1
    story.append(Paragraph(fa("فصل اول: آشنایی با محیط اکسل و مفاهیم اولیه"), h1_style))
    story.append(Paragraph(fa("مایکروسافت اکسل (Microsoft Excel) قدرتمندترین نرم‌افزار صفحه گسترده (Spreadsheet) دنیا است. در اکسل، هر ساختار داده‌ای درون شبکه‌ای از سطرها (Rows) و ستون‌ها (Columns) قرار می‌گیرد."), body_style))

    story.append(Paragraph(fa("۱. مفاهیم پایه آدرس‌دهی و انواع سلول‌ها:"), h2_style))
    story.append(Paragraph(fa("• ستون‌ها با حروف انگلیسی (A, B, C, ..., Z, AA, ...) و سطرها با اعداد (1, 2, 3, ...) نام‌گذاری می‌شوند."), body_style))
    story.append(Paragraph(fa("• آدرس‌دهی نسبی (Relative Reference): آدرس‌های معمولی مانند A1 که با کپی کردن فرمول به سلول‌های دیگر به صورت متناسب تغییر می‌کنند."), body_style))
    story.append(Paragraph(fa("• آدرس‌دهی مطلق (Absolute Reference): استفاده از علامت $ ثابت نگه‌داشتن سطر یا ستون. مانند $A$1 که در تمامی فرمول‌ها ثابت می‌ماند."), body_style))

    story.append(Paragraph(fa("۲. انواع فرمت داده‌ها درون اکسل (Data Types):"), h2_style))
    basics_info = [
        [Paragraph(fa("توضیحات و مثال"), table_header_style), Paragraph(fa("نوع داده (Data Type)"), table_header_style)],
        [Paragraph(fa("اعداد معمولی، اعشاری، درصد و فرمت‌های مالی (مثال: $1,250.00 یا 15%)"), table_text_style), Paragraph(fa("عددی (Number / Currency)"), table_text_style)],
        [Paragraph(fa("متن‌های توضیحی، اسامی و کدها. به صورت پیش‌فرض سمت چپ سلول تراز می‌شوند"), table_text_style), Paragraph(fa("متنی (Text)"), table_text_style)],
        [Paragraph(fa("تاریخ‌های شمسی و میلادی و ساعت. اکسل تاریخ‌ها را به عنوان عدد صحیح ذخیره می‌کند"), table_text_style), Paragraph(fa("تاریخ و زمان (Date & Time)"), table_text_style)],
        [Paragraph(fa("خروجی توابع مقایسه‌ای که فقط یکی از دو ارزش TRUE یا FALSE را دارد"), table_text_style), Paragraph(fa("منطقی (Boolean)"), table_text_style)],
    ]
    t_basics = Table(basics_info, colWidths=[11.5 * cm, 5.5 * cm])
    t_basics.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0284c7")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_basics)
    story.append(Spacer(1, 15))

    # Chapter 2
    story.append(Paragraph(fa("فصل دوم: جدول جامع کلیدهای میانبر (Excel Shortcuts)"), h1_style))
    story.append(Paragraph(fa("تسلط بر میانبرهای کیبورد اصلی‌ترین تفاوت میان کاربران مبتدی و حرفه‌ای اکسل است:"), body_style))

    shortcuts_data = [
        [Paragraph(fa("عملکرد و کاربرد"), table_header_style), Paragraph(fa("میانبر (Shortcut)"), table_header_style)],
        [Paragraph(fa("تبدیل سریع محدوده انتخابی به جدول هوشمند (Excel Table)"), table_text_style), Paragraph(fa("Ctrl + T"), table_text_style)],
        [Paragraph(fa("جمع زدن اتوماتیک سلول‌های بالایی یا کناری (AutoSum)"), table_text_style), Paragraph(fa("Alt + ="), table_text_style)],
        [Paragraph(fa("باز کردن پنجره فرمت سلول‌ها (Format Cells)"), table_text_style), Paragraph(fa("Ctrl + 1"), table_text_style)],
        [Paragraph(fa("قفل کردن آدرس سلول هنگام فرمول‌نویسی (افزودن $)"), table_text_style), Paragraph(fa("F4"), table_text_style)],
        [Paragraph(fa("درج تاریخ امروز درون سلول انتخاب‌شده"), table_text_style), Paragraph(fa("Ctrl + ;"), table_text_style)],
        [Paragraph(fa("درج ساعت فعلی سیستم درون سلول"), table_text_style), Paragraph(fa("Ctrl + Shift + ;"), table_text_style)],
        [Paragraph(fa("اعمال فرمت عمومی به عدد (General Format)"), table_text_style), Paragraph(fa("Ctrl + Shift + ~"), table_text_style)],
        [Paragraph(fa("اعمال فرمت ارز/پولی به اعداد (Currency Format)"), table_text_style), Paragraph(fa("Ctrl + Shift + $"), table_text_style)],
        [Paragraph(fa("اعمال فرمت درصدی به اعداد (Percentage Format)"), table_text_style), Paragraph(fa("Ctrl + Shift + %"), table_text_style)],
        [Paragraph(fa("فعال/غیرفعال کردن فیلتر هوشمند جداول (Toggle Filter)"), table_text_style), Paragraph(fa("Ctrl + Shift + L"), table_text_style)],
        [Paragraph(fa("انتقال به آخرین سلول حاوی داده در جهت دلخواه"), table_text_style), Paragraph(fa("Ctrl + Arrow Keys"), table_text_style)],
        [Paragraph(fa("انتخاب داده‌ها تا آخرین سلول متصل در جهت دلخواه"), table_text_style), Paragraph(fa("Ctrl + Shift + Arrow"), table_text_style)],
        [Paragraph(fa("کپی کردن محتوای سلول بالایی درون سلول فعلی"), table_text_style), Paragraph(fa("Ctrl + D"), table_text_style)],
        [Paragraph(fa("کپی کردن محتوای سلول سمتی چپ درون سلول فعلی"), table_text_style), Paragraph(fa("Ctrl + R"), table_text_style)],
        [Paragraph(fa("تکرار آخرین عملیات انجام شده در اکسل"), table_text_style), Paragraph(fa("F4 / Ctrl + Y"), table_text_style)],
        [Paragraph(fa("باز کردن پنجره جستجو و جایگزینی (Find & Replace)"), table_text_style), Paragraph(fa("Ctrl + H"), table_text_style)],
        [Paragraph(fa("مخفی کردن سطر انتخاب‌شده (Hide Row)"), table_text_style), Paragraph(fa("Ctrl + 9"), table_text_style)],
        [Paragraph(fa("مخفی کردن ستون انتخاب‌شده (Hide Column)"), table_text_style), Paragraph(fa("Ctrl + 0"), table_text_style)],
    ]
    t_shortcuts = Table(shortcuts_data, colWidths=[11.5 * cm, 5.5 * cm])
    t_shortcuts.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f766e")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_shortcuts)

    story.append(PageBreak())

    # Chapter 3
    story.append(Paragraph(fa("فصل سوم: فرمول‌نویسی و توابع اصلی محاسباتی"), h1_style))
    story.append(Paragraph(fa("فرمول‌ها با علامت = شروع می‌شوند. اولویت محاسبات ریاضی در اکسل: ۱. پرانتز () ۲. توان (^) ۳. ضرب و تقسیم (* و /) ۴. جمع و تفریق (+ و -)."), body_style))

    story.append(Paragraph(fa("۱. توابع عمومی محاسباتی:"), h2_style))
    story.append(Paragraph(fa("• SUM: محاسبه مجموع مقادیر یک محدوده ➔ =SUM(A1:A50)"), body_style))
    story.append(Paragraph(fa("• AVERAGE: محاسبه میانگین عددی سلول‌ها ➔ =AVERAGE(B1:B100)"), body_style))
    story.append(Paragraph(fa("• COUNT: شمارش سلول‌های فقط حاوی عدد ➔ =COUNT(C1:C30)"), body_style))
    story.append(Paragraph(fa("• COUNTA: شمارش تمام سلول‌های غیرخالی (متن، عدد، تاریخ) ➔ =COUNTA(C1:C30)"), body_style))
    story.append(Paragraph(fa("• COUNTBLANK: شمارش سلول‌های کاملاً خالی ➔ =COUNTBLANK(C1:C30)"), body_style))
    story.append(Paragraph(fa("• MAX / MIN: محاسبه بیشترین و کمترین مقدار ➔ =MAX(D1:D50)"), body_style))
    story.append(Paragraph(fa("• ROUND: گرد کردن اعداد تا تعداد ارقام اعشار مشخص ➔ =ROUND(E1, 2)"), body_style))

    story.append(Spacer(1, 10))

    # Chapter 4
    story.append(Paragraph(fa("فصل چهارم: توابع شرطی و منطقی (IF, SUMIFS, COUNTIFS)"), h1_style))
    story.append(Paragraph(fa("توابع منطقی به شما امکان تصمیم‌گیری و محاسبات هدفمند بر اساس برقرار بودن یک یا چند شرط را می‌دهند."), body_style))

    story.append(Paragraph(fa("۱. تابع IF و ساختارهای شرطی چندگانه (IFS):"), h2_style))
    story.append(Paragraph(fa("تابع IF یک شرط را تست کرده و در صورت درست بودن یک پاسخ و در صورت نادرست بودن پاسخ دیگر برمی‌گرداند."), body_style))
    story.append(Paragraph("SYNTAX: =IF(Logical_Test, Value_if_true, Value_if_false)", code_style))
    story.append(Paragraph(fa("مثال: ارزیابی نمره دانش‌آموز جهت قبولی یا مردودی:"), body_style))
    story.append(Paragraph('EXAMPLE: =IF(A2 >= 10, "Pass", "Fail")', code_style))

    story.append(Paragraph(fa("در اکسل‌های جدید تابع IFS ارزیابی چندین شرط پیاپی را بدون نیاز به IFهای تو در تو بسیار ساده کرده است:"), body_style))
    story.append(Paragraph('SYNTAX: =IFS(Logical1, Value1, Logical2, Value2, ...)', code_style))
    story.append(Paragraph('EXAMPLE: =IFS(A2>=18, "A", A2>=15, "B", A2>=10, "C", TRUE, "D")', code_style))

    story.append(Paragraph(fa("۲. توابع ترکیب منطقی AND و OR:"), h2_style))
    story.append(Paragraph(fa("• AND: زمانی درست است که **تمامی** شروط برقرار باشند ➔ =IF(AND(A2>10, B2>50), 'تایید', 'رد')"), body_style))
    story.append(Paragraph(fa("• OR: زمانی درست است که **حداقل یکی** از شروط برقرار باشد ➔ =IF(OR(A2='Tehran', A2='Shiraz'), 'شهرهای اصلی', 'سایر')"), body_style))

    story.append(Paragraph(fa("۳. توابع جمع و شمارش شرطی (SUMIF, SUMIFS, COUNTIFS):"), h2_style))
    story.append(Paragraph(fa("• SUMIF: جمع مقادیر بر اساس یک شرط مشخص ➔ =SUMIF(A2:A100, 'Laptop', B2:B100)"), body_style))
    story.append(Paragraph(fa("• SUMIFS: جمع مقادیر بر اساس چندین شرط همزمان:"), body_style))
    story.append(Paragraph('SYNTAX: =SUMIFS(Sum_Range, Criteria_Range1, Criteria1, Criteria_Range2, Criteria2, ...)', code_style))
    story.append(Paragraph('EXAMPLE: =SUMIFS(C2:C100, A2:A100, "Samsung", B2:B100, "Tehran")', code_style))

    story.append(Paragraph(fa("• COUNTIFS: شمارش تعداد سطرها بر اساس چندین شرط همزمان:"), body_style))
    story.append(Paragraph('EXAMPLE: =COUNTIFS(A2:A100, "Samsung", C2:C100, ">1000")', code_style))

    story.append(PageBreak())

    # Chapter 5
    story.append(Paragraph(fa("فصل پنجم: توابع متنی و پردازش رشته‌ها (Text Functions)"), h1_style))
    story.append(Paragraph(fa("ابزارهای متنی برای پاکسازی اسامی، جداکردن کدهای پرسنلی، ترکیب رشته‌ها و استانداردسازی داده‌ها ضروری هستند."), body_style))

    text_funcs = [
        [Paragraph(fa("توضیحات و مثال کاربردی"), table_header_style), Paragraph(fa("نحو (Syntax)"), table_header_style), Paragraph(fa("تابع متنی"), table_header_style)],
        [Paragraph(fa("جداسازی کاراکترها از سمت چپ رشته ➔ =LEFT('EXCEL2024', 5) ➔ 'EXCEL'"), table_text_style), Paragraph(fa("=LEFT(text, num_chars)"), table_text_style), Paragraph(fa("LEFT"), table_text_style)],
        [Paragraph(fa("جداسازی کاراکترها از سمت راست رشته ➔ =RIGHT('EXCEL2024', 4) ➔ '2024'"), table_text_style), Paragraph(fa("=RIGHT(text, num_chars)"), table_text_style), Paragraph(fa("RIGHT"), table_text_style)],
        [Paragraph(fa("جداسازی متون از میانه رشته ➔ =MID('A-102-B', 3, 3) ➔ '102'"), table_text_style), Paragraph(fa("=MID(text, start, num)"), table_text_style), Paragraph(fa("MID"), table_text_style)],
        [Paragraph(fa("محاسبه تعداد کل کاراکترهای یک سلول ➔ =LEN('Tehran') ➔ 6"), table_text_style), Paragraph(fa("=LEN(text)"), table_text_style), Paragraph(fa("LEN"), table_text_style)],
        [Paragraph(fa("حذف فاصله‌های اضافی (Space) ابتدا، انتها و میانه متون"), table_text_style), Paragraph(fa("=TRIM(text)"), table_text_style), Paragraph(fa("TRIM"), table_text_style)],
        [Paragraph(fa("ترکیب متون چندین سلول با جداکننده دلخواه (Delim)"), table_text_style), Paragraph(fa("=TEXTJOIN(delim, True, A1:A5)"), table_text_style), Paragraph(fa("TEXTJOIN"), table_text_style)],
        [Paragraph(fa("تغییر فرمت اعداد و تاریخ‌ها به متن با فرمت دلخواه ➔ =TEXT(TODAY(), 'yyyy-mm-dd')"), table_text_style), Paragraph(fa("=TEXT(value, format)"), table_text_style), Paragraph(fa("TEXT"), table_text_style)],
    ]
    t_text = Table(text_funcs, colWidths=[8 * cm, 6 * cm, 3 * cm])
    t_text.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f766e")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_text)

    story.append(Spacer(1, 15))

    # Chapter 6
    story.append(Paragraph(fa("فصل ششم: توابع پیشرفته جستجو و مرجع (VLOOKUP, INDEX+MATCH, XLOOKUP)"), h1_style))
    story.append(Paragraph(fa("توابع جستجو قلب جابه‌جایی اطلاعات بین جداول مختلف در دیتابیس‌های اکسل هستند."), body_style))

    story.append(Paragraph(fa("۱. تابع VLOOKUP (جستجوی عمودی):"), h2_style))
    story.append(Paragraph(fa("یک مقدار را در ستون اول جدول جستجو کرده و اطلاعات مربوطه را از ستون‌های سمت راست بازمی‌گرداند."), body_style))
    story.append(Paragraph('SYNTAX: =VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])', code_style))
    story.append(Paragraph(fa("نکته: همیشه پارامتر range_lookup را 0 یا FALSE قرار دهید تا جستجوی دقیق انجام شود."), body_style))

    story.append(Paragraph(fa("۲. ترکیب بی‌نظیر INDEX و MATCH (جایگزین قدرتمند VLOOKUP):"), h2_style))
    story.append(Paragraph(fa("ترکیب این دو تابع محدودیتی در جهت جستجو (سمت چپ یا راست) ندارد و سرعت بسیار بالاتری ایجاد می‌کند."), body_style))
    story.append(Paragraph('SYNTAX: =INDEX(Return_Range, MATCH(Lookup_Value, Lookup_Range, 0))', code_style))

    story.append(Paragraph(fa("۳. تابع قدرتمند و نسل جدید XLOOKUP:"), h2_style))
    story.append(Paragraph(fa("در نسخه‌های اکسل 2021 و 365، تابع XLOOKUP تمام محدودیت‌های توابع قدیمی را برطرف کرده است:"), body_style))
    story.append(Paragraph('SYNTAX: =XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found])', code_style))
    story.append(Paragraph('EXAMPLE: =XLOOKUP(A2, E2:E500, F2:F500, "اطلاعات موجود نیست")', code_style))

    story.append(PageBreak())

    # Chapter 7
    story.append(Paragraph(fa("فصل هفتم: توابع آرایه‌ای پویا (Dynamic Array Functions)"), h1_style))
    story.append(Paragraph(fa("در اکسل‌های مدرن، توابع آرایه‌ای بدون نیاز به کلیدهای Ctrl+Shift+Enter، خروجی‌های چندسلولی را به صورت سرریز (Spill) تولید می‌کنند."), body_style))

    dyn_funcs = [
        [Paragraph(fa("توضیحات و مثال کاربردی"), table_header_style), Paragraph(fa("نحو (Syntax)"), table_header_style), Paragraph(fa("تابع آرایه‌ای"), table_header_style)],
        [Paragraph(fa("فیلتر کردن کل سطرها بر اساس یک شرط ➔ =FILTER(A2:C100, B2:B100='Tehran')"), table_text_style), Paragraph(fa("=FILTER(array, include)"), table_text_style), Paragraph(fa("FILTER"), table_text_style)],
        [Paragraph(fa("استخراج لیست مقادیر منحصربه‌فرد و حذف تکراری‌ها ➔ =UNIQUE(A2:A500)"), table_text_style), Paragraph(fa("=UNIQUE(array)"), table_text_style), Paragraph(fa("UNIQUE"), table_text_style)],
        [Paragraph(fa("مرتب‌سازی صعودی یا نزولی داده‌ها ➔ =SORT(A2:B100, 2, -1)"), table_text_style), Paragraph(fa("=SORT(array, [idx], [order])"), table_text_style), Paragraph(fa("SORT"), table_text_style)],
        [Paragraph(fa("تولید دنباله سری اعداد منظم ➔ =SEQUENCE(10, 1, 100, 5)"), table_text_style), Paragraph(fa("=SEQUENCE(rows, cols, ...)"), table_text_style), Paragraph(fa("SEQUENCE"), table_text_style)],
    ]
    t_dyn = Table(dyn_funcs, colWidths=[8 * cm, 6 * cm, 3 * cm])
    t_dyn.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f766e")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor("#f8fafc")]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_dyn)

    story.append(Spacer(1, 15))

    # Chapter 8
    story.append(Paragraph(fa("فصل هشتم: اعتبارسنجی و پاکسازی داده‌ها (Data Tools)"), h1_style))
    story.append(Paragraph(fa("اطمینان از ورود درست داده‌ها، مانع از بروز خطاهای محاسباتی در گزارش‌های سازمانی می‌شود."), body_style))

    story.append(Paragraph(fa("۱. ساخت منوی کشویی با Data Validation:"), h2_style))
    story.append(Paragraph(fa("برای محدود کردن ورود داده‌ها به یک لیست مشخص (مثلاً لیست استان‌ها یا محصولات):"), body_style))
    story.append(Paragraph(fa("• محدوده سلول‌ها را انتخاب کرده و از تب Data روی گزینه Data Validation کلیک کنید."), body_style))
    story.append(Paragraph(fa("• در بخش Allow گزینه List را انتخاب کنید و محدوده مرجع یا گزینه‌ها را با ویرگول وارد نمایید."), body_style))

    story.append(Paragraph(fa("۲. تفکیک متون با Text to Columns:"), h2_style))
    story.append(Paragraph(fa("ابزاری فوق‌العاده برای جداسازی نام و نام‌خانوادگی یا کدهای ترکیبی بر اساس جداکننده‌هایی مانند فاصله، خط تیره یا ویرگول."), body_style))

    story.append(Paragraph(fa("۳. حذف سطر‌های تکراری (Remove Duplicates):"), h2_style))
    story.append(Paragraph(fa("حذف انباشتگی و سطور کاملاً یکسان در دیتابیس‌ها با یک کلیک از تب Data."), body_style))

    story.append(Spacer(1, 15))

    # Chapter 9
    story.append(Paragraph(fa("فصل نهم: ابزارهای تحلیل چه می‌شود اگر (What-If Analysis)"), h1_style))
    story.append(Paragraph(fa("ابزارهای مدل‌سازی مالی و برنامه‌ریزی هدفمند در اکسل:"), body_style))
    story.append(Paragraph(fa("• Goal Seek (هدف‌یابی): زمانی که خروجی نهایی یک فرمول را می‌دانید و می‌خواهید بدانید ورودی باید چه عددی باشد (مثلاً برای رسیدن به سود ۱ میلیارد تومان، چه تعداد کالا باید فروخته شود؟)."), body_style))
    story.append(Paragraph(fa("• Scenario Manager (مدیریت سناریوها): تعریف و مقایسه سناریوهای مختلف خوش‌بینانه، واقع‌بینانه و بدبینانه در مدل‌های تجاری."), body_style))

    story.append(PageBreak())

    # Chapter 10
    story.append(Paragraph(fa("فصل دهم: جداول محوری و اسلایسرها (Pivot Tables & Slicers)"), h1_style))
    story.append(Paragraph(fa("پیووت تیبل ابزاری قدرتمند برای خلاصه‌سازی و تحلیل پویای داده‌ها بدون فرمول‌نویسی است."), body_style))

    story.append(Paragraph(fa("چهار ناحیه اصلی تنظیمات پیووت تیبل:"), h2_style))
    story.append(Paragraph(fa("۱. Values: محاسبات عددی (جمع، میانگین، درصد از کل)."), body_style))
    story.append(Paragraph(fa("۲. Rows: ساختار عناوین سطرها."), body_style))
    story.append(Paragraph(fa("۳. Columns: عناوین ستون‌ها."), body_style))
    story.append(Paragraph(fa("۴. Filters: فیلتر عمومی گزارش."), body_style))

    story.append(Paragraph(fa("افزودن اسلایسر (Slicer):"), h2_style))
    story.append(Paragraph(fa("اسلایسرها دکمه‌های فیلتر تصویری و بسار شکیلی هستند که فیلتر کردن گزارش‌های Pivot Table را برای مدیران با یک کلیک امکان‌پذیر می‌سازند."), body_style))

    story.append(Spacer(1, 15))

    # Chapter 11
    story.append(Paragraph(fa("فصل یازدهم: بصری‌سازی داده‌ها و ساخت داشبورد (Dashboards)"), h1_style))
    story.append(Paragraph(fa("نمودارهای کلیدی در ساخت داشبوردهای مدیریتی:"), body_style))
    story.append(Paragraph(fa("• نمودار ستونی (Column/Bar Chart): مقایسه دسته‌ها."), body_style))
    story.append(Paragraph(fa("• نمودار خطی (Line Chart): نمایش روند زمان (Time Series)."), body_style))
    story.append(Paragraph(fa("• نمودار ترکیبی (Combo Chart): ترکیب ستونی و خطی برای مقایسه حجم و درصد رشد."), body_style))
    story.append(Paragraph(fa("• کاندیشنال فرمتینگ (Conditional Formatting): نمایش نوار داده (Data Bars)، طیف رنگی (Color Scales) و آیکون‌های مدیریتی درون سلول‌ها."), body_style))

    story.append(Spacer(1, 15))

    # Chapter 12
    story.append(Paragraph(fa("فصل دوازدهم: مقدمه‌ای بر Power Query و ماکرونویسی (VBA)"), h1_style))
    story.append(Paragraph(fa("۱. Power Query (موتور اتوماسیون داده‌ها):"), h2_style))
    story.append(Paragraph(fa("ابزار ETL اکسل برای اتصال به فایل‌های مختلف، پاکسازی اتوماتیک داده‌ها، ترکیب جداول و بروزرسانی خودکار گزارش‌ها با یک کلیک Refresh."), body_style))

    story.append(Paragraph(fa("۲. ماکرونویسی و کدنویسی به زبان VBA:"), h2_style))
    story.append(Paragraph(fa("برای خودکارسازی کارهای تکراری روزمره. با استفاده از گزینه Record Macro در تب Developer می‌توانید تمام مراحل کار خود را ضبط و با یک کلید میانبر اجرا کنید."), body_style))

    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=15))
    story.append(Paragraph(fa("پایان مرجع جامع آموزش مایکروسافت اکسل — موفق و پیروز باشید"), ParagraphStyle('EndStyle', parent=body_style, alignment=TA_CENTER, textColor=colors.HexColor("#475569"))))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Masterclass PDF Generated successfully: {pdf_filename}")

if __name__ == "__main__":
    build_pdf()

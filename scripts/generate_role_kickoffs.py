"""Build Virtual Ink's two role-specific kickoff PDFs from maintained Markdown.

Run using the managed document/PDF Python runtime with reportlab,
pypdf, pdfplumber and pypdfium2. Application dependencies are not modified.
"""
from __future__ import annotations

import re
from html import escape
from pathlib import Path

import pdfplumber
import pypdfium2 as pdfium
import reportlab
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Preformatted, ListFlowable, ListItem,
)
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'output' / 'pdf'
QA = ROOT / '.private' / 'kickoff-pdf-qa'
WIDTH, HEIGHT = 612, 792
CONTENT_WIDTH = 528
INK = colors.HexColor('#111827')
CHARCOAL = colors.HexColor('#0B0F17')
MUTED = colors.HexColor('#64748B')
PURPLE = colors.HexColor('#7A3BFF')
CYAN = colors.HexColor('#00C2FF')
SURFACE = colors.HexColor('#F6F8FC')
LOGO = ROOT / 'asssets' / 'Virtual Ink Gradient Logo.png'


def fonts():
    # Embedded document font from the PDF runtime; UI remains Poppins as specified.
    font_root = Path(reportlab.__file__).resolve().parent / 'fonts'
    QA.mkdir(parents=True, exist_ok=True)
    for name, filename in [('ReportSans','Vera.ttf'), ('ReportSans-SemiBold','VeraBd.ttf'), ('ReportSans-Bold','VeraBd.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(font_root / filename)))
    pdfmetrics.registerFontFamily('ReportSans', normal='ReportSans', bold='ReportSans-Bold', italic='ReportSans', boldItalic='ReportSans-Bold')


def styles():
    base = dict(fontName='ReportSans', fontSize=9.4, leading=14.1, textColor=INK,
                alignment=TA_LEFT, spaceAfter=7, splitLongWords=True)
    return {
        'body': ParagraphStyle('Body', **base),
        'title': ParagraphStyle('RoleTitle', fontName='ReportSans-Bold', fontSize=25, leading=31, textColor=CHARCOAL, spaceAfter=8),
        'h1': ParagraphStyle('PageTitle', fontName='ReportSans-SemiBold', fontSize=16, leading=21, textColor=CHARCOAL, spaceBefore=3, spaceAfter=10, keepWithNext=True),
        'h2': ParagraphStyle('SectionTitle', fontName='ReportSans-SemiBold', fontSize=11.5, leading=16, textColor=colors.HexColor('#5230A9'), spaceBefore=8, spaceAfter=6, keepWithNext=True),
        'cell': ParagraphStyle('Cell', **{**base, 'fontSize': 8.7, 'leading': 12.5, 'spaceAfter': 0}),
        'tablehead': ParagraphStyle('TableHead', **{**base, 'fontName': 'ReportSans-SemiBold', 'fontSize': 8.7, 'leading': 12.5, 'textColor': colors.white, 'spaceAfter': 0}),
        'code': ParagraphStyle('Code', fontName='Courier', fontSize=8.4, leading=11.5, textColor=CHARCOAL, backColor=SURFACE, borderPadding=9, spaceBefore=3, spaceAfter=10),
    }


def markup(text):
    text = escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'`([^`]+)`', r'<font name="Courier">\1</font>', text)
    return text


def parse(source, theme):
    lines = source.read_text(encoding='utf-8').splitlines()
    content = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line == '<!-- pagebreak -->':
            content.append(PageBreak())
        elif line.startswith('# '):
            content.append(Paragraph(markup(line[2:]), theme['title']))
        elif line.startswith('## '):
            content.append(Paragraph(markup(line[3:]), theme['h1']))
        elif line.startswith('### '):
            content.append(Paragraph(markup(line[4:]), theme['h2']))
        elif line.startswith('```'):
            code = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                code.append(lines[i])
                i += 1
            # Explicit code widths preserve command spelling without clipping.
            assert max((len(v) for v in code), default=0) <= 90, 'Wrap prompt lines in source'
            content.append(Preformatted('\n'.join(code), theme['code']))
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [v.strip() for v in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', v) for v in cells):
                    rows.append(cells)
                i += 1
            count = len(rows[0])
            widths = [144, CONTENT_WIDTH - 144] if count == 2 else [CONTENT_WIDTH / count] * count
            data = [[Paragraph(markup(value), theme['tablehead'] if row_index == 0 else theme['cell'])
                     for value in row] for row_index, row in enumerate(rows)]
            table = Table(data, colWidths=widths, hAlign='LEFT', repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), CHARCOAL),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, SURFACE]),
                ('BOX', (0, 0), (-1, -1), .5, colors.HexColor('#DCE3ED')),
                ('LINEBELOW', (0, 0), (-1, 0), 1.2, CYAN),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 9),
                ('RIGHTPADDING', (0, 0), (-1, -1), 9),
            ]))
            content.extend([table, Spacer(1, 9)])
            continue
        elif line.startswith('- '):
            items = []
            while i < len(lines) and lines[i].strip().startswith('- '):
                items.append(ListItem(Paragraph(markup(lines[i].strip()[2:]), theme['body']), leftIndent=0))
                i += 1
            content.append(ListFlowable(items, bulletType='bullet', leftIndent=12,
                                        bulletFontName='ReportSans', bulletFontSize=6, spaceAfter=3))
            continue
        else:
            paragraph = [line]
            while i + 1 < len(lines) and lines[i + 1].strip() and not re.match(r'^(#|\||- |```|<!--)', lines[i + 1]):
                i += 1
                paragraph.append(lines[i].strip())
            content.append(Paragraph(markup(' '.join(paragraph)), theme['body']))
        i += 1
    return content


def header(role):
    def paint(canvas, doc):
        canvas.saveState()
        canvas.setTitle(f'Virtual Ink - {role} Kickoff')
        canvas.setAuthor('Shadow Root Security Technologies')
        canvas.setSubject('Role handover snapshot - 9 October 2026; review pending')
        canvas.drawImage(str(LOGO), 42, HEIGHT - 53, width=45, height=30, preserveAspectRatio=True, anchor='c', mask='auto')
        canvas.setFont('ReportSans-SemiBold', 8.1)
        canvas.setFillColor(CHARCOAL)
        canvas.drawString(97, HEIGHT - 32, 'VIRTUAL INK / SHADOW ROOT SECURITY TECHNOLOGIES')
        canvas.setFont('ReportSans', 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(97, HEIGHT - 46, f'{role} kickoff | Your Ideas. Our Print. Delivered.')
        canvas.setStrokeColor(CYAN)
        canvas.setLineWidth(1)
        canvas.line(42, HEIGHT - 61, WIDTH - 42, HEIGHT - 61)
        canvas.setFont('ReportSans', 7.1)
        canvas.setFillColor(MUTED)
        canvas.drawString(42, 25, '9 October 2026 | Internal team handover | Review pending')
        canvas.drawRightString(WIDTH - 42, 25, f'Page {doc.page} of 3')
        canvas.restoreState()
    return paint


def audit_render(path, role):
    reader = PdfReader(path)
    assert len(reader.pages) == 3, f'{path.name}: expected 3 pages, got {len(reader.pages)}'
    text = '\n'.join(p.extract_text() or '' for p in reader.pages)
    assert role in text and 'Virtual Ink' in text
    assert not any(value in text for value in ('sb_secret_', 'postgresql://', 'Bearer eyJ', '\ufffd', '\u25a0'))
    assert '90' in text or role == 'Taizya'
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages, 1):
            chars = [v for v in page.chars if v['text'].strip()]
            assert chars, (path.name, i)
            assert all(34 <= v['x0'] and v['x1'] <= WIDTH - 34 and 14 <= v['top'] and v['bottom'] <= HEIGHT - 13
                       for v in chars), f'Text outside page bounds: {path.name} page {i}'
    rendered = pdfium.PdfDocument(path)
    folder = QA / path.stem
    folder.mkdir(parents=True, exist_ok=True)
    for i in range(len(rendered)):
        page = rendered[i]
        bitmap = page.render(scale=1.8)
        bitmap.to_pil().convert('RGB').save(folder / f'page-{i+1}.png')
        bitmap.close()
        page.close()
    rendered.close()
    print(f'PDF structure/text bounds passed; rendered 3 pages: {path}')
    return text


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    assert LOGO.exists(), 'Approved logo is required from the existing asset folder'
    fonts()
    theme = styles()
    jobs = [
        ('mumba', 'Mumba', 'Virtual-Ink-Mumba-Backend-Kickoff-2026-10-09.pdf'),
        ('taizya', 'Taizya', 'Virtual-Ink-Taizya-UX-Kickoff-2026-10-09.pdf'),
    ]
    for slug, role, filename in jobs:
        source = ROOT / 'docs' / 'handovers' / f'2026-10-09-{slug}-kickoff.md'
        assert source.read_text(encoding='utf-8').count('<!-- pagebreak -->') == 2
        output = OUTPUT / filename
        doc = SimpleDocTemplate(str(output), pagesize=(WIDTH, HEIGHT),
                                leftMargin=42, rightMargin=42, topMargin=74, bottomMargin=44)
        doc.build(parse(source, theme), onFirstPage=header(role), onLaterPages=header(role))
        audit_render(output, role)


if __name__ == '__main__':
    main()

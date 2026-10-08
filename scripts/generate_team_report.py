"""Render a dated team Markdown report to Word using python-docx.

Usage: python scripts/generate_team_report.py docs/reports/YYYY-MM-DD-slice.md
Run with the document skill's managed Python runtime (python-docx installed).
Historical reports are preserved. No external application is contacted.
Preset: compact_reference_guide; first-page pattern: memo_masthead.
Named overrides: ReportTitle (26pt charcoal), ReportCode (9pt Consolas),
ReportTableText (9.5pt / 1.15 lines), ReportMetadata (9pt muted).
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from docx import Document
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def style(document, name, size, color, before=0, after=6, line=1.25, bold=False):
    s = document.styles[name] if name in document.styles else document.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
    s.font.name = 'Calibri'
    s.font.size = Pt(size)
    s.font.color.rgb = RGBColor.from_string(color)
    s.font.bold = bold
    s.paragraph_format.space_before = Pt(before)
    s.paragraph_format.space_after = Pt(after)
    s.paragraph_format.line_spacing = line
    s.paragraph_format.widow_control = True
    return s


def rich(paragraph, text):
    for token in re.split(r'(\*\*.*?\*\*|`[^`]+`)', text):
        if not token:
            continue
        if token.startswith('**') and token.endswith('**'):
            paragraph.add_run(token[2:-2]).bold = True
        elif token.startswith('`') and token.endswith('`'):
            run = paragraph.add_run(token[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(10)
        else:
            paragraph.add_run(token)


def element(parent, name, attrs):
    item = OxmlElement(f'w:{name}')
    for key, value in attrs.items():
        item.set(qn(f'w:{key}'), str(value))
    parent.append(item)
    return item


def numbering(document):
    root = document.part.numbering_part.element
    for aid, nid, fmt, marker in [(80, 80, 'bullet', '•'), (81, 81, 'decimal', '%1.')]:
        abstract = element(root, 'abstractNum', {'abstractNumId': aid})
        element(abstract, 'multiLevelType', {'val': 'singleLevel'})
        lvl = element(abstract, 'lvl', {'ilvl': 0})
        element(lvl, 'start', {'val': 1})
        element(lvl, 'numFmt', {'val': fmt})
        element(lvl, 'lvlText', {'val': marker})
        element(lvl, 'lvlJc', {'val': 'left'})
        ppr = element(lvl, 'pPr', {})
        tabs = element(ppr, 'tabs', {})
        element(tabs, 'tab', {'val': 'num', 'pos': 540})
        element(ppr, 'ind', {'left': 540, 'hanging': 270})
        num = element(root, 'num', {'numId': nid})
        element(num, 'abstractNumId', {'val': aid})


def list_item(document, text, num=80):
    p = document.add_paragraph(style='ReportList')
    n = element(p._p.get_or_add_pPr(), 'numPr', {})
    element(n, 'ilvl', {'val': 0})
    element(n, 'numId', {'val': num})
    rich(p, text)


def add_table(document, rows):
    columns = len(rows[0])
    widths = {2: [3300, 6060], 3: [2100, 3100, 4160], 4: [1800, 1800, 3500, 2260]}.get(columns)
    if widths is None:
        widths = [9360 // columns] * columns
        widths[-1] += 9360 - sum(widths)
    table = document.add_table(rows=len(rows), cols=columns)
    table.autofit = False
    pr = table._tbl.tblPr
    for old in list(pr):
        if old.tag in [qn('w:tblW'), qn('w:tblInd'), qn('w:tblBorders'), qn('w:tblCellMar')]:
            pr.remove(old)
    element(pr, 'tblW', {'w': 9360, 'type': 'dxa'})
    element(pr, 'tblInd', {'w': 120, 'type': 'dxa'})
    margins = element(pr, 'tblCellMar', {})
    for side, size in [('top',80),('bottom',80),('start',120),('end',120)]:
        element(margins, side, {'w':size, 'type':'dxa'})
    borders = element(pr, 'tblBorders', {})
    for side in ['top','left','bottom','right','insideH','insideV']:
        element(borders, side, {'val':'single','sz':4,'color':'D0D8E2'})
    grid = table._tbl.tblGrid
    for col in list(grid):
        grid.remove(col)
    for width in widths:
        element(grid, 'gridCol', {'w':width})
    for i, row in enumerate(rows):
        element(table.rows[i]._tr.get_or_add_trPr(), 'cantSplit', {})
        if i == 0:
            element(table.rows[i]._tr.get_or_add_trPr(), 'tblHeader', {})
        for j, value in enumerate(row):
            cell = table.cell(i, j)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            cell.width = Inches(widths[j] / 1440)
            tcpr = cell._tc.get_or_add_tcPr()
            tcpr.find(qn('w:tcW')).set(qn('w:w'), str(widths[j]))
            if i == 0:
                element(tcpr, 'shd', {'val':'clear','fill':'E8EEF5'})
            p = cell.paragraphs[0]
            p.style = document.styles['ReportTableText']
            rich(p, value)
            if i == 0:
                for run in p.runs:
                    run.bold = True
    document.add_paragraph().paragraph_format.space_after = Pt(4)


def setup(document):
    section = document.sections[0]
    section.page_width, section.page_height = Inches(8.5), Inches(11)
    section.top_margin = section.bottom_margin = section.left_margin = section.right_margin = Inches(1)
    section.header_distance = section.footer_distance = Inches(.492)
    style(document,'Normal',11,'111827')
    style(document,'Title',26,'0B0F17',after=8,line=1.15,bold=True)
    style(document,'Subtitle',12,'64748B',after=12)
    for name,size,color,before,after in [('Heading 1',16,'2E74B5',18,10),('Heading 2',13,'2E74B5',14,7),('Heading 3',12,'1F4D78',10,5)]:
        s = style(document,name,size,color,before,after,bold=True)
        s.paragraph_format.keep_with_next = True
    style(document,'ReportList',11,'111827',after=4)
    style(document,'ReportTableText',9.5,'111827',after=3,line=1.15)
    s = style(document,'ReportCode',9,'173B5E',after=8,line=1.1)
    s.font.name = 'Consolas'
    style(document,'ReportMetadata',9,'64748B',after=3,line=1.1)
    numbering(document)
    header = section.header.paragraphs[0]
    header.style = document.styles['ReportMetadata']
    header.text = 'Virtual Ink | Shadow Root Security Technologies | Team handover'
    footer = section.footer.paragraphs[0]
    footer.style = document.styles['ReportMetadata']
    footer.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    footer.add_run('Internal working report | Page ')
    field = OxmlElement('w:fldSimple')
    field.set(qn('w:instr'),'PAGE')
    footer._p.append(field)
    document.core_properties.author = 'Shadow Root Security Technologies'
    document.core_properties.title = 'Virtual Ink Team Progress Report'


def parse(document, text):
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith('```'):
            content = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('```'):
                content.append(lines[i]); i += 1
            document.add_paragraph('\n'.join(content),style='ReportCode')
        elif line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [value.strip() for value in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-+:?', cell) for cell in cells):
                    rows.append(cells)
                i += 1
            add_table(document,rows)
            continue
        elif line.startswith('# '):
            document.add_paragraph(line[2:],style='Title')
        elif line.startswith('## '):
            document.add_paragraph(line[3:],style='Heading 1')
        elif line.startswith('### '):
            document.add_paragraph(line[4:],style='Heading 2')
        elif line.startswith('- '):
            value = line[2:]
            while i+1 < len(lines) and lines[i+1].startswith('  ') and lines[i+1].strip():
                i += 1; value += ' ' + lines[i].strip()
            list_item(document,value)
        else:
            content = [line]
            while i+1 < len(lines) and lines[i+1].strip() and not re.match(r'^(#|\||- |```)',lines[i+1]):
                i += 1; content.append(lines[i].strip())
            rich(document.add_paragraph(),' '.join(content))
        i += 1


def audit(path):
    with ZipFile(path) as archive:
        assert archive.testzip() is None
        for name in archive.namelist():
            if name.endswith('.xml') or name.endswith('.rels'):
                ET.fromstring(archive.read(name))
        root = ET.fromstring(archive.read('word/document.xml'))
        for table in root.findall('.//w:tbl',NS):
            widths = [int(c.attrib[qn('w:w')]) for c in table.findall('w:tblGrid/w:gridCol',NS)]
            assert sum(widths) == 9360
            assert table.find('w:tblPr/w:tblW',NS).attrib[qn('w:w')] == '9360'
            for row in table.findall('w:tr',NS):
                assert [int(c.attrib[qn('w:w')]) for c in row.findall('w:tc/w:tcPr/w:tcW',NS)] == widths
        text = ''.join(root.itertext())
        assert len(text.strip()) > 200
        assert root.findall('.//w:pStyle',NS), 'Report needs named styles/headings'
        assert not any(value in text for value in ['sb_secret_', 'postgresql://', 'Bearer eyJ'])
    print(f'Structural document audit passed: {path.name}')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source',help='Dated Markdown report under docs/reports/')
    args = parser.parse_args()
    source = (ROOT / args.source).resolve()
    if not source.is_relative_to(ROOT / 'docs' / 'reports') or source.suffix != '.md':
        parser.error('Source must be a dated Markdown report under docs/reports/')
    document = Document()
    setup(document)
    parse(document,source.read_text(encoding='utf-8'))
    output = source.with_suffix('.docx')
    document.save(output)
    audit(output)
    print(output)


if __name__ == '__main__':
    main()

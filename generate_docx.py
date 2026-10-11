"""
TripMind AI - Word Document (.docx) Generator
Builds TripMind_AI_IT_Microproject_Report.docx using python-docx with
academic typography, header/footer page numbering, styled tables, and code formatting.
"""

import os
import re
from pathlib import Path

import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from report_content import PROJECT_METADATA, PRELIMINARY, ABBREVIATIONS
from report_chapters import (
    CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4,
    CHAPTER_5, CHAPTER_6, REFERENCES, APPENDIX_A, APPENDIX_B
)

WORKSPACE = Path(r"c:\Users\Omkar\Desktop\TripMind AI")
DOCX_FILE = WORKSPACE / "TripMind_AI_IT_Microproject_Report.docx"

# Color constants
COLOR_NAVY = RGBColor(30, 58, 138)       # #1E3A8A
COLOR_TEAL = RGBColor(13, 148, 136)      # #0D9488
COLOR_BODY = RGBColor(30, 41, 59)        # #1E293B
COLOR_MUTED = RGBColor(100, 116, 139)    # #64748B
HEX_HEADER_BG = "0F172A"                 # Dark Slate
HEX_ZEBRA_BG = "F8FAFC"                  # Very light slate
HEX_CODE_BG = "F1F5F9"                   # Light gray for code
HEX_BORDER = "CBD5E1"                    # Light border

def set_cell_background(cell, hex_color):
    """Sets background shading of a docx table cell."""
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Sets cell internal padding in twips."""
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table):
    """Sets subtle clean borders for a docx table."""
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = parse_xml(
            f'<w:tblBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
            f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{HEX_HEADER_BG}"/>'
            f'<w:left w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
            f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{HEX_BORDER}"/>'
            f'<w:insideV w:val="none"/>'
            f'</w:tblBorders>'
        )
        tblPr[0].append(borders)

def add_styled_table(doc, headers, rows):
    """Creates a beautifully styled table with dark header and zebra rows."""
    table = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(table)

    # Style Header Row
    hdr_cells = table.rows[0].cells
    for idx, heading in enumerate(headers):
        hdr_cells[idx].text = heading
        set_cell_background(hdr_cells[idx], HEX_HEADER_BG)
        set_cell_margins(hdr_cells[idx], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Calibri"
            run.font.size = Pt(9.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)

    # Repeat header row on every page
    trPr = table.rows[0]._element.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

    # Populate Data Rows
    for r_idx, row_data in enumerate(rows):
        row_cells = table.rows[r_idx + 1].cells
        bg_color = HEX_ZEBRA_BG if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = cell_value
            set_cell_background(row_cells[c_idx], bg_color)
            set_cell_margins(row_cells[c_idx], top=90, bottom=90, left=120, right=120)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Calibri"
                run.font.size = Pt(9)
                run.font.color.rgb = COLOR_BODY

    doc.add_paragraph() # Spacing

def add_code_block(doc, code_text):
    """Renders a code block in a shaded monospaced box."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, HEX_CODE_BG)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    # Left border accent
    tcPr = cell._element.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="0D9488"/>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run(code_text.strip())
    run.font.name = "Consolas"
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor(15, 23, 42)
    doc.add_paragraph()

def add_callout_box(doc, title, text):
    """Renders a highlighted callout box with a teal left bar."""
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, "F0FDFA")
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)

    tcPr = cell._element.get_or_add_tcPr()
    tcBorders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'<w:left w:val="single" w:sz="24" w:space="0" w:color="0D9488"/>'
        f'<w:top w:val="none"/>'
        f'<w:bottom w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(tcBorders)

    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    r_title = p.add_run(f"{title}\n")
    r_title.bold = True
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(10.5)
    r_title.font.color.rgb = COLOR_TEAL

    r_text = p.add_run(text)
    r_text.font.name = "Calibri"
    r_text.font.size = Pt(9.5)
    r_text.font.color.rgb = COLOR_BODY
    doc.add_paragraph()

def build_docx_report():
    doc = Document()

    # Configure Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Base Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = COLOR_BODY
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    # ==========================================
    # 1. TITLE PAGE
    # ==========================================
    p_badge = doc.add_paragraph()
    p_badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_badge.paragraph_format.space_before = Pt(36)
    r_badge = p_badge.add_run("ACADEMIC IT MICROPROJECT TECHNICAL REPORT")
    r_badge.bold = True
    r_badge.font.size = Pt(10)
    r_badge.font.color.rgb = COLOR_TEAL

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(18)
    p_title.paragraph_format.space_after = Pt(8)
    r_title = p_title.add_run("TRIPMIND AI")
    r_title.bold = True
    r_title.font.size = Pt(26)
    r_title.font.color.rgb = COLOR_NAVY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(24)
    r_sub = p_sub.add_run("Autonomous Agentic Travel Planning, Real-Time Grounded Intelligence &\nIn-Trip Concierge Platform")
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = COLOR_TEAL
    r_sub.bold = True

    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_desc.paragraph_format.space_after = Pt(40)
    r_desc = p_desc.add_run(
        "Submitted in partial fulfillment of the requirements for the Degree / Diploma in Information Technology\n"
        f"Academic Year {PROJECT_METADATA['academic_year']}"
    )
    r_desc.italic = True
    r_desc.font.size = Pt(10)
    r_desc.font.color.rgb = COLOR_MUTED

    # Meta Table on Cover Page
    cover_meta = [
        ["Lead Developer & System Architect:", f"{PROJECT_METADATA['lead_developer']}"],
        ["Domain & Architecture:", f"{PROJECT_METADATA['domain']}"],
        ["Project Supervisor / Guide:", f"{PROJECT_METADATA['supervisor']}"],
        ["Academic Institution:", f"{PROJECT_METADATA['institution']}"],
        ["Date of Submission:", f"{PROJECT_METADATA['submission_date']}"],
        ["Open-Source Repository:", f"{PROJECT_METADATA['repository']}"]
    ]
    add_styled_table(doc, ["Project Parameter", "Evaluation Details"], cover_meta)

    doc.add_page_break()

    # ==========================================
    # 2. CERTIFICATE OF ORIGINALITY
    # ==========================================
    h_cert = doc.add_heading("Certificate of Originality & Supervisor Sign-Off", level=1)
    h_cert.paragraph_format.space_before = Pt(12)
    for r in h_cert.runs:
        r.font.color.rgb = COLOR_NAVY

    p_cert = doc.add_paragraph(PRELIMINARY['certificate_text'])
    p_cert.paragraph_format.space_before = Pt(12)
    p_cert.paragraph_format.space_after = Pt(36)

    # Signature Block Table
    sig_table = doc.add_table(rows=2, cols=3)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    signatures = [
        ("Project Guide", PROJECT_METADATA['supervisor']),
        ("Head of Department", PROJECT_METADATA['hod']),
        ("External Examiner", "Academic Board Nominee")
    ]
    for idx, (role, name) in enumerate(signatures):
        cell_top = sig_table.cell(0, idx)
        cell_top.text = "________________________\n" + role
        set_cell_margins(cell_top, top=100, bottom=40, left=80, right=80)
        p0 = cell_top.paragraphs[0]
        p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p0.runs[0].bold = True
        p0.runs[0].font.size = Pt(9.5)

        cell_bot = sig_table.cell(1, idx)
        cell_bot.text = f"({name})"
        set_cell_margins(cell_bot, top=20, bottom=100, left=80, right=80)
        p1 = cell_bot.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p1.runs[0].font.size = Pt(8.5)
        p1.runs[0].font.color.rgb = COLOR_MUTED

    doc.add_page_break()

    # ==========================================
    # 3. DECLARATION & ACKNOWLEDGEMENTS
    # ==========================================
    h_dec = doc.add_heading("Declaration", level=1)
    for r in h_dec.runs:
        r.font.color.rgb = COLOR_NAVY
    doc.add_paragraph(PRELIMINARY['declaration_text'])

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(24)
    p_sig.paragraph_format.space_after = Pt(24)
    p_sig.add_run(f"Candidate Signature: _____________________\nName: {PROJECT_METADATA['lead_developer']}\nDate: {PROJECT_METADATA['submission_date']}")

    h_ack = doc.add_heading("Acknowledgements", level=1)
    for r in h_ack.runs:
        r.font.color.rgb = COLOR_NAVY
    for para in PRELIMINARY['acknowledgements_text'].split('\n\n'):
        doc.add_paragraph(para)

    doc.add_page_break()

    # ==========================================
    # 4. ABSTRACT / EXECUTIVE SUMMARY
    # ==========================================
    h_abs = doc.add_heading("Abstract / Executive Summary", level=1)
    for r in h_abs.runs:
        r.font.color.rgb = COLOR_NAVY

    add_callout_box(doc, "Executive Summary", PRELIMINARY['abstract'])

    doc.add_page_break()

    # ==========================================
    # 5. ABBREVIATION INDEX
    # ==========================================
    h_abbr = doc.add_heading("Abbreviation Index", level=1)
    for r in h_abbr.runs:
        r.font.color.rgb = COLOR_NAVY
    
    abbr_rows = [[abbr, desc, "TripMind AI Core"] for abbr, desc in ABBREVIATIONS]
    add_styled_table(doc, ["Acronym", "Full Expansion", "Domain Context"], abbr_rows)

    doc.add_page_break()

    # ==========================================
    # 6. CHAPTERS 1 TO 6
    # ==========================================
    chapters = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5, CHAPTER_6]
    for ch in chapters:
        h_ch = doc.add_heading(ch['title'], level=1)
        h_ch.paragraph_format.space_before = Pt(12)
        h_ch.paragraph_format.space_after = Pt(10)
        for r in h_ch.runs:
            r.font.color.rgb = COLOR_NAVY

        for sec in ch['sections']:
            h_sec = doc.add_heading(f"{sec['num']} {sec['title']}", level=2)
            h_sec.paragraph_format.space_before = Pt(10)
            h_sec.paragraph_format.space_after = Pt(4)
            for r in h_sec.runs:
                r.font.color.rgb = COLOR_TEAL

            # Parse content (paragraphs, code blocks, lists)
            content_str = sec['content']
            # Check for code blocks in content
            parts = re.split(r'```([a-z]*)\n([\s\S]*?)```', content_str)
            i = 0
            while i < len(parts):
                if i % 3 == 0:
                    text_chunk = parts[i]
                    for p_text in text_chunk.split('\n\n'):
                        if p_text.strip():
                            p = doc.add_paragraph()
                            # Parse inline bold
                            sub_parts = re.split(r'\*\*(.*?)\*\*', p_text)
                            for sp_idx, sp in enumerate(sub_parts):
                                run = p.add_run(sp)
                                if sp_idx % 2 == 1:
                                    run.bold = True
                elif i % 3 == 2:
                    code_chunk = parts[i]
                    add_code_block(doc, code_chunk)
                i += 1

            if "table" in sec:
                tbl = sec["table"]
                add_styled_table(doc, tbl["headers"], tbl["rows"])

        doc.add_page_break()

    # ==========================================
    # 7. REFERENCES
    # ==========================================
    h_ref = doc.add_heading("References (IEEE Format)", level=1)
    for r in h_ref.runs:
        r.font.color.rgb = COLOR_NAVY

    for idx, ref in enumerate(REFERENCES, 1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.first_line_indent = Inches(-0.4)
        p.paragraph_format.space_after = Pt(4)
        r_num = p.add_run(f"[{idx}] ")
        r_num.bold = True
        r_num.font.color.rgb = COLOR_NAVY
        p.add_run(ref)

    doc.add_page_break()

    # ==========================================
    # 8. APPENDICES
    # ==========================================
    h_app_a = doc.add_heading(APPENDIX_A['title'], level=1)
    for r in h_app_a.runs:
        r.font.color.rgb = COLOR_NAVY

    parts_a = re.split(r'```([a-z]*)\n([\s\S]*?)```', APPENDIX_A['content'])
    j = 0
    while j < len(parts_a):
        if j % 3 == 0:
            for p_text in parts_a[j].split('\n\n'):
                if p_text.strip():
                    doc.add_paragraph(p_text.strip())
        elif j % 3 == 2:
            add_code_block(doc, parts_a[j])
        j += 1

    doc.add_page_break()

    h_app_b = doc.add_heading(APPENDIX_B['title'], level=1)
    for r in h_app_b.runs:
        r.font.color.rgb = COLOR_NAVY

    parts_b = re.split(r'```([a-z]*)\n([\s\S]*?)```', APPENDIX_B['content'])
    k = 0
    while k < len(parts_b):
        if k % 3 == 0:
            for p_text in parts_b[k].split('\n\n'):
                if p_text.strip():
                    doc.add_paragraph(p_text.strip())
        elif k % 3 == 2:
            add_code_block(doc, parts_b[k])
        k += 1

    # Save Document
    doc.save(DOCX_FILE)
    print(f"SUCCESS: DOCX report saved to {DOCX_FILE} ({DOCX_FILE.stat().st_size:,} bytes)")

if __name__ == "__main__":
    build_docx_report()

"""
TripMind AI - Markdown, HTML and PDF Generator
Compiles TripMind_AI_IT_Microproject_Report.md, TripMind_AI_IT_Microproject_Report.html,
and uses Chrome Headless to compile TripMind_AI_IT_Microproject_Report.pdf.
"""

import os
import re
import subprocess
from pathlib import Path

from report_content import PROJECT_METADATA, PRELIMINARY, ABBREVIATIONS
from report_chapters import (
    CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4,
    CHAPTER_5, CHAPTER_6, REFERENCES, APPENDIX_A, APPENDIX_B
)

WORKSPACE = Path(r"c:\Users\Omkar\Desktop\TripMind AI")
CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

MD_FILE = WORKSPACE / "TripMind_AI_IT_Microproject_Report.md"
HTML_FILE = WORKSPACE / "TripMind_AI_IT_Microproject_Report.html"
PDF_FILE = WORKSPACE / "TripMind_AI_IT_Microproject_Report.pdf"

def generate_markdown() -> str:
    lines = []
    
    # Title & Metadata
    lines.append(f"# {PROJECT_METADATA['title']}")
    lines.append(f"### IT Microproject Technical Report")
    lines.append(f"**Domain:** {PROJECT_METADATA['domain']}  ")
    lines.append(f"**Author / Lead Developer:** {PROJECT_METADATA['lead_developer']} ({PROJECT_METADATA['role']})  ")
    lines.append(f"**Supervisor / Guide:** {PROJECT_METADATA['supervisor']}  ")
    lines.append(f"**Institution:** {PROJECT_METADATA['institution']}  ")
    lines.append(f"**Academic Year:** {PROJECT_METADATA['academic_year']} | **Submission Date:** {PROJECT_METADATA['submission_date']}  ")
    lines.append(f"**Repository:** [{PROJECT_METADATA['repository']}]({PROJECT_METADATA['repository']})  ")
    lines.append("\n---\n")

    # Certificate
    lines.append("## Certificate of Originality & Supervisor Sign-Off")
    lines.append(PRELIMINARY['certificate_text'])
    lines.append("\n```text")
    lines.append("____________________          ____________________          ____________________")
    lines.append(f"Project Guide                 Head of Department            External Examiner")
    lines.append(f"({PROJECT_METADATA['supervisor']})       ({PROJECT_METADATA['hod']})   ")
    lines.append("```\n")
    lines.append("---\n")

    # Declaration
    lines.append("## Declaration")
    lines.append(PRELIMINARY['declaration_text'])
    lines.append(f"\n**Candidate Signature:** ____________________  \n**Name:** {PROJECT_METADATA['lead_developer']}  \n**Date:** {PROJECT_METADATA['submission_date']}\n")
    lines.append("---\n")

    # Acknowledgements
    lines.append("## Acknowledgements")
    lines.append(PRELIMINARY['acknowledgements_text'])
    lines.append("\n---\n")

    # Executive Summary / Abstract
    lines.append("## Abstract / Executive Summary")
    lines.append(PRELIMINARY['abstract'])
    lines.append("\n---\n")

    # Abbreviations
    lines.append("## Abbreviation Index")
    lines.append("| Acronym | Expansion / Description |")
    lines.append("| :--- | :--- |")
    for abbr, desc in ABBREVIATIONS:
        lines.append(f"| **{abbr}** | {desc} |")
    lines.append("\n---\n")

    # Chapters 1 to 6
    chapters = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5, CHAPTER_6]
    for ch in chapters:
        lines.append(f"## {ch['title']}")
        for sec in ch['sections']:
            lines.append(f"### {sec['num']} {sec['title']}")
            lines.append(sec['content'])
            if "table" in sec:
                tbl = sec["table"]
                headers = tbl["headers"]
                lines.append("\n| " + " | ".join(headers) + " |")
                lines.append("| " + " | ".join([":---" for _ in headers]) + " |")
                for row in tbl["rows"]:
                    lines.append("| " + " | ".join(row) + " |")
                lines.append("")
        lines.append("\n---\n")

    # References
    lines.append("## References (IEEE Format)")
    for idx, ref in enumerate(REFERENCES, 1):
        lines.append(f"[{idx}] {ref}\n")
    lines.append("\n---\n")

    # Appendices
    lines.append(f"## {APPENDIX_A['title']}")
    lines.append(APPENDIX_A['content'])
    lines.append("\n---\n")

    lines.append(f"## {APPENDIX_B['title']}")
    lines.append(APPENDIX_B['content'])

    return "\n".join(lines)


def generate_html(md_text: str) -> str:
    # Build complete luxury HTML with print styling
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{PROJECT_METADATA['short_title']} - IT Microproject Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

  @page {{
    size: A4;
    margin: 20mm 15mm 20mm 15mm;
    @bottom-center {{
      content: "Page " counter(page);
      font-size: 8pt;
      color: #64748b;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }}
  }}

  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    background: #f8fafc;
    line-height: 1.6;
    font-size: 10pt;
    margin: 0;
    padding: 0;
  }}

  .doc-wrapper {{
    max-width: 860px;
    margin: 0 auto;
    background: #ffffff;
    padding: 40px 48px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.06);
  }}

  @media print {{
    body {{
      background: #ffffff;
    }}
    .doc-wrapper {{
      max-width: 100%;
      padding: 0;
      box-shadow: none;
    }}
    .page-break {{
      page-break-before: always !important;
      break-before: page !important;
    }}
    .avoid-break {{
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }}
  }}

  /* Typography */
  h1.cover-title {{
    font-family: 'Cinzel', serif;
    font-size: 24pt;
    color: #0f172a;
    text-align: center;
    line-height: 1.25;
    margin-bottom: 8px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }}

  h2.cover-subtitle {{
    font-size: 13pt;
    font-weight: 600;
    color: #0d9488;
    text-align: center;
    margin-top: 0;
    margin-bottom: 30px;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }}

  h2.section-header {{
    font-size: 15pt;
    color: #0f172a;
    border-bottom: 2px solid #0d9488;
    padding-bottom: 6px;
    margin-top: 36px;
    margin-bottom: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
  }}

  h3.subsection-header {{
    font-size: 12pt;
    color: #1e3a8a;
    margin-top: 22px;
    margin-bottom: 8px;
    font-weight: 600;
  }}

  p {{
    margin: 8px 0;
    text-align: justify;
  }}

  /* Cover Page Styling */
  .cover-card {{
    text-align: center;
    padding: 40px 20px;
    border: 3px double #cbd5e1;
    border-radius: 8px;
    margin-bottom: 40px;
    background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
  }}

  .cover-badge {{
    display: inline-block;
    background: #0f172a;
    color: #ffffff;
    font-size: 8.5pt;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 20px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 24px;
  }}

  .cover-meta-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 40px;
    text-align: left;
    background: #f1f5f9;
    padding: 20px;
    border-radius: 6px;
    border-left: 4px solid #0d9488;
    font-size: 9.5pt;
  }}

  .cover-meta-grid strong {{
    color: #0f172a;
  }}

  /* Certificate Border Box */
  .cert-box {{
    border: 2px solid #0f172a;
    padding: 30px;
    border-radius: 4px;
    background: #fafafa;
    margin: 20px 0 40px 0;
    position: relative;
  }}

  .cert-title {{
    text-align: center;
    font-family: 'Cinzel', serif;
    font-size: 16pt;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 20px;
  }}

  .sign-grid {{
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 20px;
    margin-top: 50px;
    text-align: center;
    font-size: 9pt;
  }}

  .sign-line {{
    border-top: 1px solid #64748b;
    padding-top: 6px;
    font-weight: 600;
    color: #334155;
  }}

  /* Tables */
  .table-container {{
    overflow-x: auto;
    margin: 16px 0;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    margin-bottom: 12px;
  }}

  th {{
    background: #0f172a;
    color: #ffffff;
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #334155;
  }}

  td {{
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
  }}

  tr:nth-child(even) td {{
    background: #f8fafc;
  }}

  /* Code & Snippets */
  pre {{
    background: #0f172a;
    color: #f1f5f9;
    padding: 14px 16px;
    border-radius: 6px;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8pt;
    overflow-x: auto;
    line-height: 1.45;
    margin: 14px 0;
    border-left: 4px solid #0d9488;
  }}

  code {{
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8.5pt;
    background: #e2e8f0;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 3px;
  }}

  pre code {{
    background: transparent;
    color: inherit;
    padding: 0;
  }}

  /* Callout & Alerts */
  .callout {{
    background: #f0fdfa;
    border-left: 4px solid #0d9488;
    padding: 12px 18px;
    border-radius: 0 6px 6px 0;
    margin: 16px 0;
    font-size: 9.5pt;
  }}

  .callout-title {{
    font-weight: 700;
    color: #0f766e;
    margin-bottom: 4px;
  }}

  /* References */
  .ref-item {{
    margin-bottom: 8px;
    padding-left: 28px;
    text-indent: -28px;
    font-size: 8.5pt;
    color: #334155;
  }}

  hr.divider {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 28px 0;
  }}
</style>
</head>
<body>

<div class="doc-wrapper">

  <!-- COVER PAGE -->
  <div class="cover-card">
    <div class="cover-badge">Academic IT Microproject Report &bull; Academic Year 2025&ndash;2026</div>
    <h1 class="cover-title">TRIPMIND AI</h1>
    <h2 class="cover-subtitle">Autonomous Agentic Travel Planning, Real-Time Grounded Intelligence & In-Trip Concierge Platform</h2>
    
    <p style="text-align: center; max-width: 650px; margin: 0 auto; color: #475569; font-size: 9.5pt;">
      A comprehensive technical evaluation report submitted in partial fulfillment of the requirements for the Degree / Diploma in Information Technology.
    </p>

    <div class="cover-meta-grid">
      <div>
        <strong>Author & Lead Architect:</strong><br>
        {PROJECT_METADATA['lead_developer']}<br>
        <span style="font-size: 8pt; color: #64748b;">Full-Stack & Agentic AI Specialist</span>
      </div>
      <div>
        <strong>Academic Project Guide:</strong><br>
        {PROJECT_METADATA['supervisor']}<br>
        <span style="font-size: 8pt; color: #64748b;">Department of Information Technology</span>
      </div>
      <div>
        <strong>Domain & Specialization:</strong><br>
        Autonomous Agentic AI, GIS, Distributed Cloud Systems
      </div>
      <div>
        <strong>Institution & Submission:</strong><br>
        {PROJECT_METADATA['institution']}<br>
        <span style="font-size: 8pt; color: #64748b;">Submission Date: {PROJECT_METADATA['submission_date']}</span>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- CERTIFICATE -->
  <div class="cert-box">
    <div class="cert-title">Certificate of Originality & Supervisor Sign-Off</div>
    <p>{PRELIMINARY['certificate_text']}</p>
    <div class="sign-grid">
      <div>
        <div class="sign-line">Project Guide</div>
        <div style="font-size: 8pt; color: #64748b;">{PROJECT_METADATA['supervisor']}</div>
      </div>
      <div>
        <div class="sign-line">Head of Department</div>
        <div style="font-size: 8pt; color: #64748b;">{PROJECT_METADATA['hod']}</div>
      </div>
      <div>
        <div class="sign-line">External Examiner</div>
        <div style="font-size: 8pt; color: #64748b;">Academic Board Nominee</div>
      </div>
    </div>
  </div>

  <hr class="divider">

  <!-- DECLARATION -->
  <h2 class="section-header">Declaration</h2>
  <p>{PRELIMINARY['declaration_text']}</p>
  <div style="margin-top: 30px; display: flex; justify-content: space-between;">
    <div><strong>Place:</strong> Pune, India<br><strong>Date:</strong> {PROJECT_METADATA['submission_date']}</div>
    <div style="text-align: right;"><strong>Candidate Signature:</strong> _________________________<br><strong>({PROJECT_METADATA['lead_developer']})</strong></div>
  </div>

  <hr class="divider">

  <!-- ACKNOWLEDGEMENTS -->
  <h2 class="section-header">Acknowledgements</h2>
  <p>{PRELIMINARY['acknowledgements_text'].replace('\\n\\n', '</p><p>')}</p>

  <div class="page-break"></div>

  <!-- ABSTRACT -->
  <h2 class="section-header">Abstract / Executive Summary</h2>
  <div class="callout">
    <div class="callout-title">Executive Summary</div>
    <p>{PRELIMINARY['abstract'].replace('\\n\\n', '</p><p>')}</p>
  </div>

  <hr class="divider">

  <!-- ABBREVIATIONS -->
  <h2 class="section-header">Abbreviation Index</h2>
  <div class="table-container">
    <table>
      <thead>
        <tr><th>Acronym</th><th>Expansion / Definition</th><th>Domain Context</th></tr>
      </thead>
      <tbody>
"""

    for abbr, desc in ABBREVIATIONS:
        html += f"        <tr><td><strong>{abbr}</strong></td><td>{desc}</td><td>TripMind AI Architecture</td></tr>\n"

    html += """      </tbody>
    </table>
  </div>

  <div class="page-break"></div>
"""

    # Chapters Loop
    chapters = [CHAPTER_1, CHAPTER_2, CHAPTER_3, CHAPTER_4, CHAPTER_5, CHAPTER_6]
    for ch in chapters:
        html += f"""
  <!-- {ch['title'].upper()} -->
  <div class="page-break"></div>
  <h2 class="section-header">{ch['title']}</h2>
"""
        for sec in ch['sections']:
            html += f"""
  <h3 class="subsection-header">{sec['num']} {sec['title']}</h3>
"""
            # Convert text formatting (paragraphs, bold, code)
            raw_content = sec['content']
            paragraphs = raw_content.split('\n\n')
            for p_text in paragraphs:
                p_text_clean = p_text.replace('\n', '<br>')
                p_text_clean = re.sub(r'```([a-z]*)\n([\s\S]*?)```', r'<pre><code>\2</code></pre>', p_text_clean)
                p_text_clean = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', p_text_clean)
                p_text_clean = re.sub(r'`(.*?)`', r'<code>\1</code>', p_text_clean)
                if p_text_clean.startswith('<pre>'):
                    html += f"  {p_text_clean}\n"
                else:
                    html += f"  <p>{p_text_clean}</p>\n"

            if "table" in sec:
                tbl = sec["table"]
                html += """
  <div class="table-container">
    <table>
      <thead>
        <tr>
"""
                for h in tbl["headers"]:
                    html += f"          <th>{h}</th>\n"
                html += """        </tr>
      </thead>
      <tbody>
"""
                for row in tbl["rows"]:
                    html += "        <tr>\n"
                    for c in row:
                        html += f"          <td>{c}</td>\n"
                    html += "        </tr>\n"
                html += """      </tbody>
    </table>
  </div>
"""

    # References
    html += f"""
  <!-- REFERENCES -->
  <div class="page-break"></div>
  <h2 class="section-header">References (IEEE / APA Format)</h2>
"""
    for idx, ref in enumerate(REFERENCES, 1):
        html += f'  <div class="ref-item">[{idx}] {ref}</div>\n'

    # Appendices
    html += f"""
  <!-- APPENDIX A -->
  <div class="page-break"></div>
  <h2 class="section-header">{APPENDIX_A['title']}</h2>
"""
    raw_app_a = APPENDIX_A['content']
    raw_app_a = re.sub(r'```([a-z]*)\n([\s\S]*?)```', r'<pre><code>\2</code></pre>', raw_app_a)
    for p in raw_app_a.split('\n\n'):
        if p.startswith('<pre>'):
            html += f"  {p}\n"
        else:
            html += f"  <p>{p.replace(chr(10), '<br>')}</p>\n"

    html += f"""
  <!-- APPENDIX B -->
  <div class="page-break"></div>
  <h2 class="section-header">{APPENDIX_B['title']}</h2>
"""
    raw_app_b = APPENDIX_B['content']
    raw_app_b = re.sub(r'```([a-z]*)\n([\s\S]*?)```', r'<pre><code>\2</code></pre>', raw_app_b)
    for p in raw_app_b.split('\n\n'):
        if p.startswith('<pre>'):
            html += f"  {p}\n"
        else:
            html += f"  <p>{p.replace(chr(10), '<br>')}</p>\n"

    html += """
  <hr class="divider">
  <div style="text-align: center; font-size: 8.5pt; color: #64748b; margin-top: 30px;">
    TripMind AI &bull; IT Microproject Technical Report &bull; Academic Year 2025&ndash;2026 &bull; Author: Omkar Narsale
  </div>

</div>
</body>
</html>
"""
    return html

def main():
    print("Generating Markdown report...")
    md_content = generate_markdown()
    with open(MD_FILE, "w", encoding="utf-8") as f:
        f.write(md_content)
    print(f"SUCCESS: Markdown report written to {MD_FILE} ({len(md_content)} bytes)")

    print("Generating HTML report...")
    html_content = generate_html(md_content)
    with open(HTML_FILE, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"SUCCESS: HTML report written to {HTML_FILE} ({len(html_content)} bytes)")

    print("Executing Chrome Headless to generate PDF...")
    cmd = [
        CHROME_PATH,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={PDF_FILE}",
        str(HTML_FILE)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if PDF_FILE.exists():
        size = PDF_FILE.stat().st_size
        print(f"SUCCESS: PDF report generated at {PDF_FILE} ({size:,} bytes)")
    else:
        print(f"ERROR: PDF generation failed. Stderr: {res.stderr}")

if __name__ == "__main__":
    main()

import os
import re
import subprocess
from pathlib import Path

def convert_markdown_to_html(md_text: str) -> str:
    # Process code blocks first to preserve content
    code_blocks = []
    def save_code_block(match):
        lang = match.group(1) or ""
        code = match.group(2)
        idx = len(code_blocks)
        code_blocks.append((lang, code))
        return f"__CODE_BLOCK_{idx}__"

    md_text = re.sub(r'```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```', save_code_block, md_text)

    # Process blockquotes / alerts
    lines = md_text.split('\n')
    out_lines = []
    in_table = False
    table_lines = []

    def flush_table(tbl_lines):
        if not tbl_lines:
            return ""
        # parse table lines
        header_line = tbl_lines[0]
        rows = tbl_lines[2:] if len(tbl_lines) > 2 else []
        headers = [c.strip() for c in header_line.strip('|').split('|')]
        
        html = '<div class="table-container"><table>\n<thead>\n<tr>\n'
        for h in headers:
            html += f'  <th>{h}</th>\n'
        html += '</tr>\n</thead>\n<tbody>\n'
        for r in rows:
            cols = [c.strip() for c in r.strip('|').split('|')]
            html += '<tr>\n'
            for idx, c in enumerate(cols):
                # format inner markdown bold/code
                c = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', c)
                c = re.sub(r'\*(.*?)\*', r'<em>\1</em>', c)
                c = re.sub(r'`(.*?)`', r'<code>\1</code>', c)
                c = c.replace('<br>', '<br/>')
                html += f'  <td>{c}</td>\n'
            html += '</tr>\n'
        html += '</tbody>\n</table></div>\n'
        return html

    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Table detection
        if line.strip().startswith('|') and '|' in line.strip()[1:]:
            if not in_table:
                in_table = True
                table_lines = [line]
            else:
                table_lines.append(line)
            i += 1
            continue
        else:
            if in_table:
                out_lines.append(flush_table(table_lines))
                in_table = False
                table_lines = []

        # Headings
        if line.startswith('# '):
            out_lines.append(f'<h1 class="doc-title">{line[2:].strip()}</h1>')
        elif line.startswith('## '):
            sec_num = line[3:].strip().split(' ')[0]
            page_break = ' page-break' if sec_num and sec_num[0].isdigit() and sec_num[0] in ['2', '3', '4', '5', '6', '7', '8'] else ''
            out_lines.append(f'<h2 class="section-heading{page_break}">{line[3:].strip()}</h2>')
        elif line.startswith('### '):
            out_lines.append(f'<h3 class="subsection-heading">{line[4:].strip()}</h3>')
        elif line.startswith('#### '):
            out_lines.append(f'<h4 class="sub-subsection-heading">{line[5:].strip()}</h4>')
        elif line.startswith('---'):
            out_lines.append('<hr class="divider"/>')
        elif line.startswith('> '):
            quote_text = line[2:].strip()
            quote_text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', quote_text)
            quote_text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', quote_text)
            out_lines.append(f'<blockquote class="callout"><p>{quote_text}</p></blockquote>')
        elif line.startswith('- ') or line.startswith('* '):
            item = line[2:].strip()
            item = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', item)
            item = re.sub(r'`(.*?)`', r'<code>\1</code>', item)
            out_lines.append(f'<li class="bullet-item">{item}</li>')
        elif re.match(r'^\d+\.\s', line):
            m = re.match(r'^(\d+)\.\s(.*)$', line)
            num = m.group(1)
            item = m.group(2).strip()
            item = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', item)
            item = re.sub(r'`(.*?)`', r'<code>\1</code>', item)
            out_lines.append(f'<div class="numbered-item"><span class="num-badge">{num}</span><span>{item}</span></div>')
        else:
            if line.strip():
                p = line.strip()
                p = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', p)
                p = re.sub(r'\*(.*?)\*', r'<em>\1</em>', p)
                p = re.sub(r'`(.*?)`', r'<code>\1</code>', p)
                out_lines.append(f'<p>{p}</p>')
            else:
                out_lines.append('')
        i += 1

    if in_table:
        out_lines.append(flush_table(table_lines))

    intermediate = '\n'.join(out_lines)

    # Re-inject code blocks
    def replace_code_block(match):
        idx = int(match.group(1))
        lang, code = code_blocks[idx]
        if lang == 'mermaid':
            # Render styled SVG container / clean diagram view
            return f'<div class="diagram-card"><div class="diagram-tag">SYSTEM ARCHITECTURE DIAGRAM</div><pre class="mermaid-diagram">{code.strip()}</pre></div>'
        elif lang in ['text', 'bash', 'env', 'python', 'json', 'sql']:
            return f'<div class="code-card"><div class="code-header"><span class="code-dot red"></span><span class="code-dot yellow"></span><span class="code-dot green"></span><span class="code-lang">{lang.upper()}</span></div><pre class="code-content"><code>{code.strip()}</code></pre></div>'
        else:
            return f'<div class="code-card"><pre class="code-content"><code>{code.strip()}</code></pre></div>'

    final_html = re.sub(r'__CODE_BLOCK_(\d+)__', replace_code_block, intermediate)
    return final_html

def build_full_html_document(content_html: str) -> str:
    html_template = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>TripMind AI - Stage 2 Technical Documentation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  @page {{
    size: A4;
    margin: 16mm 14mm 16mm 14mm;
    @bottom-right {{
      content: counter(page);
    }}
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.6;
    font-size: 10pt;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}

  .doc-container {{
    max-width: 100%;
    margin: 0 auto;
  }}

  /* Page break utilities */
  .page-break {{
    page-break-before: always;
    break-before: page;
    padding-top: 10px;
  }}

  .no-break {{
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  /* Headers */
  h1.doc-title {{
    font-size: 20pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
    border-bottom: 3px solid #0d9488;
    padding-bottom: 8px;
  }}

  h2.section-heading {{
    font-size: 14pt;
    font-weight: 700;
    color: #0f172a;
    margin-top: 22px;
    margin-bottom: 10px;
    padding-bottom: 4px;
    border-bottom: 1.5px solid #cbd5e1;
    display: flex;
    align-items: center;
  }}

  h3.subsection-heading {{
    font-size: 11.5pt;
    font-weight: 600;
    color: #0f766e;
    margin-top: 14px;
    margin-bottom: 6px;
  }}

  h4.sub-subsection-heading {{
    font-size: 10.5pt;
    font-weight: 600;
    color: #334155;
    margin-top: 10px;
    margin-bottom: 4px;
  }}

  p {{
    margin-bottom: 8px;
    text-align: justify;
    color: #334155;
  }}

  strong {{
    color: #0f172a;
  }}

  code {{
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #0f766e;
    padding: 1px 4px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }}

  hr.divider {{
    border: none;
    height: 1px;
    background: #e2e8f0;
    margin: 16px 0;
  }}

  /* Callouts */
  blockquote.callout {{
    border-left: 3.5px solid #0d9488;
    background: #f0fdfa;
    padding: 8px 12px;
    margin: 10px 0;
    border-radius: 0 6px 6px 0;
    font-size: 9.5pt;
    color: #134e4a;
    page-break-inside: avoid;
  }}

  /* Lists */
  li.bullet-item {{
    margin-left: 18px;
    margin-bottom: 4px;
    color: #334155;
  }}

  .numbered-item {{
    display: flex;
    align-items: flex-start;
    margin-bottom: 6px;
    margin-top: 4px;
  }}

  .num-badge {{
    background: #0f766e;
    color: #ffffff;
    font-weight: 700;
    font-size: 8pt;
    min-width: 18px;
    height: 18px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: 8px;
    margin-top: 2px;
    flex-shrink: 0;
  }}

  /* Tables */
  .table-container {{
    width: 100%;
    margin: 10px 0 14px 0;
    page-break-inside: avoid;
    break-inside: avoid;
    overflow-x: auto;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 8.5pt;
    text-align: left;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
  }}

  th {{
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 600;
    padding: 6px 8px;
    border: 1px solid #334155;
    letter-spacing: 0.2px;
  }}

  td {{
    padding: 5px 8px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
    color: #334155;
  }}

  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}

  /* Code Cards */
  .code-card {{
    background: #0f172a;
    border-radius: 6px;
    margin: 10px 0;
    overflow: hidden;
    border: 1px solid #1e293b;
    page-break-inside: avoid;
  }}

  .code-header {{
    background: #1e293b;
    padding: 4px 10px;
    display: flex;
    align-items: center;
  }}

  .code-dot {{
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
  }}
  .code-dot.red {{ background: #ef4444; }}
  .code-dot.yellow {{ background: #f59e0b; }}
  .code-dot.green {{ background: #10b981; }}

  .code-lang {{
    color: #94a3b8;
    font-size: 7.5pt;
    font-weight: 600;
    margin-left: 6px;
    letter-spacing: 0.5px;
  }}

  pre.code-content {{
    padding: 8px 12px;
    overflow-x: auto;
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 8pt;
    color: #e2e8f0;
    line-height: 1.45;
  }}

  /* Diagram Cards */
  .diagram-card {{
    background: #f8fafc;
    border: 1.5px solid #0d9488;
    border-radius: 8px;
    padding: 10px 14px;
    margin: 12px 0;
    page-break-inside: avoid;
  }}

  .diagram-tag {{
    display: inline-block;
    background: #0d9488;
    color: #ffffff;
    font-size: 7pt;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }}

  pre.mermaid-diagram {{
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 7.5pt;
    color: #0f172a;
    white-space: pre-wrap;
    background: #ffffff;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }}

  /* Footer badge */
  .footer-note {{
    margin-top: 24px;
    text-align: center;
    font-size: 8pt;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 8px;
  }}
</style>
</head>
<body>
<div class="doc-container">
{content_html}
<div class="footer-note">
  TripMind AI &bull; Stage 2 Technical Project Documentation &bull; Academic Year 2025&ndash;2026 &bull; Lead: Omkar Narsale
</div>
</div>
</body>
</html>
"""
    return html_template

def main():
    workspace = Path(r"c:\Users\Omkar\Desktop\TripMind AI")
    md_file = workspace / "STAGE_2_DOCUMENTATION.md"
    html_file = workspace / "STAGE_2_DOCUMENTATION.html"
    pdf_file = workspace / "STAGE_2_DOCUMENTATION.pdf"

    print("Reading markdown file:", md_file)
    with open(md_file, "r", encoding="utf-8") as f:
        md_text = f.read()

    print("Converting to styled HTML...")
    content_html = convert_markdown_to_html(md_text)
    full_html = build_full_html_document(content_html)

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(full_html)
    print("HTML saved to:", html_file)

    # Use Chrome headless to print to PDF
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_file}",
        str(html_file)
    ]
    print("Executing Chrome headless PDF print...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    print("Chrome output:", res.stdout, res.stderr)

    if pdf_file.exists():
        size = pdf_file.stat().st_size
        print(f"SUCCESS: PDF generated at {pdf_file} ({size} bytes)")
    else:
        print("ERROR: PDF file was not created.")

if __name__ == "__main__":
    main()

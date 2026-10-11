"""
TripMind AI - Master Build Script for IT Microproject Report
Generates:
1. TripMind_AI_IT_Microproject_Report.md
2. TripMind_AI_IT_Microproject_Report.html
3. TripMind_AI_IT_Microproject_Report.pdf
4. TripMind_AI_IT_Microproject_Report.docx
"""

import sys
import subprocess
from pathlib import Path

WORKSPACE = Path(r"c:\Users\Omkar\Desktop\TripMind AI")

def run_build():
    print("==================================================")
    print(" Building TripMind AI IT Microproject Reports     ")
    print("==================================================")

    # 1. Generate MD, HTML and PDF
    print("\n[Step 1/2] Generating Markdown, HTML and PDF...")
    res1 = subprocess.run([sys.executable, str(WORKSPACE / "generate_md_and_html.py")], capture_output=True, text=True)
    print(res1.stdout)
    if res1.returncode != 0:
        print("Error during MD/HTML/PDF build:", res1.stderr)
        return False

    # 2. Generate DOCX
    print("\n[Step 2/2] Generating DOCX...")
    res2 = subprocess.run([sys.executable, str(WORKSPACE / "generate_docx.py")], capture_output=True, text=True)
    print(res2.stdout)
    if res2.returncode != 0:
        print("Error during DOCX build:", res2.stderr)
        return False

    # Check generated files
    files = [
        WORKSPACE / "TripMind_AI_IT_Microproject_Report.md",
        WORKSPACE / "TripMind_AI_IT_Microproject_Report.html",
        WORKSPACE / "TripMind_AI_IT_Microproject_Report.pdf",
        WORKSPACE / "TripMind_AI_IT_Microproject_Report.docx"
    ]

    print("\n==================================================")
    print(" Verification of Generated Artifacts:")
    all_ok = True
    for f in files:
        if f.exists():
            size = f.stat().st_size
            print(f"  [OK] {f.name} ({size:,} bytes)")
        else:
            print(f"  [MISSING] {f.name}")
            all_ok = False
    print("==================================================")
    return all_ok

if __name__ == "__main__":
    success = run_build()
    if not success:
        sys.exit(1)

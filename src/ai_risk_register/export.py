"""Export utilities for CSV and PDF report generation."""

import csv
import io
from pathlib import Path
from typing import Dict, List, Optional

from ai_risk_register.models import Control, Risk, RiskAssessment, UseCase


def export_csv(
    usecases: List[UseCase],
    assessments_by_uc: Dict[str, List[RiskAssessment]],
    risk_map: Dict[str, Risk],
    control_map: Dict[str, Control],
) -> str:
    """Generate a CSV string with all risk assessment data."""
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "UseCase ID",
            "UseCase Name",
            "AI Act Class",
            "Risk ID",
            "Risk Name",
            "Category",
            "Impact",
            "Likelihood",
            "Exposure",
            "Score",
            "Level",
            "EU AI Act",
            "NIS2",
            "DORA",
            "Mitigations",
        ]
    )
    for uc in usecases:
        for assessment in assessments_by_uc.get(uc.id, []):
            risk = risk_map.get(assessment.risk_id)
            if not risk:
                continue
            mitigation_names = []
            for mid in assessment.mitigations:
                ctrl = control_map.get(mid)
                mitigation_names.append(f"{mid}: {ctrl.name}" if ctrl else mid)
            writer.writerow(
                [
                    uc.id,
                    uc.name,
                    uc.ai_act_class or "Not classified",
                    risk.id,
                    risk.name,
                    risk.category,
                    assessment.impact,
                    assessment.likelihood,
                    assessment.exposure,
                    assessment.score,
                    assessment.level,
                    "; ".join(risk.eu_ai_act),
                    "; ".join(risk.nis2),
                    "; ".join(risk.dora) if risk.dora else "",
                    "; ".join(mitigation_names),
                ]
            )
    return buf.getvalue()


def pdf_bytes(markdown_text: str) -> Optional[bytes]:
    """Render a Markdown report to a simple PDF. Returns None when reportlab
    is not installed."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
    except Exception:
        return None

    temp_path = Path(".streamlit_report_tmp.pdf")
    try:
        c = canvas.Canvas(str(temp_path), pagesize=letter)
        width, height = letter
        y = height - 72
        for line in markdown_text.splitlines():
            if y < 72:
                c.showPage()
                y = height - 72
            c.drawString(72, y, line[:110])
            y -= 14
        c.save()
        data = temp_path.read_bytes()
    finally:
        if temp_path.exists():
            temp_path.unlink()
    return data

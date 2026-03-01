"""Streamlit multi-page UI for the AI Risk Register."""

from dataclasses import replace
from pathlib import Path
from typing import Dict, List, Optional

from ai_risk_register.ai_act import (
    AIActClass,
    CLASSIFICATION_COLORS,
    CLASSIFICATION_LABELS,
    classify,
    get_next_question,
    load_rules,
)
from ai_risk_register.export import export_csv, pdf_bytes
from ai_risk_register.models import Control, Risk, RiskAssessment, UseCase
from ai_risk_register.recommendations import recommend
from ai_risk_register.report import build_control_map, build_risk_map, render_markdown
from ai_risk_register.scoring import assess_usecase
from ai_risk_register.storage import load_models, save_models


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _data_path(data_dir: str, stem: str) -> Path:
    base = Path(data_dir)
    for suffix in (".json", ".yaml", ".yml"):
        candidate = base / f"{stem}{suffix}"
        if candidate.exists():
            return candidate
    return base / f"{stem}.json"


_SEVERITY_COLORS = {
    "Low": "#2e7d32",
    "Medium": "#f9a825",
    "High": "#e65100",
    "Critical": "#b71c1c",
}

_SEVERITY_GRADIENTS = {
    "Low": "linear-gradient(135deg, #e8f5e9 0%, #f5fbf6 100%)",
    "Medium": "linear-gradient(135deg, #fff8e1 0%, #fffdf6 100%)",
    "High": "linear-gradient(135deg, #fff3e0 0%, #fff8f1 100%)",
    "Critical": "linear-gradient(135deg, #ffebee 0%, #fff5f6 100%)",
}

_PAGES = [
    "Dashboard",
    "AI Systems",
    "Add / Edit System",
    "Risk Catalog",
    "AI Act Classification",
]


def _severity_badge_html(level: str) -> str:
    color = _SEVERITY_COLORS.get(level, "#455a64")
    return (
        f"<span style='padding:4px 12px;border-radius:999px;"
        f"background:{color};color:#fff;font-size:0.78rem;font-weight:600;'>"
        f"{level}</span>"
    )


def _act_badge_html(act_class: Optional[str]) -> str:
    if not act_class:
        return "<span style='color:#90a4ae;font-size:0.85rem;'>Not classified</span>"
    label = CLASSIFICATION_LABELS.get(act_class, act_class)
    color = CLASSIFICATION_COLORS.get(act_class, "#455a64")
    return (
        f"<span style='padding:4px 12px;border-radius:999px;"
        f"background:{color};color:#fff;font-size:0.78rem;font-weight:600;'>"
        f"{label}</span>"
    )


def _next_id(prefix: str, existing_ids: List[str]) -> str:
    """Generate the next sequential ID like UC-003 or R-006."""
    nums = []
    for eid in existing_ids:
        parts = eid.split("-", 1)
        if len(parts) == 2 and parts[1].isdigit():
            nums.append(int(parts[1]))
    nxt = max(nums, default=0) + 1
    return f"{prefix}-{nxt:03d}"


# ---------------------------------------------------------------------------
# CSS
# ---------------------------------------------------------------------------

_CSS = """
<style>
html, body, [class*="css"] {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.app-header { padding:16px 0 8px 0; border-bottom:1px solid #e0e6ed; margin-bottom:16px; }
.app-title { font-size:2rem; font-weight:700; margin:0; }
.app-subtitle { color:#607d8b; margin-top:4px; font-size:0.95rem; }
.kpi-card {
    padding:18px 16px; border-radius:12px; text-align:center;
    background:linear-gradient(135deg,#f5f7f9 0%,#ffffff 100%);
    border:1px solid #e0e6ed;
}
.kpi-value { font-size:2rem; font-weight:700; }
.kpi-label { color:#607d8b; font-size:0.85rem; margin-top:4px; }
.risk-card { padding:16px; border-radius:12px; margin-top:8px; }
.risk-header { display:flex; align-items:center; justify-content:space-between; }
.risk-title { font-size:1.1rem; font-weight:600; }
.risk-subtitle { color:#607d8b; font-size:0.9rem; margin-top:2px; }
.risk-desc { margin-top:10px; color:#455a64; }
.risk-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-top:12px; }
.risk-regs { margin-top:10px; color:#455a64; }
.footer { margin-top:24px; padding:12px 0; border-top:1px solid #e0e6ed; color:#90a4ae; text-align:center; font-size:0.85rem; }
@media (max-width:900px) { .risk-metrics { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:600px) { .risk-metrics { grid-template-columns:repeat(1,minmax(0,1fr)); } }
</style>
"""


# ---------------------------------------------------------------------------
# Data loading / saving helpers
# ---------------------------------------------------------------------------

def _load_all(data_dir: str):
    """Return (risks, usecases, controls) loaded from data_dir."""
    import streamlit as st

    risks = load_models(_data_path(data_dir, "risk_catalog"), Risk)
    usecases = load_models(_data_path(data_dir, "use_cases"), UseCase)
    controls = load_models(_data_path(data_dir, "controls"), Control)
    return risks, usecases, controls


def _save_usecases(data_dir: str, usecases: List[UseCase]) -> None:
    save_models(_data_path(data_dir, "use_cases"), usecases)


def _save_risks(data_dir: str, risks: List[Risk]) -> None:
    save_models(_data_path(data_dir, "risk_catalog"), risks)


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

def _page_dashboard(
    st,
    risks: List[Risk],
    usecases: List[UseCase],
    controls: List[Control],
) -> None:
    """Dashboard with KPIs, Plotly risk matrix, and charts."""
    risk_map = build_risk_map(risks)
    control_map = build_control_map(controls)

    # Compute all assessments across all use cases
    all_assessments: Dict[str, List[RiskAssessment]] = {}
    flat_assessments: List[RiskAssessment] = []
    for uc in usecases:
        a = assess_usecase(uc, risks)
        all_assessments[uc.id] = a
        flat_assessments.extend(a)

    # --- KPI row ---
    st.markdown("### Key Indicators")
    k1, k2, k3, k4, k5 = st.columns(5)
    k1.markdown(
        f"<div class='kpi-card'><div class='kpi-value'>{len(usecases)}</div>"
        f"<div class='kpi-label'>AI Systems</div></div>",
        unsafe_allow_html=True,
    )
    act_counts: Dict[str, int] = {}
    for uc in usecases:
        cls_label = uc.ai_act_class or "Not classified"
        act_counts[cls_label] = act_counts.get(cls_label, 0) + 1
    high_risk_count = act_counts.get("HIGH_RISK", 0)
    k2.markdown(
        f"<div class='kpi-card'><div class='kpi-value' style='color:#e65100;'>{high_risk_count}</div>"
        f"<div class='kpi-label'>High-Risk (AI Act)</div></div>",
        unsafe_allow_html=True,
    )
    critical_count = sum(1 for a in flat_assessments if a.level == "Critical")
    k3.markdown(
        f"<div class='kpi-card'><div class='kpi-value' style='color:#b71c1c;'>{critical_count}</div>"
        f"<div class='kpi-label'>Critical Risks</div></div>",
        unsafe_allow_html=True,
    )
    high_count = sum(1 for a in flat_assessments if a.level == "High")
    k4.markdown(
        f"<div class='kpi-card'><div class='kpi-value' style='color:#e65100;'>{high_count}</div>"
        f"<div class='kpi-label'>High Risks</div></div>",
        unsafe_allow_html=True,
    )
    avg_score = (
        round(sum(a.score for a in flat_assessments) / len(flat_assessments), 1)
        if flat_assessments
        else 0
    )
    k5.markdown(
        f"<div class='kpi-card'><div class='kpi-value'>{avg_score}</div>"
        f"<div class='kpi-label'>Avg Risk Score</div></div>",
        unsafe_allow_html=True,
    )

    st.markdown("---")

    # --- Plotly risk matrix ---
    try:
        import plotly.graph_objects as go

        st.markdown("### Risk Matrix (Impact vs Likelihood)")
        matrix: Dict[tuple, list] = {}
        for a in flat_assessments:
            key = (a.likelihood, a.impact)
            matrix.setdefault(key, []).append(a)

        x_vals, y_vals, sizes, colors, texts = [], [], [], [], []
        for (lk, imp), items in matrix.items():
            x_vals.append(lk)
            y_vals.append(imp)
            sizes.append(len(items) * 18 + 12)
            max_score = max(i.score for i in items)
            if max_score > 90:
                colors.append("#b71c1c")
            elif max_score > 50:
                colors.append("#e65100")
            elif max_score > 20:
                colors.append("#f9a825")
            else:
                colors.append("#2e7d32")
            risk_names = [risk_map.get(i.risk_id, Risk).name
                          if risk_map.get(i.risk_id) else i.risk_id
                          for i in items]
            texts.append(f"{len(items)} risk(s)<br>{'<br>'.join(risk_names[:3])}")

        fig = go.Figure()
        fig.add_trace(
            go.Scatter(
                x=x_vals,
                y=y_vals,
                mode="markers",
                marker=dict(size=sizes, color=colors, opacity=0.85, line=dict(width=1, color="#fff")),
                text=texts,
                hoverinfo="text",
            )
        )
        for xi in range(1, 6):
            for yi in range(1, 6):
                score = xi * yi
                if score <= 4:
                    bg = "rgba(46,125,50,0.08)"
                elif score <= 10:
                    bg = "rgba(249,168,37,0.08)"
                elif score <= 16:
                    bg = "rgba(230,81,0,0.08)"
                else:
                    bg = "rgba(183,28,28,0.08)"
                fig.add_shape(
                    type="rect",
                    x0=xi - 0.5, x1=xi + 0.5,
                    y0=yi - 0.5, y1=yi + 0.5,
                    fillcolor=bg,
                    line=dict(width=0.5, color="#e0e0e0"),
                    layer="below",
                )
        fig.update_layout(
            xaxis=dict(
                title="Likelihood", tickmode="array", tickvals=[1, 2, 3, 4, 5],
                range=[0.5, 5.5], gridcolor="#f0f0f0",
            ),
            yaxis=dict(
                title="Impact", tickmode="array", tickvals=[1, 2, 3, 4, 5],
                range=[0.5, 5.5], gridcolor="#f0f0f0",
            ),
            height=450,
            margin=dict(l=40, r=20, t=30, b=40),
            plot_bgcolor="#fafafa",
            showlegend=False,
        )
        st.plotly_chart(fig, use_container_width=True)
    except ImportError:
        st.info("Install plotly for interactive risk matrix: pip install plotly")

    # --- Charts row ---
    st.markdown("### Risk Distribution")
    chart_c1, chart_c2 = st.columns(2)

    try:
        import plotly.graph_objects as go

        level_order = ["Low", "Medium", "High", "Critical"]
        level_colors = ["#2e7d32", "#f9a825", "#e65100", "#b71c1c"]
        level_counts = [sum(1 for a in flat_assessments if a.level == lv) for lv in level_order]

        fig1 = go.Figure(
            go.Pie(
                labels=level_order,
                values=level_counts,
                marker=dict(colors=level_colors),
                hole=0.45,
                textinfo="label+value",
            )
        )
        fig1.update_layout(height=320, margin=dict(l=20, r=20, t=30, b=20), title="By Severity")
        chart_c1.plotly_chart(fig1, use_container_width=True)

        cats = sorted({risk_map[a.risk_id].category for a in flat_assessments if a.risk_id in risk_map})
        cat_counts = [
            sum(1 for a in flat_assessments if risk_map.get(a.risk_id) and risk_map[a.risk_id].category == c)
            for c in cats
        ]
        fig2 = go.Figure(go.Bar(x=cats, y=cat_counts, marker_color="#1976d2"))
        fig2.update_layout(height=320, margin=dict(l=20, r=20, t=30, b=20), title="By Category")
        chart_c2.plotly_chart(fig2, use_container_width=True)
    except ImportError:
        level_counts_dict = {lv: sum(1 for a in flat_assessments if a.level == lv)
                             for lv in ["Low", "Medium", "High", "Critical"]}
        chart_c1.bar_chart(level_counts_dict)
        cat_counts_dict: Dict[str, int] = {}
        for a in flat_assessments:
            r = risk_map.get(a.risk_id)
            if r:
                cat_counts_dict[r.category] = cat_counts_dict.get(r.category, 0) + 1
        chart_c2.bar_chart(cat_counts_dict)

    # --- Top critical risks table ---
    st.markdown("### Top Critical Risks")
    sorted_assessments = sorted(flat_assessments, key=lambda a: a.score, reverse=True)[:10]
    if sorted_assessments:
        rows = []
        for a in sorted_assessments:
            r = risk_map.get(a.risk_id)
            uc_name = next((u.name for u in usecases if u.id == a.usecase_id), a.usecase_id)
            rows.append({
                "System": uc_name,
                "Risk": r.name if r else a.risk_id,
                "Category": r.category.title() if r else "",
                "Score": a.score,
                "Level": a.level,
            })
        st.dataframe(rows, use_container_width=True, hide_index=True)
    else:
        st.info("No risk assessments yet.")

    # --- Export section ---
    st.markdown("### Export")
    exp_c1, exp_c2, exp_c3 = st.columns(3)

    csv_data = export_csv(usecases, all_assessments, risk_map, control_map)
    exp_c1.download_button(
        "Download CSV",
        data=csv_data,
        file_name="risk_register_export.csv",
        mime="text/csv",
    )

    # Build a combined markdown report
    md_parts = []
    for uc in usecases:
        md_parts.append(render_markdown(uc, all_assessments.get(uc.id, []), risk_map, control_map))
    full_md = "\n\n---\n\n".join(md_parts)
    exp_c2.download_button(
        "Download Markdown",
        data=full_md,
        file_name="risk_register_report.md",
        mime="text/markdown",
    )

    pdf_data = pdf_bytes(full_md)
    if pdf_data:
        exp_c3.download_button(
            "Download PDF",
            data=pdf_data,
            file_name="risk_register_report.pdf",
            mime="application/pdf",
        )
    else:
        exp_c3.caption("PDF requires: pip install reportlab")


def _page_systems_list(
    st,
    data_dir: str,
    risks: List[Risk],
    usecases: List[UseCase],
    controls: List[Control],
) -> None:
    """List all AI systems with details and delete capability."""
    st.markdown("### AI Systems Registry")

    if not usecases:
        st.info("No AI systems registered yet. Go to 'Add / Edit System' to create one.")
        return

    risk_map = build_risk_map(risks)
    control_map = build_control_map(controls)

    for uc in usecases:
        assessments = assess_usecase(uc, risks)
        max_level = "Low"
        level_priority = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
        for a in assessments:
            if level_priority.get(a.level, 0) > level_priority.get(max_level, 0):
                max_level = a.level
        border_color = _SEVERITY_COLORS.get(max_level, "#455a64")

        with st.expander(f"{uc.id} - {uc.name}", expanded=False):
            st.markdown(
                f"<div style='display:flex;gap:8px;align-items:center;margin-bottom:8px;'>"
                f"{_severity_badge_html(max_level)} {_act_badge_html(uc.ai_act_class)}"
                f"</div>",
                unsafe_allow_html=True,
            )

            info_c1, info_c2, info_c3 = st.columns(3)
            info_c1.markdown(f"**Model:** {uc.model_type}")
            info_c1.markdown(f"**Data:** {uc.data_type}")
            info_c2.markdown(f"**Exposure:** {uc.exposure}/5")
            info_c2.markdown(f"**Criticality:** {uc.criticality}/5")
            info_c3.markdown(f"**Owner:** {uc.owner}")

            st.markdown(f"**Description:** {uc.description}")
            st.markdown(f"**Assumptions:** {uc.assumptions}")

            # Risk summary for this system
            st.markdown("**Risk Assessments:**")
            for a in sorted(assessments, key=lambda x: x.score, reverse=True):
                r = risk_map.get(a.risk_id)
                if r:
                    st.markdown(
                        f"- {_severity_badge_html(a.level)} **{r.name}** "
                        f"(score: {a.score}, {r.category})",
                        unsafe_allow_html=True,
                    )

            # Delete button
            if st.button(f"Delete {uc.id}", key=f"del_{uc.id}"):
                st.session_state[f"confirm_del_{uc.id}"] = True

            if st.session_state.get(f"confirm_del_{uc.id}"):
                st.warning(f"Are you sure you want to delete **{uc.name}** ({uc.id})?")
                col_yes, col_no = st.columns(2)
                if col_yes.button("Yes, delete", key=f"yes_del_{uc.id}"):
                    new_list = [u for u in usecases if u.id != uc.id]
                    _save_usecases(data_dir, new_list)
                    st.session_state.pop(f"confirm_del_{uc.id}", None)
                    st.success(f"Deleted {uc.id}.")
                    st.rerun()
                if col_no.button("Cancel", key=f"no_del_{uc.id}"):
                    st.session_state.pop(f"confirm_del_{uc.id}", None)
                    st.rerun()


def _page_add_edit_system(
    st,
    data_dir: str,
    risks: List[Risk],
    usecases: List[UseCase],
) -> None:
    """Form to add or edit an AI system with real-time scoring preview."""
    st.markdown("### Add / Edit AI System")

    edit_options = ["-- New System --"] + [f"{uc.id} - {uc.name}" for uc in usecases]
    selection = st.selectbox("Select system to edit (or create new)", edit_options)

    editing = None
    if selection != "-- New System --":
        edit_id = selection.split(" - ")[0]
        editing = next((uc for uc in usecases if uc.id == edit_id), None)

    with st.form("system_form", clear_on_submit=False):
        default_id = editing.id if editing else _next_id("UC", [uc.id for uc in usecases])
        sys_id = st.text_input("System ID", value=default_id, disabled=editing is not None)

        name = st.text_input("Name", value=editing.name if editing else "")
        description = st.text_area("Description", value=editing.description if editing else "")

        fc1, fc2 = st.columns(2)
        model_type = fc1.selectbox(
            "Model Type",
            ["LLM", "Classification", "Regression", "Clustering", "Reinforcement Learning", "Computer Vision", "Other"],
            index=["LLM", "Classification", "Regression", "Clustering", "Reinforcement Learning", "Computer Vision", "Other"].index(editing.model_type) if editing and editing.model_type in ["LLM", "Classification", "Regression", "Clustering", "Reinforcement Learning", "Computer Vision", "Other"] else 0,
        )
        data_type = fc2.selectbox(
            "Data Type",
            ["personal", "sensitive", "public", "internal", "confidential"],
            index=["personal", "sensitive", "public", "internal", "confidential"].index(editing.data_type) if editing and editing.data_type in ["personal", "sensitive", "public", "internal", "confidential"] else 0,
        )

        sc1, sc2 = st.columns(2)
        exposure = sc1.slider("Exposure", 1, 5, value=editing.exposure if editing else 3)
        criticality = sc2.slider("Criticality", 1, 5, value=editing.criticality if editing else 3)

        owner = st.text_input("Owner", value=editing.owner if editing else "")
        assumptions = st.text_area("Assumptions", value=editing.assumptions if editing else "")

        submitted = st.form_submit_button("Save System")

    # Real-time score preview (outside form to update live)
    st.markdown("#### Risk Score Preview")
    st.caption("Estimated scores for existing risks with current exposure setting.")
    preview_exposure = exposure if 'exposure' in dir() else 3
    preview_rows = []
    for risk in risks[:5]:
        from ai_risk_register.scoring import score_risk, risk_level
        s = score_risk(risk.base_impact, risk.base_likelihood, preview_exposure)
        lv = risk_level(s)
        preview_rows.append({
            "Risk": risk.name,
            "Impact": risk.base_impact,
            "Likelihood": risk.base_likelihood,
            "Exposure": preview_exposure,
            "Score": s,
            "Level": lv,
        })
    if preview_rows:
        st.dataframe(preview_rows, use_container_width=True, hide_index=True)

    if submitted:
        errors = []
        if not name.strip():
            errors.append("Name is required.")
        if not description.strip():
            errors.append("Description is required.")
        if not owner.strip():
            errors.append("Owner is required.")
        if not assumptions.strip():
            errors.append("Assumptions is required.")

        if errors:
            for e in errors:
                st.error(e)
        else:
            new_uc = UseCase(
                id=sys_id.strip() if not editing else editing.id,
                name=name.strip(),
                description=description.strip(),
                data_type=data_type,
                exposure=exposure,
                model_type=model_type,
                criticality=criticality,
                owner=owner.strip(),
                assumptions=assumptions.strip(),
                ai_act_class=editing.ai_act_class if editing else None,
            )
            if editing:
                new_list = [new_uc if uc.id == editing.id else uc for uc in usecases]
            else:
                if any(uc.id == new_uc.id for uc in usecases):
                    st.error(f"A system with ID '{new_uc.id}' already exists.")
                    return
                new_list = list(usecases) + [new_uc]
            _save_usecases(data_dir, new_list)
            st.success(f"System '{new_uc.name}' saved successfully!")
            st.rerun()


def _page_risk_catalog(
    st,
    data_dir: str,
    risks: List[Risk],
    controls: List[Control],
) -> None:
    """Risk catalog with CRUD and filtering."""
    st.markdown("### Risk Catalog")

    control_map = build_control_map(controls)
    control_ids = [c.id for c in controls]

    # --- Filters ---
    categories = sorted({r.category for r in risks})
    fc1, fc2 = st.columns(2)
    cat_filter = fc1.multiselect("Filter by category", categories, default=categories)
    level_filter = fc2.multiselect(
        "Filter by regulatory",
        ["EU AI Act", "NIS2", "DORA"],
        default=["EU AI Act", "NIS2", "DORA"],
    )

    # --- List ---
    for risk in risks:
        if risk.category not in cat_filter:
            continue
        border = "#1976d2"
        with st.expander(f"{risk.id} - {risk.name} ({risk.category})", expanded=False):
            st.markdown(f"**Description:** {risk.description}")
            mc1, mc2 = st.columns(2)
            mc1.markdown(f"**Base Impact:** {risk.base_impact}/5")
            mc2.markdown(f"**Base Likelihood:** {risk.base_likelihood}/5")
            st.markdown(f"**EU AI Act:** {', '.join(risk.eu_ai_act)}")
            st.markdown(f"**NIS2:** {', '.join(risk.nis2)}")
            st.markdown(f"**DORA:** {', '.join(risk.dora) if risk.dora else 'N/A'}")
            st.markdown("**Mitigations:** " + ", ".join(
                f"{mid} ({control_map[mid].name})" if mid in control_map else mid
                for mid in risk.mitigations
            ))

            # Delete risk
            if st.button(f"Delete {risk.id}", key=f"del_risk_{risk.id}"):
                st.session_state[f"confirm_del_risk_{risk.id}"] = True

            if st.session_state.get(f"confirm_del_risk_{risk.id}"):
                st.warning(f"Delete risk **{risk.name}** ({risk.id})?")
                yc, nc = st.columns(2)
                if yc.button("Yes, delete", key=f"yes_del_risk_{risk.id}"):
                    new_risks = [r for r in risks if r.id != risk.id]
                    _save_risks(data_dir, new_risks)
                    st.session_state.pop(f"confirm_del_risk_{risk.id}", None)
                    st.success(f"Deleted {risk.id}.")
                    st.rerun()
                if nc.button("Cancel", key=f"no_del_risk_{risk.id}"):
                    st.session_state.pop(f"confirm_del_risk_{risk.id}", None)
                    st.rerun()

    # --- Add new risk form ---
    st.markdown("---")
    st.markdown("### Add New Risk")
    with st.form("risk_form", clear_on_submit=True):
        new_id = _next_id("R", [r.id for r in risks])
        rid = st.text_input("Risk ID", value=new_id)
        rname = st.text_input("Risk Name")
        rdesc = st.text_area("Description")
        rc1, rc2, rc3 = st.columns(3)
        rcategory = rc1.selectbox("Category", ["security", "ethical", "operational", "resilience", "compliance"])
        rimpact = rc2.slider("Base Impact", 1, 5, value=3)
        rlikelihood = rc3.slider("Base Likelihood", 1, 5, value=3)

        st.markdown("**Regulatory References**")
        reg1, reg2, reg3 = st.columns(3)
        r_eu = reg1.text_input("EU AI Act articles (comma-separated)", value="Art. 9")
        r_nis2 = reg2.text_input("NIS2 articles (comma-separated)", value="Art. 21")
        r_dora = reg3.text_input("DORA articles (comma-separated, optional)", value="")

        r_mitigations = st.multiselect(
            "Mitigation Controls",
            [f"{c.id}: {c.name}" for c in controls],
        )

        r_submitted = st.form_submit_button("Add Risk")

    # Real-time score feedback
    st.markdown("#### Score Preview")
    from ai_risk_register.scoring import score_risk, risk_level
    preview_score = score_risk(rimpact if 'rimpact' in dir() else 3, rlikelihood if 'rlikelihood' in dir() else 3, 3)
    preview_level = risk_level(preview_score)
    st.markdown(
        f"With exposure=3: Score = **{preview_score}** {_severity_badge_html(preview_level)}",
        unsafe_allow_html=True,
    )

    if r_submitted:
        errors = []
        if not rname.strip():
            errors.append("Risk name is required.")
        if not rdesc.strip():
            errors.append("Description is required.")
        eu_refs = [s.strip() for s in r_eu.split(",") if s.strip()]
        if not eu_refs:
            errors.append("At least one EU AI Act article reference is required.")
        nis2_refs = [s.strip() for s in r_nis2.split(",") if s.strip()]
        if not nis2_refs:
            errors.append("At least one NIS2 article reference is required.")

        if errors:
            for e in errors:
                st.error(e)
        else:
            dora_refs = [s.strip() for s in r_dora.split(",") if s.strip()]
            mitigation_ids = [m.split(":")[0].strip() for m in r_mitigations]
            new_risk = Risk(
                id=rid.strip(),
                name=rname.strip(),
                description=rdesc.strip(),
                category=rcategory,
                base_impact=rimpact,
                base_likelihood=rlikelihood,
                eu_ai_act=eu_refs,
                nis2=nis2_refs,
                dora=dora_refs,
                mitigations=mitigation_ids,
            )
            if any(r.id == new_risk.id for r in risks):
                st.error(f"Risk with ID '{new_risk.id}' already exists.")
            else:
                new_risks = list(risks) + [new_risk]
                _save_risks(data_dir, new_risks)
                st.success(f"Risk '{new_risk.name}' added!")
                st.rerun()


def _page_ai_act_classification(
    st,
    data_dir: str,
    usecases: List[UseCase],
    controls: List[Control],
) -> None:
    """AI Act classification questionnaire for each system."""
    st.markdown("### AI Act Classification")
    st.markdown(
        "Answer the questions below for each AI system to determine its "
        "classification under the EU AI Act."
    )

    if not usecases:
        st.info("No AI systems registered. Add a system first.")
        return

    # Load rules
    rules_path = _data_path(data_dir, "ai_act_rules")
    try:
        questions, class_info = load_rules(rules_path)
    except Exception as exc:
        st.error(f"Failed to load AI Act rules: {exc}")
        return

    control_map = build_control_map(controls)

    # Select system
    uc_options = [f"{uc.id} - {uc.name}" for uc in usecases]
    selected = st.selectbox("Select AI System", uc_options)
    uc_id = selected.split(" - ")[0]
    uc = next(u for u in usecases if u.id == uc_id)

    # Current classification
    if uc.ai_act_class:
        info = class_info.get(uc.ai_act_class)
        st.markdown(
            f"**Current classification:** {_act_badge_html(uc.ai_act_class)}",
            unsafe_allow_html=True,
        )
        if info:
            st.markdown(f"*{info.description}*")
        st.markdown("---")

    # Questionnaire state
    answers_key = f"ai_act_answers_{uc.id}"
    if answers_key not in st.session_state:
        st.session_state[answers_key] = {}

    answers: Dict[str, bool] = st.session_state[answers_key]

    # Show answered questions and allow re-answering
    question_map = {q.id: q for q in questions}
    current = questions[0].id
    step = 1
    while current in question_map:
        q = question_map[current]
        if q.id in answers:
            st.markdown(f"**Step {step}: {q.text}**")
            st.caption(q.help)
            prev_answer = "Yes" if answers[q.id] else "No"
            st.markdown(f"Answer: **{prev_answer}**")
            next_step = q.if_yes if answers[q.id] else q.if_no
            if next_step in (e.value for e in AIActClass):
                break
            current = next_step
            step += 1
        else:
            # Show the current unanswered question
            st.markdown(f"**Step {step}: {q.text}**")
            st.caption(q.help)
            ac1, ac2 = st.columns(2)
            if ac1.button("Yes", key=f"aiact_yes_{q.id}_{uc.id}"):
                answers[q.id] = True
                st.session_state[answers_key] = answers
                st.rerun()
            if ac2.button("No", key=f"aiact_no_{q.id}_{uc.id}"):
                answers[q.id] = False
                st.session_state[answers_key] = answers
                st.rerun()
            break

    # Check if classification is complete
    result = classify(answers, questions)

    if result:
        st.markdown("---")
        info = class_info.get(result)
        st.markdown(f"### Result: {_act_badge_html(result)}", unsafe_allow_html=True)
        if info:
            st.markdown(f"**{info.label}**")
            st.markdown(info.description)
            if info.articles:
                st.markdown(f"**Relevant articles:** {', '.join(info.articles)}")

        # Save classification
        bc1, bc2 = st.columns(2)
        if bc1.button("Save Classification", key=f"save_class_{uc.id}"):
            updated_uc = replace(uc, ai_act_class=result)
            new_list = [updated_uc if u.id == uc.id else u for u in usecases]
            _save_usecases(data_dir, new_list)
            st.success(f"Classification '{result}' saved for {uc.name}.")
            st.rerun()

        if bc2.button("Restart Questionnaire", key=f"restart_{uc.id}"):
            st.session_state[answers_key] = {}
            st.rerun()

        # Show recommendations
        st.markdown("---")
        st.markdown("### Recommendations")
        from ai_risk_register.storage import load_models as _lm
        risk_path = _data_path(data_dir, "risk_catalog")
        try:
            risks = load_models(risk_path, Risk)
        except Exception:
            risks = []

        categories = sorted({r.category for r in risks})
        if not categories:
            categories = ["security", "ethical", "operational", "resilience"]

        for cat in categories:
            rec = recommend(cat, result, control_map)
            st.markdown(f"**{cat.title()}**")
            st.markdown(f"*{rec.guidance}*")
            if rec.controls:
                for ctrl in rec.controls:
                    st.markdown(f"- **{ctrl.id}:** {ctrl.name} ({ctrl.type}) -- {ctrl.description}")
            st.markdown("")
    elif answers:
        st.info("Continue answering the questions above to complete the classification.")

    if answers and not result:
        if st.button("Reset Questionnaire", key=f"reset_{uc.id}"):
            st.session_state[answers_key] = {}
            st.rerun()


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def run() -> None:
    try:
        import streamlit as st
    except ImportError as exc:
        raise SystemExit(
            "Streamlit is not installed. Run: pip install 'ai-risk-register[streamlit]'"
        ) from exc

    st.set_page_config(
        page_title="AI Risk Register",
        page_icon="AI",
        layout="wide",
    )
    st.markdown(_CSS, unsafe_allow_html=True)

    # --- Sidebar ---
    with st.sidebar:
        st.markdown(
            "<div style='padding:8px 0;'>"
            "<div style='font-size:1.4rem;font-weight:700;'>AI Risk Register</div>"
            "<div style='color:#607d8b;font-size:0.85rem;'>Governance & Cybersecurity by Design</div>"
            "</div>",
            unsafe_allow_html=True,
        )
        st.markdown("---")
        page = st.radio("Navigation", _PAGES, label_visibility="collapsed")
        st.markdown("---")
        data_dir = st.text_input("Data directory", value="data")
        st.markdown(
            "<div style='margin-top:auto;padding-top:24px;color:#90a4ae;font-size:0.8rem;'>"
            "Open-Source MIT License</div>",
            unsafe_allow_html=True,
        )

    # --- Load data ---
    try:
        risks, usecases, controls = _load_all(data_dir)
    except Exception as exc:
        st.error(f"Failed to load data: {exc}")
        return

    # --- Header ---
    st.markdown(
        "<div class='app-header'>"
        "<div class='app-title'>AI Risk Register</div>"
        "<div class='app-subtitle'>Governance & Cybersecurity by Design</div>"
        "</div>",
        unsafe_allow_html=True,
    )

    # --- Route to page ---
    if page == "Dashboard":
        _page_dashboard(st, risks, usecases, controls)
    elif page == "AI Systems":
        _page_systems_list(st, data_dir, risks, usecases, controls)
    elif page == "Add / Edit System":
        _page_add_edit_system(st, data_dir, risks, usecases)
    elif page == "Risk Catalog":
        _page_risk_catalog(st, data_dir, risks, controls)
    elif page == "AI Act Classification":
        _page_ai_act_classification(st, data_dir, usecases, controls)

    # --- Footer ---
    st.markdown(
        "<div class='footer'>AI Risk Register - Governance & Cybersecurity by Design</div>",
        unsafe_allow_html=True,
    )


if __name__ == "__main__":
    run()

"""
Professional Security Assessment PDF Report Generator
Generates comprehensive SOC security evaluation reports using ReportLab with real database telemetry.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable
)
from reportlab.pdfgen import canvas
from services.risk_engine import generate_alert_explanation

class NumberedCanvas(canvas.Canvas):
    """Adds running headers and page numbers (Page X of Y) to the PDF."""
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
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        if self._pageNumber > 1:
            # Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0284c7"))
            self.drawString(54, letter[1] - 36, "UNIVERSITY SECURITY SOC — OFFICIAL ASSESSMENT REPORT")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawRightString(letter[0] - 54, letter[1] - 36, "DEFENSIVE OPERATIONS CENTER")
            
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, letter[1] - 42, letter[0] - 54, letter[1] - 42)

            # Footer
            self.line(54, 45, letter[0] - 54, 45)
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(54, 32, "CONFIDENTIAL // UNIVERSITY INTERNAL CYBER DEFENSE USE ONLY")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(letter[0] - 54, 32, page_text)
        self.restoreState()


def generate_security_pdf(db_data):
    """
    Builds a professional multi-page Security Assessment PDF from database records.
    db_data dict contains:
      - 'findings': list of ThreatFinding objects
      - 'events_count': total events
      - 'event_types': dict of event breakdown
      - 'vulnerabilities': list of Vulnerability objects
      - 'ml_summary': dict of ML stats
      - 'audit_logs': list of recent AuditLog objects
      - 'generated_by': username
      - 'report_date': datetime
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=32,
        textColor=colors.HexColor("#0f172a"),
        alignment=0
    )
    subtitle_style = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#0284c7")
    )
    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )
    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )
    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155")
    )
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )
    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell,
        fontName='Helvetica-Bold'
    )
    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # ========================================================
    # 1. COVER PAGE
    # ========================================================
    story.append(Spacer(1, 40))
    story.append(Paragraph("UNIVERSITY SECURITY OPERATIONS CENTER", ParagraphStyle(
        'PreHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor("#0ea5e9"), spaceAfter=10
    )))
    story.append(Paragraph("University Log Security System", title_style))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Comprehensive Security Assessment & Threat Audit Report", subtitle_style))
    story.append(Spacer(1, 15))
    story.append(HRFlowable(width="100%", thickness=3, color=colors.HexColor("#0284c7"), spaceAfter=25))

    # Assessment Meta Table
    findings = db_data.get("findings", [])
    total_findings = len(findings)
    high_findings = sum(1 for f in findings if (f.severity or "").capitalize() in ["Critical", "High"])
    med_findings = sum(1 for f in findings if (f.severity or "").capitalize() == "Medium")
    low_findings = sum(1 for f in findings if (f.severity or "").capitalize() == "Low")
    events_count = db_data.get("events_count", 0)

    # Compute overall risk score
    if findings:
        total_risk = sum(f.to_dict().get("risk_score", 70) for f in findings)
        overall_risk_score = min(max(int(round(total_risk / len(findings))), 10), 100)
    else:
        overall_risk_score = 25

    if overall_risk_score >= 80:
        overall_risk_level = "CRITICAL"
        risk_color = "#ef4444"
    elif overall_risk_score >= 60:
        overall_risk_level = "HIGH"
        risk_color = "#ea580c"
    elif overall_risk_score >= 30:
        overall_risk_level = "MEDIUM"
        risk_color = "#d97706"
    else:
        overall_risk_level = "LOW"
        risk_color = "#16a34a"

    report_date = db_data.get("report_date", datetime.utcnow()).strftime("%B %d, %Y - %H:%M:%S UTC")

    meta_data = [
        [Paragraph("Target Environment:", table_cell_bold), Paragraph("University Campus Infrastructure & Directory Services", table_cell)],
        [Paragraph("Assessment Authority:", table_cell_bold), Paragraph("Academic Defense SOC — CS Cyber Lab", table_cell)],
        [Paragraph("Evaluation Framework:", table_cell_bold), Paragraph("Rule-Based Heuristics + Isolation Forest ML Anomaly Engine", table_cell)],
        [Paragraph("Generated By:", table_cell_bold), Paragraph(str(db_data.get("generated_by", "SOC Administrator")), table_cell)],
        [Paragraph("Report Timestamp:", table_cell_bold), Paragraph(report_date, table_cell)],
        [Paragraph("Classification:", table_cell_bold), Paragraph("INTERNAL DEFENSIVE USE ONLY", table_cell)],
        [Paragraph("Overall Risk Score:", table_cell_bold), Paragraph(f"<b><font color='{risk_color}'>{overall_risk_score} / 100 ({overall_risk_level})</font></b>", table_cell)],
    ]
    t_meta = Table(meta_data, colWidths=[140, 364])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#edf2f7")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 40))

    # Executive Overview Notice Box
    overview_text = (
        "<b>Executive Notice:</b> This automated security assessment report summarizes real telemetry, "
        "authentication audit records, machine learning outlier scores, and web header vulnerability scans "
        "collected across the campus network. All evaluations are passive and non-destructive."
    )
    t_notice = Table([[Paragraph(overview_text, callout_style)]], colWidths=[504])
    t_notice.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#93c5fd")),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(t_notice)

    story.append(PageBreak())

    # ========================================================
    # 2. EXECUTIVE SUMMARY & POSTURE
    # ========================================================
    story.append(Paragraph("1. Executive Summary", h1_style))
    exec_summary_text = (
        f"During the continuous monitoring window, the University Security Operations Center analyzed "
        f"<b>{events_count} security telemetry events</b> across student portals, laboratory servers, "
        f"and campus administration services. The detection pipeline identified <b>{total_findings} distinct "
        f"threat findings</b> ({high_findings} High/Critical severity, {med_findings} Medium, {low_findings} Low). "
        f"The composite organizational risk score is currently assessed at <b>{overall_risk_score} / 100 ({overall_risk_level})</b>. "
        f"Defensive countermeasures, including account credential verification and source IP rate limiting, are advised."
    )
    story.append(Paragraph(exec_summary_text, body_style))
    story.append(Spacer(1, 12))

    # Scorecard Table
    scorecard_data = [
        [
            Paragraph("<b>Total Events Evaluated</b>", table_cell),
            Paragraph("<b>Active Threat Findings</b>", table_cell),
            Paragraph("<b>Overall Risk Score</b>", table_cell),
            Paragraph("<b>Security Posture</b>", table_cell),
        ],
        [
            Paragraph(f"<font size=14><b>{events_count}</b></font>", table_cell),
            Paragraph(f"<font size=14 color='#dc2626'><b>{total_findings}</b></font>", table_cell),
            Paragraph(f"<font size=14 color='{risk_color}'><b>{overall_risk_score}/100</b></font>", table_cell),
            Paragraph(f"<font size=12 color='{risk_color}'><b>{overall_risk_level}</b></font>", table_cell),
        ]
    ]
    t_score = Table(scorecard_data, colWidths=[126, 126, 126, 126])
    t_score.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BACKGROUND', (0,1), (-1,1), colors.HexColor("#ffffff")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_score)
    story.append(Spacer(1, 16))

    # ========================================================
    # 3. SECURITY EVENT STATISTICS
    # ========================================================
    story.append(Paragraph("2. Security Event & Telemetry Statistics", h1_style))
    event_types = db_data.get("event_types", {})
    
    stat_rows = [
        [Paragraph("<b>Event Type Category</b>", table_cell_bold), Paragraph("<b>Recorded Count</b>", table_cell_bold), Paragraph("<b>Percentage</b>", table_cell_bold)]
    ]
    for ev_name, ev_cnt in event_types.items():
        pct = f"{(ev_cnt / events_count * 100):.1f}%" if events_count else "0%"
        stat_rows.append([Paragraph(ev_name, table_cell), Paragraph(str(ev_cnt), table_cell), Paragraph(pct, table_cell)])

    if len(stat_rows) == 1:
        stat_rows.append([Paragraph("Security Telemetry Logs", table_cell), Paragraph(str(events_count), table_cell), Paragraph("100%", table_cell)])

    t_stat = Table(stat_rows, colWidths=[240, 132, 132])
    t_stat.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_stat)
    story.append(Spacer(1, 16))

    # ========================================================
    # 4. ML ANOMALY ANALYSIS & VULNERABILITY AUDIT
    # ========================================================
    story.append(Paragraph("3. Machine Learning Anomaly Detection & Vulnerability Posture", h1_style))
    
    ml_sum = db_data.get("ml_summary", {})
    vulns = db_data.get("vulnerabilities", [])
    vuln_passed = sum(1 for v in vulns if (v.status or "").lower() == "passed")
    vuln_warn = sum(1 for v in vulns if (v.status or "").lower() == "warning")
    vuln_fail = sum(1 for v in vulns if (v.status or "").lower() == "failed")

    dual_metrics = [
        [Paragraph("<b>ML Anomaly Engine (Isolation Forest)</b>", table_cell_bold), Paragraph("<b>Vulnerability Configuration Audit</b>", table_cell_bold)],
        [
            Paragraph(
                f"• Model Status: Ready (scikit-learn IsolationForest)<br/>"
                f"• Total Profiles Evaluated: <b>{ml_sum.get('total_profiles', 0)}</b><br/>"
                f"• Behavioral Outliers Detected: <b>{ml_sum.get('anomaly_count', 0)}</b><br/>"
                f"• Average Outlier Score: <b>{ml_sum.get('average_anomaly_score', 0.0)}</b><br/>"
                f"• Clustering Features: {len(ml_sum.get('features', []))} active behavioral vectors",
                table_cell
            ),
            Paragraph(
                f"• Total Configuration Checks: <b>{len(vulns)}</b><br/>"
                f"• Passed Checks: <font color='#16a34a'><b>{vuln_passed}</b></font><br/>"
                f"• Warning Posture: <font color='#d97706'><b>{vuln_warn}</b></font><br/>"
                f"• Failed Checks: <font color='#dc2626'><b>{vuln_fail}</b></font><br/>"
                f"• Safe Target: Campus Internal Web Infrastructure",
                table_cell
            )
        ]
    ]
    t_dual = Table(dual_metrics, colWidths=[252, 252])
    t_dual.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ]))
    story.append(t_dual)
    story.append(Spacer(1, 18))

    # ========================================================
    # 5. INDIVIDUAL FINDINGS & AI ALERT EXPLANATIONS
    # ========================================================
    story.append(PageBreak())
    story.append(Paragraph("4. Threat Findings & Explainable AI Alert Analysis", h1_style))
    story.append(Paragraph(
        "Every finding is enriched with a deterministic AI Alert Explanation, granular risk scoring factors, "
        "and concrete SOC defensive remediation steps.", body_style
    ))
    story.append(Spacer(1, 10))

    if not findings:
        story.append(Paragraph("<i>No active security findings recorded in the current audit window.</i>", body_style))
    else:
        for idx, f in enumerate(findings, 1):
            finding_dict = f.to_dict()
            explanation = generate_alert_explanation(f)

            f_score = finding_dict.get("risk_score", 70)
            f_level = finding_dict.get("risk_level", "MEDIUM")
            f_color = "#dc2626" if f_level in ["CRITICAL", "HIGH"] else "#d97706" if f_level == "MEDIUM" else "#16a34a"

            finding_box_data = [
                [
                    Paragraph(f"<b>Finding #{f.id}: {f.title}</b>", ParagraphStyle('FT', parent=table_cell_bold, fontSize=10, textColor=colors.HexColor("#0f172a"))),
                    Paragraph(f"<b><font color='{f_color}'>Risk Score: {f_score}/100 ({f_level})</font></b>", ParagraphStyle('RS', parent=table_cell_bold, alignment=2))
                ],
                [
                    Paragraph(
                        f"<b>Severity:</b> {f.severity} &nbsp;|&nbsp; "
                        f"<b>Category:</b> {f.category} &nbsp;|&nbsp; "
                        f"<b>Confidence:</b> {explanation.get('confidence', 90)}% &nbsp;|&nbsp; "
                        f"<b>Detection Method:</b> {f.detection_method}",
                        table_cell
                    ),
                    Paragraph(
                        f"<b>Target User:</b> {f.username or 'N/A'}<br/><b>Source IP:</b> {f.ip_address or 'N/A'}",
                        table_cell
                    )
                ],
                [
                    Paragraph(
                        f"<b>Why Detected:</b> {explanation.get('why_detected', '')}<br/>"
                        f"<b>What Happened:</b> {explanation.get('what_happened', '')}<br/>"
                        f"<b>Evidence:</b> {f.evidence or 'Telemetry correlation anomaly'}",
                        table_cell
                    ),
                    Paragraph(
                        f"<b>Recommended Defensive Action:</b><br/>"
                        f"<font color='#0369a1'>{explanation.get('recommended_action', 'Investigate user session.')}</font>",
                        table_cell
                    )
                ]
            ]
            t_finding = Table(finding_box_data, colWidths=[314, 190])
            t_finding.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
                ('BACKGROUND', (0,1), (-1,-1), colors.HexColor("#ffffff")),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ]))

            story.append(KeepTogether([t_finding, Spacer(1, 10)]))

    # ========================================================
    # 6. AUDIT LOG ACTIVITY & RECOMMENDATIONS
    # ========================================================
    story.append(Spacer(1, 10))
    story.append(Paragraph("5. Recent Audit Activity Summary", h1_style))
    audit_logs = db_data.get("audit_logs", [])
    
    audit_rows = [
        [Paragraph("<b>Timestamp (UTC)</b>", table_cell_bold), Paragraph("<b>User</b>", table_cell_bold), Paragraph("<b>Action</b>", table_cell_bold), Paragraph("<b>Description</b>", table_cell_bold)]
    ]
    for log in audit_logs[:6]:
        ts_str = log.timestamp.strftime("%Y-%m-%d %H:%M") if log.timestamp else "N/A"
        audit_rows.append([
            Paragraph(ts_str, table_cell),
            Paragraph(log.username or "system", table_cell),
            Paragraph(log.action or "ACTION", table_cell_bold),
            Paragraph(log.description or "", table_cell)
        ])

    if len(audit_rows) == 1:
        audit_rows.append([Paragraph("N/A", table_cell), Paragraph("system", table_cell), Paragraph("INIT", table_cell), Paragraph("System operational", table_cell)])

    t_audit = Table(audit_rows, colWidths=[110, 80, 100, 214])
    t_audit.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#f1f5f9")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#cbd5e1")),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(t_audit)
    story.append(Spacer(1, 14))

    # Final Security Assessment
    story.append(Paragraph("6. Final Security Assessment & Strategic Recommendations", h1_style))
    recs = (
        "<b>1. Enforce Multi-Factor Authentication (MFA):</b> Mandate hardware or TOTP authentication across all campus accounts "
        "experiencing repeated failed logins.<br/>"
        "<b>2. Web Application Header Hardening:</b> Implement Strict-Transport-Security (HSTS) and Content-Security-Policy (CSP) headers "
        "identified as non-compliant in vulnerability configuration audits.<br/>"
        "<b>3. Automated Perimeter Rate Limiting:</b> Enforce origin threshold throttling on reverse proxies to mitigate directory enumeration and credential stuffing.<br/>"
        "<b>4. Continuous ML Baseline Retraining:</b> Regularly fit the Isolation Forest model on campus term start dates to reflect seasonal traffic changes."
    )
    story.append(Paragraph(recs, body_style))
    story.append(Spacer(1, 25))

    # Sign-off block
    signoff = [
        [Paragraph("<b>Lead Security Analyst:</b>", table_cell_bold), Paragraph("___________________________", table_cell)],
        [Paragraph("<b>CISO / Director of Information Security:</b>", table_cell_bold), Paragraph("___________________________", table_cell)],
    ]
    t_sign = Table(signoff, colWidths=[200, 304])
    t_sign.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sign)

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer

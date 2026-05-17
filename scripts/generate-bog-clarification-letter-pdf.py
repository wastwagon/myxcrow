#!/usr/bin/env python3
"""
Generate a regulator-ready Bank of Ghana clarification request letter as PDF.

Requires:
  reportlab (already available in many Python installs)

Usage:
  python3 scripts/generate-bog-clarification-letter-pdf.py
  python3 scripts/generate-bog-clarification-letter-pdf.py --output ~/Downloads/MYXCROW_BoG_Clarification_Letter.pdf
"""
from __future__ import annotations

import argparse
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer


def build_story():
    styles = getSampleStyleSheet()
    title = styles["Title"]
    h2 = styles["Heading2"]
    normal = styles["BodyText"]
    normal.leading = 15
    normal.spaceAfter = 6

    story = []
    story.append(Paragraph("MYXCROW", title))
    story.append(Paragraph("Escrow Platform Management Company", normal))
    story.append(Paragraph("Leponsere Link, Adenta, Accra, Ghana", normal))
    story.append(Paragraph("Email: soy@myxcrow.com | Phone: 0551 534 546", normal))
    story.append(Spacer(1, 8))

    story.append(Paragraph("6 May 2026", normal))
    story.append(Spacer(1, 4))
    story.append(Paragraph("The Director", normal))
    story.append(Paragraph("Payment Systems Department", normal))
    story.append(Paragraph("Bank of Ghana", normal))
    story.append(Paragraph("P.O. Box GP 2674", normal))
    story.append(Paragraph("Accra, Ghana", normal))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Dear Sir/Madam,", normal))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Re: Request for Pre-Launch Regulatory Clarification on MYXCROW Escrow Operations under "
            "the Payment Systems and Services Act, 2019 (Act 987)",
            h2,
        )
    )
    story.append(
        Paragraph(
            "I write in my capacity as Chief Executive Officer of MYXCROW, a Ghanaian startup building an "
            "escrow-enabled digital platform for safer commerce transactions. Before public launch, we respectfully "
            "seek the Bank of Ghana's guidance to ensure our operations align with Act 987 and all applicable directives.",
            normal,
        )
    )

    story.append(Paragraph("1) Business and transaction context", h2))
    story.append(
        Paragraph(
            "MYXCROW supports marketplace transactions where trust risk is high, including goods and service "
            "transactions between independent buyers and sellers. Our platform role is to manage transaction conditions, "
            "escrow status, and dispute workflows so funds are only released when contract conditions are met.",
            normal,
        )
    )

    story.append(Paragraph("2) Operational model (current and intended)", h2))
    op_items = [
        "Buyer and seller agree terms on MYXCROW (amount, fulfillment milestones, release conditions).",
        "Buyer initiates funding through integrated licensed payment rails (including Paystack channels where enabled).",
        "MYXCROW records user ledger balances and escrow states internally for conditional release logic.",
        "Upon fulfillment confirmation (or valid dispute outcome), MYXCROW transitions escrow to release or refund.",
        "Where withdrawal is requested, MYXCROW initiates payout/disbursement through licensed provider APIs to the beneficiary destination account.",
    ]
    story.append(
        ListFlowable([ListItem(Paragraph(t, normal)) for t in op_items], bulletType="bullet")
    )

    story.append(Paragraph("3) Important role split and funds-flow clarification", h2))
    split_items = [
        "MYXCROW handles platform transaction management: escrow rules, state transitions, reconciliations, dispute decisions, and audit controls.",
        "Licensed payment providers (e.g., Paystack and partner banks) provide collection and payout rails.",
        "Paystack does not operate MYXCROW marketplace logic; MYXCROW does not delegate escrow decisioning to Paystack.",
        "For withdrawal fulfillment, MYXCROW requires an approved payout/settlement setup with licensed rails to process user cash-out requests lawfully and reliably.",
    ]
    story.append(
        ListFlowable([ListItem(Paragraph(t, normal)) for t in split_items], bulletType="bullet")
    )

    story.append(Paragraph("4) Consumer protection and control framework", h2))
    ctl_items = [
        "Customer identity and account controls (phone/OTP and access controls).",
        "Reference-based transaction tracking, webhook/callback verification, and tamper-evident audit logging.",
        "Dispute management workflow with evidence review before release/refund decisions.",
        "Segregation principles, reconciliation controls, and restricted internal approval flows for sensitive actions.",
        "Ongoing AML/CFT and risk monitoring measures, with escalation and reporting workflows as operations scale.",
    ]
    story.append(
        ListFlowable([ListItem(Paragraph(t, normal)) for t in ctl_items], bulletType="bullet")
    )

    story.append(Paragraph("5) Clarifications respectfully requested from Bank of Ghana", h2))
    req_items = [
        "Whether MYXCROW's described model (conditional escrow management with third-party payment collections and payouts) constitutes a regulated payment service under Act 987, and the precise category applicable.",
        "Whether MYXCROW requires prior licensing/authorization before launch, and if yes, the exact licensing route, documentary requirements, and expected timelines.",
        "The expected safeguarding/segregation standards for customer-related funds and operational reconciliation expectations for our model.",
        "Specific AML/CFT, consumer-protection, cybersecurity, and periodic-reporting obligations applicable to this operating structure.",
        "Recommended pre-launch engagement process (including whether to pursue a formal pre-application meeting and which technical/compliance annexes to submit first).",
    ]
    story.append(
        ListFlowable([ListItem(Paragraph(t, normal)) for t in req_items], bulletType="bullet")
    )

    story.append(Paragraph("6) Readiness to provide supporting documents", h2))
    story.append(
        Paragraph(
            "We are prepared to submit detailed documentation immediately, including: business model narrative, "
            "end-to-end funds flow diagrams, system architecture, risk register, AML/CFT control summary, dispute SOPs, "
            "and information security controls.",
            normal,
        )
    )
    story.append(
        Paragraph(
            "We appreciate the Bank's guidance and remain fully committed to operating within Ghana's regulatory "
            "framework while improving transaction trust and consumer protection.",
            normal,
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Yours faithfully,", normal))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<b>Samuel Owusu-Yeboah</b>", normal))
    story.append(Paragraph("Chief Executive Officer, MYXCROW", normal))
    story.append(Paragraph("soy@myxcrow.com | 0551 534 546", normal))

    return story


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate MYXCROW BoG clarification letter PDF.")
    default_output = Path.home() / "Downloads" / "MYXCROW_BoG_Clarification_Letter.pdf"
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=default_output,
        help=f"Output PDF path (default: {default_output})",
    )
    args = parser.parse_args()

    out = args.output.expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(out),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title="MYXCROW BoG Clarification Letter",
        author="MYXCROW",
    )
    doc.build(build_story())
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()

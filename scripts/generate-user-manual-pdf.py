#!/usr/bin/env python3
"""
One-page MYXCROW manual (features, users, transaction flow).

Requires: pip install fpdf2

Usage:
  python3 scripts/generate-user-manual-pdf.py
  python3 scripts/generate-user-manual-pdf.py --output ~/Desktop/MYXCROW.pdf
"""
from __future__ import annotations

import argparse
from pathlib import Path

from fpdf import FPDF
from fpdf.enums import XPos, YPos


def build_pdf(pdf: FPDF, x0: float, w: float, col_w: float, gap: float, y1: float) -> None:
    c1, c2, c3 = x0, x0 + col_w + gap, x0 + 2 * (col_w + gap)

    def heading(xx: float, yy: float, title: str) -> None:
        pdf.set_xy(xx, yy)
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(30, 58, 95)
        pdf.cell(col_w, 5, title, ln=1)
        pdf.set_x(xx)
        pdf.set_draw_color(30, 58, 95)
        yy2 = pdf.get_y()
        pdf.line(xx, yy2, xx + col_w, yy2)
        pdf.ln(1)
        pdf.set_x(xx)
        pdf.set_text_color(40, 40, 40)

    def bullets(xx: float, lines: list[str], size: float = 7.5, leading: float = 3.6) -> None:
        pdf.set_font("Helvetica", "", size)
        for line in lines:
            pdf.set_x(xx)
            pdf.multi_cell(col_w, leading, f"  - {line}")

    # Column 1
    heading(c1, y1, "Product features")
    bullets(
        c1,
        [
            "Secure escrow: funds held until delivery or service completion",
            "Wallets (GHS); Paystack wallet top-up; reserves on escrow create",
            "Fund escrow from buyer wallet; ledger journals (fund / release / refund)",
            "Seller ships (tracking optional) or marks service complete",
            "Delivery confirm: 6-char code or 6-digit PIN (hashed)",
            "Buyer releases to seller; auto-release after dispute-free window",
            "Disputes freeze release; admin: pay seller or refund buyer",
            "Optional milestones with partial releases",
            "SMS & email notifications; audit trail",
            "KYC / compliance hooks; admin dashboard",
            "Web app (mobile-first, PWA-ready) + NestJS API + PostgreSQL",
        ],
        size=7,
        leading=3.3,
    )

    # Column 2
    pdf.set_xy(c2, y1)
    heading(c2, y1, "Who uses it")
    pdf.set_xy(c2, pdf.get_y())
    pdf.set_text_color(60, 60, 60)
    pdf.set_font("Helvetica", "B", 7.5)
    pdf.set_x(c2)
    pdf.multi_cell(col_w, 3.5, "BUYER")
    pdf.set_x(c2)
    pdf.set_font("Helvetica", "", 7)
    pdf.multi_cell(
        col_w,
        3.3,
        "Creates escrow, tops up wallet, funds deal, enters delivery code/PIN, "
        "releases funds or waits for auto-release; can dispute or cancel per rules.",
    )
    pdf.ln(1)
    pdf.set_x(c2)
    pdf.set_font("Helvetica", "B", 7.5)
    pdf.multi_cell(col_w, 3.5, "SELLER")
    pdf.set_x(c2)
    pdf.set_font("Helvetica", "", 7)
    pdf.multi_cell(
        col_w,
        3.3,
        "Accepts escrow, fulfils order or service, marks shipped or completed; "
        "net amount credits to wallet after release.",
    )
    pdf.ln(1)
    pdf.set_x(c2)
    pdf.set_font("Helvetica", "B", 7.5)
    pdf.multi_cell(col_w, 3.5, "ADMIN / SUPPORT")
    pdf.set_x(c2)
    pdf.set_font("Helvetica", "", 7)
    pdf.multi_cell(
        col_w,
        3.3,
        "KYC review, dispute outcomes, reconciliation, platform settings.",
    )

    # Column 3
    pdf.set_xy(c3, y1)
    heading(c3, y1, "Transaction flow (happy path)")
    pdf.set_xy(c3, pdf.get_y())
    pdf.set_font("Courier", "", 6.2)
    pdf.set_text_color(35, 35, 45)
    flow = """Top-up -> Buyer wallet
Create escrow -> reserve hold
Fund -> FUNDED + ledger (escrow hold, fees)
Seller ship OR service done -> SHIPPED / AWAITING_RELEASE
Buyer confirms code/PIN OR timer -> DELIVERED / ready
Release (buyer or auto) -> seller wallet net; status RELEASED
Dispute -> DISPUTED -> admin -> RELEASED or REFUNDED"""
    for line in flow.split("\n"):
        pdf.set_x(c3)
        pdf.multi_cell(col_w, 3.1, line)

    pdf.ln(2)
    pdf.set_x(c3)
    pdf.set_font("Helvetica", "I", 6.5)
    pdf.set_text_color(80, 80, 80)
    pdf.multi_cell(
        col_w,
        3.2,
        "Local dev: web localhost:3007  |  API :4000/api  |  See repo README for Docker & seeds.",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate one-page MYXCROW PDF manual.")
    default_out = Path.home() / "Downloads" / "MYXCROW_Platform_Manual.pdf"
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=default_out,
        help=f"Output path (default: {default_out})",
    )
    args = parser.parse_args()

    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.set_margins(8, 8, 8)
    pdf.set_auto_page_break(False)
    pdf.add_page()

    w = 297 - 16
    x0 = 8.0
    y = 8.0

    pdf.set_fill_color(30, 58, 95)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 16)
    pdf.rect(x0, y, w, 12, "F")
    pdf.set_xy(x0 + 3, y + 3)
    pdf.cell(w - 6, 8, "MYXCROW  |  Escrow platform (Ghana)  |  One-page manual", new_x=XPos.RIGHT, new_y=YPos.TOP)

    y1 = y + 14
    col_w = (w - 8) / 3
    gap = 4.0
    build_pdf(pdf, x0, w, col_w, gap, y1)

    pdf.set_y(200 - 10)
    pdf.set_font("Helvetica", "I", 7)
    pdf.set_text_color(120, 120, 120)
    pdf.set_x(x0)
    pdf.multi_cell(w, 4, "MYXCROW Platform Manual  |  Concise one-pager  |  April 2026", align="C")

    out: Path = args.output.expanduser().resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(out))
    print(f"Wrote {out} (1 page, landscape A4)")


if __name__ == "__main__":
    main()

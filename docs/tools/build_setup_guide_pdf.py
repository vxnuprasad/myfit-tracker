#!/usr/bin/env python3
"""Builds docs/MyFit-Tracker-Complete-Setup-Guide.pdf from the Markdown source next to it.

Usage (from the repository root):   python3 docs/tools/build_setup_guide_pdf.py
Requires: Python 3 and `pip install reportlab`. This is a documentation tool only; it is not part of the web app.
Supports the small Markdown subset used by the guide: # / ## / ### headings, paragraphs, bullet and numbered lists,
fenced code blocks, > callouts, pipe tables, **bold**, `code`, [text](url) and <https://autolinks>.
"""
import datetime, os, re, sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, CondPageBreak, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph, Spacer,
                                Table, TableStyle, XPreformatted)
from reportlab.platypus.tableofcontents import TableOfContents

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "MyFit-Tracker-Complete-Setup-Guide.md")
OUT = os.path.join(HERE, "..", "MyFit-Tracker-Complete-Setup-Guide.pdf")
ACC, ACC_DARK, INK, MUTE, CREAM, LINE = "#FF5A1F", "#B8400F", "#18161B", "#5F5A66", "#FFF4E8", "#F1D9C2"

ss = {
    "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=26, leading=31, textColor=colors.HexColor(INK), spaceAfter=6),
    "sub": ParagraphStyle("sub", fontName="Helvetica", fontSize=11.5, leading=16, textColor=colors.HexColor(MUTE), spaceAfter=10),
    "H2": ParagraphStyle("H2", fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=colors.HexColor(ACC_DARK), spaceBefore=14, spaceAfter=6),
    "H3": ParagraphStyle("H3", fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=colors.HexColor(INK), spaceBefore=8, spaceAfter=3),
    "body": ParagraphStyle("body", fontName="Helvetica", fontSize=10, leading=14.2, textColor=colors.HexColor(INK), spaceAfter=5, alignment=TA_LEFT),
    "li": ParagraphStyle("li", fontName="Helvetica", fontSize=10, leading=14, textColor=colors.HexColor(INK), leftIndent=16, bulletIndent=3, spaceAfter=2.5),
    "cell": ParagraphStyle("cell", fontName="Helvetica", fontSize=8.8, leading=11.6, textColor=colors.HexColor(INK)),
    "cellh": ParagraphStyle("cellh", fontName="Helvetica-Bold", fontSize=8.8, leading=11.6, textColor=colors.white),
    "call": ParagraphStyle("call", fontName="Helvetica", fontSize=9.8, leading=13.6, textColor=colors.HexColor(INK), spaceAfter=2),
    "code": ParagraphStyle("code", fontName="Courier", fontSize=8.4, leading=11, textColor=colors.HexColor(INK)),
    "toc0": ParagraphStyle("toc0", fontName="Helvetica", fontSize=10, leading=12.5, textColor=colors.HexColor(INK), leftIndent=4, spaceBefore=0, spaceAfter=0),
}


def inline(t):
    """Markdown inline -> reportlab mini-HTML. Code spans and links are lifted out first so they are not re-processed."""
    keep = []
    def stash(html):
        keep.append(html); return "\x00%d\x00" % (len(keep) - 1)
    esc = lambda s: s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = re.sub(r"`([^`]+)`", lambda m: stash('<font name="Courier" color="%s">%s</font>' % (ACC_DARK, esc(m.group(1)))), t)
    t = re.sub(r"<(https?://[^>\s]+)>", lambda m: stash('<link href="%s" color="%s">%s</link>' % (m.group(1), ACC_DARK, esc(m.group(1)))), t)
    t = re.sub(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", lambda m: stash('<link href="%s" color="%s">%s</link>' % (m.group(2), ACC_DARK, esc(m.group(1)))), t)
    t = esc(t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"\*([^*\s][^*]*)\*", r"<i>\1</i>", t)
    return re.sub(r"\x00(\d+)\x00", lambda m: keep[int(m.group(1))], t)


class Doc(BaseDocTemplate):
    def __init__(self, path, **kw):
        super().__init__(path, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=20 * mm,
                         title="MyFit Tracker - Complete Setup Guide", author="Vishnu Prasad",
                         subject="Installation, configuration and usage guide for MyFit Tracker", creator="MyFit Tracker docs/tools/build_setup_guide_pdf.py", **kw)
        fr = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="f")
        self.addPageTemplates([PageTemplate(id="p", frames=[fr], onPage=self.chrome)])

    def chrome(self, c, d):
        c.saveState(); c.setStrokeColor(colors.HexColor(ACC)); c.setLineWidth(1.2)
        c.line(20 * mm, 14 * mm, A4[0] - 20 * mm, 14 * mm)
        c.setFont("Helvetica", 8); c.setFillColor(colors.HexColor(MUTE))
        c.drawString(20 * mm, 9.5 * mm, "MyFit Tracker - Complete Setup Guide  |  Created by Vishnu Prasad")
        c.drawRightString(A4[0] - 20 * mm, 9.5 * mm, "Page %d" % d.page); c.restoreState()

    def afterFlowable(self, f):
        if isinstance(f, Paragraph) and f.style.name == "H2":
            txt = f.getPlainText(); key = "ch-" + re.sub(r"[^a-z0-9]+", "-", txt.lower()).strip("-")  # stable across passes
            self.canv.bookmarkPage(key); self.canv.addOutlineEntry(txt, key, 0, 0)
            self.notify("TOCEntry", (0, txt, self.page, key))


def table(rows):
    ncol = len(rows[0]); w = 170 * mm
    longest = [max(len(r[i]) if i < len(r) else 0 for r in rows[1:]) for i in range(ncol)]
    share = [min(max(l, 12), 90) for l in longest]; tot = sum(share)
    data = [[Paragraph(inline(c), ss["cellh"]) for c in rows[0]]] + [[Paragraph(inline(c), ss["cell"]) for c in r] for r in rows[1:]]
    t = Table(data, colWidths=[w * s / tot for s in share], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(ACC_DARK)), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FFF9F3")]), ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor(LINE)),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5), ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4)]))
    return [t, Spacer(1, 7)]


def callout(lines):
    paras = []
    for l in lines:
        m = re.match(r"^(\d+)\.\s+(.*)", l)
        paras.append(Paragraph(inline(m.group(2)), ParagraphStyle("c", parent=ss["call"], leftIndent=14, bulletIndent=2), bulletText=m.group(1) + ".") if m
                     else Paragraph(inline(l), ss["call"]))
    t = Table([[paras]], colWidths=[170 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(CREAM)), ("LINEBEFORE", (0, 0), (0, -1), 3.2, colors.HexColor(ACC)),
        ("LEFTPADDING", (0, 0), (-1, -1), 11), ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return [t, Spacer(1, 8)]


def code(lines):
    esc = "\n".join(l.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;") for l in lines)
    t = Table([[XPreformatted(esc, ss["code"])]], colWidths=[170 * mm])
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F6F1EB")), ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor(LINE)),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    return [t, Spacer(1, 7)]


def build():
    text = open(SRC, encoding="utf-8").read()
    bad = sorted({c for c in text if ord(c) > 255})
    if bad: sys.exit("Non-Latin-1 characters would not render in the built-in PDF fonts: %r" % bad)
    L, i, story, toc_done = text.split("\n"), 0, [], False
    toc = TableOfContents(); toc.levelStyles = [ss["toc0"]]
    while i < len(L):
        ln = L[i]
        if ln.startswith("# "):
            story += [Spacer(1, 6), Paragraph(inline(ln[2:]), ss["title"]), Table([[""]], colWidths=[40 * mm], rowHeights=[3], style=[("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(ACC))], hAlign="LEFT"), Spacer(1, 10)]
        elif ln.startswith("## "):
            if not toc_done:
                story += [Paragraph("Contents", ss["H2"].clone("TocH", textColor=colors.HexColor(INK))), toc, PageBreak()]; toc_done = True
            story += [CondPageBreak(60 * mm), Paragraph(inline(ln[3:]), ss["H2"])]
        elif ln.startswith("### "):
            story.append(Paragraph(inline(ln[4:]), ss["H3"]))
        elif ln.startswith("```"):
            j = i + 1; buf = []
            while not L[j].startswith("```"): buf.append(L[j]); j += 1
            story += code(buf); i = j
        elif ln.startswith(">"):
            buf = []
            while i < len(L) and L[i].startswith(">"): buf.append(L[i].lstrip("> ").rstrip()); i += 1
            story += callout([b for b in buf if b]); continue
        elif ln.startswith("|"):
            rows = []
            while i < len(L) and L[i].startswith("|"):
                cells = [c.strip() for c in L[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells): rows.append(cells)
                i += 1
            story += table(rows); continue
        elif re.match(r"^[-*] ", ln):
            while i < len(L) and re.match(r"^[-*] ", L[i]): story.append(Paragraph(inline(L[i][2:]), ss["li"], bulletText="\u2022")); i += 1
            story.append(Spacer(1, 4)); continue
        elif re.match(r"^\d+\. ", ln):
            while i < len(L) and re.match(r"^\d+\. ", L[i]):
                m = re.match(r"^(\d+)\. (.*)", L[i]); story.append(Paragraph(inline(m.group(2)), ss["li"], bulletText=m.group(1) + ".")); i += 1
            story.append(Spacer(1, 4)); continue
        elif ln.strip():
            buf = [ln]
            while i + 1 < len(L) and L[i + 1].strip() and not re.match(r"^(#|>|\||```|[-*] |\d+\. )", L[i + 1]): i += 1; buf.append(L[i])
            story.append(Paragraph(inline(" ".join(buf)), ss["sub"] if not toc_done and len(story) < 6 else ss["body"]))
        i += 1
    Doc(OUT).multiBuild(story)
    print("wrote", os.path.normpath(OUT), os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    build()

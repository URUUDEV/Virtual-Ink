"""Generate the Virtual Ink team progress and starting-point report.

This uses only Python's standard library so the report can be regenerated in a
restricted environment without installing a document package.
"""

from __future__ import annotations

from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "Virtual-Ink-Team-Progress-Report.docx"

NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_REL = "http://schemas.openxmlformats.org/package/2006/relationships"


def w(tag: str) -> str:
    return f"w:{tag}"


def el(tag: str, attrs: str = "", content: str = "") -> str:
    return f"<{tag}{(' ' + attrs) if attrs else ''}>{content}</{tag}>"


def run(text: str, *, bold: bool = False, italic: bool = False, color: str = "111827", size: int = 22, font: str = "Calibri") -> str:
    rpr = [f'<w:rFonts w:ascii="{font}" w:hAnsi="{font}"/>', f'<w:sz w:val="{size}"/>', f'<w:szCs w:val="{size}"/>']
    if bold:
        rpr.append("<w:b/>")
    if italic:
        rpr.append("<w:i/>")
    if color:
        rpr.append(f'<w:color w:val="{color}"/>')
    preserve = ' xml:space="preserve"' if text[:1].isspace() or text[-1:].isspace() else ""
    return f"<w:r><w:rPr>{''.join(rpr)}</w:rPr><w:t{preserve}>{escape(text)}</w:t></w:r>"


def para(content: str = "", *, style: str | None = None, before: int = 0, after: int = 120, line: int = 300, align: str | None = None, keep_next: bool = False, num: int | None = None, shade: str | None = None) -> str:
    props = []
    if style:
        props.append(f'<w:pStyle w:val="{style}"/>')
    props.append(f'<w:spacing w:before="{before}" w:after="{after}" w:line="{line}" w:lineRule="auto"/>')
    if align:
        props.append(f'<w:jc w:val="{align}"/>')
    if keep_next:
        props.append("<w:keepNext/>")
    if num is not None:
        props.append(f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{num}"/></w:numPr>')
    if shade:
        props.append(f'<w:shd w:val="clear" w:color="auto" w:fill="{shade}"/>')
    return f"<w:p><w:pPr>{''.join(props)}</w:pPr>{content}</w:p>"


def heading(level: int, text: str) -> str:
    return para(run(text, bold=True, color="173B5E", size={1: 32, 2: 26, 3: 23}[level]), style=f"Heading{level}", before={1: 360, 2: 260, 3: 180}[level], after={1: 140, 2: 100, 3: 80}[level], keep_next=True)


def bullet(text: str, *, bold_prefix: str | None = None) -> str:
    content = run(bold_prefix, bold=True) + run(text) if bold_prefix else run(text)
    return para(content, num=1, after=80)


def numbered(text: str) -> str:
    return para(run(text), num=2, after=80)


def page_break() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def cell(text: str, width: int, *, header: bool = False, fill: str | None = None, color: str = "111827") -> str:
    shading = f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>' if fill else ""
    tcpr = f'<w:tcW w:w="{width}" w:type="dxa"/><w:tcMar><w:top w:w="100" w:type="dxa"/><w:start w:w="120" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:end w:w="120" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/>{shading}'
    return f"<w:tc><w:tcPr>{tcpr}</w:tcPr>{para(run(text, bold=header, color=color, size=19 if header else 19), after=20, line=260)}</w:tc>"


def table(headers: list[str], rows: list[list[str]], widths: list[int], *, fill: str = "E8EEF5") -> str:
    grid = "".join(f'<w:gridCol w:w="{width}"/>' for width in widths)
    out = [f'<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="C7D2E0"/><w:left w:val="single" w:sz="4" w:color="C7D2E0"/><w:bottom w:val="single" w:sz="4" w:color="C7D2E0"/><w:right w:val="single" w:sz="4" w:color="C7D2E0"/><w:insideH w:val="single" w:sz="4" w:color="D9E1EA"/><w:insideV w:val="single" w:sz="4" w:color="D9E1EA"/></w:tblBorders></w:tblPr><w:tblGrid>{grid}</w:tblGrid>']
    out.append(f'<w:tr><w:trPr><w:tblHeader/></w:trPr>{"".join(cell(h, widths[i], header=True, fill=fill, color="173B5E") for i, h in enumerate(headers))}</w:tr>')
    for row in rows:
        out.append(f'<w:tr>{"".join(cell(value, widths[i]) for i, value in enumerate(row))}</w:tr>')
    out.append("</w:tbl>")
    return "".join(out)


def callout(label: str, text: str, fill: str = "EAF9FF") -> str:
    content = run(f"{label}: ", bold=True, color="006B8F") + run(text)
    tcpr = f'<w:tcW w:w="9360" w:type="dxa"/><w:tcMar><w:top w:w="140" w:type="dxa"/><w:start w:w="160" w:type="dxa"/><w:bottom w:w="140" w:type="dxa"/><w:end w:w="160" w:type="dxa"/></w:tcMar><w:vAlign w:val="center"/><w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>'
    borders = '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="B8DCE8"/><w:left w:val="single" w:sz="4" w:color="B8DCE8"/><w:bottom w:val="single" w:sz="4" w:color="B8DCE8"/><w:right w:val="single" w:sz="4" w:color="B8DCE8"/></w:tblBorders>'
    return f'<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/>{borders}</w:tblPr><w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid><w:tr><w:tc><w:tcPr>{tcpr}</w:tcPr>{para(content, after=20, line=280)}</w:tc></w:tr></w:tbl>'


def code_block(text: str) -> str:
    return para(run(text, color="173B5E", size=19, font="Consolas"), before=60, after=140, line=260, shade="F2F4F7")


def metadata(rows: list[tuple[str, str]]) -> str:
    return table(["Field", "Value"], [[a, b] for a, b in rows], [2100, 7260], fill="F2F4F7")


def document_xml(body: str) -> str:
    sect = '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/><w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/><w:docGrid w:linePitch="300"/></w:sectPr>'
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="{NS_W}" xmlns:r="{NS_R}"><w:body>{body}{sect}</w:body></w:document>'


def styles_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{NS_W}">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="111827"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="111827"/></w:rPr><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="140" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="32"/><w:szCs w:val="32"/><w:color w:val="173B5E"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="260" w:after="100" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="173B5E"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="80" w:line="300" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="23"/><w:szCs w:val="23"/><w:color w:val="1F4D78"/></w:rPr></w:style>
</w:styles>'''


def numbering_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="{NS_W}">
  <w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="●"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="540"/></w:tabs><w:ind w:left="540" w:hanging="270"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr></w:lvl></w:abstractNum>
  <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="540"/></w:tabs><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
  <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>'''


def header_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="{NS_W}"><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>Virtual Ink  |  Shadow Root Security Technologies  |  Team handover</w:t></w:r></w:p></w:hdr>'''


def footer_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="{NS_W}" xmlns:fld="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="right"/><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>Internal working report  |  Page </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="64748B"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>'''


def rels_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="{NS_REL}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="word/header1.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="word/footer1.xml"/><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="word/styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="word/numbering.xml"/></Relationships>'''


def content_types_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'''


def document_rels_xml() -> str:
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="{NS_REL}"><Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>'''


def build_body() -> str:
    b: list[str] = []
    b.append(para(run("VIRTUAL INK", bold=True, color="00A7D9", size=20), before=0, after=140))
    b.append(para(run("Team progress and starting-point report", bold=True, color="0B0F17", size=42), after=100, line=320))
    b.append(para(run("Phase 1 foundation  ->  Supabase setup  ->  next vertical slice", color="64748B", size=24), after=260))
    b.append(metadata([
        ("Company", "Shadow Root Security Technologies"),
        ("Project", "Virtual Ink - Your Ideas. Our Print. Delivered."),
        ("Report date", "8 October 2026"),
        ("Current commit", "ec10729 - Build Virtual Ink foundation and provision Supabase project"),
        ("Audience", "Uchi Chinyama, Mumba Chitonge, Taizya Nakapende and Lubasi Monde"),
    ]))
    b.append(callout("Current status", "Foundation delivery is complete for the first slice. A free-tier Supabase development project is active and healthy, but it is intentionally empty. The next approved build slice is Backend Phase 2: identity, roles, permissions and tenant isolation."))
    b.append(page_break())

    b.append(heading(1, "1. Executive status"))
    b.append(para(run("Virtual Ink now has a documented handover pack, a secure backend base, a responsive frontend source shell and a provider-neutral database direction. The team can begin coordinated work immediately, while keeping marketplace behavior, commercial rules and sensitive persistence behind explicit acceptance gates.")))
    b.append(table(["Area", "Status", "Evidence", "Next owner"], [
        ["Repository and handover", "Delivered", "README, role templates, board, prompts, acceptance and completion docs", "All leads acknowledge"],
        ["Backend Phase 1", "Delivered", "Health, config, errors, validation, audit/storage contracts and 38 passing tests", "Mumba review"],
        ["Frontend foundation", "Source delivered", "Next.js/React shell, approved logo, Poppins, responsive routes and health status", "Taizya + Mumba verify"],
        ["Supabase project", "Active / empty", "Virtual Ink project ref `odgxcuwueessxfsoveza`, eu-west-1, ACTIVE_HEALTHY", "Mumba configure safely"],
        ["Application database schema", "Not started", "No application tables in the new project", "Mumba Phase 2"],
        ["Auth, roles and tenant isolation", "Not started", "Plan and permission boundary only", "Uchi + Mumba"],
        ["Vendor, pricing and delivery rules", "Open", "No real vendors, prices, commissions, taxes or partners invented", "Lubasi + Uchi"],
    ], [1800, 1500, 4100, 1960]))

    b.append(heading(1, "2. What has been built"))
    b.append(heading(2, "Handover and coordination"))
    for text in [
        "A single README and linked documentation index for the repository.",
        "A role handover process covering Uchi, Mumba, Taizya and Lubasi.",
        "A task board with owners, dependencies, reviewers, evidence and blocked-state rules.",
        "Reusable prompts for each lead and the weekly review.",
        "Acceptance, UX, operations/vendor, open-questions and Phase 1 completion templates.",
    ]:
        b.append(bullet(text))
    b.append(heading(2, "Backend foundation"))
    for text in [
        "Health endpoints: `/health` and versioned `/api/v1/health` with safe response envelopes.",
        "Environment/config validation, standard errors, bounded request validation and safe request IDs.",
        "Fail-closed audit event helper, private object/file access contracts and demo-only job probe.",
        "Provider-neutral SQL transaction ports and a server-only Supabase REST transport boundary.",
        "Local-only PostgreSQL migration, seed, probe and SQL assertion scripts that reject unsafe database targets.",
    ]:
        b.append(bullet(text))
    b.append(heading(2, "Frontend source foundation"))
    for text in [
        "Next.js App Router source under `apps/web` with customer-facing shell routes.",
        "Approved logo asset reused from `asssets/`, Poppins typography, brand tokens and responsive navigation.",
        "Homepage, shop/category preview, design services, business, how-it-works and roadmap pages.",
        "No fake order completion, payment success, vendor verification or fulfilment claims.",
    ]:
        b.append(bullet(text))

    b.append(page_break())
    b.append(heading(1, "3. Current technical state"))
    b.append(heading(2, "Architecture direction"))
    b.append(para(run("The application is being kept modular so the managed provider can be replaced later without rewriting the domain layer:")))
    b.append(code_block("React / Next.js interface\n        -> Virtual Ink server API boundary\n        -> verified identity, permissions and tenant scope\n        -> provider-neutral repositories and transaction port\n        -> Supabase PostgreSQL initially\n        -> owned PostgreSQL later, when control/cost/recovery requirements justify it"))
    b.append(heading(2, "Supabase project record"))
    b.append(table(["Field", "Current value"], [
        ["Project name", "Virtual Ink"],
        ["Project ref", "odgxcuwueessxfsoveza"],
        ["Region", "eu-west-1"],
        ["Status", "ACTIVE_HEALTHY"],
        ["API URL", "https://odgxcuwueessxfsoveza.supabase.co"],
        ["Monthly tier", "$0/month free tier"],
        ["Application tables", "None yet"],
        ["Keys in Git", "None; publishable key and database credentials remain outside the repository"],
    ], [2200, 7160], fill="F2F4F7"))
    b.append(heading(2, "Security baseline"))
    for text in [
        "Client-supplied totals, vendor IDs and roles are not authorization sources.",
        "Customer files are private by default and no file route is open in this slice.",
        "Delivery partners are planned to receive assigned delivery fields only, never print files or proofs.",
        "Secrets, database URLs, storage keys and signed URLs stay server-side and out of logs/Git.",
        "Audit writes are designed to fail closed when a required durable sink is missing.",
    ]:
        b.append(bullet(text))
    b.append(heading(2, "Local run"))
    b.append(code_block("cd D:\\Work\\Projects\\virtual-ink\nnpm test\nnpm start\n# health: http://127.0.0.1:3000/health\n# versioned: http://127.0.0.1:3000/api/v1/health"))

    b.append(heading(1, "4. Verification and known limits"))
    b.append(table(["Check", "Result", "Meaning"], [
        ["Automated backend tests", "38 passed / 0 failed", "Health, config, API privacy, validation, audit/storage contracts and Supabase adapter contracts pass."],
        ["Strict backend TypeScript check", "Passed", "Read-only compiler check passed; no remote runtime was assumed."],
        ["Supabase project health", "Passed", "Project is active; table list is empty; security and performance advisors have no findings."],
        ["Frontend install/build/browser QA", "Blocked", "Registry/proxy access prevented dependency installation in this environment."],
        ["PostgreSQL runtime migration tests", "Blocked", "Docker was unavailable and an isolated Windows PostgreSQL server could not start."],
        ["Remote GitHub push", "Blocked", "Commit exists locally; GitHub connection failed through the environment proxy."],
    ], [2500, 1700, 5160]))
    b.append(callout("Do not overclaim", "The current build is a foundation, not a working marketplace. No real customer account, checkout, payment, delivery, printer automation, upload processing, vendor dashboard or admin workflow has been delivered." , fill="FFF8E8"))

    b.append(page_break())
    b.append(heading(1, "5. Where each person starts"))
    b.append(heading(2, "Uchi Chinyama - Product and Project Lead"))
    for text in [
        "Read `docs/phase-1-handover.md`, `docs/task-board.md`, `docs/open-questions.md` and this report.",
        "Acknowledge the Phase 1 scope and mark the lead review rows in `docs/phase-1-completion-checklist.md`.",
        "Resolve the first product decisions: launch area, guest limits, tenant meaning, support ownership and file retention.",
        "Approve one narrow Backend Phase 2 acceptance record before sensitive tables or auth behavior are added.",
        "Keep all commercial facts labelled as pending until Lubasi supplies evidence and Uchi approves them.",
    ]:
        b.append(numbered(text))
    b.append(heading(2, "Mumba Chitonge - Technical Lead"))
    for text in [
        "Read `docs/backend-foundation.md`, `docs/permissions-plan.md`, `docs/api-standards.md` and `docs/supabase-migration-plan.md`.",
        "Configure Supabase only with restricted server credentials and a reviewed connection mode; never commit keys.",
        "Prepare the first migration for application-owned users, tenants, memberships and durable audit records.",
        "Implement server-derived tenant scope and denial tests for unauthenticated, inactive, wrong-role and cross-tenant access.",
        "Keep Supabase Auth and Storage behind adapters; preserve the owned-PostgreSQL exit path.",
    ]:
        b.append(numbered(text))
    b.append(heading(2, "Taizya Nakapende - UX and Visual Design Lead"))
    for text in [
        "Review the source shell and the supplied approved logo/reference assets; no new branding asset is required to start.",
        "Choose the first user flow for implementation and complete `docs/ux-handover-template.md`.",
        "Specify screen fields, empty/loading/error states, accessibility notes and mobile behavior.",
        "Mark any concept-board UI as reference only; do not imply that marketplace interactions are live.",
    ]:
        b.append(numbered(text))
    b.append(heading(2, "Lubasi Monde - Partnerships and Operations Lead"))
    for text in [
        "Use `docs/operations-handover-template.md` to collect vendor and delivery discovery evidence.",
        "Record unknowns instead of inventing vendor names, prices, commissions, tax rules, delivery zones or turnaround promises.",
        "Clarify payment verification, reprint/refund, support escalation and delivery handover requirements.",
        "Return evidence references to Uchi for approval before Mumba turns requirements into API or database rules.",
    ]:
        b.append(numbered(text))

    b.append(heading(1, "6. First shared working session"))
    b.append(table(["Order", "Decision or activity", "Output"], [
        ["1", "Confirm the Phase 2 slice: identity, roles, permissions and tenant model.", "One accepted scope statement"],
        ["2", "Resolve guest/customer and tenant boundary questions.", "Permission matrix with denial cases"],
        ["3", "Confirm the Supabase development connection approach.", "Restricted credential plan and rollback note"],
        ["4", "Pick the first UX flow and document all states.", "Completed UX handover"],
        ["5", "Review operations evidence needed for that flow.", "Operations handover or explicit N/A"],
        ["6", "Set the next task board items to Ready.", "One owner per task and a review date"],
    ], [900, 5260, 3200]))
    b.append(heading(1, "7. Open decisions still blocking marketplace work"))
    for text in [
        "Business ownership, launch area and initial service boundary.",
        "Verified vendor list, vendor approval evidence and service catalogue.",
        "Server-side pricing, commission model, payment verification and tax treatment.",
        "Delivery zones, collection rules, proof of handover and partner responsibilities.",
        "Private file retention, deletion, support access and incident handling.",
        "Printer details, fulfilment capacity and any future automation constraints.",
        "Brand asset ownership, legal terms, privacy notices and customer support policy.",
    ]:
        b.append(bullet(text))

    b.append(page_break())
    b.append(heading(1, "8. Recommended build order from here"))
    b.append(table(["Step", "Slice", "Exit evidence"], [
        ["1", "Backend Phase 2: identity, roles, memberships and tenant model", "Migration, permission matrix, denial/isolation tests and first durable audit event"],
        ["2", "Hosted Supabase schema verification", "Reviewed migration, grants, RLS decision, connection smoke test and rollback note"],
        ["3", "Frontend dependency installation and QA", "Real lockfile, typecheck, build, desktop/mobile and keyboard checks"],
        ["4", "Marketplace discovery", "Verified vendor/storefront contract, server quote authority and accepted product flow"],
        ["5", "Private file and design brief slice", "Retention policy, quarantine/access contract, audit evidence and UX states"],
        ["6", "Customer order journey", "Server pricing and payment-record boundaries; no fake payment success"],
    ], [700, 3650, 5010]))
    b.append(heading(2, "Recommended prompt for Mumba"))
    b.append(code_block("Build Virtual Ink Backend Phase 2: roles, permissions and tenant model for Customer or Guest, VendorOwner, VendorStaff, PlatformOperator and DeliveryPartner. Read docs/backend-foundation.md, docs/permissions-plan.md, docs/api-standards.md, docs/open-questions.md and this report. Use the active empty Supabase development project only after reviewing the migration, grants and rollback plan. Implement one narrow slice with provider-neutral application tables, server-derived tenant scope, least-privilege authorization and durable audit recording. Prove unauthenticated denial, inactive membership, wrong role, guessed IDs, cross-tenant access and delivery exclusion from print files/proofs. Preserve health/config contracts. Do not add catalogue, checkout, uploads, payments, courier integration, messaging or printer automation. Run tests and report evidence, blockers and handover notes."))
    b.append(heading(1, "9. Signoff record"))
    b.append(para(run("This report records engineering progress and starting points. It does not replace Uchi's product acceptance or the leads' acknowledgement.")))
    b.append(table(["Lead", "Acknowledgement", "Date", "Next action"], [
        ["Uchi Chinyama", "Pending", "", "Review scope, open questions and Phase 2 acceptance"],
        ["Mumba Chitonge", "Pending", "", "Review technical baseline and Supabase migration plan"],
        ["Taizya Nakapende", "Pending", "", "Choose first flow and complete UX handover"],
        ["Lubasi Monde", "Pending", "", "Complete vendor/delivery discovery handover"],
    ], [1800, 1400, 1100, 5060]))
    b.append(para(run("Repository: D:\\Work\\Projects\\virtual-ink  |  Branch: main  |  Remote push: pending network access", color="64748B", size=18), before=180, after=0))
    return "".join(b)


def write_docx() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    parts = {
        "[Content_Types].xml": content_types_xml(),
        "_rels/.rels": rels_xml(),
        "word/document.xml": document_xml(build_body()),
        "word/styles.xml": styles_xml(),
        "word/numbering.xml": numbering_xml(),
        "word/header1.xml": header_xml(),
        "word/footer1.xml": footer_xml(),
        "word/_rels/document.xml.rels": document_rels_xml(),
        "docProps/core.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Virtual Ink Team Progress and Starting-Point Report</dc:title><dc:creator>Shadow Root Security Technologies</dc:creator><cp:keywords>Virtual Ink, handover, backend, Supabase, Phase 1</cp:keywords></cp:coreProperties>',
        "docProps/app.xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Virtual Ink project tooling</Application></Properties>',
    }
    with ZipFile(OUT, "w", ZIP_DEFLATED) as zf:
        for name, value in parts.items():
            zf.writestr(name, value.encode("utf-8"))
    print(OUT)


if __name__ == "__main__":
    write_docx()

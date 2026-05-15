/**
 * Generates a formatted .docx Word document from a generated script.
 * Runs entirely in the browser — no server needed.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  VerticalAlign,
} from "docx";

interface ScriptScene {
  timecode: string;
  visual: string;
  on_screen_text: string | null;
  audio: string;
}

interface Script {
  variation: number;
  concept_title: string;
  hook_type: string;
  borrowed_pattern: string;
  scenes: ScriptScene[];
  suggested_audio_style?: string;
  caption: string;
  hashtags: string[];
  thumbnail_idea: string;
  predicted_strength: string;
}

// ─── Colours ────────────────────────────────────────────────────────────────
const BLACK       = "000000";
const DARK_NAVY   = "1E1B4B";
const PURPLE      = "7C3AED";
const PURPLE_LIGHT= "EDE9FE";
const PURPLE_HDR  = "6D28D9";
const ROW_ALT     = "F5F3FF";   // very light lavender for alternating rows
const GRAY        = "6B7280";
const WHITE       = "FFFFFF";

// ─── Shared border definition ────────────────────────────────────────────────
const CELL_BORDER = { style: BorderStyle.SINGLE, size: 6, color: "D1D5DB" };
const TABLE_BORDERS = {
  top:              CELL_BORDER,
  bottom:           CELL_BORDER,
  left:             CELL_BORDER,
  right:            CELL_BORDER,
  insideHorizontal: CELL_BORDER,
  insideVertical:   CELL_BORDER,
};

// ─── Small helpers ───────────────────────────────────────────────────────────
function spacer(before = 0, after = 160) {
  return new Paragraph({ spacing: { before, after }, children: [] });
}

function rule() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "E5E7EB" } },
    spacing: { before: 240, after: 240 },
    children: [],
  });
}

/** Paragraph with a bold coloured label + plain value text — both explicitly BLACK-ish */
function meta(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${label}:  `, bold: true, color: PURPLE, size: 20 }),
      new TextRun({ text: value,         bold: false, color: BLACK,  size: 20 }),
    ],
  });
}

/** Section heading using explicit TextRun so colour is never overridden by theme */
function section(emoji: string, title: string) {
  return new Paragraph({
    spacing: { before: 360, after: 160 },
    children: [
      new TextRun({
        text: `${emoji}  ${title}`,
        bold: true,
        color: DARK_NAVY,
        size: 28,
        font: "Calibri",
      }),
    ],
  });
}

// ─── Scene table ─────────────────────────────────────────────────────────────
function makeSceneTable(scenes: ScriptScene[]): Table {
  const COL_WIDTHS = [12, 28, 25, 35]; // % of table width

  function headerCell(text: string) {
    return new TableCell({
      width: { size: COL_WIDTHS[["Timecode", "Visual Direction", "On-Screen Text", "Audio / Voiceover"].indexOf(text)], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, fill: PURPLE_HDR },
      verticalAlign: VerticalAlign.CENTER,
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text,
              bold: true,
              color: WHITE,   // explicitly white on purple bg
              size: 19,
              font: "Calibri",
            }),
          ],
        }),
      ],
    });
  }

  function dataCell(
    content: string,
    opts: {
      colIndex: number;
      rowIndex: number;
      bold?: boolean;
      color?: string;
      mono?: boolean;
      align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    }
  ) {
    const bg = opts.rowIndex % 2 === 0 ? ROW_ALT : WHITE;
    return new TableCell({
      width: { size: COL_WIDTHS[opts.colIndex], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.SOLID, fill: bg },
      verticalAlign: VerticalAlign.TOP,
      children: [
        new Paragraph({
          alignment: opts.align ?? AlignmentType.LEFT,
          spacing: { before: 80, after: 80 },
          children: [
            new TextRun({
              text: content,
              bold:   opts.bold  ?? false,
              color:  opts.color ?? BLACK,   // always explicit — never let Word theme override
              size:   18,
              font:   opts.mono ? "Courier New" : "Calibri",
            }),
          ],
        }),
      ],
    });
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: TABLE_BORDERS,
    rows: [
      // Header
      new TableRow({
        tableHeader: true,
        children: [
          headerCell("Timecode"),
          headerCell("Visual Direction"),
          headerCell("On-Screen Text"),
          headerCell("Audio / Voiceover"),
        ],
      }),
      // Data rows
      ...scenes.map((scene, i) =>
        new TableRow({
          children: [
            dataCell(scene.timecode, {
              colIndex: 0, rowIndex: i,
              bold: true, color: PURPLE, mono: true,
              align: AlignmentType.CENTER,
            }),
            dataCell(scene.visual, {
              colIndex: 1, rowIndex: i,
              color: BLACK,
            }),
            dataCell(scene.on_screen_text ?? "—", {
              colIndex: 2, rowIndex: i,
              color: scene.on_screen_text ? BLACK : GRAY,
            }),
            dataCell(`"${scene.audio}"`, {
              colIndex: 3, rowIndex: i,
              bold: false,   // ← no bold; explicit BLACK so Word theme can't whiteout the text
              color: BLACK,
            }),
          ],
        })
      ),
    ],
  });
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function downloadScriptAsDocx(
  script: Script,
  meta_: { platform: string; lengthSecs: number; tone: string }
) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const doc = new Document({
    creator: "InstaIntel",
    title:   script.concept_title,
    styles: {
      default: {
        document: {
          run: {
            font:  "Calibri",
            size:  22,
            color: BLACK,   // global default — always black
          },
        },
      },
    },

    sections: [
      {
        // ── Page header ──
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `InstaIntel · Script Generator  |  Variation ${script.variation} of 3`,
                    color: GRAY, size: 16,
                  }),
                ],
              }),
            ],
          }),
        },
        // ── Page footer ──
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Scripts are AI-generated and inspired by public content patterns — not verbatim copies.  •  instaintel.app",
                    color: GRAY, size: 14, italics: true,
                  }),
                ],
              }),
            ],
          }),
        },

        children: [
          // ━━━ COVER ━━━
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 120 },
            children: [
              new TextRun({
                text: "📱  InstaIntel Script Generator",
                bold: true, size: 40, color: PURPLE, font: "Calibri",
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({ text: `Generated on ${dateStr}`, color: GRAY, size: 18 }),
            ],
          }),

          // Title card
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 80 },
            shading: { type: ShadingType.SOLID, fill: PURPLE_LIGHT },
            children: [
              new TextRun({
                text: script.concept_title,
                bold: true, size: 36, color: DARK_NAVY, font: "Calibri",
              }),
            ],
          }),

          spacer(80, 80),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 320 },
            children: [
              new TextRun({
                text: `Variation ${script.variation}  ·  Strong ${script.predicted_strength}  ·  ${meta_.platform === "reels" ? "Instagram Reels" : "Meta Ads"}  ·  ${meta_.lengthSecs}s`,
                bold: false, color: PURPLE, size: 20,
              }),
            ],
          }),

          rule(),

          // ━━━ OVERVIEW ━━━
          section("📋", "Script Overview"),
          meta("Platform",          meta_.platform === "reels" ? "Instagram Reels" : "Meta Ads"),
          meta("Length",            `${meta_.lengthSecs} seconds`),
          meta("Tone",              meta_.tone.charAt(0).toUpperCase() + meta_.tone.slice(1)),
          meta("Hook Type",         script.hook_type),
          meta("Predicted Strength",`Strong ${script.predicted_strength}`),

          spacer(120, 80),

          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: "Why it works:  ", bold: true, color: PURPLE, size: 20 }),
              new TextRun({ text: script.borrowed_pattern, italics: true, color: BLACK, size: 20 }),
            ],
          }),

          rule(),

          // ━━━ SCENE TABLE ━━━
          section("🎬", "Scene Breakdown"),
          spacer(80, 120),
          makeSceneTable(script.scenes),

          rule(),

          // ━━━ CAPTION ━━━
          section("📝", "Caption"),
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: script.caption, color: BLACK, size: 20 })],
          }),

          rule(),

          // ━━━ HASHTAGS ━━━
          section("🏷️", "Hashtags"),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `#${script.hashtags.join("  #")}`,
                color: PURPLE, size: 20,
              }),
            ],
          }),

          rule(),

          // ━━━ THUMBNAIL ━━━
          section("🖼️", "Thumbnail Idea"),
          new Paragraph({
            spacing: { after: 120 },
            children: [new TextRun({ text: script.thumbnail_idea, color: BLACK, size: 20 })],
          }),

          spacer(200, 80),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Generated by InstaIntel  ·  ${dateStr}`,
                color: GRAY, size: 16, italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `instaintel-script-v${script.variation}-${script.concept_title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

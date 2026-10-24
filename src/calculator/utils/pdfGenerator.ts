import { jsPDF } from 'jspdf';
import type { CalculationBreakdown, IndustryScaleKey, VideoStyleKey } from '../types';
import { formatETB } from './pricing';

const SCALE_LABELS: Record<IndustryScaleKey, string> = {
  small: 'Startup & Indie',
  medium: 'Established & NGO',
  corporate: 'Corporate',
  enterprise: 'Enterprise',
};

const STYLE_LABELS: Record<VideoStyleKey, string> = {
  talkingHead: 'Talking Head & Reels',
  lifestyle: 'Lifestyle & B-Roll',
  commercial: 'Commercial Set',
};

// Palette (RGB)
const CARBON: [number, number, number] = [8, 8, 8];
const WHITE: [number, number, number] = [245, 245, 245];
const MUTED: [number, number, number] = [138, 138, 138];
const DIM: [number, number, number] = [78, 78, 78];
const HAIRLINE: [number, number, number] = [36, 36, 36];
const AMBER: [number, number, number] = [249, 161, 54];

// Page geometry (mm)
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const LEFT = MARGIN;
const RIGHT = PAGE_W - MARGIN;
const CONTENT_W = RIGHT - LEFT;
const FOOTER_TOP = 268;

async function loadLogoDataUrl(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1344;
        canvas.height = img.naturalHeight || 705;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/mach10-logo.png';
  });
}

type Font = 'normal' | 'bold';

/** Sets font, size and color in one call. */
function style(
  doc: jsPDF,
  font: Font,
  size: number,
  color: [number, number, number]
) {
  doc.setFont('helvetica', font);
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
}

/** Truncates text with an ellipsis so it never exceeds maxWidth (uses current font/size). */
function fit(doc: jsPDF, text: string, maxWidth: number): string {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && doc.getTextWidth(out + '...') > maxWidth) {
    out = out.slice(0, -1);
  }
  return out.trimEnd() + '...';
}

/** Left-aligned label with letter spacing (only used for short caps labels). */
function label(doc: jsPDF, text: string, x: number, y: number, space = 0.25) {
  doc.setCharSpace(space);
  doc.text(text, x, y);
  doc.setCharSpace(0);
}

function hairline(doc: jsPDF, y: number, color = HAIRLINE) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.2);
  doc.line(LEFT, y, RIGHT, y);
}

function drawFooter(doc: jsPDF, logo: string | null) {
  hairline(doc, FOOTER_TOP);

  const LEFT_COL_MAX = 100;

  if (logo) doc.addImage(logo, 'PNG', LEFT, FOOTER_TOP + 5, 6.8, 3.6);
  style(doc, 'bold', 7.5, WHITE);
  doc.setCharSpace(0.6);
  doc.text('MACH10 MEDIA CO', LEFT + (logo ? 9.5 : 0), FOOTER_TOP + 8);
  doc.setCharSpace(0);

  style(doc, 'normal', 6.5, MUTED);
  const terms =
    'Valid for 30 days from issuance. Production begins upon agreement and mobilization retainer.';
  doc.text(doc.splitTextToSize(terms, LEFT_COL_MAX), LEFT, FOOTER_TOP + 14);

  style(doc, 'bold', 7.5, WHITE);
  doc.text('mach10media.et@gmail.com', RIGHT, FOOTER_TOP + 8, { align: 'right' });
  style(doc, 'normal', 6.5, MUTED);
  doc.text('mach10media.et  ·  Addis Ababa, Ethiopia', RIGHT, FOOTER_TOP + 14, { align: 'right' });
}

function buildXSpecs(x: CalculationBreakdown['channels']['x']): string {
  const parts: string[] = [];
  if (x.postCount > 0) {
    parts.push(`${x.postCount} X post${x.postCount > 1 ? 's' : ''} (16:9 / 1:1)`);
  }
  if (x.threadCount > 0) {
    parts.push(`${x.threadCount} narrative thread${x.threadCount > 1 ? 's' : ''}`);
  }
  if (x.videoReposts > 0) {
    parts.push(`${x.videoReposts} adapted reel clip${x.videoReposts > 1 ? 's' : ''}`);
  }
  return parts.length > 0
    ? parts.join('  ·  ')
    : 'X posts (16:9 / 1:1)  ·  Narrative threads  ·  Reel cutdowns';
}

function buildLinkedInSpecs(li: CalculationBreakdown['channels']['linkedin']): string {
  const parts: string[] = [];
  if (li.postCount > 0) {
    parts.push(`${li.postCount} executive post${li.postCount > 1 ? 's' : ''}`);
  }
  if (li.carouselCount > 0) {
    parts.push(`${li.carouselCount} PDF carousel${li.carouselCount > 1 ? 's' : ''} (4:5)`);
  }
  if (li.videoReposts > 0) {
    parts.push(`${li.videoReposts} native video clip${li.videoReposts > 1 ? 's' : ''}`);
  }
  return parts.length > 0
    ? parts.join('  ·  ')
    : 'Executive copy  ·  PDF document carousels (4:5)  ·  Native video';
}

function buildYouTubeSpecs(yt: CalculationBreakdown['channels']['youtube']): string {
  const parts: string[] = [];
  if (yt.shortsCount > 0) {
    parts.push(
      `${yt.shortsCount} YouTube Short${yt.shortsCount > 1 ? 's' : ''} (9:16 reused reels)`
    );
  }
  if (yt.landscapeCount > 0) {
    parts.push(
      `${yt.landscapeCount} landscape 16:9 video${
        yt.landscapeCount > 1 ? 's' : ''
      } (1920x1080 + thumbnail)`
    );
  }
  return parts.length > 0
    ? parts.join('  ·  ')
    : 'YouTube Shorts (9:16)  ·  Dedicated 16:9 (1920x1080) + custom thumbnail';
}

export async function generateQuotePDF(
  breakdown: CalculationBreakdown,
  options: { logoDataUrl?: string | null; save?: boolean } = {}
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logo =
    options.logoDataUrl !== undefined ? options.logoDataUrl : await loadLogoDataUrl();

  // Background
  doc.setFillColor(CARBON[0], CARBON[1], CARBON[2]);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  const refNumber = `M10-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = new Date()
    .toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    .toUpperCase();

  // =========================================================================
  // 1. MASTHEAD  (y 16 - 27)
  // =========================================================================
  const LOGO_W = 11.4;
  const LOGO_H = 6.0;
  const mastY = 16;

  if (logo) doc.addImage(logo, 'PNG', LEFT, mastY, LOGO_W, LOGO_H);

  style(doc, 'bold', 10, WHITE);
  doc.setCharSpace(0.9);
  doc.text('MACH10MEDIA', LEFT + (logo ? LOGO_W + 3.5 : 0), mastY + 4.4);
  doc.setCharSpace(0);

  style(doc, 'bold', 7.5, WHITE);
  doc.text('PRODUCTION ESTIMATE', RIGHT, mastY + 2.4, { align: 'right' });
  style(doc, 'normal', 7, MUTED);
  doc.text(`${refNumber}  ·  ${dateStr}`, RIGHT, mastY + 6.6, { align: 'right' });

  hairline(doc, 27);

  // =========================================================================
  // 2. TITLE  (y 36 - 51)
  // =========================================================================
  style(doc, 'normal', 21, [200, 200, 200]);
  doc.text('MONTHLY CONTENT', LEFT, 41);
  style(doc, 'bold', 21, WHITE);
  doc.text('PRODUCTION BRIEF', LEFT, 49.5);

  // =========================================================================
  // 3. META STRIP  (4 equal columns, y 57 - 73)
  // =========================================================================
  const stripTop = 57;
  const stripBottom = 73;
  hairline(doc, stripTop);
  hairline(doc, stripBottom);

  const colW = CONTENT_W / 4; // 42.5mm
  const colPad = 3; // keeps value text clear of the next column
  const baseSuite =
    breakdown.activePreset === 'custom'
      ? 'Custom Scope'
      : `${breakdown.activePreset.charAt(0).toUpperCase()}${breakdown.activePreset.slice(1)} Suite`;
  const suite =
    breakdown.activeChannelsCount > 0
      ? `${baseSuite} (+${breakdown.activeChannelsCount} Ch)`
      : baseSuite;

  const meta = [
    { label: 'CLIENT', value: breakdown.clientName.trim() || 'Valued Partner', accent: false },
    { label: 'SUITE', value: suite, accent: true },
    { label: 'SCALE', value: SCALE_LABELS[breakdown.industryScale] ?? 'Standard', accent: false },
    { label: 'DIRECTION', value: STYLE_LABELS[breakdown.videoStyle] ?? 'Essential', accent: false },
  ];

  meta.forEach((m, i) => {
    const x = LEFT + i * colW;
    const maxW = colW - colPad;

    style(doc, 'normal', 6.5, MUTED);
    label(doc, m.label, x, stripTop + 6.2, 0.3);

    style(doc, 'bold', 8.8, m.accent ? AMBER : WHITE);
    doc.text(fit(doc, m.value, maxW), x, stripTop + 12.6);
  });

  // =========================================================================
  // 4. CORE DELIVERABLES  (y 83 - 157)
  // =========================================================================
  let y = 83;

  style(doc, 'bold', 7, MUTED);
  label(doc, 'CORE DELIVERABLES (IG / TIKTOK / FB)', LEFT, y, 0.45);
  style(doc, 'normal', 7, MUTED);
  doc.text(`${breakdown.totalPosts} CORE POSTS`, RIGHT, y, { align: 'right' });

  y += 4;
  hairline(doc, y);

  const rows = [
    {
      num: '01',
      title: 'SHORT-FORM VIDEO & REELS (9:16)',
      specs: '9:16 vertical  ·  1080x1920  ·  Up to 60s  ·  Color grade & sound design',
      qty: breakdown.videoCount > 0 ? `${breakdown.videoCount} VIDEOS` : '-',
      note: breakdown.videoTierUnlocked ? 'VOLUME RATE' : (null as string | null),
      active: breakdown.videoCount > 0,
    },
    {
      num: '02',
      title: 'COMMERCIAL PHOTOGRAPHY',
      specs: '4:5 social framing  ·  High-res master stills included',
      qty: breakdown.photoCount > 0 ? `${breakdown.photoCount} STILLS` : '-',
      note: breakdown.visualTierUnlocked && breakdown.photoCount > 0 ? 'VOLUME RATE' : null,
      active: breakdown.photoCount > 0,
    },
    {
      num: '03',
      title: 'EDITORIAL GRAPHIC DESIGN',
      specs: '4:5 ratio  ·  Carousels & branded visual systems',
      qty: breakdown.graphicCount > 0 ? `${breakdown.graphicCount} POSTS` : '-',
      note: breakdown.visualTierUnlocked && breakdown.graphicCount > 0 ? 'VOLUME RATE' : null,
      active: breakdown.graphicCount > 0,
    },
    {
      num: '04',
      title: 'SOCIAL STORIES',
      specs: '9:16 full screen  ·  Daily engagement frames',
      qty: breakdown.storyCount > 0 ? `${breakdown.storyCount} FRAMES` : '-',
      note: breakdown.storyTierUnlocked ? 'VOLUME RATE' : null,
      active: breakdown.storyCount > 0,
    },
    {
      num: '05',
      title: 'ENGAGEMENT & MONTHLY ANALYTICS',
      specs: 'Monthly performance audit  ·  KPI review',
      qty: breakdown.engagementReportIncluded ? 'INCLUDED' : '-',
      note: breakdown.engagementReportIncluded && breakdown.isEngagementWaived ? 'FEE WAIVED' : null,
      active: breakdown.engagementReportIncluded,
    },
  ];

  const ROW_H = 14;
  const TEXT_X = LEFT + 10; // title/spec column start
  const QTY_COL_W = 34; // reserved on the right for quantity
  const TEXT_MAX_W = CONTENT_W - 10 - QTY_COL_W - 4; // never reaches quantity column

  rows.forEach((r) => {
    const titleY = y + 6.2;
    const specY = y + 10.8;

    style(doc, 'bold', 8, r.active ? AMBER : DIM);
    doc.text(r.num, LEFT, titleY);

    style(doc, 'bold', 8.8, r.active ? WHITE : DIM);
    doc.text(fit(doc, r.title, TEXT_MAX_W), TEXT_X, titleY);

    style(doc, 'normal', 6.8, r.active ? MUTED : DIM);
    doc.text(fit(doc, r.specs, TEXT_MAX_W), TEXT_X, specY);

    style(doc, 'bold', 8.8, r.active ? WHITE : DIM);
    doc.text(r.qty, RIGHT, titleY, { align: 'right' });

    if (r.note) {
      style(doc, 'bold', 6, AMBER);
      doc.text(r.note, RIGHT, specY, { align: 'right' });
    }

    y += ROW_H;
    hairline(doc, y);
  });

  // =========================================================================
  // 5. CHANNEL ADD-ONS  (conditional, only when >=1 channel enabled)
  // =========================================================================
  const channelRows: {
    code: string;
    title: string;
    specs: string;
    qty: string;
    note: string | null;
  }[] = [];

  if (breakdown.channels.x.enabled) {
    const x = breakdown.channels.x;
    const totalX = x.postCount + x.threadCount + x.videoReposts;
    channelRows.push({
      code: 'X',
      title: 'X (TWITTER) DISTRIBUTION',
      specs: buildXSpecs(x),
      qty: totalX > 0 ? `${totalX} ITEMS` : 'ACTIVE',
      note:
        breakdown.xRepostsCharged > 0
          ? 'ADAPTATION FEE'
          : x.videoReposts > 0
          ? 'REPOSTS INCLUDED'
          : null,
    });
  }

  if (breakdown.channels.linkedin.enabled) {
    const li = breakdown.channels.linkedin;
    const totalLI = li.postCount + li.carouselCount + li.videoReposts;
    channelRows.push({
      code: 'IN',
      title: 'LINKEDIN B2B DISTRIBUTION',
      specs: buildLinkedInSpecs(li),
      qty: totalLI > 0 ? `${totalLI} ITEMS` : 'ACTIVE',
      note:
        breakdown.linkedinRepostsCharged > 0
          ? 'ADAPTATION FEE'
          : li.videoReposts > 0
          ? 'REPOSTS INCLUDED'
          : null,
    });
  }

  if (breakdown.channels.youtube.enabled) {
    const yt = breakdown.channels.youtube;
    const totalYT = yt.shortsCount + yt.landscapeCount;
    let ytNote: string | null = null;
    if (breakdown.youtubeLandscapeTierUnlocked) {
      ytNote = 'VOLUME RATE';
    } else if (yt.landscapeCount > 0) {
      ytNote = '16:9 PRODUCTION';
    } else if (breakdown.youtubeShortsCharged > 0) {
      ytNote = 'ADAPTATION FEE';
    } else if (yt.shortsCount > 0) {
      ytNote = 'SHORTS INCLUDED';
    }
    channelRows.push({
      code: 'YT',
      title: 'YOUTUBE SHORTS & LONG-FORM (16:9)',
      specs: buildYouTubeSpecs(yt),
      qty: totalYT > 0 ? `${totalYT} VIDEOS` : 'ACTIVE',
      note: ytNote,
    });
  }

  if (channelRows.length > 0) {
    y += 9;

    style(doc, 'bold', 7, MUTED);
    label(doc, 'DISTRIBUTION CHANNEL ADD-ONS', LEFT, y, 0.45);
    style(doc, 'normal', 7, MUTED);
    doc.text(
      `${channelRows.length} ACTIVE CHANNEL${channelRows.length > 1 ? 'S' : ''}`,
      RIGHT,
      y,
      { align: 'right' }
    );

    y += 4;
    hairline(doc, y);

    const CH_ROW_H = 12.5;
    channelRows.forEach((cr) => {
      const titleY = y + 5.6;
      const specY = y + 9.8;

      style(doc, 'bold', 7.5, AMBER);
      doc.text(cr.code, LEFT, titleY);

      style(doc, 'bold', 8.5, WHITE);
      doc.text(fit(doc, cr.title, TEXT_MAX_W), TEXT_X, titleY);

      style(doc, 'normal', 6.8, MUTED);
      doc.text(fit(doc, cr.specs, TEXT_MAX_W), TEXT_X, specY);

      style(doc, 'bold', 8.5, WHITE);
      doc.text(cr.qty, RIGHT, titleY, { align: 'right' });

      if (cr.note) {
        style(doc, 'bold', 5.8, AMBER);
        doc.text(cr.note, RIGHT, specY, { align: 'right' });
      }

      y += CH_ROW_H;
      hairline(doc, y);
    });
  }

  // =========================================================================
  // 6. INVESTMENT SUMMARY  (label / value rows, all right-aligned)
  // =========================================================================
  const SUMMARY_BLOCK_H = 44;
  if (y + SUMMARY_BLOCK_H > FOOTER_TOP - 6) {
    drawFooter(doc, logo);
    doc.addPage('a4', 'portrait');
    doc.setFillColor(CARBON[0], CARBON[1], CARBON[2]);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
    y = 24;
  } else {
    y += 10;
  }

  style(doc, 'bold', 7, MUTED);
  label(doc, 'INVESTMENT SUMMARY', LEFT, y, 0.45);

  const volumeNote =
    breakdown.videoTierUnlocked ||
    breakdown.visualTierUnlocked ||
    breakdown.storyTierUnlocked ||
    breakdown.youtubeLandscapeTierUnlocked;
  if (volumeNote) {
    style(doc, 'normal', 6.5, MUTED);
    doc.text('PROGRESSIVE VOLUME RATES APPLIED', RIGHT, y, { align: 'right' });
  }

  y += 4;
  hairline(doc, y);

  // Net
  y += 8;
  style(doc, 'normal', 8.8, MUTED);
  doc.text('Monthly net retainer', LEFT, y);
  style(doc, 'normal', 9.8, WHITE);
  doc.text(`${formatETB(breakdown.estimatedNetTotal)} ETB`, RIGHT, y, { align: 'right' });

  // VAT
  y += 7.5;
  style(doc, 'normal', 8.8, MUTED);
  doc.text('Value added tax (15%)', LEFT, y);
  style(doc, 'normal', 9.8, WHITE);
  doc.text(`${formatETB(breakdown.taxAmount)} ETB`, RIGHT, y, { align: 'right' });

  // Total
  y += 5;
  doc.setDrawColor(AMBER[0], AMBER[1], AMBER[2]);
  doc.setLineWidth(0.4);
  doc.line(LEFT, y, RIGHT, y);

  y += 10.5;
  style(doc, 'bold', 8, AMBER);
  label(doc, 'TOTAL INC. VAT', LEFT, y, 0.5);
  style(doc, 'bold', 17, WHITE);
  doc.text(`${formatETB(breakdown.grandTotal)} ETB`, RIGHT, y, { align: 'right' });

  // =========================================================================
  // 7. FOOTER
  // =========================================================================
  drawFooter(doc, logo);

  if (options.save !== false) {
    const cleanClientName = (breakdown.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Mach10_Estimate_${cleanClientName}_${refNumber}.pdf`);
  }

  return doc;
}

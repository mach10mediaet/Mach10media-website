import React, { useState } from 'react';
import type { CalculationBreakdown } from '../types';
import { formatETB } from '../utils/pricing';
import { ArrowUpRight, Check } from 'lucide-react';
import { INDUSTRY_OPTIONS, VIDEO_STYLE_OPTIONS } from '../constants/defaults';

interface EstimateCardProps {
  breakdown: CalculationBreakdown;
}

function summarizeX(x: CalculationBreakdown['channels']['x']): string {
  const parts: string[] = [];
  if (x.postCount > 0) parts.push(`${x.postCount} Post${x.postCount > 1 ? 's' : ''}`);
  if (x.threadCount > 0) parts.push(`${x.threadCount} Thread${x.threadCount > 1 ? 's' : ''}`);
  if (x.videoReposts > 0) parts.push(`${x.videoReposts} Clip${x.videoReposts > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' · ') : 'Enabled';
}

function summarizeLinkedIn(li: CalculationBreakdown['channels']['linkedin']): string {
  const parts: string[] = [];
  if (li.postCount > 0) parts.push(`${li.postCount} Post${li.postCount > 1 ? 's' : ''}`);
  if (li.carouselCount > 0) {
    parts.push(`${li.carouselCount} Carousel${li.carouselCount > 1 ? 's' : ''}`);
  }
  if (li.videoReposts > 0) parts.push(`${li.videoReposts} Clip${li.videoReposts > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(' · ') : 'Enabled';
}

function summarizeYouTube(yt: CalculationBreakdown['channels']['youtube']): string {
  const parts: string[] = [];
  if (yt.shortsCount > 0) parts.push(`${yt.shortsCount} Short${yt.shortsCount > 1 ? 's' : ''}`);
  if (yt.landscapeCount > 0) {
    parts.push(`${yt.landscapeCount} 16:9 Video${yt.landscapeCount > 1 ? 's' : ''}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Enabled';
}

/* The estimate reveal — shown only after the client finishes the scope form and
   presses "Show My Estimate". Static, centered card on every breakpoint. */
export const EstimateCard: React.FC<EstimateCardProps> = ({ breakdown }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      // Lazy-loaded so the jsPDF bundle stays out of the calculator page chunk
      const { generateQuotePDF } = await import('../utils/pdfGenerator');
      await generateQuotePDF(breakdown);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const baseSuiteLabel =
    breakdown.activePreset === 'custom'
      ? 'CUSTOM SCOPE'
      : `${breakdown.activePreset.toUpperCase()} SUITE`;

  const tierBadgeLabel =
    breakdown.activeChannelsCount > 0
      ? `${baseSuiteLabel} · +${breakdown.activeChannelsCount} CH`
      : baseSuiteLabel;

  const suiteTextColor =
    breakdown.activePreset === 'bronze'
      ? 'text-[#D98A4E]'
      : breakdown.activePreset === 'silver'
      ? 'text-[#E2E8F0]'
      : 'text-[#f2f2f2]';

  const industryLabel =
    INDUSTRY_OPTIONS.find((i) => i.key === breakdown.industryScale)?.badge || 'Standard';
  const styleLabel =
    VIDEO_STYLE_OPTIONS.find((v) => v.key === breakdown.videoStyle)?.badge || 'Essential';

  const activeCoreItems = [
    { label: 'Video & Reels (9:16)', qty: breakdown.videoCount, unit: 'Videos' },
    { label: 'Photography', qty: breakdown.photoCount, unit: 'Photos' },
    { label: 'Graphic Design', qty: breakdown.graphicCount, unit: 'Posts' },
    { label: 'Social Stories', qty: breakdown.storyCount, unit: 'Frames' },
  ].filter((item) => item.qty > 0);

  const activeChannelRows: { label: string; summary: string }[] = [];
  if (breakdown.channels.x.enabled) {
    activeChannelRows.push({
      label: 'X (Twitter)',
      summary: summarizeX(breakdown.channels.x),
    });
  }
  if (breakdown.channels.linkedin.enabled) {
    activeChannelRows.push({
      label: 'LinkedIn',
      summary: summarizeLinkedIn(breakdown.channels.linkedin),
    });
  }
  if (breakdown.channels.youtube.enabled) {
    activeChannelRows.push({
      label: 'YouTube',
      summary: summarizeYouTube(breakdown.channels.youtube),
    });
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0c0c0c]/50 p-6 sm:p-8">
      <div className="flex items-center justify-between pb-4">
        <span className={`font-mono text-[11px] tracking-[0.2em] ${suiteTextColor} uppercase`}>
          {tierBadgeLabel}
        </span>

        <span className="font-mono text-[10px] tracking-[0.16em] text-[#8c8c8c] uppercase">
          {breakdown.totalPosts} Core Posts
        </span>
      </div>

      {/* Client & Profile Meta */}
      <div className="flex items-center justify-between py-3 font-mono text-[10px] tracking-[0.14em] uppercase">
        <span className="text-[#a3a3a3]">
          {breakdown.clientName ? breakdown.clientName.slice(0, 24) : 'Client Quote'}
        </span>
        <span className="text-[#7a7a7a]">
          {industryLabel} · {styleLabel}
        </span>
      </div>

      {/* Investment Net Display */}
      <div className="py-5">
        <div className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-[#8c8c8c] uppercase">
          Monthly Retainer (Net)
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-sans text-4xl font-light tracking-tight text-white tabular-nums sm:text-5xl">
            {formatETB(breakdown.estimatedNetTotal)}
          </span>
          <span className="font-mono text-xs font-medium tracking-[0.2em] text-[#F9A136] uppercase">
            ETB
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between font-mono text-[11px] tracking-[0.12em]">
          <span className="text-[#8c8c8c] uppercase">Total Inc. 15% VAT</span>
          <span className="font-medium text-white tabular-nums">
            {formatETB(breakdown.grandTotal)} ETB
          </span>
        </div>
      </div>

      {/* Active Scope Breakdown */}
      <div className="py-4 space-y-2">
        <div className="font-mono text-[10px] tracking-[0.2em] text-[#8c8c8c] uppercase mb-2">
          Included Scope
        </div>

        <dl className="space-y-2">
          {activeCoreItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-xs">
              <dt className="font-light text-[#e5e5e5]">{item.label}</dt>
              <dd className="font-mono text-[11px] tracking-[0.12em] text-white tabular-nums uppercase">
                {item.qty} {item.unit}
              </dd>
            </div>
          ))}

          {breakdown.engagementReportIncluded && (
            <div className="flex items-center justify-between text-xs">
              <dt className="font-light text-[#e5e5e5]">Monthly Analytics Report</dt>
              <dd className="font-mono text-[10px] tracking-[0.16em] text-[#F9A136] uppercase">
                {breakdown.isEngagementWaived ? 'Free' : 'Included'}
              </dd>
            </div>
          )}

          {activeCoreItems.length === 0 && !breakdown.engagementReportIncluded && (
            <p className="font-sans text-xs text-[#666666]">No core deliverables selected</p>
          )}
        </dl>

        {/* Channel Add-ons Group */}
        {activeChannelRows.length > 0 && (
          <div className="mt-3 pt-3">
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#F9A136] uppercase mb-2">
              Extra Channels
            </div>
            <dl className="space-y-1.5">
              {activeChannelRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 text-xs">
                  <dt className="font-light text-[#e5e5e5]">{row.label}</dt>
                  <dd className="font-mono text-[10px] tracking-[0.12em] text-white uppercase text-right tabular-nums">
                    {row.summary}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className="mt-5 border-t border-white/5 pt-4">
        <button
          type="button"
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 font-mono text-[11px] font-bold tracking-[0.16em] text-[#080808] uppercase shadow-[0_10px_30px_rgba(255,255,255,0.12)] transition-all duration-500 hover:scale-[1.015] hover:bg-[#F9A136] disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          <span>
            {isExporting
              ? 'Preparing PDF...'
              : downloadSuccess
              ? 'Estimate Downloaded'
              : 'Download Estimate PDF'}
          </span>
          {downloadSuccess ? (
            <Check className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </div>
  );
};

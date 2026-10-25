import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CalculationBreakdown } from '../types';
import { formatETB } from '../utils/pricing';
import { ArrowUpRight, Check, ChevronUp, ChevronDown, X } from 'lucide-react';
import { INDUSTRY_OPTIONS, VIDEO_STYLE_OPTIONS } from '../constants/defaults';

interface StickySummaryCardProps {
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

export const StickySummaryCard: React.FC<StickySummaryCardProps> = ({ breakdown }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Close mobile full-screen sheet on Escape and lock background scroll while open
  useEffect(() => {
    if (!isMobileExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileExpanded(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileExpanded]);

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

  const suiteDotColor =
    breakdown.activePreset === 'bronze'
      ? 'bg-[#D98A4E]'
      : breakdown.activePreset === 'silver'
      ? 'bg-[#E2E8F0]'
      : 'bg-[#F9A136]';

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

  const renderDownloadButton = () => (
    <button
      type="button"
      onClick={handleDownloadPDF}
      disabled={isExporting}
      className="group relative flex w-full items-center justify-center overflow-hidden rounded-full bg-white px-6 py-3.5 font-mono text-xs font-bold tracking-[0.2em] text-[#080808] uppercase transition-all duration-300 hover:bg-[#F9A136] disabled:opacity-50 cursor-pointer"
    >
      <span>
        {isExporting
          ? 'Preparing PDF...'
          : downloadSuccess
          ? 'Estimate Downloaded'
          : 'Download Estimate PDF'}
      </span>
      {downloadSuccess ? (
        <Check className="ml-2 h-4 w-4" aria-hidden="true" />
      ) : (
        <ArrowUpRight
          className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      )}
    </button>
  );

  const renderScopeDetails = () => (
    <>
      {/* Client & Profile Meta */}
      <div className="flex items-center justify-between border-b border-white/6 py-3 font-mono text-[10px] tracking-[0.14em] uppercase">
        <span className="text-[#a3a3a3]">
          {breakdown.clientName ? breakdown.clientName.slice(0, 24) : 'Client Quote'}
        </span>
        <span className="text-[#7a7a7a]">
          {industryLabel} · {styleLabel}
        </span>
      </div>

      {/* Investment Net Display */}
      <div className="py-5 border-b border-white/8">
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

        <div className="mt-4 flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.02] px-4 py-2.5 font-mono text-[11px] tracking-[0.12em]">
          <span className="text-[#8c8c8c] uppercase">Total Inc. 15% VAT</span>
          <span className="font-medium text-white tabular-nums">
            {formatETB(breakdown.grandTotal)} ETB
          </span>
        </div>
      </div>

      {/* Active Scope Breakdown */}
      <div className="py-4 space-y-2 border-b border-white/8">
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
          <div className="mt-3 border-t border-white/6 pt-3">
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#F9A136] uppercase mb-2">
              Extra Channels
            </div>
            <dl className="space-y-1.5">
              {activeChannelRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 text-xs"
                >
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
    </>
  );

  return (
    <>
      {/* DESKTOP VIEW (>= 1024px): Pinned Right-Column Card */}
      <aside aria-label="Retainer estimate summary" className="hidden w-full lg:block">
        <div className="max-h-[calc(100vh-6.5rem)] overflow-y-auto rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
          <div className="flex items-center justify-between border-b border-white/8 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full ${suiteDotColor} opacity-75`}
                />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${suiteDotColor}`} />
              </span>
              <span className={`font-mono text-[11px] tracking-[0.2em] ${suiteTextColor} uppercase`}>
                {tierBadgeLabel}
              </span>
            </div>

            <span className="font-mono text-[10px] tracking-[0.16em] text-[#8c8c8c] uppercase">
              {breakdown.totalPosts} Core Posts
            </span>
          </div>

          {renderScopeDetails()}

          <div className="mt-5">{renderDownloadButton()}</div>
        </div>
      </aside>

      {/* MOBILE VIEW (< 1024px): Bottom Edge Peek Card + Full-Screen Pop-Up Sheet.
          Portaled to <body>: the app's animated view wrapper applies a CSS filter,
          which would otherwise become the containing block for these fixed elements. */}
      {createPortal(
        <div className="lg:hidden">
        {/* Backdrop when expanded */}
        {isMobileExpanded && (
          <div
            aria-hidden="true"
            onClick={() => setIsMobileExpanded(false)}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm transition-opacity"
          />
        )}

        <aside
          aria-label="Mobile retainer estimate"
          className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-t border-white/15 bg-[#0c0c0c]/95 shadow-[0_-16px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all duration-300 ease-out ${
            isMobileExpanded ? 'h-[92dvh]' : 'h-auto'
          }`}
        >
          {!isMobileExpanded ? (
            /* PEEK MODE AT BOTTOM EDGE */
            <button
              type="button"
              onClick={() => setIsMobileExpanded(true)}
              aria-expanded={false}
              aria-label="Expand full estimate summary"
              className="w-full px-5 pt-2.5 pb-4 text-left cursor-pointer"
            >
              {/* Grabber Handle */}
              <div
                aria-hidden="true"
                className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-white/20"
              />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full ${suiteDotColor}`} aria-hidden="true" />
                    <span
                      className={`font-mono text-[10px] tracking-[0.18em] ${suiteTextColor} uppercase`}
                    >
                      {tierBadgeLabel}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="font-sans text-2xl font-normal tracking-tight text-white tabular-nums">
                      {formatETB(breakdown.estimatedNetTotal)}
                    </span>
                    <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#F9A136] uppercase">
                      ETB
                    </span>
                    <span className="ml-1 font-mono text-[10px] text-[#7a7a7a]">
                      ({formatETB(breakdown.grandTotal)} inc. VAT)
                    </span>
                  </div>
                </div>

                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 font-mono text-[10px] tracking-[0.16em] text-white uppercase">
                  <span>View Quote</span>
                  <ChevronUp className="h-3.5 w-3.5 text-[#F9A136]" aria-hidden="true" />
                </span>
              </div>
            </button>
          ) : (
            /* EXPANDED FULL-SCREEN SHEET ON MOBILE */
            <div className="flex h-full flex-col overflow-hidden px-6 pt-3 pb-6">
              {/* Top Handle & Header */}
              <div className="shrink-0 border-b border-white/8 pb-4">
                <button
                  type="button"
                  onClick={() => setIsMobileExpanded(false)}
                  aria-label="Collapse estimate summary"
                  className="mx-auto mb-3 block h-1 w-10 rounded-full bg-white/25 cursor-pointer"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 rounded-full ${suiteDotColor}`} aria-hidden="true" />
                    <span
                      className={`font-mono text-[11px] tracking-[0.2em] ${suiteTextColor} uppercase`}
                    >
                      {tierBadgeLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMobileExpanded(false)}
                    aria-label="Close full screen quote"
                    className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/5 px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-[#b3b3b3] uppercase hover:text-white cursor-pointer"
                  >
                    <span>Minimize</span>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Scrollable Sheet Body */}
              <div className="flex-1 overflow-y-auto py-2">{renderScopeDetails()}</div>

              {/* Bottom CTA Bar inside Expanded Sheet */}
              <div className="shrink-0 pt-4 space-y-2.5">
                {renderDownloadButton()}
                <button
                  type="button"
                  onClick={() => setIsMobileExpanded(false)}
                  className="flex w-full items-center justify-center gap-1.5 py-2 font-mono text-[10px] tracking-[0.18em] text-[#8c8c8c] uppercase hover:text-white cursor-pointer"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  <span>Continue Editing Scope</span>
                </button>
              </div>
            </div>
          )}
        </aside>
        </div>,
        document.body
      )}
    </>
  );
};

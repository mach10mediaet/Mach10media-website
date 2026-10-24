import React from 'react';
import { DeliverableRow } from './DeliverableRow';

interface DeliverablesSectionProps {
  videoCount: number;
  photoCount: number;
  graphicCount: number;
  storyCount: number;
  engagementReport: boolean;
  onUpdateDeliverable: (
    key: 'videoCount' | 'photoCount' | 'graphicCount' | 'storyCount' | 'engagementReport',
    value: number | boolean
  ) => void;
  videoTierUnlocked: boolean;
  visualTierUnlocked: boolean;
  storyTierUnlocked: boolean;
  totalPosts: number;
  isEngagementWaived: boolean;
}

export const DeliverablesSection: React.FC<DeliverablesSectionProps> = ({
  videoCount,
  photoCount,
  graphicCount,
  storyCount,
  engagementReport,
  onUpdateDeliverable,
  videoTierUnlocked,
  visualTierUnlocked,
  storyTierUnlocked,
  totalPosts,
  isEngagementWaived,
}) => {
  return (
    <section className="border-t border-white/8 pt-8 pb-8">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-sans text-lg font-medium tracking-tight text-white uppercase sm:text-xl">
          <span className="mr-2.5 font-mono text-xs text-[#F9A136]">03</span>
          Core Deliverables
        </h2>
        <div className="font-mono text-[11px] tracking-[0.16em] text-[#8c8c8c] uppercase">
          <span className="font-semibold text-white tabular-nums">{totalPosts}</span> Core Posts
        </div>
      </div>

      <div className="border-b border-white/8">
        <DeliverableRow
          id="video-posts"
          num="01"
          title="Short-Form Video & Reels"
          specs="9:16 vertical · 1080×1920 · Up to 60s"
          value={videoCount}
          onChange={(val) => onUpdateDeliverable('videoCount', val)}
          tierUnlocked={videoTierUnlocked}
        />

        <DeliverableRow
          id="photo-posts"
          num="02"
          title="Photography"
          specs="4:5 social framing · High-res stills"
          value={photoCount}
          onChange={(val) => onUpdateDeliverable('photoCount', val)}
          tierUnlocked={visualTierUnlocked}
        />

        <DeliverableRow
          id="graphic-posts"
          num="03"
          title="Graphic Design"
          specs="4:5 posts & branded carousels"
          value={graphicCount}
          onChange={(val) => onUpdateDeliverable('graphicCount', val)}
          tierUnlocked={visualTierUnlocked}
        />

        <DeliverableRow
          id="story-posts"
          num="04"
          title="Social Stories"
          specs="9:16 daily story frames"
          value={storyCount}
          onChange={(val) => onUpdateDeliverable('storyCount', val)}
          tierUnlocked={storyTierUnlocked}
        />

        {/* 05. Monthly Analytics */}
        <div className="group border-t border-white/8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className={`pt-0.5 font-mono text-xs transition-colors ${
                engagementReport ? 'text-[#F9A136]' : 'text-[#525252]'
              }`}
            >
              05
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  id="engagement-report-label"
                  className="font-sans text-sm font-medium tracking-tight text-[#f2f2f2] sm:text-base"
                >
                  Monthly Analytics Report
                </span>
                {engagementReport && isEngagementWaived && (
                  <span className="rounded-full border border-[#F9A136]/30 bg-[#F9A136]/10 px-2 py-0.5 font-mono text-[9px] tracking-[0.16em] text-[#F9A136] uppercase">
                    Free (8+ Posts)
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-sans text-xs text-[#808080]">
                Monthly performance &amp; KPI review
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={engagementReport}
            aria-labelledby="engagement-report-label"
            onClick={() => onUpdateDeliverable('engagementReport', !engagementReport)}
            className={`relative h-6 w-11 shrink-0 rounded-full border p-0.5 transition-colors duration-200 cursor-pointer ${
              engagementReport
                ? 'border-[#F9A136] bg-[#F9A136]'
                : 'border-white/15 bg-white/5'
            }`}
          >
            <span
              className={`block h-4.5 w-4.5 rounded-full transition-transform duration-200 ${
                engagementReport
                  ? 'translate-x-5 bg-[#080808]'
                  : 'translate-x-0 bg-[#8c8c8c]'
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
};

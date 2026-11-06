import React from 'react';
import type { ChannelKey, ChannelSelection } from '../types';
import { DeliverableRow } from './DeliverableRow';
import { TogglePair } from './TogglePair';

interface ChannelsSectionProps {
  channels: ChannelSelection;
  videoCount: number;
  repostFreeAllowance: number;
  youtubeLandscapeTierUnlocked: boolean;
  onToggleChannel: (key: ChannelKey) => void;
  onUpdateX: (field: 'postCount' | 'threadCount' | 'videoReposts', value: number) => void;
  onUpdateLinkedIn: (field: 'postCount' | 'carouselCount' | 'videoReposts', value: number) => void;
  onUpdateYouTube: (field: 'shortsCount' | 'landscapeCount', value: number) => void;
}

const CHANNEL_CARDS: {
  key: ChannelKey;
  code: string;
  name: string;
  summary: string;
}[] = [
  {
    key: 'x',
    code: 'X',
    name: 'X (Twitter)',
    summary: 'Short posts, threads & reel reposts',
  },
  {
    key: 'linkedin',
    code: 'IN',
    name: 'LinkedIn',
    summary: 'Executive posts, PDF carousels & video',
  },
  {
    key: 'youtube',
    code: 'YT',
    name: 'YouTube',
    summary: 'Shorts (reused reels) & 16:9 landscape videos',
  },
];

function getRepostBadge(
  count: number,
  freeAllowance: number,
  videoCount: number
): { text: string | null; tone: 'amber' | 'neutral' } {
  if (videoCount <= 0) {
    return { text: null, tone: 'neutral' };
  }
  if (freeAllowance <= 0) {
    return {
      text: count > 0 ? 'Adaptation Fee' : 'Per-Clip Fee',
      tone: count > 0 ? 'amber' : 'neutral',
    };
  }
  if (count > freeAllowance) {
    return {
      text: `+${count - freeAllowance} Extra Fee`,
      tone: 'amber',
    };
  }
  return {
    text: `${freeAllowance} Free`,
    tone: 'neutral',
  };
}

export const ChannelsSection: React.FC<ChannelsSectionProps> = ({
  channels,
  videoCount,
  repostFreeAllowance,
  youtubeLandscapeTierUnlocked,
  onToggleChannel,
  onUpdateX,
  onUpdateLinkedIn,
  onUpdateYouTube,
}) => {
  const xRepostsClamped = Math.min(channels.x.videoReposts, videoCount);
  const liRepostsClamped = Math.min(channels.linkedin.videoReposts, videoCount);
  const ytShortsClamped = Math.min(channels.youtube.shortsCount, videoCount);

  const xBadge = getRepostBadge(xRepostsClamped, repostFreeAllowance, videoCount);
  const liBadge = getRepostBadge(liRepostsClamped, repostFreeAllowance, videoCount);
  const ytBadge = getRepostBadge(ytShortsClamped, repostFreeAllowance, videoCount);

  const noVideosHint = videoCount === 0 ? 'Add video reels in Step 03 first' : null;

  return (
    <section className="pt-8 pb-6">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-sans text-lg font-medium tracking-tight text-white uppercase sm:text-xl">
          <span className="mr-2.5 font-mono text-xs text-[#F9A136]">04</span>
          Extra Channels
        </h2>
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#8c8c8c] uppercase">
          Optional Add-ons
        </span>
      </div>

      <div className="divide-y divide-white/[0.05] [overflow-anchor:none]">
        {CHANNEL_CARDS.map((option) => {
          const isEnabled = channels[option.key].enabled;
          const panelId = `channel-panel-${option.key}`;
          const labelId = `channel-label-${option.key}`;

          return (
            <div
              key={option.key}
              className={`py-1 transition-colors duration-200 ${
                isEnabled ? 'bg-white/[0.03]' : ''
              }`}
            >
              {/* Compact Single-Line Header */}
              <div className="flex items-center justify-between gap-4 px-2 py-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`shrink-0 font-mono text-[10px] font-bold transition-colors ${
                      isEnabled ? 'text-[#F9A136]' : 'text-[#8c8c8c]'
                    }`}
                    aria-hidden="true"
                  >
                    {option.code}
                  </span>

                  <div className="min-w-0">
                    <span
                      id={labelId}
                      className="font-sans text-sm font-medium text-white sm:text-base"
                    >
                      {option.name}
                    </span>
                    <span className="hidden font-sans text-xs text-[#808080] sm:inline">
                      {' '}
                      · {option.summary}
                    </span>
                  </div>
                </div>

                <TogglePair
                  label={option.name}
                  checked={isEnabled}
                  onToggle={() => onToggleChannel(option.key)}
                  panelId={panelId}
                />
              </div>

              {/* Expanded Rows — pure CSS grid-track reveal. The browser
                  interpolates the grid row 0fr→1fr frame by frame: starts from
                  rest, no measured pixel target (immune to font/reflow drift),
                  and re-toggling mid-flight retargets smoothly instead of
                  restarting. overflow-anchor above keeps the page from
                  scroll-jumping while the panel grows. */}
              <div
                aria-hidden={!isEnabled}
                className={`grid transition-[grid-template-rows,opacity,visibility] duration-[480ms] ease-[cubic-bezier(0.65,0,0.35,1)] ${
                  isEnabled
                    ? 'grid-rows-[1fr] opacity-100 visible'
                    : 'grid-rows-[0fr] opacity-0 invisible'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div id={panelId} className="divide-y divide-white/[0.05] px-2 pb-1">
                  {option.key === 'x' && (
                    <>
                      <DeliverableRow
                        id="x-posts"
                        num="01"
                        title="X Posts"
                        specs="Short copy + 16:9 or 1:1 visual"
                        value={channels.x.postCount}
                        max={60}
                        onChange={(val) => onUpdateX('postCount', val)}
                      />
                      <DeliverableRow
                        id="x-threads"
                        num="02"
                        title="X Threads"
                        specs="5–8 post narrative thread"
                        value={channels.x.threadCount}
                        max={30}
                        onChange={(val) => onUpdateX('threadCount', val)}
                      />
                      <DeliverableRow
                        id="x-reposts"
                        num="03"
                        title="Reel Reposts"
                        specs="Reuse core reels"
                        value={xRepostsClamped}
                        max={videoCount}
                        disabled={videoCount === 0}
                        hint={noVideosHint}
                        badgeText={xBadge.text}
                        badgeTone={xBadge.tone}
                        onChange={(val) => onUpdateX('videoReposts', val)}
                      />
                    </>
                  )}

                  {option.key === 'linkedin' && (
                    <>
                      <DeliverableRow
                        id="linkedin-posts"
                        num="01"
                        title="LinkedIn Posts"
                        specs="Long-form copy + 4:5 or 1:1 visual"
                        value={channels.linkedin.postCount}
                        max={40}
                        onChange={(val) => onUpdateLinkedIn('postCount', val)}
                      />
                      <DeliverableRow
                        id="linkedin-carousels"
                        num="02"
                        title="LinkedIn Carousels"
                        specs="PDF document · 6–10 slides"
                        value={channels.linkedin.carouselCount}
                        max={20}
                        onChange={(val) => onUpdateLinkedIn('carouselCount', val)}
                      />
                      <DeliverableRow
                        id="linkedin-reposts"
                        num="03"
                        title="Reel Reposts"
                        specs="Reuse core reels"
                        value={liRepostsClamped}
                        max={videoCount}
                        disabled={videoCount === 0}
                        hint={noVideosHint}
                        badgeText={liBadge.text}
                        badgeTone={liBadge.tone}
                        onChange={(val) => onUpdateLinkedIn('videoReposts', val)}
                      />
                    </>
                  )}

                  {option.key === 'youtube' && (
                    <>
                      <DeliverableRow
                        id="youtube-shorts"
                        num="01"
                        title="YouTube Shorts"
                        specs="Reuse core 9:16 reels"
                        value={ytShortsClamped}
                        max={videoCount}
                        disabled={videoCount === 0}
                        hint={noVideosHint}
                        badgeText={ytBadge.text}
                        badgeTone={ytBadge.tone}
                        onChange={(val) => onUpdateYouTube('shortsCount', val)}
                      />
                      <DeliverableRow
                        id="youtube-landscape"
                        num="02"
                        title="Landscape Videos (16:9)"
                        specs="1920×1080 video + custom thumbnail"
                        value={channels.youtube.landscapeCount}
                        max={30}
                        tierUnlocked={youtubeLandscapeTierUnlocked}
                        badgeText={youtubeLandscapeTierUnlocked ? 'Volume Rate' : 'Separate Fee'}
                        badgeTone="amber"
                        onChange={(val) => onUpdateYouTube('landscapeCount', val)}
                      />
                    </>
                  )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

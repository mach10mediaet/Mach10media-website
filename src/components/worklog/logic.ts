import { TimeEntry, TimeEntryPause } from '../../types';

export function sumClosedPauseMs(pauses: TimeEntryPause[]): number {
  return pauses.reduce((total, pause) => {
    if (pause.resumedAt == null) return total;
    return total + Math.max(0, pause.resumedAt - pause.pausedAt);
  }, 0);
}

/**
 * Worked time = (end-or-now − start) − closed pauses − the still-open pause
 * segment. Never negative.
 */
export function computeWorkedMs(entry: TimeEntry, pauses: TimeEntryPause[], now: number): number {
  const endOrNow = entry.endTime ?? now;
  let worked = Math.max(0, endOrNow - entry.startTime);
  worked -= sumClosedPauseMs(pauses);
  const openPause = pauses.find((pause) => pause.resumedAt == null);
  if (openPause) worked -= Math.max(0, endOrNow - openPause.pausedAt);
  return Math.max(0, worked);
}

export function approvalTone(status: TimeEntry['approvalStatus']): 'neutral' | 'green' | 'amber' | 'red' {
  switch (status) {
    case 'approved':
      return 'green';
    case 'pending':
      return 'amber';
    case 'rejected':
      return 'red';
    default:
      return 'neutral';
  }
}

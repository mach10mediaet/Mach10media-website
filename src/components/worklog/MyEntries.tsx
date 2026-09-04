import { useEffect, useMemo, useState } from 'react';
import { limit, onSnapshot, query, where, collection } from 'firebase/firestore';
import { MemberProfile, TimeEntry } from '../../types';
import { db } from '../../firebase';
import { formatClock, formatDayLabel, formatDurationMinutes } from '../../utils/time';
import { approvalTone } from './logic';
import { Badge, EmptyState, inputClass, SectionHeader } from './shared';

interface MyEntriesProps {
  profile: MemberProfile;
}

export default function MyEntries({ profile }: MyEntriesProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [fromKey, setFromKey] = useState('');
  const [toKey, setToKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ownQuery = query(collection(db, 'time_entries'), where('userId', '==', profile.email), limit(200));
    const unsubscribe = onSnapshot(ownQuery, (snapshot) => {
      const loaded: TimeEntry[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...(docSnap.data() as Omit<TimeEntry, 'id'>) });
      });
      loaded.sort((first, second) => second.startTime - first.startTime);
      setEntries(loaded);
    }, (err) => {
      setError(err.message || 'Could not load your entries.');
    });
    return () => unsubscribe();
  }, [profile.email]);

  const filtered = useMemo(
    () =>
      entries.filter((entry) => {
        if (fromKey && entry.entryDate < fromKey) return false;
        if (toKey && entry.entryDate > toKey) return false;
        return true;
      }),
    [entries, fromKey, toKey]
  );

  const countedMinutes = filtered.reduce(
    (total, entry) =>
      entry.status === 'completed' && (entry.approvalStatus === 'not_required' || entry.approvalStatus === 'approved') && entry.durationMinutes != null
        ? total + entry.durationMinutes
        : total,
    0
  );

  return (
    <section className="space-y-6">
      <SectionHeader
        title="My Entries"
        subtitle={`${filtered.length} record${filtered.length === 1 ? '' : 's'} · ${formatDurationMinutes(countedMinutes)} counted`}
      />

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-4 py-3 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-white/5 bg-[#090909]/60 p-4">
        <div className="space-y-1.5">
          <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">From</label>
          <input type="date" value={fromKey} onChange={(e) => setFromKey(e.target.value)} className={inputClass} id="my-entries-from" />
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">To</label>
          <input type="date" value={toKey} onChange={(e) => setToKey(e.target.value)} className={inputClass} id="my-entries-to" />
        </div>
        {(fromKey || toKey) && (
          <button
            onClick={() => { setFromKey(''); setToKey(''); }}
            className="border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No entries in this range yet" />
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/5 bg-[#090909]/60 p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-sans text-sm font-semibold text-white">{formatDayLabel(entry.entryDate)}</p>
                  {entry.entryMethod === 'timer' ? <Badge tone="blue">Timer</Badge> : <Badge tone="neutral">Manual</Badge>}
                  {entry.isLateSubmission && <Badge tone="amber">Late</Badge>}
                  <Badge tone={approvalTone(entry.approvalStatus)}>{entry.approvalStatus.replace('_', ' ')}</Badge>
                  {entry.status === 'running' && <Badge tone="green">Running now</Badge>}
                  {entry.status === 'paused' && <Badge tone="amber">Paused</Badge>}
                </div>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  {formatClock(entry.startTime)}–{entry.endTime ? formatClock(entry.endTime) : 'ongoing'} EAT
                  · {entry.durationMinutes != null ? formatDurationMinutes(entry.durationMinutes) : '—'}
                </p>
                <p className="mt-1 font-sans text-xs text-neutral-300">
                  {entry.clientName || 'Unassigned client'} · {entry.workTypeName || 'Unassigned work type'}
                  {entry.notes ? ` — "${entry.notes}"` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

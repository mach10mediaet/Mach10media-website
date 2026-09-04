import { useEffect, useState } from 'react';
import { limit, onSnapshot, query, where, collection } from 'firebase/firestore';
import { TeamMember, TimeEntry } from '../../types';
import { db } from '../../firebase';
import { formatClock } from '../../utils/time';
import { Badge, EmptyState, SectionHeader } from './shared';

interface TeamStatusProps {
  members: TeamMember[];
}

export default function TeamStatus({ members }: TeamStatusProps) {
  const [activeEntries, setActiveEntries] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Live entries only — the rules allow listing non-completed entries to any member.
  useEffect(() => {
    const liveQuery = query(collection(db, 'time_entries'), where('status', '!=', 'completed'), limit(50));
    const unsubscribe = onSnapshot(liveQuery, (snapshot) => {
      const loaded: TimeEntry[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...(docSnap.data() as Omit<TimeEntry, 'id'>) });
      });
      setActiveEntries(loaded);
    }, (err) => {
      setError(err.message || 'Could not load live team status.');
    });
    return () => unsubscribe();
  }, []);

  const entryByUser = new Map(activeEntries.map((entry) => [entry.userId, entry]));
  const roster = members.filter((member) => member.isActive);

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Team Status"
        subtitle={`${activeEntries.length} active session${activeEntries.length === 1 ? '' : 's'} right now`}
      />

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-4 py-3 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      {roster.length === 0 ? (
        <EmptyState message="No team members registered yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {roster.map((member) => {
            const entry = entryByUser.get(member.id);
            const state = !entry ? 'off' : entry.status;
            return (
              <div key={member.id} className="rounded-lg border border-white/5 bg-[#090909]/60 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-sans text-sm font-semibold text-white truncate">{member.fullName}</p>
                  {state === 'running' && <Badge tone="green">Running</Badge>}
                  {state === 'paused' && <Badge tone="amber">Paused</Badge>}
                  {state === 'off' && <Badge tone="neutral">Off</Badge>}
                </div>
                <p className="mt-2 font-sans text-xs text-neutral-300 truncate">
                  {entry
                    ? `${entry.clientName || 'Unassigned client'} · ${entry.workTypeName || 'Unassigned work type'}`
                    : 'No active session'}
                </p>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-neutral-600">
                  {entry ? `Started ${formatClock(entry.startTime)} EAT` : 'Idle'}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

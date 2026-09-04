import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { collection, doc, limit, onSnapshot, query, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import { MemberProfile, TimeEntry } from '../../types';
import { db } from '../../firebase';
import { formatClock, formatDayLabel, formatDurationMinutes } from '../../utils/time';
import { approvalTone } from './logic';
import { Badge, ConfirmDialog, EmptyState, SectionHeader } from './shared';

interface ApprovalsListProps {
  profile: MemberProfile;
  onNotice: (message: string) => void;
}

export default function ApprovalsList({ profile, onNotice }: ApprovalsListProps) {
  const [pending, setPending] = useState<TimeEntry[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TimeEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pending entries by anyone; the submitter's own entries are filtered out —
  // only peers (never the author) can resolve a late entry.
  useEffect(() => {
    const pendingQuery = query(
      collection(db, 'time_entries'),
      where('approvalStatus', '==', 'pending'),
      limit(100)
    );
    const unsubscribe = onSnapshot(pendingQuery, (snapshot) => {
      const loaded: TimeEntry[] = [];
      snapshot.forEach((docSnap) => {
        const entry = { id: docSnap.id, ...(docSnap.data() as Omit<TimeEntry, 'id'>) };
        if (entry.userId !== profile.email) loaded.push(entry);
      });
      loaded.sort((first, second) => first.startTime - second.startTime);
      setPending(loaded);
    }, (err) => {
      setError(err.message || 'Could not load pending approvals.');
    });
    return () => unsubscribe();
  }, [profile.email]);

  const resolve = async (entry: TimeEntry, decision: 'approved' | 'rejected') => {
    setBusyId(entry.id);
    setError(null);
    try {
      await updateDoc(doc(db, 'time_entries', entry.id), {
        approvalStatus: decision,
        approvedBy: profile.email,
        approvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onNotice(decision === 'approved' ? `Approved ${entry.userName}'s entry.` : `Rejected ${entry.userName}'s entry.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the entry.');
    } finally {
      setBusyId(null);
      setRejectTarget(null);
    }
  };

  return (
    <section className="space-y-6">
      <SectionHeader title="Approvals" subtitle="Late entries submitted by other team members" />

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-4 py-3 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      {pending.length === 0 ? (
        <EmptyState message="Nothing pending — all late entries are resolved" />
      ) : (
        <div className="space-y-3">
          {pending.map((entry) => (
            <div key={entry.id} className="rounded-lg border border-white/5 bg-[#090909]/60 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-sans text-sm font-semibold text-white">{entry.userName}</p>
                    <Badge tone="amber">Late submission</Badge>
                    <Badge tone={approvalTone(entry.approvalStatus)}>{entry.approvalStatus.replace('_', ' ')}</Badge>
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                    {formatDayLabel(entry.entryDate)} · {formatClock(entry.startTime)}–{entry.endTime ? formatClock(entry.endTime) : '?'} EAT
                    · {entry.durationMinutes != null ? formatDurationMinutes(entry.durationMinutes) : '—'}
                  </p>
                  <p className="mt-1 font-sans text-xs text-neutral-300">
                    {entry.clientName || 'Unassigned client'} · {entry.workTypeName || 'Unassigned work type'}
                    {entry.notes ? ` — "${entry.notes}"` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => resolve(entry, 'approved')}
                    disabled={busyId === entry.id}
                    className="flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-emerald-300 hover:bg-emerald-500 hover:text-black transition-colors disabled:opacity-50"
                    id={`approve-btn-${entry.id}`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => setRejectTarget(entry)}
                    disabled={busyId === entry.id}
                    className="flex items-center gap-1.5 border border-red-500/30 bg-red-950/20 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-red-300 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
                    id={`reject-btn-${entry.id}`}
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <ConfirmDialog
          title="Reject this entry?"
          body={`${rejectTarget.userName}'s entry for ${formatDayLabel(rejectTarget.entryDate)} will stay visible to them but will not count toward reports until resubmitted and approved.`}
          confirmLabel="Reject Entry"
          busy={busyId === rejectTarget.id}
          onConfirm={() => resolve(rejectTarget, 'rejected')}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </section>
  );
}

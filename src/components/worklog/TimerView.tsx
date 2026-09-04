import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Square, Timer as TimerIcon } from 'lucide-react';
import { doc, limit, onSnapshot, query, updateDoc, where, addDoc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { MemberProfile, TimeEntry, TimeEntryPause, WorkCategory } from '../../types';
import { db } from '../../firebase';
import { eatDateKey, formatClock, formatDuration, formatDurationMinutes, todayKey } from '../../utils/time';
import { computeWorkedMs } from './logic';
import { Badge, EmptyState, FieldLabel, inputClass, SectionHeader, useNow } from './shared';

interface TimerViewProps {
  profile: MemberProfile;
  clients: WorkCategory[];
  workTypes: WorkCategory[];
  onNotice: (message: string) => void;
}

export default function TimerView({ profile, clients, workTypes, onNotice }: TimerViewProps) {
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [pauses, setPauses] = useState<TimeEntryPause[]>([]);
  const [todayMinutes, setTodayMinutes] = useState<number | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAssigningOnStop, setIsAssigningOnStop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const notesServerRef = useRef('');

  const now = useNow(Boolean(activeEntry));

  // Live listeners for the signed-in member's own entries (no composite index needed:
  // single-field equality query, completed entries filtered out client-side).
  useEffect(() => {
    const ownQuery = query(
      collection(db, 'time_entries'),
      where('userId', '==', profile.email),
      limit(30)
    );
    const unsubscribe = onSnapshot(ownQuery, (snapshot) => {
      const active: TimeEntry[] = [];
      let completedToday = 0;
      const today = todayKey();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<TimeEntry, 'id'>;
        const entry: TimeEntry = { id: docSnap.id, ...data };
        if (entry.status !== 'completed') {
          active.push(entry);
        } else if (entry.entryDate === today && entry.durationMinutes != null) {
          completedToday += entry.durationMinutes;
        }
      });
      active.sort((first, second) => second.startTime - first.startTime);
      setActiveEntry(active[0] || null);
      setTodayMinutes(completedToday);
      // Adopt remote note changes unless the local draft still holds the previous
      // remote value (i.e. the user hasn't typed anything unsaved).
      const serverNotes = active[0]?.notes ?? '';
      setNotesDraft((draft) => (draft === notesServerRef.current ? serverNotes : draft));
      notesServerRef.current = serverNotes;
    }, (err) => {
      setError(err.message || 'Could not load your timer state.');
    });
    return () => unsubscribe();
  }, [profile.email]);

  // Pause segments of the active entry, for exact elapsed time.
  useEffect(() => {
    if (!activeEntry) {
      setPauses([]);
      return;
    }
    const pausesQuery = query(collection(db, 'time_entries', activeEntry.id, 'pauses'), limit(50));
    const unsubscribe = onSnapshot(pausesQuery, (snapshot) => {
      const loaded: TimeEntryPause[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({ id: docSnap.id, pausedAt: Number(data.pausedAt) || 0, resumedAt: data.resumedAt == null ? null : Number(data.resumedAt) });
      });
      setPauses(loaded);
    });
    return () => unsubscribe();
  }, [activeEntry?.id]);

  const workedMs = useMemo(
    () => (activeEntry ? computeWorkedMs(activeEntry, pauses, now) : 0),
    [activeEntry, pauses, now]
  );
  const openPause = pauses.find((pause) => pause.resumedAt == null) || null;

  const runWrite = async (action: () => Promise<void>, successMessage: string) => {
    setIsBusy(true);
    setError(null);
    try {
      await action();
      onNotice(successMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Firestore write failed.';
      setError(message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleStart = () => runWrite(async () => {
    await addDoc(collection(db, 'time_entries'), {
      userId: profile.email,
      userName: profile.fullName,
      clientId: '',
      clientName: '',
      workTypeId: '',
      workTypeName: '',
      notes: '',
      startTime: Date.now(),
      endTime: null,
      entryDate: eatDateKey(Date.now()),
      status: 'running',
      entryMethod: 'timer',
      durationMinutes: null,
      isLateSubmission: false,
      approvalStatus: 'not_required',
      approvedBy: null,
      approvedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }, 'Timer started.');

  const handlePause = () => {
    if (!activeEntry) return;
    return runWrite(async () => {
      const batch = writeBatch(db);
      batch.update(doc(db, 'time_entries', activeEntry.id), { status: 'paused', updatedAt: serverTimestamp() });
      batch.set(doc(collection(db, 'time_entries', activeEntry.id, 'pauses')), {
        pausedAt: Date.now(),
        resumedAt: null
      });
      await batch.commit();
    }, 'Timer paused.');
  };

  const handleResume = () => {
    if (!activeEntry || !openPause) return;
    return runWrite(async () => {
      const batch = writeBatch(db);
      batch.update(doc(db, 'time_entries', activeEntry.id), { status: 'running', updatedAt: serverTimestamp() });
      batch.update(doc(db, 'time_entries', activeEntry.id, 'pauses', openPause.id), { resumedAt: Date.now() });
      await batch.commit();
    }, 'Timer resumed.');
  };

  const completeStop = () => {
    if (!activeEntry) return;
    return runWrite(async () => {
      const endTime = Date.now();
      const batch = writeBatch(db);
      if (openPause) {
        batch.update(doc(db, 'time_entries', activeEntry.id, 'pauses', openPause.id), { resumedAt: endTime });
      }
      batch.update(doc(db, 'time_entries', activeEntry.id), {
        status: 'completed',
        endTime,
        durationMinutes: Math.round(computeWorkedMs(activeEntry, pauses, endTime) / 60000),
        updatedAt: serverTimestamp()
      });
      await batch.commit();
      setIsAssigningOnStop(false);
    }, 'Session logged.');
  };

  const handleStop = () => {
    if (!activeEntry) return;
    if (!activeEntry.clientId || !activeEntry.workTypeId) {
      setIsAssigningOnStop(true);
      return;
    }
    completeStop();
  };

  const handleAssignmentChange = (field: 'clientId' | 'workTypeId' | 'notes', value: string) => {
    if (!activeEntry) return;
    return runWrite(async () => {
      const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (field === 'clientId') {
        patch.clientId = value;
        patch.clientName = clients.find((c) => c.id === value)?.name || '';
      } else if (field === 'workTypeId') {
        patch.workTypeId = value;
        patch.workTypeName = workTypes.find((t) => t.id === value)?.name || '';
      } else {
        patch.notes = value;
      }
      await updateDoc(doc(db, 'time_entries', activeEntry.id), patch);
    }, 'Session updated.');
  };

  const activeClients = clients.filter((c) => c.isActive);
  const activeWorkTypes = workTypes.filter((t) => t.isActive);
  const stateBadge = !activeEntry
    ? <Badge tone="neutral">Off</Badge>
    : activeEntry.status === 'running'
      ? <Badge tone="green">Running</Badge>
      : <Badge tone="amber">Paused</Badge>;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Time Tracker"
        subtitle={`Signed in as ${profile.fullName} — one session at a time`}
        actions={<div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Logged today: <span className="text-white">{todayMinutes == null ? '…' : formatDurationMinutes(todayMinutes)}</span></div>}
      />

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-4 py-3 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      {/* Elapsed console */}
      <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <TimerIcon className={`h-4 w-4 ${activeEntry?.status === 'running' ? 'text-[#F9A136] animate-pulse' : 'text-neutral-600'}`} />
          {stateBadge}
        </div>
        <p className="font-mono text-5xl md:text-6xl tracking-tight text-white tabular-nums">
          {activeEntry ? formatDuration(workedMs) : '0:00'}
        </p>
        <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">
          {activeEntry
            ? `Started ${formatClock(activeEntry.startTime)} EAT · pause time excluded`
            : 'No active session'}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {!activeEntry && (
            <button
              onClick={handleStart}
              disabled={isBusy}
              className="flex items-center gap-2 bg-[#f2f2f2] px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-widest text-black hover:bg-[#F9A136] transition-colors disabled:opacity-50"
              id="timer-start-button"
            >
              <Play className="h-4 w-4" />
              <span>Start Timer</span>
            </button>
          )}
          {activeEntry?.status === 'running' && (
            <button
              onClick={handlePause}
              disabled={isBusy}
              className="flex items-center gap-2 border border-white/15 bg-white/5 px-8 py-3.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              id="timer-pause-button"
            >
              <Pause className="h-4 w-4" />
              <span>Pause</span>
            </button>
          )}
          {activeEntry?.status === 'paused' && (
            <button
              onClick={handleResume}
              disabled={isBusy}
              className="flex items-center gap-2 border border-white/15 bg-white/5 px-8 py-3.5 font-mono text-xs uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors disabled:opacity-50"
              id="timer-resume-button"
            >
              <Play className="h-4 w-4" />
              <span>Resume</span>
            </button>
          )}
          {activeEntry && (
            <button
              onClick={handleStop}
              disabled={isBusy}
              className="flex items-center gap-2 border border-red-500/30 bg-red-950/20 px-8 py-3.5 font-mono text-xs uppercase tracking-widest text-red-300 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50"
              id="timer-stop-button"
            >
              <Square className="h-4 w-4" />
              <span>Stop &amp; Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Session categorization */}
      {activeEntry ? (
        <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Client</FieldLabel>
              <select
                value={activeEntry.clientId}
                onChange={(e) => handleAssignmentChange('clientId', e.target.value)}
                className={inputClass}
                id="timer-client-select"
              >
                <option value="">— Assign later —</option>
                {activeClients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Work Type</FieldLabel>
              <select
                value={activeEntry.workTypeId}
                onChange={(e) => handleAssignmentChange('workTypeId', e.target.value)}
                className={inputClass}
                id="timer-worktype-select"
              >
                <option value="">— Assign later —</option>
                {activeWorkTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Note (optional)</FieldLabel>
            <input
              type="text"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              onBlur={() => {
                if (activeEntry && notesDraft !== activeEntry.notes) {
                  handleAssignmentChange('notes', notesDraft);
                }
              }}
              placeholder="What are you working on?"
              className={inputClass}
              id="timer-notes-input"
            />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-600">
            Client and work type are required before the session can be logged.
          </p>
        </div>
      ) : (
        <EmptyState message="Start the timer when work begins — categorize now or at stop" />
      )}

      {/* Stop-with-unassigned-session prompt */}
      {isAssigningOnStop && activeEntry && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#0b0b0b] p-6 shadow-2xl">
            <h2 className="font-sans text-lg text-white">Categorize session before logging</h2>
            <p className="mt-2 text-sm text-neutral-400">
              This session has no {(!activeEntry.clientId && !activeEntry.workTypeId) ? 'client or work type' : !activeEntry.clientId ? 'client' : 'work type'} assigned.
            </p>
            <div className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <FieldLabel>Client</FieldLabel>
                <select value={activeEntry.clientId} onChange={(e) => handleAssignmentChange('clientId', e.target.value)} className={inputClass}>
                  <option value="">— Select client —</option>
                  {activeClients.map((client) => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <FieldLabel>Work Type</FieldLabel>
                <select value={activeEntry.workTypeId} onChange={(e) => handleAssignmentChange('workTypeId', e.target.value)} className={inputClass}>
                  <option value="">— Select work type —</option>
                  {activeWorkTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsAssigningOnStop(false)}
                className="border border-white/10 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white"
              >
                Keep Working
              </button>
              <button
                onClick={completeStop}
                disabled={isBusy || !activeEntry.clientId || !activeEntry.workTypeId}
                className="border border-red-500/30 bg-red-950/30 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-red-300 hover:bg-red-500 hover:text-white disabled:opacity-50"
              >
                {isBusy ? 'Logging...' : 'Log Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

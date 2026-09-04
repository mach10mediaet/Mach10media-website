import { useState } from 'react';
import { CalendarClock, Clock3, Plus } from 'lucide-react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { MemberProfile, WorkCategory } from '../../types';
import { db } from '../../firebase';
import { isLateEntryDate, startOfDayMs, todayKey } from '../../utils/time';
import { Badge, FieldLabel, inputClass, SectionHeader } from './shared';

interface ManualEntryFormProps {
  profile: MemberProfile;
  clients: WorkCategory[];
  workTypes: WorkCategory[];
  onNotice: (message: string) => void;
}

const TIME_MS = /^\d{2}:\d{2}$/;

function wallClockToMs(value: string): number | null {
  if (!TIME_MS.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 3600000 + minutes * 60000;
}

export default function ManualEntryForm({ profile, clients, workTypes, onNotice }: ManualEntryFormProps) {
  const [dateKey, setDateKey] = useState(todayKey());
  const [startClock, setStartClock] = useState('09:00');
  const [endClock, setEndClock] = useState('17:00');
  const [clientId, setClientId] = useState('');
  const [workTypeId, setWorkTypeId] = useState('');
  const [notes, setNotes] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLate = isLateEntryDate(dateKey);

  const handleSubmit = async () => {
    setError(null);
    const startOfDay = startOfDayMs(dateKey);
    const startOffset = wallClockToMs(startClock);
    const endOffset = wallClockToMs(endClock);

    if (!dateKey || startOffset == null || endOffset == null) {
      setError('Provide a valid date and HH:MM start/end times.');
      return;
    }
    if (endOffset <= startOffset) {
      setError('End time must be after start time.');
      return;
    }
    if (!clientId || !workTypeId) {
      setError('Select both a client and a work type.');
      return;
    }

    const startTime = startOfDay + startOffset;
    const endTime = startOfDay + endOffset;
    const durationMinutes = Math.round((endTime - startTime) / 60000);
    if (durationMinutes > 1440) {
      setError('A single entry cannot exceed 24 hours.');
      return;
    }

    setIsBusy(true);
    try {
      await addDoc(collection(db, 'time_entries'), {
        userId: profile.email,
        userName: profile.fullName,
        clientId,
        clientName: clients.find((c) => c.id === clientId)?.name || '',
        workTypeId,
        workTypeName: workTypes.find((t) => t.id === workTypeId)?.name || '',
        notes: notes.slice(0, 500),
        startTime,
        endTime,
        entryDate: dateKey,
        status: 'completed',
        entryMethod: 'manual',
        durationMinutes,
        isLateSubmission: isLate,
        approvalStatus: isLate ? 'pending' : 'not_required',
        approvedBy: null,
        approvedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      onNotice(isLate ? 'Entry saved — awaiting peer approval.' : 'Entry logged.');
      setNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the entry.');
    } finally {
      setIsBusy(false);
    }
  };

  const activeClients = clients.filter((c) => c.isActive);
  const activeWorkTypes = workTypes.filter((t) => t.isActive);

  return (
    <section className="space-y-6">
      <SectionHeader title="Missed Work" subtitle="Log sessions that were not tracked live" />

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-4 py-3 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      {isLate && (
        <div className="rounded-lg border border-[#F9A136]/25 bg-[#F9A136]/10 px-4 py-3 text-sm text-[#f7d6a0]">
          This date is older than yesterday — the entry will be flagged as a late submission and needs approval from
          another team member before it counts in reports.
        </div>
      )}

      <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-1.5">
            <FieldLabel>Date worked</FieldLabel>
            <input type="date" value={dateKey} max={todayKey()} onChange={(e) => setDateKey(e.target.value)} className={inputClass} id="manual-date-input" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Start time (EAT)</FieldLabel>
            <input type="time" value={startClock} onChange={(e) => setStartClock(e.target.value)} className={inputClass} id="manual-start-input" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>End time (EAT)</FieldLabel>
            <input type="time" value={endClock} onChange={(e) => setEndClock(e.target.value)} className={inputClass} id="manual-end-input" />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Client</FieldLabel>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={inputClass} id="manual-client-select">
              <option value="">— Select client —</option>
              {activeClients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Work type</FieldLabel>
            <select value={workTypeId} onChange={(e) => setWorkTypeId(e.target.value)} className={inputClass} id="manual-worktype-select">
              <option value="">— Select work type —</option>
              {activeWorkTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Note (optional)</FieldLabel>
          <input type="text" value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder="Short context for this session" className={inputClass} id="manual-notes-input" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-5">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>Duration: {wallClockToMs(startClock) != null && wallClockToMs(endClock) != null && wallClockToMs(endClock)! > wallClockToMs(startClock)!
              ? `${Math.round((wallClockToMs(endClock)! - wallClockToMs(startClock)!) / 60000)} min`
              : '—'}</span>
            {isLate ? <Badge tone="amber">Needs approval</Badge> : <Badge tone="green">Saves directly</Badge>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={isBusy}
            className="flex items-center gap-2 bg-[#f2f2f2] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-black hover:bg-[#F9A136] transition-colors disabled:opacity-50"
            id="manual-submit-button"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isBusy ? 'Saving...' : 'Log Missed Work'}</span>
          </button>
        </div>
      </div>

      <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-neutral-600">
        <Clock3 className="h-3 w-3" />
        Today and yesterday save instantly; anything older requires peer approval.
      </p>
    </section>
  );
}

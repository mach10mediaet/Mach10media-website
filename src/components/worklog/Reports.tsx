import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { limit, onSnapshot, query, where, collection } from 'firebase/firestore';
import { MemberProfile, TeamMember, TimeEntry, WorkCategory } from '../../types';
import { db } from '../../firebase';
import { downloadCsv } from '../../utils/csv';
import {
  eatDateKey,
  formatClock,
  formatDayLabel,
  formatDurationMinutes,
  monthRangeKeys,
  shiftDateKey,
  startOfDayMs,
  todayKey,
  weekRangeKeys
} from '../../utils/time';
import { EmptyState, inputClass, SectionHeader } from './shared';

interface ReportsProps {
  profile: MemberProfile;
  members: TeamMember[];
  clients: WorkCategory[];
  workTypes: WorkCategory[];
  isAdminRole: boolean;
}

type ReportMode = 'daily' | 'weekly' | 'monthly';

function shiftMonthKey(key: string, delta: number): string {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7)) - 1 + delta;
  const shifted = new Date(Date.UTC(year, month, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

function countInto(map: Map<string, number>, key: string, minutes: number) {
  map.set(key, (map.get(key) || 0) + minutes);
}

export default function Reports({ profile, members, clients, workTypes, isAdminRole }: ReportsProps) {
  const [mode, setMode] = useState<ReportMode>('weekly');
  const [anchorKey, setAnchorKey] = useState(todayKey());
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [allEntries, setAllEntries] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Single-field equality queries (no composite index required); date-range and
    // approval filtering happen client-side — trivial at team scale.
    const baseQuery = isAdminRole
      ? query(collection(db, 'time_entries'), where('status', '==', 'completed'), limit(1000))
      : query(collection(db, 'time_entries'), where('userId', '==', profile.email), limit(1000));
    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const loaded: TimeEntry[] = [];
      snapshot.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...(docSnap.data() as Omit<TimeEntry, 'id'>) });
      });
      setAllEntries(loaded);
    }, (err) => {
      setError(err.message || 'Could not load report data.');
    });
    return () => unsubscribe();
  }, [isAdminRole, profile.email]);

  const [fromKey, toKey] = useMemo(() => {
    if (mode === 'daily') return [anchorKey, anchorKey];
    if (mode === 'weekly') return weekRangeKeys(anchorKey);
    return monthRangeKeys(anchorKey);
  }, [mode, anchorKey]);

  const rows = useMemo(
    () =>
      allEntries
        .filter((entry) => {
          if (entry.status !== 'completed') return false;
          if (entry.approvalStatus !== 'not_required' && entry.approvalStatus !== 'approved') return false;
          if (entry.entryDate < fromKey || entry.entryDate > toKey) return false;
          if (employeeFilter && entry.userId !== employeeFilter) return false;
          if (clientFilter && entry.clientId !== clientFilter) return false;
          if (workTypeFilter && entry.workTypeId !== workTypeFilter) return false;
          return true;
        })
        .sort((first, second) => first.startTime - second.startTime),
    [allEntries, fromKey, toKey, employeeFilter, clientFilter, workTypeFilter]
  );

  const totalMinutes = rows.reduce((total, entry) => total + (entry.durationMinutes || 0), 0);

  const byEmployee = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((entry) => countInto(map, entry.userName || entry.userId, entry.durationMinutes || 0));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const byClient = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((entry) => countInto(map, entry.clientName || 'Unassigned', entry.durationMinutes || 0));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const byWorkType = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((entry) => countInto(map, entry.workTypeName || 'Unassigned', entry.durationMinutes || 0));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const shiftAnchor = (direction: 1 | -1) => {
    if (mode === 'daily') setAnchorKey(shiftDateKey(anchorKey, direction));
    else if (mode === 'weekly') setAnchorKey(shiftDateKey(anchorKey, direction * 7));
    else setAnchorKey(shiftMonthKey(anchorKey, direction));
  };

  const handleExport = () => {
    const header = ['Employee', 'Date', 'Client', 'Work Type', 'Start (EAT)', 'End (EAT)', 'Duration (min)', 'Notes', 'Entry Method', 'Late Submission'];
    const body = rows.map((entry) => [
      entry.userName || entry.userId,
      entry.entryDate,
      entry.clientName || 'Unassigned',
      entry.workTypeName || 'Unassigned',
      formatClock(entry.startTime),
      entry.endTime != null ? formatClock(entry.endTime) : '',
      entry.durationMinutes ?? '',
      entry.notes,
      entry.entryMethod,
      entry.isLateSubmission ? 'yes' : 'no'
    ]);
    downloadCsv(`mach10-worklog_${fromKey}_to_${toKey}.csv`, [header, ...body]);
  };

  const rangeLabel =
    mode === 'daily'
      ? formatDayLabel(fromKey)
      : `${formatDayLabel(fromKey)} → ${formatDayLabel(toKey)}`;

  return (
    <section className="space-y-6">
      <SectionHeader
        title="Reports"
        subtitle={`Completed + approved work only · ${rangeLabel}`}
        actions={
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className="flex items-center gap-2 border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-[10px] tracking-widest text-white uppercase hover:bg-white hover:text-black transition-all disabled:opacity-40"
            id="reports-csv-button"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-4 py-3 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-white/5 bg-[#090909]/60 p-4">
        <div className="space-y-1.5">
          <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">View</label>
          <div className="flex rounded border border-white/10 overflow-hidden">
            {(['daily', 'weekly', 'monthly'] as ReportMode[]).map((option) => (
              <button
                key={option}
                onClick={() => setMode(option)}
                className={`px-4 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  mode === option ? 'bg-[#f2f2f2] text-black font-medium' : 'bg-transparent text-neutral-400 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">Anchor date</label>
          <div className="flex items-center gap-1">
            <button onClick={() => shiftAnchor(-1)} className="border border-white/10 p-2 text-neutral-400 hover:text-white" aria-label="Previous period">
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <input type="date" value={anchorKey} max={todayKey()} onChange={(e) => setAnchorKey(e.target.value || todayKey())} className={inputClass} id="reports-anchor-date" />
            <button
              onClick={() => shiftAnchor(1)}
              disabled={toKey >= todayKey()}
              className="border border-white/10 p-2 text-neutral-400 hover:text-white disabled:opacity-30"
              aria-label="Next period"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {isAdminRole && (
          <div className="space-y-1.5">
            <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">Employee</label>
            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className={inputClass} id="reports-employee-filter">
              <option value="">All employees</option>
              {members.filter((m) => m.isActive).map((member) => (
                <option key={member.id} value={member.id}>{member.fullName}</option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">Client</label>
          <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={inputClass}>
            <option value="">All clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">Work type</label>
          <select value={workTypeFilter} onChange={(e) => setWorkTypeFilter(e.target.value)} className={inputClass}>
            <option value="">All work types</option>
            {workTypes.map((type) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">Total counted time</p>
          <p className="mt-1 font-sans text-3xl font-light text-white">{formatDurationMinutes(totalMinutes)}</p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
          {rows.length} entr{rows.length === 1 ? 'y' : 'ies'}
        </p>
      </div>

      {/* Breakdowns */}
      {rows.length === 0 ? (
        <EmptyState message="No counted entries in this range" />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { title: isAdminRole ? 'By Employee' : 'By Client', data: isAdminRole ? byEmployee : byClient },
            ...(isAdminRole ? [{ title: 'By Client', data: byClient }] : []),
            { title: 'By Work Type', data: byWorkType }
          ].map((breakdown) => (
            <div key={breakdown.title} className="rounded-lg border border-white/5 bg-[#090909]/60 p-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500 mb-4">{breakdown.title}</p>
              <div className="space-y-2.5">
                {breakdown.data.map(([label, minutes]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <span className="font-sans text-xs text-neutral-300 truncate">{label}</span>
                    <span className="font-mono text-[10px] text-white shrink-0">{formatDurationMinutes(minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-600">
        Times shown in Addis Ababa (EAT) · pending and rejected entries are excluded from totals
      </p>
    </section>
  );
}

import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { MemberProfile, TeamMember } from '../../types';
import { db } from '../../firebase';
import { ConfirmDialog, EmptyState, FieldLabel, inputClass, SectionHeader } from './shared';

interface TeamAdminProps {
  members: TeamMember[];
  profile: MemberProfile;
  onNotice: (message: string) => void;
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function TeamAdmin({ members, profile, onNotice }: TeamAdminProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);

  const handleAdd = async () => {
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!fullName.trim()) {
      setError('Enter the member\'s full name.');
      return;
    }
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Enter a valid email address — it must match their Google account.');
      return;
    }
    if (members.some((member) => member.id === normalizedEmail)) {
      setError('That email is already registered.');
      return;
    }

    setIsBusy(true);
    try {
      // setDoc keyed by email — an existing doc would fail the rules' update path, never overwrite.
      await setDoc(doc(db, 'team_members', normalizedEmail), {
        fullName: fullName.trim(),
        role,
        isActive: true,
        createdAt: serverTimestamp()
      });
      onNotice(`${fullName.trim()} added to the team.`);
      setFullName('');
      setEmail('');
      setRole('employee');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the member.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    setError(null);
    try {
      await updateDoc(doc(db, 'team_members', member.id), { isActive: !member.isActive });
      onNotice(`${member.fullName} ${member.isActive ? 'deactivated' : 'reactivated'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the member.');
    }
  };

  const handleRoleChange = async (member: TeamMember, nextRole: 'admin' | 'employee') => {
    setError(null);
    try {
      await updateDoc(doc(db, 'team_members', member.id), { role: nextRole });
      onNotice(`${member.fullName} is now ${nextRole === 'admin' ? 'an admin' : 'an employee'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the member.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    try {
      await deleteDoc(doc(db, 'team_members', deleteTarget.id));
      onNotice(`${deleteTarget.fullName} removed from the team.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the member.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <section className="space-y-6">
      <SectionHeader title="Team" subtitle="Pre-register the Google accounts that can use the work-log" />

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-4 py-3 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      {/* Add member */}
      <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-[1.2fr_1.4fr_0.8fr]">
          <div className="space-y-1.5">
            <FieldLabel>Full name</FieldLabel>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Yoseph Habte" className={inputClass} id="team-add-name" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Google email</FieldLabel>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@gmail.com" className={inputClass} id="team-add-email" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Role</FieldLabel>
            <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'employee')} className={inputClass} id="team-add-role">
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            disabled={isBusy}
            className="flex items-center gap-2 bg-[#f2f2f2] px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-black hover:bg-[#F9A136] transition-colors disabled:opacity-50"
            id="team-add-button"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{isBusy ? 'Adding...' : 'Add Member'}</span>
          </button>
        </div>
      </div>

      {/* Roster */}
      {members.length === 0 ? (
        <EmptyState message="No members registered yet — add the team above" />
      ) : (
        <div className="space-y-3">
          {members
            .slice()
            .sort((first, second) => first.fullName.localeCompare(second.fullName))
            .map((member) => (
              <div key={member.id} className="rounded-lg border border-white/5 bg-[#090909]/60 p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-sans text-sm font-semibold text-white">{member.fullName}</p>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${member.role === 'admin' ? 'border-sky-500/25 bg-sky-500/10 text-sky-300' : 'border-white/10 bg-white/5 text-neutral-300'}`}>
                      {member.role}
                    </span>
                    {!member.isActive && (
                      <span className="inline-flex items-center rounded-full border border-red-500/25 bg-red-950/20 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">
                        deactivated
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-neutral-500 truncate">{member.id}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value as 'admin' | 'employee')}
                    disabled={member.id === profile.email}
                    className="border border-white/10 bg-black/50 px-2.5 py-1.5 text-[10px] text-white font-mono focus:outline-none disabled:opacity-40"
                    title={member.id === profile.email ? 'You cannot change your own role' : 'Change role'}
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => handleToggleActive(member)}
                    disabled={member.id === profile.email}
                    className="border border-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-400 hover:text-white disabled:opacity-40"
                    title={member.id === profile.email ? 'You cannot deactivate yourself' : member.isActive ? 'Deactivate access' : 'Reactivate access'}
                  >
                    {member.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(member)}
                    disabled={member.id === profile.email}
                    className="flex h-8 w-8 items-center justify-center border border-white/5 text-neutral-400 hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
                    title={member.id === profile.email ? 'You cannot remove yourself' : 'Remove member'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Remove team member?"
          body={`${deleteTarget.fullName} (${deleteTarget.id}) will immediately lose work-log access. Their past time entries are kept for reports.`}
          confirmLabel="Remove Member"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}

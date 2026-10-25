import { useState } from 'react';
import { Briefcase, Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { WorkCategory } from '../../types';
import { db } from '../../firebase';
import { ConfirmDialog, EmptyState, inputClass } from './shared';

interface CategoriesAdminProps {
  clients: WorkCategory[];
  workTypes: WorkCategory[];
  onNotice: (message: string) => void;
}

interface CategoryPanelProps {
  title: string;
  subtitle: string;
  icon: 'client' | 'worktype';
  categories: WorkCategory[];
  onNotice: (message: string) => void;
}

function CategoryPanel({ title, subtitle, icon, categories, onNotice }: CategoryPanelProps) {
  const [name, setName] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<WorkCategory | null>(null);
  const collectionName = icon === 'client' ? 'clients' : 'work_types';
  const Icon = icon === 'client' ? Briefcase : Layers;

  const handleAdd = async () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a name.');
      return;
    }
    if (categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('That name already exists.');
      return;
    }
    setIsBusy(true);
    try {
      await addDoc(collection(db, collectionName), { name: trimmed, isActive: true, createdAt: serverTimestamp() });
      onNotice(`"${trimmed}" added.`);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the entry.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleRename = async (category: WorkCategory) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === category.name) {
      setEditingId(null);
      return;
    }
    try {
      await updateDoc(doc(db, collectionName, category.id), { name: trimmed });
      onNotice('Renamed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename.');
    } finally {
      setEditingId(null);
    }
  };

  const handleToggle = async (category: WorkCategory) => {
    try {
      await updateDoc(doc(db, collectionName, category.id), { isActive: !category.isActive });
      onNotice(`"${category.name}" ${category.isActive ? 'deactivated' : 'reactivated'}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, collectionName, deleteTarget.id));
      onNotice(`"${deleteTarget.name}" deleted. Past entries keep their recorded name.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-6 space-y-5">
      <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
        <Icon className="h-4 w-4 text-neutral-400" />
        <div>
          <h2 className="font-sans text-sm font-semibold text-white">{title}</h2>
          <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">{subtitle}</p>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-3 py-2 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder={icon === 'client' ? 'New client name' : 'New work type name'}
          className={inputClass}
        />
        <button
          onClick={handleAdd}
          disabled={isBusy}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center bg-[#f2f2f2] text-black hover:bg-[#F9A136] transition-colors disabled:opacity-50"
          aria-label={`Add ${title}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState message="Nothing here yet" />
      ) : (
        <div className="space-y-2">
          {categories
            .slice()
            .sort((first, second) => first.name.localeCompare(second.name))
            .map((category) => (
              <div key={category.id} className="flex items-center gap-2 rounded border border-white/5 bg-black/40 px-3 py-2.5">
                {editingId === category.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(category); }}
                      className="w-full bg-transparent text-xs text-white font-mono focus:outline-none"
                      autoFocus
                    />
                    <button onClick={() => handleRename(category)} className="text-emerald-400 hover:text-emerald-300 shrink-0" aria-label="Save name">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-neutral-500 hover:text-white shrink-0" aria-label="Cancel rename">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`w-full truncate text-xs font-mono ${category.isActive ? 'text-white' : 'text-neutral-600 line-through'}`}>
                      {category.name}
                    </span>
                    <button
                      onClick={() => { setEditingId(category.id); setEditName(category.name); }}
                      className="text-neutral-500 hover:text-white shrink-0"
                      aria-label={`Rename ${category.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggle(category)}
                      className={`shrink-0 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors ${
                        category.isActive
                          ? 'border-white/10 text-neutral-400 hover:text-white'
                          : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black'
                      }`}
                    >
                      {category.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(category)}
                      className="text-neutral-600 hover:text-red-400 shrink-0"
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.name}"?`}
          body="Old time entries keep the name they were logged with, but this option disappears from all dropdowns immediately. Deactivating instead keeps it for historical reference only."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default function CategoriesAdmin({ clients, workTypes, onNotice }: CategoriesAdminProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="font-sans text-2xl font-light text-white">Categories</h1>
          <p className="font-mono text-[9px] text-[#8c8c8c] tracking-wider uppercase mt-1">Clients and work types for time tracking</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPanel
          title="Clients"
          subtitle="Who the work is for"
          icon="client"
          categories={clients}
          onNotice={onNotice}
        />
        <CategoryPanel
          title="Work Types"
          subtitle="What kind of work it was"
          icon="worktype"
          categories={workTypes}
          onNotice={onNotice}
        />
      </div>
    </section>
  );
}

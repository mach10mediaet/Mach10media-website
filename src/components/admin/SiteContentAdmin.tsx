import { useEffect, useState } from 'react';
import { Plus, Trash2, Quote as QuoteIcon, Image as ImageIcon, Settings2, Pencil, X } from 'lucide-react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { ClientLogo, Testimonial } from '../../types';
import { db } from '../../firebase';
import { ConfirmDialog, EmptyState, FieldLabel, inputClass, SectionHeader } from '../worklog/shared';

interface SiteContentAdminProps {
  onNotice: (message: string) => void;
}

type EditingState =
  | { kind: 'testimonial'; id: string; quote: string; author: string; company: string }
  | { kind: 'logo'; id: string; name: string; logoUrl: string }
  | null;

export default function SiteContentAdmin({ onNotice }: SiteContentAdminProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [clientLogos, setClientLogos] = useState<ClientLogo[]>([]);
  const [bookingUrl, setBookingUrl] = useState('');
  const [instagramEmbedUrl, setInstagramEmbedUrl] = useState('');
  const [bookingUrlDraft, setBookingUrlDraft] = useState('');
  const [instagramDraft, setInstagramDraft] = useState('');
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [newTestimonial, setNewTestimonial] = useState({ quote: '', author: '', company: '' });
  const [newLogo, setNewLogo] = useState({ name: '', logoUrl: '' });
  const [editing, setEditing] = useState<EditingState>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'testimonials' | 'client_logos'; id: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const unsubTestimonials = onSnapshot(query(collection(db, 'testimonials'), orderBy('order', 'asc')), (snapshot) => {
      const loaded: Testimonial[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          quote: typeof data.quote === 'string' ? data.quote : '',
          author: typeof data.author === 'string' ? data.author : '',
          company: typeof data.company === 'string' ? data.company : '',
          order: typeof data.order === 'number' ? data.order : 0,
          isActive: Boolean(data.isActive),
          createdAt: data.createdAt
        });
      });
      setTestimonials(loaded);
    });
    const unsubLogos = onSnapshot(query(collection(db, 'client_logos'), orderBy('order', 'asc')), (snapshot) => {
      const loaded: ClientLogo[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          name: typeof data.name === 'string' ? data.name : '',
          logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : '',
          order: typeof data.order === 'number' ? data.order : 0,
          isActive: Boolean(data.isActive),
          createdAt: data.createdAt
        });
      });
      setClientLogos(loaded);
    });
    const unsubSettings = onSnapshot(doc(db, 'site_settings', 'booking_url'), (snap) => {
      const value = typeof snap.data?.().value === 'string' ? String(snap.data().value) : '';
      setBookingUrl(value);
      setBookingUrlDraft((draft) => (settingsLoaded ? draft : value));
    });
    const unsubInstagram = onSnapshot(doc(db, 'site_settings', 'instagram_embed_url'), (snap) => {
      const value = typeof snap.data?.().value === 'string' ? String(snap.data().value) : '';
      setInstagramEmbedUrl(value);
      setInstagramDraft((draft) => (settingsLoaded ? draft : value));
      setSettingsLoaded(true);
    });
    return () => {
      unsubTestimonials();
      unsubLogos();
      unsubSettings();
      unsubInstagram();
    };
  }, [settingsLoaded]);

  const guard = async (action: () => Promise<void>, notice: string) => {
    setError(null);
    setIsBusy(true);
    try {
      await action();
      onNotice(notice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Firestore write failed.');
    } finally {
      setIsBusy(false);
    }
  };

  const nextOrder = (items: { order: number }[]) => items.reduce((max, item) => Math.max(max, item.order), 0) + 1;

  const handleAddTestimonial = () =>
    guard(async () => {
      await addDoc(collection(db, 'testimonials'), {
        quote: newTestimonial.quote.trim(),
        author: newTestimonial.author.trim(),
        company: newTestimonial.company.trim(),
        order: nextOrder(testimonials),
        isActive: true,
        createdAt: serverTimestamp()
      });
      setNewTestimonial({ quote: '', author: '', company: '' });
    }, 'Testimonial added.');

  const handleAddLogo = () =>
    guard(async () => {
      await addDoc(collection(db, 'client_logos'), {
        name: newLogo.name.trim(),
        logoUrl: newLogo.logoUrl.trim(),
        order: nextOrder(clientLogos),
        isActive: true,
        createdAt: serverTimestamp()
      });
      setNewLogo({ name: '', logoUrl: '' });
    }, 'Client logo added.');

  const handleToggleActive = (kind: 'testimonials' | 'client_logos', id: string, next: boolean) =>
    guard(async () => {
      await updateDoc(doc(db, kind, id), { isActive: next });
    }, next ? 'Entry is now live on the site.' : 'Entry hidden from the site.');

  const handleSaveEdit = () => {
    if (!editing) return;
    if (editing.kind === 'testimonial') {
      return guard(async () => {
        await updateDoc(doc(db, 'testimonials', editing.id), {
          quote: editing.quote.trim(),
          author: editing.author.trim(),
          company: editing.company.trim()
        });
        setEditing(null);
      }, 'Testimonial updated.');
    }
    return guard(async () => {
      await updateDoc(doc(db, 'client_logos', editing.id), {
        name: editing.name.trim(),
        logoUrl: editing.logoUrl.trim()
      });
      setEditing(null);
    }, 'Client logo updated.');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    return guard(async () => {
      await deleteDoc(doc(db, deleteTarget.kind, deleteTarget.id));
    }, `"${deleteTarget.label}" removed.`);
  };

  const handleSaveSettings = (key: 'booking_url' | 'instagram_embed_url', value: string) =>
    guard(async () => {
      await setDoc(doc(db, 'site_settings', key), { value: value.trim(), updatedAt: serverTimestamp() });
    }, 'Setting saved — live on the site immediately.');

  return (
    <section className="space-y-6">
      <SectionHeader title="Site Content" subtitle="Testimonials, client logos, and embed slots shown on the public site" />

      {error && (
        <div className="rounded border border-red-500/20 bg-red-950/20 px-4 py-3 font-mono text-[10px] text-red-300">
          {error}
        </div>
      )}

      {/* Testimonials */}
      <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
          <QuoteIcon className="h-4 w-4 text-neutral-400" />
          <div>
            <h2 className="font-sans text-sm font-semibold text-white">Testimonials</h2>
            <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">Shown in the homepage slider (oldest first by order)</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]">
          <div className="space-y-1.5">
            <FieldLabel>Quote</FieldLabel>
            <input type="text" value={newTestimonial.quote} maxLength={500} onChange={(e) => setNewTestimonial((p) => ({ ...p, quote: e.target.value }))} placeholder="What the client said" className={inputClass} id="new-testimonial-quote" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Author</FieldLabel>
            <input type="text" value={newTestimonial.author} maxLength={80} onChange={(e) => setNewTestimonial((p) => ({ ...p, author: e.target.value }))} placeholder="Full name" className={inputClass} id="new-testimonial-author" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Company</FieldLabel>
            <input type="text" value={newTestimonial.company} maxLength={80} onChange={(e) => setNewTestimonial((p) => ({ ...p, company: e.target.value }))} placeholder="Company" className={inputClass} id="new-testimonial-company" />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddTestimonial}
              disabled={isBusy || !newTestimonial.quote.trim() || !newTestimonial.author.trim()}
              className="flex h-[42px] w-[42px] items-center justify-center bg-[#f2f2f2] text-black hover:bg-[#F9A136] transition-colors disabled:opacity-40"
              aria-label="Add testimonial"
              id="add-testimonial-button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {testimonials.length === 0 ? (
          <EmptyState message="No live testimonials — the homepage uses its built-in fallbacks until you add some" />
        ) : (
          <div className="space-y-2">
            {testimonials.map((entry) => (
              <div key={entry.id} className="rounded border border-white/5 bg-black/40 px-4 py-3">
                {editing?.kind === 'testimonial' && editing.id === entry.id ? (
                  <div className="space-y-2">
                    <input type="text" value={editing.quote} onChange={(e) => setEditing({ ...editing, quote: e.target.value })} className={inputClass} />
                    <div className="flex gap-2">
                      <input type="text" value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} className={inputClass} placeholder="Author" />
                      <input type="text" value={editing.company} onChange={(e) => setEditing({ ...editing, company: e.target.value })} className={inputClass} placeholder="Company" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(null)} className="border border-white/10 px-3 py-1.5 font-mono text-[9px] uppercase text-neutral-400 hover:text-white">Cancel</button>
                      <button onClick={handleSaveEdit} disabled={isBusy} className="border border-emerald-500/30 px-3 py-1.5 font-mono text-[9px] uppercase text-emerald-300 hover:bg-emerald-500 hover:text-black disabled:opacity-40">Save</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-sans text-xs text-neutral-300 italic truncate">"{entry.quote}"</p>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-neutral-500">{entry.author} — {entry.company}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleToggleActive('testimonials', entry.id, !entry.isActive)} className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider ${entry.isActive ? 'border-white/10 text-neutral-400 hover:text-white' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black'}`}>
                        {entry.isActive ? 'Live' : 'Hidden'}
                      </button>
                      <button onClick={() => setEditing({ kind: 'testimonial', id: entry.id, quote: entry.quote, author: entry.author, company: entry.company })} className="text-neutral-500 hover:text-white" aria-label="Edit testimonial">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget({ kind: 'testimonials', id: entry.id, label: entry.author })} className="text-neutral-600 hover:text-red-400" aria-label="Delete testimonial">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Client logos */}
      <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
          <ImageIcon className="h-4 w-4 text-neutral-400" />
          <div>
            <h2 className="font-sans text-sm font-semibold text-white">Client Logos</h2>
            <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">Logo image URLs are optional — names without a logo show as wordmarks</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto]">
          <div className="space-y-1.5">
            <FieldLabel>Client name</FieldLabel>
            <input type="text" value={newLogo.name} maxLength={40} onChange={(e) => setNewLogo((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. OLIVE & BREAD" className={inputClass} id="new-logo-name" />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Logo image URL (optional)</FieldLabel>
            <input type="text" value={newLogo.logoUrl} maxLength={1000} onChange={(e) => setNewLogo((p) => ({ ...p, logoUrl: e.target.value }))} placeholder="https://…/logo.png" className={inputClass} id="new-logo-url" />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddLogo}
              disabled={isBusy || !newLogo.name.trim()}
              className="flex h-[42px] w-[42px] items-center justify-center bg-[#f2f2f2] text-black hover:bg-[#F9A136] transition-colors disabled:opacity-40"
              aria-label="Add client logo"
              id="add-logo-button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {clientLogos.length === 0 ? (
          <EmptyState message="No live client logos — the homepage marquee uses its built-in fallbacks until you add some" />
        ) : (
          <div className="flex flex-wrap gap-2">
            {clientLogos.map((logo) => (
              <div key={logo.id} className={`flex items-center gap-2 rounded border px-3 py-2 ${logo.isActive ? 'border-white/10 bg-black/40' : 'border-white/5 bg-black/20 opacity-50'}`}>
                {logo.logoUrl ? (
                  <img src={logo.logoUrl} alt={logo.name} className="h-4 w-auto" referrerPolicy="no-referrer" />
                ) : null}
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-300">{logo.name}</span>
                <button onClick={() => handleToggleActive('client_logos', logo.id, !logo.isActive)} className="text-[9px] font-mono uppercase text-neutral-500 hover:text-white">
                  {logo.isActive ? 'Live' : 'Hidden'}
                </button>
                <button onClick={() => setDeleteTarget({ kind: 'client_logos', id: logo.id, label: logo.name })} className="text-neutral-600 hover:text-red-400" aria-label={`Delete ${logo.name}`}>
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
          <Settings2 className="h-4 w-4 text-neutral-400" />
          <div>
            <h2 className="font-sans text-sm font-semibold text-white">Embed Slots</h2>
            <p className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">Optional — the related site sections stay hidden while a slot is empty</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>Booking calendar link (Cal.com / Calendly)</FieldLabel>
            <div className="flex gap-2">
              <input type="url" value={bookingUrlDraft} onChange={(e) => setBookingUrlDraft(e.target.value)} placeholder="https://cal.com/mach10/discovery" className={inputClass} id="booking-url-input" />
              <button
                onClick={() => handleSaveSettings('booking_url', bookingUrlDraft)}
                disabled={isBusy || bookingUrlDraft === bookingUrl}
                className="shrink-0 border border-white/10 px-4 font-mono text-[9px] uppercase tracking-wider text-neutral-300 hover:text-white disabled:opacity-40"
              >
                Save
              </button>
            </div>
            <p className="font-mono text-[9px] text-neutral-600">{bookingUrl ? 'Live — a "Skip the wait" card shows on the contact page.' : 'Empty — hidden.'}</p>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Instagram embed URL (Behold / Elfsight widget)</FieldLabel>
            <div className="flex gap-2">
              <input type="url" value={instagramDraft} onChange={(e) => setInstagramDraft(e.target.value)} placeholder="https://embed.behold.so/…" className={inputClass} id="instagram-embed-input" />
              <button
                onClick={() => handleSaveSettings('instagram_embed_url', instagramDraft)}
                disabled={isBusy || instagramDraft === instagramEmbedUrl}
                className="shrink-0 border border-white/10 px-4 font-mono text-[9px] uppercase tracking-wider text-neutral-300 hover:text-white disabled:opacity-40"
              >
                Save
              </button>
            </div>
            <p className="font-mono text-[9px] text-neutral-600">{instagramEmbedUrl ? 'Live — the homepage shows the embed.' : 'Empty — a plain Instagram call-to-action shows instead.'}</p>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete "${deleteTarget.label}"?`}
          body="This removes the entry from the public site immediately. You can re-add it any time."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}

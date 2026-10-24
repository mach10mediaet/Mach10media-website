import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Reads a key/value display setting from the public `site_settings` collection
 * (managed in the admin "Site Content" tab). Returns '' while loading or unset.
 */
export function useSiteSetting(key: string): string {
  const [value, setValue] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'site_settings', key), (snap) => {
      const data = snap.data();
      setValue(typeof data?.value === 'string' ? data.value : '');
    });
    return () => unsubscribe();
  }, [key]);

  return value;
}

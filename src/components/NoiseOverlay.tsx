import { useEffect, useState } from 'react';

export default function NoiseOverlay() {
  const [enabled, setEnabled] = useState(true);

  return (
    <>
      {enabled && (
        <div 
          className="pointer-events-none fixed inset-0 z-50 opacity-[0.045] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%2523noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
      {/* Film grain texture toggle — studio/dev tooling only, hidden in production builds */}
      {import.meta.env.DEV && (
        <button
          onClick={() => setEnabled(!enabled)}
          className="fixed right-6 bottom-6 z-50 rounded-full border border-white/10 bg-black/60 px-3 py-1 font-mono text-[9px] tracking-widest text-[#8a8a8a] transition-all hover:border-white/30 hover:text-white uppercase"
          id="grain-toggle-button"
        >
          Grain: {enabled ? 'Active' : 'Muted'}
        </button>
      )}
    </>
  );
}

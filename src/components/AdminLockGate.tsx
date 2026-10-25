import React, { useState } from 'react';
import { LockKeyhole, ArrowRight, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminLockGateProps {
  onAuthenticate: () => Promise<void>;
  onClose: () => void;
}

export default function AdminLockGate({ onAuthenticate, onClose }: AdminLockGateProps) {
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    try {
      setIsAuthenticating(true);
      await onAuthenticate();
      setErrorStatus(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.';
      setErrorStatus(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#050505] text-[#f2f2f2] px-6 py-12 z-50 overflow-hidden">
      {/* Background cinematic blur drops */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-white/[0.025] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 relative z-10 text-center">
        {/* Decorative Luxury Brand Header */}
        <div className="space-y-3">
          <span className="font-sans text-xs font-black tracking-[0.4em] text-neutral-500 uppercase block">
            MACH10 MEDIA
          </span>
          <div className="h-0.5 w-12 bg-white/10 mx-auto" />
          <h1 className="font-sans text-2xl font-extralight tracking-tight text-white mt-1">
            Studio Keyhole Access
          </h1>
          <p className="font-mono text-[9px] text-[#a3a3a3] tracking-[0.15em] uppercase">
            TEAM &amp; ADMIN ACCESS &bull; AUTH REQUIRED
          </p>
        </div>

        {/* Lock Console Card */}
        <div className="border border-white/5 bg-[#0b0b0b]/60 p-6 md:p-8 rounded-lg shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center text-neutral-400">
              <LockKeyhole className="h-5 w-5 text-neutral-400" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest block">
                AUTHENTICATION METHOD
              </label>
              <div className="rounded border border-white/10 bg-black/50 px-3 py-3 text-xs text-neutral-300 font-mono">
                VERIFIED GOOGLE SIGN-IN
              </div>
            </div>

            {errorStatus && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 border border-red-500/15 bg-red-950/20 px-3.5 py-2.5 rounded text-left font-mono text-[10px] text-red-400"
              >
                <ShieldAlert className="h-3 w-3 shrink-0" />
                <span>{errorStatus}</span>
              </motion.div>
            )}

            <button
              type="button"
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="w-full select-none flex items-center justify-center gap-2 bg-[#f2f2f2] text-black font-mono text-[10px] uppercase tracking-wider py-3 font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              <span>{isAuthenticating ? 'Connecting...' : 'Sign In With Google'}</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Quick Back to Site Anchor */}
        <div>
          <button
            onClick={onClose}
            className="font-mono text-[9px] text-neutral-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            &larr; Exit to Public Gallery
          </button>
        </div>
      </div>
    </div>
  );
}

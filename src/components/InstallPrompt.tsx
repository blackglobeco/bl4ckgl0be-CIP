'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, Plus } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   OSIRIS — PWA Install Prompt
   • Android/Chrome: captures beforeinstallprompt, shows on every visit
   • iOS Safari: shows manual "Add to Home Screen" guide
   • Shown every session on mobile — no permanent dismiss storage
   ═══════════════════════════════════════════════════════════════ */

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Only run on mobile
    const isMobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobileUA) return;

    // Already installed as PWA (standalone mode) — don't show
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true;
    if (isStandalone) { setIsInstalled(true); return; }

    const iosDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(iosDevice);

    if (iosDevice) {
      // iOS: show after a short delay so the app renders first
      const t = setTimeout(() => setShow(true), 1800);
      return () => clearTimeout(t);
    }

    // Android/Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const t = setTimeout(() => setShow(true), 1800);
      return () => clearTimeout(t);
    };
    window.addEventListener('beforeinstallprompt', handler as any);

    // Fallback: if event never fires (already installed, or not eligible)
    // still show iOS-style manual guide after delay
    const fallback = setTimeout(() => {
      if (!deferredPrompt) setShow(true);
    }, 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
      clearTimeout(fallback);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShow(false);
          setIsInstalled(true);
        }
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    }
  }, [deferredPrompt]);

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="fixed bottom-[60px] left-3 right-3 z-[600] pointer-events-auto"
        >
          <div
            className="glass-panel osiris-glow p-4 flex flex-col gap-3"
            style={{ borderColor: 'rgba(255,255,255,0.22)' }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* App icon */}
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                  <img
                    src="/android-chrome-192x192.png"
                    alt="BLACK GLOBE"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col">
                  <span className="text-[11px] font-mono font-bold tracking-[0.15em] text-[var(--gold-primary)]">
                    BLACK GLOBE
                  </span>
                  <span className="text-[9px] font-mono text-[var(--text-muted)] tracking-[0.1em]">
                    CYBER INTELLIGENCE PLATFORM
                  </span>
                  <span className="text-[8px] font-mono text-[var(--alert-green)] tracking-[0.08em] mt-0.5">
                    INSTALL FOR BEST EXPERIENCE
                  </span>
                </div>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => setShow(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex-shrink-0 p-0.5 mt-0.5"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* iOS instructions */}
            {isIOS ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8">
                  <Share className="w-4 h-4 text-[var(--cyan-primary)] flex-shrink-0" />
                  <span className="text-[10px] font-mono text-[var(--text-primary)]">
                    Tap <span className="text-[var(--cyan-primary)] font-bold">Share</span> in browser
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8">
                  <Plus className="w-4 h-4 text-[var(--cyan-primary)] flex-shrink-0" />
                  <span className="text-[10px] font-mono text-[var(--text-primary)]">
                    Then tap <span className="text-[var(--cyan-primary)] font-bold">Add to Home Screen</span>
                  </span>
                </div>
              </div>
            ) : (
              /* Android / Chrome install button */
              <button
                onClick={handleInstall}
                disabled={installing}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-mono text-[11px] font-bold tracking-[0.15em] transition-all disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff',
                }}
              >
                {installing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {installing ? 'INSTALLING...' : 'INSTALL APP'}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

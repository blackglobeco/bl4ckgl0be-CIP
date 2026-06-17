'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocateFixed, Loader2, X, MapPin } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   OSIRIS — Current Location Button
   Uses browser Geolocation API to fly map to user's position
   ═══════════════════════════════════════════════════════════════ */

interface CurrentLocationButtonProps {
  onLocate: (lat: number, lng: number) => void;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function CurrentLocationButton({ onLocate }: CurrentLocationButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleLocate = useCallback(async () => {
    if (status === 'loading') return;

    if (!navigator.geolocation) {
      setErrorMsg('GEOLOCATION NOT SUPPORTED');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('loading');
    setErrorMsg('');
    setLocationLabel('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        // Fly the map immediately
        onLocate(lat, lng);

        // Reverse geocode for label
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const label =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            data.address?.state ||
            data.address?.country ||
            `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setLocationLabel(label.toUpperCase());
        } catch {
          setLocationLabel(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }

        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          setLocationLabel('');
        }, 4000);
      },
      (err) => {
        let msg = 'LOCATION ACCESS DENIED';
        if (err.code === err.POSITION_UNAVAILABLE) msg = 'POSITION UNAVAILABLE';
        if (err.code === err.TIMEOUT) msg = 'REQUEST TIMED OUT';
        setErrorMsg(msg);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3500);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [status, onLocate]);

  const iconColor =
    status === 'success'
      ? 'text-[var(--alert-green)]'
      : status === 'error'
      ? 'text-[var(--alert-red,#ff4444)]'
      : 'text-[var(--gold-primary)]';

  const borderColor =
    status === 'success'
      ? 'hover:border-[var(--alert-green)]'
      : status === 'error'
      ? 'hover:border-[var(--alert-red,#ff4444)]'
      : 'hover:border-[var(--gold-primary)]';

  return (
    <div className="relative">
      <motion.button
        onClick={handleLocate}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: status === 'loading' ? 1 : 1.1 }}
        whileTap={{ scale: 0.95 }}
        disabled={status === 'loading'}
        className={`glass-panel w-8 h-8 flex items-center justify-center pointer-events-auto transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${borderColor}`}
        title="Locate me"
      >
        {status === 'loading' ? (
          <Loader2 className="w-3.5 h-3.5 text-[var(--gold-primary)] animate-spin" />
        ) : (
          <LocateFixed className={`w-3.5 h-3.5 transition-colors ${iconColor}`} />
        )}
      </motion.button>

      {/* Tooltip / status popup */}
      <AnimatePresence>
        {(showTooltip && status === 'idle') && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-10 right-0 z-[300] glass-panel px-2.5 py-1.5 pointer-events-none whitespace-nowrap"
          >
            <span className="text-[9px] font-mono tracking-[0.12em] text-[var(--text-muted)]">
              MY LOCATION
            </span>
          </motion.div>
        )}

        {status === 'success' && locationLabel && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            className="absolute top-10 right-0 z-[300] glass-panel px-3 py-2 pointer-events-none osiris-glow"
          >
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[var(--alert-green)] flex-shrink-0" />
              <span className="text-[9px] font-mono tracking-[0.1em] text-[var(--alert-green)] whitespace-nowrap max-w-[180px] truncate">
                {locationLabel}
              </span>
            </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            className="absolute top-10 right-0 z-[300] glass-panel px-3 py-2 pointer-events-none border-[var(--alert-red,#ff4444)]"
          >
            <div className="flex items-center gap-1.5">
              <X className="w-3 h-3 text-[var(--alert-red,#ff4444)] flex-shrink-0" />
              <span className="text-[9px] font-mono tracking-[0.1em] text-[var(--alert-red,#ff4444)] whitespace-nowrap">
                {errorMsg}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

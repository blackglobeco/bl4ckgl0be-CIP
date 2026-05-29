'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, RefreshCw, MapPin, Camera, Maximize2 } from 'lucide-react';
import Hls from 'hls.js';

interface CameraViewerProps {
  camera: any | null;
  onClose: () => void;
  onLocate?: (lat: number, lng: number) => void;
}

export default function CameraViewer({ camera, onClose, onLocate }: CameraViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scale state: measures the container and computes how to fit the iframe
  const [scale, setScale] = useState({ x: 1, y: 1 });

  const streamType = camera?.stream_type || 'jpg';
  const externalFeedUrl = camera?.external_url || camera?.feed_url;
  const externalOnly = Boolean(camera?.external_url && !camera?.feed_url && !camera?.stream_url);

  // ── The Blackeye proxy renders at this internal viewport ──────────────────
  // Measured by inspecting bl4ckeye.onrender.com/api/stream responses.
  // The page body has no fixed width — it fills the iframe viewport.
  // So we size the iframe to the container and let the page reflow naturally.
  // No magic numbers needed — the trick is making the iframe fill BOTH
  // width AND height of a fixed-aspect container, then clipping nothing.

  // ── Measure container and set scale for iframe ────────────────────────────
  useEffect(() => {
    if (streamType !== 'iframe' || !containerRef.current) return;

    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      // The iframe will be sized to 100%×100% of this container.
      // We expose the dimensions so the iframe element can be set explicitly.
      setScale({ x: el.offsetWidth, y: el.offsetHeight });
    };

    // Run after first paint so layout is settled
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [streamType, fullscreen, camera]);

  useEffect(() => {
    if (!camera) return;
    setLoading(true);
    setError(false);
    setImageUrl(null);

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (externalOnly) { setLoading(false); return; }

    if (streamType === 'hls' && camera.stream_url) {
      if (Hls.isSupported() && videoRef.current) {
        const hls = new Hls({ enableWorker: false });
        hlsRef.current = hls;
        hls.loadSource(camera.stream_url);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          videoRef.current?.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_e: any, data: any) => { if (data.fatal) setError(true); });
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = camera.stream_url;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setLoading(false);
          videoRef.current?.play().catch(() => {});
        });
      }
      return;
    }

    if (streamType === 'iframe' && camera.stream_url) { setLoading(false); return; }

    if (camera.feed_url) {
      const url = camera.feed_url.includes('?')
        ? `${camera.feed_url}&_t=${Date.now()}`
        : `${camera.feed_url}?_t=${Date.now()}`;
      setImageUrl(url);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [camera, refreshKey, streamType, externalOnly]);

  useEffect(() => {
    if (streamType !== 'jpg' || !camera?.feed_url) return;
    const iv = setInterval(() => setRefreshKey(k => k + 1), 5000);
    return () => clearInterval(iv);
  }, [camera?.feed_url, streamType]);

  if (!camera) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className={`fixed z-[500] ${
          fullscreen
            ? 'inset-2 md:inset-4'
            : 'bottom-[70px] left-2 right-2 md:bottom-6 md:right-6 md:left-auto md:w-[420px]'
        }`}
      >
        <div
          className="glass-panel osiris-glow overflow-hidden h-full flex flex-col"
          style={{ borderColor: 'rgba(57, 255, 20, 0.3)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-[var(--border-secondary)] bg-black/40 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-2 h-2 rounded-full bg-[#39FF14] animate-osiris-pulse flex-shrink-0" />
              <Camera className="w-3.5 h-3.5 text-[#39FF14] flex-shrink-0" />
              <div className="min-w-0">
                <h3 className="text-[10px] md:text-[11px] font-mono font-bold text-[#39FF14] tracking-wider truncate">
                  {camera.name}
                </h3>
                <p className="text-[6px] md:text-[7px] font-mono text-[var(--text-muted)]">
                  {camera.city}, {camera.country} · {camera.source}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {streamType === 'jpg' && (
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="p-1.5 rounded hover:bg-[var(--hover-accent)] transition-colors"
                  title="Refresh feed"
                >
                  <RefreshCw className="w-3 h-3 text-[var(--text-muted)] hover:text-[#39FF14]" />
                </button>
              )}
              {camera.lat && camera.lng && (
                <button
                  onClick={() => onLocate?.(camera.lat, camera.lng)}
                  className="p-1.5 rounded hover:bg-[var(--hover-accent)] transition-colors"
                  title="Fly to location"
                >
                  <MapPin className="w-3 h-3 text-[var(--text-muted)] hover:text-[var(--gold-primary)]" />
                </button>
              )}
              <button
                onClick={() => setFullscreen(f => !f)}
                className="hidden md:block p-1.5 rounded hover:bg-[var(--hover-accent)] transition-colors"
                title="Toggle fullscreen"
              >
                <Maximize2 className="w-3 h-3 text-[var(--text-muted)] hover:text-white" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded hover:bg-red-900/30 transition-colors"
              >
                <X className="w-4 h-4 md:w-3 md:h-3 text-[var(--text-muted)] hover:text-red-400" />
              </button>
            </div>
          </div>

          {/*
            ── Feed container ───────────────────────────────────────────────
            Strategy:
            • For HLS/JPG: classic padding-top 56.25% (16:9) with absolute fill.
            • For IFRAME: fixed aspect-ratio container using `aspect-ratio` CSS.
              The iframe is set to exactly 100%×100% of that container with no
              border and no scrollbars. The Blackeye proxy page itself is a
              simple full-viewport video player — when the iframe viewport is
              set to the container size, the page reflowing naturally fills it.
              No scale() tricks, no fixed pixel sizes — just a properly sized
              iframe viewport.
          */}
          <div
            ref={containerRef}
            className="relative bg-black flex-shrink-0 w-full overflow-hidden"
            style={
              fullscreen
                ? { flex: 1, minHeight: 0 }
                : { aspectRatio: '16 / 9' }
            }
          >
            {/* Loading */}
            {loading && !error && !externalOnly && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-[8px] font-mono text-[#39FF14] tracking-widest">
                    CONNECTING TO FEED...
                  </span>
                </div>
              </div>
            )}

            {externalOnly ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <div className="text-center px-6">
                  <div className="w-8 h-8 rounded-full bg-[#39FF14]/15 flex items-center justify-center mx-auto mb-2">
                    <ExternalLink className="w-4 h-4 text-[#39FF14]" />
                  </div>
                  <span className="text-[9px] font-mono text-[#39FF14] tracking-widest block mb-1">EXTERNAL FEED</span>
                  <span className="text-[7px] font-mono text-[var(--text-muted)]">Live stream opens in source viewer</span>
                  {externalFeedUrl && (
                    <a
                      href={externalFeedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mx-auto mt-3 px-3 py-1 text-[8px] font-mono text-[#39FF14] border border-[#39FF14]/30 rounded hover:bg-[#39FF14]/10 transition-colors tracking-wider"
                    >
                      OPEN FEED
                    </a>
                  )}
                </div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-2 mx-auto">
                    <Camera className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-[9px] font-mono text-red-400 tracking-widest block mb-1">FEED UNAVAILABLE</span>
                  <span className="text-[7px] font-mono text-[var(--text-muted)]">Camera may be offline or restricted</span>
                  <button
                    onClick={() => { setError(false); setRefreshKey(k => k + 1); }}
                    className="block mx-auto mt-3 px-3 py-1 text-[8px] font-mono text-[#39FF14] border border-[#39FF14]/30 rounded hover:bg-[#39FF14]/10 transition-colors tracking-wider"
                  >
                    RETRY
                  </button>
                </div>
              </div>
            ) : streamType === 'hls' ? (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay muted playsInline
              />
            ) : streamType === 'iframe' && camera.stream_url ? (
              /*
                The iframe's width & height attributes define its VIEWPORT —
                the size of the browser window the embedded page sees.
                Setting them to the measured container dimensions means the
                proxy page lays out exactly to fill the box with no overflow
                and no need for scrollbars.

                `display: block` removes the default inline gap.
                `border: none` removes the default 2px border.
                No `scrolling` attribute needed — the page itself won't scroll
                because its viewport matches its content area.
              */
              <iframe
                key={camera.stream_url}
                src={camera.stream_url}
                title={camera.name}
                allowFullScreen
                allow="autoplay; fullscreen"
                width={scale.x || '100%'}
                height={scale.y || '100%'}
                style={{
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  backgroundColor: '#000',
                }}
              />
            ) : imageUrl ? (
              <img
                key={refreshKey}
                src={imageUrl}
                alt={camera.name}
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setError(true); }}
              />
            ) : null}

            {/* Live badge */}
            {!error && !loading && !externalOnly && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-1 rounded z-10 pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-osiris-pulse" />
                <span className="text-[7px] font-mono text-white tracking-widest">
                  {streamType === 'jpg' ? 'LIVE SNAPSHOT' : 'LIVE VIDEO'}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 md:px-4 py-2 border-t border-[var(--border-secondary)] bg-black/40 flex items-center justify-between flex-shrink-0">
            <div className="text-[7px] md:text-[8px] font-mono text-[var(--text-muted)]">
              {camera.lat?.toFixed(4)}, {camera.lng?.toFixed(4)}
            </div>
            <div className="flex gap-2">
              {(camera.feed_url || camera.external_url) && (
                <a
                  href={camera.external_url || camera.feed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[7px] font-mono text-[#39FF14] hover:underline tracking-wider"
                >
                  <ExternalLink className="w-2.5 h-2.5" /> FEED
                </a>
              )}
              <a
                href={`https://www.google.com/maps/@${camera.lat},${camera.lng},17z`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[7px] font-mono text-[var(--cyan-primary)] hover:underline tracking-wider"
              >
                <MapPin className="w-2.5 h-2.5" /> MAP
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

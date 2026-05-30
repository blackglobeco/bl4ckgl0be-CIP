'use client';

import { useEffect } from 'react';

export default function StartupSound() {
  useEffect(() => {
    let unlocked = false;

    const play = async () => {
      if (unlocked) return;
      unlocked = true;

      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Resume context (required in some browsers)
        if (ctx.state === 'suspended') await ctx.resume();

        const res = await fetch('/blackglobe-startup.mp3');
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (e) {
        // Silently fail — audio is non-critical
      }
    };

    // Attempt autoplay immediately
    play();

    // Fallback: play on first interaction if autoplay was blocked
    const onInteract = () => {
      play();
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    };

    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });

    return () => {
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, []);

  return null;
}

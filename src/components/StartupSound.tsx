'use client';

import { useEffect, useRef } from 'react';

export default function StartupSound() {
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (hasPlayed.current) return;
    hasPlayed.current = true;

    const audio = new Audio('/blackglobe-startup.mp3');
    audio.volume = 1;

    const playOnInteraction = () => {
      audio.play().catch(() => {});
      window.removeEventListener('click', playOnInteraction);
      window.removeEventListener('keydown', playOnInteraction);
    };

    audio.play().catch(() => {
      // Autoplay blocked — wait for first interaction
      window.addEventListener('click', playOnInteraction, { once: true });
      window.addEventListener('keydown', playOnInteraction, { once: true });
    });

    return () => {
      window.removeEventListener('click', playOnInteraction);
      window.removeEventListener('keydown', playOnInteraction);
    };
  }, []);

  return null;
}

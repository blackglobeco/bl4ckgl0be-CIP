'use client';

import { useEffect, useState } from 'react';

export default function StartupSound() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('bg-booted')) {
      setVisible(false);
    }
  }, []);

  const handleEnter = () => {
    const audio = new Audio('/blackglobe-startup.mp3');
    audio.volume = 1;
    audio.play().catch(() => {});
    sessionStorage.setItem('bg-booted', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleEnter}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#04040A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        border: '2px solid #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </div>
      <div style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase' }}>
        Click to Enter
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
          50% { box-shadow: 0 0 0 16px rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  );
}

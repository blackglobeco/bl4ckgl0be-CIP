'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const C = {
  bg:          'rgba(8, 10, 20, 0.92)',
  bgLabel:     'rgba(8, 10, 20, 0.98)',
  border:      'rgba(255, 255, 255, 0.08)',
  textPrimary: '#E8E6E0',
  textMuted:   '#5C5A54',
  textClosed:  '#7A7875',   // closed exchange — visible grey (was too dim before)
  dotOpen:     '#00E676',
  dotClosed:   '#4A4845',
  gold:        '#D4AF37',
  green:       '#00E676',
  separator:   'rgba(255, 255, 255, 0.2)',
  cyber:       '#E040FB',
};

interface Exchange { name: string; country: string; open: boolean; }
interface CountryRisk { code: string; risk_score: number; risk_level: string; tags: string[]; }

const RISK_TOOLTIPS: Record<string, string> = {
  CRITICAL: 'Active conflict, sanctions, or major instability detected',
  HIGH: 'Elevated threat level — ongoing tensions or security concerns',
  ELEVATED: 'Moderate risk — political instability or regional disputes',
  LOW: 'Stable — no significant threats detected',
};

export default function GlobalStatusBar() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [risks, setRisks] = useState<CountryRisk[]>([]);
  const [cyber, setCyber] = useState<any>(null);
  const [openCount, setOpenCount] = useState(0);
  const [hoveredRisk, setHoveredRisk] = useState<CountryRisk | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [riskRes, cyberRes] = await Promise.allSettled([
          fetch('/api/country-risk'),
          fetch('/api/cyber-threats'),
        ]);
        if (riskRes.status === 'fulfilled' && riskRes.value.ok) {
          const d = await riskRes.value.json();
          setExchanges(d.exchanges || []);
          setRisks(d.countries || []);
          setOpenCount(d.open_exchanges || 0);
        }
        if (cyberRes.status === 'fulfilled' && cyberRes.value.ok) {
          setCyber(await cyberRes.value.json());
        }
      } catch (e) { console.warn('[OSIRIS] Suppressed error:', e instanceof Error ? e.message : e); }
    };
    fetchData();
    const iv = setInterval(fetchData, 1800000);
    return () => clearInterval(iv);
  }, []);

  const topRisks = risks.slice(0, 6);
  const cveCount = cyber?.stats?.active_cves || 0;

  const riskColor = (level: string) =>
    level === 'CRITICAL' ? '#FF3D3D' : level === 'HIGH' ? '#FF9500' : level === 'ELEVATED' ? '#FFD700' : '#00E676';

  const countryFlag = (code: string) => {
    try {
      return String.fromCodePoint(...code.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
    } catch { return code; }
  };

  if (exchanges.length === 0 && risks.length === 0) return null;

  const tickerContent = (
    <>
      {exchanges.map(ex => (
        <span key={ex.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', margin: '0 6px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0, backgroundColor: ex.open ? C.dotOpen : C.dotClosed }} />
          <span style={{ color: ex.open ? C.textPrimary : C.textClosed }}>{ex.name}</span>
        </span>
      ))}
      <span style={{ color: C.separator, margin: '0 4px' }}>|</span>
      {topRisks.map(r => (
        <span
          key={r.code}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', margin: '0 6px', cursor: 'help', pointerEvents: 'auto', position: 'relative' }}
          onMouseEnter={() => setHoveredRisk(r)}
          onMouseLeave={() => setHoveredRisk(null)}
        >
          <span style={{ fontSize: '10px' }}>{countryFlag(r.code)}</span>
          <span style={{ color: riskColor(r.risk_level), fontWeight: 700 }}>{r.risk_score}</span>
        </span>
      ))}
      <span style={{ color: C.separator, margin: '0 4px' }}>|</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', margin: '0 8px' }}>
        <span style={{ color: C.cyber }}>CYBER</span>
        <span style={{ color: C.textPrimary }}>{cveCount} CVEs</span>
      </span>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 4, duration: 0.8 }}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 198, pointerEvents: 'none', display: 'none' }}
      className="md:!block"
    >
      <div style={{
        height: '22px',
        overflow: 'hidden',
        backgroundColor: C.bg,
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        fontSize: '8px',
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
        color: C.textPrimary,
      }}>
        <div style={{
          flexShrink: 0, padding: '0 8px', height: '100%',
          display: 'flex', alignItems: 'center', gap: '4px',
          borderRight: `1px solid ${C.border}`,
          backgroundColor: C.bgLabel,
          pointerEvents: 'auto',
        }}>
          <span style={{ color: C.textMuted }}>MKT</span>
          <span style={{ color: C.gold, fontWeight: 700 }}>{openCount}/{exchanges.length}</span>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div className="animate-ticker" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
            {tickerContent}
            {tickerContent}
          </div>
        </div>
      </div>

      {hoveredRisk && (
        <div style={{ position: 'absolute', bottom: '28px', left: '50%', transform: 'translateX(-50%)', zIndex: 300, pointerEvents: 'none' }}>
          <div className="glass-panel" style={{ padding: '8px 12px', fontSize: '10px', fontFamily: 'monospace', textAlign: 'center', whiteSpace: 'nowrap', borderColor: `${riskColor(hoveredRisk.risk_level)}40` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px' }}>{countryFlag(hoveredRisk.code)}</span>
              <span style={{ fontWeight: 700, color: riskColor(hoveredRisk.risk_level) }}>{hoveredRisk.risk_level}</span>
              <span style={{ color: C.textMuted }}>Score: {hoveredRisk.risk_score}/100</span>
            </div>
            <div style={{ fontSize: '9px', color: '#9B978E' }}>
              {RISK_TOOLTIPS[hoveredRisk.risk_level] || 'Risk assessment based on global threat data'}
            </div>
            {hoveredRisk.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {hoveredRisk.tags.slice(0, 3).map(t => (
                  <span key={t} style={{ padding: '2px 6px', borderRadius: '3px', fontSize: '8px', backgroundColor: `${riskColor(hoveredRisk.risk_level)}15`, color: riskColor(hoveredRisk.risk_level) }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

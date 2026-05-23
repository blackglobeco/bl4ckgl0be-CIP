'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Eye, EyeOff, ShieldCheck, ShieldOff, Lock, Unlock, Save, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import type { PasscodeEntry } from '@/lib/passcodes';

interface PasscodeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  passcodes: PasscodeEntry[];
  onSave: (updated: PasscodeEntry[]) => void;
}

const ROLES: PasscodeEntry['role'][] = ['admin', 'operator', 'viewer', 'guest'];

const ROLE_COLORS: Record<PasscodeEntry['role'], string> = {
  admin:    '#FFD700',
  operator: '#00E5FF',
  viewer:   '#00E676',
  guest:    '#9B978E',
};

const ROLE_BG: Record<PasscodeEntry['role'], string> = {
  admin:    'rgba(255,215,0,0.1)',
  operator: 'rgba(0,229,255,0.08)',
  viewer:   'rgba(0,230,118,0.08)',
  guest:    'rgba(155,151,142,0.08)',
};

function validateCode(code: string, allCodes: string[], currentIndex: number): string | null {
  if (!/^\d{4}$/.test(code)) return 'Must be exactly 4 digits';
  const duplicate = allCodes.findIndex((c, i) => c === code && i !== currentIndex);
  if (duplicate !== -1) return 'Code already exists';
  return null;
}

export default function PasscodeManager({ isOpen, onClose, passcodes, onSave }: PasscodeManagerProps) {
  const [entries, setEntries] = useState<PasscodeEntry[]>(() => JSON.parse(JSON.stringify(passcodes)));
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const toggleReveal = (i: number) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const updateEntry = (index: number, field: keyof PasscodeEntry, value: any) => {
    setEntries(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // If toggling admin on, ensure role is admin
      if (field === 'admin' && value === true) {
        next[index].role = 'admin';
      }

      return next;
    });

    // Validate code on change
    if (field === 'code') {
      setEntries(prev => {
        const codes = prev.map((e, i) => i === index ? value : e.code);
        const err = validateCode(value, codes, index);
        setErrors(errs => ({ ...errs, [index]: err || '' }));
        return prev;
      });
    }
  };

  const addEntry = () => {
    setEntries(prev => [
      ...prev,
      { code: '', label: 'New User', role: 'viewer', admin: false, active: true, note: '' },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
    setErrors(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setDeleteConfirm(null);
  };

  const copyCode = (index: number, code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(index);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleSave = useCallback(() => {
    // Validate all entries
    const codes = entries.map(e => e.code);
    const newErrors: Record<number, string> = {};
    let hasError = false;

    entries.forEach((entry, i) => {
      const err = validateCode(entry.code, codes, i);
      if (err) { newErrors[i] = err; hasError = true; }
      if (!entry.label.trim()) { newErrors[i] = (newErrors[i] || '') + ' Label required.'; hasError = true; }
    });

    const hasAdmin = entries.some(e => e.admin && e.active);
    if (!hasAdmin) {
      alert('At least one active admin passcode is required.');
      return;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    onSave(entries);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [entries, onSave]);

  const activeCount = entries.filter(e => e.active).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[990] flex items-center justify-center"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(4,4,10,0.75)' }}
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel osiris-glow flex flex-col"
            style={{
              width: 'min(680px, 96vw)',
              maxHeight: '88vh',
              overflow: 'hidden',
            }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)' }}>
                  <Lock className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                </div>
                <div>
                  <h2 className="text-[12px] font-mono font-bold text-[var(--text-heading)] tracking-[0.2em]">PASSCODE MANAGER</h2>
                  <p className="text-[8px] font-mono text-[var(--text-muted)] tracking-[0.15em]">
                    {activeCount} ACTIVE · {entries.length} TOTAL
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Save button */}
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-[0.15em] transition-all"
                  style={{
                    background: saved ? 'rgba(0,230,118,0.15)' : 'rgba(255,215,0,0.12)',
                    border: `1px solid ${saved ? 'rgba(0,230,118,0.4)' : 'rgba(255,215,0,0.3)'}`,
                    color: saved ? '#00E676' : 'var(--gold-primary)',
                  }}
                >
                  {saved ? <CheckCircle2 className="w-3 h-3" /> : <Save className="w-3 h-3" />}
                  {saved ? 'SAVED' : 'SAVE'}
                </motion.button>
                <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Warning banner ── */}
            <div className="mx-6 mt-4 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.2)' }}>
              <AlertTriangle className="w-3 h-3 text-[var(--alert-orange)] shrink-0" />
              <span className="text-[8px] font-mono text-[var(--alert-orange)] tracking-[0.1em]">
                CHANGES ARE RUNTIME-ONLY. To persist permanently, copy updates to <code className="opacity-80">src/lib/passcodes.ts</code> and redeploy.
              </span>
            </div>

            {/* ── Entries list ── */}
            <div className="flex-1 overflow-y-auto styled-scrollbar px-6 py-4 space-y-3">
              <AnimatePresence initial={false}>
                {entries.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-xl p-4"
                    style={{
                      background: entry.active ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)',
                      border: `1px solid ${errors[i] ? 'rgba(255,61,61,0.4)' : entry.active ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                      opacity: entry.active ? 1 : 0.55,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Active toggle */}
                      <button
                        onClick={() => updateEntry(i, 'active', !entry.active)}
                        className="mt-0.5 shrink-0 transition-colors"
                        title={entry.active ? 'Disable' : 'Enable'}
                      >
                        {entry.active
                          ? <ShieldCheck className="w-4 h-4 text-[var(--alert-green)]" />
                          : <ShieldOff className="w-4 h-4 text-[var(--text-muted)]" />
                        }
                      </button>

                      {/* Fields */}
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        {/* Code field */}
                        <div className="col-span-1">
                          <label className="hud-label mb-1 block">PASSCODE</label>
                          <div className="flex items-center gap-1">
                            <input
                              type={revealed.has(i) ? 'text' : 'password'}
                              value={entry.code}
                              maxLength={4}
                              onChange={e => updateEntry(i, 'code', e.target.value.replace(/\D/g, '').slice(0, 4))}
                              className="w-full px-2 py-1.5 rounded-lg font-mono text-[13px] font-bold text-[var(--text-heading)] tracking-[0.4em] outline-none transition-all"
                              style={{
                                background: 'rgba(0,0,0,0.4)',
                                border: `1px solid ${errors[i] ? 'rgba(255,61,61,0.5)' : 'rgba(255,255,255,0.12)'}`,
                              }}
                              placeholder="····"
                            />
                            <button onClick={() => toggleReveal(i)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 shrink-0">
                              {revealed.has(i) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => copyCode(i, entry.code)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 shrink-0" title="Copy code">
                              {copied === i ? <CheckCircle2 className="w-3.5 h-3.5 text-[var(--alert-green)]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          {errors[i] && <p className="text-[7px] font-mono text-[#FF3D3D] mt-1 tracking-wide">{errors[i]}</p>}
                        </div>

                        {/* Label field */}
                        <div className="col-span-1">
                          <label className="hud-label mb-1 block">LABEL</label>
                          <input
                            type="text"
                            value={entry.label}
                            onChange={e => updateEntry(i, 'label', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg font-mono text-[11px] text-[var(--text-primary)] outline-none transition-all"
                            style={{
                              background: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(255,255,255,0.12)',
                            }}
                            placeholder="User label..."
                          />
                        </div>

                        {/* Role select */}
                        <div className="col-span-1">
                          <label className="hud-label mb-1 block">ROLE</label>
                          <select
                            value={entry.role}
                            onChange={e => updateEntry(i, 'role', e.target.value as PasscodeEntry['role'])}
                            className="w-full px-2 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-[0.1em] uppercase outline-none cursor-pointer transition-all"
                            style={{
                              background: ROLE_BG[entry.role],
                              border: `1px solid ${ROLE_COLORS[entry.role]}40`,
                              color: ROLE_COLORS[entry.role],
                            }}
                          >
                            {ROLES.map(r => (
                              <option key={r} value={r} style={{ background: '#0C0E1A', color: ROLE_COLORS[r] }}>
                                {r.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Note field */}
                        <div className="col-span-1">
                          <label className="hud-label mb-1 block">NOTE (OPTIONAL)</label>
                          <input
                            type="text"
                            value={entry.note || ''}
                            onChange={e => updateEntry(i, 'note', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg font-mono text-[10px] text-[var(--text-secondary)] outline-none transition-all"
                            style={{
                              background: 'rgba(0,0,0,0.4)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                            placeholder="Optional note..."
                          />
                        </div>

                        {/* Admin toggle row */}
                        <div className="col-span-2 flex items-center gap-2 mt-1">
                          <button
                            onClick={() => updateEntry(i, 'admin', !entry.admin)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[8px] font-mono font-bold tracking-[0.12em] transition-all"
                            style={{
                              background: entry.admin ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${entry.admin ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.1)'}`,
                              color: entry.admin ? 'var(--gold-primary)' : 'var(--text-muted)',
                            }}
                          >
                            {entry.admin ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                            ADMIN PANEL ACCESS
                          </button>

                          <span className="text-[7px] font-mono text-[var(--text-muted)] opacity-60">
                            {entry.admin ? '✓ Can manage passcodes' : 'No management access'}
                          </span>
                        </div>
                      </div>

                      {/* Delete */}
                      <div className="shrink-0">
                        {deleteConfirm === i ? (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => removeEntry(i)}
                              className="text-[8px] font-mono font-bold text-[#FF3D3D] px-2 py-1 rounded-lg transition-all"
                              style={{ background: 'rgba(255,61,61,0.15)', border: '1px solid rgba(255,61,61,0.3)' }}
                            >
                              CONFIRM
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-[8px] font-mono text-[var(--text-muted)] px-2 py-1 rounded-lg transition-all"
                              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                              CANCEL
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(i)}
                            className="text-[var(--text-muted)] hover:text-[#FF3D3D] transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add new */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={addEntry}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-[9px] tracking-[0.2em] text-[var(--text-muted)] transition-all"
                style={{ border: '1px dashed rgba(255,255,255,0.12)', background: 'transparent' }}
                whileHover={{ borderColor: 'rgba(255,255,255,0.25)', color: 'var(--text-primary)' }}
              >
                <Plus className="w-3 h-3" />
                ADD PASSCODE
              </motion.button>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-3 border-t border-[var(--border-secondary)] flex items-center justify-between">
              <div className="text-[7px] font-mono text-[var(--text-muted)] tracking-[0.15em] opacity-60">
                PERSISTENT CHANGES → <code>src/lib/passcodes.ts</code>
              </div>
              <div className="flex items-center gap-3 text-[7px] font-mono tracking-[0.1em]">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--alert-green)] inline-block" /><span className="text-[var(--text-muted)]">ACTIVE</span></span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] inline-block" /><span className="text-[var(--text-muted)]">DISABLED</span></span>
                <span className="flex items-center gap-1 text-[var(--gold-primary)]"><Lock className="w-2.5 h-2.5" /> ADMIN</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

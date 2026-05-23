/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           BLACK GLOBE — PASSCODE CONFIGURATION               ║
 * ║                                                              ║
 * ║  Manage all lock screen passcodes here.                      ║
 * ║  Each entry has a code, label, and optional role.            ║
 * ║                                                              ║
 * ║  RULES:                                                      ║
 * ║  • Codes must be exactly 4 digits (0-9)                      ║
 * ║  • Each code must be unique                                  ║
 * ║  • At least one code must be marked admin: true              ║
 * ║  • Labels are shown in the admin panel only                  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

export interface PasscodeEntry {
  /** 4-digit numeric code */
  code: string;
  /** Human-readable label shown in admin panel */
  label: string;
  /** Role identifier for this passcode */
  role: 'admin' | 'operator' | 'viewer' | 'guest';
  /** Whether this code grants access to the passcode management panel */
  admin: boolean;
  /** Whether this entry is active */
  active: boolean;
  /** Optional notes */
  note?: string;
}

const PASSCODES: PasscodeEntry[] = [
  {
    code: '1337',
    label: 'Admin Master',
    role: 'admin',
    admin: true,
    active: true,
    note: 'Primary admin access — grants passcode management panel',
  },
  {
    code: '2580',
    label: 'Operator Alpha',
    role: 'operator',
    admin: false,
    active: true,
    note: 'Standard operator access',
  },
  {
    code: '9631',
    label: 'Operator Bravo',
    role: 'operator',
    admin: false,
    active: true,
    note: 'Standard operator access',
  },
  {
    code: '4812',
    label: 'Viewer Access',
    role: 'viewer',
    admin: false,
    active: true,
    note: 'Read-only view access',
  },
  {
    code: '0000',
    label: 'Guest Demo',
    role: 'guest',
    admin: false,
    active: false,       // ← disabled by default; set to true to activate
    note: 'Demo/guest access — disabled by default',
  },
];

export default PASSCODES;

/**
 * ── ROLE DESCRIPTIONS ──────────────────────────────────────────
 * admin    → Full access + passcode management panel
 * operator → Full map + data layer access
 * viewer   → Map access, no configuration panels
 * guest    → Limited view, no sensitive layers
 * ───────────────────────────────────────────────────────────────
 *
 * ── HOW TO ADD A NEW PASSCODE ──────────────────────────────────
 * 1. Add a new entry to the PASSCODES array above
 * 2. Set a unique 4-digit code
 * 3. Give it a label, role, and set active: true
 * 4. Save the file — changes take effect on next page load
 *
 * ── HOW TO DISABLE A PASSCODE ──────────────────────────────────
 * Set active: false on the entry. It will be rejected at login
 * but kept in the list for audit purposes.
 *
 * ── HOW TO GRANT ADMIN PANEL ACCESS ───────────────────────────
 * Set admin: true on the entry. The user will see a lock icon
 * in the top-right corner of the app to open the manager.
 */

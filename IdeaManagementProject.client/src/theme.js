/**
 * IdeaHub — Unified Design System
 * Single source of truth for colors, spacing, shadows, typography, components.
 */

// ─── Color palette ──────────────────────────────────────────────────────────
export const C = {
  // Brand
  primary:     '#4F46E5',   // indigo-600
  primaryDk:   '#3730A3',   // indigo-800
  primaryLt:   '#E0E7FF',   // indigo-100
  primaryMid:  '#6366F1',   // indigo-500

  // Neutrals
  bg:          '#F8FAFC',
  bgCard:      '#FFFFFF',
  border:      '#E2E8F0',
  borderMid:   '#CBD5E1',
  text:        '#0F172A',
  textSub:     '#475569',
  textMuted:   '#94A3B8',
  textLight:   '#CBD5E1',

  // Sidebar
  sidebar:     '#0F172A',
  sidebarSub:  '#1E293B',
  sidebarText: '#94A3B8',
  sidebarHov:  '#1E293B',
  sidebarAct:  '#4F46E5',

  // Status
  success:     '#10B981',
  successLt:   '#D1FAE5',
  successDk:   '#065F46',
  warning:     '#F59E0B',
  warningLt:   '#FEF3C7',
  warningDk:   '#92400E',
  danger:      '#EF4444',
  dangerLt:    '#FEE2E2',
  dangerDk:    '#991B1B',
  info:        '#3B82F6',
  infoLt:      '#DBEAFE',
  infoDk:      '#1E40AF',

  // Charts
  chart: ['#4F46E5','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899'],
};

// ─── Shadows ────────────────────────────────────────────────────────────────
export const shadow = {
  xs:  '0 1px 2px rgba(0,0,0,0.05)',
  sm:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  md:  '0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)',
  lg:  '0 10px 24px -3px rgba(0,0,0,0.10), 0 4px 8px -2px rgba(0,0,0,0.06)',
  xl:  '0 20px 50px -8px rgba(0,0,0,0.18)',
  card:'0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
  focus:'0 0 0 3px rgba(79,70,229,0.18)',
};

// ─── Border radius ───────────────────────────────────────────────────────────
export const r = {
  sm:  '6px',
  md:  '10px',
  lg:  '14px',
  xl:  '18px',
  full:'9999px',
};

// ─── Typography ──────────────────────────────────────────────────────────────
export const font = "'Inter', 'DM Sans', system-ui, -apple-system, sans-serif";

// ─── Reusable style factories ─────────────────────────────────────────────────

export const T = {
  // Page title
  h1: { margin:0, fontSize:'1.6rem', fontWeight:800, color:C.text, letterSpacing:'-0.02em', lineHeight:1.2 },
  h2: { margin:0, fontSize:'1.1rem', fontWeight:700, color:C.text },
  h3: { margin:0, fontSize:'0.9rem', fontWeight:700, color:C.text },
  sub: { margin:0, fontSize:'13px', color:C.textSub, lineHeight:1.5 },
  label: { display:'block', fontSize:'12px', fontWeight:600, color:C.textSub, marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.05em' },
};

// ─── Card ────────────────────────────────────────────────────────────────────
export const card = {
  background: C.bgCard,
  borderRadius: r.lg,
  border: `1px solid ${C.border}`,
  boxShadow: shadow.card,
  padding: '1.5rem',
  boxSizing: 'border-box',
};

export const cardSm = { ...card, padding: '1.25rem', borderRadius: r.md };

// ─── Stat card ───────────────────────────────────────────────────────────────
export function statCard(accent = C.primary) {
  return {
    ...card,
    borderTop: `3px solid ${accent}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };
}

// ─── Input ───────────────────────────────────────────────────────────────────
export const input = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.6rem 0.85rem',
  borderRadius: r.md,
  border: `1.5px solid ${C.border}`,
  fontSize: '14px',
  color: C.text,
  background: C.bgCard,
  fontFamily: font,
  outline: 'none',
  transition: 'border-color .15s, box-shadow .15s',
};

export const inputFocused = {
  ...input,
  borderColor: C.primary,
  boxShadow: shadow.focus,
};

export const textarea = {
  ...input,
  minHeight: '120px',
  resize: 'vertical',
  lineHeight: 1.6,
};

export const select = {
  ...input,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394A3B8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2rem',
};

// ─── Buttons ─────────────────────────────────────────────────────────────────
const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  fontFamily: font,
  fontWeight: 600,
  fontSize: '13.5px',
  border: 'none',
  cursor: 'pointer',
  borderRadius: r.md,
  transition: 'all .15s',
  whiteSpace: 'nowrap',
  lineHeight: 1,
};

export const btn = {
  primary: { ...btnBase, padding:'0.6rem 1.1rem', background: C.primary, color:'#fff', boxShadow:'0 1px 3px rgba(79,70,229,0.3)' },
  secondary: { ...btnBase, padding:'0.6rem 1.1rem', background: '#F1F5F9', color: C.textSub, border:`1px solid ${C.border}` },
  danger: { ...btnBase, padding:'0.6rem 1.1rem', background: C.dangerLt, color: C.dangerDk },
  success: { ...btnBase, padding:'0.6rem 1.1rem', background: C.successLt, color: C.successDk },
  ghost: { ...btnBase, padding:'0.6rem 1.1rem', background:'transparent', color:C.textSub },
  // sizes
  sm: { padding:'0.4rem 0.75rem', fontSize:'12px', borderRadius: r.sm },
  lg: { padding:'0.75rem 1.4rem', fontSize:'15px' },
  // icon only
  icon: { ...btnBase, padding:'0.5rem', borderRadius: r.sm, background:'#F1F5F9', color:C.textSub },
};

// ─── Badge ───────────────────────────────────────────────────────────────────
const badgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '2px 9px',
  borderRadius: r.full,
  fontSize: '11px',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};

export const badge = {
  primary:  { ...badgeBase, background: C.primaryLt, color: C.primaryDk },
  success:  { ...badgeBase, background: C.successLt, color: C.successDk },
  warning:  { ...badgeBase, background: C.warningLt, color: C.warningDk },
  danger:   { ...badgeBase, background: C.dangerLt,  color: C.dangerDk  },
  info:     { ...badgeBase, background: C.infoLt,    color: C.infoDk    },
  neutral:  { ...badgeBase, background: '#F1F5F9',   color: C.textSub   },
};

// ─── Table ───────────────────────────────────────────────────────────────────
export const table = {
  wrapper: { overflowX:'auto', borderRadius: r.md },
  table:   { width:'100%', borderCollapse:'collapse', fontSize:'13.5px' },
  th:      { padding:'10px 14px', textAlign:'left', fontSize:'11px', fontWeight:700, color:C.textMuted, textTransform:'uppercase', letterSpacing:'0.05em', borderBottom:`2px solid ${C.border}`, whiteSpace:'nowrap', background:'#F8FAFC' },
  td:      { padding:'12px 14px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', color:C.text },
};

// ─── Shell layout ────────────────────────────────────────────────────────────
export const shell = {
  sidebar: {
    width: '220px',
    minHeight: '100vh',
    background: C.sidebar,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    borderRight: `1px solid rgba(255,255,255,0.06)`,
  },
  main: {
    flex: 1,
    background: C.bg,
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    padding: '2rem 2.5rem',
    maxWidth: '1400px',
  },
};

// ─── Alert / Banner ──────────────────────────────────────────────────────────
export function alertStyle(type = 'info') {
  const map = {
    info:    { background:'#EFF6FF', border:'#BFDBFE', color:'#1D4ED8' },
    success: { background:'#ECFDF5', border:'#A7F3D0', color:'#065F46' },
    warning: { background:'#FFFBEB', border:'#FDE68A', color:'#92400E' },
    error:   { background:'#FEF2F2', border:'#FECACA', color:'#B91C1C' },
  };
  const m = map[type] || map.info;
  return { padding:'0.75rem 1rem', borderRadius:r.md, border:`1px solid ${m.border}`, background:m.background, color:m.color, fontSize:'13px', fontWeight:500, marginBottom:'1rem' };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function mergeStyle(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

export function roleColor(role) {
  const map = { ADMIN:'#7C3AED', STAFF:'#0891B2', QA_COORDINATOR:'#059669', QA_MANAGER:'#D97706' };
  return map[role] || C.textSub;
}

export function roleBg(role) {
  const map = { ADMIN:'#EDE9FE', STAFF:'#CFFAFE', QA_COORDINATOR:'#D1FAE5', QA_MANAGER:'#FEF3C7' };
  return map[role] || '#F1F5F9';
}

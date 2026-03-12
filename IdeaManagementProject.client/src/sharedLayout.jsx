import { useState, useEffect } from 'react';
import { clearAuthSession, getAuthSession, getDisplayName } from './authStorage';

/* ═══════════════════════════════════════════════════════════
   CSS GLOBAL (inject 1 lần)
═══════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:wght@500;600;700&display=swap');

*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --brand:#2563eb;--brand-d:#1d4ed8;--brand-l:#eff6ff;
  --rose:#e11d48;--rose-l:#fff1f2;
  --teal:#0d9488;--teal-l:#f0fdfa;
  --amber:#b45309;--amber-l:#fffbeb;
  --violet:#7c3aed;--violet-l:#f5f3ff;
  --ink:#0f172a;--ink2:#334155;--muted:#64748b;
  --border:#e2e8f0;--bg:#f8fafc;--card:#ffffff;
  --sidebar:#0f1c33;--sidebar-w:224px;
}
html,body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--ink);font-size:14px;-webkit-font-smoothing:antialiased;height:100%}
h1,h2,h3,h4{font-family:'Lora',serif;font-weight:700;letter-spacing:-0.3px}
button,input,select,textarea{font-family:'Plus Jakarta Sans',sans-serif}

/* LAYOUT */
.ih-app{display:flex;min-height:100vh}
.ih-main{flex:1;min-width:0;overflow-y:auto}
.ih-content{padding:28px 32px;max-width:1240px}

/* SIDEBAR */
.ih-sb{width:var(--sidebar-w);min-height:100vh;background:var(--sidebar);display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
.ih-sb-logo{padding:1.25rem 1.125rem;border-bottom:1px solid rgba(255,255,255,.1);display:flex;align-items:center;gap:.75rem}
.ih-sb-badge{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#2563eb,#60a5fa);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:12px;flex-shrink:0}
.ih-sb-nav{flex:1;padding:.75rem .625rem;display:flex;flex-direction:column;gap:2px}
.ih-sb-sep{height:1px;background:rgba(255,255,255,.08);margin:6px .5rem}
.ih-sb-lbl{padding:8px 10px 3px;font-size:10.5px;font-weight:700;color:rgba(255,255,255,.3);text-transform:uppercase;letter-spacing:.6px}
.ih-nl{display:flex;align-items:center;gap:.625rem;padding:.55rem .75rem;border-radius:8px;font-size:13.5px;font-weight:500;cursor:pointer;border:none;width:100%;text-align:left;background:transparent;color:rgba(255,255,255,.45);font-family:inherit;transition:background .15s,color .15s}
.ih-nl:hover{background:rgba(255,255,255,.07);color:rgba(255,255,255,.85)}
.ih-nl.active{background:#2563eb;color:#fff;font-weight:700}
.ih-nl svg{flex-shrink:0;opacity:.85}
.ih-sb-foot{padding:.875rem 1rem;border-top:1px solid rgba(255,255,255,.08)}
.ih-av{display:flex;align-items:center;justify-content:center;border-radius:7px;background:linear-gradient(135deg,#2563eb,#e11d48);color:#fff;font-weight:800;flex-shrink:0;font-size:11px}

/* TOPBAR */
.ih-topbar{height:56px;background:var(--card);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 28px;gap:12px;position:sticky;top:0;z-index:80;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.ih-tb-title{font-family:'Lora',serif;font-weight:700;font-size:16px;flex:1}
.ih-sb2{display:flex;align-items:center;background:var(--bg);border:1.5px solid var(--border);border-radius:8px;padding:0 11px;gap:7px;height:34px;transition:border-color .15s}
.ih-sb2:focus-within{border-color:var(--brand)}
.ih-sb2 input{border:none;background:none;outline:none;font-size:13px;font-family:inherit;font-weight:500;width:160px}

/* BUTTONS */
.btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .15s;white-space:nowrap;font-family:inherit}
.btn-primary{background:var(--brand);color:#fff}.btn-primary:hover{background:var(--brand-d)}
.btn-teal{background:var(--teal);color:#fff}.btn-teal:hover{background:#0f766e}
.btn-rose{background:var(--rose);color:#fff}.btn-rose:hover{background:#be123c}
.btn-outline{background:transparent;border:1.5px solid var(--border);color:var(--ink2)}.btn-outline:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-l)}
.btn-ghost{background:transparent;color:var(--muted)}.btn-ghost:hover{background:var(--bg);color:var(--ink)}
.btn-danger{background:#dc2626;color:#fff}.btn-danger:hover{background:#b91c1c}
.btn-amber{background:var(--amber);color:#fff}
.btn-sm{padding:5px 11px;font-size:12px}
.btn-xs{padding:3px 9px;font-size:11.5px}
.btn:disabled{opacity:.45;cursor:not-allowed}

/* ICON BUTTON */
.ibtn{width:34px;height:34px;border-radius:8px;border:none;background:var(--bg);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--muted);transition:all .15s;position:relative;flex-shrink:0}
.ibtn:hover{background:var(--border);color:var(--ink)}
.i-badge{position:absolute;top:-4px;right:-4px;background:var(--rose);color:#fff;font-size:9px;font-weight:800;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 3px}

/* TAGS */
.tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap}
.tag-blue{background:var(--brand-l);color:var(--brand)}
.tag-rose{background:var(--rose-l);color:var(--rose)}
.tag-teal{background:var(--teal-l);color:var(--teal)}
.tag-amber{background:var(--amber-l);color:var(--amber)}
.tag-violet{background:var(--violet-l);color:var(--violet)}
.tag-gray{background:var(--bg);color:var(--muted);border:1px solid var(--border)}

/* CARDS */
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:20px}
.card-sm{padding:14px}
.idea-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px;cursor:pointer;transition:all .2s;display:flex;flex-direction:column;gap:9px}
.idea-card:hover{box-shadow:0 6px 24px rgba(37,99,235,.1);transform:translateY(-2px);border-color:#bfdbfe}

/* STAT CARD */
.sc{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;display:flex;flex-direction:column;gap:5px}
.sc-icon{width:40px;height:40px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin-bottom:3px;font-size:20px}
.sc-val{font-family:'Lora',serif;font-size:28px;font-weight:700;line-height:1}
.sc-lbl{font-size:12.5px;color:var(--muted);font-weight:500}

/* FORM */
.fg{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}
.fl{font-size:12.5px;font-weight:700;color:var(--ink2)}
.fi{padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:13.5px;color:var(--ink);outline:none;transition:border-color .15s;background:#fff;width:100%;font-family:inherit}
.fi:focus{border-color:var(--brand);box-shadow:0 0 0 3px rgba(37,99,235,.08)}
textarea.fi{resize:vertical;min-height:100px}
select.fi{cursor:pointer}

/* TABLE */
.tw{overflow-x:auto;border-radius:10px;border:1px solid var(--border)}
table{width:100%;border-collapse:collapse}
thead th{background:var(--bg);padding:9px 14px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--muted);border-bottom:1px solid var(--border);white-space:nowrap}
tbody td{padding:11px 14px;border-bottom:1px solid var(--border);vertical-align:middle;font-size:13px}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover td{background:#fafbff}

/* SECTION TITLE */
.st{font-family:'Lora',serif;font-size:15px;font-weight:700;color:var(--ink);margin-bottom:12px;display:flex;align-items:center;gap:7px}
.stb{width:3px;height:16px;background:var(--brand);border-radius:2px;flex-shrink:0}

/* PAGE HEADER */
.ph{margin-bottom:22px;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;flex-wrap:wrap}
.pt{font-family:'Lora',serif;font-size:22px;font-weight:700;color:var(--ink);letter-spacing:-.3px}
.ps{font-size:13px;color:var(--muted);margin-top:3px;font-weight:500}

/* GRIDS */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}

/* PAGINATION */
.pgn{display:flex;align-items:center;justify-content:center;gap:3px;margin-top:18px}
.pgb{width:32px;height:32px;border:1.5px solid var(--border);border-radius:7px;background:#fff;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--muted);font-family:inherit;transition:all .15s}
.pgb:hover{border-color:var(--brand);color:var(--brand)}
.pgb.on{background:var(--brand);border-color:var(--brand);color:#fff}

/* MODAL */
.mb{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:300;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);animation:fadeIn .15s}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:#fff;border-radius:14px;padding:24px;width:90%;max-width:500px;box-shadow:0 24px 60px rgba(0,0,0,.18);animation:slideUp .18s ease;max-height:90vh;overflow-y:auto}
.modal-lg{max-width:640px}
@keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.mh{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.mt2{font-family:'Lora',serif;font-size:17px;font-weight:700}

/* TOAST */
.tc{position:fixed;bottom:20px;right:20px;z-index:500;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{background:#fff;border:1px solid var(--border);border-radius:10px;padding:11px 15px;box-shadow:0 8px 24px rgba(0,0,0,.11);display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;min-width:240px;animation:slideIn .2s ease}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
.toast-success{border-left:4px solid var(--teal)}
.toast-error{border-left:4px solid var(--rose)}
.toast-info{border-left:4px solid var(--brand)}

/* MISC */
.divider{height:1px;background:var(--border);margin:14px 0}
.back-btn{display:inline-flex;align-items:center;gap:5px;font-size:13px;color:var(--muted);cursor:pointer;padding:5px 0;margin-bottom:12px;border:none;background:none;font-weight:600;font-family:inherit}
.back-btn:hover{color:var(--brand)}
.empty{text-align:center;padding:44px 20px;color:var(--muted)}
.fc{padding:5px 12px;border-radius:20px;font-size:12.5px;font-weight:700;border:1.5px solid var(--border);cursor:pointer;background:#fff;color:var(--muted);transition:all .15s;font-family:inherit}
.fc:hover{border-color:var(--brand);color:var(--brand)}
.fc.on{background:var(--brand);border-color:var(--brand);color:#fff}
.pb{height:5px;background:var(--border);border-radius:3px;overflow:hidden}
.pf{height:100%;border-radius:3px;transition:width .5s}

/* DROPDOWN */
.drop-menu{position:absolute;top:calc(100%+6px);right:0;background:#fff;border:1px solid var(--border);border-radius:11px;min-width:200px;box-shadow:0 12px 36px rgba(0,0,0,.13);z-index:200;overflow:hidden;animation:popIn .13s ease}
@keyframes popIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
.di{padding:8px 13px;cursor:pointer;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px;color:var(--ink)}
.di:hover{background:var(--bg)}
.di.red{color:var(--rose)}
.d-sep{height:1px;background:var(--border);margin:3px 0}
.d-lbl{padding:8px 13px 3px;font-size:10.5px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px}

/* TOGGLE */
.toggle-track{width:38px;height:21px;border-radius:11px;cursor:pointer;position:relative;transition:background .2s;flex-shrink:0;border:none}
.toggle-thumb{position:absolute;top:2px;width:17px;height:17px;background:#fff;border-radius:9px;transition:left .2s;box-shadow:0 1px 3px rgba(0,0,0,.2)}

/* PROGRESS BAR */
.prog-wrap{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.prog-label{font-size:12.5px;font-weight:600;min-width:100px;color:var(--ink2)}
.prog-bar{flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden}
.prog-fill{height:100%;border-radius:3px}

/* DETAIL LAYOUT */
.detail-grid{display:grid;grid-template-columns:1fr 280px;gap:18px}
.idea-body{font-size:14px;line-height:1.7;color:var(--ink2)}

/* RESPONSIVE */
@media(max-width:1024px){.g4{grid-template-columns:1fr 1fr}}
@media(max-width:768px){.g2,.g3,.g4,.detail-grid{grid-template-columns:1fr}.ih-sb{display:none}.ih-content{padding:16px}}
`;

let cssInjected = false;
export function injectGlobalCSS() {
    if (cssInjected) return;
    cssInjected = true;
    const style = document.createElement('style');
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════
   ICONS
═══════════════════════════════════════════════════════════ */
export const IC = {
    Home:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    Bulb:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 7 7c0 3-1.5 5-3.5 6.5V17H8.5V15.5C6.5 14 5 12 5 9a7 7 0 0 1 7-7z"/></svg>,
    Fire:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C8.5 6 6 9.5 6 13a6 6 0 0 0 12 0c0-1.5-.5-3-1.5-4.5C15 11 14 12 12 12c0-2 1-5 0-10z"/></svg>,
    Eye:    () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    Grid:   () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    Send:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    Mag:    () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    User:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    Bell:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    TUp:    () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
    TDn:    () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
    Chat:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    Chev:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
    Plus:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    Edit:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    Trash:  () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    Bar:    () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    Shield: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    Users:  () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    Out:    () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    Ok:     () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    X:      () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    Back:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    Clock:  () => <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    Dl:     () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    File:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    Bldg:   () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    Key:    () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    Mask:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
    Lock:   () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
export const statusTag = s => ({ approved: 'teal', pending: 'amber', rejected: 'rose' }[s] || 'gray');
export const roleColor = r => ({ ADMIN: 'rose', QA_MANAGER: 'violet', QA_COORDINATOR: 'blue', STAFF: 'teal' }[r] || 'gray');
export const ROLE_LABEL = { ADMIN: 'Administrator', QA_MANAGER: 'QA Manager', QA_COORDINATOR: 'QA Coordinator', STAFF: 'Staff' };

/* ═══════════════════════════════════════════════════════════
   TOAST HOOK
═══════════════════════════════════════════════════════════ */
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const toast = (msg, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
    };
    return [toasts, toast];
}

export function ToastContainer({ toasts }) {
    return (
        <div className="tc">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.type === 'success' && <span style={{ color: 'var(--teal)' }}><IC.Ok /></span>}
                    {t.type === 'error' && <span style={{ color: 'var(--rose)' }}><IC.X /></span>}
                    {t.type === 'info' && <span style={{ color: 'var(--brand)' }}><IC.Bell /></span>}
                    {t.msg}
                </div>
            ))}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   AVATAR
═══════════════════════════════════════════════════════════ */
export function Av({ initials, size = 'md', gradient }) {
    const sizes = { sm: 26, md: 36, lg: 48, xl: 64 };
    const fonts = { sm: 10, md: 13, lg: 16, xl: 21 };
    const radii = { sm: 6, md: 8, lg: 10, xl: 13 };
    const s = sizes[size];
    return (
        <div style={{
            width: s, height: s, borderRadius: radii[size],
            background: initials === '?' ? '#94a3b8' : (gradient || 'linear-gradient(135deg,#2563eb,#e11d48)'),
            color: '#fff', fontWeight: 800, fontSize: fonts[size],
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
            {initials}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR LAYOUT
═══════════════════════════════════════════════════════════ */
export function AppLayout({ children, menuItems, activeMenu, setActiveMenu, roleLabel, topbarTitle, topbarRight }) {
    const session = getAuthSession();
    const user = session?.user;
    const displayName = getDisplayName(user);
    const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    function logout() {
        clearAuthSession();
        window.location.href = '/';
    }

    return (
        <div className="ih-app">
            {/* SIDEBAR */}
            <aside className="ih-sb">
                <div className="ih-sb-logo">
                    <div className="ih-sb-badge">IH</div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 900, fontSize: '14px', lineHeight: 1.2 }}>IdeaHub</div>
                        <div style={{ color: 'rgba(255,255,255,.38)', fontSize: '11px' }}>{roleLabel}</div>
                    </div>
                </div>

                <nav className="ih-sb-nav">
                    {menuItems.map(item => {
                        if (item.type === 'sep') return <div key={item.key} className="ih-sb-sep" />;
                        if (item.type === 'label') return <div key={item.key} className="ih-sb-lbl">{item.label}</div>;
                        return (
                            <button
                                key={item.id}
                                className={`ih-nl ${activeMenu === item.id ? 'active' : ''}`}
                                onClick={() => setActiveMenu(item.id)}
                            >
                                {item.ic}
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="ih-sb-foot">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Av initials={initials} size="sm" />
                        <div style={{ minWidth: 0 }}>
                            <div style={{ color: '#fff', fontWeight: 700, fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                            <div style={{ color: 'rgba(255,255,255,.35)', fontSize: '11px' }}>{roleLabel}</div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        style={{ background: 'none', border: '1px solid rgba(255,255,255,.12)', borderRadius: '7px', color: 'rgba(255,255,255,.4)', fontSize: '12px', cursor: 'pointer', padding: '6px 10px', width: '100%', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        <IC.Out /> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* MAIN */}
            <div className="ih-main">
                {/* TOPBAR */}
                <div className="ih-topbar">
                    <div className="ih-tb-title">{topbarTitle}</div>
                    {topbarRight}
                </div>
                <div className="ih-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   SHARED UI COMPONENTS
═══════════════════════════════════════════════════════════ */

/** Idea card nhỏ dùng chung */
export function IdeaCard({ idea, onClick }) {
    return (
        <div className="idea-card" onClick={() => onClick && onClick(idea)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 7 }}>
                <h3 style={{ fontSize: '14px', lineHeight: 1.4, fontFamily: "'Lora',serif", fontWeight: 700 }}>{idea.title}</h3>
                <span className={`tag tag-${statusTag(idea.status)}`}>{idea.status}</span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{idea.desc}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag tag-blue">{idea.cat}</span>
                {idea.anon && <span className="tag tag-gray" style={{ gap: 3 }}><IC.Mask /> Ẩn danh</span>}
                {idea.docs.length > 0 && <span className="tag tag-gray" style={{ gap: 3 }}><IC.File /> {idea.docs.length} file</span>}
                <span style={{ fontSize: '11.5px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}><IC.Clock /> {idea.date}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Av initials={idea.av} size="sm" />
                    <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{idea.anon ? 'Ẩn danh' : idea.author}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: '12px', color: 'var(--muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><IC.Eye />{idea.views}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><IC.TUp />{idea.up}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><IC.Chat />{idea.comments}</span>
                </div>
            </div>
        </div>
    );
}

/** Ideas list với search + filter + pagination */
export function IdeasListSection({ title, subtitle, ideas, onView, sortFn, showRank, showHeader = true, cats = [] }) {
    const [search, setSearch] = useState('');
    const [cat, setCat] = useState('All');
    const [pg, setPg] = useState(1);
    const PER = 6;



    const list = (sortFn ? [...ideas].sort(sortFn) : ideas)
        .filter(i => cat === 'All' || i.cat === cat)
        .filter(i => !search || i.title.toLowerCase().includes(search.toLowerCase()));

    const pages = Math.ceil(list.length / PER);
    const paged = list.slice((pg - 1) * PER, pg * PER);

    return (
        <div>
            {showHeader && (
                <div className="ph">
                    <div><div className="pt">{title}</div><div className="ps">{subtitle}</div></div>
                </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="ih-sb2">
                    <IC.Mag />
                    <input placeholder="Tìm kiếm ý tưởng..." value={search} onChange={e => { setSearch(e.target.value); setPg(1); }} />
                </div>
                <select className="fi" style={{ width: 'auto', padding: '7px 10px', fontSize: 12.5 }} value={cat} onChange={e => { setCat(e.target.value); setPg(1); }}>
                    <option value="All">Tất cả danh mục</option>
                    {INIT_CATS.map(c => <option key={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="g2">
                {paged.map((idea, i) => (
                    <div key={idea.id} style={{ position: 'relative' }}>
                        {showRank && i < 3 && pg === 1 && (
                            <div style={{ position: 'absolute', top: -8, left: -8, zIndex: 1, width: 24, height: 24, borderRadius: '50%', background: ['#f59e0b', '#94a3b8', '#c97d4a'][i], color: '#fff', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                        )}
                        <IdeaCard idea={idea} onClick={onView} />
                    </div>
                ))}
            </div>
            {list.length === 0 && <div className="empty"><p>Không tìm thấy ý tưởng nào.</p></div>}
            {pages > 1 && (
                <div className="pgn">
                    <button className="pgb" onClick={() => setPg(p => Math.max(1, p - 1))}>‹</button>
                    {Array.from({ length: pages }, (_, i) => (
                        <button key={i} className={`pgb ${pg === i + 1 ? 'on' : ''}`} onClick={() => setPg(i + 1)}>{i + 1}</button>
                    ))}
                    <button className="pgb" onClick={() => setPg(p => Math.min(pages, p + 1))}>›</button>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";

// ─── FIREBASE ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBd2-uxtzSVNCz6DIzrcap3tLB9rUpsIuY",
  authDomain: "lionbooking.firebaseapp.com",
  projectId: "lionbooking",
  storageBucket: "lionbooking.firebasestorage.app",
  messagingSenderId: "760697936631",
  appId: "1:760697936631:web:d7f5db58b987c7604311f2",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// ─── FIRESTORE HELPERS ────────────────────────────────────────────────────────
const fsGet = async (col) => {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};
const fsSet = async (col, id, data) => {
  await setDoc(doc(db, col, id), data);
};
const fsDel = async (col, id) => {
  await deleteDoc(doc(db, col, id));
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PHOTOGRAPHER = { id: "foto", name: "Víctor", initial: "V", role: "photographer", password: "foto123" };
const DEFAULT_AGENTS = [
  { id: "a01", name: "Ana García",  code: "ANA01", password: "ana123", role: "agent" },
  { id: "a02", name: "Carlos Ruiz", code: "CAR02", password: "car123", role: "agent" },
  { id: "a03", name: "María López", code: "MAR03", password: "mar123", role: "agent" },
];
const WORK_START    = 9;
const WORK_END      = 20;
const SESSION_HOURS = 1;

const STATUS_COLORS = {
  Pendiente:  { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  Confirmada: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  Cancelada:  { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444" },
};

const today    = () => new Date().toISOString().split("T")[0];
const pad      = (n) => String(n).padStart(2, "0");
const fmtDate  = (d) => new Date(d + "T12:00:00").toLocaleDateString("es-ES", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
const MONTHS     = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function getBlockedHours(date, blocks, sessions) {
  const hours = new Set();
  blocks.filter(b => b.date === date).forEach(b => { for (let h = b.startH; h < b.endH; h++) hours.add(h); });
  sessions.filter(s => s.date === date && s.status !== "Cancelada").forEach(s => { for (let h = s.startH; h < s.endH; h++) hours.add(h); });
  return hours;
}
function isSlotFree(date, startH, duration, blocks, sessions) {
  const blocked = getBlockedHours(date, blocks, sessions);
  for (let h = startH; h < startH + duration; h++) { if (blocked.has(h)) return false; }
  return true;
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  Camera:   () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Calendar: () => <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Check:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  X:        () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Plus:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Logout:   () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Clock:    () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Home:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Bell:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Users:    () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Lock:     () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
};

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#F7F5F2;color:#1C1917;}
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1C1917;background-image:radial-gradient(ellipse at 20% 50%,rgba(217,119,6,.15) 0%,transparent 60%),radial-gradient(ellipse at 80% 20%,rgba(180,83,9,.1) 0%,transparent 50%);}
.login-card{background:#292524;border:1px solid #44403C;border-radius:20px;padding:48px 40px;width:390px;box-shadow:0 32px 64px rgba(0,0,0,.5);}
.login-logo{display:flex;align-items:center;gap:12px;margin-bottom:32px;}
.login-logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#D97706,#92400E);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;}
.login-logo h1{font-family:'DM Serif Display',serif;font-size:22px;color:#FEF3C7;letter-spacing:-.3px;}
.login-logo span{font-size:11px;color:#78716C;text-transform:uppercase;letter-spacing:1px;display:block;margin-top:2px;}
.login-title{font-family:'DM Serif Display',serif;font-size:28px;color:#FEF3C7;margin-bottom:8px;}
.login-sub{font-size:14px;color:#78716C;margin-bottom:28px;}
.field-label{font-size:12px;font-weight:500;color:#A8A29E;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;}
.field-input{width:100%;background:#1C1917;border:1px solid #44403C;border-radius:10px;padding:12px 14px;font-size:14px;color:#FEF3C7;font-family:'DM Sans',sans-serif;transition:border-color .2s;outline:none;margin-bottom:16px;}
.field-input:focus{border-color:#D97706;}
.field-input::placeholder{color:#57534E;}
.btn-primary{width:100%;background:linear-gradient(135deg,#D97706,#B45309);color:#fff;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .2s;margin-top:4px;}
.btn-primary:hover{opacity:.9;}
.login-error{background:#3F1D1D;border:1px solid #7F1D1D;border-radius:8px;padding:10px 14px;font-size:13px;color:#FCA5A5;margin-bottom:16px;}
.role-tabs{display:flex;gap:8px;margin-bottom:24px;}
.role-tab{flex:1;padding:10px;border-radius:8px;border:1px solid #44403C;background:transparent;color:#78716C;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;}
.role-tab.active{background:#292524;border-color:#D97706;color:#FEF3C7;}
.layout{display:flex;min-height:100vh;}
.sidebar{width:240px;background:#1C1917;display:flex;flex-direction:column;padding:24px 16px;position:fixed;top:0;left:0;height:100vh;z-index:10;}
.sidebar-logo{display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:32px;}
.sidebar-logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#D97706,#92400E);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;}
.sidebar-logo-text{font-family:'DM Serif Display',serif;font-size:16px;color:#FEF3C7;}
.sidebar-logo-sub{font-size:10px;color:#57534E;text-transform:uppercase;letter-spacing:.8px;}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:#78716C;font-size:14px;cursor:pointer;margin-bottom:2px;transition:all .15s;border:none;background:transparent;width:100%;text-align:left;font-family:'DM Sans',sans-serif;}
.nav-item:hover{background:#292524;color:#D6D3D1;}
.nav-item.active{background:#292524;color:#FEF3C7;}
.nav-item .badge{margin-left:auto;background:#D97706;color:#fff;font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;min-width:20px;text-align:center;}
.sidebar-user{margin-top:auto;border-top:1px solid #292524;padding-top:16px;display:flex;align-items:center;gap:10px;}
.user-avatar{width:34px;height:34px;background:linear-gradient(135deg,#D97706,#92400E);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600;flex-shrink:0;}
.user-name{font-size:13px;font-weight:500;color:#D6D3D1;}
.user-role{font-size:11px;color:#57534E;}
.logout-btn{margin-left:auto;background:none;border:none;color:#57534E;cursor:pointer;padding:4px;border-radius:6px;transition:color .15s;}
.logout-btn:hover{color:#D6D3D1;}
.main{margin-left:240px;padding:32px;min-height:100vh;}
.page-header{margin-bottom:28px;}
.page-title{font-family:'DM Serif Display',serif;font-size:30px;color:#1C1917;letter-spacing:-.5px;}
.page-sub{font-size:14px;color:#78716C;margin-top:4px;}
.card{background:#fff;border:1px solid #E7E5E4;border-radius:16px;padding:24px;margin-bottom:16px;}
.card-title{font-size:12px;font-weight:600;color:#78716C;text-transform:uppercase;letter-spacing:.8px;margin-bottom:16px;}
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;}
.stat-card{background:#fff;border:1px solid #E7E5E4;border-radius:12px;padding:18px;}
.stat-val{font-family:'DM Serif Display',serif;font-size:32px;color:#1C1917;}
.stat-label{font-size:12px;color:#78716C;margin-top:2px;}
.hour-row{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;}
.hour-cell{width:56px;height:38px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;cursor:pointer;transition:all .12s;border:1.5px solid transparent;user-select:none;flex-shrink:0;}
.hour-cell.free{background:#F0FDF4;color:#166534;border-color:#BBF7D0;}
.hour-cell.free:hover{background:#DCFCE7;border-color:#86EFAC;}
.hour-cell.blocked-manual{background:#FEE2E2;color:#991B1B;border-color:#FECACA;cursor:default;}
.hour-cell.blocked-session{background:#DBEAFE;color:#1E40AF;border-color:#BFDBFE;cursor:default;}
.hour-cell.selecting{background:#FEF9C3;color:#713F12;border-color:#FDE047;}
.legend{display:flex;gap:16px;flex-wrap:wrap;margin-top:10px;}
.legend-item{display:flex;align-items:center;gap:6px;font-size:12px;color:#78716C;}
.legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0;}
.session-item{border:1px solid #E7E5E4;border-radius:12px;padding:16px 18px;margin-bottom:10px;background:#fff;transition:box-shadow .15s;}
.session-item:hover{box-shadow:0 4px 16px rgba(0,0,0,.06);}
.session-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.session-title{font-size:14px;font-weight:600;color:#1C1917;margin-bottom:4px;}
.session-meta{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
.session-meta-item{display:flex;align-items:center;gap:5px;font-size:12px;color:#78716C;}
.status-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;white-space:nowrap;}
.status-dot{width:6px;height:6px;border-radius:50%;}
.session-actions{display:flex;gap:8px;margin-top:12px;}
.btn-confirm{display:flex;align-items:center;gap:6px;background:#D1FAE5;color:#065F46;border:1px solid #A7F3D0;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;}
.btn-confirm:hover{background:#A7F3D0;}
.btn-cancel{display:flex;align-items:center;gap:6px;background:#FEE2E2;color:#991B1B;border:1px solid #FECACA;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .15s;}
.btn-cancel:hover{background:#FECACA;}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.form-field{display:flex;flex-direction:column;gap:6px;}
.form-field.full{grid-column:1/-1;}
.form-label{font-size:12px;font-weight:500;color:#78716C;}
.form-input{background:#FAFAF9;border:1px solid #E7E5E4;border-radius:8px;padding:10px 12px;font-size:14px;color:#1C1917;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .2s;}
.form-input:focus{border-color:#D97706;background:#fff;}
.btn-submit{background:linear-gradient(135deg,#D97706,#B45309);color:#fff;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .2s;display:flex;align-items:center;gap:8px;}
.btn-submit:hover{opacity:.9;}
.btn-submit:disabled{opacity:.45;cursor:not-allowed;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;}
.cal-day-label{text-align:center;font-size:11px;font-weight:600;color:#78716C;text-transform:uppercase;padding:6px 0;}
.cal-day{min-height:72px;background:#FAFAF9;border:1px solid #F0EFED;border-radius:8px;padding:6px;}
.cal-day.other-month{opacity:.3;}
.cal-day.today{border-color:#D97706;background:#FFFBEB;}
.cal-day-num{font-size:12px;font-weight:500;color:#44403C;margin-bottom:4px;}
.cal-event{font-size:10px;padding:2px 5px;border-radius:4px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cal-event.confirmed{background:#D1FAE5;color:#065F46;}
.cal-event.pending{background:#FEF3C7;color:#92400E;}
.cal-event.blocked{background:#FEE2E2;color:#991B1B;}
.agents-table{width:100%;border-collapse:collapse;}
.agents-table th{font-size:11px;font-weight:600;color:#78716C;text-transform:uppercase;letter-spacing:.6px;padding:8px 12px;text-align:left;border-bottom:1px solid #E7E5E4;}
.agents-table td{padding:12px;font-size:14px;color:#1C1917;border-bottom:1px solid #F5F4F0;}
.agents-table tr:last-child td{border-bottom:none;}
.code-badge{background:#F5F4F0;border:1px solid #E7E5E4;border-radius:6px;padding:3px 8px;font-size:12px;font-family:monospace;color:#57534E;}
.notif{position:fixed;bottom:24px;right:24px;background:#1C1917;color:#FEF3C7;padding:14px 20px;border-radius:12px;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,.3);z-index:9999;display:flex;align-items:center;gap:10px;animation:slideIn .3s ease;}
@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
.notif-dot{width:8px;height:8px;border-radius:50%;background:#10B981;}
.info-box{border-radius:10px;padding:12px 16px;font-size:13px;margin-bottom:12px;}
.info-box.amber{background:#FEF3C7;border:1px solid #FDE68A;color:#92400E;}
.info-box.green{background:#F0FDF4;border:1px solid #BBF7D0;color:#065F46;}
.info-box.blue{background:#EFF6FF;border:1px solid #BFDBFE;color:#1E40AF;}
.empty-state{text-align:center;padding:48px 24px;color:#A8A29E;}
.empty-icon{font-size:40px;margin-bottom:12px;}
.empty-text{font-size:15px;}
.loading{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1C1917;color:#78716C;font-family:'DM Sans',sans-serif;font-size:16px;gap:12px;}
`;

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage]               = useState("dashboard");
  const [sessions, setSessions]       = useState([]);
  const [blocks, setBlocks]           = useState([]);
  const [agents, setAgents]           = useState([]);
  const [notif, setNotif]             = useState(null);
  const [loaded, setLoaded]           = useState(false);

  // Load all data from Firestore on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, b, a] = await Promise.all([
          fsGet("sessions"),
          fsGet("blocks"),
          fsGet("agents"),
        ]);
        setSessions(s);
        setBlocks(b);
        // If no agents in Firestore yet, seed with defaults
        if (a.length === 0) {
          for (const agent of DEFAULT_AGENTS) {
            await fsSet("agents", agent.id, agent);
          }
          setAgents(DEFAULT_AGENTS);
        } else {
          setAgents(a);
        }
      } catch (e) {
        console.error("Error loading data:", e);
      }
      setLoaded(true);
    };
    loadData();
  }, []);

  const toast = (m) => { setNotif(m); setTimeout(() => setNotif(null), 3200); };

  // ── Sessions ──
  const addSession = async (s) => {
    await fsSet("sessions", s.id, s);
    setSessions(prev => [...prev, s]);
  };
  const updateSession = async (id, changes) => {
    const updated = sessions.map(s => s.id === id ? { ...s, ...changes } : s);
    const found = updated.find(s => s.id === id);
    await fsSet("sessions", id, found);
    setSessions(updated);
  };

  // ── Blocks ──
  const addBlock = async (b) => {
    await fsSet("blocks", b.id, b);
    setBlocks(prev => [...prev, b]);
  };
  const deleteBlock = async (id) => {
    await fsDel("blocks", id);
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  // ── Agents ──
  const addAgent = async (a) => {
    await fsSet("agents", a.id, a);
    setAgents(prev => [...prev, a]);
  };
  const deleteAgent = async (id) => {
    await fsDel("agents", id);
    setAgents(prev => prev.filter(a => a.id !== id));
  };

  if (!loaded) return (
    <><style>{css}</style>
    <div className="loading">⏳ Cargando datos…</div>
    </>
  );

  if (!currentUser) return (
    <><style>{css}</style>
    <LoginPage onLogin={u => { setCurrentUser(u); setPage("dashboard"); }} agents={agents} />
    </>
  );

  const u            = currentUser;
  const isPhoto      = u.role === "photographer";
  const pendingCount = sessions.filter(s => s.status === "Pendiente").length;

  const navItems = isPhoto
    ? [
        { id:"dashboard",  label:"Panel",          I:Icon.Home },
        { id:"pending",    label:"Solicitudes",    I:Icon.Bell, badge:pendingCount },
        { id:"calendar",   label:"Calendario",     I:Icon.Calendar },
        { id:"blocks",     label:"Bloquear horas", I:Icon.Lock },
        { id:"agents",     label:"Comerciales",    I:Icon.Users },
      ]
    : [
        { id:"dashboard",  label:"Panel",          I:Icon.Home },
        { id:"book",       label:"Nueva sesión",   I:Icon.Plus },
        { id:"my-sessions",label:"Mis sesiones",   I:Icon.Camera },
        { id:"calendar",   label:"Calendario",     I:Icon.Calendar },
      ];

  return (
    <><style>{css}</style>
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Icon.Camera /></div>
          <div><div className="sidebar-logo-text">PhotoBook</div><div className="sidebar-logo-sub">Inmobiliaria</div></div>
        </div>
        {navItems.map(({ id, label, I, badge }) => (
          <button key={id} className={`nav-item ${page===id?"active":""}`} onClick={() => setPage(id)}>
            <I />{label}{badge > 0 && <span className="badge">{badge}</span>}
          </button>
        ))}
        <div className="sidebar-user">
          <div className="user-avatar">{u.name[0]}</div>
          <div><div className="user-name">{u.name}</div><div className="user-role">{isPhoto?"Fotógrafo":"Comercial"}</div></div>
          <button className="logout-btn" onClick={() => { setCurrentUser(null); setPage("dashboard"); }}><Icon.Logout /></button>
        </div>
      </aside>

      <main className="main">
        {isPhoto ? <>
          {page==="dashboard" && <PhotoDashboard sessions={sessions} />}
          {page==="pending"   && <PendingPage sessions={sessions} agents={agents}
              onConfirm={id => { updateSession(id, { status:"Confirmada" }); toast("✅ Sesión confirmada"); }}
              onCancel ={id => { updateSession(id, { status:"Cancelada"  }); toast("❌ Sesión cancelada");  }} />}
          {page==="calendar"  && <CalPage sessions={sessions} blocks={blocks} isPhoto />}
          {page==="blocks"    && <BlocksPage blocks={blocks} sessions={sessions}
              onAdd   ={b => { addBlock(b);   toast("🔒 Horas bloqueadas");  }}
              onDelete={id => { deleteBlock(id); toast("🔓 Bloqueo eliminado"); }} />}
          {page==="agents"    && <AgentsPage agents={agents}
              onAdd   ={a => { addAgent(a);   toast("👤 Comercial añadido");  }}
              onDelete={id => { deleteAgent(id); toast("🗑️ Eliminado");        }} />}
        </> : <>
          {page==="dashboard"   && <AgentDash sessions={sessions.filter(s=>s.agentId===u.id)} setPage={setPage} />}
          {page==="book"        && <BookPage blocks={blocks} sessions={sessions} user={u}
              onBook={s => { addSession(s); toast("📅 Sesión solicitada"); setPage("my-sessions"); }} />}
          {page==="my-sessions" && <MySessions sessions={sessions.filter(s=>s.agentId===u.id)} />}
          {page==="calendar"    && <CalPage sessions={sessions.filter(s=>s.agentId===u.id||s.status==="Confirmada")} blocks={blocks} isPhoto={false} />}
        </>}
      </main>
    </div>
    {notif && <div className="notif"><span className="notif-dot" />{notif}</div>}
    </>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, agents }) {
  const [role, setRole] = useState("agent");
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");

  const handle = () => {
    setErr("");
    if (role === "photographer") {
      if (pass === PHOTOGRAPHER.password) onLogin(PHOTOGRAPHER);
      else setErr("Contraseña incorrecta.");
    } else {
      const a = agents.find(a =>
        (a.code?.toLowerCase() === code.toLowerCase() || a.email?.toLowerCase() === code.toLowerCase())
        && a.password === pass
      );
      if (a) onLogin(a); else setErr("Código o contraseña incorrectos.");
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon"><Icon.Camera /></div>
          <div><h1>PhotoBook</h1><span>Gestión de sesiones</span></div>
        </div>
        <div className="login-title">Bienvenido</div>
        <div className="login-sub">Accede a tu panel de sesiones fotográficas</div>
        <div className="role-tabs">
          <button className={`role-tab ${role==="agent"?"active":""}`} onClick={() => setRole("agent")}>💼 Comercial</button>
          <button className={`role-tab ${role==="photographer"?"active":""}`} onClick={() => setRole("photographer")}>📷 Fotógrafo</button>
        </div>
        {err && <div className="login-error">{err}</div>}
        <div className="field-label">{role==="agent" ? "Código de acceso" : "Usuario"}</div>
        <input className="field-input" placeholder={role==="agent"?"Ej: ANA01":"fotografo"} value={code} onChange={e=>setCode(e.target.value)} />
        <div className="field-label">Contraseña</div>
        <input className="field-input" type="password" placeholder="••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
        <button className="btn-primary" onClick={handle}>Entrar</button>
        {role==="agent" && <div style={{marginTop:14,fontSize:12,color:"#57534E",textAlign:"center"}}>¿Sin acceso? Contacta con el fotógrafo.</div>}
      </div>
    </div>
  );
}

// ─── PHOTOGRAPHER DASHBOARD ───────────────────────────────────────────────────
function PhotoDashboard({ sessions }) {
  const pending   = sessions.filter(s => s.status==="Pendiente").length;
  const confirmed = sessions.filter(s => s.status==="Confirmada").length;
  const month     = new Date().toISOString().slice(0,7);
  const thisMonth = sessions.filter(s => s.status==="Confirmada" && s.date?.startsWith(month)).length;
  const upcoming  = sessions.filter(s => s.status==="Confirmada" && s.date>=today()).sort((a,b)=>a.date.localeCompare(b.date));

  return (
    <div>
      <div className="page-header"><div className="page-title">Panel del fotógrafo</div><div className="page-sub">Resumen de tu actividad</div></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-val" style={{color:"#F59E0B"}}>{pending}</div><div className="stat-label">Pendientes</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:"#10B981"}}>{confirmed}</div><div className="stat-label">Confirmadas</div></div>
        <div className="stat-card"><div className="stat-val">{thisMonth}</div><div className="stat-label">Este mes</div></div>
      </div>
      {pending > 0 && (
        <div className="info-box amber" style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:20}}>🔔</span>
          <div><strong>Tienes {pending} solicitud{pending>1?"es":""} pendiente{pending>1?"s":""}</strong><br/><span style={{fontSize:12}}>Ve a "Solicitudes" para confirmarlas.</span></div>
        </div>
      )}
      <div className="card">
        <div className="card-title">Próximas sesiones confirmadas</div>
        {upcoming.length === 0
          ? <div className="empty-state"><div className="empty-icon">📷</div><div className="empty-text">No hay sesiones próximas</div></div>
          : upcoming.slice(0,6).map(s => (
            <div key={s.id} className="session-item">
              <div className="session-title">{s.gcTitle}</div>
              <div className="session-meta" style={{marginTop:6}}>
                <span className="session-meta-item"><Icon.Calendar /> {fmtDate(s.date)}</span>
                <span className="session-meta-item"><Icon.Clock /> {pad(s.startH)}:00 – {pad(s.endH)}:00</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── BLOCKS PAGE ──────────────────────────────────────────────────────────────
function BlocksPage({ blocks, sessions, onAdd, onDelete }) {
  const [date,   setDate]   = useState(today());
  const [selStart, setSel]  = useState(null);
  const [selEnd,   setEnd]  = useState(null);
  const [reason, setReason] = useState("");

  const hours = Array.from({ length: WORK_END-WORK_START }, (_,i) => WORK_START+i);
  const manualSet  = new Set(); blocks.filter(b=>b.date===date).forEach(b=>{ for(let h=b.startH;h<b.endH;h++) manualSet.add(h); });
  const sessSet    = new Set(); sessions.filter(s=>s.date===date&&s.status!=="Cancelada").forEach(s=>{ for(let h=s.startH;h<s.endH;h++) sessSet.add(h); });

  const inSel = (h) => selStart!==null && h>=selStart && h<selEnd;

  const handleHour = (h) => {
    if (manualSet.has(h) || sessSet.has(h)) return;
    if (selStart === null) { setSel(h); setEnd(h+1); }
    else if (h >= selStart) { setEnd(h+1); }
    else { setSel(h); setEnd(selStart+1); }
  };

  const handleAdd = () => {
    if (selStart === null) return;
    onAdd({ id: Date.now().toString(), date, startH: selStart, endH: selEnd, reason: reason||"Ocupado" });
    setSel(null); setEnd(null); setReason("");
  };

  const sorted = [...blocks].sort((a,b) => a.date.localeCompare(b.date) || a.startH-b.startH);

  return (
    <div>
      <div className="page-header"><div className="page-title">Bloquear horas</div><div className="page-sub">Todo está libre por defecto. Bloquea solo lo que no puedes.</div></div>
      <div className="card">
        <div className="card-title">1. Selecciona el día</div>
        <input type="date" className="form-input" value={date} min={today()} onChange={e=>{setDate(e.target.value);setSel(null);setEnd(null);}} style={{maxWidth:200}} />
      </div>
      <div className="card">
        <div className="card-title">2. Haz clic en las horas a bloquear</div>
        <div className="info-box blue">Haz clic en la primera hora y luego en la última para seleccionar el rango.</div>
        <div className="hour-row">
          {hours.map(h => {
            const isM=manualSet.has(h), isS=sessSet.has(h), isSel=inSel(h);
            let cls = "hour-cell ";
            if (isM) cls+="blocked-manual";
            else if (isS) cls+="blocked-session";
            else if (isSel) cls+="selecting";
            else cls+="free";
            return <div key={h} className={cls} onClick={()=>handleHour(h)}>{pad(h)}:00</div>;
          })}
        </div>
        <div className="legend">
          <div className="legend-item"><div className="legend-dot" style={{background:"#BBF7D0"}}/>Libre</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FDE047"}}/>Seleccionado</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FECACA"}}/>Bloqueado por ti</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#BFDBFE"}}/>Reserva de comercial</div>
        </div>
        {selStart !== null && (
          <div style={{marginTop:20,display:"flex",alignItems:"flex-end",gap:12,flexWrap:"wrap"}}>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div className="form-label">Franja seleccionada</div>
              <div style={{background:"#FEF9C3",border:"1px solid #FDE047",borderRadius:8,padding:"10px 16px",fontSize:14,fontWeight:500}}>
                {fmtDate(date)} · {pad(selStart)}:00 – {pad(selEnd)}:00 ({selEnd-selStart}h)
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,flex:1,minWidth:160}}>
              <div className="form-label">Motivo (opcional)</div>
              <input className="form-input" placeholder="Médico, reunión…" value={reason} onChange={e=>setReason(e.target.value)} />
            </div>
            <button className="btn-submit" onClick={handleAdd}>🔒 Bloquear</button>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-title">Bloqueos activos ({sorted.length})</div>
        {sorted.length === 0
          ? <div className="empty-state"><div className="empty-icon">🔓</div><div className="empty-text">No hay bloqueos activos</div></div>
          : sorted.map(b => (
            <div key={b.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid #FEE2E2",background:"#FFF5F5",borderRadius:10,padding:"12px 16px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:"#EF4444",flexShrink:0}}/>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{fmtDate(b.date)} · {pad(b.startH)}:00 – {pad(b.endH)}:00</div>
                  <div style={{fontSize:12,color:"#78716C"}}>{b.reason}</div>
                </div>
              </div>
              <button style={{background:"none",border:"none",color:"#D4D0CB",cursor:"pointer",padding:4}} onClick={()=>onDelete(b.id)}><Icon.Trash /></button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── PENDING ──────────────────────────────────────────────────────────────────
function PendingPage({ sessions, agents, onConfirm, onCancel }) {
  const pending  = sessions.filter(s => s.status==="Pendiente");
  const agentMap = Object.fromEntries(agents.map(a => [a.id, a]));

  return (
    <div>
      <div className="page-header"><div className="page-title">Solicitudes pendientes</div><div className="page-sub">Confirma o cancela las sesiones solicitadas</div></div>
      {pending.length === 0
        ? <div className="card"><div className="empty-state"><div className="empty-icon">✅</div><div className="empty-text">No hay solicitudes pendientes</div></div></div>
        : pending.map(s => {
          const sc = STATUS_COLORS[s.status];
          return (
            <div key={s.id} className="session-item">
              <div className="session-top">
                <div>
                  <div className="session-title">{s.gcTitle}</div>
                  <div className="session-meta" style={{marginTop:6}}>
                    <span className="session-meta-item"><Icon.Calendar /> {fmtDate(s.date)}</span>
                    <span className="session-meta-item"><Icon.Clock /> {pad(s.startH)}:00 – {pad(s.endH)}:00</span>
                    <span className="session-meta-item">👤 {agentMap[s.agentId]?.name||"Comercial"}</span>
                  </div>
                  {s.notes && <div style={{marginTop:8,fontSize:13,color:"#78716C"}}>📝 {s.notes}</div>}
                </div>
                <span className="status-badge" style={{background:sc.bg,color:sc.text}}><span className="status-dot" style={{background:sc.dot}}/>{s.status}</span>
              </div>
              <div className="session-actions">
                <button className="btn-confirm" onClick={()=>onConfirm(s.id)}><Icon.Check />Confirmar</button>
                <button className="btn-cancel"  onClick={()=>onCancel(s.id)}><Icon.X />Cancelar</button>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
function CalPage({ sessions, blocks, isPhoto }) {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const first = new Date(year, month, 1).getDay();
  const dim   = new Date(year, month+1, 0).getDate();
  const start = first===0 ? 6 : first-1;
  const cells = [];
  for (let i=0; i<start; i++) cells.push(null);
  for (let d=1; d<=dim; d++) cells.push(d);
  while (cells.length%7 !== 0) cells.push(null);

  const ds    = (d) => `${year}-${pad(month+1)}-${pad(d)}`;
  const tdStr = today();

  return (
    <div>
      <div className="page-header">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div className="page-title">Calendario</div><div className="page-sub">Vista mensual</div></div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button style={{background:"#F5F4F0",border:"1px solid #E7E5E4",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:16}} onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);}}>‹</button>
            <span style={{fontFamily:"DM Serif Display,serif",fontSize:18,minWidth:200,textAlign:"center"}}>{MONTHS[month]} {year}</span>
            <button style={{background:"#F5F4F0",border:"1px solid #E7E5E4",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:16}} onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);}}>›</button>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="cal-grid">
          {DAYS_SHORT.map(d => <div key={d} className="cal-day-label">{d}</div>)}
          {cells.map((d,i) => {
            const dateStr   = d ? ds(d) : null;
            const daySess   = d ? sessions.filter(s=>s.date===dateStr&&s.status!=="Cancelada") : [];
            const dayBlocks = d && isPhoto ? blocks.filter(b=>b.date===dateStr) : [];
            return (
              <div key={i} className={`cal-day ${!d?"other-month":""} ${dateStr===tdStr?"today":""}`}>
                {d && <div className="cal-day-num">{d}</div>}
                {dayBlocks.slice(0,1).map(b => <div key={b.id} className="cal-event blocked">{pad(b.startH)}-{pad(b.endH)}h {b.reason}</div>)}
                {daySess.slice(0,2).map(s => <div key={s.id} className={`cal-event ${s.status==="Confirmada"?"confirmed":"pending"}`}>{pad(s.startH)}h {s.address?.split(" ")[0]}</div>)}
                {(daySess.length+dayBlocks.length) > 3 && <div style={{fontSize:10,color:"#78716C"}}>+{daySess.length+dayBlocks.length-3}</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:16,marginTop:16,flexWrap:"wrap"}}>
          <div className="legend-item"><div className="legend-dot" style={{background:"#D1FAE5",border:"1px solid #A7F3D0"}}/>Confirmada</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FEF3C7",border:"1px solid #FDE68A"}}/>Pendiente</div>
          {isPhoto && <div className="legend-item"><div className="legend-dot" style={{background:"#FEE2E2",border:"1px solid #FECACA"}}/>Bloqueado</div>}
        </div>
      </div>
    </div>
  );
}

// ─── BOOK SESSION ─────────────────────────────────────────────────────────────
function BookPage({ blocks, sessions, user, onBook }) {
  const [date,    setDate]  = useState(today());
  const [selStart, setSel]  = useState(null);
  const [address, setAddr]  = useState("");
  const [city,    setCity]  = useState("");
  const [notes,   setNotes] = useState("");

  const hours = Array.from({ length: WORK_END-WORK_START }, (_,i) => WORK_START+i);
  const manualSet = new Set(); blocks.filter(b=>b.date===date).forEach(b=>{ for(let h=b.startH;h<b.endH;h++) manualSet.add(h); });
  const sessSet   = new Set(); sessions.filter(s=>s.date===date&&s.status!=="Cancelada").forEach(s=>{ for(let h=s.startH;h<s.endH;h++) sessSet.add(h); });

  const handleHour = (h) => { if (manualSet.has(h)||sessSet.has(h)) return; setSel(h); };

  const slotOk  = selStart!==null && selStart+SESSION_HOURS<=WORK_END && isSlotFree(date,selStart,SESSION_HOURS,blocks,sessions);
  const gcTitle = address&&city ? `V - ${user.name} - ${address} - ${city}` : "";

  const handleBook = () => {
    if (!slotOk||!address||!city) return;
    onBook({ id:Date.now().toString(), agentId:user.id, agentName:user.name, date, startH:selStart, endH:selStart+SESSION_HOURS, address, city, notes, status:"Pendiente", gcTitle, createdAt:new Date().toISOString() });
    setSel(null); setAddr(""); setCity(""); setNotes("");
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">Solicitar sesión</div><div className="page-sub">Las horas en rojo no están disponibles. El resto están libres.</div></div>
      <div className="card">
        <div className="card-title">1. Elige el día</div>
        <input type="date" className="form-input" value={date} min={today()} onChange={e=>{setDate(e.target.value);setSel(null);}} style={{maxWidth:200}} />
      </div>
      <div className="card">
        <div className="card-title">2. Elige la hora</div>
        <div className="info-box blue">Haz clic en la hora que quieres. La sesión dura 1 hora. Las horas en rojo no están disponibles.</div>
        <div className="hour-row">
          {hours.map(h => {
            const isM=manualSet.has(h), isS=sessSet.has(h), isSel=h===selStart;
            let cls = "hour-cell ";
            if (isM) cls+="blocked-manual";
            else if (isS) cls+="blocked-session";
            else if (isSel) cls+="selecting";
            else cls+="free";
            return <div key={h} className={cls} onClick={()=>handleHour(h)}>{pad(h)}:00</div>;
          })}
        </div>
        <div className="legend">
          <div className="legend-item"><div className="legend-dot" style={{background:"#BBF7D0"}}/>Libre</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FDE047"}}/>Seleccionado</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FECACA"}}/>No disponible</div>
        </div>
        {selStart !== null && (
          <div className="info-box green" style={{marginTop:16}}>
            Sesión: <strong>{pad(selStart)}:00 – {pad(selStart+SESSION_HOURS)}:00</strong>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-title">3. Datos de la propiedad</div>
        <div className="form-grid">
          <div className="form-field"><div className="form-label">Dirección *</div><input className="form-input" placeholder="Calle Mayor 42" value={address} onChange={e=>setAddr(e.target.value)}/></div>
          <div className="form-field"><div className="form-label">Población *</div><input className="form-input" placeholder="Benicàssim" value={city} onChange={e=>setCity(e.target.value)}/></div>
          <div className="form-field full"><div className="form-label">Notas</div><input className="form-input" placeholder="Acceso por garaje, llamar antes…" value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        </div>
        {gcTitle && <div className="info-box green" style={{marginTop:16}}><strong>Título en calendario:</strong><br/><span style={{fontFamily:"monospace",fontSize:13}}>{gcTitle}</span></div>}
        <button className="btn-submit" style={{marginTop:16}} onClick={handleBook} disabled={!slotOk||!address||!city}><Icon.Calendar /> Solicitar sesión</button>
      </div>
    </div>
  );
}

// ─── AGENT DASHBOARD ──────────────────────────────────────────────────────────
function AgentDash({ sessions, setPage }) {
  const pending  = sessions.filter(s=>s.status==="Pendiente").length;
  const confirmed= sessions.filter(s=>s.status==="Confirmada").length;
  const upcoming = sessions.filter(s=>s.status==="Confirmada"&&s.date>=today()).sort((a,b)=>a.date.localeCompare(b.date));

  return (
    <div>
      <div className="page-header"><div className="page-title">Mi panel</div><div className="page-sub">Estado de tus sesiones fotográficas</div></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-val" style={{color:"#F59E0B"}}>{pending}</div><div className="stat-label">Pendientes</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:"#10B981"}}>{confirmed}</div><div className="stat-label">Confirmadas</div></div>
        <div className="stat-card"><div className="stat-val">{upcoming.length}</div><div className="stat-label">Próximas</div></div>
      </div>
      <button className="btn-submit" style={{marginBottom:20}} onClick={()=>setPage("book")}><Icon.Plus /> Solicitar nueva sesión</button>
      <div className="card">
        <div className="card-title">Próximas confirmadas</div>
        {upcoming.length === 0
          ? <div className="empty-state"><div className="empty-icon">📅</div><div className="empty-text">No tienes sesiones próximas</div></div>
          : upcoming.slice(0,5).map(s => (
            <div key={s.id} className="session-item">
              <div className="session-title">{s.gcTitle}</div>
              <div className="session-meta" style={{marginTop:6}}>
                <span className="session-meta-item"><Icon.Calendar /> {fmtDate(s.date)}</span>
                <span className="session-meta-item"><Icon.Clock /> {pad(s.startH)}:00 – {pad(s.endH)}:00</span>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ─── MY SESSIONS ──────────────────────────────────────────────────────────────
function MySessions({ sessions }) {
  const sorted = [...sessions].sort((a,b) => b.date.localeCompare(a.date));
  return (
    <div>
      <div className="page-header"><div className="page-title">Mis sesiones</div><div className="page-sub">Historial completo</div></div>
      {sorted.length === 0
        ? <div className="card"><div className="empty-state"><div className="empty-icon">📷</div><div className="empty-text">Todavía no tienes sesiones</div></div></div>
        : sorted.map(s => {
          const sc = STATUS_COLORS[s.status]||STATUS_COLORS["Pendiente"];
          return (
            <div key={s.id} className="session-item">
              <div className="session-top">
                <div>
                  <div className="session-title">{s.gcTitle}</div>
                  <div className="session-meta" style={{marginTop:6}}>
                    <span className="session-meta-item"><Icon.Calendar /> {fmtDate(s.date)}</span>
                    <span className="session-meta-item"><Icon.Clock /> {pad(s.startH)}:00 – {pad(s.endH)}:00</span>
                  </div>
                  {s.notes && <div style={{marginTop:6,fontSize:13,color:"#78716C"}}>📝 {s.notes}</div>}
                </div>
                <span className="status-badge" style={{background:sc.bg,color:sc.text}}><span className="status-dot" style={{background:sc.dot}}/>{s.status}</span>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

// ─── AGENTS PAGE ──────────────────────────────────────────────────────────────
function AgentsPage({ agents, onAdd, onDelete }) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pass,  setPass]  = useState("");

  const handleAdd = () => {
    if (!name||!pass) return;
    const code = name.split(" ").map(w=>w[0]).join("").toUpperCase() + pad(agents.length+1);
    onAdd({ id:Date.now().toString(), name, email, phone, password:pass, code, role:"agent" });
    setName(""); setEmail(""); setPhone(""); setPass("");
  };

  return (
    <div>
      <div className="page-header"><div className="page-title">Comerciales</div><div className="page-sub">Gestiona los accesos al portal</div></div>
      <div className="card">
        <div className="card-title">Añadir comercial</div>
        <div className="form-grid">
          <div className="form-field"><div className="form-label">Nombre *</div><input className="form-input" placeholder="Ana García" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div className="form-field"><div className="form-label">Contraseña *</div><input className="form-input" type="password" placeholder="••••••" value={pass} onChange={e=>setPass(e.target.value)}/></div>
          <div className="form-field"><div className="form-label">Email</div><input className="form-input" placeholder="ana@inmobiliaria.com" value={email} onChange={e=>setEmail(e.target.value)}/></div>
          <div className="form-field"><div className="form-label">Teléfono</div><input className="form-input" placeholder="600 000 000" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
        </div>
        <button className="btn-submit" style={{marginTop:12}} onClick={handleAdd}><Icon.Plus /> Añadir</button>
      </div>
      <div className="card">
        <div className="card-title">Lista ({agents.length})</div>
        <table className="agents-table">
          <thead><tr><th>Nombre</th><th>Código</th><th>Email</th><th>Teléfono</th><th></th></tr></thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id}>
                <td style={{fontWeight:500}}>{a.name}</td>
                <td><span className="code-badge">{a.code}</span></td>
                <td style={{color:"#78716C"}}>{a.email||"—"}</td>
                <td style={{color:"#78716C"}}>{a.phone||"—"}</td>
                <td><button style={{background:"none",border:"none",color:"#D4D0CB",cursor:"pointer",padding:4}} onClick={()=>onDelete(a.id)}><Icon.Trash /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

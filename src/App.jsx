import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBd2-uxtzSVNCz6DIzrcap3tLB9rUpsIuY",
  authDomain: "lionbooking.firebaseapp.com",
  projectId: "lionbooking",
  storageBucket: "lionbooking.firebasestorage.app",
  messagingSenderId: "760697936631",
  appId: "1:760697936631:web:d7f5db58b987c7604311f2",
};
const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);
const fsGet    = async (col) => { const s = await getDocs(collection(db, col)); return s.docs.map(d => ({ id: d.id, ...d.data() })); };
const fsSet    = async (col, id, data) => setDoc(doc(db, col, id), data);
const fsDel    = async (col, id) => deleteDoc(doc(db, col, id));
const fsUpdate = async (col, id, data) => updateDoc(doc(db, col, id), data);

const ADMIN_USER    = { id: "admin", name: "Jorge", role: "admin", username: "jorge", password: "admin2024" };
const WORK_START    = 9;
const WORK_END      = 20;
const SESSION_HOURS = 1;
const ROLES         = { admin: "Administrador", photographer: "Fotógrafo", agent: "Comercial" };
const STATUS_COLORS = {
  Pendiente:  { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B" },
  Confirmada: { bg: "#D1FAE5", text: "#065F46", dot: "#10B981" },
  Cancelada:  { bg: "#F3F4F6", text: "#6B7280", dot: "#9CA3AF" },
};
const today    = () => new Date().toISOString().split("T")[0];
const pad      = (n) => String(n).padStart(2, "0");
const fmtDate  = (d) => new Date(d + "T12:00:00").toLocaleDateString("es-ES", { weekday:"long", day:"2-digit", month:"long", year:"numeric" });
const MONTHS     = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const genCode    = (prefix) => prefix + "-" + Math.random().toString(36).slice(2,7).toUpperCase();

function isBillable(sessionDate, sessionStartH) {
  const now = new Date();
  const sessionTime = new Date(sessionDate + "T" + pad(sessionStartH) + ":00:00");
  return (sessionTime - now) / (1000*60*60) < 24;
}
function getBlockedHours(date, blocks, sessions) {
  const h = new Set();
  blocks.filter(b=>b.date===date).forEach(b=>{ for(let i=b.startH;i<b.endH;i++) h.add(i); });
  sessions.filter(s=>s.date===date&&s.status!=="Cancelada").forEach(s=>{ for(let i=s.startH;i<s.endH;i++) h.add(i); });
  return h;
}
function isSlotFree(date, startH, dur, blocks, sessions) {
  const blocked = getBlockedHours(date, blocks, sessions);
  for (let h=startH; h<startH+dur; h++) { if (blocked.has(h)) return false; }
  return true;
}

const Icon = {
  Camera:   ()=><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Calendar: ()=><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Check:    ()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  X:        ()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Plus:     ()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash:    ()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Logout:   ()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Clock:    ()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Home:     ()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Bell:     ()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Users:    ()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Lock:     ()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  Key:      ()=><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Copy:     ()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;background:#F7F5F2;color:#1C1917;}
.auth-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1C1917;background-image:radial-gradient(ellipse at 20% 50%,rgba(217,119,6,.15) 0%,transparent 60%);}
.auth-card{background:#292524;border:1px solid #44403C;border-radius:20px;padding:44px 40px;width:400px;box-shadow:0 32px 64px rgba(0,0,0,.5);}
.auth-logo{display:flex;align-items:center;gap:12px;margin-bottom:28px;}
.auth-logo-icon{width:44px;height:44px;background:linear-gradient(135deg,#D97706,#92400E);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;}
.auth-logo h1{font-family:'DM Serif Display',serif;font-size:22px;color:#FEF3C7;}
.auth-logo span{font-size:11px;color:#78716C;text-transform:uppercase;letter-spacing:1px;display:block;margin-top:1px;}
.auth-title{font-family:'DM Serif Display',serif;font-size:26px;color:#FEF3C7;margin-bottom:6px;}
.auth-sub{font-size:14px;color:#78716C;margin-bottom:24px;}
.auth-tabs{display:flex;gap:8px;margin-bottom:24px;}
.auth-tab{flex:1;padding:10px;border-radius:8px;border:1px solid #44403C;background:transparent;color:#78716C;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .2s;}
.auth-tab.active{background:#292524;border-color:#D97706;color:#FEF3C7;}
.field-label{font-size:12px;font-weight:500;color:#A8A29E;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px;}
.field-input{width:100%;background:#1C1917;border:1px solid #44403C;border-radius:10px;padding:12px 14px;font-size:14px;color:#FEF3C7;font-family:'DM Sans',sans-serif;transition:border-color .2s;outline:none;margin-bottom:14px;}
.field-input:focus{border-color:#D97706;}
.field-input::placeholder{color:#57534E;}
.btn-primary{width:100%;background:linear-gradient(135deg,#D97706,#B45309);color:#fff;border:none;border-radius:10px;padding:13px;font-size:15px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .2s;margin-top:4px;}
.btn-primary:hover{opacity:.9;}
.auth-error{background:#3F1D1D;border:1px solid #7F1D1D;border-radius:8px;padding:10px 14px;font-size:13px;color:#FCA5A5;margin-bottom:14px;}
.layout{display:flex;min-height:100vh;}
.sidebar{width:240px;background:#1C1917;display:flex;flex-direction:column;padding:24px 16px;position:fixed;top:0;left:0;height:100vh;z-index:10;}
.sidebar-logo{display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:28px;}
.sidebar-logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#D97706,#92400E);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;}
.sidebar-logo-text{font-family:'DM Serif Display',serif;font-size:16px;color:#FEF3C7;}
.sidebar-logo-sub{font-size:10px;color:#57534E;text-transform:uppercase;letter-spacing:.8px;}
.nav-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;color:#78716C;font-size:14px;cursor:pointer;margin-bottom:2px;transition:all .15s;border:none;background:transparent;width:100%;text-align:left;font-family:'DM Sans',sans-serif;}
.nav-item:hover{background:#292524;color:#D6D3D1;}
.nav-item.active{background:#292524;color:#FEF3C7;}
.nav-item .badge{margin-left:auto;background:#D97706;color:#fff;font-size:11px;font-weight:600;padding:2px 7px;border-radius:20px;}
.sidebar-user{margin-top:auto;border-top:1px solid #292524;padding-top:16px;display:flex;align-items:center;gap:10px;}
.user-avatar{width:34px;height:34px;background:linear-gradient(135deg,#D97706,#92400E);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600;flex-shrink:0;}
.user-name{font-size:13px;font-weight:500;color:#D6D3D1;}
.user-role{font-size:11px;color:#57534E;}
.logout-btn{margin-left:auto;background:none;border:none;color:#57534E;cursor:pointer;padding:4px;border-radius:6px;}
.logout-btn:hover{color:#D6D3D1;}
.main{margin-left:240px;padding:32px;min-height:100vh;}
.page-header{margin-bottom:28px;}
.page-title{font-family:'DM Serif Display',serif;font-size:30px;color:#1C1917;letter-spacing:-.5px;}
.page-sub{font-size:14px;color:#78716C;margin-top:4px;}
.card{background:#fff;border:1px solid #E7E5E4;border-radius:16px;padding:24px;margin-bottom:16px;}
.card-title{font-size:12px;font-weight:600;color:#78716C;text-transform:uppercase;letter-spacing:.8px;margin-bottom:16px;}
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.stats-grid.three{grid-template-columns:repeat(3,1fr);}
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
.status-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;white-space:nowrap;flex-shrink:0;}
.status-dot{width:6px;height:6px;border-radius:50%;}
.session-actions{display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap;}
.btn-confirm{display:flex;align-items:center;gap:6px;background:#D1FAE5;color:#065F46;border:1px solid #A7F3D0;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;}
.btn-confirm:hover{background:#A7F3D0;}
.btn-cancel{display:flex;align-items:center;gap:6px;background:#FEE2E2;color:#991B1B;border:1px solid #FECACA;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;}
.btn-cancel:hover{background:#FECACA;}
.btn-grey{display:flex;align-items:center;gap:6px;background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB;border-radius:8px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;}
.btn-grey:hover{background:#E5E7EB;}
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
.invite-box{background:#1C1917;border:1px solid #44403C;border-radius:12px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.invite-code{font-family:monospace;font-size:20px;font-weight:700;color:#FEF3C7;letter-spacing:2px;}
.invite-meta{font-size:12px;color:#78716C;margin-top:3px;}
.btn-copy{background:#292524;border:1px solid #44403C;border-radius:8px;padding:8px 14px;color:#D6D3D1;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:6px;}
.btn-copy:hover{background:#44403C;}
.btn-copy.copied{border-color:#10B981;color:#10B981;}
.users-table{width:100%;border-collapse:collapse;}
.users-table th{font-size:11px;font-weight:600;color:#78716C;text-transform:uppercase;letter-spacing:.6px;padding:8px 12px;text-align:left;border-bottom:1px solid #E7E5E4;}
.users-table td{padding:12px;font-size:14px;color:#1C1917;border-bottom:1px solid #F5F4F0;}
.users-table tr:last-child td{border-bottom:none;}
.role-pill{display:inline-flex;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
.role-pill.admin{background:#FEF3C7;color:#92400E;}
.role-pill.photographer{background:#EFF6FF;color:#1E40AF;}
.role-pill.agent{background:#F0FDF4;color:#166534;}
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
.loading{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1C1917;color:#78716C;font-family:'DM Sans',sans-serif;font-size:16px;}
.filter-bar{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
.filter-btn{padding:7px 14px;border-radius:8px;border:1px solid #E7E5E4;background:#fff;color:#78716C;font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;}
.filter-btn.active{background:#1C1917;color:#FEF3C7;border-color:#1C1917;}
`;

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage]               = useState("dashboard");
  const [sessions, setSessions]       = useState([]);
  const [blocks, setBlocks]           = useState([]);
  const [users, setUsers]             = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [notif, setNotif]             = useState(null);
  const [loaded, setLoaded]           = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, b, u, ic] = await Promise.all([fsGet("sessions"), fsGet("blocks"), fsGet("users"), fsGet("inviteCodes")]);
        setSessions(s); setBlocks(b); setUsers(u); setInviteCodes(ic);
      } catch(e) { console.error(e); }
      setLoaded(true);
    })();
  }, []);

  const toast = (m) => { setNotif(m); setTimeout(() => setNotif(null), 3200); };

  const addSession    = async (s) => { await fsSet("sessions", s.id, s); setSessions(p=>[...p,s]); };
  const updateSession = async (id, ch) => { await fsUpdate("sessions", id, ch); setSessions(p=>p.map(s=>s.id===id?{...s,...ch}:s)); };
  const addBlock      = async (b) => { await fsSet("blocks", b.id, b); setBlocks(p=>[...p,b]); };
  const deleteBlock   = async (id) => { await fsDel("blocks", id); setBlocks(p=>p.filter(b=>b.id!==id)); };
  const deleteUser    = async (id) => { await fsDel("users", id); setUsers(p=>p.filter(u=>u.id!==id)); };
  const addInvite     = async (ic) => { await fsSet("inviteCodes", ic.id, ic); setInviteCodes(p=>[...p,ic]); };
  const deleteInvite  = async (id) => { await fsDel("inviteCodes", id); setInviteCodes(p=>p.filter(c=>c.id!==id)); };
  const markCodeUsed  = async (id, name) => { await fsUpdate("inviteCodes", id, {used:true,usedBy:name}); setInviteCodes(p=>p.map(c=>c.id===id?{...c,used:true,usedBy:name}:c)); };

  const handleCancel = async (id) => {
    const s = sessions.find(s=>s.id===id);
    if (!s) return;
    const billable = isBillable(s.date, s.startH);
    await updateSession(id, { status:"Cancelada", billable, cancelledAt:new Date().toISOString() });
    toast("Sesion cancelada");
  };

  if (!loaded) return <><style>{css}</style><div className="loading">Cargando...</div></>;

  if (!currentUser) return (
    <><style>{css}</style>
    <AuthPage users={users} inviteCodes={inviteCodes}
      onLogin={u=>{setCurrentUser(u);setPage("dashboard");}}
      onRegister={async(u,codeId,name)=>{ await fsSet("users",u.id,u); setUsers(p=>[...p,u]); await markCodeUsed(codeId,name); setCurrentUser(u); setPage("dashboard"); }}
    /></>
  );

  const u            = currentUser;
  const isAdmin      = u.role==="admin";
  const isPhoto      = u.role==="photographer";
  const pendingCount = sessions.filter(s=>s.status==="Pendiente").length;

  const navItems = isAdmin
    ? [{id:"dashboard",label:"Panel",I:Icon.Home},{id:"sessions",label:"Sesiones",I:Icon.Calendar,badge:pendingCount},{id:"calendar",label:"Calendario",I:Icon.Calendar},{id:"invites",label:"Codigos acceso",I:Icon.Key},{id:"users",label:"Usuarios",I:Icon.Users}]
    : isPhoto
    ? [{id:"dashboard",label:"Panel",I:Icon.Home},{id:"pending",label:"Solicitudes",I:Icon.Bell,badge:pendingCount},{id:"calendar",label:"Calendario",I:Icon.Calendar},{id:"blocks",label:"Bloquear horas",I:Icon.Lock}]
    : [{id:"dashboard",label:"Panel",I:Icon.Home},{id:"book",label:"Nueva sesion",I:Icon.Plus},{id:"my-sessions",label:"Mis sesiones",I:Icon.Camera},{id:"calendar",label:"Calendario",I:Icon.Calendar}];

  return (
    <><style>{css}</style>
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Icon.Camera/></div>
          <div><div className="sidebar-logo-text">PhotoBook</div><div className="sidebar-logo-sub">Inmobiliaria</div></div>
        </div>
        {navItems.map(({id,label,I,badge})=>(
          <button key={id} className={"nav-item " + (page===id?"active":"")} onClick={()=>setPage(id)}>
            <I/>{label}{badge>0&&<span className="badge">{badge}</span>}
          </button>
        ))}
        <div className="sidebar-user">
          <div className="user-avatar">{u.name[0]}</div>
          <div><div className="user-name">{u.name}</div><div className="user-role">{ROLES[u.role]}</div></div>
          <button className="logout-btn" onClick={()=>{setCurrentUser(null);setPage("dashboard");}}><Icon.Logout/></button>
        </div>
      </aside>
      <main className="main">
        {isAdmin&&<>
          {page==="dashboard"&&<AdminDash sessions={sessions} users={users}/>}
          {page==="sessions"&&<AllSessions sessions={sessions} users={users} onConfirm={id=>{updateSession(id,{status:"Confirmada"});toast("Sesion confirmada");}} onCancel={handleCancel}/>}
          {page==="calendar"&&<CalPage sessions={sessions} blocks={blocks} isPhoto/>}
          {page==="invites"&&<InvitesPage inviteCodes={inviteCodes} onAdd={addInvite} onDelete={deleteInvite}/>}
          {page==="users"&&<UsersPage users={users} onDelete={id=>{deleteUser(id);toast("Usuario eliminado");}}/>}
        </>}
        {isPhoto&&<>
          {page==="dashboard"&&<PhotoDash sessions={sessions}/>}
          {page==="pending"&&<PendingPage sessions={sessions} users={users} onConfirm={id=>{updateSession(id,{status:"Confirmada"});toast("Sesion confirmada");}} onCancel={handleCancel}/>}
          {page==="calendar"&&<CalPage sessions={sessions} blocks={blocks} isPhoto/>}
          {page==="blocks"&&<BlocksPage blocks={blocks} sessions={sessions} onAdd={b=>{addBlock(b);toast("Horas bloqueadas");}} onDelete={id=>{deleteBlock(id);toast("Bloqueo eliminado");}}/>}
        </>}
        {u.role==="agent"&&<>
          {page==="dashboard"&&<AgentDash sessions={sessions.filter(s=>s.agentId===u.id)} setPage={setPage}/>}
          {page==="book"&&<BookPage blocks={blocks} sessions={sessions} user={u} onBook={s=>{addSession(s);toast("Sesion solicitada");setPage("my-sessions");}}/>}
          {page==="my-sessions"&&<MySessions sessions={sessions.filter(s=>s.agentId===u.id)} onCancel={handleCancel}/>}
          {page==="calendar"&&<CalPage sessions={sessions.filter(s=>s.agentId===u.id||s.status==="Confirmada")} blocks={blocks} isPhoto={false}/>}
        </>}
      </main>
    </div>
    {notif&&<div className="notif"><span className="notif-dot"/>{notif}</div>}
    </>
  );
}

function AuthPage({users,inviteCodes,onLogin,onRegister}){
  const [mode,setMode]=useState("login");
  const [name,setName]=useState(""); const [code,setCode]=useState("");
  const [pass,setPass]=useState(""); const [pass2,setPass2]=useState("");
  const [err,setErr]=useState("");
  const handleLogin=()=>{
    setErr("");
    if((code.toLowerCase()==="jorge"||code.toLowerCase()==="admin")&&pass===ADMIN_USER.password){onLogin(ADMIN_USER);return;}
    const u=users.find(u=>u.username?.toLowerCase()===code.toLowerCase()&&u.password===pass);
    if(u) onLogin(u); else setErr("Usuario o contrasena incorrectos.");
  };
  const handleRegister=()=>{
    setErr("");
    if(!name||!code||!pass){setErr("Rellena todos los campos.");return;}
    if(pass!==pass2){setErr("Las contrasenas no coinciden.");return;}
    if(pass.length<6){setErr("Minimo 6 caracteres.");return;}
    const inv=inviteCodes.find(c=>c.code===code.toUpperCase()&&!c.used);
    if(!inv){setErr("Codigo invalido o ya usado.");return;}
    const username=name.toLowerCase().replace(/\s+/g,"");
    if(users.find(u=>u.username===username)){setErr("Ese nombre ya existe.");return;}
    const newUser={id:Date.now().toString(),name,username,password:pass,role:inv.role,createdAt:new Date().toISOString()};
    onRegister(newUser,inv.id,name);
  };
  return(
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo"><div className="auth-logo-icon"><Icon.Camera/></div><div><h1>PhotoBook</h1><span>Gestion de sesiones</span></div></div>
        <div className="auth-tabs">
          <button className={"auth-tab " + (mode==="login"?"active":"")} onClick={()=>{setMode("login");setErr("");}}>Entrar</button>
          <button className={"auth-tab " + (mode==="register"?"active":"")} onClick={()=>{setMode("register");setErr("");}}>Registrarse</button>
        </div>
        {err&&<div className="auth-error">{err}</div>}
        {mode==="login"?<>
          <div className="auth-title">Bienvenido</div>
          <div className="auth-sub">Accede con tu usuario y contrasena</div>
          <div className="field-label">Usuario</div>
          <input className="field-input" placeholder="tu usuario" value={code} onChange={e=>setCode(e.target.value)}/>
          <div className="field-label">Contrasena</div>
          <input className="field-input" type="password" placeholder="......" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          <button className="btn-primary" onClick={handleLogin}>Entrar</button>
        </>:<>
          <div className="auth-title">Crear cuenta</div>
          <div className="auth-sub">Necesitas un codigo de invitacion</div>
          <div className="field-label">Tu nombre completo</div>
          <input className="field-input" placeholder="Ana Garcia" value={name} onChange={e=>setName(e.target.value)}/>
          <div className="field-label">Codigo de invitacion</div>
          <input className="field-input" placeholder="AGT-XXXXX" value={code} onChange={e=>setCode(e.target.value.toUpperCase())} style={{fontFamily:"monospace",letterSpacing:"1px"}}/>
          <div className="field-label">Contrasena</div>
          <input className="field-input" type="password" placeholder="Minimo 6 caracteres" value={pass} onChange={e=>setPass(e.target.value)}/>
          <div className="field-label">Repetir contrasena</div>
          <input className="field-input" type="password" placeholder="......" value={pass2} onChange={e=>setPass2(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleRegister()}/>
          <button className="btn-primary" onClick={handleRegister}>Crear cuenta</button>
        </>}
      </div>
    </div>
  );
}

function AdminDash({sessions,users}){
  const pending=sessions.filter(s=>s.status==="Pendiente").length;
  const confirmed=sessions.filter(s=>s.status==="Confirmada").length;
  const cancelled=sessions.filter(s=>s.status==="Cancelada").length;
  const agents=users.filter(u=>u.role==="agent").length;
  const recent=[...sessions].sort((a,b)=>(b.createdAt||"").localeCompare(a.createdAt||"")).slice(0,5);
  return(
    <div>
      <div className="page-header"><div className="page-title">Panel de administracion</div><div className="page-sub">Vista general de LionBooking</div></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-val" style={{color:"#F59E0B"}}>{pending}</div><div className="stat-label">Pendientes</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:"#10B981"}}>{confirmed}</div><div className="stat-label">Confirmadas</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:"#6B7280"}}>{cancelled}</div><div className="stat-label">Canceladas</div></div>
        <div className="stat-card"><div className="stat-val">{agents}</div><div className="stat-label">Comerciales</div></div>
      </div>
      <div className="card">
        <div className="card-title">Ultimas sesiones</div>
        {recent.length===0?<div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">Sin sesiones todavia</div></div>
        :recent.map(s=>{const sc=STATUS_COLORS[s.status]||STATUS_COLORS["Pendiente"];return(
          <div key={s.id} className="session-item">
            <div className="session-top">
              <div><div className="session-title">{s.gcTitle}</div><div className="session-meta" style={{marginTop:6}}><span className="session-meta-item"><Icon.Calendar/> {fmtDate(s.date)}</span><span className="session-meta-item"><Icon.Clock/> {pad(s.startH)}:00</span></div></div>
              <span className="status-badge" style={{background:sc.bg,color:sc.text}}><span className="status-dot" style={{background:sc.dot}}/>{s.status}</span>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function InvitesPage({inviteCodes,onAdd,onDelete}){
  const [role,setRole]=useState("agent");
  const [copied,setCopied]=useState(null);
  const active=inviteCodes.filter(c=>!c.used);
  const used=inviteCodes.filter(c=>c.used);
  const handleCopy=(code,id)=>{
    const txt="Hola! Te invito a PhotoBook.\n\n1. Entra en: lionbooking.vercel.app\n2. Haz clic en Registrarse\n3. Usa este codigo: " + code + "\n\nHasta pronto!";
    navigator.clipboard.writeText(txt);
    setCopied(id); setTimeout(()=>setCopied(null),2000);
  };
  return(
    <div>
      <div className="page-header"><div className="page-title">Codigos de acceso</div><div className="page-sub">Genera y comparte codigos por WhatsApp</div></div>
      <div className="card">
        <div className="card-title">Generar nuevo codigo</div>
        <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap"}}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div className="form-label">Tipo</div>
            <select className="form-input" value={role} onChange={e=>setRole(e.target.value)} style={{width:180}}>
              <option value="agent">Comercial</option>
              <option value="photographer">Fotografo</option>
            </select>
          </div>
          <button className="btn-submit" onClick={()=>onAdd({id:Date.now().toString(),code:genCode(role==="agent"?"AGT":"FOT"),role,used:false,createdAt:new Date().toISOString()})}><Icon.Key/> Generar</button>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Codigos disponibles ({active.length})</div>
        {active.length===0?<div className="empty-state"><div className="empty-icon">🔑</div><div className="empty-text">Sin codigos activos</div></div>
        :active.map(c=>(
          <div key={c.id} className="invite-box">
            <div><div className="invite-code">{c.code}</div><div className="invite-meta">{c.role==="agent"?"Comercial":"Fotografo"}</div></div>
            <div style={{display:"flex",gap:8}}>
              <button className={"btn-copy " + (copied===c.id?"copied":"")} onClick={()=>handleCopy(c.code,c.id)}><Icon.Copy/>{copied===c.id?"Copiado!":"Copiar WhatsApp"}</button>
              <button style={{background:"none",border:"none",color:"#57534E",cursor:"pointer",padding:4}} onClick={()=>onDelete(c.id)}><Icon.Trash/></button>
            </div>
          </div>
        ))}
      </div>
      {used.length>0&&<div className="card">
        <div className="card-title">Usados ({used.length})</div>
        {used.map(c=>(
          <div key={c.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #F5F4F0"}}>
            <span style={{fontFamily:"monospace",fontSize:14,color:"#A8A29E",textDecoration:"line-through"}}>{c.code}</span>
            <span style={{fontSize:12,color:"#78716C"}}>{c.usedBy}</span>
          </div>
        ))}
      </div>}
    </div>
  );
}

function UsersPage({users,onDelete}){
  const all=[{id:"admin",name:"Jorge",username:"jorge",role:"admin",createdAt:""},...users];
  return(
    <div>
      <div className="page-header"><div className="page-title">Usuarios</div><div className="page-sub">Todos los usuarios registrados</div></div>
      <div className="card">
        <table className="users-table">
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Alta</th><th></th></tr></thead>
          <tbody>{all.map(u=>(
            <tr key={u.id}>
              <td style={{fontWeight:500}}>{u.name}</td>
              <td style={{fontFamily:"monospace",fontSize:13,color:"#78716C"}}>{u.username||"-"}</td>
              <td><span className={"role-pill " + u.role}>{ROLES[u.role]}</span></td>
              <td style={{fontSize:12,color:"#78716C"}}>{u.createdAt?new Date(u.createdAt).toLocaleDateString("es-ES"):"Sistema"}</td>
              <td>{u.id!=="admin"&&<button style={{background:"none",border:"none",color:"#D4D0CB",cursor:"pointer",padding:4}} onClick={()=>onDelete(u.id)}><Icon.Trash/></button>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function AllSessions({sessions,users,onConfirm,onCancel}){
  const [filter,setFilter]=useState("all");
  const userMap=Object.fromEntries(users.map(u=>[u.id,u]));
  const filtered=sessions.filter(s=>filter==="all"||s.status===filter).sort((a,b)=>b.date.localeCompare(a.date));
  return(
    <div>
      <div className="page-header"><div className="page-title">Todas las sesiones</div><div className="page-sub">Gestion completa</div></div>
      <div className="filter-bar">
        {["all","Pendiente","Confirmada","Cancelada"].map(f=>(
          <button key={f} className={"filter-btn " + (filter===f?"active":"")} onClick={()=>setFilter(f)}>{f==="all"?"Todas":f}</button>
        ))}
      </div>
      {filtered.length===0?<div className="card"><div className="empty-state"><div className="empty-icon">📋</div><div className="empty-text">Sin sesiones</div></div></div>
      :filtered.map(s=>{const sc=STATUS_COLORS[s.status]||STATUS_COLORS["Pendiente"];return(
        <div key={s.id} className="session-item">
          <div className="session-top">
            <div>
              <div className="session-title">{s.gcTitle}</div>
              <div className="session-meta" style={{marginTop:6}}>
                <span className="session-meta-item"><Icon.Calendar/> {fmtDate(s.date)}</span>
                <span className="session-meta-item"><Icon.Clock/> {pad(s.startH)}:00 - {pad(s.endH)}:00</span>
                <span className="session-meta-item">👤 {userMap[s.agentId]?.name||s.agentName}</span>
              </div>
              {s.status==="Cancelada"&&s.billable&&<div style={{marginTop:6,fontSize:12,color:"#B45309",fontWeight:500}}>⚠️ Cancelada con menos de 24h</div>}
            </div>
            <span className="status-badge" style={{background:sc.bg,color:sc.text}}><span className="status-dot" style={{background:sc.dot}}/>{s.status}</span>
          </div>
          {s.status==="Pendiente"&&<div className="session-actions">
            <button className="btn-confirm" onClick={()=>onConfirm(s.id)}><Icon.Check/>Confirmar</button>
            <button className="btn-cancel" onClick={()=>onCancel(s.id)}><Icon.X/>Cancelar</button>
          </div>}
        </div>
      );})}
    </div>
  );
}

function PhotoDash({sessions}){
  const pending=sessions.filter(s=>s.status==="Pendiente").length;
  const confirmed=sessions.filter(s=>s.status==="Confirmada").length;
  const upcoming=sessions.filter(s=>s.status==="Confirmada"&&s.date>=today()).sort((a,b)=>a.date.localeCompare(b.date));
  return(
    <div>
      <div className="page-header"><div className="page-title">Panel del fotografo</div><div className="page-sub">Resumen de actividad</div></div>
      <div className="stats-grid three">
        <div className="stat-card"><div className="stat-val" style={{color:"#F59E0B"}}>{pending}</div><div className="stat-label">Pendientes</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:"#10B981"}}>{confirmed}</div><div className="stat-label">Confirmadas</div></div>
        <div className="stat-card"><div className="stat-val">{upcoming.length}</div><div className="stat-label">Proximas</div></div>
      </div>
      {pending>0&&<div className="info-box amber" style={{display:"flex",gap:12,alignItems:"center"}}><span style={{fontSize:20}}>🔔</span><div><strong>{pending} solicitud{pending>1?"es":""} pendiente{pending>1?"s":""}</strong><br/><span style={{fontSize:12}}>Ve a Solicitudes para gestionarlas.</span></div></div>}
      <div className="card">
        <div className="card-title">Proximas confirmadas</div>
        {upcoming.length===0?<div className="empty-state"><div className="empty-icon">📷</div><div className="empty-text">No hay sesiones proximas</div></div>
        :upcoming.slice(0,6).map(s=>(
          <div key={s.id} className="session-item">
            <div className="session-title">{s.gcTitle}</div>
            <div className="session-meta" style={{marginTop:6}}><span className="session-meta-item"><Icon.Calendar/> {fmtDate(s.date)}</span><span className="session-meta-item"><Icon.Clock/> {pad(s.startH)}:00 - {pad(s.endH)}:00</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingPage({sessions,users,onConfirm,onCancel}){
  const pending=sessions.filter(s=>s.status==="Pendiente");
  const userMap=Object.fromEntries(users.map(u=>[u.id,u]));
  return(
    <div>
      <div className="page-header"><div className="page-title">Solicitudes pendientes</div><div className="page-sub">Confirma o cancela las sesiones</div></div>
      {pending.length===0?<div className="card"><div className="empty-state"><div className="empty-icon">✅</div><div className="empty-text">Sin solicitudes pendientes</div></div></div>
      :pending.map(s=>{const sc=STATUS_COLORS[s.status];return(
        <div key={s.id} className="session-item">
          <div className="session-top">
            <div>
              <div className="session-title">{s.gcTitle}</div>
              <div className="session-meta" style={{marginTop:6}}>
                <span className="session-meta-item"><Icon.Calendar/> {fmtDate(s.date)}</span>
                <span className="session-meta-item"><Icon.Clock/> {pad(s.startH)}:00 - {pad(s.endH)}:00</span>
                <span className="session-meta-item">👤 {userMap[s.agentId]?.name||s.agentName}</span>
              </div>
              {s.notes&&<div style={{marginTop:8,fontSize:13,color:"#78716C"}}>📝 {s.notes}</div>}
            </div>
            <span className="status-badge" style={{background:sc.bg,color:sc.text}}><span className="status-dot" style={{background:sc.dot}}/>{s.status}</span>
          </div>
          <div className="session-actions">
            <button className="btn-confirm" onClick={()=>onConfirm(s.id)}><Icon.Check/>Confirmar</button>
            <button className="btn-cancel" onClick={()=>onCancel(s.id)}><Icon.X/>Cancelar</button>
          </div>
        </div>
      );})}
    </div>
  );
}

function BlocksPage({blocks,sessions,onAdd,onDelete}){
  const [date,setDate]=useState(today());
  const [selStart,setSel]=useState(null);
  const [selEnd,setEnd]=useState(null);
  const [reason,setReason]=useState("");
  const hours=Array.from({length:WORK_END-WORK_START},(_,i)=>WORK_START+i);
  const mSet=new Set(); blocks.filter(b=>b.date===date).forEach(b=>{for(let h=b.startH;h<b.endH;h++) mSet.add(h);});
  const sSet=new Set(); sessions.filter(s=>s.date===date&&s.status!=="Cancelada").forEach(s=>{for(let h=s.startH;h<s.endH;h++) sSet.add(h);});
  const inSel=h=>selStart!==null&&h>=selStart&&h<selEnd;
  const handleHour=h=>{
    if(mSet.has(h)||sSet.has(h)) return;
    if(selStart===null){setSel(h);setEnd(h+1);}
    else if(h>=selStart){setEnd(h+1);}
    else{setSel(h);setEnd(selStart+1);}
  };
  const sorted=[...blocks].sort((a,b)=>a.date.localeCompare(b.date)||a.startH-b.startH);
  return(
    <div>
      <div className="page-header"><div className="page-title">Bloquear horas</div><div className="page-sub">Todo libre por defecto. Bloquea solo lo que no puedes.</div></div>
      <div className="card">
        <div className="card-title">1. Dia</div>
        <input type="date" className="form-input" value={date} min={today()} onChange={e=>{setDate(e.target.value);setSel(null);setEnd(null);}} style={{maxWidth:200}}/>
      </div>
      <div className="card">
        <div className="card-title">2. Horas a bloquear</div>
        <div className="info-box blue">Clic en la primera hora y luego en la ultima del rango.</div>
        <div className="hour-row">
          {hours.map(h=>{
            let cls="hour-cell ";
            if(mSet.has(h)) cls+="blocked-manual"; else if(sSet.has(h)) cls+="blocked-session"; else if(inSel(h)) cls+="selecting"; else cls+="free";
            return <div key={h} className={cls} onClick={()=>handleHour(h)}>{pad(h)}:00</div>;
          })}
        </div>
        <div className="legend">
          <div className="legend-item"><div className="legend-dot" style={{background:"#BBF7D0"}}/>Libre</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FDE047"}}/>Seleccionado</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FECACA"}}/>Bloqueado</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#BFDBFE"}}/>Con reserva</div>
        </div>
        {selStart!==null&&<div style={{marginTop:20,display:"flex",alignItems:"flex-end",gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div className="form-label">Franja</div>
            <div style={{background:"#FEF9C3",border:"1px solid #FDE047",borderRadius:8,padding:"10px 16px",fontSize:14,fontWeight:500}}>{pad(selStart)}:00 - {pad(selEnd)}:00 ({selEnd-selStart}h)</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,flex:1,minWidth:160}}>
            <div className="form-label">Motivo (opcional)</div>
            <input className="form-input" placeholder="Medico, reunion..." value={reason} onChange={e=>setReason(e.target.value)}/>
          </div>
          <button className="btn-submit" onClick={()=>{onAdd({id:Date.now().toString(),date,startH:selStart,endH:selEnd,reason:reason||"Ocupado"});setSel(null);setEnd(null);setReason("");}}>Bloquear</button>
        </div>}
      </div>
      <div className="card">
        <div className="card-title">Bloqueos activos ({sorted.length})</div>
        {sorted.length===0?<div className="empty-state"><div className="empty-icon">🔓</div><div className="empty-text">Sin bloqueos</div></div>
        :sorted.map(b=>(
          <div key={b.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",border:"1px solid #FEE2E2",background:"#FFF5F5",borderRadius:10,padding:"12px 16px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#EF4444",flexShrink:0}}/>
              <div><div style={{fontSize:13,fontWeight:500}}>{fmtDate(b.date)} - {pad(b.startH)}:00 - {pad(b.endH)}:00</div><div style={{fontSize:12,color:"#78716C"}}>{b.reason}</div></div>
            </div>
            <button style={{background:"none",border:"none",color:"#D4D0CB",cursor:"pointer",padding:4}} onClick={()=>onDelete(b.id)}><Icon.Trash/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CalPage({sessions,blocks,isPhoto}){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth());
  const first=new Date(year,month,1).getDay();
  const dim=new Date(year,month+1,0).getDate();
  const start=first===0?6:first-1;
  const cells=[];
  for(let i=0;i<start;i++) cells.push(null);
  for(let d=1;d<=dim;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  const ds=d=>year+"-"+pad(month+1)+"-"+pad(d);
  const td=today();
  return(
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
          {DAYS_SHORT.map(d=><div key={d} className="cal-day-label">{d}</div>)}
          {cells.map((d,i)=>{
            const dateStr=d?ds(d):null;
            const daySess=d?sessions.filter(s=>s.date===dateStr&&s.status!=="Cancelada"):[];
            const dayBlocks=d&&isPhoto?blocks.filter(b=>b.date===dateStr):[];
            return(
              <div key={i} className={"cal-day " + (!d?"other-month ":"") + (dateStr===td?"today":"")}>
                {d&&<div className="cal-day-num">{d}</div>}
                {dayBlocks.slice(0,1).map(b=><div key={b.id} className="cal-event blocked">{pad(b.startH)}-{pad(b.endH)}h</div>)}
                {daySess.slice(0,2).map(s=><div key={s.id} className={"cal-event " + (s.status==="Confirmada"?"confirmed":"pending")}>{pad(s.startH)}h {s.address?.split(" ")[0]}</div>)}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:16,marginTop:16,flexWrap:"wrap"}}>
          <div className="legend-item"><div className="legend-dot" style={{background:"#D1FAE5",border:"1px solid #A7F3D0"}}/>Confirmada</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FEF3C7",border:"1px solid #FDE68A"}}/>Pendiente</div>
          {isPhoto&&<div className="legend-item"><div className="legend-dot" style={{background:"#FEE2E2",border:"1px solid #FECACA"}}/>Bloqueado</div>}
        </div>
      </div>
    </div>
  );
}

function BookPage({blocks,sessions,user,onBook}){
  const [date,setDate]=useState(today());
  const [selStart,setSel]=useState(null);
  const [address,setAddr]=useState("");
  const [city,setCity]=useState("");
  const [notes,setNotes]=useState("");
  const hours=Array.from({length:WORK_END-WORK_START},(_,i)=>WORK_START+i);
  const mSet=new Set(); blocks.filter(b=>b.date===date).forEach(b=>{for(let h=b.startH;h<b.endH;h++) mSet.add(h);});
  const sSet=new Set(); sessions.filter(s=>s.date===date&&s.status!=="Cancelada").forEach(s=>{for(let h=s.startH;h<s.endH;h++) sSet.add(h);});
  const slotOk=selStart!==null&&selStart+SESSION_HOURS<=WORK_END&&isSlotFree(date,selStart,SESSION_HOURS,blocks,sessions);
  const gcTitle=address&&city?"V - "+user.name+" - "+address+" - "+city:"";
  const handleBook=()=>{
    if(!slotOk||!address||!city) return;
    onBook({id:Date.now().toString(),agentId:user.id,agentName:user.name,date,startH:selStart,endH:selStart+SESSION_HOURS,address,city,notes,status:"Pendiente",gcTitle,createdAt:new Date().toISOString()});
    setSel(null);setAddr("");setCity("");setNotes("");
  };
  return(
    <div>
      <div className="page-header"><div className="page-title">Solicitar sesion</div><div className="page-sub">Las horas en rojo no estan disponibles.</div></div>
      <div className="card">
        <div className="card-title">1. Elige el dia</div>
        <input type="date" className="form-input" value={date} min={today()} onChange={e=>{setDate(e.target.value);setSel(null);}} style={{maxWidth:200}}/>
      </div>
      <div className="card">
        <div className="card-title">2. Elige la hora</div>
        <div className="info-box blue">La sesion dura 1 hora. Haz clic en la hora que quieres.</div>
        <div className="hour-row">
          {hours.map(h=>{
            const isM=mSet.has(h),isS=sSet.has(h),isSel=h===selStart;
            let cls="hour-cell ";
            if(isM) cls+="blocked-manual"; else if(isS) cls+="blocked-session"; else if(isSel) cls+="selecting"; else cls+="free";
            return <div key={h} className={cls} onClick={()=>{if(isM||isS) return;setSel(h);}}>{pad(h)}:00</div>;
          })}
        </div>
        <div className="legend">
          <div className="legend-item"><div className="legend-dot" style={{background:"#BBF7D0"}}/>Libre</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FDE047"}}/>Seleccionado</div>
          <div className="legend-item"><div className="legend-dot" style={{background:"#FECACA"}}/>No disponible</div>
        </div>
        {selStart!==null&&<div className="info-box green" style={{marginTop:16}}>Sesion: <strong>{pad(selStart)}:00 - {pad(selStart+SESSION_HOURS)}:00</strong></div>}
      </div>
      <div className="card">
        <div className="card-title">3. Datos de la propiedad</div>
        <div className="form-grid">
          <div className="form-field"><div className="form-label">Direccion *</div><input className="form-input" placeholder="Calle Mayor 42" value={address} onChange={e=>setAddr(e.target.value)}/></div>
          <div className="form-field"><div className="form-label">Poblacion *</div><input className="form-input" placeholder="Benicassim" value={city} onChange={e=>setCity(e.target.value)}/></div>
          <div className="form-field full"><div className="form-label">Notas</div><input className="form-input" placeholder="Acceso por garaje, llamar antes..." value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        </div>
        {gcTitle&&<div className="info-box green" style={{marginTop:16}}><strong>Titulo en calendario:</strong><br/><span style={{fontFamily:"monospace",fontSize:13}}>{gcTitle}</span></div>}
        <button className="btn-submit" style={{marginTop:16}} onClick={handleBook} disabled={!slotOk||!address||!city}><Icon.Calendar/> Solicitar sesion</button>
      </div>
    </div>
  );
}

function AgentDash({sessions,setPage}){
  const pending=sessions.filter(s=>s.status==="Pendiente").length;
  const confirmed=sessions.filter(s=>s.status==="Confirmada").length;
  const upcoming=sessions.filter(s=>s.status==="Confirmada"&&s.date>=today()).sort((a,b)=>a.date.localeCompare(b.date));
  return(
    <div>
      <div className="page-header"><div className="page-title">Mi panel</div><div className="page-sub">Estado de tus sesiones fotograficas</div></div>
      <div className="stats-grid three">
        <div className="stat-card"><div className="stat-val" style={{color:"#F59E0B"}}>{pending}</div><div className="stat-label">Pendientes</div></div>
        <div className="stat-card"><div className="stat-val" style={{color:"#10B981"}}>{confirmed}</div><div className="stat-label">Confirmadas</div></div>
        <div className="stat-card"><div className="stat-val">{upcoming.length}</div><div className="stat-label">Proximas</div></div>
      </div>
      <button className="btn-submit" style={{marginBottom:20}} onClick={()=>setPage("book")}><Icon.Plus/> Solicitar nueva sesion</button>
      <div className="card">
        <div className="card-title">Proximas confirmadas</div>
        {upcoming.length===0?<div className="empty-state"><div className="empty-icon">📅</div><div className="empty-text">No tienes sesiones proximas</div></div>
        :upcoming.slice(0,5).map(s=>(
          <div key={s.id} className="session-item">
            <div className="session-title">{s.gcTitle}</div>
            <div className="session-meta" style={{marginTop:6}}><span className="session-meta-item"><Icon.Calendar/> {fmtDate(s.date)}</span><span className="session-meta-item"><Icon.Clock/> {pad(s.startH)}:00 - {pad(s.endH)}:00</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MySessions({sessions,onCancel}){
  const sorted=[...sessions].sort((a,b)=>b.date.localeCompare(a.date));
  return(
    <div>
      <div className="page-header"><div className="page-title">Mis sesiones</div><div className="page-sub">Historial completo</div></div>
      {sorted.length===0?<div className="card"><div className="empty-state"><div className="empty-icon">📷</div><div className="empty-text">Todavia no tienes sesiones</div></div></div>
      :sorted.map(s=>{
        const sc=STATUS_COLORS[s.status]||STATUS_COLORS["Pendiente"];
        const canCancel=s.status==="Pendiente"||s.status==="Confirmada";
        return(
          <div key={s.id} className="session-item">
            <div className="session-top">
              <div>
                <div className="session-title">{s.gcTitle}</div>
                <div className="session-meta" style={{marginTop:6}}>
                  <span className="session-meta-item"><Icon.Calendar/> {fmtDate(s.date)}</span>
                  <span className="session-meta-item"><Icon.Clock/> {pad(s.startH)}:00 - {pad(s.endH)}:00</span>
                </div>
                {s.notes&&<div style={{marginTop:6,fontSize:13,color:"#78716C"}}>📝 {s.notes}</div>}
              </div>
              <span className="status-badge" style={{background:sc.bg,color:sc.text}}><span className="status-dot" style={{background:sc.dot}}/>{s.status}</span>
            </div>
            {canCancel&&<div className="session-actions">
              <button className="btn-grey" onClick={()=>onCancel(s.id)}><Icon.X/>Cancelar sesion</button>
            </div>}
          </div>
        );
      })}
    </div>
  );
}

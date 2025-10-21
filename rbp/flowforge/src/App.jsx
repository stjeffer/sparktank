import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Download, Upload, Info, Heart, Share2, Twitter, Linkedin, Instagram, Link as LinkIcon } from "lucide-react";

/* ===== Multi-select helpers ===== */

function rectFromPoints(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(a.x - b.x);
  const h = Math.abs(a.y - b.y);
  return { x, y, w, h };
}
function rectsOverlap(r, node) {
  const nx = node.x, ny = node.y, nw = NODE_W, nh = NODE_H;
  return !(r.x + r.w < nx || nx + nw < r.x || r.y + r.h < ny || ny + nh < r.y);
}

/* ========= Constants ========= */
const NODE_W = 320;
const NODE_H = 144;
const GRID_SIZE = 40;

const TYPE_META = {
  agent:      { color: "#3b82f6", bg: "bg-blue-50",    icon: "🤖", label: "Agent" },
  data:       { color: "#10b981", bg: "bg-emerald-50", icon: "🗄️", label: "Data" },
  manual:     { color: "#6b7280", bg: "bg-gray-50",    icon: "✍️", label: "Manual" },
  human:      { color: "#f97316", bg: "bg-orange-50",  icon: "👤", label: "Human" },
  thirdparty: { color: "#8b5cf6", bg: "bg-violet-50",  icon: "🔗", label: "3rd-party" },
};
const OWNER_COLORS = [
  ["HR", "#60a5fa"], ["Finance", "#34d399"], ["IT", "#f59e0b"], ["Manager", "#f97316"],
  ["People Ops", "#a78bfa"], ["Owner", "#9ca3af"]
];
const AGENT_COLORS = ["#2563eb","#10b981","#f59e0b","#ef4444","#8b5cf6","#14b8a6","#7c3aed","#e11d48"];

// --- Icons (tiny inline SVGs) ---
const IcPlus = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const IcLink = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M10 13a5 5 0 007.07 0l1.41-1.41a5 5 0 00-7.07-7.07L10 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M14 11a5 5 0 01-7.07 0L5.5 9.57a5 5 0 017.07-7.07L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".4"/></svg>);
const IcSpark = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="8.5" stroke="currentColor" opacity=".25"/></svg>);
const IcInfo = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8.5v.01M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const IcChart = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M4 19h16M6 16l4-6 4 3 4-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const IcUpload = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const IcDownload = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M12 8v12M12 20l-4-4m4 4l4-4M4 4h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>);
const IcDoc = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><path d="M7 3h7l5 5v13H7z" stroke="currentColor" strokeWidth="2"/><path d="M14 3v5h5" stroke="currentColor" strokeWidth="2"/><path d="M9 13h6M9 16h6M9 19h6" stroke="currentColor" strokeWidth="1.6"/></svg>);
const IcPanel = (p)=>(<svg {...p} viewBox="0 0 24 24" fill="none"><rect x="3" y="4.5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M9 4.5v15" stroke="currentColor" strokeWidth="2"/></svg>);

// A tiny pill button for the toolbar
function PillBtn({title, active=false, onClick, children}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`ff-pill-btn ${active ? "ff-pill-active" : ""}`}
    >
      {children}
    </button>
  );
}

function ToolbarStyles(){
  return (
    <style>{`
  .ff-toolbar {
    display: flex;
    align-items: center;
    gap: 0;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    padding: 4px 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,.05);
  }

  .ff-pill-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 32px;
    border: none;
    background: transparent;
    color: #111827;
    cursor: pointer;
    transition: all .15s ease;
  }

  .ff-pill-btn:first-child {
    border-top-left-radius: 999px;
    border-bottom-left-radius: 999px;
  }
  .ff-pill-btn:last-child {
    border-top-right-radius: 999px;
    border-bottom-right-radius: 999px;
  }

  .ff-pill-btn:hover {
    background: #f3f4f6;
  }

  .ff-pill-active {
    background: #111827;
    color: #ffffff;
  }

  .ff-sep {
    width: 1px;
    height: 20px;
    background: #e5e7eb;
    margin: 0 4px;
  }

  .ff-switch {
    width: 40px;
    height: 22px;
    padding: 2px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: #f8fafc;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .ff-switch-dot {
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #111827;
    transition: transform .12s ease;
  }

  .ff-switch.on {
    background: #111827;
  }

  .ff-switch.on .ff-switch-dot {
    background: #fff;
    transform: translateX(18px);
  }
`}</style>
  );
}

/* ========= Utils ========= */
const clamp10 = (v) => Math.max(0, Math.min(10, Math.round(v * 10) / 10));
const addChip = (list, raw) => { const v=(raw||"").trim(); return v ? [ ...(list||[]), v ] : (list||[]); };
const removeChip = (list, idx) => (list||[]).filter((_,i)=>i!==idx);

function filenameFromTitle(title) {
  const t = (title || "flowforge").trim();
  const slug = t.replace(/[\s\/\\]+/g, "-").replace(/[^a-zA-Z0-9\-_.]+/g, "").replace(/-+/g, "-").replace(/^[-_.]+|[-_.]+$/g, "");
  return (slug || "flowforge") + ".json";
}

/* ==== Export-to-Word helpers (place after your utils, before INITIAL) ==== */
function slugify(title = "flowforge") {
  return String(title).trim()
    .replace(/[\s\/\\]+/g, "-")
    .replace(/[^a-zA-Z0-9\-_.]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "") || "flowforge";
}
function filenameDoc(title) { return slugify(title) + ".doc"; }
function escHtml(s) {
  return String(s ?? "")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function valuePlanSeries(valuePlan, maxMonth = 24) {
  const tracks = ["operational","strategic","transformational"];
  const byTrack = Object.fromEntries(tracks.map(t => [t, Array(maxMonth + 1).fill(0)]));
  (valuePlan || []).forEach(m => {
    const track = (m.track || "operational").toLowerCase();
    if (byTrack[track] && m.month != null) {
      const mo = Math.max(0, Math.min(maxMonth, Number(m.month)));
      byTrack[track][mo] += Number(m.value || 0);
    }
  });
  tracks.forEach(t => { for (let i=1;i<=maxMonth;i++) byTrack[t][i] += byTrack[t][i-1]; });
  const combined = Array(maxMonth + 1).fill(0).map((_, i) =>
    tracks.reduce((acc, t) => acc + byTrack[t][i], 0)
  );
  return { t: [...Array(maxMonth + 1).keys()], combined, byTrack };
}

function renderValueChartToDataURL(valuePlan) {
  const { t, combined } = valuePlanSeries(valuePlan, 24);
  const W = 1000, H = 360, PAD = 42;
  const cx = document.createElement("canvas");
  cx.width = W; cx.height = H;
  const ctx = cx.getContext("2d");

  const maxY = Math.max(5, ...combined) * 1.15;
  const X = (i) => PAD + (W - 2 * PAD) * (i / (t.length - 1));
  const Y = (v) => (H - PAD) - (H - 2 * PAD) * (v / maxY);

  ctx.fillStyle = "#ffffff"; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(PAD, H-PAD); ctx.lineTo(W-PAD, H-PAD); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(PAD, PAD);   ctx.lineTo(PAD,   H-PAD); ctx.stroke();

  ctx.strokeStyle = "#111827"; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X(0), Y(combined[0] || 0));
  for (let i = 0; i < combined.length - 1; i++) {
    const x0 = X(i),   y0 = Y(combined[i] || 0);
    const x1 = X(i+1), y1 = Y(combined[i+1] || 0);
    const mx = (x0 + x1) / 2;
    ctx.bezierCurveTo(mx, y0, mx, y1, x1, y1);
  }
  ctx.stroke();

  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillStyle = "#111827";
  ctx.fillText("Combined Value (all tracks)", PAD, PAD - 10);

  return cx.toDataURL("image/png");
}

function buildWordHtml({ title, nodes, connections, valuePlan, chartDataUrl }) {
  const stepBlocks = (nodes || []).map(n => {
    const header = `
      <h3 style="margin:12px 0 4px 0;">${escHtml(n.name)}
        <span style="font-weight:400;color:#6b7280;font-size:12px;"> (${escHtml(n.type)})</span>
      </h3>
      <div style="font-size:12px;color:#374151;margin-bottom:6px;">Owner: <b>${escHtml(n.owner||"")}</b></div>
      ${n.description ? `<p style="margin:6px 0 10px 0;color:#374151;">${escHtml(n.description)}</p>` : ``}
      ${(n.type === "agent" && typeof n.valueImpact==="number")
        ? `<div style="font-size:12px;color:#374151;">Value Impact: <b>${Number(n.valueImpact).toFixed(1)}/10</b></div>`
        : ``}
    `;
    if (n.type !== "agent") return header;
    const a = n.agent || {};
    const lis = (arr) => (arr||[]).map(x=>`<li>${escHtml(x)}</li>`).join("");
    return `
      ${header}
      <div style="padding:10px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:14px;background:#fafafa">
        <div style="font-weight:600;margin-bottom:6px;">Agent Details</div>
        <div style="font-size:12px;color:#374151;">Name: <b>${escHtml(a.name||"")}</b></div>
        ${a.purpose ? `<div style="margin-top:6px;"><span style="font-size:12px;color:#374151;">Description:</span><br/><div style="border:1px solid #e5e7eb;padding:6px;border-radius:6px;background:#fff;">${escHtml(a.purpose)}</div></div>` : ``}
        ${a.system  ? `<div style="margin-top:8px;"><span style="font-size:12px;color:#374151;">Instructions:</span><br/><div style="border:1px solid #e5e7eb;padding:6px;border-radius:6px;background:#fff;white-space:pre-wrap;">${escHtml(a.system)}</div></div>` : ``}
        ${(a.knowledge && a.knowledge.length) ? `<div style="margin-top:8px;"><span style="font-size:12px;color:#374151;">Knowledge:</span><ul style="margin:6px 0 0 18px;">${lis(a.knowledge)}</ul></div>` : ``}
        ${(a.actions   && a.actions.length)   ? `<div style="margin-top:8px;"><span style="font-size:12px;color:#374151;">Actions:</span><ul style="margin:6px 0 0 18px;">${lis(a.actions)}</ul></div>` : ``}
        ${a.trigger ? `<div style="margin-top:8px;font-size:12px;color:#374151;">Trigger: <b>${escHtml(a.trigger)}</b></div>` : ``}
      </div>
    `;
  }).join("");

  const edgeRows = (connections || []).map(c => {
    const from = nodes.find(n=>n.id===c.from)?.name || c.from;
    const to   = nodes.find(n=>n.id===c.to)?.name || c.to;
    const info = [c.label, c.waitMinutes ? `${c.waitMinutes}m` : ""].filter(Boolean).join(" • ");
    return `<tr><td style="border:1px solid #e5e7eb;padding:6px;">${escHtml(from)}</td>
              <td style="border:1px solid #e5e7eb;padding:6px;">${escHtml(to)}</td>
              <td style="border:1px solid #e5e7eb;padding:6px;">${escHtml(info)}</td></tr>`;
  }).join("");

  const milestones = (valuePlan || []).slice().sort((a,b)=>a.month-b.month).map((m,i)=>`
    <tr>
      <td style="border:1px solid #e5e7eb;padding:6px;">${i+1}</td>
      <td style="border:1px solid #e5e7eb;padding:6px;">${Number(m.month)}</td>
      <td style="border:1px solid #e5e7eb;padding:6px;">${escHtml(m.track||"")}</td>
      <td style="border:1px solid #e5e7eb;padding:6px;">${escHtml(m.category||"")}</td>
      <td style="border:1px solid #e5e7eb;padding:6px;">${escHtml(m.stakeholder||"")}</td>
      <td style="border:1px solid #e5e7eb;padding:6px;">${escHtml(m.outcome||"")}</td>
      <td style="border:1px solid #e5e7eb;padding:6px;text-align:right;">${Number(m.value||0).toFixed(1)}</td>
    </tr>
  `).join("");

  const dt = new Date().toLocaleString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escHtml(title)} — Export</title>
  <style>
    body { font-family: "Segoe UI", Roboto, system-ui, -apple-system; color:#111827; }
    h1,h2,h3 { margin: 12px 0 6px 0; }
    table { border-collapse: collapse; width:100%; }
    .card { border:1px solid #e5e7eb; border-radius:10px; padding:12px; background:#fff; margin-top:12px; }
  </style>
</head>
<body>
  <h1>${escHtml(title)}</h1>
  <div style="color:#6b7280;font-size:12px;">Exported ${escHtml(dt)}</div>

  <div class="card">
    <h2>Value Realization (Combined)</h2>
    <img src="${chartDataUrl}" alt="Value Chart" style="max-width:100%;border:1px solid #e5e7eb;border-radius:8px;" />
  </div>

  <div class="card">
    <h2>Milestones</h2>
    <table style="margin-top:6px;">
      <thead>
        <tr>
          <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">#</th>
          <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">Month</th>
          <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">Track</th>
          <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">Category</th>
          <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">Stakeholder</th>
          <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">Outcome</th>
          <th style="text-align:right;border:1px solid #e5e7eb;padding:6px;">Value</th>
        </tr>
      </thead>
      <tbody>
        ${milestones || `<tr><td colspan="7" style="border:1px solid #e5e7eb;padding:6px;color:#6b7280;">None</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>Steps & Agents</h2>
    ${stepBlocks}
  </div>

  <div class="card">
    <h2>Connections</h2>
    <table style="margin-top:6px;">
      <thead><tr>
        <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">From</th>
        <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">To</th>
        <th style="text-align:left;border:1px solid #e5e7eb;padding:6px;">Info</th>
      </tr></thead>
      <tbody>
        ${edgeRows || `<tr><td colspan="3" style="border:1px solid #e5e7eb;padding:6px;color:#6b7280;">None</td></tr>`}
      </tbody>
    </table>
  </div>
</body>
</html>
  `;
}

/* dynamic edge anchors */
function nodeAnchor(node, target) {
  const cx = node.x + NODE_W / 2, cy = node.y + NODE_H / 2;
  const dx = (target.x + NODE_W / 2) - cx;
  const dy = (target.y + NODE_H / 2) - cy;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx >= ady) {
    return { x: dx >= 0 ? node.x + NODE_W : node.x, y: cy };
  } else {
    return { x: cx, y: dy >= 0 ? node.y + NODE_H : node.y };
  }
}
function curvedPath(from, to) {
  const mx = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${mx} ${from.y}, ${mx} ${to.y}, ${to.x} ${to.y}`;
}

/* ========= Initial state ========= */
const INITIAL = {
  title: "New user onboarding",
  mode: "build",
  process: {
    description: ""
  },
    processFlyout: false,
  process: { description: "", owner: "", objectives: "", tags: [] },
  connectMode: false,
  connectFrom: null,
  showInspector: true,
  showOwnershipColors: false,
  agentFlyoutFor: null,
  valueFlyout: false,

  autoMVA: true,
  manualMVAId: null,

  valuePlan: [
    { id: "m1", month: 1,  category: "Experience",   stakeholder: "New hire",    outcome: "Higher onboarding satisfaction", value: 2,   track: "operational", agentId: null },
    { id: "m2", month: 3,  category: "Efficiency",   stakeholder: "HR admin",    outcome: "Reduced query time",             value: 2.4, track: "operational", agentId: null },
    { id: "m3", month: 10, category: "Effectiveness",stakeholder: "HR director", outcome: "Better compliance reporting",    value: 3.6, track: "strategic",   agentId: null },
    { id: "m4", month: 4,  category: "Efficiency",   stakeholder: "IT support",  outcome: "Fewer setup tickets",            value: 2.6, track: "operational", agentId: null },
  ],

  nodes: [
    {
      id: "n1", name: "Hiring Manager", description: "Confirms acceptance & start date, kicks off orchestrator.",
      x: 60, y: 160, owner: "Manager", type: "human", ai: "none", aiConfidence: 20,
      complexity: 2, valueFocus: "efficiency", stakeholders: ["Manager","New Hire"], valueTags: [],
      governanceOwner: "HR", governance: [],
      lever: { sees: "shared", acts: "human", connect: "event", rules: "policy", participates: "internal" },
    },
    {
      id: "n2", name: "Onboarding Orchestrator", description: "Coordinates HR, Payroll and IT provisioning end-to-end.",
      x: 360, y: 320, owner: "People Ops", type: "agent", ai: "orchestrator", aiConfidence: 85,
      complexity: 3, valueFocus: "efficiency", stakeholders: ["HR","Finance","IT","Manager"], valueTags: ["automation","visibility"],
      governanceOwner: "People Ops", governance: [],
      lever: { sees: "shared", acts: "orchestrator", connect: "event", rules: "policy", participates: "internal" },
      agent: { name: "Onboarding Orchestrator", purpose: "", system: "", knowledge: [], actions: [], trigger: "" },
      valueImpact: 8.5,
    },
    {
      id: "n3", name: "HR Agent", description: "Creates worker record, benefits, and compliance tasks.",
      x: 780, y: 240, owner: "HR", type: "agent", ai: "assistant", aiConfidence: 70,
      complexity: 2, valueFocus: "experience", stakeholders: ["HR"], valueTags: ["compliance"],
      governanceOwner: "HR", governance: [],
      lever: { sees: "shared", acts: "human", connect: "event", rules: "policy", participates: "internal" },
      agent: { name: "HR Agent", purpose: "", system: "", knowledge: [], actions: [], trigger: "" },
      valueImpact: 6.0,
    },
    {
      id: "n4", name: "Payroll Agent", description: "Sets up payroll and validates banking and tax info.",
      x: 600, y: 460, owner: "Payroll", type: "agent", ai: "assistant", aiConfidence: 70,
      complexity: 2, valueFocus: "efficiency", stakeholders: ["Payroll"], valueTags: [],
      governanceOwner: "Finance", governance: [],
      lever: { sees: "shared", acts: "human", connect: "event", rules: "policy", participates: "internal" },
      agent: { name: "Payroll Agent", purpose: "", system: "", knowledge: [], actions: [], trigger: "" },
      valueImpact: 7.2,
    },
    {
      id: "n5", name: "IT Provisioning Agent", description: "Creates accounts, assigns licenses, and orders equipment.",
      x: 360, y: 540, owner: "IT", type: "agent", ai: "assistant", aiConfidence: 70,
      complexity: 2, valueFocus: "efficiency", stakeholders: ["IT","Security"], valueTags: [],
      governanceOwner: "IT", governance: [],
      lever: { sees: "shared", acts: "human", connect: "event", rules: "policy", participates: "internal" },
      agent: { name: "IT Provisioning Agent", purpose: "", system: "", knowledge: [], actions: [], trigger: "" },
      valueImpact: 6.8,
    },
  ],
  connections: [
    { id: "c1", from: "n1", to: "n2", waitMinutes: 0,  label: "Trigger" },
    { id: "c2", from: "n2", to: "n3", waitMinutes: 5,  label: "Start HR" },
    { id: "c3", from: "n2", to: "n4", waitMinutes: 5,  label: "Start Payroll" },
    { id: "c4", from: "n2", to: "n5", waitMinutes: 5,  label: "Start IT" },
  ],
};

/* ========= Scoring / MVA ========= */
function scoreProcess(nodes) {
  let flow = 5, intel = 5, value = 5;
  nodes.forEach((n) => {
    const L = n.lever || {};
    if (L.sees === "shared") value += 1; else value -= 0.5;
    if (L.connect === "event") flow += 1.2; else if (L.connect === "manual") flow -= 0.8;
    if (L.acts === "orchestrator" || n.ai === "performer") { flow += 1; intel += 1; }
    if (L.rules === "dynamic") intel += 1; else intel -= 0.3;
    if (n.ai !== "none") intel += 0.5;
    intel += (n.aiConfidence ?? 0) / 100;
    flow -= ((n.complexity ?? 3) - 3) * 0.3;
    const stCount = (n.stakeholders?.length ?? 0);
    if (L.sees === "shared" && stCount >= 2) value += 0.2 * Math.min(3, stCount - 1);
  });
  return { flow: clamp10(flow), intel: clamp10(intel), value: clamp10(value) };
}
function bottleneckScores(nodes, connections) {
  const degIn = Object.fromEntries(nodes.map(n => [n.id, 0]));
  const degOut = Object.fromEntries(nodes.map(n => [n.id, 0]));
  connections.forEach(({from, to}) => { if (degOut[from]!=null) degOut[from]++; if (degIn[to]!=null) degIn[to]++; });
  const scores = {};
  nodes.forEach(n => {
    const L = n.lever || {};
    const degree = (degIn[n.id] + degOut[n.id]);
    let s = 0;
    s += degree * 1.2;
    if (L.connect === "manual") s += 2;
    if (L.sees === "restricted") s += 1;
    if ((L.acts ?? "human") === "human" && (n.ai ?? "none") === "none") s += 1;
    s += ((n.complexity ?? 3) - 3) * 1.0;
    scores[n.id] = Math.max(0, Math.round(s * 10) / 10);
  });
  return { scores, degIn, degOut };
}
function agentValueScore(n, degIn, degOut) {
  if (n.type !== "agent") return -Infinity;
  let v = 0;
  v += (n.valueImpact ?? 0);
  v += (n.aiConfidence ?? 0) / 12;
  v += (degOut[n.id] ?? 0) * 1.1;
  v += (n.valueFocus === "effectiveness" ? 1.2 : n.valueFocus === "experience" ? 1.0 : 1.1);
  v += Math.min(3, (n.stakeholders?.length ?? 0)) * 0.4;
  return v;
}

/* --- tiny icon button for the pill toolbar --- */
function IconButton({ title, onClick, children, active }) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className={[
          "w-9 h-9 grid place-items-center rounded-full transition-all duration-150",
          "text-gray-700 hover:bg-gray-100 active:scale-[.98]",
          active ? "bg-gray-900 text-white hover:bg-gray-900" : ""
        ].join(" ")}
      >
        {children}
      </button>
      {/* Tooltip */}
      <div
        className="absolute left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   text-[11px] text-gray-500 whitespace-nowrap bg-white/90 px-2 py-0.5 rounded-md shadow-sm pointer-events-none"
      >
        {title}
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [sim, setSim] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // Multi-select
const [selectionIds, setSelectionIds] = useState([]); // array of node ids
const [marquee, setMarquee] = useState(null);         // { start:{x,y}, end:{x,y} } in *world* coords

  /* Camera (panning with Space / middle / right mouse) */
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const scale = 1;
  const wrapperRef = useRef(null);
  const draggingCanvas = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  useEffect(() => {
    const kd = (e) => { if (e.code === "Space") setSpaceDown(true); };
    const ku = (e) => { if (e.code === "Space") setSpaceDown(false); };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const scores = useMemo(() => scoreProcess(state.nodes), [state.nodes]);
  const { scores: bn, degIn, degOut } = useMemo(
    () => bottleneckScores(state.nodes, state.connections),
    [state.nodes, state.connections]
  );
  const mvaId = useMemo(() => {
    if (!state.autoMVA && state.manualMVAId) return state.manualMVAId;
    let best = null, bestV = -Infinity;
    state.nodes.forEach(n => {
      const v = agentValueScore(n, degIn, degOut);
      if (v > bestV) { bestV = v; best = n.id; }
    });
    return best;
  }, [state.autoMVA, state.manualMVAId, state.nodes, degIn, degOut]);

  const nodeById = (id) => state.nodes.find((n) => n.id === id);
  const updateNode = (id, patch) => setState((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  const updateGovernance = (id, list) => setState((s) => ({ ...s, nodes: s.nodes.map((n) => (n.id === id ? { ...n, governance: list } : n)) }));

  /* Node drag */
  const draggingNode = useRef({ id: null, sx: 0, sy: 0, ox: 0, oy: 0 });
  const screenToWorld = (sx, sy) => ({ x: (sx - tx) / scale, y: (sy - ty) / scale });
  function onNodeDown(e, node) {
    if (spaceDown || e.button === 1 || e.button === 2) return;
    e.stopPropagation();
    setSelectedId(node.id); setSelectedType("node");
    const rect = wrapperRef.current.getBoundingClientRect();
    const p = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    draggingNode.current = { id: node.id, sx: p.x, sy: p.y, ox: node.x, oy: node.y };
    const move = (ev) => {
      const r = wrapperRef.current.getBoundingClientRect();
      const q = screenToWorld(ev.clientX - r.left, ev.clientY - r.top);
      updateNode(node.id, { x: draggingNode.current.ox + (q.x - draggingNode.current.sx), y: draggingNode.current.oy + (q.y - draggingNode.current.sy) });
    };
    const up = () => window.removeEventListener("mousemove", move);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up, { once: true });
  }

  function onCanvasMouseDown(e) {
  const shouldPan = spaceDown || e.button === 1 || e.button === 2;
  if (shouldPan) {
    // PAN
    draggingCanvas.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
    return;
  }

  // If clicking on blank canvas (left button), start marquee selection
  if (e.button === 0) {
    const rect = wrapperRef.current.getBoundingClientRect();
    const start = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    setMarquee({ start, end: start });

    const move = (ev) => {
      const r = wrapperRef.current.getBoundingClientRect();
      const end = screenToWorld(ev.clientX - r.left, ev.clientY - r.top);
      setMarquee((m) => (m ? { ...m, end } : null));
    };

    const up = () => {
      // finalize selection
      setMarquee((m) => {
        if (!m) return null;
        const box = rectFromPoints(m.start, m.end);
        const selected = state.nodes.filter((n) => rectsOverlap(box, n)).map((n) => n.id);
        setSelectionIds(selected);
        return null;
      });

      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up, { once: true });
    return;
  }

  // default: clear single selection
  setSelectedId(null);
  setSelectedType(null);
}
  useEffect(() => {
    const move = (e) => {
      if (!draggingCanvas.current) return;
      setTx((t) => t + (e.clientX - last.current.x));
      setTy((t) => t + (e.clientY - last.current.y));
      last.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => (draggingCanvas.current = false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

const importRef = useRef(null);

function importJSON(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      setState(s => ({
        ...s,
        title: data.title ?? s.title,
        nodes: Array.isArray(data.nodes) ? data.nodes : s.nodes,
        connections: Array.isArray(data.connections) ? data.connections : s.connections,
        valuePlan: Array.isArray(data.valuePlan) ? data.valuePlan : s.valuePlan,
        autoMVA: data.autoMVA ?? s.autoMVA,
        manualMVAId: data.manualMVAId ?? s.manualMVAId,
      }));
    } catch (err) {
      alert("Invalid JSON file.");
    } finally {
      e.target.value = ""; // reset
    }
  };
  reader.readAsText(file);
}


  /* Actions */
  function addStep() {
    const id = "n" + Math.random().toString(36).slice(2, 7);
    const right = state.nodes.reduce((m, n) => (n.x > m.x ? n : m), state.nodes[0] || { x: 60, y: 160 });
    const n = {
      id, name: "New Step", description: "Describe what happens here.",
      x: (right?.x ?? 60) + 280, y: right?.y ?? 160,
      owner: "Owner", type: "human", ai: "none", aiConfidence: 40, complexity: 2, valueFocus: "efficiency",
      stakeholders: ["Owner"], valueTags: [],
      governanceOwner: "Owner", governance: [],
      agent: { name: "New Agent", purpose: "", system: "", knowledge: [], actions: [], trigger: "" },
      lever: { sees: "restricted", acts: "human", connect: "manual", rules: "policy", participates: "internal" },
    };
    setState((s) => ({ ...s, nodes: [...s.nodes, n] }));
    setSelectedId(id); setSelectedType("node");
  }
  function deleteStep(id) {
    setState((s) => ({
      ...s,
      nodes: s.nodes.filter((n) => n.id !== id),
      connections: s.connections.filter((c) => c.from !== id && c.to !== id),
    }));
    if (selectedId === id) { setSelectedId(null); setSelectedType(null); }
  }
  function toggleConnectMode() {
    setState((s) => ({ ...s, connectMode: !s.connectMode, connectFrom: null }));
  }
  function clickNodeForConnect(nodeId) {
    setState((s) => {
      if (!s.connectMode) return s;
      if (!s.connectFrom) return { ...s, connectFrom: nodeId };
      const from = s.connectFrom, to = nodeId;
      if (s.connections.some((c) => c.from === from && c.to === to)) return { ...s, connectFrom: null };
      const id = "c" + Math.random().toString(36).slice(2,7);
      return { ...s, connections: [...s.connections, { id, from, to, waitMinutes: 0, label: "" }], connectFrom: null };
    });
  }

  function exportJSON() {
    const data = JSON.stringify({
      title: state.title, nodes: state.nodes, connections: state.connections,
      valuePlan: state.valuePlan, autoMVA: state.autoMVA, manualMVAId: state.manualMVAId
    }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = filenameFromTitle(state.title); a.click();
  }

    function importJSON(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setState((s) => ({
          ...s,
          ...data,
          title: data.title || s.title,
          nodes: data.nodes || s.nodes,
          connections: data.connections || s.connections,
          valuePlan: data.valuePlan || s.valuePlan,
          autoMVA: data.autoMVA ?? s.autoMVA,
          manualMVAId: data.manualMVAId ?? s.manualMVAId,
        }));
        alert("Import successful!");
      } catch (err) {
        alert("Invalid JSON file");
        console.error(err);
      }
    };
    reader.readAsText(file);
  }

  function exportWord() {
  const chartUrl = renderValueChartToDataURL(state.valuePlan);
  const html = buildWordHtml({
    title: state.title,
    nodes: state.nodes,
    connections: state.connections,
    valuePlan: state.valuePlan,
    chartDataUrl: chartUrl,
  });
  const blob = new Blob(['\ufeff' + html], { type: "application/msword;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filenameDoc(state.title);
  a.click();
  }

  /* UI */
  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col" onContextMenu={(e)=>{ if (draggingCanvas.current || spaceDown) e.preventDefault(); }}>
      {/* Top bar */}
<div className="flex items-center justify-between px-4 py-2 border-b bg-white/80 backdrop-blur">
 {/* Logo and process name */}
<div className="flex items-center gap-3">
  <img 
    src="/src/assets/nagare-logo.png" 
    alt="Nagare Logo" 
    className="h-6 w-auto opacity-90 hover:opacity-100 transition-opacity" 
  />
</div>
 
 {/* Title input (left)
  <input
    className="text-lg font-semibold px-3 py-1.5 rounded-xl border w-[360px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    value={state.title}
    onChange={(e) => setState(s => ({ ...s, title: e.target.value }))}
    placeholder="Process title"
  />

  {/* LEFT: put your left-side controls here (e.g., Add Step, Connect, MVA toggle) */}
    <div className="flex items-center gap-2">
      {/* example:
      <button onClick={addStep} className="ff-pill-btn">+ Add Step</button>
      <button onClick={toggleConnectMode} className={`ff-pill-btn ${state.connectMode ? 'ff-pill-active' : ''}`}>Add Connection</button>
      */}
    </div>

{/* CENTER: process title in a Google-style pill */}
    <div className="absolute left-1/2 -translate-x-1/2 flex justify-center">
      <input
        aria-label="Process name"
        title="Process name"
        className="w-[560px] max-w-full rounded-full px-5 py-2.5 text-[15px]
                   bg-white ring-1 ring-gray-200 shadow-[0_1px_0_rgba(0,0,0,.04)]
                   focus:outline-none focus:ring-2 focus:ring-blue-500
                   placeholder:text-gray-400 text-gray-800"
        value={state.title}
        onChange={(e) => setState(s => ({ ...s, title: e.target.value }))}
        placeholder="Name your process…"
      />
    </div>


  {/* Icon pill (right) */}
  <div className="flex items-center">
    <div className="flex items-center rounded-full border bg-white shadow-sm px-1 gap-1">
      {/* group 1: model editing */}
      <IconButton title="Add Step" onClick={addStep}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </IconButton>
      <IconButton
        title={state.connectMode ? (state.connectFrom ? "Pick target" : "Pick source") : "Add Connection"}
        onClick={toggleConnectMode}
        active={state.connectMode}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M10.5 13.5l3-3M8 7h0A4 4 0 004 11v0a4 4 0 004 4h1m7-8h0a4 4 0 014 4v0a4 4 0 01-4 4h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* group 2: info / value plan */}
      <IconButton title="Process Info" onClick={() => setState(s => ({ ...s, processFlyout: true }))}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 11v5m0-8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </IconButton>
      <IconButton title="Value Plan" onClick={() => setState(s=>({...s, valueFlyout:true}))} active={state.valueFlyout}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M4 19h16M5 16l4-5 4 3 6-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* group 3: import/export */}
      <IconButton title="Import JSON" onClick={() => document.getElementById('ff-import-json').click()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </IconButton>
      <IconButton title="Export JSON" onClick={exportJSON}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </IconButton>
      <IconButton title="Export Word" onClick={exportWord}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 4h7l4 4v12H7z" stroke="currentColor" strokeWidth="2" />
          <path d="M14 4v4h4" stroke="currentColor" strokeWidth="2" />
        </svg>
      </IconButton>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      {/* group 4: inspector toggle */}
      <IconButton
        title={state.showInspector ? "Hide Inspector" : "Show Inspector"}
        onClick={() => setState(s=>({...s, showInspector: !s.showInspector}))}
        active={state.showInspector}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M10 5v14" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </IconButton>
      <button
  title="Share"
  onClick={() => setShowShare(true)}
  className="p-2 hover:bg-gray-100 rounded-full"
>
  <Heart size={16} className="text-gray-700 transition-colors" />
</button>
    </div>
  </div>

  {/* hidden import input (leave as-is) */}
  <input id="ff-import-json" type="file" accept=".json" className="hidden"
         onChange={(e)=>{ const f=e.target.files?.[0]; if(!f) return;
           const r=new FileReader(); r.onload=()=>{ try{ const data=JSON.parse(r.result); setState(s=>({...s, ...data})); }catch{} }; r.readAsText(f);
         }} />
</div>

      {/* Canvas */}
      <div ref={wrapperRef} className="relative flex-1 overflow-hidden" onMouseDown={onCanvasMouseDown}>
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L0,8 L8,4 z" fill="#111827" />
            </marker>
          </defs>
          <g transform={`translate(${tx},${ty}) scale(${scale})`}>
            <rect x={-10000} y={-10000} width={20000} height={20000} fill="url(#grid)" />

            {/* Edges */}
            {state.connections.map((c) => {
              const a = nodeById(c.from), b = nodeById(c.to); if(!a||!b) return null;
              const A = nodeAnchor(a, b); const B = nodeAnchor(b, a);
              const isLoop = a.id === b.id;
              const d = isLoop
                ? (() => { const ax = a.x + NODE_W, ay = a.y + NODE_H/2; const r=36, cx=ax+60, cy=ay; return `M ${ax} ${ay} C ${cx} ${cy-r}, ${cx} ${cy+r}, ${ax} ${ay}`; })()
                : curvedPath(A, B);
              const color =
                a.lever?.connect === "event" ? "#10b981" :
                a.lever?.connect === "scheduled" ? "#f59e0b" : "#94a3b8";
              const isSel = selectedType==="edge" && selectedId===c.id;
              const lx = (A.x + B.x) / 2, ly = (A.y + B.y) / 2 - 6;

              return (
                <g key={c.id} className="cursor-pointer" onMouseDown={(e)=>{e.stopPropagation(); setSelectedId(c.id); setSelectedType("edge");}}>
                  <path d={d} stroke={isSel ? "#2563eb" : color} strokeWidth={isSel ? 3 : 2} fill="none" markerEnd={!isLoop ? "url(#arrow)" : undefined} />
                  {(!isLoop && (c.waitMinutes>0 || c.label)) && (
                    <text x={lx} y={ly} textAnchor="middle" className="fill-gray-700 text-[10px]">
                      {c.label ? c.label + (c.waitMinutes ? ` • ${c.waitMinutes}m` : "") : `${c.waitMinutes}m`}
                    </text>
                  )}
                  {isLoop && (c.waitMinutes>0 || c.label) && (
                    <text x={a.x + NODE_W + 60} y={a.y + NODE_H/2 - 40} textAnchor="middle" className="fill-gray-700 text-[10px]">
                      {c.label ? c.label + (c.waitMinutes ? ` • ${c.waitMinutes}m` : "") : `${c.waitMinutes}m`}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {state.nodes.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.manual;
              const selected = selectedType==="node" && selectedId===n.id;
              const isMVA = n.id === mvaId;
              const deptColor = state.showOwnershipColors
                ? (OWNER_COLORS.find(([k]) => (n.owner||"").toLowerCase().startsWith(k.toLowerCase()))?.[1] || meta.color)
                : meta.color;

              return (
                <foreignObject key={n.id} x={n.x} y={n.y} width={NODE_W} height={NODE_H}>
                  <div
                    className={`w-80 h-36 ${meta.bg} border-2 rounded-2xl shadow-sm flex flex-col justify-center px-3 cursor-grab ${
                      selected ? "ring-2 ring-blue-400" : ""
                    } ${state.connectMode && state.connectFrom===n.id ? "ring-2 ring-blue-600" : ""}`}
                    style={{ borderColor: deptColor, boxShadow: isMVA ? "0 0 0 6px rgba(234,179,8,0.25)" : undefined }}
                    onMouseDown={(e)=>{ onNodeDown(e, n); if (state.connectMode) clickNodeForConnect(n.id); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold flex items-center gap-2">
                        <span className="text-lg" title={meta.label}>{meta.icon}</span>
                        {n.name}
                        {isMVA && <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-yellow-400 text-yellow-700 bg-yellow-50">⭐ MVA</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {n.type === "agent" ? (
                          <button onMouseDown={(e)=>e.stopPropagation()} onClick={()=> setState((s)=>({...s, agentFlyoutFor: n.id}))}
                            className="text-xs px-2 py-0.5 border rounded hover:bg-gray-50" title="Agent Blueprint">Agent</button>
                        ) : (
                          <button onMouseDown={(e)=>e.stopPropagation()} onClick={()=>{
                              const role = n.ai==="none" ? "assistant" : n.ai;
                              updateNode(n.id,{ type:"agent", ai: role, agent: { name: n.name+" Agent", purpose:"", system:"", knowledge:[], actions:[], trigger:"" } });
                              setState((s)=>({...s, agentFlyoutFor: n.id}));
                            }} className="text-xs px-2 py-0.5 border rounded hover:bg-gray-50" title="Convert to Agent">To Agent</button>
                        )}
                      </div>
                    </div>

                    {n.description && <div className="text-[11px] text-gray-600 leading-tight mt-0.5 line-clamp-2">{n.description}</div>}

                    <div className="mt-1 flex flex-wrap gap-1">
                      {(n.stakeholders||[]).slice(0,4).map((s)=>(
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{s}</span>
                      ))}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Owner: {n.owner} • AI: {n.ai} • In:{degIn[n.id]??0}/Out:{degOut[n.id]??0}
                      {n.type === "agent" && typeof n.valueImpact === "number" && (<> • Value: {n.valueImpact.toFixed(1)}</>)}
                    </div>
                  </div>
                </foreignObject>
              );
            })}
          </g>
        </svg>
      </div>

            {/* Bottom bar */}
      <div className="border-t bg-white px-3 py-2 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Flow: <b>{scores.flow}</b> &nbsp; Intelligence: <b>{scores.intel}</b> &nbsp; Value: <b>{scores.value}</b>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-600">
          <span className="font-medium">Top friction points:</span>
          {([...state.nodes].sort((a,b)=> (bn[b.id]??0)-(bn[a.id]??0)).slice(0,3)).map(n => (
            <span key={n.id} className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              {n.name} ({bn[n.id]})
            </span>
          ))}
        </div>
      </div>

      {/* Inspector (doesn't cover bars) */}
      {state.showInspector && (
        <Inspector
          selectedId={selectedId}
          selectedType={selectedType}
          setSelectedId={setSelectedId}
          setSelectedType={setSelectedType}
          state={state}
          setState={setState}
          nodeById={nodeById}
          updateNode={updateNode}
          updateGovernance={updateGovernance}
          deleteStep={deleteStep}
        />
      )}

      {/* Flyouts */}
      <AgentFlyout state={state} setState={setState} updateNode={updateNode} />
      <ValuePlanFlyout state={state} setState={setState} />
      <ProcessInfoFlyout state={state} setState={setState} />
      <ShareModal open={showShare} onClose={() => setShowShare(false)} state={state} />
    </div>
  );
}

/* ---------- Inspector ---------- */
function Inspector({
  selectedId, selectedType, setSelectedId, setSelectedType,
  state, setState, nodeById, updateNode, updateGovernance, deleteStep
}) {
  if (!selectedId) return null;
  const panelClass = "fixed right-0 w-[28rem] border-l bg-white p-3 overflow-auto z-20";
  const panelStyle = { top: 48, bottom: 44 };

  if (selectedType === "edge") {
    const edge = state.connections.find(c => c.id === selectedId);
    if (!edge) return null;
    const a = nodeById(edge.from), b = nodeById(edge.to);
    const updateEdge = (patch) => setState(s => ({ ...s, connections: s.connections.map(c => c.id===edge.id ? { ...c, ...patch } : c) }));
    const deleteEdge = () => { setState(s => ({ ...s, connections: s.connections.filter(c => c.id!==edge.id) })); setSelectedId(null); setSelectedType(null); };

    return (
      <div className={panelClass} style={panelStyle}>
        <div className="flex items-center justify-between">
          <div className="font-semibold">Connector</div>
          <button className="px-2 py-1 border rounded text-xs" onClick={()=>{setSelectedId(null); setSelectedType(null);}}>Close</button>
        </div>
        <div className="text-xs text-gray-600 mt-1 mb-3">
          From: <b>{a?.name ?? edge.from}</b> → To: <b>{b?.name ?? edge.to}</b>
        </div>
        <label className="text-xs text-gray-500">Label</label>
        <input className="w-full border rounded px-2 py-1 mb-2" value={edge.label ?? ""} onChange={(e)=>updateEdge({label:e.target.value})}/>
        <label className="text-xs text-gray-500">Wait (minutes)</label>
        <input type="number" min={0} className="w-full border rounded px-2 py-1 mb-2" value={edge.waitMinutes ?? 0} onChange={(e)=>updateEdge({waitMinutes:Number(e.target.value)})}/>
        <div className="flex justify-between mt-2">
          <button className="px-3 py-1 border rounded" onClick={()=>updateEdge({label:"",waitMinutes:0})}>Clear</button>
          <button className="px-3 py-1 border rounded text-red-600" onClick={deleteEdge}>Delete Connection</button>
        </div>
      </div>
    );
  }

  const n = nodeById(selectedId); if (!n) return null;
  const meta = TYPE_META[n.type] || TYPE_META.manual;

  const GOV_SUGGESTIONS = {
    none: [],
    assistant: [
      ["PII policy", "Mask/store minimal PII; 30-day retention"],
      ["Human-in-the-loop", "Approval required for external emails"],
      ["Logging", "Prompt/response logging with redaction"],
    ],
    orchestrator: [
      ["Delegation", "Traceability across sub-agents"],
      ["Escalation", "Auto-route exceptions to governance owner"],
      ["Risk checks", "Policy engine prior to action execution"],
    ],
    retriever: [
      ["Citations", "Return source links for all facts"],
      ["Access control", "Enforce RBAC / ABAC scopes"],
    ],
    performer: [
      ["Change control", "Dry-run + approver override"],
      ["Rollback", "Revert plan when validation fails"],
    ],
    advisor: [
      ["Explainability", "Summaries include rationale"],
      ["Bias checks", "Periodic evaluation on sensitive attributes"],
    ],
    collaborator: [
      ["Turn-taking", "Confirm intent before action"],
      ["Guardrails", "No free-form external calls"],
    ],
  };
  function addGovKV() { updateGovernance(n.id, [...(n.governance||[]), { key: "", value: "" }]); }
  function setGovKV(i, patch) { const list=[...(n.governance||[])]; list[i]={...list[i],...patch}; updateGovernance(n.id, list); }
  function delGovKV(i) { updateGovernance(n.id, (n.governance||[]).filter((_,idx)=>idx!==i)); }
  function autoSuggestGov() { updateGovernance(n.id, (GOV_SUGGESTIONS[n.ai]||[]).map(([key,value])=>({key,value}))); }

  return (
    <div className={panelClass} style={panelStyle}>
      <div className="flex items-center justify-between">
        <div className="font-semibold">Inspector</div>
        <div className="text-xs text-gray-500">{meta.label.toUpperCase()}</div>
      </div>

      <div className="space-y-2 mt-2">
        <label className="text-xs text-gray-500">Name</label>
        <input className="w-full border rounded px-2 py-1" value={n.name} onChange={(e)=>updateNode(n.id,{name:e.target.value})}/>

        <label className="text-xs text-gray-500">Owner (department)</label>
        <input className="w-full border rounded px-2 py-1" value={n.owner} onChange={(e)=>updateNode(n.id,{owner:e.target.value})}/>

        <label className="text-xs text-gray-500">Step Type</label>
        <select className="w-full border rounded px-2 py-1" value={n.type} onChange={(e)=>updateNode(n.id,{type:e.target.value})}>
          <option value="agent">agent</option><option value="data">data</option>
          <option value="manual">manual</option><option value="human">human</option><option value="thirdparty">thirdparty</option>
        </select>

        <label className="text-xs text-gray-500">Description</label>
        <textarea className="w-full border rounded px-2 py-1 h-20 text-sm" value={n.description ?? ""} onChange={(e)=>updateNode(n.id,{description:e.target.value})}/>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">AI Role</label>
            <select className="w-full border rounded px-2 py-1" value={n.ai} onChange={(e)=>updateNode(n.id,{ai:e.target.value})}>
              {["none","retriever","advisor","collaborator","orchestrator","assistant","performer"].map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">AI Confidence</label>
            <input type="range" min={0} max={100} value={n.aiConfidence ?? 0} onChange={(e)=>updateNode(n.id,{aiConfidence:Number(e.target.value)})} className="w-full"/>
            <div className="text-xs text-gray-500">{n.aiConfidence ?? 0}%</div>
          </div>
        </div>

        {/* Value & MVA */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500">Value Impact</label>
            <input type="range" min={0} max={10} step={0.1} value={n.valueImpact ?? 0} onChange={(e)=>updateNode(n.id,{ valueImpact: Number(e.target.value) })} className="w-full"/>
            <div className="text-xs text-gray-500">{(n.valueImpact ?? 0).toFixed(1)} / 10</div>
          </div>

          {n.type === "agent" && (
            <div className="col-span-2 flex items-end gap-2">
              <button className="px-3 py-1 border rounded" onClick={() => setState(s => ({ ...s, autoMVA: false, manualMVAId: n.id }))}>Set as MVA</button>
              <button className="px-3 py-1 border rounded" onClick={() => setState(s => ({ ...s, autoMVA: true, manualMVAId: null }))}>Auto MVA</button>
              {!state.autoMVA && state.manualMVAId === n.id && (
                <span className="text-xs px-2 py-1 rounded bg-yellow-50 border border-yellow-300 text-yellow-800">⭐ Current MVA</span>
              )}
            </div>
          )}
        </div>

        {/* Stakeholders */}
        <label className="text-xs text-gray-500">Stakeholders</label>
        <div className="w-full border rounded px-2 py-2">
          <div className="flex flex-wrap gap-1 mb-2">
            {(n.stakeholders||[]).map((s,idx)=>(
              <span key={s+idx} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                {s}<button className="text-gray-500 hover:text-gray-800" onClick={()=>updateNode(n.id,{stakeholders: removeChip(n.stakeholders, idx)})}>×</button>
              </span>
            ))}
          </div>
          <input className="w-full outline-none" placeholder="Type and press Enter or comma"
            onKeyDown={(e)=>{ const d=[",",";","Enter"]; if(d.includes(e.key)){ e.preventDefault(); const raw=e.currentTarget.value.trim(); if(!raw) return; updateNode(n.id,{stakeholders: addChip(n.stakeholders, raw)}); e.currentTarget.value=""; }}}/>
        </div>

        {/* Governance & RAI */}
        <div className="h-px bg-gray-200 my-2" />
        <div className="flex items-center justify-between">
          <div className="font-medium">Governance & Responsible AI</div>
          <button className="text-xs px-2 py-0.5 border rounded" onClick={autoSuggestGov}>Auto-suggest</button>
        </div>

        <label className="text-xs text-gray-500">Governance owner</label>
        <input className="w-full border rounded px-2 py-1" value={n.governanceOwner ?? ""} onChange={(e)=>updateNode(n.id,{governanceOwner:e.target.value})} />

        <div className="mt-2">
          {(n.governance || []).map((kv, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input className="flex-1 border rounded px-2 py-1" placeholder="Requirement key" value={kv.key} onChange={(e)=>setGovKV(i,{key:e.target.value})}/>
              <input className="flex-[2] border rounded px-2 py-1" placeholder="Detail / control" value={kv.value} onChange={(e)=>setGovKV(i,{value:e.target.value})}/>
              <button className="px-2 py-1 border rounded text-red-600" onClick={()=>delGovKV(i)}>Delete</button>
            </div>
          ))}
          <button className="px-3 py-1 border rounded" onClick={addGovKV}>+ Add requirement</button>
        </div>

        {/* Outgoing connections */}
        <div className="h-px bg-gray-200 my-3" />
        <div className="font-medium">Outgoing Connections</div>
        {state.connections.filter(c=>c.from===n.id).length===0 && <div className="text-xs text-gray-500 mt-1">None. Use “Add Connection”.</div>}
        {state.connections.map((c,i)=> c.from===n.id && (
          <EdgeEditor key={c.id} c={c} i={i} state={state} setState={setState} nodeById={nodeById}/>
        ))}

        <div className="mt-3 flex gap-2">
          <button className="px-3 py-1 border rounded text-red-600 ml-auto" onClick={()=>{ deleteStep(n.id); setSelectedId(null); setSelectedType(null); }}>Delete Step</button>
        </div>
      </div>
    </div>
  );
}

/* Edge editor snippet */
function EdgeEditor({ c, i, state, setState, nodeById }) {
  const target = nodeById(c.to);
  function updateConn(index, patch) { setState((s) => { const next=[...s.connections]; next[index] = { ...next[index], ...patch }; return { ...s, connections: next }; }); }
  function deleteConn(index) { setState((s) => ({ ...s, connections: s.connections.filter((_,ii)=>ii!==index) })); }
  return (
    <div className="mt-2 border rounded p-2">
      <div className="text-xs text-gray-500 mb-1">To: <b>{target?.name ?? c.to}</b></div>
      <label className="text-xs text-gray-500">Label</label>
      <input className="w-full border rounded px-2 py-1 mb-2" value={c.label ?? ""} onChange={(e) => updateConn(i, { label: e.target.value })} />
      <label className="text-xs text-gray-500">Wait (minutes)</label>
      <input type="number" min="0" className="w-full border rounded px-2 py-1 mb-2" value={c.waitMinutes ?? 0} onChange={(e) => updateConn(i, { waitMinutes: Number(e.target.value) })} />
      <div className="flex justify-between">
        <button className="px-2 py-1 border rounded" onClick={() => updateConn(i, { waitMinutes: 0, label: "" })}>Clear</button>
        <button className="px-2 py-1 border rounded text-red-600" onClick={() => deleteConn(i)}>Delete Connection</button>
      </div>
    </div>
  );
}

/* Agent Flyout */
function AgentFlyout({ state, setState, updateNode }) {
  const id = state.agentFlyoutFor;
  if (!id) return null;
  const n = state.nodes.find((x) => x.id === id);
  if (!n) return null;

  const a = n.agent || { name: n.name, purpose: "", system: "", knowledge: [], actions: [], trigger: "" };
  const setAgent = (patch) => updateNode(n.id, { agent: { ...a, ...patch } });

  return (
    <div className="fixed inset-0 z-40" aria-modal="true" role="dialog">
      <div className="absolute left-0 right-0 top-12 bottom-0 bg-black/20" onClick={() => setState((s) => ({ ...s, agentFlyoutFor: null }))} />
      <div className="absolute top-12 right-0 bottom-0 w-[38rem] bg-white border-l shadow-xl p-5 overflow-auto" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Agent Details</div>
          <button className="px-3 py-1 border rounded-xl" onClick={() => setState((s) => ({ ...s, agentFlyoutFor: null }))}>Close</button>
        </div>
        <div className="text-sm text-gray-500 mb-3">Node: <b>{n.name}</b> • Role: <b>{n.ai}</b></div>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-xs text-gray-600">Agent Name</label>
            <input className="w-full border rounded-xl px-3 py-2" value={a.name ?? ""} onChange={(e) => setAgent({ name: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-gray-600">Description</label>
            <textarea className="w-full border rounded-xl px-3 py-2 h-18" value={a.purpose ?? ""} onChange={(e) => setAgent({ purpose: e.target.value })} />
          </div>

          <div>
            <label className="text-xs text-gray-600">Instructions</label>
            <textarea className="w-full border rounded-xl px-3 py-2 h-28" value={a.system ?? ""} onChange={(e) => setAgent({ system: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ChipBox title="Knowledge (Enter or comma)" items={a.knowledge || []}
              onAdd={(v)=> setAgent({ knowledge: addChip(a.knowledge||[], v) })}
              onRemove={(i)=> setAgent({ knowledge: (a.knowledge||[]).filter((_,idx)=>idx!==i) })}/>
            <ChipBox title="Actions (Enter or comma)" items={a.actions || []}
              onAdd={(v)=> setAgent({ actions: addChip(a.actions||[], v) })}
              onRemove={(i)=> setAgent({ actions: (a.actions||[]).filter((_,idx)=>idx!==i) })}/>
          </div>

          <div>
            <label className="text-xs text-gray-600">Trigger</label>
            <input className="w-full border rounded-xl px-3 py-2" value={a.trigger ?? ""} onChange={(e) => setAgent({ trigger: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Value Plan Flyout (Tracks ⇄ Agents, curved lines) */
function ValuePlanFlyout({ state, setState }) {

  const svgRef = useRef(null);
const [view, setView] = useState("track"); // "track" | "agent"
const [dragging, setDragging] = useState(null); // { id }
  
  if (!state.valueFlyout) return null;
  
  const agents = state.nodes.filter(n => n.type === "agent");
  
  const CATEGORY_OPTIONS = [
  { value: "efficiency",     label: "Efficiency" },
  { value: "effectiveness",  label: "Effectiveness" },
  { value: "experience",     label: "Experience" },
  { value: "empowerment",    label: "Empowerment" },
  { value: "enablement",     label: "Enablement" },
];
  
  
  const agentMap = Object.fromEntries(agents.map((a,i)=>[a.id, { ...a, color: AGENT_COLORS[i % AGENT_COLORS.length] }]));

  // Normalize
const plan = (state.valuePlan || []).map((m, idx) => ({
  id: m?.id || "m" + (idx + 1),
  month: Number(m?.month ?? 0),
  value: Number(m?.value ?? 0),
  category: m?.category || "",
  stakeholder: m?.stakeholder || "",
  outcome: m?.outcome || "",
  track: m?.track || "operational",
  agentId: (m?.agentId != null ? m.agentId : (agents[0]?.id ?? "")),
  marker: Number(m?.marker ?? (idx + 1)),   // 👈 user-visible dot number
}));

  const width = 980, height = 360, pad = 36, maxMonth = 24;
  const x = (m) => pad + (m / maxMonth) * (width - 2 * pad);

  const tracks = [
    { key: "operational", label: "Operational value", color: "#6b7280", dash: "3 3", width: 2 },
    { key: "strategic", label: "Strategic value", color: "#9ca3af", dash: "6 4", width: 2 },
    { key: "transformational", label: "Transformational value", color: "#9ca3af", dash: "6 2 1 2", width: 2 },
  ];

  // ---- Smooth growth helpers (place above buildTrackSeries) ----

// Tunables: how wide the ramp is around a milestone (in months)
const SMOOTH_LEAD  = 2; // how many months BEFORE the milestone the value starts to rise
const SMOOTH_LAG   = 4; // how many months AFTER  the milestone the value finishes rising

// A clean S-curve (logistic) mapped to [0,1] over t∈[-1,1]
function sCurve01(t) {
  // clamp to avoid tails
  const u = Math.max(-6, Math.min(6, t * 4)); // steeper center, softer tails
  const y = 1 / (1 + Math.exp(-u));           // logistic
  // normalize so s(-1)=0 and s(1)=1
  const y0 = 1 / (1 + Math.exp( 4)); // t=-1 => u=-4
  const y1 = 1 / (1 + Math.exp(-4)); // t= 1 => u= 4
  return (y - y0) / (y1 - y0);
}

/**
 * Adds a smooth S-curve contribution of `delta` centered at `m0` (month)
 * into the cumulative series array `arr` (length maxMonth+1).
 */
function addSCurveContribution(arr, m0, delta, maxMonth) {
  const start = Math.max(0, Math.floor(m0 - SMOOTH_LEAD));
  const end   = Math.min(maxMonth, Math.ceil(m0 + SMOOTH_LAG));
  const span  = end - start || 1;

  // compute normalized S-curve weights across the window
  let last = 0;
  for (let i = 0; i <= span; i++) {
    const t = (i / span) * 2 - 1;       // map 0..span  -> -1..1
    const s = sCurve01(t);              // 0..1
    const inc = (s - last) * delta;     // incremental increase at this step
    arr[start + i] += inc;
    last = s;
  }
  // enforce monotonic increasing
  for (let i = start + 1; i <= maxMonth; i++) {
    if (arr[i] < arr[i - 1]) arr[i] = arr[i - 1];
  }
}

// === Smooth value accrual helpers (place above buildTrackSeries/buildAgentSeries) ===

// Small Gaussian kernel generator (σ in "months")
function gaussianKernel(sigma) {
  const r = Math.max(1, Math.ceil(sigma * 3)); // radius ~ 3σ
  const k = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const w = Math.exp(-(i * i) / (2 * sigma * sigma));
    k.push(w);
    sum += w;
  }
  // normalize to 1
  return k.map(w => w / sum);
}

// Discrete 1D convolution with zero padding
function convolve(src, kernel) {
  const r = Math.floor(kernel.length / 2);
  const out = new Array(src.length).fill(0);
  for (let i = 0; i < src.length; i++) {
    let acc = 0;
    for (let j = 0; j < kernel.length; j++) {
      const ii = i + j - r;
      if (ii >= 0 && ii < src.length) acc += src[ii] * kernel[j];
    }
    out[i] = acc;
  }
  return out;
}

// Turn milestone values into a smooth, monotonic cumulative series.
// maxMonth is your horizontal domain upper bound.
function smoothCumulativeFromMilestones(milestones, maxMonth, sigma = 2.8) {
  // 1) impulses: value added *at* each month
  const impulses = new Array(maxMonth + 1).fill(0);
  let total = 0;
  for (const m of milestones) {
    const idx = Math.max(0, Math.min(maxMonth, Math.round(m.month)));
    const v = Number(m.value || 0);
    impulses[idx] += v;
    total += v;
  }

  // 2) smooth the impulses -> "rate" of value accrual per month
  const kernel = gaussianKernel(sigma);
  const rate = convolve(impulses, kernel);

  // 3) cumulative sum of rate -> smooth, monotonic value curve
  const cum = new Array(maxMonth + 1).fill(0);
  for (let i = 1; i <= maxMonth; i++) cum[i] = cum[i - 1] + rate[i];

  // 4) rescale so final value matches the exact milestone total
  const scale = total > 0 ? (total / (cum[maxMonth] || 1)) : 1;
  for (let i = 0; i <= maxMonth; i++) cum[i] *= scale;

  return cum;
}

function buildTrackSeries() {
  const maxMonth = 24;

  // group milestones by track
  const byTrackMilestones = Object.fromEntries(
    tracks.map(t => [t.key, []])
  );
  plan.forEach(m => {
    if (byTrackMilestones[m.track]) byTrackMilestones[m.track].push(m);
  });

  // build smooth cumulative per track
  const byTrack = {};
  for (const t of tracks) {
    byTrack[t.key] = smoothCumulativeFromMilestones(byTrackMilestones[t.key], maxMonth, 1.8);
  }

  // combined = sum of tracks (stay monotonic by construction)
  const combined = Array(maxMonth + 1).fill(0);
  for (let i = 0; i <= maxMonth; i++) {
    combined[i] = tracks.reduce((acc, t) => acc + byTrack[t.key][i], 0);
  }
  return { byTrack, combined };
}

function buildAgentSeries() {
  const maxMonth = 24;

  // group milestones by agent
  const byAgentMilestones = Object.fromEntries(
    Object.keys(agentMap).map(id => [id, []])
  );
  plan.forEach(m => {
    const id = m.agentId;
    if (id && byAgentMilestones[id]) byAgentMilestones[id].push(m);
  });

  // build smooth cumulative per agent
  const byAgent = {};
  for (const id of Object.keys(agentMap)) {
    byAgent[id] = smoothCumulativeFromMilestones(byAgentMilestones[id], maxMonth, 1.8);
  }

  // combined = sum of agents
  const combined = Array(maxMonth + 1).fill(0);
  for (let i = 0; i <= maxMonth; i++) {
    combined[i] = Object.keys(byAgent).reduce((acc, id) => acc + byAgent[id][i], 0);
  }
  return { byAgent, combined };
}

// Monotone cubic (Fritsch–Carlson) - smooth, no wiggles
function pathFromSeries(arr, y) {
  if (!arr || arr.length < 2) return "";

  const x = (i) => pad + (i / maxMonth) * (width - 2 * pad);

  const n = arr.length;
  const X = Array.from({ length: n }, (_, i) => x(i));
  const Y = arr.map(v => y(v));

  // Slopes of secants
  const dx = new Array(n - 1);
  const dy = new Array(n - 1);
  const m = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = X[i + 1] - X[i];
    dy[i] = Y[i + 1] - Y[i];
    m[i] = dy[i] / dx[i];
  }

  // Tangents (Fritsch–Carlson)
  const t = new Array(n).fill(0);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      t[i] = 0;
    } else {
      const w1 = 1 + dx[i] / (dx[i - 1] + 1e-9);
      const w2 = 1 + dx[i - 1] / (dx[i] + 1e-9);
      t[i] = (w1 + w2) > 0
        ? (w1 + w2) / (w1 / (m[i - 1] + 1e-9) + w2 / (m[i] + 1e-9))
        : 0;
    }
  }

  // Convert to Bezier path
  let d = `M ${X[0]} ${Y[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    const x0 = X[i], y0 = Y[i];
    const x1 = X[i + 1], y1 = Y[i + 1];
    const c1x = x0 + h / 3;
    const c1y = y0 + (t[i] * h) / 3;
    const c2x = x1 - h / 3;
    const c2y = y1 - (t[i + 1] * h) / 3;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x1} ${y1}`;
  }

  return d;
}


  const trackData = buildTrackSeries();
  const agentData = buildAgentSeries();
  const maxForY = Math.max(
    5,
    ...(view === "track"
      ? [ ...Object.values(trackData.byTrack).map(a=>Math.max(...a)), Math.max(...trackData.combined) ]
      : [ ...Object.values(agentData.byAgent).map(a=>Math.max(...a)), Math.max(...agentData.combined) ])
  );
  const y = (v) => height - pad - (v / maxForY) * (height - 2 * pad);

  // Pixel <-> Data helpers for dragging
  function monthFromPx(px) {
    // clamp to chart inner area and snap to integer months
    const clamped = Math.max(pad, Math.min(width - pad, px));
    const t = (clamped - pad) / (width - 2 * pad);
    return Math.max(0, Math.min(maxMonth, Math.round(t * maxMonth)));
  }
  function valueFromPy(py) {
    // map y back to value (0..10), clamp, snap to 0.1
    const clamped = Math.max(pad, Math.min(height - pad, py));
    const v = ((height - pad - clamped) / (height - 2 * pad)) * maxForY;
    const v01 = Math.max(0, Math.min(10, v));
    return Math.round(v01 * 10) / 10;
  }
  function clientToData(e) {
    const rect = svgRef.current?.getBoundingClientRect?.() || { left:0, top:0, width, height };
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return { month: monthFromPx(px), value: valueFromPy(py) };
  }

    function startDrag(milestoneId, e) {
    e.preventDefault();
    e.stopPropagation();
    setDragging({ id: milestoneId });

    const onMove = (ev) => {
      const { month, value } = clientToData(ev);
      updateRow(milestoneId, { month, value });
    };
    const onUp = () => {
      setDragging(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, { once: true });
  }

  const milestonesSorted = [...plan].sort((a,b)=>a.month-b.month);

  const updateRow = (id, patch) => setState(s => ({ ...s, valuePlan: (s.valuePlan || []).map(m => m.id === id ? { ...m, ...patch } : m) }));
  const addRow = () => {
    const id = "m" + Math.random().toString(36).slice(2, 7);
    setState(s => ({ ...s, valuePlan: [...(s.valuePlan || []), { id, month: 3, category: "", stakeholder: "", outcome: "", value: 2, track: "operational", agentId: (agents[0]?.id ?? "") }] }));
  };
  const delRow = (id) => setState(s => ({ ...s, valuePlan: (s.valuePlan || []).filter(m => m.id !== id) }));

  const dupRow = (m) => {
  const id = "m" + Math.random().toString(36).slice(2, 7);
  setState(s => ({ ...s, valuePlan: [ ...(s.valuePlan || []), { ...m, id } ] }));
  };

  const close = () => setState(s=>({...s, valueFlyout:false}));

  // ▼ Add below:  const close = () => setState(s=>({...s, valueFlyout:false}));
const CATS = ["efficiency","effectiveness","experience","empowerment","enablement"];

function duplicateRow(id) {
  setState(s => {
    const row = (s.valuePlan||[]).find(m=>m.id===id);
    if (!row) return s;
    const copy = { ...row, id: "m" + Math.random().toString(36).slice(2,7) };
    return { ...s, valuePlan: [...s.valuePlan, copy] };
  });
}


  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute left-0 right-0 top-12 bottom-0 bg-black/20" onClick={close} />
      <div className="absolute top-12 right-0 bottom-0 w-[80rem] bg-white border-l shadow-xl p-5 overflow-auto" onClick={(e)=>e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Value Realization</div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl overflow-hidden border">
              <button onClick={()=>setView("track")} className={`px-3 py-1 text-sm ${view==="track"?"bg-gray-900 text-white":"bg-white"}`}>By Track</button>
              <button onClick={()=>setView("agent")} className={`px-3 py-1 text-sm ${view==="agent"?"bg-gray-900 text-white":"bg-white"}`}>By Agent</button>
            </div>
            <button className="px-3 py-1 border rounded-xl" onClick={close}>Close</button>
          </div>
        </div>

        {/* Chart */}
        <svg ref={svgRef} width={width} height={height} className="border rounded-xl bg-white select-none">
          {/* Axes */}
          <line x1={pad} y1={y(0)} x2={width - pad / 2} y2={y(0)} stroke="#9ca3af" />
          <line x1={pad} y1={height - pad} x2={pad} y2={pad / 2} stroke="#9ca3af" />
          {/* Time bands */}
          {[3,12,24].map((m,i)=>(
            <g key={m}>
              <line x1={x(m)} y1={height - pad} x2={x(m)} y2={pad} stroke="#d1d5db" strokeDasharray="2 3" />
              {i<3 && (
                <text x={x(m)-10} y={pad+12} fontSize="11" fill="#6b7280" textAnchor="end">
                  {i===0?"1 – 3 months":i===1?"6 – 12 months":"1 – 2 years"}
                </text>
              )}
            </g>
          ))}

          {view==="track" ? (
            <>
              <path d={pathFromSeries(trackData.combined, y)} fill="none" stroke="#374151" strokeWidth="3.5"/>
              {Object.entries(trackData.byTrack).map(([k, arr])=>{
                const meta = tracks.find(t=>t.key===k) || tracks[0];
                return <path key={k} d={pathFromSeries(arr, y)} fill="none" stroke={meta.color} strokeWidth={meta.width} strokeDasharray={meta.dash} />;
              })}
            </>
          ) : (
            <>
              <path d={pathFromSeries(agentData.combined, y)} fill="none" stroke="#111827" strokeWidth="3"/>
              {Object.keys(agentData.byAgent).map(aid=>(
                <path key={aid} d={pathFromSeries(agentData.byAgent[aid], y)} fill="none" stroke={agentMap[aid].color} strokeWidth="2"/>
              ))}
            </>
          )}

          {/* Milestone bubbles on the relevant series */}
{milestonesSorted.map((m) => {
  // Choose the y-series for this milestone
  let seriesAtMonth = 0;
  if (view === "agent") {
    const arr = (agentData.byAgent[m.agentId] || agentData.combined);
    seriesAtMonth = arr[m.month] || 0;
  } else {
    // "track" view
    const arr = (trackData.byTrack[m.track] || trackData.combined);
    seriesAtMonth = arr[m.month] || 0;
  }

  const px = x(m.month);
  const py = y(seriesAtMonth);

  return (
    <g key={m.id}>
      <circle cx={px} cy={py} r="11" fill="#0f2a4d" />
      <text x={px} y={py + 3} textAnchor="middle" fontSize="10" fill="#fff">
        {m.marker}
      </text>
    </g>
  );
})}

          {/* Axis labels */}
          <text x={width - pad} y={y(0) - 6} textAnchor="end" fontSize="11" fill="#6b7280">Time</text>
          <text x={pad + 4} y={pad} textAnchor="start" fontSize="11" fill="#6b7280">Value</text>
        </svg>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-700">
          {view==="track" ? (
            <>
              <div className="flex items-center gap-2"><span className="inline-block w-6 h-1.5 bg-[#374151] rounded" />Combined value</div>
              <div className="flex items-center gap-2"><span className="inline-block w-6 h-0.5 bg-[#6b7280]" style={{borderBottom:"1px dashed #6b7280"}} />Operational value</div>
              <div className="flex items-center gap-2"><span className="inline-block w-6 h-0.5 bg-[#9ca3af]" style={{borderBottom:"2px dashed #9ca3af"}} />Strategic value</div>
              <div className="flex items-center gap-2"><span className="inline-block w-6 h-0.5 bg-[#9ca3af]" style={{borderBottom:"2px dashed #9ca3af"}} />Transformational value</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2"><span className="inline-block w-6 h-1.5 bg-[#111827] rounded" />Combined value</div>
              {agents.map(a=>(
                <div key={a.id} className="flex items-center gap-2">
                  <span className="inline-block w-4 h-1.5 rounded" style={{background: agentMap[a.id].color}} />
                  <span>{a.name}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Editor */}
<div className="mt-6 space-y-3 text-[13px] font-[450] text-gray-800 font-sans">
  {/* Header: fixed, compact column widths */}
  <div
    className="grid items-center text-[11px] text-gray-500 uppercase tracking-wide"
    style={{
      gridTemplateColumns:
        "64px 64px minmax(220px,2fr) minmax(140px,1fr) minmax(160px,1.2fr) minmax(220px,2fr) 80px 40px",
      columnGap: "12px",
    }}
  >
    <div>ID</div>
    <div>Month</div>
    <div>Agent</div>
    <div>Category</div>
    <div>Stakeholder</div>
    <div>Value outcome</div>
    <div className="text-right">Value</div>
    <div className="text-right pr-1"> </div>
  </div>

  {/* Rows */}
  {(state.valuePlan || []).map((m) => (
    <div
      key={m.id}
      className="grid items-center bg-white rounded-2xl shadow-sm px-3 py-2 border border-gray-100 hover:shadow-md transition-all"
      style={{
        gridTemplateColumns:
          "64px 64px minmax(220px,2fr) minmax(140px,1fr) minmax(160px,1.2fr) minmax(220px,2fr) 80px 40px",
        columnGap: "12px",
      }}
    >
      {/* ID — compact */}
      <input
        type="number"
        min={1}
        className="w-16 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 text-center focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition"
        value={m.seq ?? 1}
        onChange={(e) => updateRow(m.id, { seq: Number(e.target.value) })}
      />

      {/* Month — compact */}
      <input
        type="number"
        min={0}
        max={24}
        className="w-16 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 text-center focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition"
        value={m.month}
        onChange={(e) => updateRow(m.id, { month: Number(e.target.value) })}
      />

      {/* Agent */}
      <select
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition"
        value={m.agentId ?? ""}
        onChange={(e) => updateRow(m.id, { agentId: e.target.value || null })}
      >
        <option value="">Select Agent</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>

      {/* Category — the 5 E’s */}
      <select
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition"
        value={m.category || "efficiency"}
        onChange={(e) => updateRow(m.id, { category: e.target.value })}
      >
        {["efficiency","effectiveness","experience","empowerment","enablement"].map(c => (
          <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
        ))}
      </select>

      {/* Stakeholder */}
      <input
        type="text"
        placeholder="e.g. HR Director"
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition"
        value={m.stakeholder || ""}
        onChange={(e) => updateRow(m.id, { stakeholder: e.target.value })}
      />

      {/* Value outcome */}
      <input
        type="text"
        placeholder="Describe value outcome"
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition"
        value={m.outcome || ""}
        onChange={(e) => updateRow(m.id, { outcome: e.target.value })}
      />

      {/* Value — right aligned */}
      <input
        type="number"
        step="0.1"
        min={0}
        max={10}
        className="w-20 text-right rounded-xl border border-gray-200 bg-gray-50 px-2 py-1.5 focus:bg-white focus:ring-1 focus:ring-gray-300 outline-none transition"
        value={m.value}
        onChange={(e) => updateRow(m.id, { value: Number(e.target.value) })}
      />

      {/* Actions — single dark pill icon (aligned with top-right controls) */}
      <button
        title="Delete milestone"
        className="h-8 w-8 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition"
        onClick={() => delRow(m.id)}
      >
        {/* Minimal trash icon (no external lib) */}
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M6 6h8l-.7 10.2A2 2 0 0 1 11.3 18H8.7a2 2 0 0 1-2-1.8L6 6Z" stroke="currentColor" strokeWidth="1.4" />
          <path d="M4 6h12M8 6V4.8A1.8 1.8 0 0 1 9.8 3h0.4A1.8 1.8 0 0 1 12 4.8V6" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </div>
  ))}

  {/* Add Milestone */}
  <div className="pt-2">
    <button
      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-2xl shadow-sm transition font-[500]"
      onClick={addRow}
    >
      ＋ Add Milestone
    </button>
  </div>
</div>


      </div>
    </div>
  );
}

/* ---------- Process Info (description) ---------- */
function ProcessInfoFlyout({ state, setState }) {
  if (!state.processFlyout) return null;
  const p = state.process || {};
  const setProcess = (patch) => setState(s => ({ ...s, process: { ...(s.process||{}), ...patch } }));

  const close = () => setState(s => ({ ...s, processFlyout: false }));

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/20" onClick={close} />
      <div
        className="absolute top-12 right-0 bottom-0 w-[42rem] bg-white border-l shadow-xl p-6 overflow-auto"
        onClick={(e)=>e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Process Info</div>
          <button className="px-3 py-1 rounded-xl border" onClick={close}>Close</button>
        </div>

        <label className="text-xs text-gray-600">Process title</label>
        <input
          className="w-full border rounded-xl px-3 py-2 mb-3"
          value={state.title || ""}
          onChange={(e)=> setState(s => ({ ...s, title: e.target.value }))}
        />

        <label className="text-xs text-gray-600">Owner</label>
        <input
          className="w-full border rounded-xl px-3 py-2 mb-3"
          value={p.owner || ""}
          onChange={(e)=> setProcess({ owner: e.target.value })}
          placeholder="e.g., People Ops"
        />

        <label className="text-xs text-gray-600">Objectives</label>
        <input
          className="w-full border rounded-xl px-3 py-2 mb-3"
          value={p.objectives || ""}
          onChange={(e)=> setProcess({ objectives: e.target.value })}
          placeholder="Top success criteria"
        />

        <label className="text-xs text-gray-600">Description</label>
        <textarea
          className="w-full border rounded-xl px-3 py-2 h-40"
          value={p.description || ""}
          onChange={(e)=> setProcess({ description: e.target.value })}
          placeholder="Describe the process at a high level..."
        />

        <div className="mt-4 text-right">
          <button className="px-3 py-1 rounded-xl border" onClick={close}>Done</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Share modal ---------- */
function ShareModal({ open, onClose, state }) {
  if (!open) return null;

  const title = (state?.title || "Nagare: Process Design");
  const desc =
    (state?.processDescription || state?.processMeta?.description || "Designed in Nagare.") + "";
  const url = (typeof window !== "undefined" ? window.location.href : "https://example.com");
  const text = `${title} — ${desc}`;

  const u = encodeURIComponent;
  const shareTargets = [
    {
      key: "x",
      label: "Post to X (Twitter)",
      icon: <Twitter size={18} />,
      href: `https://twitter.com/intent/tweet?text=${u(text)}&url=${u(url)}`,
    },
    {
      key: "linkedin",
      label: "Share on LinkedIn",
      icon: <Linkedin size={18} />,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${u(url)}`,
    },
    // Instagram has no web share intent for text/links.
    {
      key: "instagram",
      label: "Open Instagram (no link prefill)",
      icon: <Instagram size={18} />,
      href: `https://www.instagram.com/`,
    },
  ];

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Copy failed");
    }
  }

  async function tryWebShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // user cancelled
      }
    } else {
      copyLink();
    }
  }

  function showToast(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.position = "fixed";
    el.style.bottom = "20px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.background = "rgba(17,24,39,0.9)";
    el.style.color = "#fff";
    el.style.padding = "8px 12px";
    el.style.borderRadius = "999px";
    el.style.fontSize = "12px";
    el.style.zIndex = 9999;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="absolute top-20 right-8 w-[420px] bg-white rounded-2xl shadow-2xl border p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Share2 size={18} className="text-gray-700" />
            <div className="text-sm font-semibold text-gray-800">Share</div>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs rounded-full border hover:bg-gray-50 text-gray-600"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {/* Preview */}
        <div className="border rounded-xl p-3 bg-gray-50/60">
          <div className="text-[13px] font-medium text-gray-900 truncate">{title}</div>
          <div className="text-[11px] text-gray-600 line-clamp-2">{desc}</div>
          <div className="text-[11px] text-gray-400 mt-1 truncate">{url}</div>
        </div>

        {/* Buttons */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {shareTargets.map((t) => (
            <a
              key={t.key}
              href={t.href}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center justify-center gap-2 py-3 rounded-xl border bg-white hover:bg-gray-50"
              title={t.label}
            >
              {t.icon}
              <span className="text-[11px] text-gray-700">{t.key === "x" ? "X (Twitter)" : t.label.replace(/Share on |Post to /,'')}</span>
            </a>
          ))}
          <button
            onClick={copyLink}
            className="flex flex-col items-center justify-center gap-2 py-3 rounded-xl border bg-white hover:bg-gray-50"
            title="Copy link"
          >
            <LinkIcon size={18} />
            <span className="text-[11px] text-gray-700">Copy link</span>
          </button>
          <button
            onClick={tryWebShare}
            className="flex flex-col items-center justify-center gap-2 py-3 rounded-xl border bg-white hover:bg-gray-50"
            title="Share via device"
          >
            <Share2 size={18} />
            <span className="text-[11px] text-gray-700">Share…</span>
          </button>
        </div>

        {/* Helper note */}
        <div className="mt-3 text-[11px] text-gray-500">
          Tip: Instagram doesn’t support prefilled link shares on web. Use “Copy link” and paste into your post.
        </div>
      </div>
    </div>
  );
}
/* ChipBox helper (reusable) */
function ChipBox({ title, items = [], onAdd, onRemove, enterOnly = false }) {
  return (
    <div>
      <label className="text-xs text-gray-600">{title}</label>
      <div className="w-full border rounded-xl px-2 py-2">
        <div className="flex flex-wrap gap-1 mb-2">
          {items.map((s, idx) => (
            <span key={s + idx} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
              {s}
              <button className="text-gray-500 hover:text-gray-800" onClick={() => onRemove(idx)}>×</button>
            </span>
          ))}
        </div>
        <input
          className="w-full outline-none"
          placeholder={enterOnly ? "Type and press Enter" : "Type and press Enter or comma"}
          onKeyDown={(e) => {
            const delims = enterOnly ? ["Enter"] : [",", ";", "Enter"];
            if (delims.includes(e.key)) {
              e.preventDefault();
              const raw = e.currentTarget.value.trim();
              if (!raw) return;
              onAdd(raw);
              e.currentTarget.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}

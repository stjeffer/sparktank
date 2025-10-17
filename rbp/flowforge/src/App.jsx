import { useEffect, useMemo, useRef, useState } from "react";

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

export default function App() {
  const [state, setState] = useState(INITIAL);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [sim, setSim] = useState(false);

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

  /* Canvas pan */
  function onCanvasMouseDown(e) {
    const shouldPan = spaceDown || e.button === 1 || e.button === 2;
    if (shouldPan) {
      draggingCanvas.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    } else {
      setSelectedId(null); setSelectedType(null);
    }
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
      <div className="flex items-center justify-between px-3 py-2 border-b bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <input
            className="text-lg font-semibold px-3 py-1.5 rounded-xl border w-[360px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={state.title}
            onChange={(e) => setState(s => ({ ...s, title: e.target.value }))}
            placeholder="Process title"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border">
            <button onClick={()=> setState(s=>({...s,mode:"build"}))} className={`px-3 py-1 text-sm ${state.mode==="build" ? "bg-gray-900 text-white" : "bg-white"}`}>Build</button>
            <button onClick={()=> setSim(x=>!x)} className={`px-3 py-1 text-sm ${sim ? "bg-gray-900 text-white" : "bg-white"}`}>{sim ? "Stop Simulate" : "Simulate"}</button>
          </div>

          <button onClick={addStep} className="px-3 py-1 text-sm rounded-xl border bg-white hover:bg-gray-50">+ Add Step</button>
          <button onClick={toggleConnectMode} className={`px-3 py-1 text-sm rounded-xl border ${state.connectMode ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`} title="Click source, then target">
            {state.connectMode ? (state.connectFrom ? "Connect (pick target)" : "Connect (pick source)") : "Add Connection"}
          </button>

          <select className="px-2 py-1 text-sm rounded-xl border bg-white" value={state.autoMVA ? "auto" : "manual"}
            onChange={(e)=> setState(s=>({ ...s, autoMVA: e.target.value==="auto", manualMVAId: e.target.value==="auto" ? null : s.manualMVAId }))} title="MVA mode">
            <option value="auto">MVA: Auto</option><option value="manual">MVA: Manual</option>
          </select>

          {/* Inspector toggle switch */}
          <button onClick={()=> setState(s=>({...s, showInspector: !s.showInspector}))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${state.showInspector ? "bg-blue-600" : "bg-gray-300"}`}
            title={state.showInspector ? "Hide Inspector" : "Show Inspector"}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${state.showInspector ? "translate-x-5" : "translate-x-1"}`} />
          </button>

          <button onClick={()=> setState(s=>({...s, valueFlyout: true }))} className="px-3 py-1 text-sm rounded-xl border bg-blue-600 text-white">Value Plan</button>
          <label className="px-3 py-1 text-sm rounded-xl border bg-white cursor-pointer">
  Import JSON
  <input type="file" accept=".json" onChange={importJSON} className="hidden" />
</label>
<button className="px-3 py-1 text-sm rounded-xl border bg-white" onClick={exportJSON}>Export JSON</button>
<button className="px-3 py-1 text-sm rounded-xl border bg-blue-600 text-white" onClick={exportWord}>Export Word</button>
        </div>
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
          <span className="font-medium">Top bottlenecks:</span>
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
  if (!state.valueFlyout) return null;
  const [view, setView] = useState("track"); // "track" | "agent"

  const agents = state.nodes.filter(n => n.type === "agent");
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
  }));

  const width = 760, height = 320, pad = 32, maxMonth = 24;
  const x = (m) => pad + (m / maxMonth) * (width - 2 * pad);

  const tracks = [
    { key: "operational", label: "Operational value", color: "#6b7280", dash: "3 3", width: 2 },
    { key: "strategic", label: "Strategic value", color: "#9ca3af", dash: "6 4", width: 2 },
    { key: "transformational", label: "Transformational value", color: "#9ca3af", dash: "6 2 1 2", width: 2 },
  ];

  function buildTrackSeries() {
    const byTrack = Object.fromEntries(tracks.map(t => [t.key, Array(maxMonth + 1).fill(0)]));
    plan.forEach(m => { if (byTrack[m.track]) byTrack[m.track][m.month] += m.value; });
    Object.keys(byTrack).forEach(k => { for (let i=1;i<=maxMonth;i++) byTrack[k][i] += byTrack[k][i-1]; });
    const combined = Array(maxMonth+1).fill(0).map((_,i)=> tracks.reduce((acc,t)=>acc+byTrack[t.key][i],0));
    return { byTrack, combined };
  }
  function buildAgentSeries() {
    const byAgent = Object.fromEntries(Object.keys(agentMap).map(id => [id, Array(maxMonth + 1).fill(0)]));
    plan.forEach(m => { if (m.agentId && byAgent[m.agentId]) byAgent[m.agentId][m.month] += m.value; });
    Object.keys(byAgent).forEach(k => { for (let i=1;i<=maxMonth;i++) byAgent[k][i] += byAgent[k][i-1]; });
    const combined = Array(maxMonth+1).fill(0).map((_,i)=> Object.keys(byAgent).reduce((acc,k)=>acc+byAgent[k][i],0));
    return { byAgent, combined };
  }

  const pathFromSeries = (arr, y) => {
    if (!arr || arr.length < 2) return "";
    let d = `M ${x(0)} ${y(arr[0])}`;
    for (let i = 0; i < arr.length - 1; i++) {
      const x1 = x(i), y1 = y(arr[i]);
      const x2 = x(i + 1), y2 = y(arr[i + 1]);
      const cx = (x1 + x2) / 2;
      d += ` C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
    }
    return d;
  };

  const trackData = buildTrackSeries();
  const agentData = buildAgentSeries();
  const maxForY = Math.max(
    5,
    ...(view === "track"
      ? [ ...Object.values(trackData.byTrack).map(a=>Math.max(...a)), Math.max(...trackData.combined) ]
      : [ ...Object.values(agentData.byAgent).map(a=>Math.max(...a)), Math.max(...agentData.combined) ])
  );
  const y = (v) => height - pad - (v / maxForY) * (height - 2 * pad);

  const milestonesSorted = [...plan].sort((a,b)=>a.month-b.month);

  const updateRow = (id, patch) => setState(s => ({ ...s, valuePlan: (s.valuePlan || []).map(m => m.id === id ? { ...m, ...patch } : m) }));
  const addRow = () => {
    const id = "m" + Math.random().toString(36).slice(2, 7);
    setState(s => ({ ...s, valuePlan: [...(s.valuePlan || []), { id, month: 3, category: "", stakeholder: "", outcome: "", value: 2, track: "operational", agentId: (agents[0]?.id ?? "") }] }));
  };
  const delRow = (id) => setState(s => ({ ...s, valuePlan: (s.valuePlan || []).filter(m => m.id !== id) }));

  const close = () => setState(s=>({...s, valueFlyout:false}));

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute left-0 right-0 top-12 bottom-0 bg-black/20" onClick={close} />
      <div className="absolute top-12 right-0 bottom-0 w-[56rem] bg-white border-l shadow-xl p-5 overflow-auto" onClick={(e)=>e.stopPropagation()}>
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
        <svg width={width} height={height} className="border rounded-xl bg-white">
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

          {/* Milestone bubbles on combined */}
          {milestonesSorted.map((m,i)=>{
            const arr = view==="track" ? trackData.combined : agentData.combined;
            const px = x(m.month), py = y(arr[m.month] || 0);
            return (
              <g key={m.id}>
                <circle cx={px} cy={py} r="11" fill="#0f2a4d" />
                <text x={px} y={py+3} textAnchor="middle" fontSize="10" fill="#fff">{i+1}</text>
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
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-12 gap-2 text-[11px] text-gray-600 font-medium">
            <div className="col-span-1">Month</div>
            <div className="col-span-2">{view==="track" ? "Track" : "Agent"}</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Stakeholder</div>
            <div className="col-span-4">Value outcome</div>
            <div className="col-span-1 text-right">Value</div>
          </div>

          {(state.valuePlan || []).map((m) => (
            <div key={m.id} className="grid grid-cols-12 gap-2 items-center">
              <input className="col-span-1 border rounded-xl px-2 py-1" type="number" min={0} max={24} value={m.month} onChange={(e) => updateRow(m.id, { month: Number(e.target.value) })}/>
              {view==="track" ? (
                <select className="col-span-2 border rounded-xl px-2 py-1" value={m.track || "operational"} onChange={(e)=> updateRow(m.id, { track: e.target.value })}>
                  <option value="operational">operational</option><option value="strategic">strategic</option><option value="transformational">transformational</option>
                </select>
              ) : (
                <select className="col-span-2 border rounded-xl px-2 py-1" value={m.agentId ?? ""} onChange={(e)=> updateRow(m.id, { agentId: e.target.value || null })}>
                  {agents.length===0 && <option value="">(no agents)</option>}
                  {agents.map((a)=> <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
              <input className="col-span-2 border rounded-xl px-2 py-1" value={m.category || ""} onChange={(e) => updateRow(m.id, { category: e.target.value })}/>
              <input className="col-span-2 border rounded-xl px-2 py-1" value={m.stakeholder || ""} onChange={(e) => updateRow(m.id, { stakeholder: e.target.value })}/>
              <input className="col-span-4 border rounded-xl px-2 py-1" value={m.outcome || ""} onChange={(e) => updateRow(m.id, { outcome: e.target.value })}/>
              <input className="col-span-1 border rounded-xl px-2 py-1 text-right" type="number" step="0.1" min={0} max={10} value={m.value} onChange={(e) => updateRow(m.id, { value: Number(e.target.value) })}/>
              <div className="col-span-12 flex justify-end">
                <button className="px-2 py-1 border rounded-xl text-red-600" onClick={() => delRow(m.id)}>Delete</button>
              </div>
            </div>
          ))}
          <button className="px-3 py-1 border rounded-xl" onClick={addRow}>+ Add milestone</button>
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

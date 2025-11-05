import React, { useState } from "react";

/**
 * Build the AS-IS process schema that Nagare’s canvas understands.
 * This takes the wizard answers and turns them into:
 *  - title, processDescription
 *  - nodes (one per task line)
 *  - simple left-to-right connections
 *  - narrative + systemContext + readiness sliders
 */
function buildInitialSchema({
  title,
  shortDescription,
  tasks,
  roles,
  tools,
  decisions,
  goals,
  painPoints,
  stakeholders,
  aiIntent,
  orgTrustInAI,
  dataMaturity,
  changeAppetite,
}) {
  // --- 1) Normalise free-text answers ---
  const taskLines = (tasks || "")
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const roleList = (roles || "")
    .split(/[,;\n]+/)
    .map((r) => r.trim())
    .filter(Boolean);

  const stakeholderList = (stakeholders || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const defaultOwner = roleList[0] || "Owner";
  const defaultStakeholders =
    stakeholderList.length > 0 ? stakeholderList : [defaultOwner];

  // --- 2) Build nodes from task lines ---
  const NODE_W = 320;
  const startX = 60;
  const startY = 220;
  const gapX = NODE_W - 40; // horizontal spacing

  const nodes = taskLines.map((taskText, index) => {
    const id = `n${index + 1}`;
    const owner =
      roleList.length > 0 ? roleList[index % roleList.length] : defaultOwner;

    return {
      id,
      name: taskText.slice(0, 40) || `Step ${index + 1}`,
      description: taskText,
      x: startX + index * gapX,
      y: startY,
      owner,
      type: "human", // AS-IS: human/manual workflow
      ai: "none",
      aiConfidence: 20,
      complexity: 2,
      valueFocus: "efficiency",
      stakeholders: defaultStakeholders,
      valueTags: [],
      governanceOwner: owner,
      governance: [],
      lever: {
        sees: "restricted",
        acts: "human",
        connect: "manual",
        rules: "policy",
        participates: "internal",
      },
      agent: null,
      valueImpact: 0,
    };
  });

  // --- 3) Simple sequential connections: n1 → n2 → n3 ...
  const connections = nodes.length
    ? nodes.slice(0, -1).map((node, index) => ({
        id: `c${index + 1}`,
        from: node.id,
        to: nodes[index + 1].id,
        waitMinutes: 0,
        label: "",
      }))
    : [];

  // --- 4) Readiness sliders (0–1) ---
  const readiness = {
    orgTrustInAI: (orgTrustInAI ?? 50) / 100,
    dataMaturity: (dataMaturity ?? 50) / 100,
    changeAppetite: (changeAppetite ?? 50) / 100,
  };

  // --- 5) Narrative & system context ---
  const systemContext = {
    tasks,
    roles,
    tools,
    decisions,
    goals,
    principle:
      "A system is a network of tasks, roles, tools, decisions and goals that together produce value.",
  };

  const narrative = {
    asIsSummary: shortDescription || "",
    painPoints: painPoints || "",
    stakeholdersSummary: stakeholders || "",
    aiIntent: aiIntent || "explore",
  };

  // --- 6) Schema used by Nagare canvas ---
  return {
    title: title || "Untitled process",
    processDescription: shortDescription || "",

    nodes,
    connections,

    valuePlan: [],
    agentEvals: {},
    processEvals: [],

    narrative,
    systemContext,
    readiness,
  };
}

/**
 * Fluent-style primary button
 */
function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center px-4 py-2 rounded-full " +
        "text-sm font-semibold " +
        "bg-[#0F6CBD] text-white " +
        "shadow-sm hover:bg-[#115EA3] disabled:opacity-50 disabled:cursor-not-allowed " +
        (props.className || "")
      }
    >
      {children}
    </button>
  );
}

/**
 * Fluent-style subtle button
 */
function SubtleButton({ children, ...props }) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center px-3 py-1.5 rounded-full " +
        "text-sm font-medium text-gray-700 " +
        "hover:bg-gray-100 " +
        (props.className || "")
      }
    >
      {children}
    </button>
  );
}

/**
 * Fluent-style text field
 */
function TextField({ label, helper, multiline, rows = 3, ...props }) {
  const base =
    "w-full rounded-lg border border-gray-200 bg-white " +
    "px-3 py-2 text-sm text-gray-900 " +
    "shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] focus:border-transparent " +
    "placeholder:text-gray-400";

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-800">{label}</span>
        </div>
      )}
      {multiline ? (
        <textarea className={base} rows={rows} {...props} />
      ) : (
        <input className={base} {...props} />
      )}
      {helper && <p className="text-[11px] text-gray-500">{helper}</p>}
    </div>
  );
}

/**
 * Fluent-style slider with label + value
 */
function SliderField({ label, value, onChange, helper }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-800">{label}</span>
        <span className="text-xs text-gray-600">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#0F6CBD]"
      />
      {helper && <p className="text-[11px] text-gray-500">{helper}</p>}
    </div>
  );
}

/**
 * Step indicator (1–4) with Fluent look
 */
function StepHeader({ step }) {
  const steps = [
    { id: 1, title: "Process overview" },
    { id: 2, title: "Current system" },
    { id: 3, title: "Friction & stakeholders" },
    { id: 4, title: "AI readiness & intent" },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {steps.map((s, idx) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div
                  className={
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold " +
                    (active
                      ? "bg-[#0F6CBD] text-white shadow-sm"
                      : done
                      ? "bg-[#D1E4F7] text-[#0F6CBD]"
                      : "bg-gray-100 text-gray-500")
                  }
                >
                  {s.id}
                </div>
                <span
                  className={
                    "text-xs font-medium " +
                    (active
                      ? "text-gray-900"
                      : done
                      ? "text-gray-700"
                      : "text-gray-500")
                  }
                >
                  {s.title}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flex-1 h-px bg-gray-200" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main wizard component
 */
export default function IntakeScreen({ onComplete }) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    title: "",
    shortDescription: "",
    tasks: "",
    roles: "",
    tools: "",
    decisions: "",
    goals: "",
    painPoints: "",
    stakeholders: "",
    aiIntent: "",
    orgTrustInAI: 50,
    dataMaturity: 50,
    changeAppetite: 50,
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function next() {
    if (step < 4) setStep((s) => s + 1);
  }

  function back() {
    if (step > 1) setStep((s) => s - 1);
  }

  function handleFinish() {
    const schema = buildInitialSchema(form);
    onComplete(schema);
  }

  return (
    <div className="w-full h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Map your current process
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              We’ll turn your answers into an AS-IS map on the Nagare canvas and
              then help you re-imagine it with AI.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Nagare
            </span>
            <span className="text-[11px] text-slate-400">
              Flow intelligence for complex work
            </span>
          </div>
        </div>

        {/* Stepper */}
        <StepHeader step={step} />

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
          {/* Left: main form card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            {step === 1 && (
              <>
                <TextField
                  label="Process name"
                  placeholder="e.g. New hire onboarding in EMEA"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
                <TextField
                  label="In one or two sentences, describe this process as it works today"
                  multiline
                  rows={4}
                  placeholder="e.g. A manager initiates a new hire request, HR collects documents, payroll is set up and IT provisions access and equipment."
                  value={form.shortDescription}
                  onChange={(e) => update("shortDescription", e.target.value)}
                />
                <TextField
                  label="What outcome should this process reliably produce?"
                  helper="Think about what “good” looks like when this process runs well."
                  multiline
                  rows={3}
                  placeholder="e.g. New hires are productive and compliant by day one, with minimal manual coordination and rework."
                  value={form.goals}
                  onChange={(e) => update("goals", e.target.value)}
                />
              </>
            )}

            {step === 2 && (
              <>
                <TextField
                  label="Key roles and actors"
                  helper="People or teams who touch this process (one per line or separated by commas)."
                  multiline
                  rows={3}
                  placeholder={"e.g.\nHiring Manager\nHR Operations\nIT Support\nPayroll"}
                  value={form.roles}
                  onChange={(e) => update("roles", e.target.value)}
                />
                <TextField
                  label="Tasks and hand-offs (AS-IS)"
                  helper="List the main steps in order, one per line. We’ll turn these into nodes on the canvas."
                  multiline
                  rows={6}
                  placeholder={
                    "e.g.\nManager submits hiring request\nHR creates employee record\nPayroll sets up salary and tax details\nIT provisions accounts and equipment"
                  }
                  value={form.tasks}
                  onChange={(e) => update("tasks", e.target.value)}
                />
                <TextField
                  label="Tools and systems used"
                  helper="CRMs, HRIS, spreadsheets, email, chat, approval tools, etc."
                  multiline
                  rows={3}
                  placeholder="e.g. Workday, Jira, Outlook, Slack, Excel tracker"
                  value={form.tools}
                  onChange={(e) => update("tools", e.target.value)}
                />
              </>
            )}

            {step === 3 && (
              <>
                <TextField
                  label="Key decisions and approvals"
                  helper="Where does someone decide whether to proceed, escalate or stop?"
                  multiline
                  rows={4}
                  placeholder="e.g. HR approves eligibility, Finance signs off on headcount and budget, Security approves access level."
                  value={form.decisions}
                  onChange={(e) => update("decisions", e.target.value)}
                />
                <TextField
                  label="Pain points, delays, or failure modes"
                  helper="Where does this process break down, slow down, or frustrate people today?"
                  multiline
                  rows={4}
                  placeholder="e.g. IT receives requests late, manual data entry causes errors, approvals stuck in email."
                  value={form.painPoints}
                  onChange={(e) => update("painPoints", e.target.value)}
                />
                <TextField
                  label="Stakeholders who care about this process"
                  helper="List internal or external stakeholders (separated by commas)."
                  multiline
                  rows={3}
                  placeholder="e.g. New hires, HRBP, Line managers, IT, Finance, Compliance"
                  value={form.stakeholders}
                  onChange={(e) => update("stakeholders", e.target.value)}
                />
              </>
            )}

            {step === 4 && (
              <>
                <TextField
                  label="What do you hope AI could change about this system?"
                  helper="For example: remove repetitive work, improve experience, reduce risk, or re-imagine how the system works."
                  multiline
                  rows={4}
                  placeholder="e.g. Use agents to orchestrate hand-offs, proactively flag risks, and give managers a single place to track progress."
                  value={form.aiIntent}
                  onChange={(e) => update("aiIntent", e.target.value)}
                />

                <div className="grid md:grid-cols-3 gap-4 mt-2">
                  <SliderField
                    label="Trust in AI for this domain"
                    value={form.orgTrustInAI}
                    onChange={(v) => update("orgTrustInAI", v)}
                    helper="How ready is your org to rely on AI here?"
                  />
                  <SliderField
                    label="Data & system maturity"
                    value={form.dataMaturity}
                    onChange={(v) => update("dataMaturity", v)}
                    helper="How structured and accessible is the data?"
                  />
                  <SliderField
                    label="Appetite for change"
                    value={form.changeAppetite}
                    onChange={(v) => update("changeAppetite", v)}
                    helper="How open are teams to re-designing the process?"
                  />
                </div>
              </>
            )}
          </div>

          {/* Right: fluent info panel */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-slate-50 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">Systems lens</h2>
              <p className="text-xs text-slate-200 leading-relaxed">
                A system is a network of{" "}
                <span className="font-semibold">tasks</span>,{" "}
                <span className="font-semibold">roles</span>,{" "}
                <span className="font-semibold">tools</span>,{" "}
                <span className="font-semibold">decisions</span> and{" "}
                <span className="font-semibold">goals</span> that together
                produce value.
              </p>
              <p className="text-xs text-slate-300 mt-3">
                In this wizard you’re capturing just enough of that system so
                Nagare can visualise the AS-IS flow and help you explore
                AI-powered TO-BE patterns on the canvas.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
              <h3 className="text-sm font-semibold text-slate-900">
                You’re on step {step} of 4
              </h3>
              <p className="text-xs text-slate-600">
                When you’re done, we’ll generate:
              </p>
              <ul className="text-xs text-slate-600 list-disc list-inside space-y-1">
                <li>An AS-IS process map with one node per task.</li>
                <li>Simple hand-offs between each step.</li>
                <li>Context about roles, tools, decisions and pain points.</li>
                <li>Readiness settings that guide AI-generated suggestions.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex items-center justify-between">
          <SubtleButton onClick={back} disabled={step === 1}>
            Back
          </SubtleButton>
          {step < 4 ? (
            <PrimaryButton onClick={next}>Next</PrimaryButton>
          ) : (
            <PrimaryButton onClick={handleFinish}>
              Generate AS-IS canvas
            </PrimaryButton>
          )}
        </div>
      </div>
    </div>
  );
}
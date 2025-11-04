// src/IntakeScreen.jsx
import React, { useState } from "react";

export default function IntakeScreen({ onComplete }) {
  const [step, setStep] = useState(1);

  // Step 1 – basics
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");

  // Step 2 – system components
  const [tasks, setTasks] = useState("");
  const [roles, setRoles] = useState("");
  const [tools, setTools] = useState("");
  const [decisions, setDecisions] = useState("");
  const [goals, setGoals] = useState("");

  // Step 3 – friction, stakeholders, intent, readiness
  const [painPoints, setPainPoints] = useState("");
  const [stakeholders, setStakeholders] = useState("");
  const [aiIntent, setAiIntent] = useState("explore");

  const [orgTrustInAI, setOrgTrustInAI] = useState(0.5);
  const [dataMaturity, setDataMaturity] = useState(0.5);
  const [changeAppetite, setChangeAppetite] = useState(0.5);

  const canFinish = title.trim().length > 0;

  function handleNext() {
    if (step < 3) setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleFinish() {
    if (!canFinish) return;
    const schema = buildInitialSchema({
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
    });
    onComplete && onComplete(schema);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl rounded-3xl bg-white/85 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl border border-slate-100 flex flex-col max-h-[680px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/80">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-2xl bg-sky-500/10 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-sky-500/80" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Nagare
              </div>
              <div className="text-sm text-slate-700">
                Map the system as it works today
              </div>
            </div>
          </div>

          {/* Steps 1–3 */}
          <div className="flex items-center gap-2 text-xs">
            <StepChip index={1} label="Basics" active={step === 1} />
            <StepChip index={2} label="System" active={step === 2} />
            <StepChip index={3} label="Friction & readiness" active={step === 3} />
          </div>
        </div>

        {/* Body – scrollable area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {step === 1 && (
            <StepOneBasics
              title={title}
              setTitle={setTitle}
              shortDescription={shortDescription}
              setShortDescription={setShortDescription}
            />
          )}
          {step === 2 && (
            <StepTwoSystem
              tasks={tasks}
              setTasks={setTasks}
              roles={roles}
              setRoles={setRoles}
              tools={tools}
              setTools={setTools}
              decisions={decisions}
              setDecisions={setDecisions}
              goals={goals}
              setGoals={setGoals}
            />
          )}
          {step === 3 && (
            <StepThreeFrictionReadiness
              painPoints={painPoints}
              setPainPoints={setPainPoints}
              stakeholders={stakeholders}
              setStakeholders={setStakeholders}
              aiIntent={aiIntent}
              setAiIntent={setAiIntent}
              orgTrustInAI={orgTrustInAI}
              setOrgTrustInAI={setOrgTrustInAI}
              dataMaturity={dataMaturity}
              setDataMaturity={setDataMaturity}
              changeAppetite={changeAppetite}
              setChangeAppetite={setChangeAppetite}
            />
          )}
        </div>

        {/* Footer – fixed */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white/85 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            A system is a network of{" "}
            <span className="font-semibold text-slate-700">
              tasks, roles, tools, decisions and goals
            </span>{" "}
            that together produce value.
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>
            )}

            {step < 3 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 1 && !title.trim()}
                className={
                  "text-xs px-4 py-2 rounded-full shadow-sm " +
                  (step === 1 && !title.trim()
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-slate-900 text-white hover:bg-slate-800")
                }
              >
                Continue
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleFinish}
                disabled={!canFinish}
                className={
                  "text-xs px-4 py-2 rounded-full shadow-sm " +
                  (canFinish
                    ? "bg-sky-600 text-white hover:bg-sky-500"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed")
                }
              >
                Start mapping
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* STEP CHIP */

function StepChip({ index, label, active }) {
  return (
    <div
      className={
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 " +
        (active
          ? "border-sky-500 bg-sky-50 text-sky-700"
          : "border-slate-200 bg-slate-50 text-slate-500")
      }
    >
      <span
        className={
          "h-5 w-5 rounded-full flex items-center justify-center text-[11px] " +
          (active
            ? "bg-sky-500 text-white"
            : "bg-slate-200 text-slate-700")
        }
      >
        {index}
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </div>
  );
}

/* STEP 1 – BASICS */

function StepOneBasics({ title, setTitle, shortDescription, setShortDescription }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Start with the basics
        </h2>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Name the system you’re working on and summarise what it is supposed
          to achieve today. You can refine everything later on the canvas.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Process / system name
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            placeholder="e.g., New employee onboarding"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Short description
          </label>
          <textarea
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-24"
            placeholder="In a few lines, describe what this system is supposed to deliver today."
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

/* STEP 2 – SYSTEM COMPONENTS */

function StepTwoSystem({
  tasks,
  setTasks,
  roles,
  setRoles,
  tools,
  setTools,
  decisions,
  setDecisions,
  goals,
  setGoals,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Capture the system components
        </h2>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Think in terms of tasks, roles, tools, decisions, and goals. We’ll
          translate this into nodes and connections for you.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-slate-50/80 px-4 py-4 shadow-inner">
        <p className="mb-4 text-[12px] leading-snug text-slate-600 italic border-l-2 border-sky-500 pl-3">
          A system is a network of <b>tasks</b>, <b>roles</b>, <b>tools</b>,{" "}
          <b>decisions</b> and <b>goals</b> that together produce value.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Key tasks
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-20"
              placeholder="List the core recurring tasks that make this system work."
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Roles involved
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-20"
              placeholder="e.g., Hiring Manager, HR Admin, IT Support"
              value={roles}
              onChange={(e) => setRoles(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tools used
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-20"
              placeholder="List primary systems or tools (e.g., Excel, Outlook, Workday, custom apps)."
              value={tools}
              onChange={(e) => setTools(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Decisions made
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-20"
              placeholder="What approvals or routing decisions shape the flow?"
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Goals / outcomes
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-20"
              placeholder="What value is this system intended to create for customers, employees, or the business?"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* STEP 3 – FRICTION, INTENT & READINESS */

function StepThreeFrictionReadiness({
  painPoints,
  setPainPoints,
  stakeholders,
  setStakeholders,
  aiIntent,
  setAiIntent,
  orgTrustInAI,
  setOrgTrustInAI,
  dataMaturity,
  setDataMaturity,
  changeAppetite,
  setChangeAppetite,
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Friction, intent & readiness
        </h2>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Tell us where the system struggles today, what you want from AI, and
          how ready your organisation feels. Nagare will use this when it
          suggests new patterns.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Friction points & problems
          </label>
          <textarea
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-20"
            placeholder="Where does this system break down or create frustration today?"
            value={painPoints}
            onChange={(e) => setPainPoints(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Key stakeholders to keep in mind
          </label>
          <textarea
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 h-20"
            placeholder="Who cares about this system? e.g., New hires, HR leadership, Finance, IT security, frontline managers."
            value={stakeholders}
            onChange={(e) => setStakeholders(e.target.value)}
          />
        </div>

        {/* AI intent */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            What are you hoping AI will do here?
          </label>
          <div className="grid gap-2 sm:grid-cols-3 text-xs">
            <RadioPill
              label="Explore possibilities"
              description="I’m early. I want patterns, ideas, and a sense of what's possible."
              value="explore"
              selected={aiIntent}
              onChange={setAiIntent}
            />
            <RadioPill
              label="Augment people"
              description="I want AI to reduce friction while keeping humans central."
              value="augment"
              selected={aiIntent}
              onChange={setAiIntent}
            />
            <RadioPill
              label="Reimagine the system"
              description="I'm open to reshaping how this whole system works with AI."
              value="reimagine"
              selected={aiIntent}
              onChange={setAiIntent}
            />
          </div>
        </div>

        {/* Readiness sliders */}
        <div className="mt-2 rounded-3xl border border-slate-100 bg-slate-50/80 px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-800 tracking-wide uppercase">
              Readiness to change
            </h3>
            <span className="text-[11px] text-slate-500">
              These sliders will influence AI suggestions later.
            </span>
          </div>

          <div className="space-y-3 text-[11px]">
            <SliderRow
              label="Confidence in AI"
              help="How comfortable is the organisation with AI-supported work?"
              value={orgTrustInAI}
              onChange={setOrgTrustInAI}
            />
            <SliderRow
              label="Data / systems maturity"
              help="How robust and connected are your underlying systems and data?"
              value={dataMaturity}
              onChange={setDataMaturity}
            />
            <SliderRow
              label="Appetite for change"
              help="How ready are teams and leaders to adopt new ways of working?"
              value={changeAppetite}
              onChange={setChangeAppetite}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Radio pill component */

function RadioPill({ label, description, value, selected, onChange }) {
  const active = selected === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={
        "text-left rounded-2xl border px-3 py-2 shadow-sm transition " +
        (active
          ? "border-sky-500 bg-sky-50 text-sky-800"
          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
      }
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-medium text-[13px]">{label}</span>
        <span
          className={
            "h-4 w-4 rounded-full border flex items-center justify-center " +
            (active
              ? "border-sky-500 bg-sky-500"
              : "border-slate-300 bg-white")
          }
        >
          {active && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
      </div>
      <p className="text-[11px] text-slate-600 leading-snug">{description}</p>
    </button>
  );
}

/* Slider row – matches the readiness sliders concept used on the canvas */

function SliderRow({ label, help, value, onChange }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-800">{label}</span>
        <span className="text-slate-500">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-sky-600"
      />
      <p className="text-slate-500">{help}</p>
    </div>
  );
}

/* Build schema passed into Nagare canvas */

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
  return {
    title: title || "Untitled process",
    processDescription: shortDescription || "",
    nodes: [],
    connections: [],
    valuePlan: [],
    agentEvals: {},
    processEvals: [],

    narrative: {
      asIsSummary: shortDescription || "",
      painPoints: painPoints || "",
      stakeholdersSummary: stakeholders || "",
      aiIntent: aiIntent || "explore",
    },

    systemContext: {
      tasks,
      roles,
      tools,
      decisions,
      goals,
      principle:
        "A system is a network of tasks, roles, tools, decisions and goals that together produce value.",
    },

    readiness: {
      orgTrustInAI,
      dataMaturity,
      changeAppetite,
    },
  };
}
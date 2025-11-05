// src/IntakeScreen.jsx
import React, { useState } from "react";

/**
 * IntakeScreen
 * Wizard to capture AS-IS process and hand off a canvas-ready JSON to Nagare.
 *
 * Props:
 *  - onComplete(processJson): called when user finishes wizard
 *  - onSkip(): go straight to canvas with existing state
 */
export default function IntakeScreen({ onComplete, onSkip }) {
  const [step, setStep] = useState(1);

  // STEP 1 – basic process info
  const [processName, setProcessName] = useState("Customer refund handling");
  const [processOwnerName, setProcessOwnerName] = useState("Customer Operations Lead");
  const [processOwnerRole, setProcessOwnerRole] = useState("Head of Customer Experience");
  const [processDescription, setProcessDescription] = useState(
    "When a customer requests a refund, an agent reviews the case, checks eligibility in the billing system, " +
      "seeks approvals for larger amounts, and then triggers the refund in finance tools."
  );
  const [narrativeCurrent, setNarrativeCurrent] = useState(
    "Today, refunds are handled in email and the ticketing system. Agents manually jump between tools, " +
      "copy information, and wait on Slack approvals for high-value refunds. This leads to delays and inconsistency."
  );
  const [objectives, setObjectives] = useState([
    "Reduce refund turnaround time",
    "Ensure policy-compliant decisions",
  ]);
  const [newObjective, setNewObjective] = useState("");

  // STEP 2 – roles, tools, tasks
  const [roles, setRoles] = useState([
    "Customer Support Agent",
    "Refund Approver",
    "Finance Analyst",
  ]);
  const [newRole, setNewRole] = useState("");

  const [tools, setTools] = useState(["Helpdesk (Zendesk)", "Billing system", "ERP"]);
  const [newTool, setNewTool] = useState("");

  const [tasks, setTasks] = useState([
    {
      id: "t1",
      title: "Receive refund request",
      description: "Customer submits a refund via email or ticketing system.",
      roleIds: [0],
      toolIds: [0],
    },
    {
      id: "t2",
      title: "Check eligibility",
      description: "Agent reviews account and refund rules in billing system.",
      roleIds: [0],
      toolIds: [1],
    },
    {
      id: "t3",
      title: "Escalate for approval",
      description: "For high-value refunds, agent requests approval from approver via Slack/email.",
      roleIds: [0, 1],
      toolIds: [],
    },
    {
      id: "t4",
      title: "Trigger refund in finance",
      description: "Approved refunds are processed in ERP / finance systems.",
      roleIds: [2],
      toolIds: [2],
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskRoleIds, setNewTaskRoleIds] = useState([]); // indices into roles
  const [newTaskToolIds, setNewTaskToolIds] = useState([]); // indices into tools

  // STEP 3 – friction / challenges
  const [frictions, setFrictions] = useState([
    "Agents re-enter data across multiple systems",
    "Approvals for large refunds are slow and informal",
    "No single view of refund history per customer",
  ]);
  const [newFriction, setNewFriction] = useState("");

  // STEP 4 – AI hopes & readiness
  const [aiHopes, setAiHopes] = useState(
    "I hope AI can triage refund requests, flag risky cases, and automate straightforward approvals while keeping humans in control for edge cases."
  );

  const [trustSlider, setTrustSlider] = useState(60);
  const [dataSlider, setDataSlider] = useState(70);
  const [appetiteSlider, setAppetiteSlider] = useState(55);

  // --- helpers -----------------------------------------------------

  function addObjective() {
    const v = newObjective.trim();
    if (!v) return;
    setObjectives((curr) => [...curr, v]);
    setNewObjective("");
  }

  function addRole() {
    const v = newRole.trim();
    if (!v) return;
    setRoles((curr) => [...curr, v]);
    setNewRole("");
  }

  function addTool() {
    const v = newTool.trim();
    if (!v) return;
    setTools((curr) => [...curr, v]);
    setNewTool("");
  }

  function toggleNewTaskRole(index) {
    setNewTaskRoleIds((curr) =>
      curr.includes(index) ? curr.filter((i) => i !== index) : [...curr, index]
    );
  }

  function toggleNewTaskTool(index) {
    setNewTaskToolIds((curr) =>
      curr.includes(index) ? curr.filter((i) => i !== index) : [...curr, index]
    );
  }

  function addTask(task) {
    setTasks((curr) => [...curr, task]);
  }

  function addFriction() {
    const v = newFriction.trim();
    if (!v) return;
    setFrictions((curr) => [...curr, v]);
    setNewFriction("");
  }

  function handleNext() {
    setStep((s) => Math.min(4, s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  // --- mapping wizard -> canvas state ------------------------------

  function buildProcessJson() {
    const title = (processName || "").trim() || "Untitled process";

    const description =
      (narrativeCurrent || "").trim() ||
      (processDescription || "").trim();

    const ownerName = (processOwnerName || "").trim();
    const ownerRole = (processOwnerRole || "").trim();

    const objectivesClean = (objectives || [])
      .map((o) => o.trim())
      .filter(Boolean);

    const readiness = {
      trust: trustSlider ?? 50,
      data: dataSlider ?? 50,
      appetite: appetiteSlider ?? 50,
    };

    // Map wizard tasks -> canvas nodes
    const nodes = (tasks || []).map((t, idx) => {
      const roleNames = (t.roleIds || []).map((i) => roles[i]).filter(Boolean);
      const toolNames = (t.toolIds || []).map((i) => tools[i]).filter(Boolean);

      return {
        id: t.id || `n${idx + 1}`,
        name: t.title || `Step ${idx + 1}`,
        description: t.description || "",
        x: 80 + idx * 260,
        y: 220,
        owner: roleNames[0] || ownerName || "Owner",
        type: "manual",
        ai: "none",
        aiConfidence: 0,
        complexity: 2,
        valueFocus: "efficiency",
        stakeholders: roleNames,
        valueTags: toolNames,
        governanceOwner: ownerName || "Owner",
        governance: [],
        lever: {
          sees: "restricted",
          acts: "human",
          connect: "manual",
          rules: "policy",
          participates: "internal",
        },
      };
    });

    // Linear connections between nodes
    const connections = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i].id;
      const to = nodes[i + 1].id;
      connections.push({
        id: `c${i + 1}`,
        from,
        to,
        waitMinutes: 0,
        label: "",
      });
    }

    return {
      // Process info for ProcessInfoFlyout
      title,
      processDescription: description,
      processOwnerName: ownerName,
      processOwnerRole: ownerRole,
      processObjectives: objectivesClean,
      processFrictions: (frictions || []).map((f) => f.trim()).filter(Boolean),
      aiHopes: aiHopes.trim(),
      readiness,

      // Canvas structure
      nodes,
      connections,

      // Canvas flags
      mode: "build",
      connectMode: false,
      connectFrom: null,
      showInspector: true,
      valuePlan: [],
      autoMVA: true,
      manualMVAId: null,
    };
  }

  function handleFinish() {
    const processJson = buildProcessJson();
    onComplete(processJson);
  }

  // --- UI ----------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-semibold">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-wide text-slate-900">
              Nagare
            </span>
            <span className="text-[11px] text-slate-500">
              Design your AI-powered system
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="text-[11px] px-3 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        >
          Skip to canvas
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col overflow-hidden">
          {/* Progress header */}
          <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-900">
                Step {step} of 4
              </div>
              <div className="text-[11px] text-slate-500">
                Map today’s system so we can help you design a better one.
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <span
                className={
                  step === 1 ? "font-semibold text-slate-900" : undefined
                }
              >
                1. Process
              </span>
              <span>•</span>
              <span
                className={
                  step === 2 ? "font-semibold text-slate-900" : undefined
                }
              >
                2. System
              </span>
              <span>•</span>
              <span
                className={
                  step === 3 ? "font-semibold text-slate-900" : undefined
                }
              >
                3. Friction
              </span>
              <span>•</span>
              <span
                className={
                  step === 4 ? "font-semibold text-slate-900" : undefined
                }
              >
                4. AI fit
              </span>
            </div>
          </div>

          {/* Step body */}
          <div className="flex-1 overflow-auto px-6 py-4 space-y-6 text-xs text-slate-800">
            {/* STEP 1 */}
            {step === 1 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    1. Describe the process
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    A system is a network of tasks, roles, tools, decisions and
                    goals that together produce value. Let’s capture the
                    essentials of the system you want to redesign.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Process name
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={processName}
                      onChange={(e) => setProcessName(e.target.value)}
                      placeholder="e.g. Customer refund handling"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-700">
                      Process owner
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={processOwnerName}
                      onChange={(e) => setProcessOwnerName(e.target.value)}
                      placeholder="e.g. Customer Operations Lead"
                    />
                    <input
                      type="text"
                      className="mt-1 w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      value={processOwnerRole}
                      onChange={(e) => setProcessOwnerRole(e.target.value)}
                      placeholder="Role / responsibility (optional)"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Describe how the process works today
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={processDescription}
                    onChange={(e) => setProcessDescription(e.target.value)}
                    placeholder="High-level summary of the current process flow."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Narrative of the current system
                  </label>
                  <textarea
                    rows={4}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={narrativeCurrent}
                    onChange={(e) => setNarrativeCurrent(e.target.value)}
                    placeholder="What does this system feel like today? Where do people get stuck? How is value created?"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Objectives for this system
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {objectives.map((obj, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700"
                      >
                        {obj}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Add an objective"
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={addObjective}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* STEP 2 – system mapping */}
            {step === 2 && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    2. Map roles, tools and tasks
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Who is involved, which tools they use, and what tasks they
                    perform. Each task will become a step on the canvas.
                  </p>
                </div>

                {/* ROLES */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Key roles / actors
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {roles.map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Add role (e.g. Support Agent)"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={addRole}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* TOOLS */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Tools / systems
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tools.map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Add tool (e.g. Jira, Salesforce, Email)"
                      value={newTool}
                      onChange={(e) => setNewTool(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={addTool}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* TASK BUILDER */}
                <div className="space-y-3 mt-4">
                  <label className="text-[11px] font-medium text-slate-700">
                    Build tasks / steps
                  </label>
                  <p className="text-[11px] text-slate-500">
                    For each task, select the roles and tools involved, then
                    describe what happens. Each task becomes a step on the
                    canvas.
                  </p>

                  {/* Role pills */}
                  <div>
                    <div className="text-[11px] text-slate-600 mb-1">
                      Who is involved?
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {roles.map((r, i) => {
                        const active = newTaskRoleIds.includes(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleNewTaskRole(i)}
                            className={`px-2 py-0.5 rounded-full border text-[11px] transition
                              ${
                                active
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                              }`}
                          >
                            {r}
                          </button>
                        );
                      })}
                      {roles.length === 0 && (
                        <span className="text-[11px] text-slate-400">
                          Add roles above first.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tool pills */}
                  <div>
                    <div className="text-[11px] text-slate-600 mb-1">
                      Which tools are used?
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {tools.map((t, i) => {
                        const active = newTaskToolIds.includes(i);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleNewTaskTool(i)}
                            className={`px-2 py-0.5 rounded-full border text-[11px] transition
                              ${
                                active
                                  ? "bg-slate-900 border-slate-900 text-white"
                                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                              }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                      {tools.length === 0 && (
                        <span className="text-[11px] text-slate-400">
                          Add tools above first.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task text fields */}
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Task name (e.g. Triage new ticket)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                    <textarea
                      rows={2}
                      className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="What happens in this task? What triggers it? What is the outcome?"
                      value={newTaskDesc}
                      onChange={(e) => setNewTaskDesc(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!newTaskTitle.trim()) return;
                          const task = {
                            id: `t-${Date.now().toString(36)}`,
                            title: newTaskTitle.trim(),
                            description: newTaskDesc.trim(),
                            roleIds: newTaskRoleIds,
                            toolIds: newTaskToolIds,
                          };
                          addTask(task);
                          setNewTaskTitle("");
                          setNewTaskDesc("");
                          setNewTaskRoleIds([]);
                          setNewTaskToolIds([]);
                        }}
                        className="text-[11px] px-4 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                      >
                        + Add task
                      </button>
                    </div>
                  </div>

                  {/* Task list */}
                  <div className="space-y-2 max-h-56 overflow-auto mt-2">
                    {tasks.map((t) => (
                      <div
                        key={t.id}
                        className="border border-slate-200 rounded-xl bg-slate-50 px-3 py-2 text-xs"
                      >
                        <div className="font-semibold text-slate-900">
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-slate-600 text-[11px] mt-0.5">
                            {t.description}
                          </div>
                        )}
                        {t.roleIds?.length > 0 && (
                          <div className="mt-1 text-[11px] text-slate-500">
                            Roles:{" "}
                            {t.roleIds
                              .map((i) => roles[i])
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                        {t.toolIds?.length > 0 && (
                          <div className="text-[11px] text-slate-500">
                            Tools:{" "}
                            {t.toolIds
                              .map((i) => tools[i])
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                    {!tasks.length && (
                      <div className="text-[11px] text-slate-400 italic">
                        No tasks yet. Select roles &amp; tools, describe the
                        task, then click “+ Add task”.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* STEP 3 – friction */}
            {step === 3 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    3. Where does the system struggle?
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Capture the friction, bottlenecks, and risks in the current
                    system. We’ll use this in AI analysis later.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Friction points
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {frictions.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-rose-50 text-[11px] text-rose-700 border border-rose-100"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Add a friction point"
                      value={newFriction}
                      onChange={(e) => setNewFriction(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={addFriction}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* STEP 4 – AI fit & readiness */}
            {step === 4 && (
              <section className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    4. What do you hope AI changes?
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Capture how you’d like this system to change with AI, and
                    how ready your organisation feels.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Your hopes for AI in this system
                  </label>
                  <textarea
                    rows={3}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    value={aiHopes}
                    onChange={(e) => setAiHopes(e.target.value)}
                    placeholder="What would feel meaningfully better with AI?"
                  />
                </div>

                {/* Readiness sliders */}
                <div className="grid grid-cols-3 gap-4">
                  <ReadinessSlider
                    label="Trust in AI"
                    value={trustSlider}
                    onChange={setTrustSlider}
                    helper="How comfortable are people relying on AI suggestions?"
                  />
                  <ReadinessSlider
                    label="Data readiness"
                    value={dataSlider}
                    onChange={setDataSlider}
                    helper="How good are your data and systems for AI?"
                  />
                  <ReadinessSlider
                    label="Appetite for change"
                    value={appetiteSlider}
                    onChange={setAppetiteSlider}
                    helper="How ready is the organisation to change this system?"
                  />
                </div>
              </section>
            )}
          </div>

          {/* Footer navigation */}
          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
            <button
              type="button"
              onClick={onSkip}
              className="text-[11px] px-3 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            >
              Skip to canvas
            </button>

            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={step < 4 ? handleNext : handleFinish}
                className="text-[11px] px-4 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800"
              >
                {step < 4 ? "Next" : "Finish & go to canvas"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Small helper component for sliders */
function ReadinessSlider({ label, value, onChange, helper }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-700">{label}</span>
        <span className="text-[11px] text-slate-500">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <p className="text-[10px] text-slate-500">{helper}</p>
    </div>
  );
}
// src/ai.js
// Central place for all AI-powered analyses for Nagare.

// In production, DO NOT call Azure OpenAI directly from the browser
// (you would leak your API key). Instead, call your own backend
// endpoint (e.g. an Azure Function).
//
// For now, this file shows a frontend -> /api/analyze-process call.

export const ANALYSIS_TYPES = {
  constraintMapping: {
    id: "constraintMapping",
    label: "Constraint Mapping & AI Redesign",

    /**
     * Run AI analysis on the full Nagare state.
     * @param {object} appState - Full state from App.jsx
     * @returns {Promise<object>} - New process proposal:
     *   { nodes, connections, title?, processDescription?, analysisSummary? }
     */
    async run(appState) {
      // Payload we send to the backend AI service
      const payload = {
        type: "constraint-mapping-v1",
        state: appState,
      };

      // --- DEV MOCK MODE ---
      // If you don’t have a backend yet, you can uncomment this block
      // to return a fake “AI redesign” instead of calling a real API.
      /*
      console.log("[AI MOCK] Would send to backend:", payload);

      const clonedNodes = (appState.nodes || []).map((n, idx) => ({
        ...n,
        // shift AI proposal a bit down-right
        x: n.x + 80,
        y: n.y + 40,
        id: n.id + "_ai",
        name: n.name + " (AI)",
        ai: n.type === "agent" ? n.ai : "assistant",
        type: "agent",
      }));

      const clonedConnections = (appState.connections || []).map((c) => ({
        ...c,
        id: c.id + "_ai",
        from: c.from + "_ai",
        to: c.to + "_ai",
        label: c.label || "AI-optimized flow",
      }));

      return {
        title: appState.title + " – AI proposal",
        processDescription:
          (appState.processDescription || "") +
          "\n\n[AI MOCK] This is a mocked AI redesign.",
        nodes: clonedNodes,
        connections: clonedConnections,
        analysisSummary: {
          constraintNow: "scarcity",
          constraintFuture: "coordination",
          notes: [
            "AI agents now handle repetitive validation steps.",
            "Human roles focus on escalation and exception handling.",
          ],
        },
      };
      */

      // --- REAL BACKEND CALL (when you have an Azure Function/API) ---
      const res = await fetch("/api/analyze-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `AI analysis failed: ${res.status} ${res.statusText}\n${text}`
        );
      }

      const data = await res.json();

      // Expecting backend to return something like:
      // { newProcess: { nodes, connections, title?, processDescription?, analysisSummary? } }
      if (!data || !data.newProcess) {
        throw new Error("AI response missing newProcess field");
      }

      return data.newProcess;
    },
  },
};
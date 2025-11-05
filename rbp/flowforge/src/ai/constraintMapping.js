// src/ai/ConstraintMapping.js
import { v4 as uuidv4 } from "uuid";

/**
 * Constraint Mapping AI Analysis
 * --------------------------------------------
 * Analyses the AS-IS process JSON from Nagare, detects constraint patterns,
 * and generates a proposed TO-BE schema (with AI-augmented elements).
 *
 * Concept:
 * - Systems are constrained by scarcity, risk, or coordination.
 * - As AI fills knowledge gaps (scarcity), the bottleneck often shifts.
 * - This analysis imagines that shift and returns a redesigned process JSON.
 */

export async function runConstraintMappingAnalysis(asIsState, model = "gpt-4o-mini") {
  try {
    // --- 1) Extract essential system context ---
    const { title, processDescription, nodes = [], connections = [], systemContext = {} } = asIsState;

    const taskSummaries = nodes.map((n) => `${n.name} (${n.owner})`).join(", ");
    const constraintPrompt = `
We are analyzing a business process called "${title}".
Description: ${processDescription || "No description provided."}

Tasks: ${taskSummaries}

Roles: ${systemContext.roles}
Tools: ${systemContext.tools}
Decisions: ${systemContext.decisions}
Goals: ${systemContext.goals}

Follow Choudary's constraint mapping model:
1. Determine whether each task primarily faces SCARCITY (limited knowledge/expertise), RISK (uncertainty, bias, compliance), or COORDINATION (handoffs, dependencies).
2. Predict how AI could shift that constraint.
3. Suggest new tasks or redesigned steps that reflect the new constraint (e.g., from scarcity→coordination, scarcity→risk).
4. Return a new process as JSON using the same structure as the original, with:
   - Updated task names / owners where relevant
   - Added “agent” nodes where AI could augment work
   - Include a new property 'dominantConstraint' on each node
   - Keep connections sequential for simplicity
   - Update processDescription to describe the new AI-augmented state
`;

    // --- 2) Mock AI call (replace later with actual call) ---
    // Simulate a thoughtful AI response
    const toBeNodes = nodes.map((n, i) => ({
      ...n,
      id: "t" + (i + 1),
      type: n.type === "agent" ? "agent" : i % 3 === 0 ? "agent" : n.type,
      name: i % 3 === 0 ? `${n.name} (AI-assisted)` : n.name,
      dominantConstraint: i % 3 === 0 ? "coordination" : "risk",
      ai: i % 3 === 0 ? "advisor" : n.ai,
      aiConfidence: 85,
      description: `${n.description} — redesigned to reduce ${i % 3 === 0 ? "coordination" : "risk"} constraint.`,
      owner: n.owner,
      x: n.x,
      y: n.y + 180, // new line visually lower
    }));

    const toBeConnections = toBeNodes
      .slice(0, -1)
      .map((n, i) => ({
        id: uuidv4(),
        from: n.id,
        to: toBeNodes[i + 1].id,
        waitMinutes: 0,
        label: "",
      }));

    const newProcess = {
      ...asIsState,
      title: `${title} (AI-Augmented)`,
      processDescription: `AI-assisted redesign of the "${title}" system. Constraints have shifted from scarcity to coordination or risk.`,
      nodes: toBeNodes,
      connections: toBeConnections,
      analysisSummary: {
        method: "Constraint Mapping",
        previousConstraint: "scarcity",
        newConstraint: "coordination",
        notes:
          "The process was previously constrained by scarce expertise and manual coordination. AI introduces shared intelligence, reducing knowledge bottlenecks and revealing coordination complexity as the new constraint.",
      },
    };

    return newProcess;
  } catch (err) {
    console.error("ConstraintMapping AI analysis failed:", err);
    throw err;
  }
}
// src/ai/index.js
import { runConstraintMappingAnalysis } from "./ConstraintMapping";

export const ANALYSIS_TYPES = {
  constraintMapping: {
    name: "Constraint Mapping",
    description:
      "Detects dominant system constraints (scarcity, risk, coordination) and reimagines the process for an AI-augmented future.",
    run: runConstraintMappingAnalysis,
  },
};
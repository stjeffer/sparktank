// src/components/AnalyzeButton.jsx
import React, { useState } from "react";
import { Brain } from "lucide-react";
import { ANALYSIS_TYPES } from "../ai";

export default function AnalyzeButton({ state, setState }) {
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const { run } = ANALYSIS_TYPES.constraintMapping;
      const newProcess = await run(state);

      // Replace state with new AI-augmented version
      setState((s) => ({
        ...s,
        ...newProcess,
      }));

      alert("AI analysis complete! The new process is now displayed.");
    } catch (err) {
      alert("Analysis failed. Check console for details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      title="Analyze with AI"
      onClick={handleAnalyze}
      disabled={loading}
      className={`flex items-center justify-center rounded-full w-8 h-8 transition-colors ${
        loading
          ? "opacity-50 cursor-wait bg-gray-100 text-gray-400"
          : "hover:bg-gray-100 text-gray-700"
      }`}
    >
      <Brain
        size={18}
        className={`transition-transform ${
          loading ? "animate-pulse scale-95" : ""
        }`}
      />
    </button>
  );
}
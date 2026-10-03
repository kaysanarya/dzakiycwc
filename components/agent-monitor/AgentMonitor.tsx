"use client";

import React from "react";
import { AgentStep, ProductBlueprint } from "@/types";
import {
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Loader2,
  Cpu,
  RotateCcw,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface AgentMonitorProps {
  steps: AgentStep[];
  isGenerating: boolean;
  hasStarted: boolean;
  blueprint: ProductBlueprint | null;
  onOpenBlueprint: () => void;
  onRetry?: () => void;
  currentLogMessage?: string;
}

export function AgentMonitor({
  steps,
  isGenerating: _isGenerating,
  hasStarted,
  blueprint,
  onOpenBlueprint,
  onRetry,
  currentLogMessage,
}: AgentMonitorProps) {
  const { t, language } = useLanguage();

  return (
    <div className="card-flat p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
              {t.agentMonitor.title}
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 font-normal">
            {t.agentMonitor.desc}
          </p>
        </div>

        {blueprint && (
          <button
            type="button"
            onClick={onOpenBlueprint}
            aria-label="Lihat blueprint produk"
            className="btn-secondary h-7 px-2.5 text-xs gap-1.5"
          >
            <FileCode2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.agentMonitor.viewBlueprint}</span>
          </button>
        )}
      </div>

      {/* Main pipeline body */}
      <div className="py-4 flex-1">
        {!hasStarted ? (
          /* Initial Empty State */
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30">
            <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 mb-2.5">
              <Cpu className="w-5 h-5 text-zinc-300" />
            </div>
            <h4 className="text-xs font-semibold text-zinc-200">
              {t.agentMonitor.waitingForCommand}
            </h4>
            <p className="text-[11px] text-zinc-400 max-w-xs mt-1 leading-relaxed">
              {t.agentMonitor.waitingDesc}
            </p>
          </div>
        ) : (
          /* Active Pipeline Step Sequence */
          <div className="space-y-2.5">
            {steps.map((step, idx) => {
              const isPending = step.status === "pending";
              const isRunning = step.status === "running";
              const isCompleted = step.status === "completed";
              const isFailed = step.status === "failed";

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isRunning
                      ? "bg-blue-950/30 border-blue-600/50"
                      : isCompleted
                      ? "bg-zinc-900/60 border-zinc-800"
                      : isFailed
                      ? "bg-red-950/30 border-red-800/60"
                      : "bg-zinc-900/30 border-zinc-800/60 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Step Indicator */}
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                        {isRunning && (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                        {isFailed && (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        {isPending && (
                          <span className="text-[11px] text-zinc-500 font-mono font-medium">
                            0{idx + 1}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${isFailed ? "text-red-300" : "text-zinc-200"}`}>
                            {t.agentMonitor.stepLabel} {idx + 1}: {step.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Step Status Badge */}
                    <div className="shrink-0 text-[10px] font-medium">
                      {isRunning && (
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {t.agentMonitor.running}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {t.agentMonitor.completed}
                        </span>
                      )}
                      {isFailed && (
                        <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          {t.agentMonitor.failed}
                        </span>
                      )}
                      {isPending && (
                        <span className="text-zinc-500">{t.agentMonitor.pending}</span>
                      )}
                    </div>
                  </div>

                  {/* Step detail note if running/completed */}
                  {step.details && !isFailed && (
                    <div className="mt-2 text-[10px] font-mono text-zinc-300 bg-zinc-950 rounded p-1.5 border border-zinc-800">
                      &gt; {step.details}
                    </div>
                  )}

                  {/* Failed Step Error Message and Retry Action */}
                  {isFailed && (
                    <div className="mt-2 p-2 rounded bg-red-950/60 border border-red-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-xs text-red-300">
                        {step.error || step.details || (language === "id" ? "Terjadi kesalahan pada langkah ini." : "An error occurred during this step.")}
                      </p>
                      {onRetry && (
                        <button
                          type="button"
                          onClick={onRetry}
                          aria-label="Coba lagi langkah ini"
                          className="shrink-0 px-2.5 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-center"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{language === "id" ? "Coba lagi" : "Try again"}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Log Terminal Output */}
      {currentLogMessage && (
        <div className="mt-auto pt-3 border-t border-zinc-800">
          <div className="bg-zinc-950 text-zinc-300 rounded-lg p-2.5 text-xs font-mono border border-zinc-800">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-1 border-b border-zinc-800 mb-1.5">
              <span>{t.agentMonitor.pipelineConsole}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {t.agentMonitor.liveFeed}
              </span>
            </div>
            <p className="text-[11px] text-zinc-200 leading-relaxed truncate">
              $ {currentLogMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { AgentStep, ProductBlueprint } from "@/types";
import {
  CheckCircle2,
  AlertCircle,
  FileCode2,
  Loader2,
  Cpu,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface AgentMonitorProps {
  steps: AgentStep[];
  isGenerating: boolean;
  hasStarted: boolean;
  blueprint: ProductBlueprint | null;
  onOpenBlueprint: () => void;
  currentLogMessage?: string;
}

export function AgentMonitor({
  steps,
  isGenerating: _isGenerating,
  hasStarted,
  blueprint,
  onOpenBlueprint,
  currentLogMessage,
}: AgentMonitorProps) {
  const { t } = useLanguage();

  return (
    <div className="liquid-glass-card p-5 sm:p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <h2 className="text-base font-bold text-white tracking-tight uppercase">
              {t.agentMonitor.title}
            </h2>
          </div>
          <p className="text-xs text-white/50 mt-0.5 font-medium">
            {t.agentMonitor.desc}
          </p>
        </div>

        {blueprint && (
          <button
            type="button"
            onClick={onOpenBlueprint}
            className="liquid-glass-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[#3781fc] hover:text-white border border-white/[0.07] text-xs font-semibold cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5 text-[#3781fc]" />
            <span>{t.agentMonitor.viewBlueprint}</span>
          </button>
        )}
      </div>

      {/* Main pipeline body */}
      <div className="py-4 flex-1">
        {!hasStarted ? (
          /* Initial Empty State */
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.025] backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1951fc]/25 to-[#3781fc]/25 border border-white/[0.08] flex items-center justify-center text-[#3781fc] mb-3">
              <Cpu className="w-6 h-6 text-[#3781fc]" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wide">
              {t.agentMonitor.waitingForCommand}
            </h4>
            <p className="text-xs text-white/50 max-w-xs mt-1 leading-relaxed font-medium">
              {t.agentMonitor.waitingDesc}
            </p>
          </div>
        ) : (
          /* Active Pipeline Step Sequence */
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isPending = step.status === "pending";
              const isRunning = step.status === "running";
              const isCompleted = step.status === "completed";
              const isFailed = step.status === "failed";

              return (
                <div
                  key={step.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isRunning
                      ? "bg-[#1951fc]/15 border-[#3781fc]/40 shadow-[0_4px_12px_rgba(25,81,252,0.15)] backdrop-blur-md"
                      : isCompleted
                      ? "bg-white/[0.03] border-white/[0.06] backdrop-blur-md"
                      : isFailed
                      ? "bg-red-500/15 border-red-400/30 backdrop-blur-md"
                      : "bg-[#03195b]/15 border-[#3781fc]/10 opacity-70 backdrop-blur-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Step Indicator */}
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {isRunning && (
                          <Loader2 className="w-4 h-4 text-[#3781fc] animate-spin" />
                        )}
                        {isCompleted && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                        {isFailed && (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        {isPending && (
                          <span className="text-[11px] text-[#3781fc]/40 font-mono font-semibold">
                            0{idx + 1}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-white">
                            {t.agentMonitor.stepLabel} {idx + 1}: {step.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#cbe9fd]/45 mt-0.5 font-medium">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Step Status Badge */}
                    <div className="shrink-0 text-[10px] font-bold tracking-wider uppercase">
                      {isRunning && (
                        <span className="px-2.5 py-0.5 rounded-full bg-[#1951fc]/25 text-[#3781fc] border border-[#3781fc]/35">
                          {t.agentMonitor.running}
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                          {t.agentMonitor.completed}
                        </span>
                      )}
                      {isFailed && (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">
                          {t.agentMonitor.failed}
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[#3781fc]/35">{t.agentMonitor.pending}</span>
                      )}
                    </div>
                  </div>

                  {/* Step detail note if running/completed */}
                  {step.details && (
                    <div className="mt-2 text-[10px] font-mono text-white/60 bg-white/[0.03] rounded-xl p-2 border border-white/[0.05]">
                      &gt; {step.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Log Terminal Output - Deep Blue Glass */}
      {currentLogMessage && (
        <div className="mt-auto pt-3 border-t border-white/[0.06]">
          <div className="bg-[#020e2d]/90 backdrop-blur-xl text-white rounded-2xl p-3.5 text-xs font-mono border border-white/[0.06] shadow-[0_8px_24px_rgba(3,25,91,0.4)]">
            <div className="flex items-center justify-between text-[10px] text-[#3781fc]/60 pb-1.5 border-b border-[#3781fc]/30 mb-2">
              <span className="tracking-wider">{t.agentMonitor.pipelineConsole}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                {t.agentMonitor.liveFeed}
              </span>
            </div>
            <p className="text-[11px] text-white leading-relaxed truncate font-medium">
              $ {currentLogMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

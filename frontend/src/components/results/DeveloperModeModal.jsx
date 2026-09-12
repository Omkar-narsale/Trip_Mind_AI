import React, { useState } from 'react';
import { X, Terminal, Database, Copy, Check, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DeveloperModeModal({
  isOpen,
  onClose,
  planResponse,
  sessionId
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const persistence = planResponse?.persistence || {};
  const isCloud = persistence.supabase;
  const messages = planResponse?.execution?.messages || [];
  const tasks = planResponse?.planning_result?.tasks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">TripMind Developer Debug View</h3>
              <p className="text-[11px] text-slate-400">Technical agent pipeline traces & persistence diagnostics</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs font-mono">
          
          {/* Active Session & Cloud Persistence */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Session & Database Status
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-300 truncate">ID: {sessionId || 'N/A'}</span>
              {sessionId && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(sessionId);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 font-sans text-[11px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <div className="pt-2 flex items-center gap-2">
              {isCloud ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Supabase Cloud Confirmed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px]">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Local In-Memory Mode</span>
                </span>
              )}
            </div>
          </div>

          {/* LangGraph Decomposed Tasks */}
          {tasks.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                LangGraph Planning Tasks ({tasks.length})
              </span>
              <div className="space-y-1.5">
                {tasks.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] p-2 rounded bg-slate-900">
                    <span className="text-slate-300 font-bold">{t.task_name}</span>
                    <span className="text-emerald-400 uppercase text-[10px]">{t.status || 'COMPLETED'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent Execution Messages Stream */}
          {messages.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Agent Reasoning Stream ({messages.length} events)
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {messages.map((m, idx) => (
                  <div key={idx} className="text-[11px] text-slate-400 leading-relaxed font-mono">
                    <span className="text-slate-600 mr-2">[{idx + 1}]</span>
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs font-bold transition-colors"
          >
            Close Debug View
          </button>
        </div>

      </div>
    </div>
  );
}

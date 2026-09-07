import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, Bot, Cpu } from 'lucide-react';

export default function AgentActivity({ messages, status }) {
  if (!messages || messages.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="rounded-3xl bg-dark-950 border border-white/10 p-5 sm:p-6 shadow-card font-mono"
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-300 uppercase tracking-wider">
          <Terminal className="w-4 h-4 text-brand-400" />
          <span>TripMind Agent Execution Activity</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Workflow Synchronized
        </span>
      </div>

      <div className="space-y-1.5 text-xs text-slate-300 max-h-48 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <span className="text-brand-400 select-none font-bold">›</span>
            <span className="leading-relaxed">{msg}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

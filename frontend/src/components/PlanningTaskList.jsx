import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Cpu, 
  ListOrdered,
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react';

const PRIORITY_BADGES = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const STATUS_CONFIG = {
  completed: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
    label: 'Completed'
  },
  in_progress: {
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Loader2,
    spin: true,
    label: 'In Progress'
  },
  pending: {
    bg: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Clock,
    label: 'Pending'
  },
  failed: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: AlertCircle,
    label: 'Failed'
  },
  skipped: {
    bg: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: Clock,
    label: 'Skipped'
  }
};

export default function PlanningTaskList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-200">
        No planning tasks generated.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
          <ListOrdered className="w-5 h-5 text-brand-600" />
          <span>Autonomous Planning Task Workflow ({tasks.length} Steps)</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Sequenced by Graph Dependencies
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task, index) => {
          const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.completed;
          const StatusIcon = statusInfo.icon;
          const priorityStyle = PRIORITY_BADGES[task.priority?.toLowerCase()] || PRIORITY_BADGES.medium;

          return (
            <motion.div
              key={task.task_id || index}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft hover:border-brand-200 hover:shadow-card transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                
                {/* Task Header & Info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-brand-50 border border-brand-200/70 text-brand-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        {task.task_name}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        ({task.task_id})
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                </div>

                {/* Badges: Priority & Status */}
                <div className="flex sm:flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${statusInfo.bg}`}>
                    <StatusIcon className={`w-3.5 h-3.5 ${statusInfo.spin ? 'animate-spin' : ''}`} />
                    {statusInfo.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider border ${priorityStyle}`}>
                    {task.priority || 'medium'} Priority
                  </span>
                </div>
              </div>

              {/* Dependencies info */}
              {task.dependencies && task.dependencies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">Dependencies:</span>
                  {task.dependencies.map((dep, dIdx) => (
                    <span 
                      key={dIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]"
                    >
                      {dep}
                    </span>
                  ))}
                </div>
              )}

              {/* Simulated Execution Output */}
              {task.execution_output && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-start gap-2.5 leading-relaxed">
                  <Cpu className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-800">Simulation Status: </span>
                    <span className="text-slate-600">{task.execution_output}</span>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

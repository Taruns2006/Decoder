import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';

interface AIInsightProps {
  what?: string;
  why?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  title?: string;
  content?: string;
}

export const AIInsight: React.FC<AIInsightProps> = ({ 
  what, 
  why, 
  actionLabel, 
  onAction, 
  icon,
  title,
  content 
}) => {
  const displayWhat = what || title || "AI Insight";
  const displayWhy = why || content || "";

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0 text-brand-teal">
          {icon || <Sparkles size={18} />}
        </div>
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Recommended Action</h4>
          <p className="text-sm font-semibold text-white">{displayWhat}</p>
          {displayWhy && (
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              <strong className="text-slate-400 font-medium">Why: </strong>
              {displayWhy}
            </p>
          )}
        </div>
      </div>
      
      {actionLabel && onAction && (
        <div className="pt-2 flex justify-end">
          <button 
            onClick={onAction}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            {actionLabel}
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

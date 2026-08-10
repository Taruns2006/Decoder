import React, { useEffect, useState } from 'react';
import { assignmentAPI, syllabusAPI } from '../services/api';
import { 
  ShieldAlert, Plus, CheckCircle, Clock, Calendar, 
  Sparkles, CheckCircle2, ChevronRight, AlertTriangle, AlertCircle, X 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AssignmentsPage: React.FC = () => {
  const { refreshUser } = useAuth();
  
  const [assignments, setAssignments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Assignment form states
  const [showAdd, setShowAdd] = useState(false);
  const [subId, setSubId] = useState<number | string>('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estHours, setEstHours] = useState(2.0);
  const [priority, setPriority] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  // AI Assistant Overlay states
  const [activeAIAssist, setActiveAIAssist] = useState<any>(null);
  const [loadingAssist, setLoadingAssist] = useState(false);

  const loadAssignments = async () => {
    try {
      const res = await assignmentAPI.getAssignments();
      setAssignments(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to assignments database.');
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await syllabusAPI.getSubjects();
      setSubjects(res.data);
      if (res.data.length > 0) {
        setSubId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadAssignments(), loadSubjects()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subId || !dueDate) return;
    
    setSubmitting(true);
    try {
      await assignmentAPI.createAssignment({
        subject_id: Number(subId),
        title,
        description: desc,
        due_date: new Date(dueDate).toISOString(),
        priority: Number(priority),
        estimated_hours: Number(estHours)
      });
      setTitle('');
      setDesc('');
      setDueDate('');
      setEstHours(2.0);
      setPriority(3);
      setShowAdd(false);
      
      await loadAssignments();
      refreshUser();
    } catch (err) {
      console.error(err);
      alert('Failed to save assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'not_started' : 'completed';
    try {
      await assignmentAPI.updateAssignment(id, { status: nextStatus });
      await loadAssignments();
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLaunchAIAssistant = async (id: number) => {
    setLoadingAssist(true);
    setActiveAIAssist(null);
    try {
      const res = await assignmentAPI.getAssistant(id);
      setActiveAIAssist(res.data);
    } catch (err) {
      console.error(err);
      alert('AI Assistant compilation failed.');
    } finally {
      setLoadingAssist(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] flex-col">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm">Opening deadlines registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-brand-teal font-extrabold tracking-widest font-mono">DEADLINE RISK RADAR</span>
          <h2 className="text-2xl font-bold tracking-wide text-white">Assignments & Projects</h2>
        </div>
        
        <button 
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 bg-brand-teal text-brand-deep rounded-xl font-extrabold text-xs flex items-center gap-1.5 self-start"
        >
          <Plus size={16} />
          Create Assignment
        </button>
      </div>

      {assignments.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-brand-glass-border max-w-xl mx-auto">
          <ShieldAlert className="text-brand-teal mx-auto mb-4" size={48} />
          <h3 className="text-lg font-bold text-white">No Assignments Due</h3>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            Track your assignments, homework, presentation preparations, and vival deadlines. Risk score updates dynamically based on remaining time.
          </p>
          <button onClick={() => setShowAdd(true)} className="px-6 py-3 bg-brand-teal text-brand-deep rounded-xl font-bold text-sm">
            Create Your First Deadline
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const isCompleted = a.status === 'completed';
            
            // Risk styling properties
            const badgeClass = a.risk_level === 'High'
              ? 'bg-red-500/10 text-red-400 border border-red-500/25'
              : a.risk_level === 'Medium'
                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/25'
                : 'bg-green-500/10 text-green-400 border border-green-500/25';
                
            const badgeIndicator = a.risk_level === 'High' ? 'bg-red-400' : a.risk_level === 'Medium' ? 'bg-yellow-400' : 'bg-green-400';

            return (
              <div 
                key={a.id} 
                className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                  isCompleted ? 'border-brand-glass-border opacity-70' : 'border-brand-glass-border hover:border-brand-teal/35'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Complete Checkbox */}
                  <button 
                    onClick={() => handleToggleComplete(a.id, a.status)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      isCompleted 
                        ? 'bg-brand-teal border-brand-teal text-brand-deep' 
                        : 'border-brand-glass-border hover:border-brand-teal text-transparent'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </button>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-brand-teal font-extrabold uppercase bg-brand-teal/5 border border-brand-teal/15 px-2 py-0.5 rounded">
                        {a.subject_name}
                      </span>
                      <h4 className={`font-bold text-sm text-white ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                        {a.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">{a.description}</p>
                    
                    <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 uppercase font-medium">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Due: {new Date(a.due_date).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> Effort: {a.estimated_hours} Hours</span>
                    </div>
                  </div>
                </div>

                {/* Risk score & AI Helper button */}
                <div className="flex items-center gap-4 self-end lg:self-center shrink-0">
                  {!isCompleted && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeIndicator}`}></span>
                      {a.risk_level} Risk ({a.risk_score}%)
                    </div>
                  )}

                  {!isCompleted && (
                    <button
                      onClick={() => handleLaunchAIAssistant(a.id)}
                      className="px-3.5 py-2 bg-brand-dark border border-brand-glass-border hover:border-brand-teal/40 rounded-xl text-xs font-bold text-brand-teal flex items-center gap-1 shadow-sm"
                    >
                      <Sparkles size={14} />
                      AI Assistant
                    </button>
                  )}

                  {isCompleted && (
                    <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
                      ✓ Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Assistant Overlay */}
      {(loadingAssist || activeAIAssist) && (
        <div className="fixed inset-0 bg-brand-deep/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="glass-panel w-full max-w-xl p-6 rounded-2xl border border-brand-glass-border space-y-6 max-h-[85vh] overflow-y-auto relative">
            <button 
              onClick={() => { setActiveAIAssist(null); setLoadingAssist(false); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {loadingAssist ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-xs text-brand-teal font-semibold animate-pulse uppercase tracking-wider">Compiling conceptual checklists...</p>
              </div>
            ) : activeAIAssist ? (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] text-brand-teal font-extrabold tracking-widest uppercase">AI ASSIGNMENT HELPER</span>
                  <h3 className="font-bold text-lg text-white mt-1">{activeAIAssist.assignment_title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Subject: {activeAIAssist.subject_name}</p>
                </div>

                {/* Conceptual checklist */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-brand-cyan tracking-wider uppercase border-b border-brand-glass-border pb-1">Cognitive Checklist</h4>
                  <p className="text-[11px] text-slate-400">Complete these conceptual requirements before finalizing your work:</p>
                  <div className="space-y-2 mt-2">
                    {activeAIAssist.conceptual_checklist.map((item: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle size={14} className="text-brand-teal shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution plan steps */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-brand-cyan tracking-wider uppercase border-b border-brand-glass-border pb-1">Recommended Execution Schedule</h4>
                  <div className="space-y-2 mt-2">
                    {activeAIAssist.execution_steps.map((step: any, idx: number) => (
                      <div key={idx} className="bg-black/30 border border-brand-glass-border p-3 rounded-lg flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-semibold">{step.task}</span>
                        <span className="text-brand-teal font-bold bg-brand-teal/5 px-2 py-0.5 rounded border border-brand-teal/15">{step.estimated_hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Core concepts */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-brand-cyan tracking-wider uppercase border-b border-brand-glass-border pb-1">Foundational Concepts to Review</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {activeAIAssist.core_concepts_to_review.map((concept: string, idx: number) => (
                      <span key={idx} className="bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Academic Honesty alert */}
                <div className="bg-brand-teal/5 border border-brand-teal/20 p-3.5 rounded-xl text-[10px] text-slate-400 leading-relaxed flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-brand-teal shrink-0 mt-0.5" />
                  <span>
                    <strong>Educational Policy Integrity:</strong> The Atlantis assistant helps decompose requirements and verify conceptual correctness. It will not write complete drafts, code files, or essays. Focus on learning and originality.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-brand-deep/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-brand-glass-border space-y-4">
            <h3 className="font-bold text-lg text-white">Create Assignment</h3>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider">SELECT SUBJECT</label>
                <select value={subId} onChange={(e) => setSubId(e.target.value)} className="bg-black/30 text-xs">
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider">ASSIGNMENT TITLE</label>
                <input type="text" required placeholder="e.g. DBMS Normalization Project" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black/30 text-xs" />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider">DESCRIPTION / SPECIFICATIONS</label>
                <textarea placeholder="e.g. Decompose the relational structure to 3NF..." value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="bg-black/30 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold tracking-wider">ESTIMATED WORK HOURS</label>
                  <input type="number" min={0.5} step={0.5} value={estHours} onChange={(e) => setEstHours(Number(e.target.value))} className="bg-black/30 text-xs" />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold tracking-wider">PRIORITY LEVEL (1-5)</label>
                  <select value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="bg-black/30 text-xs">
                    <option value="1">Priority 1 (Urgent/Critical)</option>
                    <option value="2">Priority 2 (High)</option>
                    <option value="3">Priority 3 (Medium)</option>
                    <option value="4">Priority 4 (Low)</option>
                    <option value="5">Priority 5 (Elective)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider">DUE DATE & TIME</label>
                <input type="datetime-local" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-black/30 text-xs text-white" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-brand-teal text-brand-deep rounded-lg text-xs font-extrabold">{submitting ? 'Saving...' : 'Save Assignment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;

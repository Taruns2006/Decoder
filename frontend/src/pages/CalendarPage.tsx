import React, { useEffect, useState } from 'react';
import { plannerAPI, assignmentAPI } from '../services/api';
import { Calendar as CalendarIcon, Clock, ShieldAlert, BookOpenCheck, CalendarDays, Zap } from 'lucide-react';
import { AIInsight } from '../components/AIInsight';

const CalendarPage: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const sessRes = await plannerAPI.getSessions();
      setSessions(sessRes.data);
      
      const assignRes = await assignmentAPI.getAssignments();
      setAssignments(assignRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] flex-col">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm">Loading calendar configurations...</p>
      </div>
    );
  }

  // Group items by date string
  const calendarItems: Record<string, any[]> = {};

  sessions.forEach((s) => {
    const dStr = new Date(s.date).toDateString();
    if (!calendarItems[dStr]) calendarItems[dStr] = [];
    calendarItems[dStr].push({ ...s, itemType: 'session' });
  });

  assignments.forEach((a) => {
    const dStr = new Date(a.due_date).toDateString();
    if (!calendarItems[dStr]) calendarItems[dStr] = [];
    calendarItems[dStr].push({ ...a, itemType: 'assignment' });
  });

  // Generate next 7 days for list
  const nextDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    nextDays.push(d);
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Academic Calendar</h1>
        <p className="text-sm text-slate-400 mt-1">Your unified schedule across study sessions, deadlines, and project milestones.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next 7 Days Detail List */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <CalendarDays size={16} /> Agenda: Next 7 Days
          </h3>
          
          <div className="space-y-4">
            {nextDays.map((day, idx) => {
              const dStr = day.toDateString();
              const items = calendarItems[dStr] || [];
              const isToday = idx === 0;
              
              return (
                <div key={idx} className={`bg-slate-900 border ${isToday ? 'border-brand-teal/30' : 'border-slate-800'} p-5 rounded-xl space-y-4`}>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className={`text-sm font-bold uppercase tracking-wider ${isToday ? 'text-brand-teal' : 'text-slate-200'}`}>
                      {day.toLocaleDateString([], {weekday: 'long', month: 'short', day: 'numeric'})}
                      {isToday && <span className="ml-2 bg-brand-teal/20 text-brand-teal px-2 py-0.5 rounded text-[10px] font-bold">TODAY</span>}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{items.length} Activities</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-2 text-center bg-slate-800/20 rounded-lg">No scheduled activities or deadlines.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {items.map((item, iIdx) => {
                        const isSession = item.itemType === 'session';
                        
                        return (
                          <div 
                            key={iIdx} 
                            className={`p-3.5 rounded-lg border flex items-center justify-between gap-4 transition-colors ${
                              isSession 
                                ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60' 
                                : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  isSession ? 'bg-brand-teal/10 text-brand-teal' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {isSession ? `Session: ${item.type}` : 'DEADLINE'}
                                </span>
                                <h4 className={`font-bold text-sm leading-none ${isSession ? 'text-white' : 'text-red-100'}`}>{item.title || item.topic_name}</h4>
                              </div>
                              <p className="text-xs text-slate-400 font-medium">
                                {isSession ? `${item.subject_name} | ${item.start_time} - ${item.end_time}` : `${item.subject_name} | Due at ${new Date(item.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                              </p>
                            </div>

                            {/* Status indicator */}
                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border shrink-0 ${
                              item.status === 'completed' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {item.status || 'scheduled'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-5">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider">Calendar Legend</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-md bg-brand-teal/20 border border-brand-teal/40"></span>
                <span className="text-slate-300 font-medium text-sm">Study Planner Sessions</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-md bg-red-500/20 border border-red-500/40"></span>
                <span className="text-slate-300 font-medium text-sm">Critical Assignments & Exams</span>
              </div>
            </div>
          </div>

          <AIInsight 
            title="Automated Synchronization"
            content="When the Study Planner recalibrates due to performance updates, this calendar automatically updates. Deadlines from your Syllabus and missing skills from your Career Roadmap are directly synced here."
          />
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;

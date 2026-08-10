import React, { useEffect, useState } from 'react';
import { progressAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { Award, AlertTriangle, ChevronRight, CheckCircle2, ShieldAlert, Sparkles, BookOpen, Bot, CalendarPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ProgressPage: React.FC = () => {
  const { refreshUser } = useAuth();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProgressData = async () => {
    try {
      const res = await progressAPI.getAnalytics();
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to progress intelligence API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgressData();
    refreshUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh] flex-col">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm">Opening progress records...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 p-6 text-center rounded-xl border border-red-500/30 max-w-xl mx-auto mt-10">
        <AlertTriangle className="text-red-400 mx-auto mb-4" size={36} />
        <h3 className="text-md font-bold text-white">Records Offline</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">{error || 'Failed to parse records.'}</p>
        <button onClick={loadProgressData} className="px-4 py-2 bg-brand-teal text-slate-900 rounded-lg font-bold text-xs hover:bg-brand-teal/90 transition-colors">Retry Connection</button>
      </div>
    );
  }

  // Define intensity colors for Git-like heatmap
  const getIntensityClass = (count: number) => {
    if (count === 0) return 'bg-slate-800 border border-slate-700/50';
    if (count === 1) return 'bg-brand-teal/30 border border-brand-teal/40';
    if (count === 2) return 'bg-brand-teal/60 border border-brand-teal/70';
    return 'bg-brand-teal border border-brand-cyan';
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Progress Intelligence</h1>
        <p className="text-sm text-slate-400 mt-1">Your mastery, learning activity, and detected knowledge gaps over time.</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Syllabus Completion */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Overall Syllabus Completion</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-white tracking-tight">{data.overall_completion_percentage}%</span>
            <span className="text-xs font-medium text-slate-400">Total Chapters</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-5 overflow-hidden">
            <div className="bg-blue-400 h-full rounded-full transition-all duration-1000" style={{ width: `${data.overall_completion_percentage}%` }}></div>
          </div>
        </div>

        {/* Course Mastery */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Overall Syllabus Mastery</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-brand-teal tracking-tight">{data.overall_mastery_percentage}%</span>
            <span className="text-xs font-medium text-slate-400">Quiz Accuracy</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-5 overflow-hidden">
            <div className="bg-brand-teal h-full rounded-full transition-all duration-1000 delay-100" style={{ width: `${data.overall_mastery_percentage}%` }}></div>
          </div>
        </div>

        {/* Readiness Rank */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Atlantis Readiness Rank</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-brand-purple tracking-tight">{data.readiness_score}</span>
            <span className="text-sm font-medium text-slate-500">/ 100</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-5 overflow-hidden">
            <div className="bg-brand-purple h-full rounded-full transition-all duration-1000 delay-200" style={{ width: `${data.readiness_score}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Subjects Details & Heatmap */}
        <div className="lg:col-span-2 space-y-8">
          {/* Subject Mastery List */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider">Subject-Wise Mastery vs Completion</h3>
            
            <div className="space-y-5 pt-4">
              {data.subjects.map((sub: any) => (
                <div key={sub.subject_id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white text-sm">{sub.subject_name}</span>
                    <span className="text-slate-400 font-medium">
                      Completion: <strong className="text-white">{sub.completion_percentage}%</strong> | Mastery: <strong className="text-brand-teal">{sub.mastery_percentage}%</strong>
                    </span>
                  </div>
                  {/* Two progress bars */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-400 h-full rounded-full transition-all duration-1000" style={{ width: `${sub.completion_percentage}%` }}></div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-brand-teal h-full rounded-full transition-all duration-1000 delay-100" style={{ width: `${sub.mastery_percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub Style Heatmap Grid */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Learning Activity Tracker</h3>
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Last 30 Days</span>
            </div>

            <div className="flex flex-wrap gap-2.5 justify-center py-6">
              {data.heatmap.map((cell: any, idx: number) => (
                <div 
                  key={idx}
                  title={`${cell.date}: ${cell.count} actions completed`}
                  className={`w-6 h-6 rounded-md transition-all shrink-0 ${getIntensityClass(cell.count)}`}
                ></div>
              ))}
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold uppercase mt-2">
              <span>30 Days ago</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <span className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700/50"></span>
                <span className="w-3 h-3 rounded-sm bg-brand-teal/30 border border-brand-teal/40"></span>
                <span className="w-3 h-3 rounded-sm bg-brand-teal/60 border border-brand-teal/70"></span>
                <span className="w-3 h-3 rounded-sm bg-brand-teal border border-brand-cyan"></span>
                <span>More</span>
              </div>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Right Column: Gap Detector list */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-brand-teal/30 h-full shadow-[0_0_15px_rgba(45,212,191,0.05)]">
            <h3 className="font-bold text-sm text-white mb-4 border-b border-slate-800 pb-3 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={16} className="text-brand-cyan" />
              Learning Gap Detector
            </h3>

            {data.detected_gaps.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-12">
                <CheckCircle2 className="mx-auto text-brand-teal mb-3" size={36} />
                No critical learning gaps detected!<br/>Keep completing topic quizzes.
              </div>
            ) : (
              <div className="space-y-5">
                {data.detected_gaps.map((gap: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{gap.subject_name}</span>
                      <h4 className="font-bold text-sm text-white leading-tight mt-1">Struggling with: {gap.weak_topic}</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{gap.reason}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-700/50">
                      <p className="text-[10px] text-brand-teal font-bold uppercase tracking-wider">Recovery Actions:</p>
                      {gap.plan.map((step: string, sIdx: number) => (
                        <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                          <ChevronRight size={14} className="text-brand-teal shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>

                    {/* Cross-feature deep links */}
                    <div className="grid grid-cols-2 gap-2 pt-3">
                      <Link to="/dashboard/tutor" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-300 transition-colors text-center">
                        <Bot size={16} className="text-brand-purple" />
                        Discuss Topic
                      </Link>
                      <Link to="/dashboard/planner" className="flex flex-col items-center justify-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-xs font-semibold text-slate-300 transition-colors text-center">
                        <CalendarPlus size={16} className="text-brand-teal" />
                        Schedule Session
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;

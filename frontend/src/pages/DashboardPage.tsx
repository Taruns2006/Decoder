import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { studentAPI, progressAPI, plannerAPI, careerAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { AIInsight } from '../components/AIInsight';
import { SkeletonCard } from '../components/Skeleton';
import {
  Flame, Award, BookOpen, Clock, Calendar, AlertTriangle,
  Target, Map, Briefcase, ChevronRight, CheckSquare, Brain
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [plannerData, setPlannerData] = useState<any>(null);
  const [careerData, setCareerData] = useState<any>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [dashRes, progRes, planRes, carRes] = await Promise.allSettled([
          studentAPI.getDashboard(),
          progressAPI.getAnalytics(),
          plannerAPI.getSessions(),
          careerAPI.getRoadmap()
        ]);

        if (dashRes.status === 'fulfilled') setDashboardData(dashRes.value.data);
        if (progRes.status === 'fulfilled') setProgressData(progRes.value.data);
        if (planRes.status === 'fulfilled') setPlannerData(planRes.value.data);
        if (carRes.status === 'fulfilled') setCareerData(carRes.value.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
    refreshUser();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white">Home Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Derived Data
  const gap = progressData?.detected_gaps?.[0];
  const todaySessions = plannerData?.filter((s: any) => new Date(s.scheduled_for).toDateString() === new Date().toDateString());
  const roadmapSteps = careerData?.steps || [];
  const nextSkill = roadmapSteps.find((r: any) => r.status !== 'completed');

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* ── Header ───────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back, {user?.name}</h1>
        <p className="text-sm text-slate-400 mt-1">Here is your intelligence brief for today.</p>
      </div>

      {/* ── Key Metrics Overview ─────────────────────────── */}
      {dashboardData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-start text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Readiness</span>
              <Award size={14} className="text-brand-teal" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{dashboardData.readiness_score}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-start text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Mastery</span>
              <Brain size={14} className="text-brand-teal" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{progressData?.overall_mastery_percentage || 0}%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-start text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Weekly Study</span>
              <Clock size={14} className="text-brand-teal" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{dashboardData.weekly_hours_studied.toFixed(1)}h</span>
              <span className="text-xs text-slate-500">/ {dashboardData.weekly_hours_target}h</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-start text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Streak</span>
              <Flame size={14} className="text-orange-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{user?.streak}</span>
              <span className="text-xs text-slate-500">days</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Intelligence Grid ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Learning (What should I learn next?) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <BookOpen size={16} /> Learning & Academic
          </h2>
          
          {gap ? (
            <AIInsight 
              icon={<AlertTriangle size={18} className="text-yellow-400" />}
              what={`Review: ${gap.subject_name} — ${gap.weak_topic}`}
              why={gap.reason}
              actionLabel="Start Targeted Practice"
              onAction={() => navigate('/dashboard/progress')}
            />
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center h-48">
              <CheckSquare className="text-brand-teal mb-3" size={24} />
              <p className="text-sm font-semibold text-white">No critical gaps detected.</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">You are on track with your syllabus.</p>
              <Link to="/dashboard/syllabus" className="text-xs font-semibold text-brand-teal hover:text-white transition-colors">
                Continue learning →
              </Link>
            </div>
          )}
        </div>

        {/* 2. Planning (What should I do today?) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Target size={16} /> Today's Plan
          </h2>
          
          {todaySessions && todaySessions.length > 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Scheduled Sessions</p>
              {todaySessions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div>
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{s.duration_minutes} min</p>
                  </div>
                  <Link to="/dashboard/planner" className="text-xs font-bold text-brand-teal hover:text-white px-3 py-1.5 bg-brand-teal/10 rounded-md transition-colors">
                    View
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <AIInsight 
              icon={<Calendar size={18} />}
              what="You have no study sessions scheduled for today."
              why="Maintaining a consistent daily schedule improves retention by 40%."
              actionLabel="Generate Study Plan"
              onAction={() => navigate('/dashboard/planner')}
            />
          )}
        </div>

        {/* 3. Career (What should I improve for my target career?) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Briefcase size={16} /> Career Readiness
          </h2>

          {careerData?.target_role ? (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Target Role</p>
                  <p className="text-sm font-bold text-white mt-1">{careerData.target_role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Match</p>
                  <p className="text-lg font-bold text-brand-teal mt-0.5">{careerData.match_percentage}%</p>
                </div>
              </div>

              {nextSkill ? (
                <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">Recommended next skill:</p>
                  <p className="text-sm font-semibold text-white flex justify-between items-center">
                    {nextSkill.title}
                    <Link to="/dashboard/roadmap" className="text-xs text-brand-teal hover:text-white transition-colors">
                      View roadmap →
                    </Link>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">You have completed your current career roadmap!</p>
              )}
            </div>
          ) : (
             <AIInsight 
              icon={<Map size={18} />}
              what="Your career profile is incomplete."
              why="Analyzing your resume against target roles allows Atlantis to recommend the exact skills you need to learn."
              actionLabel="Upload Resume"
              onAction={() => navigate('/dashboard/resume')}
            />
          )}
        </div>

        {/* 4. Deadlines & Actions */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Clock size={16} /> Upcoming Deadlines
          </h2>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-3">
            {dashboardData?.upcoming_deadlines?.length > 0 ? (
              dashboardData.upcoming_deadlines.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div>
                    <p className="text-sm font-semibold text-white">{d.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Due in {d.hours_left}h</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    d.risk_level === 'High' ? 'bg-red-500/20 text-red-400' : 
                    d.risk_level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {d.risk_level} Risk
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center">
                <CheckSquare className="mx-auto text-brand-teal mb-2" size={20} />
                <p className="text-sm font-semibold text-white">No urgent deadlines.</p>
                <p className="text-xs text-slate-400 mt-1">You are all caught up on assignments.</p>
              </div>
            )}
            
            <div className="pt-2">
               <Link to="/dashboard/assignments" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 justify-center bg-slate-800 py-2 rounded-lg">
                View all assignments <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useEffect, useState } from 'react';
import { careerAPI, resumeAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  Map, Sparkles, AlertCircle, CheckCircle, Clock, 
  ArrowRight, ShieldAlert, Award, Star, Compass, Play,
  Target, TargetIcon, PlusCircle, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AIInsight } from '../components/AIInsight';

const CareerRoadmapPage: React.FC = () => {
  const { refreshUser } = useAuth();
  
  const [roadmap, setRoadmap] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const loadRoadmapAndProjects = async () => {
    try {
      const rmRes = await careerAPI.getRoadmap();
      setRoadmap(rmRes.data.roadmap);
      setSteps(rmRes.data.steps);
      
      const projRes = await careerAPI.getProjects();
      setProjects(projRes.data);
      
      const skillsRes = await resumeAPI.getSkills();
      setSkills(skillsRes.data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to career services API.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadRoadmapAndProjects();
      setLoading(false);
    };
    init();
  }, []);

  const handleGenerateRoadmap = async () => {
    setGenerating(true);
    try {
      const res = await careerAPI.generateRoadmap();
      setRoadmap(res.data.roadmap);
      setSteps(res.data.steps);
      
      // Reload projects as well since they get updated
      const projRes = await careerAPI.getProjects();
      setProjects(projRes.data);
      refreshUser();
    } catch (err) {
      console.error(err);
      alert('Failed to generate career roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  const handleProjectStatusChange = async (id: number, status: string) => {
    try {
      await careerAPI.updateProjectStatus(id, status);
      await loadRoadmapAndProjects();
      refreshUser();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || generating) {
    return (
      <div className="flex items-center justify-center h-[50vh] flex-col">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm">Generating career roadmap pathways...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Career Roadmap</h1>
          <p className="text-sm text-slate-400 mt-1">Navigate your learning path towards your target role.</p>
        </div>
        
        <button
          onClick={handleGenerateRoadmap}
          className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors self-start"
        >
          <Sparkles size={14} />
          {roadmap ? 'Regenerate Roadmap' : 'Generate Roadmap'}
        </button>
      </div>

      {/* Skills Gap Matrix */}
      {skills.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="font-bold text-sm text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
             <Target size={16} className="text-slate-500" /> Skill Gap Matrix
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-300">
              <thead className="bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Skill Name</th>
                  <th className="px-4 py-3">Verified Level</th>
                  <th className="px-4 py-3">Origin Evidence</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {skills.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">{s.skill_name}</td>
                    <td className="px-4 py-3 uppercase text-xs">{s.proficiency_level}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{s.evidence_description}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-[10px] font-bold border border-green-500/20">VERIFIED</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!roadmap ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl max-w-xl mx-auto">
          <Map className="text-brand-teal mx-auto mb-4 animate-pulse" size={48} />
          <h3 className="text-lg font-bold text-white">No Roadmap Generated</h3>
          <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
            Atlantis generates phase-by-phase learning guidelines and recommends concrete portfolio projects based on your target career goals.
          </p>
          <button onClick={handleGenerateRoadmap} className="px-6 py-3 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-sm transition-colors">
            Generate Career Path
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Roadmap Steps */}
          <div className="lg:col-span-2 space-y-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Compass size={16} /> Milestone Phases
            </h3>
            
            <div className="space-y-4 relative pl-4 border-l-2 border-slate-800 ml-3">
              {steps.map((step, idx) => {
                const active = step.status === 'in_progress';
                const completed = step.status === 'completed';
                
                return (
                  <div key={step.id} className="relative space-y-2 pb-2">
                    {/* Circle Indicator on left border */}
                    <div className={`absolute -left-[23px] top-4 w-4 h-4 rounded-full border-2 ${
                      completed 
                        ? 'bg-green-500 border-green-500' 
                        : active 
                          ? 'bg-brand-teal border-brand-teal shadow-[0_0_10px_rgba(45,212,191,0.5)]' 
                          : 'bg-slate-900 border-slate-700'
                    }`}></div>

                    {/* Step Card */}
                    <div className={`bg-slate-900 p-5 rounded-xl border ${
                      active ? 'border-brand-teal/40 bg-brand-teal/5' : 'border-slate-800'
                    }`}>
                      <span className="text-[10px] text-brand-teal font-extrabold uppercase tracking-widest">{step.phase_name}</span>
                      <h4 className="font-bold text-base text-white mt-1">{step.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed mt-2">{step.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-4">
                        {step.skills_to_acquire.map((sk: string, sIdx: number) => (
                          <span key={sIdx} className="bg-slate-800 border border-slate-700 text-xs text-slate-300 font-medium px-2.5 py-1 rounded-md">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Recommendations */}
          <div className="space-y-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award size={16} /> Portfolio Projects
            </h3>
            
            {projects.length === 0 ? (
              <div className="text-sm text-slate-500 py-8 text-center bg-slate-900 border border-slate-800 rounded-xl">
                No projects suggested. Generate roadmap first.
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((p) => {
                  const completed = p.status === 'completed';
                  const inProgress = p.status === 'in_progress';
                  
                  return (
                    <div key={p.id} className={`bg-slate-900 p-5 rounded-xl border space-y-4 transition-all ${
                      completed ? 'border-green-500/30 opacity-75' : 'border-slate-800'
                    }`}>
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-brand-teal font-bold uppercase tracking-widest">Recommended Project</span>
                        <h4 className="font-bold text-sm text-white leading-snug">{p.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed pt-1">{p.description}</p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {p.required_skills.map((sk: string, sIdx: number) => (
                          <span key={sIdx} className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {sk}
                          </span>
                        ))}
                      </div>

                      {/* Planner Connection Call-to-action */}
                      {!completed && (
                        <Link to="/dashboard/planner" className="flex items-center gap-1.5 text-xs text-brand-teal hover:text-white transition-colors font-semibold py-1">
                          <PlusCircle size={14} /> Schedule time in Planner
                        </Link>
                      )}

                      <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                        {completed ? (
                          <span className="bg-green-500/10 text-green-400 px-2.5 py-1 rounded text-[10px] font-bold border border-green-500/20 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Project Finalized
                          </span>
                        ) : inProgress ? (
                          <>
                            <span className="text-[10px] text-brand-teal font-semibold flex items-center gap-1"><Sparkles size={12} /> IN DEVELOPMENT</span>
                            <button
                              onClick={() => handleProjectStatusChange(p.id, 'completed')}
                              className="px-3 py-1.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Finalize Project
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-slate-500 font-semibold">NOT STARTED</span>
                            <button
                              onClick={() => handleProjectStatusChange(p.id, 'in_progress')}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 rounded-lg text-[10px] font-bold transition-colors"
                            >
                              Initiate Project
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmapPage;

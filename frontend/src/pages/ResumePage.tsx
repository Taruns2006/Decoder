import React, { useEffect, useState } from 'react';
import { resumeAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  FileCode, Sparkles, Award, CheckSquare, XSquare, 
  AlertTriangle, UploadCloud, CheckCircle2, ChevronRight,
  Briefcase, Map, Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AIInsight } from '../components/AIInsight';

const ResumePage: React.FC = () => {
  const { refreshUser } = useAuth();
  
  const [skills, setSkills] = useState<any[]>([]);
  const [targetRole, setTargetRole] = useState('Machine Learning Engineer');
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(true);

  const loadSkills = async () => {
    setSkillsLoading(true);
    try {
      const res = await resumeAPI.getSkills();
      setSkills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSkillsLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleTextAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText.trim()) return;
    
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await resumeAPI.analyzeResume({
        resume_text: resumeText,
        target_role: targetRole
      });
      setAnalysis(res.data);
      loadSkills();
      refreshUser();
    } catch (err) {
      console.error(err);
      alert('Resume analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setAnalysis(null);
    
    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('target_role', targetRole);
    
    try {
      const res = await resumeAPI.uploadResume(formData);
      setAnalysis(res.data);
      loadSkills();
      refreshUser();
    } catch (err) {
      console.error(err);
      alert('Resume file analysis failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Resume Intelligence</h1>
        <p className="text-sm text-slate-400 mt-1">Audit your resume evidence and extract skills for your target career.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload / Paste */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-5">
            <h3 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-3 uppercase tracking-wider flex items-center gap-2">
              <Target size={16} className="text-slate-500" /> Configure Audit
            </h3>
            
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold tracking-wider">TARGET ROLE</label>
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="bg-slate-800 border border-slate-700 text-sm rounded-lg p-2.5 text-white focus:ring-1 focus:ring-brand-teal focus:border-brand-teal transition-all outline-none">
                <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="Frontend Engineer">Frontend Engineer</option>
              </select>
            </div>

            {/* Upload File */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block">Option A: Upload Resume PDF</label>
              <label className="w-full py-8 border border-dashed border-slate-700 hover:border-brand-teal hover:bg-slate-800/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-slate-800/20">
                <UploadCloud size={28} className={uploading ? "text-brand-teal animate-pulse" : "text-slate-500"} />
                <span className="text-xs font-semibold text-slate-400">{uploading ? 'Analyzing PDF Content...' : 'Choose PDF File'}</span>
                <input type="file" onChange={handleFileUpload} accept=".pdf" className="hidden" disabled={uploading || analyzing} />
              </label>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-600 text-xs font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Paste Text */}
            <form onSubmit={handleTextAnalysis} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Option B: Paste Resume Text</label>
                <textarea 
                  value={resumeText} 
                  onChange={(e) => setResumeText(e.target.value)} 
                  placeholder="Paste your experience details and list of skills..." 
                  rows={5} 
                  className="bg-slate-800 border border-slate-700 text-sm rounded-lg p-3 text-white focus:ring-1 focus:ring-brand-teal focus:border-brand-teal transition-all outline-none resize-none" 
                />
              </div>

              <button
                type="submit"
                disabled={analyzing || !resumeText.trim()}
                className="w-full py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={14} />
                {analyzing ? 'Auditing Resume Evidence...' : 'Run Skill Audit'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Columns: Results / Extracted Skills */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audit Results Panel */}
          {analysis && (
            <div className="bg-slate-900 border border-brand-teal/30 p-6 rounded-xl space-y-6">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Resume Evidence Analysis</h3>
                  <p className="text-xs text-brand-teal font-semibold mt-1">Target: {targetRole}</p>
                </div>
                {/* ATS Score */}
                <div className="text-right">
                  <div className="text-3xl font-black text-white">{analysis.ats_score} <span className="text-sm font-medium text-slate-500">/ 100</span></div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-semibold">ATS Match Score</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-400 tracking-wider uppercase">Detected Strengths</h4>
                  <div className="space-y-2">
                    {analysis.strengths.map((str: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Gaps */}
                {analysis.evidence_gaps && analysis.evidence_gaps.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-xs text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                      Evidence Gaps
                    </h4>
                    <p className="text-xs text-slate-500">Skills claimed but not demonstrated in projects:</p>
                    <div className="space-y-2 mt-1">
                      {analysis.evidence_gaps.map((gap: any, idx: number) => (
                        <div key={idx} className="bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded-lg text-xs">
                          <span className="text-yellow-400 font-bold">{gap.skill}: </span>
                          <span className="text-slate-300">{gap.feedback}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl space-y-3">
                <h4 className="font-bold text-xs text-brand-teal uppercase tracking-wider">Improvement Plan</h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <ChevronRight size={16} className="text-brand-teal shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call to action connecting to Roadmap */}
              <div className="pt-2">
                 <Link to="/dashboard/roadmap" className="w-full py-3 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal border border-brand-teal/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Map size={16} />
                    View Career Roadmap & Skill Gaps
                    <ChevronRight size={16} />
                 </Link>
              </div>
            </div>
          )}

          {/* Extracted Skills List */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <h3 className="font-bold text-sm text-slate-200 mb-4 border-b border-slate-800 pb-3 uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={16} className="text-slate-500" /> Extracted Skill Inventory
            </h3>
            
            {skillsLoading ? (
              <div className="py-8 text-center">
                <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : skills.length === 0 ? (
              <div className="text-sm text-slate-500 py-8 text-center bg-slate-800/20 rounded-lg border border-slate-800 border-dashed">
                <Briefcase className="mx-auto mb-3 text-slate-600" size={24} />
                No verified skills found.<br/>Run an audit to extract skills from your resume.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skills.map((s) => (
                  <div key={s.id} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-white leading-none">{s.skill_name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 uppercase font-medium">Evidence: {s.source} ({s.proficiency_level})</p>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{s.evidence_description}</p>
                    </div>
                    <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded text-[9px] font-bold border border-green-500/20 shrink-0">VERIFIED</span>
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

export default ResumePage;

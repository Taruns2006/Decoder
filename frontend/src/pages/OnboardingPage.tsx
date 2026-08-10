import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Compass, Book, Target, Award, ArrowRight, ShieldAlert } from 'lucide-react';

const OnboardingPage: React.FC = () => {
  const { onboard } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [studentType, setStudentType] = useState('college'); // school or college
  const [institution, setInstitution] = useState('');
  const [courseClass, setCourseClass] = useState('');
  const [year, setYear] = useState('Year 3');
  const [goals, setGoals] = useState('');
  const [careerInterests, setCareerInterests] = useState('Machine Learning Engineer');
  const [weeklyHours, setWeeklyHours] = useState(15);
  const [preferredStudyTime, setPreferredStudyTime] = useState('evening');
  const [currentSkillLevel, setCurrentSkillLevel] = useState('Intermediate');

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      setError('Please provide your name to continue.');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      name,
      student_type: studentType,
      institution,
      course_class: courseClass,
      year,
      goals,
      career_interests: [careerInterests],
      weekly_hours: Number(weeklyHours),
      preferred_study_time: preferredStudyTime,
      current_skill_level: currentSkillLevel,
    };

    try {
      await onboard(payload);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Failed to save profile configuration. Please check your inputs.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-deep flex items-center justify-center p-6 relative overflow-hidden text-white">
      {/* Background glow effects */}
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-teal/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-purple/5 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl glass-panel p-8 rounded-2xl border border-brand-glass-border shadow-2xl relative z-10">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-brand-glass-border">
          <div>
            <span className="text-[10px] text-brand-teal font-extrabold tracking-widest">ONBOARDING CONFIGURATION</span>
            <h2 className="text-xl font-bold tracking-wider uppercase">Calibrating your Student OS</h2>
          </div>
          <span className="text-sm font-bold text-brand-cyan">STEP {step} / 3</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3.5 mb-6 flex items-start gap-2.5 text-xs text-red-400">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Academic Profile */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2 text-brand-teal">
                <Book size={18} />
                <h3 className="font-semibold text-sm tracking-wider">ACADEMIC BACKGROUND</h3>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider">YOUR FULL NAME</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name" 
                  className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 tracking-wider">STUDENT TYPE</label>
                  <select 
                    value={studentType} 
                    onChange={(e) => setStudentType(e.target.value)}
                    className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                  >
                    <option value="school">School Student</option>
                    <option value="college">College Student</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 tracking-wider">CURRENT YEAR / CLASS</label>
                  <input 
                    type="text" 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. Year 3, Class 12" 
                    className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider">INSTITUTION NAME</label>
                <input 
                  type="text" 
                  value={institution} 
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Atlantis Institute of Technology" 
                  className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider">COURSE / BRANCH OF STUDY</label>
                <input 
                  type="text" 
                  value={courseClass} 
                  onChange={(e) => setCourseClass(e.target.value)}
                  placeholder="e.g. Computer Science Engineering" 
                  className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-brand-deep font-extrabold rounded-xl"
                >
                  Configure Preferences <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preferences & Schedule */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2 text-brand-teal">
                <Compass size={18} />
                <h3 className="font-semibold text-sm tracking-wider">LEARNING PREFERENCES</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 tracking-wider">STUDY HOURS / WEEK</label>
                  <input 
                    type="number" 
                    value={weeklyHours} 
                    onChange={(e) => setWeeklyHours(Number(e.target.value))}
                    min={1} 
                    className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 tracking-wider">PREFERRED DAILY STUDY TIME</label>
                  <select 
                    value={preferredStudyTime} 
                    onChange={(e) => setPreferredStudyTime(e.target.value)}
                    className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                  >
                    <option value="morning">Morning (6 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                    <option value="evening">Evening (5 PM - 9 PM)</option>
                    <option value="night">Night (9 PM - 2 AM)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider">CURRENT SKILL PROFICIENCY</label>
                <select 
                  value={currentSkillLevel} 
                  onChange={(e) => setCurrentSkillLevel(e.target.value)}
                  className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                >
                  <option value="Beginner">Beginner - Basic syntax / structures</option>
                  <option value="Intermediate">Intermediate - Conceptual problem solving</option>
                  <option value="Advanced">Advanced - System integration & design</option>
                </select>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-brand-deep font-extrabold rounded-xl"
                >
                  Set Career Target <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Career & Academic Goals */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-2 text-brand-teal">
                <Target size={18} />
                <h3 className="font-semibold text-sm tracking-wider">CAREER INTEGRATION</h3>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider">TARGET CAREER PATH / ROLE</label>
                <input 
                  type="text" 
                  value={careerInterests} 
                  onChange={(e) => setCareerInterests(e.target.value)}
                  placeholder="e.g. Machine Learning Engineer, Software Engineer" 
                  className="bg-black/30 border border-brand-glass-border rounded-xl text-sm"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider">PRIMARY ACADEMIC GOAL</label>
                <textarea 
                  value={goals} 
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Master algorithms, secure an internship at Google, keep GPA above 9.0" 
                  rows={4}
                  className="bg-black/30 border border-brand-glass-border rounded-xl text-sm resize-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-brand-teal to-brand-cyan text-brand-deep font-extrabold rounded-xl shadow-lg shadow-brand-teal/20"
                >
                  BOOT OPERATING SYSTEM
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;

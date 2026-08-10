import React, { useEffect, useState, useRef } from 'react';
import { quizAPI, syllabusAPI } from '../services/api';
import { Brain, Award, Clock, ArrowRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const QuizzesPage: React.FC = () => {
  const { refreshUser } = useAuth();
  
  // Setup states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | string>('');
  const [quizTitle, setQuizTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [timeLimit, setTimeLimit] = useState(10);
  
  const [attempts, setAttempts] = useState<any[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Timers
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<any>(null);

  const loadInitialData = async () => {
    try {
      const subRes = await syllabusAPI.getSubjects();
      setSubjects(subRes.data);
      if (subRes.data.length > 0) {
        setSelectedSubId(subRes.data[0].id);
        setQuizTitle(`Quiz on ${subRes.data[0].name}`);
      }
      
      const attemptsRes = await quizAPI.getAttempts();
      setAttempts(attemptsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Timer runner
  useEffect(() => {
    if (activeQuiz && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (activeQuiz && timeLeft === 0) {
      handleSubmitQuiz();
    }
    return () => clearTimeout(timerRef.current);
  }, [activeQuiz, timeLeft]);

  const handleSubjectChange = (id: string) => {
    setSelectedSubId(id);
    const sub = subjects.find(s => s.id === Number(id));
    if (sub) {
      setQuizTitle(`Quiz on ${sub.name}`);
    }
  };

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setResult(null);
    try {
      const res = await quizAPI.generateQuiz({
        subject_id: selectedSubId ? Number(selectedSubId) : null,
        title: quizTitle,
        difficulty,
        num_questions: numQuestions,
        time_limit_minutes: timeLimit
      });
      setActiveQuiz(res.data);
      setCurrentQIdx(0);
      setAnswers({});
      setTimeLeft(timeLimit * 60);
    } catch (err) {
      console.error(err);
      alert('Failed to generate quiz questions.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (option: string) => {
    const q = activeQuiz.questions[currentQIdx];
    setAnswers(prev => ({ ...prev, [q.id]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    clearTimeout(timerRef.current);
    setSubmitting(true);
    
    // Format answers payload
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      question_id: Number(qId),
      selected_answer: ans
    }));

    // Check if they skipped any questions, send empty answers for those
    activeQuiz.questions.forEach((q: any) => {
      if (!answers[q.id]) {
        formattedAnswers.push({
          question_id: q.id,
          selected_answer: ''
        });
      }
    });

    const timeTaken = (timeLimit * 60) - timeLeft;

    try {
      const res = await quizAPI.submitQuiz({
        quiz_id: activeQuiz.quiz_id,
        answers: formattedAnswers,
        time_taken_seconds: timeTaken
      });
      setResult(res.data);
      setActiveQuiz(null);
      
      // Reload attempts
      const attemptsRes = await quizAPI.getAttempts();
      setAttempts(attemptsRes.data);
      
      refreshUser();
    } catch (err) {
      console.error(err);
      alert('Failed to submit quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Knowledge Assessments</h1>
        <p className="text-sm text-slate-400 mt-1">Generate adaptive quizzes and review your performance history.</p>
      </div>

      {generating && (
        <div className="flex items-center justify-center py-20 flex-col bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
          <div className="w-12 h-12 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-brand-teal font-bold animate-pulse tracking-wider text-sm">Generating assessment items from syllabus...</p>
        </div>
      )}

      {/* Quiz Taker Interface */}
      {activeQuiz && !generating && (
        <div className="max-w-3xl mx-auto bg-slate-900 p-8 rounded-xl border border-brand-teal/30 space-y-8 shadow-[0_0_15px_rgba(45,212,191,0.05)] relative">
          {/* Timer top right */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white">{activeQuiz.title}</h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold uppercase tracking-wider">Question {currentQIdx + 1} of {activeQuiz.questions.length}</p>
            </div>
            <div className="flex items-center gap-2 bg-brand-teal/10 px-4 py-2 rounded-lg border border-brand-teal/20 text-brand-teal font-bold text-sm">
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-6">
            <p className="text-lg font-bold text-slate-200 leading-relaxed">
              {activeQuiz.questions[currentQIdx].question_text}
            </p>

            {/* MCQ Options */}
            {activeQuiz.questions[currentQIdx].options && activeQuiz.questions[currentQIdx].options.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {activeQuiz.questions[currentQIdx].options.map((opt: string, idx: number) => {
                  const qId = activeQuiz.questions[currentQIdx].id;
                  const isSelected = answers[qId] === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(opt)}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-semibold transition-all ${
                        isSelected 
                          ? 'bg-brand-teal/15 border-brand-teal text-brand-teal shadow-md shadow-brand-teal/5' 
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              // True False Options
              <div className="flex gap-4">
                {['True', 'False'].map((opt) => {
                  const qId = activeQuiz.questions[currentQIdx].id;
                  const isSelected = answers[qId] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswerSelect(opt)}
                      className={`flex-1 p-4 rounded-xl border text-sm font-bold transition-all ${
                        isSelected 
                          ? 'bg-brand-teal/15 border-brand-teal text-brand-teal' 
                          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nav Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-800">
            <button
              disabled={currentQIdx === 0}
              onClick={() => setCurrentQIdx(currentQIdx - 1)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              Previous
            </button>

            {currentQIdx < activeQuiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIdx(currentQIdx + 1)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-brand-teal border border-slate-700 hover:border-slate-600 rounded-lg text-sm font-bold transition-colors"
              >
                Next Question
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={handleSubmitQuiz}
                className="px-6 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-xl font-extrabold text-sm transition-colors"
              >
                {submitting ? 'Calculating score...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Score card Details */}
      {result && !activeQuiz && !generating && (
        <div className="max-w-3xl mx-auto bg-slate-900 p-8 rounded-xl border border-brand-teal/30 space-y-8 shadow-sm">
          <div className="text-center space-y-3 border-b border-slate-800 pb-8">
            <Award className="text-brand-teal mx-auto animate-bounce" size={56} />
            <h3 className="text-2xl font-bold text-white tracking-tight">Assessment Complete!</h3>
            <div className="mt-6 flex items-center justify-center gap-8">
              <div>
                <p className="text-3xl font-black text-white">{result.score} <span className="text-lg text-slate-500 font-medium">/ {result.total_questions}</span></p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-2">Score</p>
              </div>
              <div className="w-px h-12 bg-slate-800"></div>
              <div>
                <p className="text-3xl font-black text-brand-teal">{result.accuracy_percentage.toFixed(0)}%</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-2">Accuracy</p>
              </div>
              <div className="w-px h-12 bg-slate-800"></div>
              <div>
                <p className="text-3xl font-black text-orange-400">+{result.xp_gained}</p>
                <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mt-2">XP Gained</p>
              </div>
            </div>
          </div>

          {/* Weak concepts */}
          {result.weak_concepts && result.weak_concepts.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-xl space-y-3">
              <h4 className="font-bold text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle size={16} />
                Identified Cognitive Weaknesses
              </h4>
              <p className="text-sm text-slate-300">You struggled with the following items:</p>
              <ul className="list-disc pl-6 text-sm text-slate-400 space-y-1.5">
                {result.weak_concepts.map((concept: string, idx: number) => (
                  <li key={idx}>{concept}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Revision recommendations */}
          <div className="bg-brand-teal/5 border border-brand-teal/20 p-5 rounded-xl space-y-3">
            <h4 className="font-bold text-sm text-brand-teal uppercase tracking-wider">Tide-Chart Adaptations</h4>
            <p className="text-sm text-slate-300">Atlantis intelligence recommends this adaptive revision strategy:</p>
            <ul className="list-disc pl-6 text-sm text-slate-400 space-y-1.5">
              {result.recommended_revision.map((rec: string, idx: number) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>

          {/* Question breakdown list */}
          <div className="space-y-5">
            <h4 className="font-bold text-base text-white border-b border-slate-800 pb-3">Questions Review</h4>
            <div className="space-y-4">
              {result.results.map((q: any, idx: number) => (
                <div key={q.question_id} className="p-5 bg-slate-800/30 rounded-xl border border-slate-700/50 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm font-bold text-slate-200">Q{idx + 1}: {q.question_text}</p>
                    {q.is_correct ? (
                      <span className="bg-green-500/10 text-green-400 px-2.5 py-1 rounded-md text-xs font-bold border border-green-500/20 shrink-0">CORRECT</span>
                    ) : (
                      <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded-md text-xs font-bold border border-red-500/20 shrink-0">INCORRECT</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-slate-900/50 p-3 rounded-lg">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Your Choice</p>
                      <p className={`font-semibold mt-1 ${q.is_correct ? 'text-green-400' : 'text-red-400'}`}>{q.student_answer || '[Skipped]'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">Correct Value</p>
                      <p className="font-semibold text-green-400 mt-1">{q.correct_answer}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 bg-slate-800/80 p-3.5 rounded-lg border border-slate-700 leading-relaxed">
                    <strong className="text-brand-teal mr-1">Explanation:</strong> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => setResult(null)}
              className="px-6 py-3 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 font-extrabold text-sm rounded-xl transition-colors"
            >
              Generate New Assessment
            </button>
          </div>
        </div>
      )}

      {/* Quiz generator setup & attempts list */}
      {!activeQuiz && !result && !generating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Setup generator form */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-200 mb-5 border-b border-slate-800 pb-3 uppercase tracking-wider">Generate Assessment</h3>
            <form onSubmit={handleStartQuiz} className="space-y-5">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Subject Target</label>
                <select value={selectedSubId} onChange={(e) => handleSubjectChange(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all">
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Quiz Title</label>
                <input type="text" required placeholder="e.g. Relational Normalization Form Check" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all">
                    <option value="Easy">Easy (Conceptual)</option>
                    <option value="Medium">Medium (Application)</option>
                    <option value="Hard">Hard (Analysis)</option>
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Questions Count</label>
                  <input type="number" min={1} max={15} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" />
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Time Limit (Minutes)</label>
                <input type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  Compile and Launch Quiz
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </div>

          {/* Historical attempts list */}
          <div className="lg:col-span-2 bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-200 mb-5 border-b border-slate-800 pb-3 uppercase tracking-wider">Assessment History</h3>
            
            {attempts.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-12 bg-slate-800/30 rounded-lg border border-slate-700/50 border-dashed">
                No quiz attempts documented yet. Generate one to check your learning levels.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2">
                {attempts.map((att) => (
                  <div key={att.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <h4 className="font-bold text-sm text-white leading-none">{att.quiz_title}</h4>
                      <p className="text-xs text-slate-400 font-medium">Attempted: {new Date(att.attempted_at).toLocaleDateString()} {new Date(att.attempted_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-brand-teal">{att.score} <span className="text-xs text-slate-500">/ {att.total_questions}</span></div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{((att.score / att.total_questions) * 100).toFixed(0)}% Acc</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;

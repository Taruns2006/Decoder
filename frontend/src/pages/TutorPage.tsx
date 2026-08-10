import React, { useEffect, useState, useRef } from 'react';
import { tutorAPI, syllabusAPI } from '../services/api';
import { MessageSquare, Send, Sparkles, User, Brain, AlertCircle, PlayCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const TutorPage: React.FC = () => {
  const { refreshUser } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  
  // Chat input states
  const [inputMsg, setInputMsg] = useState('');
  const [tutorMode, setTutorMode] = useState('analogy'); // analogy, beginner, simple, detailed, exam, technical
  const [sending, setSending] = useState(false);

  // New session modal states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<number | string>('');
  const [newTitle, setNewTitle] = useState('');
  const [showNewSession, setShowNewSession] = useState(false);

  // Track selected options for active interactive questions
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [questionSubmitted, setQuestionSubmitted] = useState<Record<number, boolean>>({});
  const [correctFlags, setCorrectFlags] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await tutorAPI.getSessions();
      setSessions(res.data);
      if (res.data.length > 0) {
        setActiveSession(res.data[0]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadMessages = async (sessionId: number) => {
    setLoading(true);
    try {
      const res = await tutorAPI.getMessages(sessionId);
      setMessages(res.data);
      // reset interactive answers
      setSelectedOptionIdx(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await syllabusAPI.getSubjects();
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSessions();
    loadSubjects();
  }, []);

  useEffect(() => {
    if (activeSession) {
      loadMessages(activeSession.id);
    }
  }, [activeSession]);

  useEffect(() => {
    // Scroll chat to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMsg;
    if (!text.trim() || !activeSession) return;
    
    setSending(true);
    if (!textToSend) setInputMsg('');
    
    // Optimistic local add
    const optimisticMsg: any = {
      id: Date.now(),
      session_id: activeSession.id,
      sender: 'student',
      message_text: text,
      mode: tutorMode,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const res = await tutorAPI.sendMessage(activeSession.id, {
        message_text: text,
        mode: tutorMode
      });
      // Load real messages
      loadMessages(activeSession.id);
      refreshUser();
    } catch (err) {
      console.error(err);
      alert('Tutor connection error.');
    } finally {
      setSending(false);
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    try {
      const res = await tutorAPI.createSession({
        subject_id: selectedSubId ? Number(selectedSubId) : null,
        title: newTitle
      });
      setNewTitle('');
      setSelectedSubId('');
      setShowNewSession(false);
      
      // Reload lists and set active
      const sessRes = await tutorAPI.getSessions();
      setSessions(sessRes.data);
      const newSess = sessRes.data.find((s: any) => s.title === res.data.title);
      if (newSess) setActiveSession(newSess);
    } catch (err) {
      console.error(err);
      alert('Failed to start session.');
    }
  };

  const handleSubmitQuestionAnswer = (msgId: number, selectedIdx: number, correctIdx: number, questionText: string, options: string[]) => {
    const isCorrect = selectedIdx === correctIdx;
    
    setQuestionSubmitted(prev => ({ ...prev, [msgId]: true }));
    setCorrectFlags(prev => ({ ...prev, [msgId]: isCorrect }));
    
    // Send feedback text back to tutor chatbot to trigger dialogue progression
    const studentAnswerText = `I answered your question: "${questionText}". I chose: "${options[selectedIdx]}". This is ${isCorrect ? 'correct' : 'incorrect'}.`;
    handleSendMessage(studentAnswerText);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Tutor</h1>
          <p className="text-sm text-slate-400 mt-1">Adaptive learning through dialogue and continuous assessment.</p>
        </div>
        <button 
          onClick={() => setShowNewSession(true)}
          className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-xs flex items-center gap-2 self-start transition-colors"
        >
          <PlayCircle size={16} />
          New Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[75vh]">
        {/* Tutor Sessions Sidebar */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col h-full overflow-hidden shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 px-1 border-b border-slate-800 pb-2">Recent Sessions</h3>
          {sessionsLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {sessions.map((s) => {
                const active = activeSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      active 
                        ? 'bg-brand-teal/10 border-brand-teal text-brand-teal' 
                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm truncate">{s.title}</div>
                    <div className="text-[10px] text-slate-500 mt-1.5 font-medium">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </div>
                  </button>
                );
              })}
              {sessions.length === 0 && (
                <div className="text-center text-xs text-slate-500 py-10">No sessions. Start one above!</div>
              )}
            </div>
          )}
        </div>

        {/* Chat Feed */}
        <div className="lg:col-span-3 bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden relative shadow-sm">
          {activeSession ? (
            <>
              {/* Active Session Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-white tracking-wide">{activeSession.title}</h4>
                  <p className="text-[10px] text-brand-teal font-bold uppercase tracking-widest mt-1">AI Active Tutoring Mode</p>
                </div>

                {/* Tutor Explanation Modes Selector */}
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline tracking-wider">Explanation Style:</label>
                  <select 
                    value={tutorMode} 
                    onChange={(e) => setTutorMode(e.target.value)}
                    className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal text-xs text-brand-teal font-semibold px-3 py-1.5 rounded-lg outline-none transition-all cursor-pointer"
                  >
                    <option value="analogy">Analogy Style</option>
                    <option value="beginner">Beginner Level</option>
                    <option value="simple">Simple Style</option>
                    <option value="detailed">Detailed/Exhaustive</option>
                    <option value="exam">Exam-Oriented</option>
                    <option value="technical">Technical/Code</option>
                  </select>
                </div>
              </div>

              {/* Message History area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-6">
                {loading && messages.length === 0 ? (
                  <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isTutor = msg.sender === 'tutor';
                    
                    // Parse interactive state
                    const qState = msg.interactive_state;
                    const showQuestion = qState && qState.question && !msg.message_text.includes("I answered your question");
                    const hasSubmitted = questionSubmitted[msg.id];
                    const isAnsCorrect = correctFlags[msg.id];

                    return (
                      <div key={msg.id} className={`flex gap-4 max-w-[85%] ${isTutor ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1 ${
                          isTutor ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal' : 'bg-brand-purple/10 border-brand-purple/30 text-brand-purple'
                        }`}>
                          {isTutor ? <Brain size={16} /> : <User size={16} />}
                        </div>

                        {/* Speech Bubble */}
                        <div className="space-y-3 w-full">
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap border ${
                            isTutor 
                              ? 'bg-slate-800/40 border-slate-700/50 text-slate-200 rounded-tl-sm' 
                              : 'bg-brand-teal/10 border-brand-teal/20 text-slate-100 rounded-tr-sm'
                          }`}>
                            {msg.message_text}
                          </div>

                          {/* Interactive MCQ Quiz widget from Tutor */}
                          {showQuestion && (
                            <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-xl space-y-4 shadow-sm">
                              <h5 className="font-bold text-xs text-brand-cyan flex items-center gap-2 tracking-wider">
                                <Sparkles size={14} className="text-brand-teal animate-spin" />
                                CHECKPOINT VERIFICATION
                              </h5>
                              <p className="text-sm text-white font-medium">{qState.question}</p>
                              
                              <div className="space-y-2">
                                {qState.options.map((opt: string, optIdx: number) => {
                                  const isSelected = selectedOptionIdx === optIdx;
                                  return (
                                    <button
                                      key={optIdx}
                                      disabled={hasSubmitted}
                                      onClick={() => setSelectedOptionIdx(optIdx)}
                                      className={`w-full text-left p-3.5 rounded-lg text-sm font-medium border transition-all ${
                                        hasSubmitted
                                          ? optIdx === qState.correct_option_idx
                                            ? 'bg-green-500/10 border-green-500 text-green-400'
                                            : isSelected
                                              ? 'bg-red-500/10 border-red-500 text-red-400'
                                              : 'bg-slate-800/50 border-slate-700 text-slate-500'
                                          : isSelected
                                            ? 'bg-brand-teal/10 border-brand-teal text-brand-teal'
                                            : 'bg-slate-900 border-slate-700 hover:border-slate-600 text-slate-300'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {!hasSubmitted ? (
                                <button
                                  disabled={selectedOptionIdx === null}
                                  onClick={() => handleSubmitQuestionAnswer(msg.id, selectedOptionIdx!, qState.correct_option_idx, qState.question, qState.options)}
                                  className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 font-extrabold text-xs rounded-lg disabled:opacity-50 disabled:pointer-events-none transition-colors"
                                >
                                  Submit Verification
                                </button>
                              ) : (
                                <div className={`text-sm font-bold flex items-center gap-2 p-3 rounded-lg ${isAnsCorrect ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                  {isAnsCorrect ? '✓ Correct! +10 XP gained.' : '✗ Incorrect. Review explanation above.'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                {sending && (
                  <div className="flex gap-4 max-w-[85%] mr-auto">
                    <div className="w-8 h-8 rounded-full bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal animate-pulse mt-1">
                      <Brain size={16} />
                    </div>
                    <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                      <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      <span className="text-[10px] text-brand-teal font-bold uppercase tracking-wider ml-2">TUTOR EXPLAINING...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input controls */}
              <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-3">
                <input 
                  type="text" 
                  value={inputMsg}
                  disabled={sending}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  placeholder="Ask a question or request an explanation..."
                  className="flex-1 bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-xl text-sm h-12 pl-4 text-white outline-none transition-all placeholder:text-slate-500"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={sending || !inputMsg.trim()}
                  className="w-12 h-12 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <MessageSquare size={48} className="text-brand-teal mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-white">Unlock AI Tutoring</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Select an existing tutor session from the sidebar or click "New Session" to start a personalized learning dialogue.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Start New Session Modal */}
      {showNewSession && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-slate-900 w-full max-w-sm p-6 rounded-xl border border-slate-700 space-y-5 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Create Tutor Session</h3>
            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Select Curriculum Subject</label>
                <select 
                  value={selectedSubId} 
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all"
                >
                  <option value="">General Topic (No Subject Link)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Tutor Session Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Recursion fundamentals" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                  className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" 
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowNewSession(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg text-xs font-extrabold transition-colors">Start Session</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorPage;

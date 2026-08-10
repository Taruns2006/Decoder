import React, { useEffect, useState, useRef } from 'react';
import { documentAPI, syllabusAPI } from '../services/api';
import { 
  FileText, FileUp, MessageSquare, Brain, Send, HelpCircle, 
  Sparkles, CheckCircle2, ChevronRight, Bookmark, ArrowRight, Star 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NotesPage: React.FC = () => {
  const { refreshUser } = useAuth();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Active Tab for document workspace: summary, qna, flashcards, studyguide
  const [workspaceTab, setWorkspaceTab] = useState<'summary' | 'qna' | 'flashcards' | 'guide'>('summary');
  
  // Q&A states
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [asking, setAsking] = useState(false);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [activeFCIdx, setActiveFCIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [completedFC, setCompletedFC] = useState(false);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentAPI.getDocuments();
      setDocuments(res.data);
      if (res.data.length > 0) {
        setActiveDoc(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFlashcards = async (docId: number) => {
    try {
      const res = await documentAPI.getDocumentFlashcards(docId);
      setFlashcards(res.data);
      setActiveFCIdx(0);
      setShowAnswer(false);
      setCompletedFC(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (activeDoc) {
      loadFlashcards(activeDoc.id);
      setChatHistory([]);
      setWorkspaceTab('summary');
    }
  }, [activeDoc]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadMsg('Uploading document to Supabase Storage...');
    
    const formData = new FormData();
    formData.append('file', files[0]);
    
    try {
      const res = await documentAPI.uploadDocument(formData);
      setUploadMsg('AI parsing key concepts and generating flashcards...');
      
      setTimeout(() => {
        setUploadMsg('');
        setUploading(false);
        // Reload docs list
        loadDocuments();
        refreshUser();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('File upload failed.');
      setUploading(false);
      setUploadMsg('');
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !activeDoc) return;
    
    setAsking(true);
    const userQ = question;
    setQuestion('');
    
    setChatHistory(prev => [...prev, { sender: 'student', text: userQ }]);
    
    try {
      const res = await documentAPI.askDocument(activeDoc.id, userQ);
      setChatHistory(prev => [...prev, { 
        sender: 'tutor', 
        text: res.data.answer,
        grounded: res.data.grounded,
        source: res.data.source_document
      }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: 'tutor', text: 'Error contacting Notebook Intelligence.' }]);
    } finally {
      setAsking(false);
    }
  };

  const handleFlashcardRating = (rating: string) => {
    // Spaced repetition scheduler rating
    // Award 5 XP per review
    refreshUser();
    
    if (activeFCIdx < flashcards.length - 1) {
      setActiveFCIdx(activeFCIdx + 1);
      setShowAnswer(false);
    } else {
      setCompletedFC(true);
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex items-center justify-center h-[50vh] flex-col">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm">Opening knowledge workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-brand-teal font-extrabold tracking-widest font-mono">Notebook Intelligence Workspace</span>
          <h2 className="text-2xl font-bold tracking-wide text-white">My Study Documents</h2>
        </div>
        
        <label className="px-4 py-2.5 bg-brand-teal text-brand-deep rounded-xl font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-brand-teal/5 self-start">
          <FileUp size={16} />
          {uploading ? 'Processing...' : 'Upload Notes / PDFs'}
          <input type="file" onChange={handleFileUpload} accept=".pdf,.txt" className="hidden" disabled={uploading} />
        </label>
      </div>

      {uploadMsg && (
        <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-xl p-4 text-sm text-brand-teal animate-pulse">
          ⏳ {uploadMsg}
        </div>
      )}

      {documents.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-brand-glass-border max-w-xl mx-auto">
          <FileText className="text-brand-teal mx-auto mb-4 animate-bounce" size={48} />
          <h3 className="text-lg font-bold text-white">Your Workspace is Empty</h3>
          <p className="text-sm text-slate-400 mt-2 mb-6 leading-relaxed">
            Upload lecture PDFs, textbook notes, or slides. The AI will instantly summarize text, build active flashcard decks, and support grounded Q&A.
          </p>
          <label className="px-6 py-3 bg-brand-teal text-brand-deep rounded-xl font-bold text-sm cursor-pointer inline-block">
            Upload Your First PDF
            <input type="file" onChange={handleFileUpload} accept=".pdf,.txt" className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[72vh]">
          {/* Docs list sidebar */}
          <div className="glass-panel rounded-2xl border border-brand-glass-border p-4 flex flex-col h-full overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-3 pl-1">Knowledge Sources</h3>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {documents.map((d) => {
                const active = activeDoc?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveDoc(d)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      active 
                        ? 'bg-brand-teal/15 border-brand-teal text-brand-teal' 
                        : 'bg-brand-dark/20 border-brand-glass-border hover:border-brand-teal/20 text-slate-300'
                    }`}
                  >
                    <FileText size={16} className="shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs truncate leading-tight">{d.name}</div>
                      <div className="text-[9px] text-slate-400 mt-1 uppercase">
                        {(d.file_size / 1024).toFixed(0)} KB | {d.status}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Document Work area with tabs */}
          <div className="lg:col-span-3 glass-panel rounded-2xl border border-brand-glass-border flex flex-col h-full overflow-hidden bg-black/10">
            {activeDoc ? (
              <>
                {/* Tabs bar header */}
                <div className="border-b border-brand-glass-border bg-brand-dark/40 p-1 flex justify-between items-center">
                  <div className="flex gap-1">
                    {[
                      { id: 'summary', name: 'AI Summary' },
                      { id: 'qna', name: 'Document Q&A' },
                      { id: 'flashcards', name: 'Active Flashcards' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setWorkspaceTab(tab.id as any)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                          workspaceTab === tab.id 
                            ? 'bg-brand-teal/15 text-brand-teal font-extrabold' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] text-brand-cyan font-bold uppercase tracking-wider pr-4">
                    Source: {activeDoc.name}
                  </span>
                </div>

                {/* Workspace WorkspaceTab panels */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                  {/* TAB 1: AI Summary & Concepts */}
                  {workspaceTab === 'summary' && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-bold text-xs text-brand-teal tracking-widest uppercase font-mono">Executive Summary</h4>
                        <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-brand-glass-border">
                          {activeDoc.summary || 'Summary is being processed...'}
                        </p>
                      </div>

                      {activeDoc.key_concepts && activeDoc.key_concepts.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-bold text-xs text-brand-teal tracking-widest uppercase font-mono">Extracted Key Concepts</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeDoc.key_concepts.map((concept: any, idx: number) => (
                              <div key={idx} className="bg-brand-dark/30 border border-brand-glass-border p-4 rounded-xl space-y-1">
                                <h5 className="font-bold text-xs text-brand-cyan">{concept.concept}</h5>
                                <p className="text-[11px] text-slate-400 leading-relaxed">{concept.definition}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: Grounded Q&A */}
                  {workspaceTab === 'qna' && (
                    <div className="flex flex-col h-full relative">
                      <div className="flex-1 space-y-4 overflow-y-auto pr-1 pb-16">
                        {chatHistory.length === 0 ? (
                          <div className="text-center text-xs text-slate-500 py-10 flex flex-col items-center justify-center">
                            <MessageSquare className="text-brand-teal/40 mb-2" size={36} />
                            Ask questions grounded in the content of '{activeDoc.name}'.
                          </div>
                        ) : (
                          chatHistory.map((msg, idx) => {
                            const isTutor = msg.sender === 'tutor';
                            return (
                              <div key={idx} className={`flex gap-3 max-w-2xl ${isTutor ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                                <div className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                                  isTutor 
                                    ? 'bg-brand-dark/40 border-brand-glass-border text-slate-200 rounded-tl-none' 
                                    : 'bg-brand-teal/10 border-brand-teal/20 text-slate-200 rounded-tr-none'
                                }`}>
                                  <p className="whitespace-pre-wrap">{msg.text}</p>
                                  
                                  {/* Grounding Source Badge */}
                                  {isTutor && msg.grounded && (
                                    <div className="mt-2 pt-2 border-t border-brand-glass-border/30 flex items-center justify-between text-[9px] text-brand-teal font-extrabold uppercase">
                                      <span>✓ Grounded Answer</span>
                                      <span>Source: {msg.source}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        {asking && (
                          <div className="flex gap-2 items-center text-xs text-brand-teal animate-pulse">
                            <span className="w-1.5 h-1.5 bg-brand-teal rounded-full animate-ping"></span>
                            <span>Consulting document chunks...</span>
                          </div>
                        )}
                      </div>

                      {/* Question form input */}
                      <form onSubmit={handleAskQuestion} className="absolute bottom-0 left-0 right-0 p-3 bg-brand-dark/80 border border-brand-glass-border rounded-xl flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={question}
                          disabled={asking}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder={`Ask about: ${activeDoc.name}`}
                          className="flex-1 bg-black/40 border border-brand-glass-border rounded-lg text-xs"
                        />
                        <button type="submit" disabled={asking || !question.trim()} className="w-9 h-9 bg-brand-teal text-brand-deep rounded-lg flex items-center justify-center shrink-0">
                          <Send size={14} />
                        </button>
                      </form>
                    </div>
                  )}

                  {/* TAB 3: Flashcards review deck */}
                  {workspaceTab === 'flashcards' && (
                    <div className="max-w-md mx-auto py-6">
                      {flashcards.length === 0 ? (
                        <div className="text-center text-slate-500 text-sm py-10">
                          No flashcards compiled from this source.
                        </div>
                      ) : completedFC ? (
                        <div className="glass-panel p-6 text-center rounded-2xl border border-brand-glass-border space-y-4">
                          <CheckCircle2 className="text-brand-teal mx-auto animate-bounce" size={40} />
                          <h4 className="font-bold text-white text-md">Deck Completed!</h4>
                          <p className="text-xs text-slate-400 mt-1">Review complete. Spaced repetition coordinates have been locked.</p>
                          <button onClick={() => { setActiveFCIdx(0); setCompletedFC(false); setShowAnswer(false); }} className="px-4 py-2 bg-brand-teal text-brand-deep text-xs font-bold rounded-lg">
                            Review Deck Again
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Flashcard container widget */}
                          <div 
                            onClick={() => setShowAnswer(!showAnswer)}
                            className="bg-brand-dark/40 border border-brand-teal/30 p-8 rounded-2xl text-center min-h-[180px] flex items-center justify-center cursor-pointer select-none hover:shadow-lg hover:shadow-brand-teal/5 transition-all"
                          >
                            <div className="space-y-4">
                              <span className="text-[9px] text-brand-teal font-extrabold uppercase tracking-widest font-mono">
                                {showAnswer ? 'RESPONSE ANSWER' : 'QUESTION CARD'} ({activeFCIdx + 1} / {flashcards.length})
                              </span>
                              <p className="text-sm font-bold text-white leading-relaxed">
                                {showAnswer ? flashcards[activeFCIdx].back : flashcards[activeFCIdx].front}
                              </p>
                              <span className="text-[10px] text-slate-500 block">Click to Flip card</span>
                            </div>
                          </div>

                          {/* Ratings for Spaced Repetition */}
                          {showAnswer && (
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { id: 'again', label: 'Again', color: 'bg-red-500/10 text-red-400 border border-red-500/20' },
                                { id: 'hard', label: 'Hard', color: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' },
                                { id: 'good', label: 'Good', color: 'bg-brand-teal/10 text-brand-teal border border-brand-teal/20' },
                                { id: 'easy', label: 'Easy', color: 'bg-green-500/10 text-green-400 border border-green-500/20' }
                              ].map((rating) => (
                                <button
                                  key={rating.id}
                                  onClick={() => handleFlashcardRating(rating.id)}
                                  className={`py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all ${rating.color}`}
                                >
                                  {rating.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <FileText size={48} className="text-brand-teal mb-4" />
                <h3 className="text-lg font-bold text-white">Select a Knowledge Source</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-sm">
                  Choose an uploaded notes or PDF file from the left sidebar to activate summaries, grounded chats, and active study cards.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;

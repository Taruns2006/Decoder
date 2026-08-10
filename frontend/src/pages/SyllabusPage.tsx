import React, { useEffect, useState } from 'react';
import { syllabusAPI } from '../services/api';
import { 
  Plus, Check, HelpCircle, BookOpen, AlertCircle, FileUp, 
  Trash, ChevronDown, ChevronRight, CheckCircle2, Bookmark, CheckSquare 
} from 'lucide-react';

const SyllabusPage: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [activeSubject, setActiveSubject] = useState<any>(null);
  const [subjectDetails, setSubjectDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal / Input states
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [newSubPri, setNewSubPri] = useState(3);
  const [showAddSub, setShowAddSub] = useState(false);
  
  const [newUnitName, setNewUnitName] = useState('');
  const [showAddUnit, setShowAddUnit] = useState(false);

  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicImp, setNewTopicImp] = useState('Medium');
  const [activeUnitId, setActiveUnitId] = useState<number | null>(null);
  const [showAddTopic, setShowAddTopic] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const loadSubjects = async () => {
    setLoading(true);
    try {
      const res = await syllabusAPI.getSubjects();
      setSubjects(res.data);
      if (res.data.length > 0) {
        setActiveSubject(res.data[0]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch subjects list.');
      setLoading(false);
    }
  };

  const loadSubjectDetails = async (subjectId: number) => {
    try {
      const res = await syllabusAPI.getFullSyllabus(subjectId);
      setSubjectDetails(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load syllabus components.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (activeSubject) {
      loadSubjectDetails(activeSubject.id);
    }
  }, [activeSubject]);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      const res = await syllabusAPI.createSubject({
        name: newSubName,
        description: newSubDesc,
        priority: Number(newSubPri)
      });
      setNewSubName('');
      setNewSubDesc('');
      setNewSubPri(3);
      setShowAddSub(false);
      
      // Reload and activate new subject
      const subRes = await syllabusAPI.getSubjects();
      setSubjects(subRes.data);
      const newSub = subRes.data.find((s: any) => s.name === res.data.name);
      if (newSub) setActiveSubject(newSub);
    } catch (err) {
      console.error(err);
      alert('Failed to add subject.');
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !activeSubject) return;
    try {
      await syllabusAPI.addUnit(activeSubject.id, {
        name: newUnitName,
        sequence_order: (subjectDetails?.units?.length || 0) + 1
      });
      setNewUnitName('');
      setShowAddUnit(false);
      loadSubjectDetails(activeSubject.id);
    } catch (err) {
      console.error(err);
      alert('Failed to add unit.');
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || activeUnitId === null) return;
    try {
      await syllabusAPI.addTopic(activeUnitId, {
        name: newTopicName,
        importance_level: newTopicImp,
        sequence_order: 1
      });
      setNewTopicName('');
      setNewTopicImp('Medium');
      setShowAddTopic(false);
      if (activeSubject) loadSubjectDetails(activeSubject.id);
    } catch (err) {
      console.error(err);
      alert('Failed to add topic.');
    }
  };

  const handleStatusChange = async (topicId: number, currentStatus: string) => {
    // Cycles status: not_started -> weak -> difficult -> completed -> not_started
    const cycleMap: Record<string, string> = {
      'not_started': 'weak',
      'weak': 'difficult',
      'difficult': 'completed',
      'completed': 'not_started'
    };
    const nextStatus = cycleMap[currentStatus] || 'not_started';
    try {
      await syllabusAPI.updateStudentTopic(topicId, {
        status: nextStatus,
        priority: 3
      });
      if (activeSubject) loadSubjectDetails(activeSubject.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadMsg('Uploading syllabus document to analyzer...');
    const formData = new FormData();
    formData.append('file', files[0]);
    
    try {
      const res = await syllabusAPI.uploadSyllabus(formData);
      setUploadMsg('Parsing concepts and compiling syllabus units...');
      setTimeout(() => {
        setUploadMsg('');
        setUploading(false);
        // Reload all
        loadSubjects();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Failed to process uploaded syllabus.');
      setUploading(false);
      setUploadMsg('');
    }
  };

  if (loading && subjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-[50vh] flex-col">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm">Opening syllabus vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Curriculum Structure</h1>
          <p className="text-sm text-slate-400 mt-1">Track subjects, organize units, and analyze topics.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Upload Syllabus File */}
          <label className="px-5 py-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 rounded-lg font-bold text-xs text-white flex items-center gap-2 cursor-pointer transition-colors">
            <FileUp size={16} />
            {uploading ? 'Processing...' : 'Upload Syllabus PDF'}
            <input type="file" onChange={handleFileUpload} accept=".pdf,.txt" className="hidden" disabled={uploading} />
          </label>

          <button 
            onClick={() => setShowAddSub(true)}
            className="px-5 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus size={16} />
            Add Subject
          </button>
        </div>
      </div>

      {uploadMsg && (
        <div className="bg-brand-teal/10 border border-brand-teal/20 rounded-xl p-4 text-sm text-brand-teal font-medium flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
          {uploadMsg}
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl max-w-xl mx-auto shadow-sm">
          <BookOpen className="text-brand-teal mx-auto mb-4" size={48} />
          <h3 className="text-lg font-bold text-white">No Subjects Tracked Yet</h3>
          <p className="text-sm text-slate-400 mt-2 mb-6">
            Upload your syllabus PDF or add a subject manually to initiate curriculum intelligence tracking.
          </p>
          <button onClick={() => setShowAddSub(true)} className="px-6 py-3 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg font-bold text-sm transition-colors">
            Add Your First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Subjects Sidebar */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bookmark size={16} /> Subjects
            </h3>
            <div className="space-y-2">
              {subjects.map((sub) => {
                const active = activeSubject?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => { setActiveSubject(sub); setLoading(true); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      active 
                        ? 'bg-brand-teal/10 border-brand-teal text-brand-teal' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="font-bold text-sm truncate">{sub.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">Priority: P{sub.priority}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Syllabus Details Tree */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : subjectDetails ? (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-6 shadow-sm">
                {/* Subject Description Header */}
                <div className="border-b border-slate-800 pb-5 flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white tracking-tight">{subjectDetails.subject.name}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{subjectDetails.subject.description || 'No description provided.'}</p>
                  </div>
                  <button 
                    onClick={() => setShowAddUnit(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Plus size={14} /> Add Unit
                  </button>
                </div>

                {/* Units List */}
                {subjectDetails.units.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm bg-slate-800/30 rounded-lg border border-slate-700/50 border-dashed">
                    No units added yet. Press 'Add Unit' to structure your syllabus.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {subjectDetails.units.map((unit: any) => (
                      <div key={unit.id} className="border border-slate-800 rounded-xl p-5 bg-slate-800/20 space-y-5">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider">{unit.name}</h4>
                          <button 
                            onClick={() => { setActiveUnitId(unit.id); setShowAddTopic(true); }}
                            className="text-xs font-bold text-brand-teal hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Plus size={14} /> Add Topic
                          </button>
                        </div>

                        {/* Topics inside Unit */}
                        {unit.topics.length === 0 ? (
                          <div className="text-xs text-slate-500 py-2">No topics structured.</div>
                        ) : (
                          <div className="space-y-3">
                            {unit.topics.map((topic: any) => (
                              <div key={topic.id} className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg flex items-center justify-between gap-4 group">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2.5">
                                    <h5 className="font-bold text-sm text-white leading-none">{topic.name}</h5>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                      topic.importance_level === 'High' 
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                                    }`}>
                                      {topic.importance_level} Imp
                                    </span>
                                  </div>
                                </div>

                                {/* Status Cycle Button */}
                                <button
                                  onClick={() => handleStatusChange(topic.id, topic.status)}
                                  className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition-all ${
                                    topic.status === 'completed' 
                                      ? 'bg-green-500/10 text-green-400 border-green-500/25' 
                                      : topic.status === 'weak' 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/25' 
                                        : topic.status === 'difficult' 
                                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25' 
                                          : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  {topic.status === 'completed' ? '✓ Mastered' : topic.status === 'weak' ? '⚠️ Weak' : topic.status === 'difficult' ? '⏳ Difficult' : '○ Not Started'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Add Subject Modal overlay */}
      {showAddSub && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-slate-900 w-full max-w-md p-6 rounded-xl border border-slate-700 space-y-5 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Add Curriculum Subject</h3>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Subject Name</label>
                <input type="text" required placeholder="e.g. Computer Networks" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Description</label>
                <textarea placeholder="e.g. Relational modeling, indexing, normal forms" value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} rows={3} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all resize-none" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Priority Level</label>
                <select value={newSubPri} onChange={(e) => setNewSubPri(Number(e.target.value))} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all">
                  <option value="1">Priority 1 (Critical Focus)</option>
                  <option value="2">Priority 2 (High Focus)</option>
                  <option value="3">Priority 3 (Medium Focus)</option>
                  <option value="4">Priority 4 (Low Focus)</option>
                  <option value="5">Priority 5 (Elective Focus)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddSub(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg text-xs font-extrabold transition-colors">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnit && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-slate-900 w-full max-w-sm p-6 rounded-xl border border-slate-700 space-y-5 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Add Syllabus Unit</h3>
            <form onSubmit={handleAddUnit} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Unit Title</label>
                <input type="text" required placeholder="e.g. Unit 1: Introduction" value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddUnit(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg text-xs font-extrabold transition-colors">Save Unit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {showAddTopic && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          <div className="bg-slate-900 w-full max-w-sm p-6 rounded-xl border border-slate-700 space-y-5 shadow-2xl">
            <h3 className="font-bold text-lg text-white">Add Curriculum Topic</h3>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Topic Name</label>
                <input type="text" required placeholder="e.g. B-Trees & Hash Indexing" value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Importance Level</label>
                <select value={newTopicImp} onChange={(e) => setNewTopicImp(e.target.value)} className="bg-slate-800 border border-slate-700 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal rounded-lg p-2.5 text-sm text-white outline-none transition-all">
                  <option value="Low">Low Importance</option>
                  <option value="Medium">Medium Importance</option>
                  <option value="High">High Importance</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAddTopic(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-brand-teal hover:bg-brand-teal/90 text-slate-900 rounded-lg text-xs font-extrabold transition-colors">Save Topic</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusPage;

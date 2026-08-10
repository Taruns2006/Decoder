import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('atlantis_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const authAPI = {
  register: (data: any) => API.post('/auth/register', data),
  login: (data: any) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  onboard: (data: any) => API.post('/auth/onboard', data),
};

export const studentAPI = {
  getDashboard: () => API.get('/students/dashboard'),
};

export const syllabusAPI = {
  getSubjects: () => API.get('/syllabus/subjects'),
  createSubject: (data: any) => API.post('/syllabus/subjects', data),
  getFullSyllabus: (subjectId: number) => API.get(`/syllabus/subjects/${subjectId}/full`),
  addUnit: (subjectId: number, data: any) => API.post(`/syllabus/subjects/${subjectId}/units`, data),
  addTopic: (unitId: number, data: any) => API.post(`/syllabus/units/${unitId}/topics`, data),
  updateStudentTopic: (topicId: number, data: any) => API.post(`/syllabus/topics/${topicId}/student-topic`, data),
  uploadSyllabus: (formData: FormData) => API.post('/syllabus/upload-syllabus', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const tutorAPI = {
  getSessions: () => API.get('/tutor/sessions'),
  createSession: (data: any) => API.post('/tutor/sessions', data),
  getMessages: (sessionId: number) => API.get(`/tutor/sessions/${sessionId}/messages`),
  sendMessage: (sessionId: number, data: any) => API.post(`/tutor/sessions/${sessionId}/chat`, data),
};

export const quizAPI = {
  generateQuiz: (data: any) => API.post('/quizzes/generate', data),
  submitQuiz: (data: any) => API.post('/quizzes/submit', data),
  getAttempts: () => API.get('/quizzes/attempts'),
};

export const plannerAPI = {
  getSessions: () => API.get('/planner/sessions'),
  generatePlanner: () => API.post('/planner/generate'),
  updateSessionStatus: (sessionId: number, status: string) => API.post(`/planner/sessions/${sessionId}/status`, { status }),
  recalibrate: () => API.post('/planner/recalibrate'),
};

export const assignmentAPI = {
  getAssignments: () => API.get('/assignments'),
  createAssignment: (data: any) => API.post('/assignments', data),
  updateAssignment: (id: number, data: any) => API.put(`/assignments/${id}`, data),
  getAssistant: (id: number) => API.post(`/assignments/${id}/assistant`),
};

export const documentAPI = {
  getDocuments: () => API.get('/documents'),
  uploadDocument: (formData: FormData) => API.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocumentDetails: (id: number) => API.get(`/documents/${id}`),
  getDocumentFlashcards: (id: number) => API.get(`/documents/${id}/flashcards`),
  askDocument: (id: number, question: string) => API.post(`/documents/${id}/qna`, { question }),
};

export const progressAPI = {
  getAnalytics: () => API.get('/progress'),
};

export const resumeAPI = {
  getSkills: () => API.get('/resume/skills'),
  analyzeResume: (data: any) => API.post('/resume/analyze', data),
  uploadResume: (formData: FormData) => API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const careerAPI = {
  getRoadmap: () => API.get('/career/roadmap'),
  generateRoadmap: () => API.post('/career/roadmap/generate'),
  getProjects: () => API.get('/career/projects'),
  updateProjectStatus: (id: number, status: string) => API.post(`/career/projects/${id}/status?status=${status}`),
};

export const resourceAPI = {
  getResources: () => API.get('/resources'),
  toggleSaveResource: (id: number) => API.post(`/resources/${id}/save`),
};

export default API;

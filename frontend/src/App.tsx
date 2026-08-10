import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import {
  Home, BookOpen, MessageSquare, Calendar, Settings,
  Brain, FileText, CheckSquare, LogOut, Menu, X, Flame, BarChart2, Briefcase, Map, Target
} from 'lucide-react';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SyllabusPage from './pages/SyllabusPage';
import TutorPage from './pages/TutorPage';
import QuizzesPage from './pages/QuizzesPage';
import PlannerPage from './pages/PlannerPage';
import AssignmentsPage from './pages/AssignmentsPage';
import NotesPage from './pages/NotesPage';
import ResumePage from './pages/ResumePage';
import CareerRoadmapPage from './pages/CareerRoadmapPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';
import ProgressPage from './pages/ProgressPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-deep flex items-center justify-center flex-col gap-4">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading your workspace...</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Navigation Architecture
const navGroups = [
  {
    category: 'Home',
    items: [
      { name: 'Overview', path: '/dashboard', icon: Home, exact: true },
    ]
  },
  {
    category: 'Learning',
    items: [
      { name: 'Learn', path: '/dashboard/syllabus', icon: BookOpen },
      { name: 'Practice', path: '/dashboard/quizzes', icon: Brain },
      { name: 'AI Tutor', path: '/dashboard/tutor', icon: MessageSquare },
      { name: 'Progress', path: '/dashboard/progress', icon: BarChart2 },
      { name: 'Documents', path: '/dashboard/documents', icon: FileText },
    ]
  },
  {
    category: 'Planning',
    items: [
      { name: 'Study Plan', path: '/dashboard/planner', icon: Target },
      { name: 'Calendar', path: '/dashboard/calendar', icon: Calendar },
      { name: 'Assignments', path: '/dashboard/assignments', icon: CheckSquare },
    ]
  },
  {
    category: 'Career',
    items: [
      { name: 'Resume', path: '/dashboard/resume', icon: Briefcase },
      { name: 'Career Path', path: '/dashboard/roadmap', icon: Map },
    ]
  },
  {
    category: 'System',
    items: [
      { name: 'Settings', path: '/dashboard/settings', icon: Settings },
    ]
  }
];

// Page title map for the topbar
const pageTitles: Record<string, string> = {
  '/dashboard':             'Home Overview',
  '/dashboard/syllabus':    'Learn & Syllabus',
  '/dashboard/planner':     'Study Planner',
  '/dashboard/progress':    'Progress Analytics',
  '/dashboard/tutor':       'AI Tutor',
  '/dashboard/assignments': 'Assignments',
  '/dashboard/quizzes':     'Practice Quizzes',
  '/dashboard/documents':   'Documents & Notes',
  '/dashboard/resume':      'Resume Analysis',
  '/dashboard/roadmap':     'Career Roadmap',
  '/dashboard/resources':   'Resources',
  '/dashboard/calendar':    'Calendar',
  '/dashboard/settings':    'Settings',
};

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const pageTitle = pageTitles[location.pathname] ?? 'Atlantis';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              {group.category}
            </h3>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-teal/10 text-brand-teal'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-brand-teal' : 'text-slate-500'} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="border-t border-slate-800 p-4 space-y-3">
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white text-xs border border-slate-700 flex-shrink-0">
              {user.level}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              {user.streak > 0 && (
                <p className="text-[10px] text-orange-400 flex items-center gap-1 mt-0.5">
                  <Flame size={10} /> {user.streak} day streak
                </p>
              )}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-medium"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-brand-deep">
      {/* ── Desktop Sidebar ────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 fixed h-screen z-20">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center font-bold text-slate-900 text-lg shadow-sm">
            A
          </div>
          <div>
            <div className="text-sm font-bold tracking-wide text-white leading-none">Atlantis</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">Learning OS</div>
          </div>
        </div>
        <SidebarContent />
      </aside>

      {/* ── Mobile Header ──────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand-teal flex items-center justify-center font-bold text-slate-900 text-sm">
            A
          </div>
          <span className="text-sm font-bold text-white">Atlantis</span>
        </div>
        <div className="flex items-center gap-3">
          {user?.streak > 0 && (
            <span className="text-xs text-orange-400 font-semibold flex items-center gap-1">
              <Flame size={14} /> {user.streak}
            </span>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 hover:text-white transition-colors p-1">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-brand-deep/95 backdrop-blur-sm pt-14 flex flex-col">
          <SidebarContent />
        </div>
      )}

      {/* ── Main Content Area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:pl-64 pt-14 lg:pt-0">
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 px-8 hidden lg:flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>

          {user && (
            <div className="flex items-center gap-5">
              {user.streak > 0 && (
                <div className="flex items-center gap-1.5 text-orange-400 font-medium text-sm bg-orange-400/10 px-3 py-1.5 rounded-full">
                  <Flame size={14} />
                  <span>{user.streak} day streak</span>
                </div>
              )}
            </div>
          )}
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <Routes>
            <Route path=""            element={<DashboardPage />} />
            <Route path="syllabus"    element={<SyllabusPage />} />
            <Route path="tutor"       element={<TutorPage />} />
            <Route path="planner"     element={<PlannerPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="documents"   element={<NotesPage />} />
            <Route path="quizzes"     element={<QuizzesPage />} />
            <Route path="progress"    element={<ProgressPage />} />
            <Route path="resume"      element={<ResumePage />} />
            <Route path="roadmap"     element={<CareerRoadmapPage />} />
            <Route path="resources"   element={<SettingsPage tab="resources" />} />
            <Route path="calendar"    element={<CalendarPage />} />
            <Route path="settings"    element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/"           element={<LandingPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;


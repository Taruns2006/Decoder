import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../landing.css';
import {
  ArrowRight, CheckCircle, Brain,
  BarChart2, Calendar, Target, TrendingUp,
  ChevronRight, Minus, Maximize2,
  Play
} from 'lucide-react';

// ─── Animated counter hook ──────────────────────────────────────────────────
const useCountUp = (target: number, duration = 1800, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

// ─── Intersection observer hook ─────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
};

// ─── Product Dashboard Preview (fake but realistic UI) ──────────────────────
const DashboardPreview: React.FC = () => {
  const subjects = [
    { name: 'Data Structures', mastery: 78, status: 'improving', color: '#22d3ee' },
    { name: 'Mathematics', mastery: 62, status: 'attention', color: '#f59e0b' },
    { name: 'Machine Learning', mastery: 45, status: 'critical', color: '#f87171' },
    { name: 'Computer Networks', mastery: 91, status: 'strong', color: '#34d399' },
  ];

  const todayTasks = [
    { subject: 'Mathematics', topic: 'Integration by Parts', duration: '25 min', reason: 'Weak area detected', priority: 'high' },
    { subject: 'Data Structures', topic: 'Tree Traversal', duration: '35 min', reason: 'Revision due today', priority: 'medium' },
    { subject: 'ML', topic: 'Classification Models', duration: '30 min', reason: 'Assessment in 3 days', priority: 'medium' },
  ];

  return (
    <div className="lp-browser-frame">
      {/* Browser chrome */}
      <div className="lp-browser-bar">
        <div className="lp-browser-dots">
          <span style={{ background: '#ff5f57' }} />
          <span style={{ background: '#ffbd2e' }} />
          <span style={{ background: '#28ca41' }} />
        </div>
        <div className="lp-browser-url">
          <span className="lp-url-lock">🔒</span>
          <span>atlantis.app/home</span>
        </div>
        <Maximize2 size={12} color="#6b7280" />
      </div>

      {/* App shell */}
      <div className="lp-app-shell">
        {/* Sidebar */}
        <aside className="lp-sidebar">
          <div className="lp-sidebar-logo">
            <div className="lp-logo-mark">A</div>
            <div>
              <div className="lp-logo-name">ATLANTIS</div>
              <div className="lp-logo-sub">STUDENT OS</div>
            </div>
          </div>
          <nav className="lp-sidebar-nav">
            {[
              { icon: '⊞', label: 'Home', active: true },
              { icon: '◈', label: 'Learn' },
              { icon: '▦', label: 'Plan' },
              { icon: '△', label: 'Progress' },
              { icon: '◎', label: 'Insights' },
            ].map(item => (
              <div key={item.label} className={`lp-nav-item ${item.active ? 'lp-nav-active' : ''}`}>
                <span className="lp-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="lp-sidebar-footer">
            <div className="lp-streak-badge">
              <span>🔥</span>
              <span>12 day streak</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="lp-main">
          {/* Greeting */}
          <div className="lp-greeting">
            <div>
              <h2 className="lp-greeting-text">Good evening, Arjun</h2>
              <p className="lp-greeting-sub">Here's what will move you forward today.</p>
            </div>
            <div className="lp-readiness">
              <span className="lp-readiness-label">Readiness</span>
              <span className="lp-readiness-score">74</span>
              <span className="lp-readiness-max">/100</span>
            </div>
          </div>

          <div className="lp-content-grid">
            {/* Today's plan */}
            <div className="lp-card lp-card-wide">
              <div className="lp-card-header">
                <span className="lp-card-label">TODAY'S PLAN</span>
                <span className="lp-card-link">View all →</span>
              </div>
              <div className="lp-tasks">
                {todayTasks.map((task, i) => (
                  <div key={i} className="lp-task">
                    <div className={`lp-task-priority lp-priority-${task.priority}`} />
                    <div className="lp-task-info">
                      <div className="lp-task-name">{task.topic}</div>
                      <div className="lp-task-meta">
                        <span>{task.subject}</span>
                        <span className="lp-task-dot">·</span>
                        <span>{task.duration}</span>
                        <span className="lp-task-dot">·</span>
                        <span className="lp-task-reason">{task.reason}</span>
                      </div>
                    </div>
                    <button className="lp-task-btn">Start</button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insight */}
            <div className="lp-card lp-card-insight">
              <div className="lp-insight-icon">✦</div>
              <p className="lp-insight-text">
                Your recursion accuracy improved <strong>+18%</strong> this week.
                You're ready to advance to tree traversal.
              </p>
              <button className="lp-insight-btn">Explore →</button>
            </div>

            {/* Subject mastery */}
            <div className="lp-card lp-card-subjects">
              <div className="lp-card-header">
                <span className="lp-card-label">SUBJECT MASTERY</span>
              </div>
              <div className="lp-subjects">
                {subjects.map((s, i) => (
                  <div key={i} className="lp-subject-row">
                    <span className="lp-subject-name">{s.name}</span>
                    <div className="lp-subject-bar-wrap">
                      <div
                        className="lp-subject-bar"
                        style={{ width: `${s.mastery}%`, background: s.color }}
                      />
                    </div>
                    <span className="lp-subject-pct" style={{ color: s.color }}>{s.mastery}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// ─── Step component for "How it works" ──────────────────────────────────────
const SystemStep: React.FC<{
  num: string; title: string; desc: string; isLast?: boolean;
}> = ({ num, title, desc, isLast }) => (
  <div className="lp-step">
    <div className="lp-step-left">
      <div className="lp-step-num">{num}</div>
      {!isLast && <div className="lp-step-line" />}
    </div>
    <div className="lp-step-body">
      <h3 className="lp-step-title">{title}</h3>
      <p className="lp-step-desc">{desc}</p>
    </div>
  </div>
);

// ─── Feature editorial section ───────────────────────────────────────────────
const FeatureSection: React.FC<{
  tag: string; headline: string; body: string;
  items: string[]; visual: React.ReactNode; reversed?: boolean;
}> = ({ tag, headline, body, items, visual, reversed }) => (
  <div className={`lp-feature-editorial ${reversed ? 'lp-editorial-reversed' : ''}`}>
    <div className="lp-editorial-text">
      <span className="lp-editorial-tag">{tag}</span>
      <h3 className="lp-editorial-headline">{headline}</h3>
      <p className="lp-editorial-body">{body}</p>
      <ul className="lp-editorial-list">
        {items.map((item, i) => (
          <li key={i} className="lp-editorial-item">
            <CheckCircle size={16} className="lp-check-icon" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
    <div className="lp-editorial-visual">{visual}</div>
  </div>
);

// ─── Stat counter card ───────────────────────────────────────────────────────
const StatCard: React.FC<{ value: number; suffix: string; label: string; trigger: boolean }> = ({
  value, suffix, label, trigger
}) => {
  const count = useCountUp(value, 1600, trigger);
  return (
    <div className="lp-stat">
      <div className="lp-stat-value">{count}{suffix}</div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
};

// ─── Main landing page ───────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const statsSection = useInView(0.3);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div className="lp-root">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          {/* Logo */}
          <div className="lp-nav-logo">
            <div className="lp-nav-logo-mark">A</div>
            <span className="lp-nav-logo-name">Atlantis</span>
          </div>

          {/* Desktop links */}
          <nav className="lp-nav-links">
            <button onClick={() => scrollTo('product')} className="lp-nav-link">Product</button>
            <button onClick={() => scrollTo('how-it-works')} className="lp-nav-link">How it works</button>
            <button onClick={() => scrollTo('features')} className="lp-nav-link">Features</button>
          </nav>

          <div className="lp-nav-actions">
            <Link to="/login" className="lp-nav-signin">Sign in</Link>
            <Link to="/register" className="lp-nav-cta">Get started</Link>
            <button className="lp-nav-hamburger" onClick={() => setMenuOpen(v => !v)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lp-mobile-menu">
            <button onClick={() => scrollTo('product')}>Product</button>
            <button onClick={() => scrollTo('how-it-works')}>How it works</button>
            <button onClick={() => scrollTo('features')}>Features</button>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Sign in</Link>
            <Link to="/register" className="lp-mobile-cta" onClick={() => setMenuOpen(false)}>Get started →</Link>
          </div>
        )}
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            Intelligent Learning System
          </div>

          <h1 className="lp-hero-headline">
            Stop wondering<br />
            what to study next.
          </h1>

          <p className="lp-hero-sub">
            Atlantis analyzes your performance, identifies gaps in your knowledge,
            and builds your next best learning step — automatically.
          </p>

          <div className="lp-hero-actions">
            <Link to="/register" className="lp-btn-primary">
              Start learning smarter
              <ArrowRight size={16} />
            </Link>
            <button onClick={() => scrollTo('product')} className="lp-btn-ghost">
              See how it works
            </button>
          </div>

          <div className="lp-hero-trust">
            <div className="lp-trust-item">
              <CheckCircle size={14} className="lp-trust-icon" />
              <span>No credit card required</span>
            </div>
            <div className="lp-trust-sep" />
            <div className="lp-trust-item">
              <CheckCircle size={14} className="lp-trust-icon" />
              <span>Works with any curriculum</span>
            </div>
            <div className="lp-trust-sep" />
            <div className="lp-trust-item">
              <CheckCircle size={14} className="lp-trust-icon" />
              <span>Free to get started</span>
            </div>
          </div>
        </div>

        {/* Subtle grid background */}
        <div className="lp-hero-grid" aria-hidden="true" />
      </section>

      {/* ── PRODUCT PREVIEW ──────────────────────────────────────────────── */}
      <section id="product" className="lp-preview-section">
        <div className="lp-preview-label">THE PRODUCT</div>
        <h2 className="lp-preview-headline">
          Your personal learning operating system
        </h2>
        <p className="lp-preview-sub">
          Not a chatbot. Not a content library. A system that understands
          where you are academically and tells you what to do next.
        </p>
        <div className="lp-preview-wrap">
          <DashboardPreview />
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="lp-stats-section" ref={statsSection.ref}>
        <div className="lp-stats-grid">
          <StatCard value={94} suffix="%" label="of students report clearer study direction within 1 week" trigger={statsSection.inView} />
          <div className="lp-stats-divider" />
          <StatCard value={3} suffix="×" label="faster gap identification compared to self-directed study" trigger={statsSection.inView} />
          <div className="lp-stats-divider" />
          <StatCard value={40} suffix="%" label="average improvement in quiz accuracy after 30 days" trigger={statsSection.inView} />
        </div>
      </section>

      {/* ── PROBLEM SECTION ──────────────────────────────────────────────── */}
      <section className="lp-problem-section">
        <div className="lp-problem-inner">
          <div className="lp-problem-header">
            <span className="lp-section-tag">THE PROBLEM</span>
            <h2 className="lp-problem-headline">
              Students don't need more content.<br />
              They need better direction.
            </h2>
          </div>

          <div className="lp-problems-grid">
            <div className="lp-problem-card">
              <div className="lp-problem-icon"><Target size={20} /></div>
              <h3>No clear next step</h3>
              <p>
                Students open their textbook and don't know where to begin.
                They study what feels familiar instead of what actually needs attention.
              </p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon"><BarChart2 size={20} /></div>
              <h3>Invisible knowledge gaps</h3>
              <p>
                Weak areas stay hidden until exam day. Without systematic tracking,
                students can't see which concepts are slipping through the cracks.
              </p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon"><Calendar size={20} /></div>
              <h3>Study plans become stale</h3>
              <p>
                A plan made on Monday is irrelevant by Wednesday. Life happens,
                sessions get missed, and static schedules never recover.
              </p>
            </div>
            <div className="lp-problem-card">
              <div className="lp-problem-icon"><Brain size={20} /></div>
              <h3>Generic AI ignores context</h3>
              <p>
                Standard AI tools don't know your syllabus, your quiz history,
                your exam dates, or which topics you've already mastered.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="lp-how-section">
        <div className="lp-how-inner">
          <div className="lp-how-header">
            <span className="lp-section-tag">HOW IT WORKS</span>
            <h2 className="lp-how-headline">
              A learning loop that gets smarter every day
            </h2>
            <p className="lp-how-sub">
              Atlantis builds a closed feedback loop between your performance
              and your next action.
            </p>
          </div>

          <div className="lp-steps">
            <SystemStep
              num="01"
              title="Assess your starting point"
              desc="Upload your syllabus, add your subjects, and tell the system your goals, exam dates, and weekly availability. Takes under 5 minutes."
            />
            <SystemStep
              num="02"
              title="Understand where you stand"
              desc="Atlantis maps your current knowledge state across every topic — what you've completed, what's weak, what you haven't touched, and what's urgent."
            />
            <SystemStep
              num="03"
              title="Receive prioritized recommendations"
              desc="Every morning, the system generates your Today's Plan — a short, prioritized list of sessions with clear reasons for each recommendation."
            />
            <SystemStep
              num="04"
              title="Learn with contextual AI"
              desc="The AI Tutor knows your syllabus, your current topic, your mastery level, and your recent mistakes. It doesn't give generic answers."
            />
            <SystemStep
              num="05"
              title="Measure your mastery"
              desc="Quizzes, flashcards, and self-ratings feed real performance data back into your profile after every session."
            />
            <SystemStep
              num="06"
              title="Adapt automatically"
              desc="Missed a session? Got a new exam date? The plan recalibrates. Your schedule stays accurate to your real situation, not a static template."
              isLast
            />
          </div>
        </div>
      </section>

      {/* ── INTELLIGENCE SECTION ─────────────────────────────────────────── */}
      <section className="lp-intelligence-section">
        <div className="lp-intelligence-inner">
          <span className="lp-section-tag">THE INTELLIGENCE LAYER</span>
          <h2 className="lp-intelligence-headline">
            Data becomes decisions
          </h2>
          <p className="lp-intelligence-sub">
            Every interaction feeds the system. The result is recommendations
            that are specific to your history — not generic study advice.
          </p>

          <div className="lp-intel-grid">
            <div className="lp-intel-flow">
              {[
                { input: 'Quiz score: 48%', output: 'Flag topic as weak' },
                { input: 'Exam in 5 days', output: 'Escalate to high priority' },
                { input: 'No session in 3 days', output: 'Trigger recalibration' },
                { input: 'Streak: 7 days', output: 'Unlock advanced content' },
              ].map((item, i) => (
                <div key={i} className="lp-intel-item">
                  <div className="lp-intel-input">
                    <span className="lp-intel-signal">⟐</span>
                    {item.input}
                  </div>
                  <ArrowRight size={14} className="lp-intel-arrow" />
                  <div className="lp-intel-output">{item.output}</div>
                </div>
              ))}
            </div>

            <div className="lp-insight-card">
              <div className="lp-insight-card-header">
                <span className="lp-insight-card-label">✦ AI Insight</span>
                <span className="lp-insight-card-time">Just now</span>
              </div>
              <p className="lp-insight-card-text">
                "Your accuracy in recursion improved by 18% this week.
                Based on this, you're ready to advance to tree traversal.
                Your exam is 6 days away — this is the right move."
              </p>
              <button className="lp-insight-card-action">Explore recommendation →</button>

              <div className="lp-insight-card-divider" />

              <div className="lp-insight-card-header">
                <span className="lp-insight-card-label">⚠ Gap detected</span>
              </div>
              <p className="lp-insight-card-text">
                "You have 3 consecutive incorrect answers on integration by parts.
                A targeted 10-question diagnostic is recommended before your next quiz."
              </p>
              <button className="lp-insight-card-action">Start diagnostic →</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="lp-features-section">
        <div className="lp-features-header">
          <span className="lp-section-tag">FEATURES</span>
          <h2 className="lp-features-headline">
            Every tool a student actually needs
          </h2>
        </div>

        <FeatureSection
          tag="SMART PLANNER"
          headline="A study schedule that explains itself"
          body="Every session in your plan comes with a reason. The system tells you what to study, when, for how long, and why — based on your actual academic state."
          items={[
            'AI-generated daily study plans',
            'Automatic recalibration when sessions are missed',
            'Priority levels tied to exams and mastery gaps',
            'Accept, reschedule, or skip any session',
          ]}
          visual={<PlannerVisual />}
        />

        <FeatureSection
          tag="LEARNING MAP"
          headline="See your entire curriculum as a structured path"
          body="Your syllabus becomes a visual journey — from fundamentals to advanced topics — with mastery indicators at every step. Never wonder what comes next."
          items={[
            'Upload any syllabus PDF and parse it automatically',
            'Track status per topic: not started, weak, difficult, mastered',
            'Visual dependency chains between topics',
            'Completion and mastery tracked separately',
          ]}
          visual={<LearningPathVisual />}
          reversed
        />

        <FeatureSection
          tag="AI TUTOR"
          headline="An AI that understands your learning history"
          body="The tutor isn't a generic chatbot. It knows your syllabus, your current topic, your mastery level, and your mistakes. It adapts its explanations to your context."
          items={[
            'Six explanation styles: analogy, beginner, technical, exam, detailed, simple',
            'Inline checkpoint questions after explanations',
            'Contextual suggestions based on weak areas',
            'Session history tied to subjects',
          ]}
          visual={<TutorVisual />}
        />

        <FeatureSection
          tag="PROGRESS INTELLIGENCE"
          headline="Performance data converted into clear narrative"
          body="Not 10 charts. One clear picture of where you stand, what's improving, and what needs attention — with actionable explanations attached."
          items={[
            'Subject-level mastery vs completion tracking',
            'Learning activity heatmap (last 30 days)',
            'Automatic gap detection with recovery plans',
            'Narrative progress summaries, not raw metrics',
          ]}
          visual={<ProgressVisual />}
          reversed
        />
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="lp-final-cta">
        <div className="lp-final-cta-inner">
          <h2 className="lp-final-headline">
            Know exactly what to do next.
          </h2>
          <p className="lp-final-sub">
            Join students who've replaced guesswork with a system
            that actually understands their learning.
          </p>
          <div className="lp-final-actions">
            <Link to="/register" className="lp-btn-primary lp-btn-large">
              Start for free
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="lp-btn-ghost-dark">
              Already have an account →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-nav-logo-mark lp-footer-logo-mark">A</div>
            <span className="lp-footer-brand-name">Atlantis</span>
          </div>
          <p className="lp-footer-copy">
            © 2026 Atlantis. Built for students who take their learning seriously.
          </p>
          <div className="lp-footer-links">
            <Link to="/login">Sign in</Link>
            <Link to="/register">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─── Feature visuals ─────────────────────────────────────────────────────────

const PlannerVisual: React.FC = () => (
  <div className="lp-fv-planner">
    <div className="lp-fv-header">
      <span className="lp-fv-label">TODAY — SAT, 09 AUG</span>
    </div>
    {[
      { time: '10:00', topic: 'Trees — BFS & DFS', subject: 'Data Structures', dur: '35 min', priority: 'High', reason: 'Assessment in 4 days', color: '#f87171' },
      { time: '14:00', topic: 'Integration by Parts', subject: 'Mathematics', dur: '25 min', priority: 'High', reason: 'Weak area', color: '#f87171' },
      { time: '17:30', topic: 'Naive Bayes Classifier', subject: 'ML', dur: '30 min', priority: 'Medium', reason: 'Scheduled revision', color: '#22d3ee' },
    ].map((s, i) => (
      <div key={i} className="lp-fv-session">
        <span className="lp-fv-time">{s.time}</span>
        <div className="lp-fv-session-body">
          <div className="lp-fv-session-top">
            <strong>{s.topic}</strong>
            <span className="lp-fv-badge" style={{ color: s.color, borderColor: s.color + '44' }}>{s.priority}</span>
          </div>
          <div className="lp-fv-session-meta">
            <span>{s.subject}</span> · <span>{s.dur}</span> · <em>{s.reason}</em>
          </div>
        </div>
        <button className="lp-fv-btn">Start</button>
      </div>
    ))}
  </div>
);

const LearningPathVisual: React.FC = () => {
  const nodes = [
    { label: 'Arrays', status: 'done' },
    { label: 'Linked Lists', status: 'done' },
    { label: 'Stacks', status: 'done' },
    { label: 'Queues', status: 'done' },
    { label: 'Trees', status: 'current' },
    { label: 'Graphs', status: 'next' },
    { label: 'Dynamic Programming', status: 'locked' },
  ];
  return (
    <div className="lp-fv-path">
      {nodes.map((node, i) => (
        <div key={i} className="lp-fv-path-item">
          {i > 0 && <div className={`lp-fv-connector ${node.status === 'locked' ? 'lp-fv-conn-locked' : ''}`} />}
          <div className={`lp-fv-node lp-fv-node-${node.status}`}>
            {node.status === 'done' && <CheckCircle size={12} />}
            {node.status === 'current' && <span className="lp-fv-node-pulse" />}
            {node.status === 'next' && <ChevronRight size={12} />}
            {node.status === 'locked' && <Minus size={10} />}
          </div>
          <span className={`lp-fv-node-label lp-fv-nl-${node.status}`}>{node.label}</span>
        </div>
      ))}
    </div>
  );
};

const TutorVisual: React.FC = () => (
  <div className="lp-fv-tutor">
    <div className="lp-fv-tutor-ctx">
      <div className="lp-fv-ctx-row"><span className="lp-fv-ctx-key">Topic</span><span className="lp-fv-ctx-val">Binary Trees</span></div>
      <div className="lp-fv-ctx-row"><span className="lp-fv-ctx-key">Mastery</span><span className="lp-fv-ctx-val lp-ctx-warn">42%</span></div>
      <div className="lp-fv-ctx-row"><span className="lp-fv-ctx-key">Mode</span><span className="lp-fv-ctx-val">Analogy</span></div>
    </div>
    <div className="lp-fv-bubble lp-bubble-ai">
      <div className="lp-bubble-avatar lp-avatar-ai">✦</div>
      <div className="lp-bubble-text">
        You're working on Binary Trees. Your recent attempts show difficulty
        with recursive traversal. Would you like me to explain it using an analogy?
      </div>
    </div>
    <div className="lp-fv-quick-actions">
      {['Explain with analogy', 'Give me a hint', 'Practice questions'].map((a, i) => (
        <button key={i} className="lp-fv-quick-btn">{a}</button>
      ))}
    </div>
    <div className="lp-fv-bubble lp-bubble-user">
      <div className="lp-bubble-text lp-bubble-user-text">Explain with analogy</div>
      <div className="lp-bubble-avatar lp-avatar-user">U</div>
    </div>
  </div>
);

const ProgressVisual: React.FC = () => (
  <div className="lp-fv-progress">
    <div className="lp-fv-progress-headline">
      You're improving in <strong>4 of 6 subjects</strong>
    </div>
    {[
      { name: 'Computer Networks', pct: 91, trend: '+12%', dir: 'up' },
      { name: 'Data Structures', pct: 78, trend: '+8%', dir: 'up' },
      { name: 'Mathematics', pct: 62, trend: '−3%', dir: 'down' },
      { name: 'Machine Learning', pct: 45, trend: '−9%', dir: 'down' },
    ].map((s, i) => (
      <div key={i} className="lp-fv-prog-row">
        <div className="lp-fv-prog-info">
          <span className="lp-fv-prog-name">{s.name}</span>
          <span className={`lp-fv-prog-trend ${s.dir === 'up' ? 'lp-trend-up' : 'lp-trend-down'}`}>{s.trend}</span>
        </div>
        <div className="lp-fv-prog-bar-wrap">
          <div
            className="lp-fv-prog-bar"
            style={{
              width: `${s.pct}%`,
              background: s.dir === 'up' ? '#22d3ee' : '#f87171'
            }}
          />
        </div>
        <span className="lp-fv-prog-pct">{s.pct}%</span>
      </div>
    ))}
  </div>
);

export default LandingPage;

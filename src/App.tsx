import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import CustomCursor from './components/CustomCursor';
import NoiseOverlay from './components/NoiseOverlay';
import loadingVideo from './assets/Loading.mp4';

const HomeView = lazy(() => import('./components/HomeView'));
const WorkView = lazy(() => import('./components/WorkView'));
const ServicesView = lazy(() => import('./components/ServicesView'));
const ProjectTemplateView = lazy(() => import('./components/ProjectTemplateView'));

const ADMIN_EMAILS = new Set(['besofekad@gmail.com', 'habte919@gmail.com']);
const AboutView = lazy(() => import('./components/AboutView'));
const ContactView = lazy(() => import('./components/ContactView'));
const AdminDashboardView = lazy(() => import('./components/AdminDashboardView'));
const AdminLockGate = lazy(() => import('./components/AdminLockGate'));
const CalculatorView = lazy(() => import('./calculator/CalculatorView'));

import { Project, ActiveView, AppDiagnosticEvent, MemberProfile, MemberRole } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Analytics } from '@vercel/analytics/react';
import { Mail, Instagram, ShieldAlert } from 'lucide-react';

import { collection, doc, getDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db, signInWithGoogle } from './firebase';

// ── Path-based routing (SPA) ──
// `/work/:alias` deep-links to projects; admin stays on the `#/slug` hash route.
const PUBLIC_VIEW_PATHS: Partial<Record<ActiveView, string>> = {
  home: '/',
  work: '/work',
  services: '/services',
  about: '/about',
  contact: '/contact',
  calculator: '/rates'
};

const PAGE_TITLES: Partial<Record<ActiveView, string>> = {
  home: 'Mach10 Media — Branding, Marketing & Media Production in Addis Ababa',
  work: 'Selected Works — Mach10 Media',
  services: 'Services & Packages — Mach10 Media',
  about: 'About the Studio — Mach10 Media',
  contact: 'Start a Project — Mach10 Media',
  calculator: 'Rate Estimator — Mach10 Media',
  notfound: 'Page Not Found — Mach10 Media'
};

// Per-view share/preview metadata (og:*, twitter:*) kept alongside page titles.
const PAGE_META: Partial<Record<ActiveView, { description: string; path: string }>> = {
  home: {
    description: 'Media, marketing, and production team in Addis Ababa creating brand identities, commercial photography, film, and social campaigns for ambitious brands.',
    path: '/'
  },
  work: {
    description: 'Selected campaigns, films, and brand systems from the Mach10 Media archive.',
    path: '/work'
  },
  services: {
    description: 'Branding, film production, photography, and social campaign packages by Mach10 Media.',
    path: '/services'
  },
  about: {
    description: 'The studio behind Mach10 Media — creative direction from Addis Ababa, Ethiopia.',
    path: '/about'
  },
  contact: {
    description: 'Start a project with Mach10 Media — briefs, discovery calls, and inquiries.',
    path: '/contact'
  },
  calculator: {
    description: 'Estimate a monthly content retainer with Mach10 Media’s rate estimator.',
    path: '/rates'
  }
};

const SITE_URL = 'https://mach10media.et';

function setPageMeta(view: ActiveView) {
  document.title = PAGE_TITLES[view] || PAGE_TITLES.home as string;

  const meta = PAGE_META[view] ?? PAGE_META.home;
  const setOrCreate = (attr: 'name' | 'property', key: string, content: string) => {
    let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  setOrCreate('property', 'og:title', document.title);
  setOrCreate('property', 'og:description', meta.description);
  setOrCreate('property', 'og:url', SITE_URL + meta.path);
  setOrCreate('name', 'twitter:title', document.title);
  setOrCreate('name', 'twitter:description', meta.description);
}

function parseLocation(pathname: string): { view: ActiveView; alias: string | null } {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path.startsWith('/work/')) {
    const alias = decodeURIComponent(path.slice('/work/'.length));
    if (alias) return { view: 'project', alias };
  }
  switch (path) {
    case '/':
      return { view: 'home', alias: null };
    case '/work':
      return { view: 'work', alias: null };
    case '/services':
      return { view: 'services', alias: null };
    case '/about':
      return { view: 'about', alias: null };
    case '/contact':
      return { view: 'contact', alias: null };
    case '/rates':
      return { view: 'calculator', alias: null };
    default:
      // Unknown paths get a real 404 instead of silently posing as home
      // (duplicates like '/home' also land here, which is correct).
      return { view: 'notfound', alias: null };
  }
}

// Admins are the hardcoded allowlist; employees must have an active team_members
// doc keyed by their lowercased email. Admin allowlist always wins for admins.
async function resolveMemberProfile(user: User): Promise<MemberProfile | null> {
  const email = user.email?.toLowerCase() || '';
  if (!email) return null;

  let fullName = email.split('@')[0];
  let role: MemberRole | null = ADMIN_EMAILS.has(email) ? 'admin' : null;

  try {
    const memberSnap = await getDoc(doc(db, 'team_members', email));
    if (memberSnap.exists()) {
      const data = memberSnap.data();
      if (typeof data.fullName === 'string' && data.fullName) fullName = data.fullName;
      if (!role && data.isActive && (data.role === 'admin' || data.role === 'employee')) {
        role = data.role;
      }
    }
  } catch (error) {
    console.error('Failed to resolve team membership:', error);
  }

  return role ? { email, fullName, role } : null;
}

export default function App() {
  // Navigation states — initialized from the URL so deep links and refreshes land correctly
  const initialRoute = parseLocation(window.location.pathname);
  const [activeView, setActiveView] = useState<ActiveView>(initialRoute.view);
  const [selectedProjectAlias, setSelectedProjectAlias] = useState<string | null>(initialRoute.alias);
  // The intro film plays once per browser session; reloads land on content.
  const [isLoadingScreen, setIsLoadingScreen] = useState<boolean>(
    () => !sessionStorage.getItem('mach10_intro_seen')
  );

  useEffect(() => {
    if (!isLoadingScreen) {
      try { sessionStorage.setItem('mach10_intro_seen', '1'); } catch { /* private mode */ }
    }
  }, [isLoadingScreen]);

  // Push a clean path for every public navigation; admin/upload stay hash-driven.
  const navigate = (view: ActiveView, alias?: string | null) => {
    if (view === 'admin' || view === 'upload') {
      setActiveView(view);
      return;
    }
    const path = view === 'project'
      ? `/work/${encodeURIComponent(alias || '')}`
      : PUBLIC_VIEW_PATHS[view] || '/';
    window.history.pushState({}, '', path);
    setSelectedProjectAlias(view === 'project' ? alias || null : null);
    setActiveView(view);
  };

  // Browser back/forward support
  useEffect(() => {
    const handlePopState = () => {
      const route = parseLocation(window.location.pathname);
      setActiveView(route.view);
      setSelectedProjectAlias(route.alias);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Per-view document titles + share metadata (project titles handled below)
  useEffect(() => {
    if (activeView === 'project') return;
    setPageMeta(activeView);

    // Keep the 404 page out of search indexes; every other view is indexable.
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', activeView === 'notfound' ? 'noindex' : 'index, follow');
  }, [activeView]);

  // Safety automatic dismissal of the loading screen after 8 seconds max
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingScreen(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  // Private Admin Route & Authentication state
  const [adminSlug, setAdminSlugState] = useState<string>(() => {
    return localStorage.getItem('mach10_admin_slug') || 'studio-access';
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberProfile | null>(null);
  const [contactPracticePreset, setContactPracticePreset] = useState<string | undefined>(undefined);

  // Services package CTAs pre-select the matching practice on the inquiry form.
  const handleNavigateToContact = (practice?: string) => {
    setContactPracticePreset(practice);
    navigate('contact');
  };

  const setAdminSlug = (newSlug: string) => {
    setAdminSlugState(newSlug);
    localStorage.setItem('mach10_admin_slug', newSlug);
  };

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      pushDiagnosticEvent({
        source: 'runtime',
        level: 'error',
        message: event.message || 'Unknown runtime error'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === 'string'
          ? event.reason
          : event.reason?.message || 'Unhandled promise rejection';

      pushDiagnosticEvent({
        source: 'promise',
        level: 'error',
        message: reason
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      pushDiagnosticEvent({
        source: 'auth',
        level: 'info',
        message: user ? `Authenticated as ${user.email || user.uid}.` : 'Signed out of Firebase auth.'
      });

      if (!user) {
        setMemberProfile(null);
        return;
      }

      resolveMemberProfile(user)
        .then((profile) => {
          setMemberProfile(profile);
          if (!profile && user.email) {
            pushDiagnosticEvent({
              source: 'auth',
              level: 'warning',
              message: `Signed-in account ${user.email} has no active studio membership.`
            });
          }
        })
        .catch(() => setMemberProfile(null));
    });
    return () => unsubscribe();
  }, []);

  const handleAuthenticateAdmin = async () => {
    const result = await signInWithGoogle();
    const user = result.user;
    const email = user?.email?.toLowerCase();

    if (!user || !email) {
      await signOut(auth);
      throw new Error('Google sign-in did not return an email address.');
    }

    const profile = await resolveMemberProfile(user);
    if (!profile) {
      await signOut(auth);
      pushDiagnosticEvent({
        source: 'auth',
        level: 'warning',
        message: `Unauthorized sign-in attempt from ${user.email || 'unknown account'}.`
      });
      throw new Error('This Google account is not registered for studio access.');
    }

    // Resolved eagerly so the dashboard mounts without waiting for the auth listener.
    setMemberProfile(profile);
  };

  const handleLogOut = () => {
    signOut(auth).catch((error) => {
      console.error('Failed to sign out admin:', error);
      pushDiagnosticEvent({
        source: 'auth',
        level: 'error',
        message: error.message || 'Failed to sign out admin.'
      });
    });
    setMemberProfile(null);
    setActiveView('home');
    window.history.pushState({}, '', '/');
    window.location.hash = '';
  };

  // Core synchronized dynamic projects array
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [diagnosticEvents, setDiagnosticEvents] = useState<AppDiagnosticEvent[]>([]);

  const pushDiagnosticEvent = (event: Omit<AppDiagnosticEvent, 'id' | 'createdAt'>) => {
    setDiagnosticEvents((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toLocaleString(),
        ...event
      },
      ...prev
    ].slice(0, 25));
  };

  useEffect(() => {
    // Listen to firestore projects collection in real-time, ordering by createdAt
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjectsLoading(false);
      setProjectsError(null);
      pushDiagnosticEvent({
        source: 'firestore',
        level: 'info',
        message: `Projects sync successful (${snapshot.size} records).`
      });
      if (snapshot.empty) {
        // Dev-only seed data, loaded on demand so it stays out of prod bundles.
        if (import.meta.env.DEV) {
          import('./data/mockProjects').then((m) => setProjects(m.INITIAL_PROJECTS));
        } else {
          setProjects([]);
        }
      } else {
        const loadedProjects: Project[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loadedProjects.push({
            id: docSnap.id,
            title: data.title || '',
            alias: data.alias || '',
            client: data.client || '',
            category: data.category || 'Branding',
            tagline: data.tagline || '',
            description: data.description || '',
            heroImage: data.heroImage || '',
            videoUrl: data.videoUrl,
            fullVideoUrl: data.fullVideoUrl,
            year: data.year || '',
            campaignDetails: data.campaignDetails || '',
            stats: data.stats || [],
            credits: data.credits || [],
            gallery: data.gallery || [],
            publishState: data.publishState || 'published',
            featured: Boolean(data.featured),
            archived: Boolean(data.archived),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            socialLinks: data.socialLinks,
          });
        });
        setProjects(loadedProjects);
      }
    }, (error) => {
      console.error("Firestore real-time subscription error:", error);
      setProjectsLoading(false);
      setProjects([]);
      setProjectsError('Live portfolio data could not be loaded from Firestore.');
      pushDiagnosticEvent({
        source: 'firestore',
        level: 'error',
        message: error.message || 'Live portfolio data could not be loaded from Firestore.'
      });
    });

    return () => unsubscribe();
  }, []);

  // Hash listener for custom private admin link route matching
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const cleanSlug = hash.replace(/^#\//, '');
      if (cleanSlug && cleanSlug === adminSlug) {
        setActiveView('admin');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // trigger check on initial render

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [adminSlug]);

  // Handle immersive project detail trigger
  const handleNavigateToProject = (alias: string) => {
    navigate('project', alias);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const publicProjects = projects.filter(
    (project) => project.publishState !== 'draft' && !project.archived
  );
  const selectedProject = publicProjects.find(p => p.alias === selectedProjectAlias);

  // Project detail pages get their own document title
  useEffect(() => {
    if (activeView === 'project') {
      document.title = selectedProject ? `${selectedProject.title} — Mach10 Media` : 'Mach10 Media';
    }
  }, [activeView, selectedProject]);
  const viewFallback = (
    <div className="flex h-screen items-center justify-center bg-black px-6 text-center text-white">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">Loading view...</p>
    </div>
  );

  // Custom view rendering
  const renderActiveView = () => {
    switch (activeView) {
      case 'home':
        return (
          <HomeView
            projects={publicProjects}
            onNavigateToProject={handleNavigateToProject}
            onNavigate={navigate}
          />
        );
      case 'work':
        if (projectsLoading) {
          return (
            <div className="flex h-screen items-center justify-center bg-black px-6 text-center text-white">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-400">Loading portfolio records...</p>
            </div>
          );
        }
        if (projectsError) {
          return (
            <div className="flex h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
              <ShieldAlert className="mb-4 h-10 w-10 text-red-400" />
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-red-300">{projectsError}</p>
            </div>
          );
        }
        return (
          <WorkView
            projects={publicProjects}
            onNavigateToProject={handleNavigateToProject}
          />
        );
      case 'services':
        return <ServicesView onNavigateToContact={handleNavigateToContact} />;
      case 'project':
        if (!selectedProject) {
          return (
            <div className="flex h-screen flex-col items-center justify-center text-center bg-black text-white p-6">
              <ShieldAlert className="h-10 w-10 text-red-400 mb-4" />
              <p className="font-mono text-xs tracking-wider uppercase">Project record has been decommissioned or does not exist.</p>
              <button 
                onClick={() => setActiveView('work')}
                className="mt-6 border border-white/10 px-5 py-2 font-mono text-xs uppercase hover:bg-white hover:text-black transition-all"
              >
                Return to Exhibits
              </button>
            </div>
          );
        }
        return (
          <ProjectTemplateView
            project={selectedProject}
            allProjects={publicProjects}
            onBack={() => navigate('work')}
            onNavigateToProject={handleNavigateToProject}
          />
        );
      case 'about':
        return <AboutView />;
      case 'calculator':
        return <CalculatorView />;
      case 'notfound':
        return (
          <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
            <p className="mb-3 font-mono text-[11px] tracking-[0.28em] text-[#F9A136] uppercase">
              404 — Signal Lost
            </p>
            <h1 className="font-sans text-4xl font-extralight tracking-tighter uppercase sm:text-6xl">
              This reel doesn’t <span className="font-semibold">exist</span>
            </h1>
            <p className="mt-4 max-w-md font-sans text-sm font-light leading-relaxed text-neutral-400">
              The page you’re looking for was moved, decommissioned, or never produced.
            </p>
            <button
              onClick={() => { navigate('home'); window.scrollTo(0, 0); }}
              className="mt-8 border border-white/15 px-6 py-3 font-mono text-[10px] tracking-[0.2em] uppercase transition-all hover:bg-white hover:text-black"
            >
              Return to Studio
            </button>
          </div>
        );
      case 'contact':
        return (
          <ContactView
            initialPractice={contactPracticePreset}
            onPresetConsumed={() => setContactPracticePreset(undefined)}
          />
        );
      case 'admin':
        if (!firebaseUser || !memberProfile) {
          return (
            <AdminLockGate
              onAuthenticate={handleAuthenticateAdmin}
              onClose={() => setActiveView('home')}
            />
          );
        }
        return (
          <AdminDashboardView
            projects={projects}
            setProjects={setProjects}
            activeView="admin"
            onNavigate={setActiveView}
            adminSlug={adminSlug}
            setAdminSlug={setAdminSlug}
            onLogOut={handleLogOut}
            diagnosticEvents={diagnosticEvents}
            projectsError={projectsError}
            memberProfile={memberProfile}
          />
        );
      case 'upload':
        if (!firebaseUser || !memberProfile) {
          return (
            <AdminLockGate
              onAuthenticate={handleAuthenticateAdmin}
              onClose={() => setActiveView('home')}
            />
          );
        }
        return (
          <AdminDashboardView
            projects={projects}
            setProjects={setProjects}
            activeView="upload"
            onNavigate={setActiveView}
            adminSlug={adminSlug}
            setAdminSlug={setAdminSlug}
            onLogOut={handleLogOut}
            diagnosticEvents={diagnosticEvents}
            projectsError={projectsError}
            memberProfile={memberProfile}
          />
        );
      default:
        return <HomeView projects={publicProjects} onNavigateToProject={handleNavigateToProject} onNavigate={navigate} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isLoadingScreen ? (
        <motion.div
          key="loader-viewport"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-[#030303] flex items-center justify-center select-none overflow-hidden"
        >
          {/* Fullscreen Loading Video Asset */}
          <div className="absolute inset-0 z-0 w-full h-full">
            <video
              src={loadingVideo}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover opacity-100"
              onEnded={() => setIsLoadingScreen(false)}
              onError={() => {
                console.warn("Loading video asset failed or empty; transitioning safely.");
                setIsLoadingScreen(false);
              }}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="app-root-viewport"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="relative min-h-screen bg-[#080808] text-[#f2f2f2] overflow-x-hidden selection:bg-white selection:text-black antialiased"
        >
          {/* Delicate Cinematic Background Ambient Lights */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[140px] pointer-events-none z-0" />
          <div className="absolute bottom-[20%] left-0 w-[450px] h-[450px] bg-white/5 rounded-full blur-[120px] pointer-events-none z-0" />
          <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[160px] pointer-events-none z-0" />

          {/* 1. Ambient noise textures and micro components */}
          <NoiseOverlay />
          <CustomCursor />

          {/* 2. Floating primary menu bar */}
          <Header activeView={activeView} onNavigate={navigate} />

          {/* Privacy-friendly traffic analytics (Vercel) */}
          <Analytics />

          {/* 3. Screen display router with fade-in animation wrap */}
          <main id="app-main-viewports">
            <Suspense fallback={viewFallback}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView + (selectedProjectAlias || '')}
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  {renderActiveView()}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>

          {/* 4. Elegant Editorial Footer (Visual reinforcement) */}
          <footer id="app-main-footer" className="border-t border-white/5 bg-[#030303] px-6 py-16 text-neutral-400 md:px-12">
            <div className="mx-auto max-w-7xl rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.22)] md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.9fr]">
                <div className="space-y-5">
                  <div>
                    <span className="font-sans text-lg font-bold tracking-[0.22em] text-white md:text-xl">
                      MACH10MEDIA
                    </span>
                    <p className="mt-3 max-w-md font-sans text-sm leading-relaxed text-neutral-300 md:text-[15px]">
                      High-contrast media, campaign thinking, and visual systems for brands that want culture-level presence.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href="https://www.instagram.com/mach10.et/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a
                      href="mailto:mach10media.et@gmail.com"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8c8c8c]">Navigate</p>
                  <div className="grid gap-2">
                    {[
                      { label: 'Exhibits Archives', view: 'work' as const },
                      { label: 'Manifesto Pillars', view: 'about' as const },
                      { label: 'Partner Commissions', view: 'contact' as const }
                    ].map((item) => (
                      <button
                        key={item.view}
                        onClick={() => { navigate(item.view); window.scrollTo(0, 0); }}
                        className="flex w-full items-center justify-between rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3 text-left font-sans text-sm text-neutral-300 transition-colors hover:border-white/15 hover:text-white md:text-[15px]"
                      >
                        <span>{item.label}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">Open</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#8c8c8c]">Contact</p>
                  <div className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
                    <p className="font-sans text-sm leading-relaxed text-neutral-300 md:text-[15px]">
                      Inquiries regarding campaigns, brand work, and production commissions can be sent directly to our Addis Ababa team.
                    </p>
                    <p className="mt-4 font-mono text-[12px] tracking-[0.14em] text-white">
                      mach10media.et@gmail.com
                    </p>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      Addis Ababa, Ethiopia
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-4 border-t border-white/6 pt-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  <span>Creative Direction</span>
                  <span className="text-neutral-700">/</span>
                  <span>Film Production</span>
                  <span className="text-neutral-700">/</span>
                  <span>Photography</span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                  MACH10 MEDIA CO &copy; {new Date().getFullYear()}
                </div>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

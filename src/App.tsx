import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import CustomCursor from './components/CustomCursor';
import NoiseOverlay from './components/NoiseOverlay';
import loadingVideo from './assets/Loading.mp4';

import HomeView from './components/HomeView';
const WorkView = lazy(() => import('./components/WorkView'));
const ServicesView = lazy(() => import('./components/ServicesView'));
const ProjectTemplateView = lazy(() => import('./components/ProjectTemplateView'));
const AboutView = lazy(() => import('./components/AboutView'));
const ContactView = lazy(() => import('./components/ContactView'));
const AdminDashboardView = lazy(() => import('./components/AdminDashboardView'));
const AdminLockGate = lazy(() => import('./components/AdminLockGate'));

import { INITIAL_PROJECTS } from './data/mockProjects';
import { Project, ActiveView, AppDiagnosticEvent } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Instagram, ShieldAlert } from 'lucide-react';

import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, db, signInWithGoogle } from './firebase';

export default function App() {
  // Navigation states
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedProjectAlias, setSelectedProjectAlias] = useState<string | null>(null);
  const [isLoadingScreen, setIsLoadingScreen] = useState<boolean>(true);

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
    });
    return () => unsubscribe();
  }, []);

  const handleAuthenticateAdmin = async () => {
    const result = await signInWithGoogle();
    const email = result.user?.email?.toLowerCase();
    if (email !== 'besofekad@gmail.com') {
      await signOut(auth);
      pushDiagnosticEvent({
        source: 'auth',
        level: 'warning',
        message: `Unauthorized admin sign-in attempt from ${result.user?.email || 'unknown account'}.`
      });
      throw new Error('This Google account is not authorized for admin access.');
    }
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
    setActiveView('home');
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
        setProjects(import.meta.env.DEV ? INITIAL_PROJECTS : []);
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
    setSelectedProjectAlias(alias);
    setActiveView('project');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const publicProjects = projects.filter(
    (project) => project.publishState !== 'draft' && !project.archived
  );
  const selectedProject = publicProjects.find(p => p.alias === selectedProjectAlias);
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
            onNavigate={setActiveView}
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
        return <ServicesView onNavigate={setActiveView} />;
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
            onBack={() => setActiveView('work')}
            onNavigateToProject={handleNavigateToProject}
          />
        );
      case 'about':
        return <AboutView />;
      case 'contact':
        return <ContactView />;
      case 'admin':
        if (!firebaseUser || firebaseUser.email?.toLowerCase() !== 'besofekad@gmail.com') {
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
          />
        );
      case 'upload':
        if (!firebaseUser || firebaseUser.email?.toLowerCase() !== 'besofekad@gmail.com') {
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
          />
        );
      default:
        return <HomeView projects={publicProjects} onNavigateToProject={handleNavigateToProject} onNavigate={setActiveView} />;
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
          <Header activeView={activeView} onNavigate={setActiveView} />

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
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b6b6b]">Navigate</p>
                  <div className="grid gap-2">
                    {[
                      { label: 'Exhibits Archives', view: 'work' as const },
                      { label: 'Manifesto Pillars', view: 'about' as const },
                      { label: 'Partner Commissions', view: 'contact' as const }
                    ].map((item) => (
                      <button
                        key={item.view}
                        onClick={() => { setActiveView(item.view); window.scrollTo(0, 0); }}
                        className="flex w-full items-center justify-between rounded-2xl border border-white/6 bg-white/[0.02] px-4 py-3 text-left font-sans text-sm text-neutral-300 transition-colors hover:border-white/15 hover:text-white md:text-[15px]"
                      >
                        <span>{item.label}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-500">Open</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b6b6b]">Contact</p>
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

import { useState, useRef } from 'react';
import { ArrowLeft, ArrowUpRight, Play, Pause, Volume2, VolumeX, Sparkles, Instagram, Globe, ZoomIn, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

interface ProjectTemplateViewProps {
  project: Project;
  allProjects: Project[];
  onBack: () => void;
  onNavigateToProject: (projectAlias: string) => void;
}

export default function ProjectTemplateView({ project, allProjects, onBack, onNavigateToProject }: ProjectTemplateViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Playback control mockup
  const handlePlayToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Find next project to tease at the page bottom
  const currentIndex = allProjects.findIndex(p => p.id === project.id);
  const nextProject = allProjects[(currentIndex + 1) % allProjects.length];

  const handleNextProjectClick = () => {
    onNavigateToProject(nextProject.alias);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-transparent min-h-screen text-[#f2f2f2] pt-28 pb-12">
      
      {/* Back to archives utility bar */}
      <div className="border-b border-white/5 py-4 px-6 md:px-12 bg-[#080808]/90 backdrop-blur-md sticky top-[72px] z-20">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center space-x-2.5 rounded-full border border-white/10 bg-black/40 px-4 py-2 font-mono text-[10px] tracking-widest text-[#a3a3a3] hover:text-[#F9A136] uppercase transition-all duration-300 hover:border-[#F9A136]/50"
            id="project-back-button"
          >
            <ArrowLeft className="h-4.5 w-4.5 transition-transform group-hover:-translate-x-1" />
            <span>Back to Exhibits</span>
          </button>
          
          <div className="font-mono text-[9px] tracking-[0.2em] text-[#525252] uppercase hidden sm:block">
            ARCHIVE ENTRY ID: {project.id} &bull; CLIENT: {project.client.split(' ')[0]}
          </div>
        </div>
      </div>

      {/* SECTION 1 - HERO PARALLAX BANNER */}
      <section className="relative h-[70vh] w-full overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-black">
          <img
            src={project.heroImage}
            alt={project.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-70 transition-transform duration-[2s] scale-100 brightness-90 saturate-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-black/30" />
        </div>

        <div className="absolute bottom-12 left-0 w-full px-6 md:px-12 z-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center space-x-2 mb-4 text-[#cfcfcf]">
              <Sparkles className="h-3 w-3 animate-pulse text-[#a3a3a3]" />
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase">{project.category} &bull; {project.year}</span>
            </div>
            
            <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl max-w-4xl uppercase">
              {project.title}
            </h1>
            <p className="mt-3 max-w-xl font-mono text-[10px] tracking-widest text-neutral-400 italic">
              &mdash; {project.tagline}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-20 md:px-12">
        
        {/* SECTION 2 - OUTCOMES / STATS GLASS PANEL */}
        {project.stats && project.stats.length > 0 && (
          <section className="mb-24 border border-white/5 bg-[#0c0c0c]/40 p-10 backdrop-blur-md grid gap-8 sm:grid-cols-3">
            {project.stats.map((stat, i) => (
              <div key={i} className="text-center sm:text-left border-b sm:border-b-0 sm:border-r border-white/10 last:border-0 pb-6 sm:pb-0 sm:pr-8 last:pr-0">
                <p className="font-mono text-[9px] tracking-[0.3em] text-[#737373] uppercase mb-2">
                  {stat.label}
                </p>
                <p className="font-sans text-3xl font-extralight tracking-tighter text-white md:text-4xl uppercase">
                  {stat.value}
                </p>
              </div>
            ))}
          </section>
        )}

        {/* SECTION 3 - CAMPAIGN DISCOURSE & BRAND LOGO */}
        <section className="grid gap-12 md:grid-cols-12 md:gap-20 mb-28">
          <div className="md:col-span-4 flex flex-col justify-start">
            <div className="border border-white/10 px-6 py-8 inline-block select-none text-center bg-[#0c0c0c]/60 mb-8 max-w-[240px]">
              <span className="font-sans text-xl font-black tracking-[0.3em] text-white">
                {project.client.toUpperCase()}
              </span>
              <p className="font-mono text-[8px] tracking-widest text-[#525252] uppercase mt-2">
                REPRESENTATION EMBLEM
              </p>
            </div>

            <div className="font-mono text-xs text-neutral-400 space-y-4">
              <div className="flex border-b border-white/5 py-2">
                <span className="text-neutral-600 w-28 uppercase tracking-widest">Practice</span>
                <span>{project.category}</span>
              </div>
              <div className="flex border-b border-white/5 py-2">
                <span className="text-neutral-600 w-28 uppercase tracking-widest">Launch</span>
                <span>Autumn Collection '{project.year}'</span>
              </div>
              {project.socialLinks && (
                <div className="flex border-b border-white/5 py-2">
                  <span className="text-neutral-600 w-28 uppercase tracking-widest">Connect</span>
                  <div className="flex space-x-3 items-center">
                    {project.socialLinks.instagram && (
                      <a href={project.socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:text-[#F9A136] transition-colors">
                        <Instagram className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {project.socialLinks.website && (
                      <a href={project.socialLinks.website} target="_blank" rel="noreferrer" className="hover:text-[#F9A136] transition-colors">
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-8">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#737373] uppercase mb-4">THE CONCEPT STORY</p>
            <h2 className="font-sans text-xl font-light text-neutral-300 leading-relaxed max-w-2xl">
              {project.description}
            </h2>
            
            <p className="mt-8 font-sans text-sm font-light leading-relaxed text-[#8c8c8c] max-w-3xl border-l border-white/15 pl-6 py-2.5">
              {project.campaignDetails}
            </p>
          </div>
        </section>

        {/* SECTION 4 - EMBEDDED VIDEO PRESENTATION RUNNER */}
        {project.fullVideoUrl && (
          <section className="mb-28">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#737373] uppercase mb-6">VIDEO RUNNER PRESENTATION</p>
            
            <div className="relative aspect-video w-full overflow-hidden bg-neutral-950 border border-white/10 p-2 group">
              <div className="w-full h-full overflow-hidden relative">
                <video
                  ref={videoRef}
                  src={project.fullVideoUrl}
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              
              {/* Custom floating control panel */}
              <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 to-transparent p-6 opacity-100 transition-opacity flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handlePlayToggle}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black hover:bg-[#F9A136] transition-all"
                    id="video-player-play-button"
                  >
                    {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                  </button>
                  <button
                    onClick={handleMuteToggle}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-neutral-300 hover:text-[#F9A136] hover:border-[#F9A136]/30 transition-all font-mono"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>

                 <div className="font-mono text-[9.5px] text-neutral-400 uppercase tracking-widest hidden sm:block">
                  PLAYBACK: {isPlaying ? 'STREAMING ACTIVE' : 'PAUSED'} &bull; CINEMA 4K WIDESCREEN
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* SECTION 5 - EDITORIAL CAMPAIGN PHOTO GALLERY */}
        {project.gallery && project.gallery.length > 0 && (
          <section className="mb-28">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#737373] uppercase mb-8">CAMPAIGN LOOK DESIGN EXPOSURES</p>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {project.gallery.map((asset, i) => (
                <div
                  key={asset.id}
                  onClick={() => setActiveMediaIndex(i)}
                  className="group relative cursor-pointer overflow-hidden border border-white/5 bg-[#0c0c0c]/40 p-2.5 aspect-square"
                >
                  <div className="w-full h-full overflow-hidden relative">
                    <img
                      src={asset.url}
                      alt={asset.caption || 'Exposures detail'}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out grayscale group-hover:grayscale-0 group-hover:scale-105 saturate-75 brightness-90"
                    />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20">
                        <ZoomIn className="h-4 w-4" />
                      </div>
                    </div>
                    {asset.caption && (
                      <div className="absolute bottom-3 left-3 bg-[#080808]/80 px-2.5 py-1 text-[8px] font-mono tracking-widest uppercase text-neutral-300 rounded-full border border-white/10 backdrop-blur-md">
                        {asset.caption}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6 - THE PRODUCTION TEAM INDEX */}
        {project.credits && project.credits.length > 0 && (
          <section className="mb-28 border-t border-white/5 pt-16">
            <p className="font-mono text-[10px] tracking-[0.3em] text-[#737373] uppercase mb-8">EXHIBIT REPRESENTATIVE CREDITS</p>
            
            <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
              {project.credits.map((cr, i) => (
                <div key={i} className="border-l border-white/10 pl-6 py-2 group hover:border-[#F9A136]/60 transition-all">
                  <p className="font-mono text-[8.5px] tracking-[0.2em] text-[#525252] group-hover:text-[#F9A136] uppercase mb-1 transition-colors">{cr.role}</p>
                  <p className="font-sans text-sm text-neutral-300 group-hover:text-white transition-colors">{cr.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 7 - NEXT PROJECT EMBEDDED FOOTER TEASER */}
        <section className="border-t border-white/5 pt-16 text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] text-[#525252] uppercase mb-4">CONTINUOUS IMMERSION</p>
          <div 
            onClick={handleNextProjectClick}
            className="group cursor-pointer max-w-2xl mx-auto py-12 px-6 border border-white/5 bg-[#0a0a0a]/30 hover:bg-[#0c0c0c]/80 hover:border-[#F9A136]/40 transition-all duration-500 rounded-none block"
          >
            <span className="font-mono text-[9px] text-[#737373] uppercase tracking-widest group-hover:text-[#F9A136] transition-colors">NEXT PROJECT DIRECT</span>
            <h3 className="font-sans text-2xl font-light text-[#949494] group-hover:text-[#F9A136] transition-colors mt-2 tracking-tight uppercase">
              {nextProject.title}
            </h3>
            <p className="text-[10px] font-mono tracking-[0.25em] text-[#525252] group-hover:text-[#F9A136] uppercase mt-4 flex items-center justify-center gap-1.5 transition-colors">
              <span>EXPLORE EXHIBIT</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform" />
            </p>
          </div>
        </section>

      </div>

      {/* FULLSCREEN LIGHTBOX DIALOG OVERLAY (Fullscreen Imagery Requirement) */}
      <AnimatePresence>
        {activeMediaIndex !== null && project.gallery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/98 p-4 backdrop-blur-md"
          >
            {/* Click backdrop to exit */}
            <div className="absolute inset-0 z-0" onClick={() => setActiveMediaIndex(null)} />
            
            <button
              onClick={() => setActiveMediaIndex(null)}
              className="absolute top-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white hover:border-[#F9A136] hover:text-[#F9A136] transition-colors"
              id="lightbox-close-button"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative max-h-[85vh] max-w-[90vw] z-10 flex flex-col items-center">
              <motion.img
                key={activeMediaIndex}
                src={project.gallery[activeMediaIndex].url}
                alt="Fullscreen Look view"
                referrerPolicy="no-referrer"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="max-h-[75vh] object-contain border border-white/10"
              />
              
              {project.gallery[activeMediaIndex].caption && (
                <p className="mt-4 font-mono text-xs text-neutral-400 tracking-widest uppercase text-center max-w-lg bg-black/60 px-4 py-2 border border-white/5">
                  {project.gallery[activeMediaIndex].caption}
                </p>
              )}

              {/* Lightbox pagination controls */}
              <div className="mt-6 flex items-center space-x-6 text-neutral-500 font-mono text-xs">
                <button
                  onClick={() => setActiveMediaIndex((prev) => (prev! === 0 ? project.gallery!.length - 1 : prev! - 1))}
                  className="hover:text-[#F9A136] transition-colors"
                >
                  PREV
                </button>
                <span className="tracking-widest">{activeMediaIndex + 1} / {project.gallery.length}</span>
                <button
                  onClick={() => setActiveMediaIndex((prev) => (prev! === project.gallery!.length - 1 ? 0 : prev! + 1))}
                  className="hover:text-[#F9A136] transition-colors"
                >
                  NEXT
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

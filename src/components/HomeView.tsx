import { useState, useRef, useEffect } from 'react';
import { ArrowDown, ArrowUpRight, Play, Quote, ChevronLeft, ChevronRight, Activity, Volume2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ActiveView } from '../types';
import heroVideo from '../assets/Hero.mp4';

interface HomeViewProps {
  projects: Project[];
  onNavigateToProject: (projectAlias: string) => void;
  onNavigate: (view: ActiveView) => void;
}

export default function HomeView({ projects, onNavigateToProject, onNavigate }: HomeViewProps) {
  const [activeServiceHover, setActiveServiceHover] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  // Playback control
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Testimonials state
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonials = [
    {
      quote: "Mach10 Media didn't just film a commercial for us; they crafted a visual monument. Our brand authority and customer trust rose to record heights.",
      author: "Marc-Antoine Laurent",
      role: "Global Communications Chief, Chronos Swiss",
      company: "CHRONOS SWISS"
    },
    {
      quote: "Elena and her creative directors operate on a completely different sensory level. They designed every shadow, frame, and whisper to perfection.",
      author: "Sylvia de la Vega",
      role: "Creative Director, Maison Noir House",
      company: "MAISON NOIR"
    },
    {
      quote: "The visual narratives produced during our summer campaign brought a 7.2% conversion spike. Utterly professional and editorial.",
      author: "Christoph Becker",
      role: "VP of Guest Experiences, Oasis Resorts Group",
      company: "OASIS LUXURY RESORTS"
    }
  ];

  const handlePrevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  // Curated Services listing
  const services = [
    {
      id: 0,
       idAttr: "service-branding",
      num: '01',
      title: 'Branding & Design Language',
      desc: 'Forging visual monoliths through bespoke typography, architectural styling guidelines, and strict negative space discipline.',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 1,
       idAttr: "service-commercial",
      num: '02',
      title: 'Commercial Film Production',
      desc: 'Cinematic storytelling filmed using premium vintage anamorphic glass. Handled end-to-end, from storyboard to final color mapping.',
      image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 2,
       idAttr: "service-photography",
      num: '03',
      title: 'High-Fashion Photography',
      desc: 'Chiaroscuro and high-contrast studio work. Documenting garments and human geometry for leading international magazines.',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 3,
       idAttr: "service-social",
      num: '04',
      title: 'Social Media Strategy',
      desc: 'Creating high-fidelity, native vertical micro-films that gain global organic traction on social algorithms.',
      image: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&q=80&w=1000'
    },
    {
      id: 4,
       idAttr: "service-creative",
      num: '05',
      title: 'Creative Direction Consulting',
      desc: 'Positioning legacy products as cultural landmarks. Advising boards on sensory communications and mood strategies.',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000'
    }
  ];

  // Infinite sliding logos list
  const clientLogos = [
    'OLIVE & BREAD', 'MUGO DESIGN', 'BILOS', 'KOBA', 
    'CRAVINGS', 'ILLY', 'WEGUS ', 'ROMINA'
  ];

  // Pick top featured projects first, then backfill with the rest.
  const featuredProjects = [
    ...projects.filter((project) => project.featured),
    ...projects.filter((project) => !project.featured)
  ].slice(0, 3);

  return (
    <div className="bg-transparent text-[#f2f2f2]">
      
      {/* SECTION 1 — CINEMATIC HERO */}
      <section 
        id="hero-section" 
        className="relative flex min-h-screen lg:min-h-0 lg:h-screen w-full flex-col justify-center overflow-hidden px-6 pt-24 pb-16 md:px-12 md:pt-28 md:pb-24 lg:pt-0"
      >
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 z-0 bg-[#080808]">
          <video
            ref={videoRef}
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-50 transition-all duration-1000 saturate-[0.15] brightness-75 scale-105"
          />
          {/* Elegant Dark Vignette & Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/40" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="max-w-5xl">
            <div className="flex items-center space-x-2.5 mb-6 text-[#F9A136] font-mono text-[12px] tracking-[0.3em] uppercase">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F9A136] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F9A136]"></span>
              </span>
              <span>SUMMER ARCHIVES COLLECTION</span>
            </div>
            
            <h1 className="font-sans text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extralight leading-[1.02] tracking-tighter text-[#f2f2f2] uppercase">
              creating <span className="webkit-stroke font-black opacity-80 block sm:inline-block hover:text-[#F9A136] transition-colors duration-500">emotional</span> narratives <br className="hidden lg:block"/> for <span className="font-extrabold text-white">elite brands</span>
            </h1>
            
            <p className="mt-6 md:mt-8 max-w-md font-sans text-xs sm:text-[16px] font-light leading-relaxed text-neutral-400">
              We are an award-winning boutique media, marketing and production shop. We construct luxury aesthetic structures that resonate globally through high-contrast film, photography, and branding.
            </p>
          </div>

          <div className="mt-8 md:mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* CTA action */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('work')}
                className="group relative flex items-center overflow-hidden bg-white border border-transparent rounded-full px-7 py-3.5 font-mono text-sm font-bold tracking-widest text-[#080808] uppercase transition-all duration-500 hover:bg-[#F9A136] hover:scale-105"
                data-cursor-text="EXPLORE"
                id="hero-explore-cta"
              >
                <span>Selected Works</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </button>
              
              <button
                onClick={() => onNavigate('contact')}
                className="group relative flex items-center overflow-hidden rounded-full border border-white/25 bg-white/5 px-6 py-3.5 font-mono text-xs tracking-widest text-[#f2f2f2] uppercase transition-all duration-500 hover:border-[#F9A136] hover:bg-[#F9A136] hover:text-black hover:scale-105"
                id="hero-inquire-project-button"
              >
                <span>Inquire Project</span>
                <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            {/* Scroll indicators */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={togglePlay}
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 font-mono text-xs tracking-widest text-[#f2f2f2] uppercase transition-all duration-500 hover:scale-105 hover:border-[#F9A136]/40 hover:bg-[#F9A136]/10 hover:text-[#F9A136]"
                id="hero-audio-mute-button"
              >
                <Activity className={`h-3 w-3 ${isPlaying ? 'text-[#F9A136] animate-pulse' : 'opacity-40'}`} />
                <span>{isPlaying ? 'Mute Reel' : 'Play Reel'}</span>
              </button>

              <div className="flex items-center space-x-4 text-neutral-500 transition-colors cursor-pointer group hover:text-[#F9A136]">
                <span className="font-mono text-[12px] tracking-[0.25em] uppercase">Scroll to enter</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-800 animate-bounce group-hover:border-[#F9A136]/50">
                  <ArrowDown className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — FEATURING SLIDING MARQUEE */}
      <section 
        id="logos-marquee-section" 
        className="border-y border-white/5 bg-[#030303] py-10 overflow-hidden"
      >
        <div className="flex w-full overflow-hidden select-none">
          {/* Logo chain repeated 3 times to guarantee smooth infinite looping layout */}
          <div className="flex shrink-0 animate-[marquee_25s_linear_infinite] justify-around min-w-full items-center gap-16 pr-16">
            {clientLogos.map((logo, index) => (
              <span 
                key={index} 
                className="font-sans text-xs font-black tracking-[0.3em] text-neutral-600 transition-colors duration-300 hover:text-[#F9A136] cursor-default"
              >
                {logo}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 animate-[marquee_25s_linear_infinite] justify-around min-w-full items-center gap-16 pr-16" aria-hidden="true">
            {clientLogos.map((logo, index) => (
              <span 
                key={index} 
                className="font-sans text-xs font-black tracking-[0.3em] text-neutral-600 transition-colors duration-300 hover:text-[#F9A136] cursor-default"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — SELECTED WORKS */}
      <section 
        id="featured-work-section" 
        className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32"
      >
        <div className="mb-20 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-[13px] tracking-[0.3em] text-neutral-500 uppercase mb-4">CURATED SPOTLIGHT</p>
            <h2 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] uppercase">
              selected portfolio exhibits
            </h2>
          </div>
          <button 
            onClick={() => onNavigate('work')}
            className="group flex items-center space-x-2 border border-white/25 rounded-full px-5 py-2.5 font-mono text-[10px] tracking-widest text-[#a3a3a3] hover:text-[#0a0a0a] hover:bg-[#F9A136] hover:border-[#F9A136] transition-all duration-500 uppercase"
            id="view-all-work-button"
          >
            <span>View Complete Archives ({projects.length})</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* Dynamic Project Cards */}
        <div className="grid gap-16 md:grid-cols-2 lg:gap-20">
          {featuredProjects.map((proj, i) => {
            const isLarge = i === 2; // Make the third one span full width for editorial styling layout
            return (
              <div
                key={proj.id}
                onClick={() => onNavigateToProject(proj.alias)}
                className={`group cursor-pointer select-none border border-white/5 hover:border-white/15 bg-[#0c0c0c]/50 p-4 transition-all duration-700 ease-out ${isLarge ? 'md:col-span-2' : ''}`}
                id={`featured-${proj.id}`}
              >
                <div className={`relative overflow-hidden bg-neutral-950 transition-all duration-1000 ease-out ${
                  isLarge ? 'aspect-[2.2/1] min-h-[300px]' : 'aspect-[4/5]'
                }`}>
                  
                  {/* Default static image cover with exquisite grayscale-to-color transition */}
                  <img
                    src={proj.heroImage}
                    alt={proj.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-[1.2s] ease-out grayscale group-hover:grayscale-0 group-hover:scale-105 saturate-[0.8] brightness-90"
                  />
                  
                  {/* Underneath Hover looping video snippet (Cinematic feature) */}
                  {proj.videoUrl && (
                    <video
                      src={proj.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80" />

                  {/* Top category label details */}
                  <div className="absolute top-6 left-6 flex items-center space-x-2">
                    <span className="bg-[#080808]/80 text-[#f2f2f2] border border-white/10 rounded-full px-3 py-1 font-mono text-[9px] tracking-widest uppercase backdrop-blur-md group-hover:border-[#F9A136]/30">
                      {proj.category}
                    </span>
                    <span className="bg-white/10 px-2.5 py-1 rounded-full font-mono text-[8.5px] text-white/50 backdrop-blur-md">
                      {proj.year}
                    </span>
                  </div>

                  {/* Floating click prompt on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F9A136] text-black shadow-lg shadow-black/20 scale-95 group-hover:scale-100 transition-transform duration-500">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom details block */}
                  <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-[#a3a3a3] uppercase mb-1">
                        {proj.client}
                      </p>
                      <h3 className="font-sans text-xl font-normal tracking-tight text-white md:text-2xl uppercase group-hover:text-[#F9A136] transition-colors">
                        {proj.title}
                      </h3>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition-all group-hover:bg-[#F9A136] group-hover:text-black group-hover:border-[#F9A136]">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 4 — INTERACTIVE SERVICES */}
      <section 
        id="creative-services-section" 
        className="border-t border-white/5 bg-[#0a0a0a]/45 py-24 md:py-32"
      >
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <p className="font-mono text-[13px] tracking-[0.3em] text-[#7a7a7a] uppercase mb-4">OUR SPECIALTIES</p>
          <h2 className="mb-20 font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl uppercase">
            the architectural practices of mach10 media
          </h2>

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Services navigation Accordion list */}
            <div className="flex flex-col border-b border-white/5 lg:col-span-7">
              {services.map((ser) => (
                <div
                  key={ser.id}
                  id={ser.idAttr}
                  className="group relative cursor-pointer border-t border-white/5 py-8 transition-colors duration-500"
                  onMouseEnter={() => setActiveServiceHover(ser.id)}
                  onMouseLeave={() => setActiveServiceHover(null)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <span className="font-mono text-xs text-[#525252] mr-8 pt-1.5 group-hover:text-[#F9A136] transition-colors">{ser.num}</span>
                      <div>
                        <h3 className="font-sans text-xl font-normal text-[#a3a3a3] transition-colors duration-500 group-hover:text-[#F9A136] md:text-2xl uppercase tracking-tight">
                          {ser.title}
                        </h3>
                        <p className={`mt-3 max-w-md font-sans text-xs font-light leading-relaxed text-[#8c8c8c] transition-all duration-500 overflow-hidden ${
                          activeServiceHover === ser.id ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 lg:max-h-20 lg:opacity-100'
                        }`}>
                          {ser.desc}
                        </p>
                      </div>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[#737373] transition-all duration-500 group-hover:border-[#F9A136] group-hover:text-[#F9A136] group-hover:scale-105">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Interactive Editorial Photo Preview on side (High-end concept) */}
            <div className="hidden items-center justify-center lg:col-span-5 lg:flex">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950 border border-white/10 p-3 bg-gradient-to-tr from-[#0e0e0e] to-zinc-900">
                <div className="relative w-full h-full overflow-hidden">
                  <AnimatePresence mode="wait">
                    {activeServiceHover !== null ? (
                      <motion.img
                        key={activeServiceHover}
                        src={services[activeServiceHover].image}
                        alt="Service illustrative aesthetic"
                        referrerPolicy="no-referrer"
                        initial={{ opacity: 0, scale: 1.08 }}
                        animate={{ opacity: 0.85, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="absolute inset-0 h-full w-full object-cover grayscale saturate-[0.1] brightness-90"
                      />
                    ) : (
                      <motion.div
                        key="fallback-editorial"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                      >
                        <Sparkles className="h-6 w-6 text-neutral-600 mb-4 animate-pulse" />
                        <p className="font-mono text-[9px] tracking-[0.25em] text-neutral-500 uppercase">
                          Hover craft categories to view creative studio exhibits
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/70 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — BEHIND THE SCENES GALLERY (MASONRY GRID) */}
      <section 
        id="bts-grid-section" 
        className="mx-auto max-w-7xl px-6 py-24 md:px-12 md:py-32"
      >
        <p className="font-mono text-[12px] tracking-[0.3em] text-[#7a7a7a] uppercase mb-4">THE LAB IN MOTION</p>
        <div className="mb-16 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <h2 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl uppercase">
            on-shoot studio artifacts
          </h2>
          <p className="max-w-xs font-sans text-base font-light leading-relaxed text-[#a3a3a3]">
            Captured in raw grain format. Real scenes, real lighting configurations, real production craft variables.
          </p>
        </div>

        {/* Masonry image stack with beautiful minimalism spacing */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          <div className="relative aspect-[3/4] overflow-hidden bg-neutral-950 p-2.5 border border-white/5 group">
            <div className="w-full h-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=600" 
                alt="BTS camera sensor setup" 
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0 saturate-50"
              />
              <span className="absolute bottom-2.5 left-3 font-mono text-[12px] text-white/50 bg-[#080808]/80 rounded-full px-2.5 py-1 backdrop-blur-sm">Leica M6 - Rome</span>
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden bg-neutral-950 p-2.5 border border-white/5 md:translate-y-6 group">
            <div className="w-full h-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=600" 
                alt="Concrete monolithic lines" 
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0 saturate-50"
              />
              <span className="absolute bottom-2.5 left-3 font-mono text-[12px] text-white/50 bg-[#080808]/80 rounded-full px-2.5 py-1 backdrop-blur-sm">Abstract shadows</span>
            </div>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-neutral-950 p-2.5 border border-white/5 group">
            <div className="w-full h-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600" 
                alt="Vintage visual elements roll" 
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0 saturate-50"
              />
              <span className="absolute bottom-2.5 left-3 font-mono text-[12px] text-white/50 bg-[#080808]/80 rounded-full px-2.5 py-1 backdrop-blur-sm">Arri Mini LF reel</span>
            </div>
          </div>
          <div className="relative aspect-[3/4] overflow-hidden bg-neutral-950 p-2.5 border border-white/5 md:translate-y-12 group">
            <div className="w-full h-full overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=600" 
                alt="Light leaks on on-set stairs" 
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover grayscale transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0 saturate-50"
              />
              <span className="absolute bottom-2.5 left-3 font-mono text-[12px] text-white/50 bg-[#080808]/80 rounded-full px-2.5 py-1 backdrop-blur-sm">Geneva Office</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — TESTIMONIALS (ANIMATED CHANGER) */}
      <section 
        id="testimonials-slider-section" 
        className="border-t border-white/5 bg-[#090909]/40 py-24 md:py-32 mt-12 md:mt-16"
      >
        <div className="mx-auto max-w-5xl px-6 text-center md:px-12">
          <Quote className="mx-auto h-7 w-7 text-[#737373] mb-10 opacity-70" />
          
          <div className="min-h-[180px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              >
                <blockquote>
                  <p className="font-sans text-xl font-light italic leading-relaxed text-[#f2f2f2] sm:text-2xl md:text-3xl max-w-4xl mx-auto tracking-tight">
                    "{testimonials[currentTestimonial].quote}"
                  </p>
                </blockquote>
                
                <div className="mt-8">
                  <p className="font-sans text-sm font-medium text-white tracking-wider uppercase">
                    {testimonials[currentTestimonial].author}
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.25em] text-[#8c8c8c] uppercase mt-1">
                    {testimonials[currentTestimonial].role} &bull; {testimonials[currentTestimonial].company}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Testimonial Switch Controls with sleek pill design */}
          <div className="mt-12 flex items-center justify-center space-x-6">
            <button
              onClick={handlePrevTestimonial}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-transparent text-[#f2f2f2] hover:border-[#F9A136] hover:bg-[#F9A136] hover:text-black hover:scale-105 transition-all duration-500"
              id="testimonial-prev-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs text-[#525252] tracking-widest">
              0{currentTestimonial + 1} &mdash; 0{testimonials.length}
            </span>
            <button
              onClick={handleNextTestimonial}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-transparent text-[#f2f2f2] hover:border-[#F9A136] hover:bg-[#F9A136] hover:text-black hover:scale-105 transition-all duration-500"
              id="testimonial-next-button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 7 — CALL TO CONTACT ACTION */}
      <section 
        id="homepage-contact-cta" 
        className="relative flex min-h-[550px] items-center justify-center bg-transparent px-6 py-28 text-center"
      >
        <div className="absolute inset-0 bg-[#080808]/60 backdrop-blur-[2px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <p className="font-mono text-[13px] tracking-[0.3em] text-[#8c8c8c] uppercase mb-8">INITIATE PARTNERSHIP</p>
          <h2 className="font-sans text-4xl font-extralight leading-none tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl lg:text-7xl mb-12 uppercase">
            let's co-author the <br/>
            <span className="font-extrabold webkit-stroke tracking-normal hover:text-[#F9A136] transition-colors duration-500">aesthetic identity</span> of your brand
          </h2>
          
          <button
            onClick={() => onNavigate('contact')}
            className="group relative inline-flex items-center justify-center overflow-hidden border border-transparent rounded-full bg-white px-8 py-4 font-mono text-base font-bold tracking-widest text-[#080808] uppercase transition-all duration-500 hover:bg-[#F9A136] hover:scale-105"
            id="cta-bottom-booking"
          >
            <span>Retain Mach10 Media</span>
            <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <p className="mt-12 font-mono text-[10px] text-neutral-500 uppercase tracking-[0.3em]">
            &bull; ADDIS ABABA &bull;
          </p>
        </div>
      </section>

    </div>
  );
}

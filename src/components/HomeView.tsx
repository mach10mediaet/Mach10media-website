import { useState, useRef, useEffect } from 'react';
import { ArrowDown, ArrowUpRight, Play, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ActiveView, ClientLogo } from '../types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useSiteSetting } from '../hooks/useSiteSetting';

// Streamed from /public with CDN caching instead of shipping inside the bundle
// v2 = letterbox bars cropped out of the source reel so object-fit: cover can
// never expose them as a gap at the top/bottom edge on any screen aspect.
const heroVideo = '/hero-reel.mp4?v=2';
import brandIdentityImage from '../assets/brand-identity-and-design-system.webp';
import commercialPhotographyImage from '../assets/commerical-photography.webp';
import foodPhotographyImage from '../assets/food-photography.webp';
import servicePlaceholderImage from '../assets/service-placeholder.svg';
import { isDirectVideoUrl } from '../utils/video';

interface HomeViewProps {
  projects: Project[];
  onNavigateToProject: (projectAlias: string) => void;
  onNavigate: (view: ActiveView) => void;
}

export default function HomeView({ projects, onNavigateToProject, onNavigate }: HomeViewProps) {
  const [activeServiceHover, setActiveServiceHover] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const handleScrollToContent = () => {
    const nextSection = document.getElementById('logos-marquee-section');
    nextSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Reel audio control — autoplays muted per browser policy; unmuting needs a user gesture
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  // Testimonials state
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  interface DisplayTestimonial {
    quote: string;
    author: string;
    role: string;
    company: string;
  }

  const FALLBACK_TESTIMONIALS: DisplayTestimonial[] = [
    {
      quote: "Mach10 Media transformed our vision into a strong brand identity. From the logo to the packaging, every detail exceeded our expectations.",
      author: "Natnael Mebratu",
      role: "Manager of FMT",
      company: "FMT"
    },
    {
      quote: "Mach10 Media consistently delivers high-quality photo, video, and social media content that has strengthened our online presence.",
      author: "Khalid Abdu",
      role: "Manager and Founder of RakaCars",
      company: "RAKA CARS"
    },
    {
      quote: "Their content perfectly captures our restaurant’s atmosphere and has helped us build a stronger presence on social media.",
      author: "Zelalem Maru",
      role: "Owner of Olive & Bread",
      company: "OLIVE & BREAD"
    }
  ];

  // Testimonials are admin-managed (Site Content tab); the fallback keeps the
  // section alive before any live entries exist.
  const [liveTestimonials, setLiveTestimonials] = useState<DisplayTestimonial[] | null>(null);
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'testimonials'), where('isActive', '==', true)), (snapshot) => {
      const loaded: DisplayTestimonial[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          quote: typeof data.quote === 'string' ? data.quote : '',
          author: typeof data.author === 'string' ? data.author : '',
          role: '',
          company: typeof data.company === 'string' ? data.company : ''
        });
      });
      setLiveTestimonials(loaded.length > 0 ? loaded : null);
    });
    return () => unsubscribe();
  }, []);
  const testimonials = liveTestimonials || FALLBACK_TESTIMONIALS;

  // Keep the active index valid when the live list replaces the fallback
  useEffect(() => {
    setCurrentTestimonial((prev) => (prev >= testimonials.length ? 0 : prev));
  }, [testimonials.length]);
  const activeTestimonial = testimonials[currentTestimonial] || testimonials[0];

  const handlePrevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  // Gentle auto-rotation, paused while the visitor is reading (hover)
  const [isTestimonialsHovered, setIsTestimonialsHovered] = useState(false);
  const instagramEmbedUrl = useSiteSetting('instagram_embed_url');
  useEffect(() => {
    if (isTestimonialsHovered || testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isTestimonialsHovered, testimonials.length]);

  // Curated Services listing
  const services = [
    {
      id: 0,
       idAttr: "service-branding",
      num: '01',
      title: 'BRAND IDENTITY & DESIGN SYSTEMS',
      desc: 'Building clean, memorable visual identities through logos, color systems, typography, brand guidelines, packaging, profiles, and marketing materials.',
      image: brandIdentityImage
    },
    {
      id: 1,
       idAttr: "service-commercial",
      num: '02',
      title: 'FOOD PHOTOGRAPHY',
      desc: 'Creating clean, appetizing photo assets for restaurants, cafés, bakeries, and food brands with a focus on lighting, styling, composition, and visual consistency across menus, social media, and campaigns.',
      image: foodPhotographyImage
    },
    {
      id: 2,
       idAttr: "service-photography",
      num: '03',
      title: 'COMMERCIAL PHOTOGRAPHY',
      desc: 'Creating high-quality photo assets for food, products, spaces, people, events, and campaigns, with a focus on lighting, composition, and brand consistency.',
      image: commercialPhotographyImage
    },
    {
      id: 3,
       idAttr: "service-social",
      num: '04',
      title: 'SOCIAL MEDIA CONTENT & MANAGEMENT',
      desc: 'Planning, creating, captioning, scheduling, and managing content for Instagram, TikTok, Facebook, LinkedIn, and other platforms with a clear monthly direction.',
      image: servicePlaceholderImage
    },
    {
      id: 4,
       idAttr: "service-creative",
      num: '05',
      title: 'EVENT COVERAGE & BRAND CAMPAIGNS',
      desc: 'Capturing launches, conferences, activations, openings, and brand moments through photo, video, reels, recap films, and campaign-ready content packages.',
      image: servicePlaceholderImage
    }
  ];

  // Infinite sliding logos — admin-managed via client_logos, fallback keeps the marquee alive
  const FALLBACK_CLIENT_LOGOS = ['OLIVE & BREAD', 'MUGO DESIGN', 'BILOS', 'KOBA', 'CRAVINGS', 'ILLY', 'WEGUS', 'ROMINA'];
  const [liveClientLogos, setLiveClientLogos] = useState<ClientLogo[] | null>(null);
  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, 'client_logos'), where('isActive', '==', true)), (snapshot) => {
      const loaded: ClientLogo[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          name: typeof data.name === 'string' ? data.name : '',
          logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : '',
          order: typeof data.order === 'number' ? data.order : 0,
          isActive: true
        });
      });
      loaded.sort((first, second) => first.order - second.order);
      setLiveClientLogos(loaded.length > 0 ? loaded : null);
    });
    return () => unsubscribe();
  }, []);
  const clientLogos: ClientLogo[] = liveClientLogos || FALLBACK_CLIENT_LOGOS.map((name, index) => ({
    id: `fallback-${index}`, name, logoUrl: '', order: index, isActive: true
  }));

  const getProjectTimestamp = (value: any) => {
    if (typeof value?.toMillis === 'function') return value.toMillis();
    return value instanceof Date ? value.getTime() : 0;
  };

  // Feature selections take priority, with the most recently updated exhibits shown first.
  const featuredProjects = [...projects]
    .sort((first, second) => {
      if (Boolean(first.featured) !== Boolean(second.featured)) {
        return Number(Boolean(second.featured)) - Number(Boolean(first.featured));
      }

      const firstUpdated = getProjectTimestamp(first.updatedAt) || getProjectTimestamp(first.createdAt);
      const secondUpdated = getProjectTimestamp(second.updatedAt) || getProjectTimestamp(second.createdAt);
      return secondUpdated - firstUpdated;
    })
    .slice(0, 3);

  return (
    <div className="bg-transparent text-[#f2f2f2]">
      
      {/* SECTION 1 — CINEMATIC HERO */}
      <section 
        id="hero-section" 
        className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden px-6 pt-24 pb-16 md:px-12 md:pt-28 md:pb-24"
      >
        {/* Fullscreen Video Background */}
        <div className="absolute inset-0 z-0 bg-[#080808]">
          <video
            ref={videoRef}
            src={heroVideo}
            poster="/hero-poster.jpg?v=2"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover object-center opacity-50 transition-opacity duration-1000 saturate-[0.15] brightness-75 scale-105"
          />
          {/* Elegant Dark Vignette & Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/40" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="max-w-5xl">
            <p className="mb-6 font-mono text-[12px] tracking-[0.3em] text-[#a3a3a3] uppercase">
              SELECTED ARCHIVES COLLECTION
            </p>
            
            <h1 className="font-sans text-3xl xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extralight leading-[1.02] tracking-tighter text-[#f2f2f2] uppercase">
              creating <span className="webkit-stroke font-black opacity-80 block sm:inline-block">emotional</span> narratives <br className="hidden lg:block"/> for <span className="font-extrabold text-white">elite brands</span>
            </h1>
            
            <p className="mt-6 md:mt-8 max-w-md font-sans text-xs sm:text-[16px] font-light leading-relaxed text-neutral-400">
              Mach10 Media is a media, marketing, and production team based in Addis Ababa. We help brands create strong visuals, clear stories, and thoughtful campaigns across film, photography, branding, and social media.

Our work is built around clean execution, intentional design, and content that feels true to the brand. We aim to create visuals that look good, communicate clearly, and help businesses connect with the right audience.
            </p>
          </div>

          <div className="mt-8 md:mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* CTA action */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate('work')}
                className="group relative flex items-center overflow-hidden bg-white border border-transparent rounded-full px-7 py-3.5 font-mono text-sm font-bold tracking-widest text-[#080808] uppercase transition-all duration-500 hover:bg-[#F9A136] hover:scale-[1.015]"
                data-cursor-text="EXPLORE"
                id="hero-explore-cta"
              >
                <span>Selected Works</span>
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </button>
              
              <button
                onClick={() => onNavigate('contact')}
                className="group relative flex items-center overflow-hidden rounded-full border border-white/25 bg-white/5 px-6 py-3.5 font-mono text-xs tracking-widest text-[#f2f2f2] uppercase transition-all duration-500 hover:border-[#F9A136] hover:bg-[#F9A136] hover:text-black hover:scale-[1.015]"
                id="hero-inquire-project-button"
              >
                <span>Inquire Project</span>
                <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            {/* Scroll indicators */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={toggleMute}
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 font-mono text-xs tracking-widest text-[#f2f2f2] uppercase transition-all duration-500 hover:border-[#F9A136]/40 hover:bg-[#F9A136]/10 hover:text-[#F9A136]"
                id="hero-audio-mute-button"
                aria-pressed={!isMuted}
              >
                <Volume2 className={`h-3 w-3 ${isMuted ? 'opacity-40' : 'text-[#F9A136]'}`} />
                <span>{isMuted ? 'Unmute Reel' : 'Mute Reel'}</span>
              </button>

              <button
                type="button"
                onClick={handleScrollToContent}
                className="flex items-center space-x-4 text-neutral-500 transition-colors cursor-pointer group hover:text-[#F9A136]"
                id="hero-scroll-enter-button"
              >
                <span className="font-mono text-[12px] tracking-[0.25em] uppercase">Scroll to enter</span>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-800 group-hover:border-[#F9A136]/50">
                  <ArrowDown className="h-4 w-4" />
                </div>
              </button>
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
            {clientLogos.map((logo) => (
              <span
                key={logo.id}
                className="font-sans text-xs font-black tracking-[0.3em] text-neutral-600 transition-colors duration-300 hover:text-[#F9A136] cursor-default whitespace-nowrap"
              >
                {logo.logoUrl ? (
                  <img src={logo.logoUrl} alt={logo.name} className="h-6 w-auto opacity-50 hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  logo.name
                )}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 animate-[marquee_25s_linear_infinite] justify-around min-w-full items-center gap-16 pr-16" aria-hidden="true">
            {clientLogos.map((logo) => (
              <span
                key={`dup-${logo.id}`}
                className="font-sans text-xs font-black tracking-[0.3em] text-neutral-600 transition-colors duration-300 hover:text-[#F9A136] cursor-default whitespace-nowrap"
              >
                {logo.logoUrl ? (
                  <img src={logo.logoUrl} alt="" className="h-6 w-auto opacity-50 transition-opacity" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  logo.name
                )}
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
            <p className="font-mono text-[13px] tracking-[0.3em] text-neutral-500 uppercase mb-4">FEATURED WORKS</p>
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
            const hasVideo = isDirectVideoUrl(proj.videoUrl);
            return (
              <article
                key={proj.id}
                onClick={() => onNavigateToProject(proj.alias)}
                className={`group cursor-pointer select-none ${isLarge ? 'md:col-span-2' : ''}`}
                id={`featured-${proj.id}`}
              >
                <div className={`relative overflow-hidden bg-neutral-950 ${
                  isLarge ? 'aspect-[2.2/1] min-h-[300px]' : 'aspect-[4/5]'
                }`}>

                  {/* Image cover with the studio-wide grayscale-to-color transition */}
                  <img
                    src={proj.heroImage}
                    alt={proj.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover transition-all duration-[1.2s] ease-out grayscale group-hover:grayscale-0 group-hover:scale-105 saturate-[0.8] brightness-90"
                  />

                  {/* Underneath hover looping video snippet */}
                  {hasVideo && (
                    <video
                      src={proj.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
                    />
                  )}

                  {/* Hover play prompt — video exhibits only, same as the Work archive */}
                  {hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9A136] text-black shadow-lg shadow-black/20 scale-95 group-hover:scale-100 transition-transform duration-500">
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Meta block — matches the Work archive exhibit treatment */}
                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">
                    {proj.category}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c]">
                    {proj.year}
                  </span>
                </div>
                <h3 className="mt-2 flex items-center justify-between gap-3 font-sans text-xl font-extralight tracking-tight text-white uppercase transition-colors duration-300 group-hover:text-[#F9A136] md:text-2xl">
                  <span>{proj.title}</span>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[#F9A136] opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                </h3>
                <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
                  {proj.client}
                </p>
              </article>
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
            the studio's core services
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
                      <span className="font-mono text-xs text-[#8c8c8c] mr-8 pt-1.5 group-hover:text-[#F9A136] transition-colors">{ser.num}</span>
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
                    <ArrowUpRight className="shrink-0 pt-1 text-[#F9A136] opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>

            {/* Live Interactive Editorial Photo Preview on side */}
            <div className="hidden items-center justify-center lg:col-span-5 lg:flex">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950 border border-white/10 p-3">
                <div className="relative w-full h-full overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={activeServiceHover ?? 'default'}
                      src={services[activeServiceHover ?? 0].image}
                      alt={activeServiceHover !== null ? 'Selected service example' : 'Studio service example'}
                      referrerPolicy="no-referrer"
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 0.85, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="absolute inset-0 h-full w-full object-cover saturate-100 brightness-90"
                    />
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/70 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — TESTIMONIALS (ANIMATED CHANGER) */}
      <section
        id="testimonials-slider-section"
        onMouseEnter={() => setIsTestimonialsHovered(true)}
        onMouseLeave={() => setIsTestimonialsHovered(false)}
        className="border-t border-white/5 bg-[#090909]/40 py-24 md:py-32 mt-12 md:mt-16"
      >
        <div className="mx-auto max-w-5xl px-6 text-center md:px-12">
          <p className="font-mono text-[11px] tracking-[0.3em] text-[#8c8c8c] uppercase mb-10">
            IN THEIR WORDS
          </p>
          
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
                    "{activeTestimonial.quote}"
                  </p>
                </blockquote>

                <div className="mt-8">
                  <p className="font-sans text-sm font-medium text-white tracking-wider uppercase">
                    {activeTestimonial.author}
                  </p>
                  <p className="font-mono text-[10px] tracking-[0.25em] text-[#8c8c8c] uppercase mt-1">
                    {activeTestimonial.role ? `${activeTestimonial.role} • ` : ''}{activeTestimonial.company}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Testimonial Switch Controls with sleek pill design */}
          <div className="mt-12 flex items-center justify-center space-x-6">
            <button
              onClick={handlePrevTestimonial}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-transparent text-[#f2f2f2] hover:border-[#F9A136] hover:bg-[#F9A136] hover:text-black transition-all duration-500"
              id="testimonial-prev-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs text-[#8c8c8c] tracking-widest">
              {String(currentTestimonial + 1).padStart(2, '0')} &mdash; {String(testimonials.length).padStart(2, '0')}
            </span>
            <button
              onClick={handleNextTestimonial}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-transparent text-[#f2f2f2] hover:border-[#F9A136] hover:bg-[#F9A136] hover:text-black transition-all duration-500"
              id="testimonial-next-button"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 6 — INSTAGRAM PRESENCE */}
      <section id="instagram-section" className="border-t border-white/5 bg-[#090909]/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6 md:px-12 text-center">
          <p className="font-mono text-[11px] tracking-[0.3em] text-[#a3a3a3] uppercase mb-4">LATEST ON SOCIAL</p>
          <h2 className="font-sans text-3xl font-extralight tracking-tight text-white uppercase">
            The work, <span className="webkit-stroke font-black opacity-80">unfiltered</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-sans text-sm font-light text-neutral-400 leading-relaxed">
            Behind the scenes, fresh drops, and campaign moments — follow the studio on Instagram.
          </p>

          {instagramEmbedUrl ? (
            <div className="mt-10 overflow-hidden rounded-lg border border-white/5 bg-[#0c0c0c]/40">
              <iframe
                src={instagramEmbedUrl}
                title="Mach10 Media on Instagram"
                loading="lazy"
                className="h-[480px] w-full border-0"
              />
            </div>
          ) : (
            <a
              href="https://www.instagram.com/mach10.et/"
              target="_blank"
              rel="noreferrer"
              className="group mt-10 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-8 py-4 font-mono text-xs tracking-widest text-white uppercase transition-all duration-500 hover:border-[#F9A136] hover:bg-[#F9A136] hover:text-black"
              id="home-instagram-cta"
            >
              <span>Instagram</span>
            </a>
          )}
        </div>
      </section>

      {/* SECTION 7 — CALL TO CONTACT ACTION */}
      <section
        id="homepage-contact-cta"
        className="relative flex min-h-[550px] items-center justify-center bg-transparent px-6 py-28 text-center"
      >
        <div className="absolute inset-0 bg-[#080808]/60 backdrop-blur-[2px] pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <p className="font-mono text-[13px] tracking-[0.3em] text-[#8c8c8c] uppercase mb-8">NEW PROJECTS</p>
          <h2 className="font-sans text-4xl font-extralight leading-none tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl lg:text-7xl mb-12 uppercase">
            let's build your{' '}
            <span className="webkit-stroke font-black opacity-80 leading-none">next project</span>
          </h2>
          
          <button
            onClick={() => onNavigate('contact')}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-transparent bg-white px-6 py-3.5 font-mono text-sm font-bold tracking-[0.22em] text-[#080808] uppercase transition-all duration-500 hover:scale-105 hover:bg-[#F9A136]"
            id="cta-bottom-booking"
          >
            <span>Retain Mach10 Media</span>
            <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <p className="mt-12 font-mono text-[10px] text-neutral-500 uppercase tracking-[0.3em]">
            ADDIS ABABA
          </p>
        </div>
      </section>

    </div>
  );
}

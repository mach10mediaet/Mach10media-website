import React, { useState } from 'react';
import { ArrowUpRight, Play, Filter, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectCategory } from '../types';
import { isDirectVideoUrl } from '../utils/video';

interface WorkViewProps {
  projects: Project[];
  onNavigateToProject: (projectAlias: string) => void;
}

export default function WorkView({ projects, onNavigateToProject }: WorkViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const categories: string[] = [
    'All',
    'Photography',
    'Branding',
    'Commercial',
    'Social Media',
    'Food Content',
    'Fashion'
  ];

  // Filtering list based on user click
  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter(proj => proj.category === selectedCategory);

  return (
    <div className="bg-transparent min-h-screen text-[#f2f2f2] pt-36 pb-24 px-6 md:px-12">
      <div className="mx-auto max-w-7xl">
        
        {/* Header Block */}
        <div className="mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center space-x-2.5 mb-4 text-[#a3a3a3] font-mono text-[12px] tracking-[0.3em] uppercase">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>THE ARCHIVAL COMPENDIUM</span>
          </div>
          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl uppercase">
            selected <span className="webkit-stroke font-black opacity-80 leading-none">exhibits</span>
          </h1>
          <p className="mt-4 max-w-xl font-sans text-xs sm:text-[16px] font-light text-neutral-400 leading-relaxed">
            A meticulous sensory index of commercial campaigns, photographic prints, brand ecosystems, and micro-cinema productions.
          </p>
        </div>

        {/* Categories Filtering System */}
        <div className="mb-16">
          <div className="flex items-center space-x-2.5 mb-6 text-neutral-500 font-mono text-[13px] tracking-[0.2em] uppercase">
            <Filter className="h-3.5 w-3.5" />
            <span>Filter by Practice</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`border rounded-full px-5 py-2.5 font-mono text-[12px] tracking-widest uppercase transition-all duration-500 ${
                  selectedCategory === cat
                    ? 'bg-[#F9A136] text-black border-[#F9A136] scale-105 shadow-md shadow-[#F9A136]/10'
                    : 'bg-transparent border-white/15 text-neutral-400 hover:border-[#F9A136] hover:text-[#F9A136]'
                }`}
                id={`filter-button-${cat.toLowerCase().replace(' ', '-')}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Project Exhibit Grid */}
        <AnimatePresence mode="popLayout">
          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0c0c0c]/50 p-16 text-center text-neutral-500"
            >
              <AlertCircle className="h-8 w-8 text-neutral-600 mb-4" />
              <p className="font-sans text-sm font-light text-neutral-300">No published portfolio records are live yet.</p>
              <p className="font-mono text-[10px] text-[#8c8c8c] mt-2 uppercase tracking-widest">Publish projects from studio admin</p>
            </motion.div>
          ) : filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0c0c0c]/50 p-16 text-center text-neutral-500"
            >
              <AlertCircle className="h-8 w-8 text-neutral-600 mb-4" />
              <p className="font-sans text-sm font-light text-neutral-300">No live exhibits match this filter yet.</p>
              <p className="font-mono text-[10px] text-[#8c8c8c] mt-2 uppercase tracking-widest">Try another practice</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12"
            >
              {filteredProjects.map((proj) => (
                <motion.div
                  key={proj.id}
                  layoutId={proj.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => onNavigateToProject(proj.alias)}
                  className="group cursor-pointer select-none border border-white/5 hover:border-white/15 bg-[#0c0c0c]/50 p-4 transition-all duration-700 ease-out"
                  id={`work-card-${proj.id}`}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-950">
                    
                    {/* Thumbnail banner image with sleek grayscale transition */}
                    <img
                      src={proj.heroImage}
                      alt={proj.title}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 h-full w-full object-cover transition-all duration-[1.2s] ease-out grayscale group-hover:grayscale-0 group-hover:scale-105 saturate-[0.8] brightness-90 animate-fade-in"
                    />

                    {/* Interactive video trailer on hover */}
                    {isDirectVideoUrl(proj.videoUrl) && (
                      <video
                        src={proj.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

                    {/* Hover focus play prompt */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9A136] text-black shadow-lg shadow-black/20 scale-95 group-hover:scale-100 transition-transform duration-500">
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </div>
                    </div>

                    {/* Category overlay tags */}
                    <div className="absolute top-5 left-5">
                      <span className="bg-[#080808]/80 text-[#f2f2f2] border border-white/10 rounded-full px-3 py-1 font-mono text-[10px] tracking-widest uppercase backdrop-blur-md group-hover:border-[#F9A136]/30">
                        {proj.category}
                      </span>
                    </div>

                    <div className="absolute top-5 right-5">
                      <span className="bg-white/15 px-2.5 py-1 rounded-full font-mono text-[10px] text-white/60 backdrop-blur-md">
                        {proj.year}
                      </span>
                    </div>

                    {/* Meta Detail Block */}
                    <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                      <div>
                        <p className="font-mono text-[12px] tracking-[0.2em] text-neutral-400 uppercase mb-1">
                          {proj.client}
                        </p>
                        <h3 className="font-sans text-xl font-normal tracking-tight text-white uppercase group-hover:text-[#F9A136] transition-colors duration-500">
                          {proj.title}
                        </h3>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white transition-all group-hover:bg-[#F9A136] group-hover:text-black group-hover:border-[#F9A136] hover:scale-105">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </div>
                    </div>

                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

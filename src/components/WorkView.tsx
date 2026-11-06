import { useState } from 'react';
import { ArrowUpRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';
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

        {/* Page header — studio-wide hero pattern */}
        <div className="mb-16 border-b border-white/5 pb-10">
          <p className="mb-4 text-[#a3a3a3] font-mono text-[12px] tracking-[0.3em] uppercase">
            THE WORK ARCHIVE
          </p>
          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl uppercase">
            selected <span className="webkit-stroke font-black opacity-80 leading-none">exhibits</span>
          </h1>
          <p className="mt-4 max-w-xl font-sans text-xs sm:text-[16px] font-light text-neutral-400 leading-relaxed">
            Selected campaigns, photo shoots, brand systems, and film work from our archive.
          </p>
        </div>

        {/* Practice filter — plain text row, amber marks the active filter */}
        <div className="mb-14">
          <div className="mb-5 flex items-baseline justify-between">
            <span className="font-mono text-[10px] tracking-[0.22em] text-neutral-500 uppercase">
              Filter by Practice
            </span>
            <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">
              {String(filteredProjects.length).padStart(2, '0')} Projects
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  data-selected={isActive}
                  className={`vf-mark rounded-sm px-3 py-2 font-mono text-[12px] tracking-[0.18em] uppercase transition-colors duration-300 cursor-pointer ${
                    isActive ? 'text-[#F9A136]' : 'text-neutral-200 hover:text-white'
                  }`}
                  id={`filter-button-${cat.toLowerCase().replace(' ', '-')}`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Project index grid — imagery edge-to-edge, meta in quiet text lines below */}
        <AnimatePresence mode="popLayout">
          {projects.length === 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[320px] flex-col items-center justify-center text-center text-neutral-500"
            >
              <p className="font-sans text-sm font-light text-neutral-300">No projects published yet.</p>
              <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-[#8c8c8c] uppercase">Publish projects from studio admin</p>
            </motion.div>
          ) : filteredProjects.length === 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[300px] flex-col items-center justify-center text-center text-neutral-500"
            >
              <p className="font-sans text-sm font-light text-neutral-300">No projects in this practice yet.</p>
              <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-[#8c8c8c] uppercase">Try another filter</p>
            </motion.div>
          ) : (
            <motion.div
              layout
              className="grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredProjects.map((proj) => (
                <motion.article
                  key={proj.id}
                  layoutId={proj.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => onNavigateToProject(proj.alias)}
                  className="group cursor-pointer select-none"
                  id={`work-card-${proj.id}`}
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-950">

                    {/* Thumbnail with sleek grayscale transition */}
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

                    {/* Hover play prompt — video items only */}
                    {isDirectVideoUrl(proj.videoUrl) && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F9A136] text-black shadow-lg shadow-black/20 scale-95 group-hover:scale-100 transition-transform duration-500">
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meta block — plain lines under the image */}
                  <div className="mt-5 flex items-baseline justify-between gap-4">
                    <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">
                      {proj.category}
                    </span>
                    <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c]">
                      {proj.year}
                    </span>
                  </div>
                  <h3 className="mt-2 flex items-center justify-between gap-3 font-sans text-lg font-extralight tracking-tight text-white uppercase transition-colors duration-300 group-hover:text-[#F9A136] sm:text-xl">
                    <span>{proj.title}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[#F9A136] opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden="true" />
                  </h3>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
                    {proj.client}
                  </p>
                </motion.article>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

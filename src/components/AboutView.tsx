import React from 'react';
import { Sparkles, Award, Heart, Shield } from 'lucide-react';
import besuImage from '../assets/besufekad-bekele.webp';
import yosephImage from '../assets/yoseph-habte.jpeg';
import dagmawiImage from '../assets/dagmawi-mekonen.webp';
import ideaImage from '../assets/idea.jpeg';

export default function AboutView() {
  const coreValues = [
    {
      icon: <Award className="h-7 w-7 text-neutral-400" />,
      title: 'Visual Rigor',
      desc: 'We enforce absolute devotion to negative space, precise margins, perfect typography tracking, and balanced chiaroscuro framing.'
    },
    {
      icon: <Heart className="h-7 w-7 text-neutral-400" />,
      title: 'Kinetic Empathy',
      desc: 'Every transition, slow-motion cut, and scrolling animation exists exclusively to direct focus and respect sensory cognitive load.'
    },
    {
      icon: <Shield className="h-7 w-7 text-neutral-400" />,
      title: 'Narrative Integrity',
      desc: 'We refuse typical standard design templates and AI-generated shortcuts. Every digital asset carries human deliberate placement.'
    }
  ];

const teamMembers = [
    {
        name: 'Besufekad Bekele',
        role: 'Director of Photography',
        specialty: 'Cinematography, Visual Storytelling',
        image: besuImage
    },
    {
        name: 'Yoseph Habte',
        role: 'Managing Director',
        specialty: 'Business Operations & Client Management',
        image: yosephImage
    },
    {
        name: 'Dagmawi Mekonnen',
        role: 'Creative Director',
        specialty: 'Creative Writing,Photography',
        image: dagmawiImage
    }
];

  return (
    <div className="bg-transparent min-h-screen text-[#f2f2f2] pt-36 pb-24 px-6 md:px-12">
      <div className="mx-auto max-w-7xl">
        
        {/* Header Block */}
        <div className="mb-20 border-b border-white/5 pb-10">
          <div className="flex items-center space-x-2 mb-4 text-[#737373] font-mono text-[14px] tracking-[0.3em] uppercase">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>THE CREATIVE COVENANT</span>
          </div>
          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl max-w-4xl uppercase">
            silent <span className="webkit-stroke font-black opacity-80 leading-none">excellence</span>, loud <span className="font-semibold text-white">impact</span>.
          </h1>
        </div>

        {/* SECTION 1 - DIALOG STORY */}
        <section className="grid gap-12 lg:grid-cols-12 lg:gap-20 mb-28">
          <div className="lg:col-span-4 flex items-center justify-start">
            <div className="relative aspect-[3/4] w-full max-w-sm overflow-hidden bg-neutral-950 border border-white/10 p-3 bg-gradient-to-br from-neutral-900 to-black">
              <div className="w-full h-full overflow-hidden relative">
                <img 
                  src={ideaImage}
                  alt="Mach10 Media concept still"
                  className="h-full w-full scale-110 object-cover grayscale opacity-70 transition-transform duration-1000 hover:scale-[1.2]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080808]/85 via-transparent to-transparent" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col justify-center">
            <p className="font-mono text-[16px] tracking-[0.3em] text-[#737373] uppercase mb-4">FOUNDING MANIFESTO</p>
            <p className="font-sans text-lg font-light leading-relaxed text-neutral-300">
              Mach10 Media is a digital creative team based in Addis Ababa. We help businesses create content, visuals, and digital campaigns that feel clear, intentional, and true to their brand.

We work across social media, photography, video, branding, and digital strategy. Instead of using the same formula for every client, we take time to understand the business, the audience, and the message behind the work.

We’re a close-knit creative team that cares deeply about quality, consistency, and creating work that helps brands connect with people in a real way.
            </p>
            <p className="mt-6 font-sans text-base font-light leading-relaxed text-[#737373]">
              Whether capturing midnight runs with a local run club, documenting burgers served in motion beside airport gates, or framing active construction sites as they evolve in real time, our methodology remains unchanged: begin in negative space, isolate the core emotional variable, and render it with precise visual clarity.
            </p>
          </div>
        </section>

        {/* SECTION 2 - PHILOSOPHY PILLARS */}
        <section className="mb-28 border-y border-white/5 py-24 bg-[#0c0c0c]/20">
          <p className="font-mono text-[15px] tracking-[0.3em] text-[#737373] uppercase mb-16 text-center">THE ETHICAL BLUEPRINT</p>
          <div className="grid gap-8 sm:grid-cols-3 px-4 md:px-8">
            {coreValues.map((val, i) => (
              <div key={i} className="flex flex-col items-center sm:items-start text-center sm:text-left border border-white/5 bg-[#0a0a0a]/40 p-6 md:p-8 hover:border-white/10 transition-colors duration-500">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#121212] border border-white/10">
                  {val.icon}
                </div>
                <h3 className="font-sans text-2xl font-[500] text-white mb-3 uppercase tracking-tight">
                  {val.title}
                </h3>
                <p className="font-sans text-base font-light text-[#8c8c8c] leading-relaxed">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3 - THE DIRECTOR PANELS */}
        <section className="mb-28">
          <p className="font-mono text-[15px] tracking-[0.3em] text-[#737373] uppercase mb-12">STUDIO ARCHITECTS</p>
          <div className="grid gap-10 sm:grid-cols-3">
            {teamMembers.map((member, i) => (
              <div key={i} className="group overflow-hidden border border-white/5 bg-[#0c0c0c]/30 p-3 hover:border-white/10 transition-all duration-700">
                <div className="relative aspect-[3/4] overflow-hidden bg-neutral-950 mb-5">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover grayscale transition-all duration-[1s] group-hover:scale-105 group-hover:grayscale-0 saturate-50 brightness-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
                </div>
                <h4 className="font-sans text-lg font-[500] text-white uppercase tracking-tight">{member.name}</h4>
                <p className="font-mono text-[14px] tracking-widest text-[#737373] uppercase mt-1">{member.role}</p>
                <div className="h-px bg-white/5 my-3" />
                <p className="font-sans text-base text-neutral-400 font-light leading-relaxed">{member.specialty}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

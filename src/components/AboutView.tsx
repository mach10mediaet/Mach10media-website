import besuImage from '../assets/besufekad-bekele.webp';
import yosephImage from '../assets/yoseph-habte.webp';
import dagmawiImage from '../assets/dagmawi-mekonen.webp';
import ideaImage from '../assets/idea.webp';

const coreValues = [
  {
    title: 'Visual Rigor',
    desc: 'Spacing, margins, typography, and framing get obsessive attention — the details that make work feel considered.'
  },
  {
    title: 'Kinetic Empathy',
    desc: 'Motion exists to guide attention, never to decorate. Every transition and every cut has a job to do.'
  },
  {
    title: 'Narrative Integrity',
    desc: 'No templates and no AI-generated shortcuts — every asset is planned and placed by hand.'
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
    specialty: 'Creative Writing, Photography',
    image: dagmawiImage
  }
];

export default function AboutView() {
  return (
    <div className="bg-transparent min-h-screen text-[#f2f2f2] pt-36 pb-24 px-6 md:px-12">
      <div className="mx-auto max-w-7xl">

        {/* Page header — studio-wide hero pattern */}
        <div className="mb-16 border-b border-white/5 pb-10">
          <p className="mb-4 text-[#a3a3a3] font-mono text-[12px] tracking-[0.3em] uppercase">
            THE STUDIO
          </p>
          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl max-w-4xl uppercase">
            silent <span className="webkit-stroke font-black opacity-80 leading-none">excellence</span>, loud <span className="font-semibold text-white">impact</span>.
          </h1>
          <p className="mt-4 max-w-xl font-sans text-xs sm:text-[16px] font-light text-neutral-400 leading-relaxed">
            A close-knit creative team from Addis Ababa — who we are, what we believe, and the people behind the work.
          </p>
        </div>

        {/* 01 — Who We Are */}
        <section className="mb-20">
          <div className="mb-10 flex items-baseline justify-between border-t border-white/[0.07] pt-5">
            <span className="font-mono text-[10px] tracking-[0.24em] text-[#F9A136]">01</span>
            <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">
              Who We Are
            </span>
          </div>

          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="group relative aspect-[3/4] w-full max-w-sm overflow-hidden bg-neutral-950">
                <img
                  src={ideaImage}
                  alt="Mach10 Media concept still"
                  className="h-full w-full object-cover grayscale saturate-[0.8] brightness-90 transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center lg:col-span-8">
              <p className="font-sans text-base font-light leading-relaxed text-neutral-300 sm:text-lg">
                Mach10 Media is a digital creative team based in Addis Ababa. We help businesses create content, visuals, and digital campaigns that feel clear, intentional, and true to their brand.
              </p>
              <p className="mt-5 font-sans text-sm font-light leading-relaxed text-neutral-400 sm:text-base">
                We work across social media, photography, video, branding, and digital strategy. Instead of using the same formula for every client, we take time to understand the business, the audience, and the message behind the work.
              </p>
              <p className="mt-5 font-sans text-sm font-light leading-relaxed text-neutral-400 sm:text-base">
                We are a close-knit team that cares deeply about quality, consistency, and creating work that helps brands connect with people in a real way.
              </p>
              <p className="mt-5 font-sans text-sm font-light leading-relaxed text-neutral-400 sm:text-base">
                From run clubs to restaurants to construction sites, the approach stays the same: understand the subject first, then present it with honest, precise visuals.
              </p>
            </div>
          </div>
        </section>

        {/* 02 — What We Believe */}
        <section className="mb-20">
          <div className="mb-10 flex items-baseline justify-between border-t border-white/[0.07] pt-5">
            <span className="font-mono text-[10px] tracking-[0.24em] text-[#F9A136]">02</span>
            <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">
              What We Believe
            </span>
          </div>

          <div className="grid gap-x-10 gap-y-10 sm:grid-cols-3">
            {coreValues.map((val) => (
              <div key={val.title} className="border-t border-white/[0.07] pt-5">
                <h3 className="font-sans text-lg font-extralight tracking-tight text-white uppercase sm:text-xl">
                  {val.title}
                </h3>
                <p className="mt-3 font-sans text-sm font-light leading-relaxed text-neutral-400">
                  {val.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 03 — The Team */}
        <section>
          <div className="mb-10 flex items-baseline justify-between border-t border-white/[0.07] pt-5">
            <span className="font-mono text-[10px] tracking-[0.24em] text-[#F9A136]">03</span>
            <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">
              The Team
            </span>
          </div>

          <div className="grid gap-x-10 gap-y-14 sm:grid-cols-3">
            {teamMembers.map((member) => (
              <div key={member.name} className="group cursor-default select-none">
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-950">
                  <img
                    src={member.image}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover grayscale transition-all duration-[1s] group-hover:scale-105 group-hover:grayscale-0 saturate-[0.8] brightness-90"
                  />
                </div>
                <h4 className="mt-4 font-sans text-lg font-extralight tracking-tight text-white uppercase">
                  {member.name}
                </h4>
                <p className="mt-1 font-mono text-[10px] tracking-[0.2em] text-[#8c8c8c] uppercase">
                  {member.role}
                </p>
                <p className="mt-2 font-sans text-sm font-light leading-relaxed text-neutral-400">
                  {member.specialty}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

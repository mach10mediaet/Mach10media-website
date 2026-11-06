import { ArrowUpRight } from 'lucide-react';
import { SERVICE_PACKAGES, ServicePackage } from '../data/servicePackages';

interface ServicesViewProps {
  onNavigateToContact: (practice?: string) => void;
}

// Maps each package onto the matching inquiry-form practice so the form opens pre-selected.
const PACKAGE_PRACTICE: Record<ServicePackage['key'], string> = {
  'video-production': 'Commercial Film',
  photoshoot: 'Fashion Photography',
  'content-retainer': 'Social Strategy',
  'campaign-package': 'Full Campaign Orchestration'
};

const processSteps = [
  {
    step: '01',
    title: 'Discovery',
    detail: 'We learn your goals, timeline, and what kind of assets you need.'
  },
  {
    step: '02',
    title: 'Planning',
    detail: 'We shape the creative direction and production plan.'
  },
  {
    step: '03',
    title: 'Production',
    detail: 'We shoot, direct, edit, and refine the work.'
  },
  {
    step: '04',
    title: 'Delivery',
    detail: 'You receive finished assets ready for launch and content use.'
  }
];

export default function ServicesView({ onNavigateToContact }: ServicesViewProps) {
  return (
    <div className="bg-transparent min-h-screen text-[#f2f2f2] pt-36 pb-24 px-6 md:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Page header — studio-wide hero pattern, plain text */}
        <div className="mb-16 border-b border-white/5 pb-10">
          <p className="mb-4 text-[#a3a3a3] font-mono text-[12px] tracking-[0.3em] uppercase">
            THE SERVICE LEDGER
          </p>
          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl max-w-4xl uppercase">
            clear service paths for{' '}
            <span className="webkit-stroke font-black opacity-80 leading-none">modern brands</span>
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-xs sm:text-[16px] font-light text-neutral-400 leading-relaxed">
            A simple breakdown of what we offer, what each package includes, and how each path can support your brand.
          </p>
        </div>

        {/* Service packages — editorial index: hairline top rule, number, plain text, quiet CTA */}
        <section className="mb-20 grid gap-x-12 gap-y-14 lg:grid-cols-2">
          {SERVICE_PACKAGES.map((service, index) => (
            <article key={service.key} className="flex flex-col border-t border-white/[0.07] pt-7">
              <div className="flex items-baseline justify-between gap-6">
                <span className="font-mono text-[10px] tracking-[0.24em] text-[#F9A136]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-mono text-[10px] tracking-[0.22em] text-[#8c8c8c] uppercase">
                  {service.eyebrow}
                </span>
              </div>

              <h2 className="mt-3 font-sans text-2xl font-extralight tracking-tight text-white uppercase sm:text-3xl">
                {service.title}
              </h2>
              <p className="mt-3 max-w-xl font-sans text-sm font-light leading-relaxed text-neutral-300">
                {service.summary}
              </p>

              <div className="mt-8">
                <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
                  Included
                </p>
                <ul className="space-y-2">
                  {service.deliverables.map((item) => (
                    <li key={item} className="font-sans text-sm font-light text-neutral-400">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-neutral-500 uppercase">
                  Best For
                </p>
                <p className="max-w-xl font-sans text-sm font-light leading-relaxed text-neutral-400">
                  {service.fit}
                </p>
              </div>

              <div className="mt-auto pt-8">
                <button
                  onClick={() => onNavigateToContact(PACKAGE_PRACTICE[service.key])}
                  className="group inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-white uppercase transition-colors duration-300 hover:text-[#F9A136] cursor-pointer"
                  id={`package-inquiry-${service.key}`}
                >
                  <span>Start This Project</span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </article>
          ))}
        </section>

        {/* Process — plain columns on a hairline band */}
        <section className="mb-20 border-y border-white/5 py-16">
          <div className="mb-10">
            <p className="mb-3 font-mono text-[12px] tracking-[0.3em] text-[#a3a3a3] uppercase">
              HOW WE WORK
            </p>
            <h3 className="font-sans text-2xl font-extralight tracking-tight text-white uppercase sm:text-3xl">
              a simple process
            </h3>
          </div>

          <div className="grid gap-x-10 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((item) => (
              <div key={item.step} className="border-t border-white/[0.07] pt-5">
                <p className="mb-3 font-mono text-[10px] tracking-[0.22em] text-[#F9A136]">
                  {item.step}
                </p>
                <h4 className="font-sans text-lg font-extralight tracking-tight text-white uppercase">
                  {item.title}
                </h4>
                <p className="mt-3 font-sans text-sm font-light leading-relaxed text-neutral-400">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Closing inquiry nudge */}
        <section className="border-t border-white/5 pt-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 font-mono text-[10px] tracking-[0.22em] text-[#F9A136] uppercase">
                Need help choosing?
              </p>
              <h3 className="font-sans text-2xl font-extralight tracking-tight text-white uppercase sm:text-3xl">
                We can recommend the right package
              </h3>
              <p className="mt-4 font-sans text-sm font-light leading-relaxed text-neutral-400">
                If you are unsure what fits your project, send an inquiry and we will guide you toward the best option.
              </p>
            </div>

            <button
              onClick={() => onNavigateToContact()}
              className="group inline-flex shrink-0 items-center justify-center rounded-full bg-white px-7 py-3.5 font-mono text-[11px] tracking-[0.16em] text-black uppercase transition-all duration-500 hover:scale-[1.03] hover:bg-[#F9A136] cursor-pointer"
            >
              <span>Start Your Inquiry</span>
              <ArrowUpRight
                className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden="true"
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

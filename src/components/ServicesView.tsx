import { ArrowUpRight, Sparkles, Clapperboard, Camera, Layers3, Rocket } from 'lucide-react';
import { SERVICE_PACKAGES } from '../data/servicePackages';

interface ServicesViewProps {
  onNavigate: (view: 'contact') => void;
}

const packageIcons = {
  'video-production': Clapperboard,
  photoshoot: Camera,
  'content-retainer': Layers3,
  'campaign-package': Rocket
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

export default function ServicesView({ onNavigate }: ServicesViewProps) {
  return (
    <div className="bg-transparent min-h-screen text-[#f2f2f2] pt-36 pb-24 px-6 md:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 border-b border-white/5 pb-10">
          <div className="flex items-center space-x-2.5 mb-4 text-[#737373] font-mono text-[12px] tracking-[0.3em] uppercase">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>THE SERVICE LEDGER</span>
          </div>
          <h1 className="font-sans text-4xl font-extralight tracking-tighter text-[#f2f2f2] sm:text-5xl md:text-6xl max-w-5xl uppercase">
            clear <span className="webkit-stroke font-black opacity-80 leading-none">service paths</span> for modern brands
          </h1>
          <p className="mt-4 max-w-2xl font-sans text-xs sm:text-[16px] font-light text-neutral-400 leading-relaxed">
            A simple breakdown of what we offer, what each package includes, and how each path can support your brand.
          </p>
        </div>

        <section className="mb-20 grid gap-8 lg:grid-cols-2">
          {SERVICE_PACKAGES.map((service) => {
            const Icon = packageIcons[service.key];

            return (
              <div
                key={service.title}
                className="group rounded-2xl border border-white/5 bg-[#0c0c0c]/50 p-5 sm:p-6 transition-all duration-500 hover:border-white/15"
              >
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-3 font-mono text-[10px] tracking-[0.2em] text-[#737373] uppercase">
                      {service.eyebrow}
                    </p>
                    <h2 className="font-sans text-2xl font-light tracking-tight text-white uppercase sm:text-3xl">
                      {service.title}
                    </h2>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[#F9A136]">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>

                <p className="font-sans text-sm font-light leading-relaxed text-neutral-300">
                  {service.summary}
                </p>

                <div className="mt-6 border-t border-white/6 pt-5">
                  <p className="mb-4 font-mono text-[10px] tracking-[0.18em] text-neutral-500 uppercase">Included</p>
                  <div className="grid gap-3">
                    {service.deliverables.map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[#F9A136]/30 bg-[#F9A136]/10">
                          <span className="h-1.5 w-1.5 rotate-45 bg-[#F9A136]" />
                        </span>
                        <span className="font-sans text-sm font-light text-neutral-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-white/6 pt-5">
                  <p className="mb-3 font-mono text-[10px] tracking-[0.18em] text-neutral-500 uppercase">Best For</p>
                  <p className="font-sans text-sm font-light leading-relaxed text-neutral-400">
                    {service.fit}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="mb-20 border-y border-white/5 py-20 bg-[#0c0c0c]/20">
          <div className="mb-10">
            <p className="font-mono text-[12px] tracking-[0.3em] text-[#737373] uppercase mb-4">HOW WE WORK</p>
            <h3 className="font-sans text-3xl font-light tracking-tight text-white uppercase">
              a simple process
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((item) => (
              <div key={item.step} className="rounded-2xl border border-white/5 bg-[#0a0a0a]/40 p-6 hover:border-white/10 transition-colors duration-500">
                <p className="mb-3 font-mono text-[10px] tracking-[0.22em] text-[#F9A136] uppercase">{item.step}</p>
                <h4 className="font-sans text-lg font-light tracking-tight text-white uppercase">{item.title}</h4>
                <p className="mt-3 font-sans text-sm font-light leading-relaxed text-neutral-400">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/5 pt-12">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 font-mono text-[10px] tracking-[0.22em] text-[#F9A136] uppercase">Need help choosing?</p>
              <h3 className="font-sans text-3xl font-light tracking-tight text-white uppercase">
                We can recommend the right package
              </h3>
              <p className="mt-4 font-sans text-sm font-light leading-relaxed text-neutral-400">
                If you are unsure what fits your project, send an inquiry and we will guide you toward the best option.
              </p>
            </div>

            <button
              onClick={() => onNavigate('contact')}
              className="group inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 font-mono text-[11px] tracking-[0.16em] text-black uppercase transition-all duration-500 hover:scale-[1.03] hover:bg-[#F9A136]"
            >
              <span>Start Your Inquiry</span>
              <ArrowUpRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

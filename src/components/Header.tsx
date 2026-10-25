import { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { ActiveView } from '../types';
// 1. Import your logo image here (adjust the path if necessary)
import logoImg from '../assets/logo.png'; 

interface HeaderProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
}

export default function Header({ activeView, onNavigate }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { label: string; view: ActiveView }[] = [
    { label: 'Home', view: 'home' },
    { label: 'Work', view: 'work' },
    { label: 'Services', view: 'services' },
    { label: 'Rates', view: 'calculator' },
    { label: 'About', view: 'about' },
    { label: 'Contact', view: 'contact' },
  ];

  const handleNavItemClick = (view: ActiveView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <>
      <header
        id="app-main-header"
        className={`fixed top-0 left-0 z-40 w-full transition-all duration-700 ${
          scrolled
            ? 'border-b border-white/5 bg-[#080808]/85 py-4 backdrop-blur-xl'
            : 'bg-transparent py-9'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-12">
          
          {/* Logo Updated with img tag */}
          <button
            onClick={() => handleNavItemClick('home')}
            className="group flex items-center text-left"
            id="header-logo-button"
          >
            <img 
              src={logoImg} 
              alt="MACH10 MEDIA Logo" 
              className="h-8 w-auto object-contain transition-transform duration-500 group-hover:scale-120" 
            />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center space-x-9 lg:flex">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => handleNavItemClick(item.view)}
                className={`relative py-1 font-mono text-[14px] tracking-[0.22em] uppercase transition-colors duration-500 hover:text-[#F9A136] ${
                  activeView === item.view || (item.view === 'admin' && activeView === 'upload')
                    ? 'text-white' 
                    : 'text-[#8c8c8c]'
                }`}
              >
                {item.label}
                {(activeView === item.view || (item.view === 'admin' && activeView === 'upload')) && (
                  <span className="absolute bottom-0 left-0 h-[1.5px] w-full bg-[#F9A136] origin-left animate-[scale-x_0.35s_ease-out]" />
                )}
              </button>
            ))}
          </nav>

          {/* Call-to-Action */}
          <div className="hidden lg:block">
            <button
              onClick={() => handleNavItemClick('contact')}
              className="group relative flex items-center overflow-hidden border border-white/20 rounded-full bg-white/5 px-6 py-2.5 font-mono text-[10px] tracking-widest text-[#f2f2f2] uppercase transition-all duration-500 hover:bg-[#F9A136] hover:text-[#0a0a0a] hover:border-[#F9A136] hover:scale-[1.03]"
              id="header-cta-button"
            >
              <span className="mr-2">Inquire Project</span>
              <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center border border-white/5 bg-[#121212]/80 text-white hover:border-[#F9A136]/50 hover:text-[#F9A136] lg:hidden transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            id="mobile-drawer-toggle"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Editorial slide-in list) */}
      <div
        id="mobile-nav-drawer"
        className={`fixed inset-0 z-30 flex flex-col bg-[#050505] p-8 pt-32 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex flex-col space-y-8 font-sans">
          {navItems.map((item, index) => (
            <button
              key={item.view}
              onClick={() => handleNavItemClick(item.view)}
              className="group flex items-baseline text-left"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <span className="font-mono text-xs text-[#8c8c8c] mr-4 group-hover:text-[#F9A136] transition-colors">0{index + 1}</span>
              <span
                className={`text-3xl font-extralight tracking-wide lowercase transition-transform duration-300 group-hover:translate-x-2 group-hover:text-[#F9A136] ${
                  activeView === item.view ? 'text-[#F9A136] font-[400]' : 'text-[#a3a3a3]'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto border-t border-white/5 pt-8 font-mono">
          <p className="text-[10px] tracking-widest text-[#8c8c8c] uppercase mb-4">REPRESENTATION</p>
          <p className="text-xs text-white">ADDIS ABABA &bull; EAST AFRICA</p>
          <p className="mt-2 text-[10px] text-neutral-400">mach10media.et@gmail.com</p>
        </div>
      </div>
    </>
  );
}

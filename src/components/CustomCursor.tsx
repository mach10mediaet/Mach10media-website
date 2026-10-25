import { useEffect, useState, useRef } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hidden, setHidden] = useState(true);
  const [clicked, setClicked] = useState(false);
  const [linkHovered, setLinkHovered] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [isMobile, setIsMobile] = useState(true);

  const delayX = useRef(0);
  const delayY = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    // Quick device detection to avoid laggy desktop styling on mobile
    const checkDevice = () => {
      const mobile = window.matchMedia('(max-width: 1024px)').matches || ('ontouchstart' in window);
      setIsMobile(mobile);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setHidden(false);
    };

    const onMouseLeave = () => setHidden(true);
    const onMouseEnter = () => setHidden(false);
    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);

    if (!isMobile) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseleave', onMouseLeave);
      document.addEventListener('mouseenter', onMouseEnter);
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mouseup', onMouseUp);

      // Handle custom link dynamic hovering triggers
      const handleMouseOver = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const interactive = target.closest('a, button, [role="button"], .interactive-cursor');
        if (interactive) {
          setLinkHovered(true);
          const customText = interactive.getAttribute('data-cursor-text');
          if (customText) {
            setCursorText(customText);
          }
        } else {
          setLinkHovered(false);
          setCursorText('');
        }
      };

      document.addEventListener('mouseover', handleMouseOver);

      return () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseleave', onMouseLeave);
        document.removeEventListener('mouseenter', onMouseEnter);
        document.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mouseup', onMouseUp);
        document.removeEventListener('mouseover', handleMouseOver);
        window.removeEventListener('resize', checkDevice);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
      };
    }
  }, [isMobile]);

  // Smooth trailing effect using requestAnimationFrame
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMobile) return;

    const animateCursor = () => {
      // Interpolate coordinates for the lazy smooth trail
      delayX.current += (position.x - delayX.current) * 0.15;
      delayY.current += (position.y - delayY.current) * 0.15;

      if (trailRef.current) {
        trailRef.current.style.transform = `translate3d(${delayX.current}px, ${delayY.current}px, 0)`;
      }
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
      }

      requestRef.current = requestAnimationFrame(animateCursor);
    };

    requestRef.current = requestAnimationFrame(animateCursor);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [position, isMobile]);

  if (isMobile || hidden) return null;

  return (
    <>
      {/* Target center dot */}
      <div
        ref={cursorRef}
        id="custom-cursor-dot"
        className="pointer-events-none fixed top-0 left-0 z-50 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white mix-blend-difference transition-transform duration-100"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${clicked ? 0.6 : 1})`
        }}
      />
      {/* Sleek outer trailing ring */}
      <div
        ref={trailRef}
        id="custom-cursor-trail"
        className={`pointer-events-none fixed top-0 left-0 z-50 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-transparent text-[8px] font-mono tracking-widest text-white uppercase transition-all duration-300 ease-out ${
          linkHovered 
            ? 'h-14 w-14 border-white/60 bg-white/10 mix-blend-normal' 
            : 'h-8 w-8'
        }`}
        style={{
          boxShadow: linkHovered ? '0 0 15px rgba(255, 255, 255, 0.15)' : 'none'
        }}
      >
        {cursorText && (
          <span className="animate-fade-in text-[7px] font-bold text-white tracking-widest leading-none">
            {cursorText}
          </span>
        )}
      </div>
    </>
  );
}

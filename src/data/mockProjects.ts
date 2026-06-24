import { Project } from '../types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'CHRONOS III',
    alias: 'chronos-iii',
    client: 'Chronos Swiss Haute Horlogerie',
    category: 'Branding',
    tagline: 'Sculpting time with minimalist Swiss engineering.',
    description: 'A global campaign positioning the Chronos III timepiece as an object of high artistic value rather than a mere utility. Inspired by brutalist Swiss architecture and extreme negative space, we developed an entire design language built on shadows, concrete-grey monoliths, and silent cinematic frames.',
    heroImage: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=90&w=2000',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mechanical-watch-mechanism-close-up-vibe-40342-large.mp4',
    fullVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mechanical-watch-mechanism-close-up-vibe-40342-large.mp4',
    year: '2025',
    campaignDetails: 'Designed a completely new typography system and visual brand guidelines spanning television, digital lookbooks, luxury architectural boutiques, and high-fashion print media across Geneva, Paris, and Tokyo. The result is a timeless, silent brand presence that speaks exclusively to connoisseurs.',
    stats: [
      { label: 'Waitlist Growth', value: '+340%' },
      { label: 'Global Reach', value: '42M' },
      { label: 'Brand Sentiment', value: '98%' }
    ],
    credits: [
      { role: 'Creative Director', name: 'Sebastian Thorne' },
      { role: 'Director of Photography', name: 'Elena Rostova' },
      { role: 'Lead Designer', name: 'Yuki Sato' },
      { role: 'Executive Producer', name: 'Julian Vance' }
    ],
    gallery: [
      { id: 'g1', type: 'image', url: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=90&w=1200', caption: 'Monolithic steel structure detailing' },
      { id: 'g2', type: 'image', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&q=90&w=1200', caption: 'The delicate geometry of our signature bezel' },
      { id: 'g3', type: 'image', url: 'https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?auto=format&fit=crop&q=90&w=1200', caption: 'Minimalist studio presentation framework' }
    ],
    publishState: 'published',
    featured: true,
    archived: false,
    socialLinks: {
      instagram: 'https://instagram.com',
      website: 'https://chronos.watch'
    }
  },
  {
    id: 'proj-2',
    title: 'L\'OBSIDIENNE',
    alias: 'lobsidienne',
    client: 'Maison Noir Fashion House',
    category: 'Fashion',
    tagline: 'Sartorial poetry carved purely in deep shadows.',
    description: 'An editorial exploration of high fashion, textiles, and skin under cinematic, single-source lighting. "L\'Obsidienne" strips away color and background distraction, forcing the viewer to contemplate the tactile qualities of drape, silk, leather, and silhouette.',
    heroImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=90&w=2000',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-in-a-black-jacket-posing-elegantly-42289-large.mp4',
    fullVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-in-a-black-jacket-posing-elegantly-42289-large.mp4',
    year: '2026',
    campaignDetails: 'Developed as a high-concept fashion film and digital campaign for Maison Noir\'s Autumn/Winter release. Every fabric fold was styled meticulously to capture the high-contrast chiaroscuro aesthetic, mirroring classical oil painting techniques within digital video and photography frames.',
    stats: [
      { label: 'Campaign Engagement', value: '4.8M' },
      { label: 'E-commerce Conversion', value: '+18.5%' },
      { label: 'Editorial Features', value: '14' }
    ],
    credits: [
      { role: 'Director & Photographer', name: 'Amara Vance' },
      { role: 'Fashion Stylist', name: 'Mathieu Laurent' },
      { role: 'Groomingist', name: 'Chloe Duval' },
      { role: 'Talent', name: 'Sasha Petrova / Elite' }
    ],
    gallery: [
      { id: 'g4', type: 'image', url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=90&w=1200', caption: 'Silk drape exploration and flow' },
      { id: 'g5', type: 'image', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=90&w=1200', caption: 'Structured silhouette outlining' },
      { id: 'g6', type: 'image', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=90&w=1200', caption: 'Noir lifestyle leather detailing' }
    ],
    publishState: 'published',
    featured: true,
    archived: false,
    socialLinks: {
      instagram: 'https://instagram.com',
      vimeo: 'https://vimeo.com'
    }
  },
  {
    id: 'proj-3',
    title: 'THE SILENT RETREAT',
    alias: 'silent-retreat',
    client: 'Oasis Luxury Resorts',
    category: 'Commercial',
    tagline: 'An immersive cinematic journey into sensory isolation.',
    description: 'A multisensory commercial series for Oasis Resorts. Instead of showcasing standard tour amenities, the commercial operates as a slow, breathing film. Slow-motion drone work, ASMR soundscapes of running water, and wind through palm leaves invite the viewer to breathe in real-time.',
    heroImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=90&w=2000',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-enjoying-infinity-pool-view-at-resort-41130-large.mp4',
    fullVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-enjoying-infinity-pool-view-at-resort-41130-large.mp4',
    year: '2025',
    campaignDetails: 'Shot entirely on location in Amalfi Coast and Ubud over 21 days, combining high-resolution digital cinema cameras with vintage anamorphic lenses to deliver extremely soft highlights, natural textures, and a dream-like color palette.',
    stats: [
      { label: 'Direct Bookings Peak', value: '+42%' },
      { label: 'Video CTR Rate', value: '7.2%' },
      { label: 'Awards Won', value: 'Best Travel Ad' }
    ],
    credits: [
      { role: 'Director', name: 'Elena Rostova' },
      { role: 'Executive Producer', name: 'Sebastian Thorne' },
      { role: 'Drone Pilot', name: 'Marcus Lind' },
      { role: 'Sound Designer', name: 'Hugo Arnell' }
    ],
    gallery: [
      { id: 'g7', type: 'image', url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=90&w=1200', caption: 'Infinity pool matching the horizon' },
      { id: 'g8', type: 'image', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=90&w=1200', caption: 'Sunrise on empty Amalfi cliffs' },
      { id: 'g9', type: 'image', url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=90&w=1200', caption: 'Cruising through deep blue Italian waters' }
    ],
    publishState: 'published',
    featured: true,
    archived: false,
    socialLinks: {
      instagram: 'https://instagram.com',
      website: 'https://oasisresorts.com'
    }
  },
  {
    id: 'proj-4',
    title: 'SENSORY COFFEE',
    alias: 'sensory-coffee',
    client: 'Atelier Caffè d\'Oro',
    category: 'Food Content',
    tagline: 'Capturing the deep, rich alchemy of artisanal roasting.',
    description: 'An editorial photo and video journey illustrating coffee not as a morning quick-fix, but as a slow, artisanal ritual. Smoke-filled roasting rooms, shimmering dark syrup, and tactile jute sacks bring the sensory craftsmanship of Atelier Roast to life.',
    heroImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=90&w=2000',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-dripping-syrup-on-waffles-43152-large.mp4',
    fullVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-pouring-dripping-syrup-on-waffles-43152-large.mp4',
    year: '2026',
    campaignDetails: 'An interactive campaign distributed via culinary subcultures. We developed custom limited-edition tactile packaging, dark macro photography, and high-contrast digital reels highlighting the detailed science of roasting heat and pouring viscosity.',
    stats: [
      { label: 'Instagram Engagement', value: '+124%' },
      { label: 'Subscriber Enrolment', value: '18,500' },
      { label: 'Sales Growth', value: '+68%' }
    ],
    credits: [
      { role: 'Creative Director', name: 'Yuki Sato' },
      { role: 'Food Stylist', name: 'Aria Bianchi' },
      { role: 'Photographer', name: 'Julian Vance' }
    ],
    gallery: [
      { id: 'g10', type: 'image', url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&q=90&w=1200', caption: 'Steaming pour-over details' },
      { id: 'g11', type: 'image', url: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&q=90&w=1200', caption: 'Artisanal coffee bean selection matching roasting stages' },
      { id: 'g12', type: 'image', url: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&q=90&w=1200', caption: 'The tactile texture of raw organic coffee barrels' }
    ],
    publishState: 'published',
    featured: false,
    archived: false
  },
  {
    id: 'proj-5',
    title: 'ELEVATE ACTIVE',
    alias: 'elevate-active',
    client: 'Apex Athleisure',
    category: 'Social Media',
    tagline: 'High-energy motion captured in ultra-modern structures.',
    description: 'A dynamic, multi-channel social campaign built around modern athletic wear in concrete urban landscapes. We combined fast cuts, industrial brutalist architecture, neon ambient details, and technical typography overlays to reflect elite performance.',
    heroImage: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&q=90&w=2000',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-legs-of-a-woman-running-on-track-in-slow-motion-41864-large.mp4',
    fullVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-legs-of-a-woman-running-on-track-in-slow-motion-41864-large.mp4',
    year: '2025',
    campaignDetails: 'Designed a comprehensive social media rollout covering vertical reels, micro-cinematics, interactive lifestyle cards, and custom fitness applications with high-impact layouts that gained explosive traction globally on TikTok and Instagram.',
    stats: [
      { label: 'Reels Views', value: '18.4M' },
      { label: 'App Installs Boost', value: '+215%' },
      { label: 'Community Growth', value: '+450k' }
    ],
    credits: [
      { role: 'Creative Director', name: 'Sebastian Thorne' },
      { role: 'Videographer', name: 'Marcus Lind' },
      { role: 'Motion Graphic Artist', name: 'Zoe Sterling' }
    ],
    gallery: [
      { id: 'g13', type: 'image', url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=90&w=1200', caption: 'Stretching under raw morning light' },
      { id: 'g14', type: 'image', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=90&w=1200', caption: 'Urban athletic framing' },
      { id: 'g15', type: 'image', url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=90&w=1200', caption: 'Industrial concrete run' }
    ],
    publishState: 'published',
    featured: false,
    archived: false
  },
  {
    id: 'proj-6',
    title: 'THE MODERN ARCHITECT',
    alias: 'modern-architect',
    client: 'Form & space',
    category: 'Photography',
    tagline: 'An elegant editorial study of form, space, and limestone.',
    description: 'A coffee-table style digital editorial exploring modern minimalist spaces. By looking closely at how natural sunlight interacts with limestone facades, oak joints, and concrete, we created an artistic archive emphasizing silent luxury.',
    heroImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=90&w=2000',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-camera-shutter-opening-and-closing-close-up-vibe-41712-large.mp4',
    fullVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-camera-shutter-opening-and-closing-close-up-vibe-41712-large.mp4',
    year: '2026',
    campaignDetails: 'A high-end print lookbook and immersive web presentation distributed to architects and luxurious interior designers. The layout borrows heavily from classical grids, combining extreme margins with delicate serif details and black-and-white portraits.',
    stats: [
      { label: 'Lookbook Orders', value: '4,200' },
      { label: 'Web Interactions Duration', value: '4m 32s' },
      { label: 'Global Citations', value: '22' }
    ],
    credits: [
      { role: 'Photographer', name: 'Amara Vance' },
      { role: 'Architectural Consultant', name: 'Julian Vance' },
      { role: 'Lead Editorial Planner', name: 'Sophia Ricci' }
    ],
    gallery: [
      { id: 'g16', type: 'image', url: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&q=90&w=1200', caption: 'Oak panels with hidden locks' },
      { id: 'g17', type: 'image', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=90&w=1200', caption: 'The play of light over raw limestone stairs' },
      { id: 'g18', type: 'image', url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=90&w=1200', caption: 'Minimal glass dining facing a clean pine woods landscape' }
    ],
    publishState: 'published',
    featured: false,
    archived: false,
    socialLinks: {
      instagram: 'https://instagram.com'
    }
  }
];

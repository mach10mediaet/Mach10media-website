export interface ServicePackage {
  key: 'video-production' | 'photoshoot' | 'content-retainer' | 'campaign-package';
  eyebrow: string;
  title: string;
  price: string;
  summary: string;
  deliverables: string[];
  fit: string;
}

export const SERVICE_PACKAGES: ServicePackage[] = [
  {
    key: 'video-production',
    eyebrow: 'One-Time Production',
    title: 'Video Production',
    price: 'Starting at $50k',
    summary: 'Best for launches, campaigns, brand films, ads, and high-end social video projects.',
    deliverables: ['Creative direction', 'Pre-production planning', 'Filming crew', 'Editing and color', 'Social cutdowns'],
    fit: 'Good fit if you need a polished campaign video or a one-time production with strong art direction.'
  },
  {
    key: 'photoshoot',
    eyebrow: 'One-Time Production',
    title: 'Photoshoot',
    price: 'Starting at $25k',
    summary: 'Best for product launches, menus, fashion drops, hospitality, architecture, and editorial stills.',
    deliverables: ['Shot list and mood direction', 'On-set production', 'Retouched selects', 'Web and social-ready exports', 'Usage guidance'],
    fit: 'Good fit if you need a strong photo library for marketing, campaigns, or brand refreshes.'
  },
  {
    key: 'content-retainer',
    eyebrow: 'Monthly Package',
    title: 'Content Retainer',
    price: 'Starting at $50k per month',
    summary: 'Best for brands that need a steady flow of videos and photos every month.',
    deliverables: ['Monthly content planning', 'Reels and short-form video', 'Photography coverage', 'Editing and revisions', 'Publishing support'],
    fit: 'Good fit if you want consistent content for Instagram, TikTok, paid ads, or always-on brand growth.'
  },
  {
    key: 'campaign-package',
    eyebrow: 'Full Campaign',
    title: 'Campaign Package',
    price: 'Starting at $100k',
    summary: 'Best for brands that need strategy, production, rollout assets, and a cohesive launch system.',
    deliverables: ['Campaign concept', 'Video and photo production', 'Launch assets', 'Brand messaging support', 'Multi-channel rollout kit'],
    fit: 'Good fit if you are launching something important and want one team to handle the full creative system.'
  }
];

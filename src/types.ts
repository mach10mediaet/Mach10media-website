export type ProjectCategory = 'Photography' | 'Commercial' | 'Branding' | 'Social Media' | 'Food Content' | 'Fashion';

export interface ProjectStat {
  label: string;
  value: string;
}

export interface ProjectCredit {
  role: string;
  name: string;
}

export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  caption?: string;
}

export interface AppDiagnosticEvent {
  id: string;
  source: 'runtime' | 'promise' | 'firestore' | 'auth' | 'ui';
  level: 'info' | 'warning' | 'error';
  message: string;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  alias: string; // url slug
  client: string;
  category: ProjectCategory;
  tagline: string;
  description: string;
  heroImage: string;
  videoUrl?: string; // mp4 preview
  fullVideoUrl?: string; // main featured video
  year: string;
  stats: ProjectStat[];
  credits: ProjectCredit[];
  gallery: MediaAsset[];
  campaignDetails: string;
  publishState?: 'draft' | 'published';
  featured?: boolean;
  archived?: boolean;
  socialLinks?: {
    instagram?: string;
    vimeo?: string;
    website?: string;
  };
}

export type ActiveView = 'home' | 'work' | 'services' | 'project' | 'about' | 'contact' | 'admin' | 'upload';

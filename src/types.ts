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
  videoUrl?: string; // optional preview video or hosted embed URL
  fullVideoUrl?: string; // optional main featured video or hosted embed URL
  year: string;
  stats: ProjectStat[];
  credits: ProjectCredit[];
  gallery: MediaAsset[];
  campaignDetails: string;
  publishState?: 'draft' | 'published';
  featured?: boolean;
  archived?: boolean;
  createdAt?: any;
  updatedAt?: any;
  socialLinks?: {
    instagram?: string;
    vimeo?: string;
    website?: string;
  };
}

export type ActiveView = 'home' | 'work' | 'services' | 'project' | 'about' | 'contact' | 'admin' | 'upload';

// ── Work-Log (time tracking) ──

export type MemberRole = 'admin' | 'employee';

export interface MemberProfile {
  email: string; // lowercased Google email, == team_members doc id
  fullName: string;
  role: MemberRole;
}

export interface TeamMember {
  id: string; // lowercased email
  fullName: string;
  role: MemberRole;
  isActive: boolean;
  createdAt?: any;
}

export interface WorkCategory {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: any;
}

export type TimeEntryStatus = 'running' | 'paused' | 'completed';
export type EntryMethod = 'timer' | 'manual';
export type ApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface TimeEntry {
  id: string;
  userId: string; // lowercased email == team_members doc id
  userName: string;
  clientId: string; // '' while unset
  clientName: string;
  workTypeId: string;
  workTypeName: string;
  notes: string;
  startTime: number; // epoch ms, client clock
  endTime: number | null;
  entryDate: string; // 'YYYY-MM-DD' in Africa/Addis_Ababa
  status: TimeEntryStatus;
  entryMethod: EntryMethod;
  durationMinutes: number | null;
  isLateSubmission: boolean;
  approvalStatus: ApprovalStatus;
  approvedBy: string | null;
  approvedAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface TimeEntryPause {
  id: string;
  pausedAt: number;
  resumedAt: number | null;
}

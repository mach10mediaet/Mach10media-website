import React, { useState, useRef, useEffect } from 'react';
import { 
  Project, 
  ProjectCategory, 
  ProjectStat, 
  ProjectCredit, 
  MediaAsset,
  AppDiagnosticEvent
} from '../types';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, signInWithGoogle, getAccessToken, setAccessToken, firebaseProjectId, firestoreDatabaseLabel } from '../firebase';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Image as ImageIcon, 
  Search, 
  Trash2, 
  Edit3, 
  Upload, 
  FileVideo, 
  CheckCircle, 
  AlertCircle, 
  FolderPlus, 
  X, 
  Layers, 
  Calendar, 
  Sparkles,
  Link as LinkIcon,
  Lock,
  LogOut,
  ShieldCheck,
  Folder,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  FileText,
  Library,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminDashboardViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  activeView: 'admin' | 'upload';
  onNavigate: (view: 'admin' | 'upload') => void;
  adminSlug: string;
  setAdminSlug: (slug: string) => void;
  onLogOut: () => void;
  diagnosticEvents: AppDiagnosticEvent[];
  projectsError: string | null;
}

interface InquiryRecord {
  id: string;
  name: string;
  email: string;
  company: string;
  referralSource: string;
  practice: string;
  budget: string;
  budgetCurrency: string;
  goal: string;
  nextStep: string;
  callType: string;
  meetingDay: string;
  pricingMode: string;
  estimateProjectType: string;
  estimateSummary: string;
  recommendedPackage: string;
  story: string;
  platforms: string[];
  deliverables: string[];
  status: string;
  createdAtLabel: string;
  createdAtMs: number;
}

const FIRESTORE_URL_LIMIT = 1000;
const DRIVE_HOST_PATTERNS = ['drive.google.com', 'googleusercontent.com'];

const validateMediaUrlForFirestore = (value: string, label: string) => {
  if (!value) return null;
  if (value.length > FIRESTORE_URL_LIMIT) {
    return `${label} is too large to save to Firestore. Please use a Google Drive or hosted URL instead of inline base64 media.`;
  }
  return null;
};

const validatePublicMediaUrl = (value: string, label: string) => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (DRIVE_HOST_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return `${label} is using a Google Drive URL. For a launch-ready public portfolio, please replace it with Firebase Storage or another CDN-friendly hosted media URL.`;
  }
  return null;
};

export default function AdminDashboardView({ 
  projects, 
  setProjects,
  activeView,
  onNavigate,
  adminSlug,
  setAdminSlug,
  onLogOut,
  diagnosticEvents,
  projectsError
}: AdminDashboardViewProps) {
  // Local sub-tab state so they can toggle local view panels smoothly
  const [localTab, setLocalTab] = useState<'admin' | 'upload' | 'inquiries' | 'security'>(
    activeView === 'upload' ? 'upload' : 'admin'
  );

  // Sync with prop navigation changes
  React.useEffect(() => {
    if (activeView === 'upload') {
      setLocalTab('upload');
    } else {
      setLocalTab('admin');
    }
  }, [activeView]);

  // Sidebar items
  const sidebarItems = [
    { label: 'Exhibits Roster', tab: 'admin' as const, icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Inquiries', tab: 'inquiries' as const, icon: <Inbox className="h-4 w-4" /> },
    { label: 'Media Lab & Uploads', tab: 'upload' as const, icon: <FolderPlus className="h-4 w-4" /> },
    { label: 'Access & Security', tab: 'security' as const, icon: <Lock className="h-4 w-4" /> }
  ];

  // List Management
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [publishState, setPublishState] = useState<'draft' | 'published'>('draft');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  // Cloud Database states
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(true);
  const [inquiriesError, setInquiriesError] = useState<string | null>(null);
  const [inquiryBanner, setInquiryBanner] = useState<string | null>(null);
  const [unreadInquiryIds, setUnreadInquiryIds] = useState<string[]>([]);
  const knownInquiryIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const inquiriesQuery = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      inquiriesQuery,
      (snapshot) => {
        const nextInquiries: InquiryRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const createdAtValue = data.createdAt?.toDate?.();
          return {
            id: docSnap.id,
            name: data.name || '',
            email: data.email || '',
            company: data.company || '',
            referralSource: data.referralSource || '',
            practice: data.practice || '',
            budget: data.budget || '',
            budgetCurrency: data.budgetCurrency || '',
            goal: data.goal || '',
            nextStep: data.nextStep || '',
            callType: data.callType || '',
            meetingDay: data.meetingDay || '',
            pricingMode: data.pricingMode || '',
            estimateProjectType: data.estimateProjectType || '',
            estimateSummary: data.estimateSummary || '',
            recommendedPackage: data.recommendedPackage || '',
            story: data.story || '',
            platforms: data.platforms || [],
            deliverables: data.deliverables || [],
            status: data.status || '',
            createdAtLabel: createdAtValue
              ? createdAtValue.toLocaleString()
              : 'Timestamp unavailable',
            createdAtMs: createdAtValue ? createdAtValue.getTime() : 0,
          };
        });

        const nextIds = nextInquiries.map((item) => item.id);
        const previousIds = knownInquiryIdsRef.current;
        const newIds = nextIds.filter((id) => !previousIds.includes(id));

        if (previousIds.length > 0 && newIds.length > 0) {
          setUnreadInquiryIds((prev) => Array.from(new Set([...newIds, ...prev])));
          setInquiryBanner(`${newIds.length} new ${newIds.length === 1 ? 'inquiry' : 'inquiries'} received.`);
        }

        setInquiries(nextInquiries);
        setInquiriesLoading(false);
        setInquiriesError(null);
        knownInquiryIdsRef.current = nextIds;
      },
      (error) => {
        console.error('Failed to load inquiries:', error);
        setInquiriesLoading(false);
        setInquiriesError(error instanceof Error ? error.message : 'Unknown inquiries error');
      }
    );

    return () => unsubscribe();
  }, []);

  const handleConnectFirebase = async () => {
    try {
      await signInWithGoogle();
    } catch (e) {
      alert('Authentication trigger failed. Check console trace.');
    }
  };

  const handleDisconnectFirebase = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSeedDatabase = async () => {
    if (!confirm('Are you sure you want to seed the cloud database with standard exhibitions? This will upload high-res presets directly to your active Firestore cluster.')) {
      return;
    }
    setSeeding(true);
    try {
      const { INITIAL_PROJECTS } = await import('../data/mockProjects');
      for (const proj of INITIAL_PROJECTS) {
        const payload = {
          id: proj.id,
          title: proj.title,
          alias: proj.alias,
          client: proj.client,
          category: proj.category,
          tagline: proj.tagline,
          description: proj.description,
          campaignDetails: proj.campaignDetails,
          heroImage: proj.heroImage,
          videoUrl: proj.videoUrl || '',
          fullVideoUrl: proj.fullVideoUrl || '',
          year: proj.year,
          stats: proj.stats,
          credits: proj.credits,
          gallery: proj.gallery,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(doc(db, 'projects', proj.id), payload);
      }
      alert('Database seed finished successfully!');
    } catch (err) {
      console.error(err);
      // We will handle via the error helper
      handleFirestoreError(err, OperationType.WRITE, 'projects/seed');
      alert('Friction detected: permission denied. Confirm you connected using the correct admin account: Besofekad@gmail.com');
    } finally {
      setSeeding(false);
    }
  };

  // Form Fields
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Branding');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [campaignDetails, setCampaignDetails] = useState('');
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=90&w=2000');
  const [videoUrl, setVideoUrl] = useState('');
  const [year, setYear] = useState('2026');

  // Stats builder
  const [stats, setStats] = useState<ProjectStat[]>([
    { label: 'Waitlist Growth', value: '+340%' },
    { label: 'Global Reach', value: '42M' }
  ]);
  const [newStatLabel, setNewStatLabel] = useState('');
  const [newStatValue, setNewStatValue] = useState('');

  // Credits builder
  const [credits, setCredits] = useState<ProjectCredit[]>([
    { role: 'Creative Director', name: 'Sebastian Thorne' }
  ]);
  const [newCreditRole, setNewCreditRole] = useState('');
  const [newCreditName, setNewCreditName] = useState('');

  // Project Gallery Customizer state
  const [formGallery, setFormGallery] = useState<MediaAsset[]>([]);

  // File Upload states (Visual Media Organizer Segment)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedMediaList, setUploadedMediaList] = useState<MediaAsset[]>([
    { id: 'm1', type: 'image', url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=90&w=600', caption: 'Leica Sensor' },
    { id: 'm2', type: 'video', url: 'https://assets.mixkit.co/videos/preview/mixkit-mechanical-watch-mechanism-close-up-vibe-40342-large.mp4', caption: 'Watch gears' }
  ]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // GOOGLE DRIVE INTEGRATION STATES & METHODS
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');
  const [driveFilterType, setDriveFilterType] = useState<'all' | 'image' | 'video' | 'folder'>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<{ id: string; name: string }[]>([]);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [uploadToDrive, setUploadToDrive] = useState(true);
  const [catalogDriveTarget, setCatalogDriveTarget] = useState<'hero' | 'video' | 'gallery' | null>(null);

  // Auto-sync existing Google OAuth token from memory if available
  useEffect(() => {
    const resolveToken = async () => {
      const val = await getAccessToken();
      if (val) {
        setDriveToken(val);
      }
    };
    resolveToken();
  }, [firebaseUser]);

  const handleGoogleDriveConnect = async () => {
    try {
      const response = await signInWithGoogle();
      if (response && response.accessToken) {
        setDriveToken(response.accessToken);
        setUploadToDrive(true);
        alert('Google Drive connection authorized successfully.');
      } else {
        alert('Firebase account linked, but Google Drive scope authorization is required.');
      }
    } catch (err: any) {
      console.error('Google authorization error:', err);
      alert('Authorization failed: ' + (err.message || String(err)));
    }
  };

  const fetchDriveFiles = async () => {
    if (!driveToken) return;
    setDriveLoading(true);
    setDriveError(null);
    try {
      let q = "trashed = false";
      if (currentFolderId) {
        q += ` and '${currentFolderId}' in parents`;
      } else {
        q += " and 'root' in parents";
      }

      if (driveFilterType === 'image') {
        q += " and mimeType starts with 'image/'";
      } else if (driveFilterType === 'video') {
        q += " and mimeType starts with 'video/'";
      } else if (driveFilterType === 'folder') {
        q += " and mimeType = 'application/vnd.google-apps.folder'";
      }

      if (driveSearch.trim()) {
        const escaped = driveSearch.trim().replace(/'/g, "\\'");
        q += ` and name contains '${escaped}'`;
      }

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,size)&pageSize=32`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${driveToken}` }
      });

      if (!res.ok) {
        const errDetails = await res.json();
        throw new Error(errDetails.error?.message || 'Access token expired or unauthorized.');
      }

      const data = await res.json();
      setDriveFiles(data.files || []);
    } catch (err: any) {
      console.error('Drive query error:', err);
      setDriveError(err.message || 'Error occurred querying your files.');
    } finally {
      setDriveLoading(false);
    }
  };

  useEffect(() => {
    if (driveToken) {
      fetchDriveFiles();
    }
  }, [driveToken, currentFolderId, driveFilterType]);

  const handleFolderClick = (fileId: string, fileName: string) => {
    setFolderPath((prev) => [...prev, { id: fileId, name: fileName }]);
    setCurrentFolderId(fileId);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setFolderPath([]);
      setCurrentFolderId(null);
    } else {
      const slice = folderPath.slice(0, index + 1);
      setFolderPath(slice);
      setCurrentFolderId(slice[slice.length - 1].id);
    }
  };

  const resolveDriveFile = (file: any) => {
    const isImage = file.mimeType?.startsWith('image/');
    const isVideo = file.mimeType?.startsWith('video/') || file.name?.endsWith('.mp4');
    const resolvedUrl = isImage
      ? `https://drive.google.com/uc?export=view&id=${file.id}`
      : file.webContentLink || file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;

    return {
      isImage,
      isVideo,
      resolvedUrl,
      asset: {
        id: 'drive-' + file.id,
        type: isImage ? 'image' : 'video',
        url: resolvedUrl,
        caption: `Drive: ${file.name}`
      } as MediaAsset
    };
  };

  // Import asset from Google Drive into Mach10 Library
  const handleSelectDriveFile = (file: any) => {
    const { isImage, resolvedUrl, asset: newAsset } = resolveDriveFile(file);

    if (uploadedMediaList.some(m => m.id === newAsset.id)) {
      alert('This visual asset is already loaded in your ingestion buffer.');
      return;
    }

    setUploadedMediaList([newAsset, ...uploadedMediaList]);

    // Fast-map to editing field for speed of construction
    if (isImage) {
      setHeroImage(resolvedUrl);
    } else {
      setVideoUrl(resolvedUrl);
    }

    alert(`"${file.name}" imported to Media Lab successfully! Selected as active hero/source media.`);
  };

  const handleSelectCatalogDriveAsset = (file: any) => {
    if (!catalogDriveTarget) return;

    const { isImage, isVideo, resolvedUrl, asset } = resolveDriveFile(file);

    if (catalogDriveTarget === 'hero') {
      if (!isImage) {
        alert('Please choose an image file for the cover image.');
        return;
      }
      setHeroImage(resolvedUrl);
    }

    if (catalogDriveTarget === 'video') {
      if (!isVideo) {
        alert('Please choose a video file for the preview trailer.');
        return;
      }
      setVideoUrl(resolvedUrl);
    }

    if (catalogDriveTarget === 'gallery') {
      if (!isImage) {
        alert('Please choose an image file for the gallery.');
        return;
      }
      setFormGallery((prev) => {
        if (prev.some((item) => item.id === asset.id)) {
          return prev;
        }
        return [...prev, asset];
      });
    }

    setCatalogDriveTarget(null);
    alert(`"${file.name}" added from Google Drive.`);
  };

  // Delete from drive with user confirmation dialog as per requirement
  const handleDeleteDriveFile = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${fileName}" from your Google Drive? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${driveToken}` }
      });

      if (!res.ok) {
        const errDetails = await res.json();
        throw new Error(errDetails.error?.message || 'Delete operation failed.');
      }

      alert(`"${fileName}" deleted successfully.`);
      fetchDriveFiles();
    } catch (err: any) {
      alert(`Could not delete file: ${err.message}`);
    }
  };

  const handleCreateDriveFolder = async () => {
    const folderName = prompt('Enter a name for the new Google Drive directory:');
    if (!folderName) return;

    try {
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        ...(currentFolderId ? { parents: [currentFolderId] } : {})
      };

      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driveToken}`
        },
        body: JSON.stringify(metadata)
      });

      if (!res.ok) {
        const errDetails = await res.json();
        throw new Error(errDetails.error?.message || 'Folder creation failed.');
      }

      alert(`Directory "${folderName}" created successfully!`);
      fetchDriveFiles();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCreateDriveTextFile = async () => {
    const fileName = prompt('Enter text file name:', 'studio-memo.txt');
    if (!fileName) return;
    const textContent = prompt('Enter the content text for this file:', 'Written from Mach10 Studio Dashboard.');
    if (textContent === null) return;

    try {
      const metadata = {
        name: fileName,
        mimeType: 'text/plain',
        ...(currentFolderId ? { parents: [currentFolderId] } : {})
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', new Blob([textContent], { type: 'text/plain' }));

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${driveToken}` },
        body: formData
      });

      if (!res.ok) {
        const errDetails = await res.json();
        throw new Error(errDetails.error?.message || 'Write failed');
      }

      alert(`"${fileName}" written and saved to Drive!`);
      fetchDriveFiles();
    } catch (err: any) {
      alert(`Error creating file: ${err.message}`);
    }
  };

  // Open creation panel
  const handleOpenAddNew = () => {
    setIsAddingNew(true);
    setEditingProject(null);
    setTitle('');
    setClient('');
    setCategory('Branding');
    setTagline('');
    setDescription('');
    setCampaignDetails('');
    setHeroImage('https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=90&w=2000');
    setVideoUrl('https://assets.mixkit.co/videos/preview/mixkit-mechanical-watch-mechanism-close-up-vibe-40342-large.mp4');
    setYear('2026');
    setStats([{ label: 'Conversions Boost', value: '+42%' }]);
    setCredits([{ role: 'Lead Director', name: 'Amara Vance' }]);
    setPublishState('draft');
    setIsFeatured(false);
    setIsArchived(false);
    setCatalogDriveTarget(null);
    setSaveConfirmation(null);
    setFormGallery([
      { id: 'g-sub-1', type: 'image', url: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=90&w=2000', caption: 'Campaign Detail Study 1' },
      { id: 'g-sub-2', type: 'image', url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=90&w=1200', caption: 'Tactile Material Concept' }
    ]);
  };

  // Open editor panel
  const handleOpenEdit = (proj: Project) => {
    setEditingProject(proj);
    setIsAddingNew(false);
    setTitle(proj.title);
    setClient(proj.client);
    setCategory(proj.category);
    setTagline(proj.tagline);
    setDescription(proj.description);
    setCampaignDetails(proj.campaignDetails);
    setHeroImage(proj.heroImage);
    setVideoUrl(proj.videoUrl || '');
    setYear(proj.year);
    setStats(proj.stats || []);
    setCredits(proj.credits || []);
    setPublishState(proj.publishState || 'published');
    setIsFeatured(Boolean(proj.featured));
    setIsArchived(Boolean(proj.archived));
    setCatalogDriveTarget(null);
    setSaveConfirmation(null);
    setFormGallery(proj.gallery || []);
  };

  // Handle addition of stat lines
  const handleAddStat = () => {
    if (newStatLabel && newStatValue) {
      setStats([...stats, { label: newStatLabel, value: newStatValue }]);
      setNewStatLabel('');
      setNewStatValue('');
    }
  };

  const handleRemoveStat = (index: number) => {
    setStats(stats.filter((_, i) => i !== index));
  };

  // Handle addition of credits roles
  const handleAddCredit = () => {
    if (newCreditRole && newCreditName) {
      setCredits([...credits, { role: newCreditRole, name: newCreditName }]);
      setNewCreditRole('');
      setNewCreditName('');
    }
  };

  const handleRemoveCredit = (index: number) => {
    setCredits(credits.filter((_, i) => i !== index));
  };

  // Cloud state trackers for button loader
  const [savingLoading, setSavingLoading] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (!saveConfirmation) return;
    const timer = window.setTimeout(() => setSaveConfirmation(null), 4000);
    return () => window.clearTimeout(timer);
  }, [saveConfirmation]);

  // Handle Form Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client || !tagline || !description) {
      alert('Please fill out all essential project lines.');
      return;
    }

    setSavingLoading(true);

    const projectId = editingProject ? editingProject.id : 'proj-' + Date.now();
    const cleanAlias = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const mediaValidationError =
      validateMediaUrlForFirestore(heroImage, 'Cover image') ||
      validateMediaUrlForFirestore(videoUrl, 'Preview video') ||
      validatePublicMediaUrl(heroImage, 'Cover image') ||
      validatePublicMediaUrl(videoUrl, 'Preview video') ||
      formGallery
        .map((asset, index) =>
          validateMediaUrlForFirestore(asset.url, `Gallery asset ${index + 1}`) ||
          validatePublicMediaUrl(asset.url, `Gallery asset ${index + 1}`)
        )
        .find(Boolean);

    if (mediaValidationError) {
      setSavingLoading(false);
      alert(mediaValidationError);
      return;
    }

    const projectPayload: any = {
      id: projectId,
      title,
      alias: cleanAlias,
      client,
      category,
      tagline,
      description,
      campaignDetails: campaignDetails || 'A detailed collaborative overview illustrating custom digital design structures.',
      heroImage,
      year,
      publishState,
      featured: isFeatured,
      archived: isArchived,
      stats,
      credits,
      gallery: formGallery,
      updatedAt: serverTimestamp()
    };

    if (videoUrl) {
      projectPayload.videoUrl = videoUrl;
      projectPayload.fullVideoUrl = videoUrl;
    } else {
      projectPayload.videoUrl = '';
      projectPayload.fullVideoUrl = '';
    }

    if (!editingProject) {
      projectPayload.createdAt = serverTimestamp();
    } else {
      const existingProj = projects.find(p => p.id === projectId);
      // Preserve the original Firestore timestamp when editing so rules accept the overwrite.
      projectPayload.createdAt = existingProj?.createdAt || editingProject?.createdAt || serverTimestamp();
      if (existingProj?.socialLinks || editingProject?.socialLinks) {
        projectPayload.socialLinks = existingProj?.socialLinks || editingProject?.socialLinks;
      }
    }

    try {
      await setDoc(doc(db, 'projects', projectId), projectPayload);
      setSaveConfirmation(
        editingProject
          ? `Exhibit updated successfully: ${title}`
          : `New exhibit saved successfully: ${title}`
      );

      // Reset pane state
      setEditingProject(null);
      setIsAddingNew(false);
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, editingProject ? OperationType.UPDATE : OperationType.CREATE, `projects/${projectId}`);
      alert('Security Friction: Permission Denied. In order to edit/update public exhibits in the database, make sure you are signed in as Besofekad@gmail.com in the "Access & Security" settings tab.');
    } finally {
      setSavingLoading(false);
    }
  };

  // Project deletion
  const handleDeleteProject = async (projId: string, nextArchivedState: boolean) => {
    if (confirm(nextArchivedState ? 'Archive this project exhibit?' : 'Restore this archived project exhibit?')) {
      try {
        await updateDoc(doc(db, 'projects', projId), {
          archived: nextArchivedState,
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error(err);
        handleFirestoreError(err, OperationType.UPDATE, `projects/${projId}`);
        alert('Security friction: Permission Denied. Check your admin credentials status underneath "Access & Security".');
      }
    }
  };

  const handleDeleteInquiry = async (inquiryId: string, inquiryLabel: string) => {
    if (!confirm(`Delete inquiry from "${inquiryLabel}" permanently?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'inquiries', inquiryId));
      setUnreadInquiryIds((prev) => prev.filter((id) => id !== inquiryId));
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `inquiries/${inquiryId}`);
      alert('Could not delete this inquiry. Please confirm your admin session is still authorized.');
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId: string, nextStatus: 'new' | 'handled') => {
    try {
      await updateDoc(doc(db, 'inquiries', inquiryId), {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      if (nextStatus === 'handled') {
        setUnreadInquiryIds((prev) => prev.filter((id) => id !== inquiryId));
      }
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `inquiries/${inquiryId}`);
      alert('Could not update the inquiry status. Please confirm your admin session is still authorized.');
    }
  };

  // Drag-and-Drop Loader Handlers (Real device file picking + Google Drive Integration)
  const processUploadedFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setUploadStatus('Rejected: Direct media must be modern Image or MP4 video format.');
      return;
    }

    setUploadProgress(10);
    setUploadStatus('Analyzing structure...');

    // Default to Drive-backed uploads whenever the user wants Drive sync and a token is available.
    if (uploadToDrive && driveToken) {
      try {
        setUploadStatus('Sending file to Google Drive space...');
        setUploadProgress(40);

        const metadata = {
          name: file.name,
          mimeType: file.type,
          ...(currentFolderId ? { parents: [currentFolderId] } : {})
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', file);

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webContentLink,webViewLink', {
          method: 'POST',
          headers: { Authorization: `Bearer ${driveToken}` },
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error?.message || 'Drive transfer failed.');
        }

        const driveFileData = await uploadRes.json();
        setUploadProgress(100);
        setUploadStatus('Saved to Google Drive!');

        setTimeout(() => {
          const resolvedUrl = isImage 
            ? `https://drive.google.com/uc?export=view&id=${driveFileData.id}` 
            : driveFileData.webContentLink || driveFileData.webViewLink;

          const newAsset: MediaAsset = {
            id: 'drive-' + driveFileData.id,
            type: isImage ? 'image' : 'video',
            url: resolvedUrl,
            caption: `Drive: ${file.name}`
          };

          setUploadedMediaList([newAsset, ...uploadedMediaList]);

          if (isImage) {
            setHeroImage(resolvedUrl);
          } else {
            setVideoUrl(resolvedUrl);
          }

          setUploadProgress(null);
          setUploadStatus('');
          fetchDriveFiles(); // Refresh drive list
          alert(`"${file.name}" uploaded to Google Drive and placed in ingestion library!`);
        }, 500);

      } catch (err: any) {
        console.error('Google Drive direct upload error:', err);
        setUploadStatus('Drive upload failed, falling back to local memory cache...');
        // Fall back to standard local reader
        readLocalFileAndCache(file, isImage);
      }
    } else if (uploadToDrive && !driveToken) {
      setUploadStatus('Google Drive is the default target, but it is not connected yet. Saving locally for now...');
      readLocalFileAndCache(file, isImage);
    } else {
      readLocalFileAndCache(file, isImage);
    }
  };

  const readLocalFileAndCache = (file: File, isImage: boolean) => {
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return null;
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      clearInterval(interval);
      setUploadProgress(100);
      setUploadStatus('Finished mapping.');

      setTimeout(() => {
        const newAsset: MediaAsset = {
          id: 'uploaded-' + Date.now(),
          type: isImage ? 'image' : 'video',
          url: dataUrl,
          caption: file.name
        };

        const updatedList = [newAsset, ...uploadedMediaList];
        setUploadedMediaList(updatedList);
        
        if (isImage) {
          setHeroImage(dataUrl);
        } else {
          setVideoUrl(dataUrl);
        }

        setUploadProgress(null);
        setUploadStatus('');
      }, 500);
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const filteredExhibits = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-transparent min-h-screen text-[#f2f2f2] pt-28">
      <div className="mx-auto max-w-7xl px-6 md:px-12 grid gap-10 lg:grid-cols-4 py-8">
        
        {/* SIDEBAR NAVIGATION GRID */}
        <aside className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-white/10 pb-6 lg:pb-0 lg:pr-8">
          <div className="mb-8 flex items-center space-x-2 border-b border-white/10 pb-4">
            <div className="h-2 w-2 rounded-full bg-neutral-400 animate-pulse" />
            <span className="font-mono text-[9px] tracking-[0.25em] text-[#737373] uppercase">MACH10 SECURITY PANEL</span>
          </div>

          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => {
                  setLocalTab(item.tab);
                  if (item.tab === 'admin' || item.tab === 'upload') {
                    onNavigate(item.tab);
                  }
                  if (item.tab === 'inquiries') {
                    setInquiryBanner(null);
                  }
                  setIsAddingNew(false);
                  setEditingProject(null);
                }}
                className={`flex w-full items-center space-x-3 px-5 py-3 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all duration-300 border ${
                  localTab === item.tab && !isAddingNew && !editingProject
                    ? 'bg-[#f2f2f2] text-black border-transparent font-medium shadow-md shadow-white/5'
                    : 'bg-transparent text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white hover:border-white/10'
                }`}
                id={`admin-tab-button-${item.tab}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.tab === 'inquiries' && unreadInquiryIds.length > 0 && (
                  <span className="ml-auto rounded-full bg-[#F9A136] px-2 py-0.5 text-[9px] font-bold text-black">
                    {unreadInquiryIds.length}
                  </span>
                )}
              </button>
            ))}

            {/* Log Out CTA */}
            <button
              type="button"
              onClick={() => {
                if (confirm('Verify: Lock creative session and log out?')) {
                  onLogOut();
                }
              }}
              className="flex w-full items-center space-x-3 px-5 py-3 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all duration-300 border bg-transparent text-red-400/80 border-red-500/10 hover:bg-red-500/10 hover:border-red-400 hover:text-red-400 cursor-pointer mt-6"
              id="admin-logout-sidebar-btn"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out / Lock</span>
            </button>
          </div>

          <div className="mt-12 hidden lg:block border-t border-white/10 pt-8">
            <p className="font-mono text-[8.5px] text-[#525252] uppercase tracking-[0.25em] mb-3">PERSISTENCE STORAGE</p>
            <div className="rounded border border-white/10 bg-[#0c0c0c]/80 p-4 text-[10px] text-neutral-400 font-mono space-y-1.5 shadow-sm">
              <p>Type: LIVE FIRESTORE STATE</p>
              <p>Projects Indexed: {projects.length}</p>
              <p>System State: {projectsError ? 'ATTENTION REQUIRED' : 'ONLINE'}</p>
            </div>
          </div>
        </aside>

        {/* MAIN MODULE CONTENT AREA */}
        <main className="lg:col-span-3">
          {saveConfirmation && (
            <div className="mb-6 rounded border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              {saveConfirmation}
            </div>
          )}
          
          {/* CONTROL SECTION 1: ADD OR EXPORT PANE */}
          {editingProject || isAddingNew ? (
            <section className="bg-[#090909] border border-white/5 rounded-lg p-6 md:p-8">
              
              {/* Back to list controller */}
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <h2 className="font-sans text-xl font-light text-white flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-neutral-400" />
                  <span>{editingProject ? `Refining Exhibit: ${editingProject.title}` : 'Catalog New Creative Exhibit'}</span>
                </h2>
                
                <button
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingProject(null);
                  }}
                  className="font-mono text-[9px] uppercase tracking-widest text-[#737373] hover:text-white"
                  id="form-cancel-btn"
                >
                  Return to Roster
                </button>
              </div>

              {/* PROJECT COMPOSITION FORM */}
              <form onSubmit={handleFormSubmit} className="space-y-6">
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">PROJECT ENTRY TITLE *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MONOLITH REVELATIONS"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-white focus:outline-none"
                      id="project-editor-title"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">CLIENT/SPONSOR *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vacheron Constantin Paris"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                      className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-white focus:outline-none"
                      id="project-editor-client"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">PRACTICE CATEGORY</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                      className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-white focus:outline-none text-white select-custom"
                    >
                      <option className="bg-black text-white" value="Photography">Photography</option>
                      <option className="bg-black text-white" value="Commercial">Commercial</option>
                      <option className="bg-black text-white" value="Branding">Branding</option>
                      <option className="bg-black text-white" value="Social Media">Social Media</option>
                      <option className="bg-black text-white" value="Food Content">Food Content</option>
                      <option className="bg-black text-white" value="Fashion">Fashion</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">LAUNCH YEAR</label>
                    <input
                      type="text"
                      placeholder="2026"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider inline-flex items-center gap-1.5 pb-0.5">
                      <LinkIcon className="h-3 w-3 text-neutral-400" />
                      <span>COVER IMAGE / HERO *</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Image URL or Base64 data"
                        value={heroImage}
                        onChange={(e) => setHeroImage(e.target.value)}
                        className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-xs focus:border-white focus:outline-none text-xs"
                        id="project-editor-hero-url"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById('form-hero-upload-input') as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="border border-white/15 bg-white/5 hover:bg-white hover:text-black px-3 py-2 font-mono text-[9px] tracking-wider text-white uppercase transition-colors shrink-0 inline-flex items-center gap-1"
                      >
                        <Upload className="h-2.5 w-2.5" />
                        <span>Upload</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!driveToken) {
                            alert('Connect Google Drive first, then choose a Drive asset.');
                            return;
                          }
                          setCatalogDriveTarget('hero');
                          fetchDriveFiles();
                        }}
                        className="border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500 hover:text-white px-3 py-2 font-mono text-[9px] tracking-wider text-blue-200 uppercase transition-colors shrink-0 inline-flex items-center gap-1"
                      >
                        <Library className="h-2.5 w-2.5" />
                        <span>Drive</span>
                      </button>
                    </div>
                    <input
                      type="file"
                      id="form-hero-upload-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setHeroImage(event.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">OPTIONAL VIDEO URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste mp4, YouTube, or Vimeo link"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-white focus:outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!driveToken) {
                          alert('Connect Google Drive first, then choose a Drive asset.');
                          return;
                        }
                        setCatalogDriveTarget('video');
                        fetchDriveFiles();
                      }}
                      className="border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500 hover:text-white px-3 py-2 font-mono text-[9px] tracking-wider text-blue-200 uppercase transition-colors shrink-0 inline-flex items-center gap-1"
                    >
                      <Library className="h-2.5 w-2.5" />
                      <span>Drive</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">BRAND TAGLINE *</label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    placeholder="Short, artistic slogan spacing. e.g. Curving silver shadows beneath classical moonlight."
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">EXHIBIT CHRONIC DESCRIPTION STORY *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the editorial concept, the architectural background variables, and the final sensory value established."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm focus:border-white focus:outline-none resize-none"
                  />
                </div>

                {/* INTERACTIVE EXHIBIT PHOTO GALLERY BUILDER (Custom Photo uploads to client works) */}
                <div className="border border-white/5 bg-[#121212]/50 p-6 rounded-md space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
                    <div>
                      <p className="font-mono text-[10px] text-white uppercase tracking-[0.2em] font-medium inline-flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
                        <span>Client Visual Exhibits Gallery ({formGallery.length})</span>
                      </p>
                      <p className="text-[9px] font-sans text-[#737373] mt-0.5">Define rich multi-angle photography assets presented inside this client exhibit page.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!driveToken) {
                            alert('Connect Google Drive first, then choose a Drive asset.');
                            return;
                          }
                          setCatalogDriveTarget('gallery');
                          fetchDriveFiles();
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-blue-200 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                      >
                        <Library className="h-3 w-3" />
                        <span>Add From Drive</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById('form-gallery-upload-input-field') as HTMLInputElement;
                          fileInput?.click();
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-wider text-white hover:bg-white hover:text-black transition-all cursor-pointer"
                        id="gallery-file-upload-trigger"
                      >
                        <Upload className="h-3 w-3" />
                        <span>Upload Photo</span>
                      </button>
                      <input
                        type="file"
                        id="form-gallery-upload-input-field"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                const newAsset: MediaAsset = {
                                  id: 'gal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                                  type: 'image',
                                  url: event.target.result as string,
                                  caption: file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase()
                                };
                                setFormGallery(prev => [...prev, newAsset]);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {catalogDriveTarget && (
                    <div className="rounded-md border border-blue-500/20 bg-blue-950/10 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-blue-300">
                            {catalogDriveTarget === 'hero' ? 'Select Drive Hero Image' : catalogDriveTarget === 'video' ? 'Select Drive Preview Video' : 'Select Drive Gallery Image'}
                          </p>
                          <p className="mt-1 text-[11px] font-sans text-neutral-400">
                            Choose from your connected Google Drive files below.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCatalogDriveTarget(null)}
                          className="rounded-full border border-white/10 px-3 py-1 font-mono text-[9px] uppercase tracking-wider text-neutral-300 hover:text-white"
                        >
                          Close
                        </button>
                      </div>

                      {!driveToken ? (
                        <div className="rounded border border-red-900/40 bg-red-950/20 p-3 font-mono text-[10px] text-red-300">
                          Google Drive is not connected.
                        </div>
                      ) : driveLoading ? (
                        <div className="rounded border border-white/5 bg-black/20 p-6 text-center font-mono text-[10px] text-neutral-400">
                          Loading Drive assets...
                        </div>
                      ) : driveFiles.length === 0 ? (
                        <div className="rounded border border-white/5 bg-black/20 p-6 text-center font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
                          No matching Drive files in this folder view
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {driveFiles
                            .filter((file) => {
                              if (catalogDriveTarget === 'video') {
                                return file.mimeType?.startsWith('video/') || file.name?.endsWith('.mp4');
                              }
                              return file.mimeType?.startsWith('image/');
                            })
                            .map((file) => {
                              const isImage = file.mimeType?.startsWith('image/');
                              const isVideo = file.mimeType?.startsWith('video/') || file.name?.endsWith('.mp4');

                              return (
                                <button
                                  key={`catalog-drive-${file.id}`}
                                  type="button"
                                  onClick={() => handleSelectCatalogDriveAsset(file)}
                                  className="group rounded-md border border-white/8 bg-[#070707] p-2 text-left transition-colors hover:border-blue-400/40 hover:bg-[#0d1117]"
                                >
                                  <div className="mb-2 aspect-video overflow-hidden rounded bg-black flex items-center justify-center">
                                    {isImage && file.thumbnailLink ? (
                                      <img
                                        src={file.thumbnailLink}
                                        alt={file.name}
                                        className="h-full w-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : isVideo ? (
                                      <FileVideo className="h-8 w-8 text-blue-300/80" />
                                    ) : (
                                      <FileText className="h-8 w-8 text-neutral-500" />
                                    )}
                                  </div>
                                  <p className="truncate font-sans text-xs text-neutral-200" title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className="mt-1 font-mono text-[8px] uppercase tracking-wider text-neutral-500">
                                    {isVideo ? 'Video' : 'Image'}
                                  </p>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Add Image by Web URL bar */}
                  <div className="flex gap-2 items-center bg-black/30 p-2.5 rounded border border-white/5">
                    <input
                      type="text"
                      id="gallery-web-url-paste-field"
                      placeholder="Or paste external Unsplash / web image URL here..."
                      className="rounded border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-white w-full font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const inputEl = document.getElementById('gallery-web-url-paste-field') as HTMLInputElement;
                        if (inputEl && inputEl.value.trim()) {
                          const url = inputEl.value.trim();
                          const newAsset: MediaAsset = {
                            id: 'gal-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
                            type: 'image',
                            url: url,
                            caption: 'EDITORIAL PERSPECTIVE LOOK'
                          };
                          setFormGallery(prev => [...prev, newAsset]);
                          inputEl.value = '';
                        }
                      }}
                      className="border border-white/20 bg-white/5 hover:bg-white hover:text-black px-4 py-1.5 text-[9px] text-white uppercase font-mono tracking-wider transition-colors shrink-0"
                    >
                      + Add URL
                    </button>
                  </div>

                  {/* Active Gallery Grid representation */}
                  {formGallery.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-white/5 rounded font-mono text-[9px] text-neutral-500 uppercase tracking-widest">
                      No photography assets loaded yet. Upload your own photos above.
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {formGallery.map((asset, idx) => (
                        <div key={asset.id} className="group relative bg-[#070707] border border-white/5 p-2 rounded-md flex flex-col gap-2 hover:border-white/25 transition-all">
                          <div className="relative aspect-video w-full overflow-hidden bg-neutral-900 border border-white/5 rounded">
                            <img src={asset.url} alt="Exhibit Gallery preview" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <button
                              type="button"
                              onClick={() => {
                                setFormGallery(prev => prev.filter(item => item.id !== asset.id));
                              }}
                              className="absolute top-1.5 right-1.5 bg-red-950/90 hover:bg-red-900 border border-red-500/30 text-red-100 p-1 rounded hover:scale-105 transition-all"
                              title="Delete Photo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="font-mono text-[8px] text-neutral-500 uppercase tracking-[0.16em] block font-bold">EXPOSURE CAPTION / LABEL</span>
                            <input
                              type="text"
                              placeholder="e.g. BRUTALIST OAK CHANNELS"
                              value={asset.caption || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormGallery(prev => prev.map(item => item.id === asset.id ? { ...item, caption: val } : item));
                              }}
                              className="w-full rounded border border-white/10 bg-black/60 px-2 py-1 text-[10px] text-white focus:border-white focus:outline-none font-sans"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ADVANCED STATS ASSEMBLER (Notion-style interactive stats setter) */}
                <div className="border border-white/5 bg-[#121212]/50 p-4 rounded-md space-y-4">
                  <p className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">PROJECT STATISTICS (OUTCOMES PANEL) ({stats.length})</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {stats.map((s, idx) => (
                      <span key={idx} className="bg-black border border-white/10 px-2.5 py-1 text-xs rounded-full inline-flex items-center gap-1.5 text-neutral-300">
                        <span>{s.label}: <strong>{s.value}</strong></span>
                        <button type="button" onClick={() => handleRemoveStat(idx)} className="text-red-400 hover:text-red-300 font-bold ml-1 text-[11px]">&times;</button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Sales Jump"
                      value={newStatLabel}
                      onChange={(e) => setNewStatLabel(e.target.value)}
                      className="rounded border border-white/5 bg-[#171717] px-2 py-1.5 text-xs focus:outline-none text-white w-full sm:w-1/3"
                    />
                    <input
                      type="text"
                      placeholder="e.g. +142%"
                      value={newStatValue}
                      onChange={(e) => setNewStatValue(e.target.value)}
                      className="rounded border border-white/5 bg-[#171717] px-2 py-1.5 text-xs focus:outline-none text-white w-full sm:w-1/3"
                    />
                    <button
                      type="button"
                      onClick={handleAddStat}
                      className="border border-white/20 bg-white/5 hover:bg-white hover:text-black px-4 py-1.5 text-xs text-white uppercase font-mono tracking-wider transition-colors shrink-0"
                    >
                      + Set Stat
                    </button>
                  </div>
                </div>

                {/* ADVANCED CREDITS MATRIX SETTER */}
                <div className="border border-white/5 bg-[#121212]/50 p-4 rounded-md space-y-4">
                  <p className="font-mono text-[9px] text-neutral-400 uppercase tracking-wider">CREATOR MATRIX CREDITS ({credits.length})</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {credits.map((c, idx) => (
                      <span key={idx} className="bg-black border border-white/10 px-2.5 py-1 text-xs rounded-full inline-flex items-center gap-1.5 text-neutral-300">
                        <span>{c.role}: <strong>{c.name}</strong></span>
                        <button type="button" onClick={() => handleRemoveCredit(idx)} className="text-red-400 hover:text-red-300 font-bold ml-1 text-[11px]">&times;</button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. Executive Producer"
                      value={newCreditRole}
                      onChange={(e) => setNewCreditRole(e.target.value)}
                      className="rounded border border-white/5 bg-[#171717] px-2 py-1.5 text-xs focus:outline-none text-white w-full sm:w-1/3"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Julian Thorne"
                      value={newCreditName}
                      onChange={(e) => setNewCreditName(e.target.value)}
                      className="rounded border border-white/5 bg-[#171717] px-2 py-1.5 text-xs focus:outline-none text-white w-full sm:w-1/3"
                    />
                    <button
                      type="button"
                      onClick={handleAddCredit}
                      className="border border-white/20 bg-white/5 hover:bg-white hover:text-black px-4 py-1.5 text-xs text-white uppercase font-mono tracking-wider transition-colors shrink-0"
                    >
                      + Set Credit
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="submit"
                    disabled={savingLoading}
                    className="w-full bg-white text-black font-mono text-[10px] uppercase tracking-widest py-3 font-bold hover:bg-neutral-200 disabled:opacity-50 transition-colors cursor-pointer"
                    id="submit-project-form"
                  >
                    {savingLoading ? 'Publishing structure to Cloud...' : (editingProject ? 'Save Exhibit Index refinement' : 'Incept Portfolio Exhibit')}
                  </button>
                </div>

              </form>
            </section>
          ) : localTab === 'admin' ? (
            
            // ROSTER OVERVIEW SECTION
            <section className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
                <div>
                  <h1 className="font-sans text-2xl font-light">Exhibits Roster</h1>
                  <p className="font-mono text-[9px] text-[#525252] tracking-wider uppercase mt-1">Configure and index legacy assets</p>
                </div>
                
                <button
                  onClick={handleOpenAddNew}
                  className="flex items-center gap-2 border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-[10px] tracking-widest text-white uppercase hover:bg-white hover:text-black transition-all"
                  id="add-new-exhibit-button"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Create Creative Exhibit</span>
                </button>
              </div>

              {/* Search Utility */}
              <div className="relative flex items-center bg-[#090909] border border-white/5 p-1 rounded">
                <Search className="absolute left-3.5 h-4 w-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Query exhibit roster by client or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent pl-10 pr-4 py-2 text-xs focus:outline-none text-white font-mono"
                  id="admin-search-input"
                />
              </div>

              {/* Roster Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredExhibits.map((proj) => (
                  <div key={proj.id} className="border border-white/5 bg-[#090909]/60 p-4 rounded-lg flex gap-4 items-center">
                    <img 
                      src={proj.heroImage} 
                      alt={proj.title} 
                      referrerPolicy="no-referrer"
                      className="h-14 w-14 object-cover border border-white/10 shrink-0" 
                    />
                    <div className="w-full min-w-0">
                      <p className="font-mono text-[8.5px] uppercase tracking-wider text-neutral-500">{proj.client}</p>
                      <h4 className="font-sans text-sm font-semibold text-white truncate">{proj.title}</h4>
                      <p className="font-sans text-xs text-[#737373] mt-1 pr-4 truncate italic">"{proj.tagline}"</p>
                    </div>

                    {/* Manage keys action */}
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(proj)}
                        className="flex h-8 w-8 items-center justify-center border border-white/5 bg-transparent text-neutral-400 hover:border-white/20 hover:text-white"
                        title="Edit Project"
                        id={`edit-btn-${proj.id}`}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(proj.id, !Boolean(proj.archived))}
                        className="flex h-8 w-8 items-center justify-center border border-white/5 bg-transparent text-neutral-400 hover:border-red-500/20 hover:text-red-400"
                        title={proj.archived ? 'Restore Project' : 'Archive Project'}
                        id={`delete-btn-${proj.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </section>
          ) : localTab === 'inquiries' ? (

            <section className="space-y-6">
              {inquiryBanner && (
                <div className="rounded-lg border border-[#F9A136]/25 bg-[#F9A136]/10 px-4 py-3 text-sm text-[#f7d6a0]">
                  {inquiryBanner}
                </div>
              )}

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-6">
                <div>
                  <h1 className="font-sans text-2xl font-light">Client Inquiries</h1>
                  <p className="font-mono text-[9px] text-[#525252] tracking-wider uppercase mt-1">Leads captured from the contact page</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-neutral-300">
                    {inquiries.length} total inquiries
                  </div>
                  <div className="rounded-full border border-[#F9A136]/20 bg-[#F9A136]/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-[#F9A136]">
                    {unreadInquiryIds.length} unread
                  </div>
                </div>
              </div>

              {inquiriesLoading ? (
                <div className="rounded-lg border border-white/5 bg-[#090909]/60 p-8 text-center font-mono text-xs text-neutral-400">
                  Loading inquiries from Firestore...
                </div>
              ) : inquiriesError ? (
                <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-5 text-sm text-red-300">
                  Firestore inquiry load failed: {inquiriesError}
                </div>
              ) : inquiries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/10 bg-[#090909]/40 p-8 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                  No inquiries have been stored yet
                </div>
              ) : (
                <div className="space-y-4">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="rounded-lg border border-white/5 bg-[#090909]/60 p-5 space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-sans text-lg text-white">{inquiry.company || inquiry.name}</p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                            {inquiry.name} • {inquiry.email}
                          </p>
                          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-neutral-600">
                            Received {inquiry.createdAtLabel}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {inquiry.status && (
                            <span className="rounded-full border border-[#F9A136]/30 bg-[#F9A136]/10 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-[#F9A136]">
                              {inquiry.status}
                            </span>
                          )}
                          {inquiry.status !== 'handled' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateInquiryStatus(inquiry.id, 'handled')}
                              className="rounded-full border border-green-500/20 bg-green-950/20 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-green-300 transition-colors hover:border-green-400 hover:text-green-200"
                            >
                              Mark Handled
                            </button>
                          )}
                          {inquiry.status === 'handled' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateInquiryStatus(inquiry.id, 'new')}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
                            >
                              Mark New
                            </button>
                          )}
                          {inquiry.nextStep && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-neutral-300">
                              {inquiry.nextStep}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteInquiry(inquiry.id, inquiry.company || inquiry.name)}
                            className="rounded-full border border-red-500/20 bg-red-950/20 px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-red-300 transition-colors hover:border-red-400 hover:text-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 text-sm text-neutral-300">
                          <p><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Practice</span><br />{inquiry.practice || 'Not provided'}</p>
                          <p><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Budget</span><br />{inquiry.budget || 'Not provided'}</p>
                          <p><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Goal</span><br />{inquiry.goal || 'Not provided'}</p>
                          <p><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Call Request</span><br />{inquiry.callType ? `${inquiry.callType} • ${inquiry.meetingDay}` : 'Not requested'}</p>
                        </div>

                        <div className="space-y-2 text-sm text-neutral-300">
                          <p><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Platforms</span><br />{inquiry.platforms.length ? inquiry.platforms.join(', ') : 'Not provided'}</p>
                          <p><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Deliverables</span><br />{inquiry.deliverables.length ? inquiry.deliverables.join(', ') : 'Not provided'}</p>
                          <p><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Estimate Summary</span><br />{inquiry.estimateSummary || 'Not provided'}</p>
                          <p><span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Recommended Package</span><br />{inquiry.recommendedPackage || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-4">
                        <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">Project Details</p>
                        <p className="mt-2 text-sm leading-relaxed text-neutral-300">{inquiry.story || 'No additional details provided.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : localTab === 'upload' ? (
            
            // VISUAL MEDIA ORGANIZER PANE (Requirement 7)
            <section className="space-y-6">
              <div>
                <h1 className="font-sans text-2xl font-light">Media Lab Organizer</h1>
                <p className="font-mono text-[9px] text-[#525252] tracking-wider uppercase mt-1">Secure drag-and-drop ingestion parameters</p>
              </div>

              {/* GOOGLE DRIVE INTEGRATION SUITE */}
              <div className="border border-white/5 bg-[#090909]/60 p-6 rounded-lg space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Library className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-sans text-sm font-semibold text-white">Google Drive Cloud Storage</h3>
                      <p className="font-mono text-[8px] text-neutral-500 uppercase tracking-widest mt-0.5">Synchronize assets with direct Google transfer protocols</p>
                    </div>
                  </div>
                  <div>
                    {driveToken ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="font-mono text-[9px] uppercase tracking-wider text-green-400 font-medium">CONNECTED TO DRIVE</span>
                        <button
                          onClick={() => {
                            setDriveToken(null);
                            setAccessToken(null);
                          }}
                          className="font-mono text-[9px] text-[#737373] hover:text-white uppercase tracking-wider underline cursor-pointer ml-3"
                        >
                          Revoke
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGoogleDriveConnect}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded transition-all flex items-center gap-1.5"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Link Google Drive</span>
                      </button>
                    )}
                  </div>
                </div>

                {driveToken ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                      Google Drive works well as an internal media organizer and upload buffer, but it is not recommended as the final public host for live portfolio project media.
                    </div>

                    {/* Folder Navigation/Breadcrumbs */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 font-mono bg-black/40 px-3 py-2 rounded border border-white/5">
                      <button 
                        onClick={() => handleBreadcrumbClick(-1)}
                        className={`hover:text-white transition-colors ${currentFolderId === null ? 'text-white font-medium' : ''}`}
                      >
                        📂 My Drive
                      </button>
                      {folderPath.map((folder, i) => (
                        <React.Fragment key={folder.id}>
                          <span className="text-neutral-600">/</span>
                          <button
                            onClick={() => handleBreadcrumbClick(i)}
                            className={`hover:text-white transition-colors max-w-[120px] truncate ${i === folderPath.length - 1 ? 'text-white font-medium' : ''}`}
                          >
                            {folder.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Drive Utilities Toolbars: Filter / Search / Create */}
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                      {/* Search & Filter */}
                      <div className="flex flex-wrap gap-2 items-center flex-1">
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            fetchDriveFiles();
                          }} 
                          className="relative flex-1 max-w-xs"
                        >
                          <input
                            type="text"
                            placeholder="Query clouds..."
                            value={driveSearch}
                            onChange={(e) => setDriveSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 font-mono focus:border-white focus:outline-none pl-8"
                          />
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                          {driveSearch && (
                            <button 
                              type="button" 
                              onClick={() => { setDriveSearch(''); }}
                              className="absolute right-2.5 top-2 text-neutral-400 text-[10px] font-sans"
                            >
                              ✕
                            </button>
                          )}
                        </form>

                        <div className="flex border border-white/10 rounded overflow-hidden">
                          {['all', 'image', 'video', 'folder'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setDriveFilterType(type as any)}
                              className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-wider transition-colors border-r border-white/5 last:border-none ${
                                driveFilterType === type 
                                  ? 'bg-neutral-800 text-white font-medium' 
                                  : 'bg-black/20 text-[#8c8c8c] hover:bg-neutral-900 hover:text-white'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual Refresh & Creations */}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={fetchDriveFiles}
                          title="Refresh Drive index"
                          className="p-1.5 text-neutral-400 hover:text-white border border-white/10 rounded bg-black/20"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCreateDriveFolder}
                          className="bg-neutral-950 hover:bg-neutral-900 text-neutral-300 font-mono text-[9px] border border-white/5 uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors flex items-center gap-1"
                        >
                          <FolderPlus className="h-3 w-3" />
                          <span>+ Folder</span>
                        </button>
                        <button
                          onClick={handleCreateDriveTextFile}
                          className="bg-neutral-950 hover:bg-neutral-900 text-neutral-300 font-mono text-[9px] border border-white/5 uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          <span>+ Text File</span>
                        </button>
                      </div>
                    </div>

                    {/* Drive Upload Toggles */}
                    <div className="flex items-center space-x-2 bg-black/30 p-2.5 rounded border border-white/5">
                      <input
                        type="checkbox"
                        id="toggle-drive-upload"
                        checked={uploadToDrive}
                        onChange={(e) => setUploadToDrive(e.target.checked)}
                        className="rounded border-white/10 bg-black/40 text-blue-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
                      />
                      <label htmlFor="toggle-drive-upload" className="font-mono text-[9.5px] text-neutral-300 uppercase tracking-widest cursor-pointer select-none">
                        Use Google Drive as the default destination for newly uploaded media
                      </label>
                    </div>
                    <p className="text-[11px] font-sans text-neutral-500 leading-relaxed">
                      When Drive is connected, uploaded assets will go there first by default. If Drive is unavailable, the Media Lab falls back to the local in-session buffer.
                    </p>

                    {/* Files Listing Grid */}
                    {driveLoading ? (
                      <div className="py-12 text-center text-neutral-400 font-mono text-xs animate-pulse">
                        Siphoning Google Drive payload registry...
                      </div>
                    ) : driveError ? (
                      <div className="p-4 bg-red-950/25 border border-red-900/45 rounded text-xs text-red-400 font-mono text-center">
                        Auth mismatch: {driveError}
                      </div>
                    ) : driveFiles.length === 0 ? (
                      <div className="py-12 border border-dashed border-white/5 rounded text-center text-xs text-[#525252] font-mono uppercase tracking-widest">
                        Zero items matched this folder filter
                      </div>
                    ) : (
                      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 max-h-[300px] overflow-y-auto pr-1">
                        {driveFiles.map((file) => {
                          const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                          const isImg = file.mimeType?.startsWith('image/');
                          const isVid = file.mimeType?.startsWith('video/') || file.name.endsWith('.mp4');

                          return (
                            <div 
                              key={file.id} 
                              className="group relative bg-[#060606] hover:bg-neutral-900/40 p-2.5 rounded border border-white/5 transition-colors flex flex-col justify-between"
                            >
                              <div className="relative aspect-video rounded overflow-hidden bg-black flex items-center justify-center mb-2">
                                {isFolder ? (
                                  <Folder className="h-8 w-8 text-amber-500/80" />
                                ) : isImg && file.thumbnailLink ? (
                                  <img
                                    src={file.thumbnailLink}
                                    alt={file.name}
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : isVid ? (
                                  <FileVideo className="h-8 w-8 text-blue-400/80" />
                                ) : (
                                  <FileText className="h-8 w-8 text-neutral-500" />
                                )}

                                <div className="absolute top-1.5 right-1.5 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <a 
                                    href={file.webViewLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    title="View in Google Drive"
                                    className="p-1 rounded bg-black/80 hover:bg-black text-neutral-400 hover:text-white"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  <button
                                    onClick={() => handleDeleteDriveFile(file.id, file.name)}
                                    title="Delete from Google Drive"
                                    className="p-1 rounded bg-red-950/80 hover:bg-red-900 text-red-500 hover:text-red-400"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="font-sans text-xs font-light text-neutral-200 truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="font-mono text-[7.5px] uppercase text-neutral-500 tracking-wider truncate">
                                  {isFolder ? 'Folder' : isImg ? 'Image' : isVid ? 'Video' : 'File'}
                                </p>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-white/5 flex gap-1.5">
                                {isFolder ? (
                                  <button
                                    onClick={() => handleFolderClick(file.id, file.name)}
                                    className="w-full bg-neutral-900 hover:bg-neutral-850 hover:text-white text-neutral-400 font-mono text-[8px] uppercase tracking-wider py-1 rounded"
                                  >
                                    Open
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSelectDriveFile(file)}
                                    className="w-full bg-blue-900/40 hover:bg-blue-800 text-blue-300 hover:text-white font-mono text-[8px] uppercase tracking-wider py-1 rounded"
                                  >
                                    Select
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-6 text-center text-neutral-500 border border-dashed border-white/5 rounded flex flex-col items-center justify-center space-y-3 p-4">
                    <p className="font-sans text-xs font-light text-neutral-400 max-w-sm leading-relaxed">
                      Connect your Google Drive repository directly to browse, select, search, upload, and update physical high-res visual templates in real-time.
                    </p>
                    <button
                      onClick={handleGoogleDriveConnect}
                      className="bg-neutral-800 hover:bg-white hover:text-black text-neutral-200 font-mono text-[8.5px] uppercase tracking-widest px-3.5 py-2 rounded transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Lock className="h-3 w-3" />
                      <span>Authenticate Google Cloud Storage</span>
                    </button>
                  </div>
                )}
              </div>

              {/* DRAG AND DROP UPLOADER CONTAINER */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                  dragOver 
                    ? 'border-white bg-white/5 scale-[1.015]' 
                    : 'border-white/10 bg-[#090909]/40 hover:border-white/20'
                }`}
                id="media-uploader-dropzone"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleManualFileSelection}
                  accept="image/*,video/mp4"
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="h-14 w-14 rounded-full border border-white/5 bg-black/60 flex items-center justify-center text-neutral-400">
                    <Upload className="h-6 w-6 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-light text-white">
                      Drag & Drop custom Image or MP4 video file
                    </p>
                    <p className="font-mono text-[9px] text-neutral-500 uppercase mt-1.5 tracking-wider">
                      Or click to browse device filesystem
                    </p>
                  </div>
                </div>

                {/* Simulated file loader progress indicators */}
                {uploadProgress !== null && (
                  <div className="mt-6 max-w-xs mx-auto space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#a3a3a3]">
                      <span>{uploadStatus}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1 w-full bg-neutral-800 overflow-hidden relative">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* GALLERY ORGANIZATION SHOWCASE */}
              <div>
                <p className="font-mono text-[9px] tracking-[0.25em] text-[#525252] uppercase mb-4">INGESTION MEDIA BUFFER LIBRARY ({uploadedMediaList.length})</p>
                
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                  {uploadedMediaList.map((asset) => (
                    <div key={asset.id} className="group relative border border-white/5 bg-[#090909] aspect-square rounded overflow-hidden">
                      {asset.type === 'image' ? (
                        <img 
                          src={asset.url} 
                          alt="Asset catalog" 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-neutral-900 border border-white/10 text-center">
                          <FileVideo className="h-7 w-7 text-[#737373] mb-2" />
                          <p className="font-mono text-[8.5px] uppercase tracking-wider text-[#a3a3a3] truncate w-full">{asset.caption || 'Video File'}</p>
                          <span className="font-mono text-[7px] text-[#525252] mt-1 uppercase">STREAM SNIPPET</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center select-none">
                        <button
                          onClick={() => {
                            if (confirm('Verify: Delete this local visual asset?')) {
                              setUploadedMediaList(uploadedMediaList.filter(m => m.id !== asset.id));
                            }
                          }}
                          className="text-red-500 bg-black/80 px-2 py-1 text-[9px] font-mono uppercase tracking-widest rounded border border-red-500/15 hover:text-red-400"
                        >
                          Erase
                        </button>
                      </div>

                      <div className="absolute bottom-2 left-2 truncate max-w-[80%] bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-[#a3a3a3] border border-white/5">
                        {asset.caption?.substring(0, 16) || 'Untitled.dat'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </section>
          ) : (
            
            // SECURITY SETTINGS PANE (New Security Customizer Segment)
            <section className="space-y-8 animate-[fade-in_0.5s_ease-out]">
              <div>
                <h1 className="font-sans text-2xl font-light">Custom Security & Link Customizer</h1>
                <p className="font-mono text-[9px] text-[#525252] tracking-wider uppercase mt-1">Configure your custom private entrance parameters and password locker</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                
                {/* Private link settings card */}
                <div className="border border-white/5 bg-[#090909]/60 p-6 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <LinkIcon className="h-4 w-4 text-neutral-400" />
                    <h3 className="font-sans text-sm font-semibold text-white">Private Gate Link</h3>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    By default, the admin page has been unlisted from public menus. To reach it, bookmark or enter this private browser link:
                  </p>

                  <div className="bg-black border border-white/10 px-3 py-2.5 rounded flex flex-col gap-1">
                    <span className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">YOUR CURRENT PRIVATE ENTRANCE:</span>
                    <span className="font-mono text-[11px] text-white select-all break-all" id="bookmark-private-link-display">
                      {window.location.origin}/#/{adminSlug}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="font-mono text-[8.5px] text-neutral-500 uppercase tracking-widest block">
                      CUSTOM PRIVATE ROUTE SLUG
                    </label>
                    <div className="flex gap-2">
                      <span className="bg-black/50 border border-white/5 px-3 py-2 rounded text-neutral-500 font-mono text-xs flex items-center">#/</span>
                      <input
                        type="text"
                        placeholder="e.g. private-studio-access"
                        value={adminSlug}
                        onChange={(e) => {
                          const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '');
                          setAdminSlug(sanitized);
                        }}
                        className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-white focus:outline-none font-mono"
                        id="security-slug-input"
                      />
                    </div>
                    <p className="text-[9px] text-[#737373] font-mono mt-1">Accepts lowercase alphanumeric, hyphens, and underscores. Saves instantly.</p>
                  </div>
                </div>

                <div className="border border-white/5 bg-[#090909]/60 p-6 rounded-lg space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                    <Lock className="h-4 w-4 text-neutral-400" />
                    <h3 className="font-sans text-sm font-semibold text-white">Admin Authentication</h3>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Admin access now relies on verified Google sign-in and Firestore rules, not a browser-stored password.
                  </p>

                  <div className="rounded border border-white/10 bg-black/40 px-3 py-3 text-xs text-neutral-300 font-mono">
                    ACCESS REQUIRES THE AUTHORIZED GOOGLE ACCOUNT
                  </div>

                  <div className="border border-green-500/10 bg-green-500/5 p-3 rounded flex items-start gap-2 text-green-400 font-mono text-[9.5px]">
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">GOOGLE AUTH ENFORCED</p>
                      <p className="text-neutral-400 mt-0.5 font-sans">Only the authorized Google account can enter the admin area and perform Firestore writes.</p>
                    </div>
                  </div>
                </div>

              </div>

              <div className="border border-white/5 bg-[#090909]/60 p-6 rounded-lg space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <AlertCircle className="h-4 w-4 text-neutral-400" />
                  <h3 className="font-sans text-sm font-semibold text-white">Live Diagnostics</h3>
                </div>

                {projectsError && (
                  <div className="rounded border border-red-900/40 bg-red-950/20 p-3 text-sm text-red-300">
                    Portfolio sync issue: {projectsError}
                  </div>
                )}

                {diagnosticEvents.length === 0 ? (
                  <div className="rounded border border-white/10 bg-black/30 p-4 text-[11px] text-neutral-400">
                    No diagnostic events captured yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {diagnosticEvents.map((event) => (
                      <div key={event.id} className="rounded border border-white/8 bg-black/30 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${
                              event.level === 'error'
                                ? 'bg-red-950/40 text-red-300'
                                : event.level === 'warning'
                                  ? 'bg-amber-500/15 text-amber-200'
                                  : 'bg-white/10 text-neutral-300'
                            }`}>
                              {event.level}
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500">{event.source}</span>
                          </div>
                          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">{event.createdAt}</span>
                        </div>
                        <p className="mt-2 text-sm text-neutral-300">{event.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cloud Database Integration Status Row */}
              <div className="border border-white/5 bg-[#090909]/60 p-6 rounded-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${firebaseUser ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${firebaseUser ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    </div>
                    <h3 className="font-sans text-sm font-semibold text-white">Live Cloud Database Status</h3>
                  </div>
                  <span className="font-mono text-[9px] text-[#737373] uppercase tracking-[0.2em]">
                    V2 Zero-Trust ABAC Guarded
                  </span>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      This application connects to the configured Cloud Firestore instance for Firebase project `{firebaseProjectId}` using database `{firestoreDatabaseLabel}`.
                    </p>
                    <div className="bg-black/60 border border-white/5 px-3 py-2 rounded font-mono text-[10px] text-[#a3a3a3] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-neutral-500 uppercase">PROJECT:</span>
                        <span className="text-white select-all font-mono">{firebaseProjectId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 uppercase">DATABASE:</span>
                        <span className="text-white font-mono">{firestoreDatabaseLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 uppercase">COLLECTION:</span>
                        <span className="text-white font-mono">projects</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500 uppercase">IDENTITY TIER:</span>
                        <span>{firebaseUser ? <span className="text-green-400 font-mono font-medium">AUTHORIZED</span> : <span className="text-amber-400 font-mono font-medium">ANONYMOUS READER</span>}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col justify-center">
                    {firebaseUser ? (
                      <div className="space-y-3">
                        <div className="border border-green-500/10 bg-green-500/5 p-3 rounded">
                          <p className="font-mono text-[9.5px] font-bold text-green-400 uppercase tracking-widest">ADMIN CONNECTOR ON</p>
                          <p className="font-sans text-[11px] text-neutral-300 mt-0.5 truncate">{firebaseUser.email}</p>
                          {firebaseUser.email !== 'Besofekad@gmail.com' && (
                            <p className="font-sans text-[9px] text-red-400 mt-1">Warning: Only Besofekad@gmail.com has cloud write permissions.</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnectFirebase}
                          className="w-full border border-white/10 px-4 py-2 text-[10px] uppercase font-mono tracking-wider text-neutral-400 hover:text-white hover:border-white transition-all bg-black/40 rounded-full"
                        >
                          Disconnect Admin Account
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[11px] text-neutral-400 leading-relaxed">
                          To gain **publish, modify, or delete** rights over the live exhibits in the database, authorize using your Google login:
                        </p>
                        <button
                          type="button"
                          onClick={handleConnectFirebase}
                          className="w-full bg-white text-black hover:bg-neutral-200 outline-none px-4 py-2.5 text-[10px] uppercase font-mono font-bold tracking-wider transition-all rounded-full flex items-center justify-center gap-2"
                        >
                          Connect Google Admin Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Database seeding utility row */}
                <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="max-w-xl">
                    <h4 className="font-sans text-xs font-semibold text-white">Database Initialization Tool</h4>
                    <p className="text-[10px] text-neutral-500 mt-0.5">If your live cloud database is blank, synchronize the core high-contrast mock exhibits instantly. Note: this requires admin authorization.</p>
                  </div>
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={handleSeedDatabase}
                    className="shrink-0 border border-white/10 px-4 py-2 text-[10px] uppercase font-mono tracking-wider hover:bg-white hover:text-black transition-all bg-[#121212] disabled:opacity-40 rounded"
                  >
                    {seeding ? 'Seeding...' : 'Seed Cloud Exhibits'}
                  </button>
                </div>
              </div>

              {/* Informational tip card */}
              <div className="border border-white/5 bg-[#0b0b0b]/40 p-4 rounded-lg flex gap-4 items-center">
                <div className="h-9 w-9 rounded bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                  <Sparkles className="h-4 w-4 text-neutral-300" />
                </div>
                <div>
                  <p className="text-xs text-neutral-300 font-semibold">Security Guideline</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Since the page is unlisted from normal navigations, bookmark the private URL safely to access the dashboard next time.</p>
                </div>
              </div>
            </section>
          )}

        </main>

      </div>
    </div>
  );
}

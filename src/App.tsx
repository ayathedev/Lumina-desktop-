import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  StickyNote, 
  Camera as CameraIcon, 
  Folder, 
  Settings as SettingsIcon, 
  X, 
  Minus, 
  Maximize2, 
  Grid,
  Search,
  Clock,
  Wifi,
  Battery,
  Volume2,
  Calendar,
  User,
  Power,
  RefreshCw,
  Database,
  Bell,
  UserPlus,
  Check,
  Globe,
  Briefcase,
  GraduationCap,
  Award,
  MessageSquare,
  Heart,
  Share2,
  MoreHorizontal,
  File,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Download,
  Play,
  Gamepad2,
  LayoutGrid,
  Home,
  Library,
  Compass,
  ThumbsUp,
  ThumbsDown,
  EyeOff,
  Palette,
  HardDrive,
  Info,
  Monitor
} from 'lucide-react';
import { KernelProvider, useKernel } from './os/Kernel';
import { GalleryApp } from './galleryApp';
import { SystemPolicy, AppManifest, UserRecord } from './os/types';

// --- Apps ---

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}


export type PowerMode = 'battery-saver' | 'balanced' | 'performance';

export type AppDefinition = {
  id: string;
  name: string;
  icon: React.FC<any>;
  color: string;
  component: React.FC<any>;
  url?: string;
};

export const SystemContext = createContext<{
  accentColor: string;
  setAccentColor: (color: string) => void;
  powerMode: PowerMode;
  setPowerMode: (mode: PowerMode) => void;
  installedApps: AppDefinition[];
  installApp: (app: AppDefinition) => void;
  uninstallApp: (appId: string) => void;
  autoAddToDock: boolean;
  setAutoAddToDock: (auto: boolean) => void;
  dockApps: string[];
  setDockApps: (apps: string[]) => void;
}>({
  accentColor: '#3b82f6',
  setAccentColor: () => {},
  powerMode: 'balanced',
  setPowerMode: () => {},
  installedApps: [],
  installApp: () => {},
  uninstallApp: () => {},
  autoAddToDock: true,
  setAutoAddToDock: () => {},
  dockApps: [],
  setDockApps: () => {},
});

const NoteApp = () => {
  const [note, setNote] = useState('');
  const [fileName, setFileName] = useState('untitled.note');
  const { addPost } = useContext(SocialContext);
  const [shared, setShared] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleShare = () => {
    if (!note.trim()) return;
    addPost({ type: 'text', content: note });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const handleSave = () => {
    const blob = new Blob([note], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.endsWith('.note') ? fileName : `${fileName}.note`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNew = () => {
    setNote('');
    setFileName('untitled.note');
  };

  const menuItems: Record<string, { label: string; action: () => void }[]> = {
    File: [
      { label: 'New', action: handleNew },
      { label: 'Save', action: handleSave },
      { label: 'Share to Profile', action: handleShare },
    ],
    Edit: [
      { label: 'Clear All', action: () => setNote('') },
      { label: 'Select All', action: () => {
        const textarea = document.querySelector('textarea');
        textarea?.select();
      }},
    ],
    View: [
      { label: 'Full Screen', action: () => {} },
      { label: 'Zoom In', action: () => {} },
      { label: 'Zoom Out', action: () => {} },
    ],
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Menu Bar */}
      <div className="flex bg-slate-100 border-bottom border-slate-200 px-2 py-1 gap-4 text-xs font-medium text-slate-600 relative z-50">
        {Object.keys(menuItems).map(menu => (
          <div key={menu} className="relative">
            <button 
              onClick={() => setActiveMenu(activeMenu === menu ? null : menu)}
              className={`px-2 py-1 rounded hover:bg-slate-200 transition-colors ${activeMenu === menu ? 'bg-slate-200' : ''}`}
            >
              {menu}
            </button>
            {activeMenu === menu && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden py-1">
                {menuItems[menu].map(item => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="ml-auto flex items-center gap-2 px-2 text-slate-400 italic">
          {fileName}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col relative" onClick={() => setActiveMenu(null)}>
        <textarea
          className="flex-1 bg-transparent border-none outline-none resize-none text-slate-800 placeholder:text-slate-400 font-mono text-sm leading-relaxed"
          placeholder="Type something..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button 
            onClick={handleShare}
            disabled={!note.trim() || shared}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-sm font-bold rounded-full transition-all shadow-md flex items-center gap-2"
          >
            {shared ? 'Posted!' : 'Post to Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CameraApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { addPost } = useContext(SocialContext);
  const [shared, setShared] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'none' | 'vintage' | 'bw' | 'sepia' | 'beauty'>('none');
  const { checkPermission } = useKernel();

  const applyFilterPreset = (filter: 'none' | 'vintage' | 'bw' | 'sepia' | 'beauty') => {
    setSelectedFilter(filter);
    if (filter === 'none') {
      setSettings(prev => ({ ...prev, brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, blur: 0 }));
    } else if (filter === 'vintage') {
      setSettings(prev => ({ ...prev, brightness: 90, contrast: 110, saturate: 80, sepia: 50, grayscale: 0, blur: 0 }));
    } else if (filter === 'bw') {
      setSettings(prev => ({ ...prev, brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 100, blur: 0 }));
    } else if (filter === 'sepia') {
      setSettings(prev => ({ ...prev, brightness: 100, contrast: 100, saturate: 100, sepia: 100, grayscale: 0, blur: 0 }));
    } else if (filter === 'beauty') {
      setSettings(prev => ({ ...prev, brightness: 110, contrast: 90, saturate: 110, sepia: 0, grayscale: 0, blur: 2 }));
    }
  };

  // Camera Settings
  const [settings, setSettings] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
    blur: 0,
    quality: 90,
    resolution: 'high' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    async function setupCamera() {
      if (!checkPermission('camera', 'camera')) {
        setError("Camera access is disabled by system policy.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Camera access denied or not available.");
      }
    }
    setupCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [checkPermission]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Apply filters to canvas
        ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturate}%) sepia(${settings.sepia}%) grayscale(${settings.grayscale}%) hue-rotate(${settings.hueRotate}deg) blur(${settings.blur}px)`;
        
        // Flip horizontally to match the mirrored video preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleShare = () => {
    if (!capturedImage) return;
    addPost({ type: 'photo', content: capturedImage });
    setShared(true);
    setTimeout(() => {
      setShared(false);
      setCapturedImage(null);
    }, 2000);
  };

  const filterStyle = {
    filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturate}%) sepia(${settings.sepia}%) grayscale(${settings.grayscale}%) hue-rotate(${settings.hueRotate}deg) blur(${settings.blur}px)`
  };

  return (
    <div className="h-full bg-black flex items-center justify-center relative overflow-hidden">
      {error ? (
        <div className="text-white/50 text-center p-4">
          <CameraIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="relative w-full h-full">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={filterStyle}
            className={`w-full h-full object-cover scale-x-[-1] ${capturedImage ? 'hidden' : ''}`} 
          />
          <canvas ref={canvasRef} className="hidden" />
          {capturedImage && (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          )}
        </div>
      )}
      
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="absolute right-0 top-0 bottom-0 w-64 bg-black/80 backdrop-blur-xl border-l border-white/10 p-6 z-50 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-bold">Adjustments</h3>
              <button onClick={() => setShowSettings(false)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-2">Filters</div>
                <div className="grid grid-cols-4 gap-2">
                  {(['none', 'vintage', 'bw', 'sepia', 'beauty'] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => applyFilterPreset(filter)}
                      className={`h-12 rounded-lg text-[9px] font-bold uppercase transition-all ${
                        selectedFilter === filter ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              {Object.entries(settings).map(([key, value]) => {
                if (key === 'quality' || key === 'resolution') return null;

                return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/40">
                    <span>{key}</span>
                    <span>{value}</span>
                  </div>
                  <input 
                    type="range" 
                    min={key === 'hueRotate' ? 0 : 0} 
                    max={key === 'hueRotate' ? 360 : (key === 'blur' ? 20 : 200)} 
                    value={value}
                    onChange={(e) => setSettings(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
                );
              })}
              
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/40">
                    <span>Quality</span>
                    <span>{settings.quality}%</span>
                  </div>
                  <input 
                    type="range" 
                    min={10} 
                    max={100} 
                    value={settings.quality}
                    onChange={(e) => setSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-white/40">Resolution</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map(res => (
                      <button
                        key={res}
                        onClick={() => setSettings(prev => ({ ...prev, resolution: res }))}
                        className={`py-1 rounded text-[9px] font-bold uppercase transition-all ${
                          settings.resolution === res ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSettings({ 
                    brightness: 100, 
                    contrast: 100, 
                    saturate: 100, 
                    sepia: 0, 
                    grayscale: 0, 
                    hueRotate: 0, 
                    blur: 0, 
                    quality: 90, 
                    resolution: 'high'
                  });
                  setSelectedFilter('none');
                }}
                className="w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Reset All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!capturedImage ? (
        <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-12">
          {/* Mode Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setMode(mode === 'photo' ? 'video' : 'photo')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${mode === 'video' ? 'bg-red-500 text-white' : 'bg-white/20 text-white'}`}
            >
              {mode === 'photo' ? <CameraIcon size={20} /> : <div className="w-3 h-3 bg-white rounded-sm" />}
            </button>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{mode}</span>
          </div>

          {/* Shutter */}
          <button 
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-95"
          >
            <div className={`w-16 h-16 rounded-full transition-all ${mode === 'video' ? 'bg-red-500 scale-75 rounded-lg' : 'bg-white'}`} />
          </button>

          {/* Settings Toggle */}
          <div className="flex flex-col items-center gap-1">
            <button 
              onClick={() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
            >
              <SettingsIcon size={20} />
            </button>
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Adjust</span>
          </div>
        </div>
      ) : (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
          <button 
            onClick={() => setCapturedImage(null)}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full transition-all backdrop-blur-md"
          >
            Retake
          </button>
          <button 
            onClick={handleShare}
            disabled={shared}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-bold rounded-full transition-all shadow-lg"
          >
            {shared ? 'Posted!' : 'Post to Profile'}
          </button>
        </div>
      )}
    </div>
  );
};

export type FileSystemItem = {
  name: string;
  type: 'folder' | 'file';
  children?: FileSystemItem[];
  icon?: React.ReactNode;
  content?: string;
};

const INITIAL_FS: FileSystemItem = {
  name: 'OS',
  type: 'folder',
  children: [
    {
      name: 'System',
      type: 'folder',
      children: [
        { name: 'Config', type: 'folder', children: [] },
        { name: 'Library', type: 'folder', children: [] },
        {
          name: 'Extensions',
          type: 'folder',
          children: [
            { name: 'Profile.app', type: 'file' },
            { name: 'Note.app', type: 'file' },
            { name: 'Camera.app', type: 'file' },
            { name: 'Files.app', type: 'file' },
            { name: 'Settings.app', type: 'file' },
          ],
        },
      ],
    },
    {
      name: 'User',
      type: 'folder',
      children: [
        {
          name: 'Home',
          type: 'folder',
          children: [
            { name: 'Documents', type: 'folder', children: [] },
            { name: 'Downloads', type: 'folder', children: [] },
            { name: 'Pictures', type: 'folder', children: [] },
            { name: 'Videos', type: 'folder', children: [] },
            { name: 'Audio', type: 'folder', children: [] },
            { name: 'App Installers', type: 'folder', children: [] },
          ],
        },
      ],
    },
    { name: 'Extensions', type: 'folder', children: [] },
  ],
};

const FilesApp = () => {
  const [currentPath, setCurrentPath] = useState<FileSystemItem[]>(() => {
    const os = INITIAL_FS;
    const user = os.children?.find(c => c.name === 'User');
    const home = user?.children?.find(c => c.name === 'Home');
    
    if (os && user && home) {
      return [os, user, home];
    }
    return [os];
  });
  const currentFolder = currentPath[currentPath.length - 1];

  const navigateTo = (item: FileSystemItem) => {
    if (item.type === 'folder') {
      setCurrentPath([...currentPath, item]);
    } else {
      // Handle file opening
      console.log('Opening file:', item.name);
    }
  };

  const goBack = () => {
    if (currentPath.length > 1) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Navigation Bar */}
      <div className="flex items-center gap-2 p-2 bg-slate-100 border-b border-slate-200">
        <button 
          onClick={goBack}
          disabled={currentPath.length <= 1}
          className="p-1 hover:bg-slate-200 rounded disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex items-center gap-1 text-xs font-medium text-slate-600 overflow-x-auto no-scrollbar">
          {currentPath.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight size={12} className="text-slate-400 flex-shrink-0" />}
              <span 
                className="hover:underline cursor-pointer whitespace-nowrap"
                onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
              >
                {item.name}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
          {currentFolder.children?.map(item => (
            <div 
              key={item.name} 
              onClick={() => navigateTo(item)}
              className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors group text-center"
            >
              <div className="w-12 h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                {item.type === 'folder' ? (
                  <Folder size={40} className="text-blue-500 fill-blue-500/10" />
                ) : (
                  <File size={40} className="text-slate-400" />
                )}
              </div>
              <span className="text-[10px] text-slate-700 font-bold w-full uppercase tracking-wider break-words leading-tight">{item.name}</span>
            </div>
          ))}
          {(!currentFolder.children || currentFolder.children.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Folder size={48} className="opacity-20 mb-2" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">This folder is empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const WallpaperContext = createContext<{
  wallpaper: string | null;
  setWallpaper: (url: string | null) => void;
}>({ wallpaper: null, setWallpaper: () => {} });

export type Comment = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: number;
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  type: 'text' | 'photo' | 'video';
  content: string;
  timestamp: number;
  likes: string[]; // array of userIds
  comments: Comment[];
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  year: string;
};

export type UserProfile = {
  id: string;
  name: string;
  bio: string;
  role: string;
  company?: string;
  location: string;
  avatar: string;
  coverPhoto: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  connections: string[]; // array of userIds
};

export type Notification = {
  id: string;
  type: 'like' | 'comment' | 'connection_request' | 'connection_accepted';
  fromId: string;
  fromName: string;
  fromAvatar: string;
  postId?: string;
  timestamp: number;
  read: boolean;
};

export type SocialContextType = {
  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'authorId' | 'authorName' | 'authorAvatar'>) => void;
  likePost: (postId: string, userId: string) => void;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  profiles: Record<string, UserProfile>;
  updateProfile: (profile: UserProfile) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationsAsRead: () => void;
  sendConnectionRequest: (fromId: string, toId: string) => void;
  acceptConnectionRequest: (fromId: string, toId: string) => void;
};

export const SocialContext = createContext<SocialContextType>({ 
  posts: [], 
  addPost: () => {}, 
  likePost: () => {}, 
  addComment: () => {},
  profiles: {},
  updateProfile: () => {},
  notifications: [],
  addNotification: () => {},
  markNotificationsAsRead: () => {},
  sendConnectionRequest: () => {},
  acceptConnectionRequest: () => {}
});

const SettingsApp = () => {
  const { wallpaper, setWallpaper } = useContext(WallpaperContext);
  const { accentColor, setAccentColor, autoAddToDock, setAutoAddToDock } = useContext(SystemContext);
  const { profiles, updateProfile } = useContext(SocialContext);
  const profile = profiles['me'];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<'user' | 'appearance' | 'system' | 'storage' | 'about'>('appearance');

  const colors = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Slate', value: '#64748b' },
  ];

  const handleLocalPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setWallpaper(url);
    }
  };

  const handleGenerateAI = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const imageUrl = `data:image/png;base64,${base64EncodeString}`;
          setWallpaper(imageUrl);
          break;
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full bg-slate-50/50">
      {/* Sidebar */}
      <div className="w-64 border-r border-slate-200/50 bg-white/50 backdrop-blur-md p-4 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">Settings</h2>
        
        <button 
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'user' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-100/50'}`}
        >
          <User size={18} /> User
        </button>
        <button 
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'appearance' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-100/50'}`}
        >
          <Palette size={18} /> Appearance
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'system' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-100/50'}`}
        >
          <SettingsIcon size={18} /> System
        </button>
        <button 
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'storage' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-100/50'}`}
        >
          <HardDrive size={18} /> Storage
        </button>
        <button 
          onClick={() => setActiveTab('about')}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'about' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-100/50'}`}
        >
          <Info size={18} /> About
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'user' && (
          <div className="max-w-2xl mx-auto pb-20">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Edit Profile</h3>
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <div className="h-48 bg-slate-200">
                <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
              </div>
              <div className="px-8 pb-8">
                <div className="relative -mt-16 mb-4">
                  <img src={profile.avatar} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-white object-cover" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                    <input type="text" defaultValue={profile.name} onChange={e => updateProfile({...profile, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Bio</label>
                    <textarea defaultValue={profile.bio} onChange={e => updateProfile({...profile, bio: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" rows={3} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Location</label>
                    <input type="text" defaultValue={profile.location} onChange={e => updateProfile({...profile, location: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="max-w-2xl space-y-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Appearance</h3>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: accentColor }} />
                  <span className="font-medium text-slate-800">Accent Color</span>
                </div>
                <button 
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  {showColorPicker ? 'Close' : 'Change'}
                </button>
              </div>
              
              {showColorPicker && (
                <div className="grid grid-cols-6 gap-3 pt-4 border-t border-slate-100">
                  {colors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => {
                        setAccentColor(color.value);
                        setShowColorPicker(false);
                      }}
                      className={`w-full aspect-square rounded-xl border-2 transition-all shadow-sm ${accentColor === color.value ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-4">
                {wallpaper ? (
                  <img src={wallpaper} alt="Current Wallpaper" className="w-16 h-16 rounded-xl object-cover shadow-sm" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm" />
                )}
                <div>
                  <span className="font-medium text-slate-800 block text-lg">Wallpaper</span>
                  <span className="text-slate-500 text-sm">Customize your desktop background</span>
                </div>
              </div>
              
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Local Photo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleLocalPhoto} 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
                  >
                    Browse Files
                  </button>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700 block">AI Generation</span>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Describe an image..." 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-800 placeholder:text-slate-400"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <button 
                      onClick={handleGenerateAI}
                      disabled={isGenerating || !prompt}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex justify-center items-center shadow-sm"
                    >
                      {isGenerating ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="max-w-2xl space-y-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">System</h3>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 block text-lg">Add to Dock</span>
                  <p className="text-sm text-slate-500 mt-1">
                    Automatically add new apps to the dock upon install
                  </p>
                </div>
                <div 
                  onClick={() => setAutoAddToDock(!autoAddToDock)}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${autoAddToDock ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${autoAddToDock ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="max-w-2xl space-y-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Storage</h3>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="font-medium text-slate-800 text-lg">Macintosh HD</span>
                  <span className="text-sm text-slate-500">120 GB / 512 GB Used</span>
                </div>
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500" style={{ width: '15%' }} title="Apps" />
                  <div className="h-full bg-purple-500" style={{ width: '5%' }} title="Documents" />
                  <div className="h-full bg-amber-500" style={{ width: '3.4%' }} title="System" />
                </div>
                <div className="flex gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> <span className="text-slate-600">Apps</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" /> <span className="text-slate-600">Documents</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> <span className="text-slate-600">System</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-2xl space-y-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">About</h3>
            
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-lg flex items-center justify-center mb-2">
                <Monitor size={48} className="text-white" />
              </div>
              <h4 className="text-3xl font-black text-slate-800 tracking-tight">Lumina OS</h4>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">Version 1.0.0</span>
              
              <p className="text-slate-600 leading-relaxed max-w-lg mt-6">
                Lumina OS was envisioned and inspired by <strong className="text-slate-800">Aya Kalimah Satya Ruane</strong>, an incredibly awesome individual who excels at absolutely everything they do. From brilliant creative ideas to unparalleled technical prowess, Aya makes the digital world a better place.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CalendarApp = ({ isMaximized }: { isMaximized?: boolean }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white/20 rounded-full transition-colors">&lt;</button>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white/20 rounded-full transition-colors">&gt;</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2 flex-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const isToday = i + 1 === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
          return (
            <div key={i} className={`flex items-center justify-center rounded-xl hover:bg-white/30 cursor-pointer transition-all ${isToday ? 'bg-blue-500 text-white font-bold shadow-md' : 'text-slate-700 font-medium bg-white/10'}`}>
              {i + 1}
            </div>
          );
        })}
      </div>
      {isMaximized && (
        <div className="mt-8 pt-8 border-t border-white/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            <div className="p-4 bg-white/20 rounded-xl border border-white/10">
              <div className="font-bold text-slate-800">Team Sync</div>
              <div className="text-sm font-medium text-slate-600">10:00 AM - 11:00 AM</div>
            </div>
            <div className="p-4 bg-white/10 rounded-xl border border-white/5">
              <div className="font-bold text-slate-800">Lunch with Client</div>
              <div className="text-sm font-medium text-slate-600">12:30 PM - 2:00 PM</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const PowerApp = () => {
  const { powerMode, setPowerMode } = useContext(SystemContext);

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col items-center justify-center py-8 bg-white/10 rounded-3xl border border-white/10">
        <Battery size={64} className={`${powerMode === 'battery-saver' ? 'text-amber-500' : 'text-green-500'} mb-4 drop-shadow-md`} />
        <h2 className="text-5xl font-black text-slate-800 tracking-tight">85%</h2>
        <p className="text-slate-500 font-bold mt-2">4 hours, 20 minutes remaining</p>
      </div>
      
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Power Mode</h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setPowerMode('battery-saver')}
            className={`p-4 rounded-2xl text-sm font-bold transition-all border ${powerMode === 'battery-saver' ? 'bg-amber-500 text-white border-amber-600 shadow-lg shadow-amber-500/30' : 'bg-white/10 text-slate-600 border-white/5 hover:bg-white/20'}`}
          >
            Battery Saver
          </button>
          <button 
            onClick={() => setPowerMode('balanced')}
            className={`p-4 rounded-2xl text-sm font-bold transition-all border ${powerMode === 'balanced' ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/30' : 'bg-white/10 text-slate-600 border-white/5 hover:bg-white/20'}`}
          >
            Balanced
          </button>
          <button 
            onClick={() => setPowerMode('performance')}
            className={`p-4 rounded-2xl text-sm font-bold transition-all border ${powerMode === 'performance' ? 'bg-indigo-500 text-white border-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-white/10 text-slate-600 border-white/5 hover:bg-white/20'}`}
          >
            Performance
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Battery Usage</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-md"><Folder size={20} className="text-white" /></div>
              <span className="font-bold text-slate-800 text-lg">Files</span>
            </div>
            <span className="text-lg font-black text-slate-600">45%</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shadow-md"><StickyNote size={20} className="text-white" /></div>
              <span className="font-bold text-slate-800 text-lg">Note</span>
            </div>
            <span className="text-lg font-black text-slate-600">20%</span>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProfileApp = () => {
  const { 
    posts, 
    addPost, 
    likePost, 
    addComment, 
    profiles, 
    updateProfile, 
    notifications, 
    markNotificationsAsRead,
    sendConnectionRequest,
    acceptConnectionRequest
  } = useContext(SocialContext);
  
  const currentUserId = 'me';
  const profile = profiles[currentUserId];

  const [activeTab, setActiveTab] = useState<'feed' | 'about' | 'connections' | 'notifications' | 'settings'>('feed');
  const [feedType, setFeedType] = useState<'all' | 'connections'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const [newPostText, setNewPostText] = useState('');
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);
  
  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  
  const [newExp, setNewExp] = useState<Omit<Experience, 'id'>>({ company: '', role: '', period: '', description: '' });
  const [newEdu, setNewEdu] = useState<Omit<Education, 'id'>>({ school: '', degree: '', year: '' });
  const [newSkill, setNewSkill] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length > 0;
    setShowNotificationBadge(unread);
  }, [notifications]);

  const handleSave = () => {
    updateProfile(editForm);
    setIsEditing(false);
  };

  const handlePostSubmit = () => {
    if (!newPostText.trim()) return;
    addPost({ type: 'text', content: newPostText });
    setNewPostText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const content = reader.result as string;
      const type = file.type.startsWith('video/') ? 'video' : 'photo';
      addPost({ type, content });
    };
    reader.readAsDataURL(file);
  };

  const handleCommentSubmit = (postId: string) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;
    addComment(postId, {
      authorId: currentUserId,
      authorName: profile.name,
      authorAvatar: profile.avatar,
      text: text
    });
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
  };

  const filteredPosts = posts.filter(post => {
    if (feedType === 'all') return true;
    return profile.connections.includes(post.authorId) || post.authorId === currentUserId;
  });

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const searchedProfiles = (Object.values(profiles) as UserProfile[]).filter(p => 
    p.id !== currentUserId && 
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header / Cover */}
      <div className="relative flex-shrink-0">
        <div className="h-48 w-full overflow-hidden">
          <img src={profile.coverPhoto} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="absolute -bottom-16 left-8 flex items-end gap-6">
          <div className="relative group">
            <img 
              src={profile.avatar} 
              alt="Avatar" 
              className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover bg-white"
              referrerPolicy="no-referrer"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <CameraIcon className="text-white" size={24} />
              </div>
            )}
          </div>
          <div className="mb-4 pb-2">
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-lg">{profile.name}</h2>
            <p className="text-white/90 font-bold flex items-center gap-1 drop-shadow-md">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {profile.location}
            </p>
          </div>
        </div>
        <div className="absolute bottom-4 right-8 flex gap-3">
          {isEditing ? (
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <Check size={18} />
                Save Changes
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-xl transition-all shadow-lg backdrop-blur-md"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-white/90 hover:bg-white text-slate-800 font-bold rounded-xl transition-all shadow-lg backdrop-blur-md flex items-center gap-2"
            >
              <SettingsIcon size={18} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-20 px-8 flex justify-between items-center border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex gap-8">
          {(['feed', 'about', 'connections', 'notifications', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'notifications') markNotificationsAsRead();
              }}
              className={`py-4 px-2 font-bold text-sm uppercase tracking-widest transition-all border-b-2 relative ${
                activeTab === tab 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab === 'feed' && <Globe size={16} />}
                {tab === 'about' && <User size={16} />}
                {tab === 'connections' && <UserPlus size={16} />}
                {tab === 'notifications' && <Bell size={16} />}
                {tab === 'settings' && <SettingsIcon size={16} />}
                {tab}
                {tab === 'notifications' && unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search Lumina Network..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab !== 'connections') setActiveTab('connections');
            }}
            className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeTab === 'feed' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Profile Summary */}
            <div className="hidden lg:block space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col items-center text-center">
                  <img src={profile.avatar} className="w-20 h-20 rounded-2xl object-cover mb-4" referrerPolicy="no-referrer" />
                  <h4 className="font-black text-slate-800">{profile.name}</h4>
                  <p className="text-xs text-slate-400 mb-4">{profile.role}</p>
                  <div className="w-full pt-4 border-t border-slate-50 flex justify-around">
                    <div className="text-center">
                      <div className="text-sm font-black text-slate-800">{profile.connections.length}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Connections</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-black text-slate-800">{posts.filter(p => p.authorId === currentUserId).length}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Posts</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <h5 className="font-black text-slate-800 text-sm mb-4">Trending Topics</h5>
                <div className="space-y-3">
                  {['#LuminaOS', '#FutureOfWork', '#TechDesign', '#OpenSource'].map(tag => (
                    <div key={tag} className="text-xs font-bold text-blue-500 hover:underline cursor-pointer">{tag}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-8">
              {/* Feed Filter */}
              <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit mx-auto">
                <button 
                  onClick={() => setFeedType('all')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${feedType === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Global Feed
                </button>
                <button 
                  onClick={() => setFeedType('connections')}
                  className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${feedType === 'connections' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  My Network
                </button>
              </div>

              {/* Create Post */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                <div className="flex gap-4">
                  <img src={profile.avatar} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <textarea
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder="Share an update, photo, or thought..."
                    className="flex-1 bg-slate-50 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none h-24 text-slate-800"
                  />
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors flex items-center gap-2 font-bold text-sm">
                      <CameraIcon size={20} />
                      Photo/Video
                    </button>
                  </div>
                  <button 
                    onClick={handlePostSubmit}
                    disabled={!newPostText.trim()}
                    className="px-8 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all shadow-md"
                  >
                    Post
                  </button>
                </div>
              </div>

              {/* Feed Posts */}
              <div className="space-y-6">
                {filteredPosts.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-medium">Your feed is quiet. Start the conversation!</p>
                  </div>
                ) : (
                  filteredPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img src={post.authorAvatar} alt="Avatar" className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                            <div>
                              <div className="font-bold text-slate-800">{post.authorName}</div>
                              <div className="text-xs text-slate-400">{new Date(post.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                          <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
                        
                        <div className="space-y-4">
                          {post.type === 'text' && <p className="text-slate-700 text-lg leading-relaxed">{post.content}</p>}
                          {post.type === 'photo' && (
                            <div className="rounded-2xl overflow-hidden border border-slate-100">
                              <img src={post.content} alt="Post" className="w-full max-h-[500px] object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          {post.type === 'video' && (
                            <video src={post.content} controls className="w-full rounded-2xl border border-slate-100" />
                          )}
                        </div>

                        <div className="flex items-center gap-6 mt-6 pt-4 border-t border-slate-50">
                          <button 
                            onClick={() => likePost(post.id, currentUserId)}
                            className={`flex items-center gap-2 font-bold text-sm transition-colors ${
                              post.likes.includes(currentUserId) ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
                            }`}
                          >
                            <Heart size={18} className={post.likes.includes(currentUserId) ? 'fill-current' : ''} />
                            {post.likes.length}
                          </button>
                          <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 font-bold text-sm transition-colors">
                            <MessageSquare size={18} />
                            {post.comments.length}
                          </button>
                          <button className="flex items-center gap-2 text-slate-500 hover:text-green-500 font-bold text-sm transition-colors ml-auto">
                            <Share2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="bg-slate-50 p-6 border-t border-slate-100">
                        <div className="space-y-4 mb-4">
                          {post.comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                              <img src={comment.authorAvatar} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                              <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-slate-200">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold text-xs text-slate-800">{comment.authorName}</span>
                                  <span className="text-[10px] text-slate-400">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-sm text-slate-600">{comment.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-3">
                          <img src={profile.avatar} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={commentTexts[post.id] || ''}
                              onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                              placeholder="Write a comment..."
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Sidebar - Suggestions */}
            <div className="hidden lg:block space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                <h5 className="font-black text-slate-800 text-sm mb-4">Who to follow</h5>
                <div className="space-y-4">
                  {(Object.values(profiles) as UserProfile[])
                    .filter(p => p.id !== currentUserId && !profile.connections.includes(p.id))
                    .slice(0, 3)
                    .map(user => (
                      <div key={user.id} className="flex items-center gap-3">
                        <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover" referrerPolicy="no-referrer" />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 text-xs truncate">{user.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{user.role}</div>
                        </div>
                        <button 
                          onClick={() => sendConnectionRequest(currentUserId, user.id)}
                          className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                        >
                          <UserPlus size={14} />
                        </button>
                      </div>
                    ))}
                </div>
                <button 
                  onClick={() => setActiveTab('connections')}
                  className="w-full mt-6 py-2 text-xs font-bold text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  View all suggestions
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              {/* Bio Section */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-black text-slate-800 mb-4">About</h3>
                {isEditing ? (
                  <textarea 
                    value={editForm.bio}
                    onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 h-32 outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                ) : (
                  <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
                )}
              </section>

              {/* Experience Section */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Briefcase size={20} className="text-blue-500" />
                    Experience
                  </h3>
                  {isEditing && (
                    <button 
                      onClick={() => setShowAddExp(true)}
                      className="text-blue-500 font-bold text-sm hover:underline"
                    >
                      + Add
                    </button>
                  )}
                </div>
                
                {showAddExp && (
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <input 
                      placeholder="Company" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={newExp.company}
                      onChange={e => setNewExp({...newExp, company: e.target.value})}
                    />
                    <input 
                      placeholder="Role" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={newExp.role}
                      onChange={e => setNewExp({...newExp, role: e.target.value})}
                    />
                    <input 
                      placeholder="Period (e.g. 2020 - 2022)" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={newExp.period}
                      onChange={e => setNewExp({...newExp, period: e.target.value})}
                    />
                    <textarea 
                      placeholder="Description" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 h-24 resize-none"
                      value={newExp.description}
                      onChange={e => setNewExp({...newExp, description: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const exp = { ...newExp, id: Math.random().toString(36).substr(2, 9) };
                          setEditForm({ ...editForm, experience: [...editForm.experience, exp] });
                          setShowAddExp(false);
                          setNewExp({ company: '', role: '', period: '', description: '' });
                        }}
                        className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl text-xs"
                      >
                        Add Experience
                      </button>
                      <button 
                        onClick={() => setShowAddExp(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {profile.experience.length === 0 ? (
                    <p className="text-slate-400 italic">No experience added yet.</p>
                  ) : (
                    profile.experience.map(exp => (
                      <div key={exp.id} className="flex gap-4 group relative">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Folder className="text-slate-400" size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{exp.role}</h4>
                          <div className="text-sm text-slate-600">{exp.company}</div>
                          <div className="text-xs text-slate-400 mb-2">{exp.period}</div>
                          <p className="text-sm text-slate-500">{exp.description}</p>
                        </div>
                        {isEditing && (
                          <button 
                            onClick={() => setEditForm({ ...editForm, experience: editForm.experience.filter(e => e.id !== exp.id) })}
                            className="absolute top-0 right-0 p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Education Section */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <GraduationCap size={20} className="text-purple-500" />
                    Education
                  </h3>
                  {isEditing && (
                    <button 
                      onClick={() => setShowAddEdu(true)}
                      className="text-blue-500 font-bold text-sm hover:underline"
                    >
                      + Add
                    </button>
                  )}
                </div>

                {showAddEdu && (
                  <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <input 
                      placeholder="School" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={newEdu.school}
                      onChange={e => setNewEdu({...newEdu, school: e.target.value})}
                    />
                    <input 
                      placeholder="Degree" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={newEdu.degree}
                      onChange={e => setNewEdu({...newEdu, degree: e.target.value})}
                    />
                    <input 
                      placeholder="Year" 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                      value={newEdu.year}
                      onChange={e => setNewEdu({...newEdu, year: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const edu = { ...newEdu, id: Math.random().toString(36).substr(2, 9) };
                          setEditForm({ ...editForm, education: [...editForm.education, edu] });
                          setShowAddEdu(false);
                          setNewEdu({ school: '', degree: '', year: '' });
                        }}
                        className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl text-xs"
                      >
                        Add Education
                      </button>
                      <button 
                        onClick={() => setShowAddEdu(false)}
                        className="px-4 py-2 bg-slate-200 text-slate-600 font-bold rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {profile.education.length === 0 ? (
                    <p className="text-slate-400 italic">No education added yet.</p>
                  ) : (
                    profile.education.map(edu => (
                      <div key={edu.id} className="flex gap-4 group relative">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="text-slate-400" size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{edu.school}</h4>
                          <div className="text-sm text-slate-600">{edu.degree}</div>
                          <div className="text-xs text-slate-400">{edu.year}</div>
                        </div>
                        {isEditing && (
                          <button 
                            onClick={() => setEditForm({ ...editForm, education: editForm.education.filter(e => e.id !== edu.id) })}
                            className="absolute top-0 right-0 p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Recommendations Section */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <MessageSquare size={20} className="text-green-500" />
                  Recommendations
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm relative">
                    "Aya is a visionary leader with a rare combination of technical depth and creative intuition. Working with them on Lumina OS has been a career highlight."
                    <div className="mt-4 flex items-center gap-2 not-italic">
                      <img src="https://picsum.photos/seed/jordan/32/32" className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="font-bold text-slate-800 text-xs">Jordan Smith</div>
                        <div className="text-[10px] text-slate-400">Senior Developer at Lumina Corp</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Skills Section */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Award size={20} className="text-yellow-500" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map(skill => (
                    <div key={skill} className="group relative">
                      <span className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs flex items-center gap-2">
                        {skill}
                        {isEditing && (
                          <button 
                            onClick={() => setEditForm({ ...editForm, skills: editForm.skills.filter(s => s !== skill) })}
                            className="hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                  {isEditing && (
                    <div className="flex gap-2 w-full mt-2">
                      <input 
                        placeholder="Add skill..." 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newSkill.trim()) {
                            setEditForm({ ...editForm, skills: [...new Set([...editForm.skills, newSkill.trim()])] });
                            setNewSkill('');
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (newSkill.trim()) {
                            setEditForm({ ...editForm, skills: [...new Set([...editForm.skills, newSkill.trim()])] });
                            setNewSkill('');
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white font-bold rounded-xl text-xs"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Location/Contact */}
              <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-xl font-black text-slate-800 mb-4">Contact</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Wifi size={18} className="text-slate-400" />
                    <span className="text-sm font-medium">{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <User size={18} className="text-slate-400" />
                    <span className="text-sm font-medium">itsanayathing2@gmail.com</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <div className="max-w-5xl mx-auto space-y-12 pb-12">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-800">Your Network</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search connections..." 
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.values(profiles) as UserProfile[])
                  .filter(p => p.id !== currentUserId && profile.connections.includes(p.id))
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(user => (
                    <div key={user.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-4">
                        <img src={user.avatar} className="w-16 h-16 rounded-2xl object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800">{user.name}</h4>
                          <p className="text-xs text-slate-500 line-clamp-1">{user.role} at {user.company}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <button className="flex-1 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider cursor-default">
                          Connected
                        </button>
                        <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors">
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                {(Object.values(profiles) as UserProfile[]).filter(p => p.id !== currentUserId && profile.connections.includes(p.id)).length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-slate-400 font-medium">You haven't connected with anyone yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Connections */}
            <div>
              <h3 className="text-2xl font-black text-slate-800 mb-8">Suggested for You</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(Object.values(profiles) as UserProfile[])
                  .filter(p => p.id !== currentUserId && !profile.connections.includes(p.id))
                  .map(user => {
                    const mutualCount = user.connections.filter(c => profile.connections.includes(c)).length;
                    return (
                      <div key={user.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col gap-4 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <img src={user.avatar} className="w-16 h-16 rounded-2xl object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{user.name}</h4>
                            <p className="text-xs text-slate-500 line-clamp-1">{user.role} at {user.company}</p>
                            <p className="text-[10px] text-blue-500 font-bold mt-1">
                              {mutualCount > 0 ? `${mutualCount} mutual connections` : 'New to your network'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <button 
                            onClick={() => sendConnectionRequest(currentUserId, user.id)}
                            className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                          >
                            <UserPlus size={14} />
                            Connect
                          </button>
                          <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Notifications</h3>
            {notifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-400 font-medium">All caught up! No new notifications.</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className={`p-4 rounded-2xl border transition-all flex items-center gap-4 ${notification.read ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-100 shadow-sm'}`}>
                  <img src={notification.fromAvatar} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">
                      <span className="font-bold">{notification.fromName}</span>
                      {notification.type === 'like' && ' liked your post.'}
                      {notification.type === 'comment' && ' commented on your post.'}
                      {notification.type === 'connection_request' && ' sent you a connection request.'}
                      {notification.type === 'connection_accepted' && ' accepted your connection request.'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
                  </div>
                  {notification.type === 'connection_request' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => acceptConnectionRequest(notification.fromId, currentUserId)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      >
                        <Check size={16} />
                      </button>
                      <button className="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8 pb-20">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Account Settings</h3>
            
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Full Name</label>
                    <input type="text" defaultValue={profile.name} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">Email Address</label>
                    <input type="email" defaultValue="aya@lumina.os" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Security & Login</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800">Two-Factor Authentication</div>
                      <div className="text-xs text-slate-500">Add an extra layer of security to your account.</div>
                    </div>
                    <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800">Login Alerts</div>
                      <div className="text-xs text-slate-500">Get notified if we notice any unusual login activity.</div>
                    </div>
                    <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-800/20">
                  Save Changes
                </button>
              </div>
            </section>

            <section className="bg-rose-50 rounded-3xl p-8 border border-rose-100">
              <h4 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-4">Danger Zone</h4>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-800">Deactivate Account</div>
                  <div className="text-xs text-rose-600">Temporarily disable your profile and posts.</div>
                </div>
                <button className="px-6 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-all">Deactivate</button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const RegistryApp = () => {
  const { policies, registry, users, updatePolicy, resetToDefaults } = useKernel();
  const [activeTab, setActiveTab] = useState<'policies' | 'registry' | 'users'>('policies');

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 text-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="text-blue-500" />
          System Governance
        </h2>
        <button 
          onClick={resetToDefaults}
          className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded-lg transition-colors text-sm"
        >
          Reset All
        </button>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200 pb-2">
        <button 
          className={`font-bold pb-2 border-b-2 transition-colors ${activeTab === 'policies' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('policies')}
        >
          Policies
        </button>
        <button 
          className={`font-bold pb-2 border-b-2 transition-colors ${activeTab === 'registry' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('registry')}
        >
          App Registry
        </button>
        <button 
          className={`font-bold pb-2 border-b-2 transition-colors ${activeTab === 'users' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {activeTab === 'policies' && (
          <div className="space-y-4">
            {(Object.values(policies) as SystemPolicy[]).map(policy => (
              <div key={policy.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{policy.name}</div>
                  <div className="text-sm text-slate-500">{policy.description}</div>
                </div>
                {typeof policy.value === 'boolean' ? (
                  <button 
                    onClick={() => updatePolicy(policy.id, !policy.value)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${policy.value ? 'bg-blue-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${policy.value ? 'right-1' : 'left-1'}`} />
                  </button>
                ) : (
                  <input 
                    type="text" 
                    value={String(policy.value)}
                    onChange={(e) => {
                      const val = typeof policy.value === 'number' ? Number(e.target.value) : e.target.value;
                      updatePolicy(policy.id, val);
                    }}
                    className="border border-slate-200 rounded-lg px-3 py-1 text-sm w-24 text-right outline-none focus:border-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'registry' && (
          <div className="space-y-4">
            {(Object.values(registry) as AppManifest[]).map(app => (
              <div key={app.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {app.name}
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">v{app.version}</span>
                    </div>
                    <div className="text-sm text-slate-500">{app.description}</div>
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{app.id}</div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">Permissions</div>
                  <div className="flex flex-wrap gap-2">
                    {app.permissions.map(perm => (
                      <span key={perm} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md border border-blue-100">
                        {perm}
                      </span>
                    ))}
                    {app.permissions.length === 0 && <span className="text-xs text-slate-400 italic">None</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            {(Object.values(users) as UserRecord[]).map(user => (
              <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                    <User className="text-slate-500" size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{user.username}</div>
                    <div className="text-xs text-slate-500 font-mono">ID: {user.id}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                    {user.role}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WebAppViewer = ({ url }: { url?: string }) => {
  if (!url) return <div className="p-8 text-center text-slate-500">No URL provided</div>;
  return (
    <div className="w-full h-full bg-white">
      <iframe src={url} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
    </div>
  );
};

const STORE_CATALOG = [
  // Apps
  { id: 'facebook', type: 'app', name: 'Facebook', icon: Globe, color: 'bg-blue-600', category: 'Social', url: 'https://www.facebook.com', description: 'Connect with friends, family and other people you know.', banner: 'https://picsum.photos/seed/fb_banner/1200/600', thumbnail: 'https://picsum.photos/seed/fb_thumb/600/400' },
  { id: 'twitter', type: 'app', name: 'X (Twitter)', icon: Globe, color: 'bg-black', category: 'Social', url: 'https://twitter.com', description: 'What\'s happening?!', banner: 'https://picsum.photos/seed/tw_banner/1200/600', thumbnail: 'https://picsum.photos/seed/tw_thumb/600/400' },
  { id: 'youtube', type: 'app', name: 'YouTube', icon: Play, color: 'bg-red-600', category: 'Entertainment', url: 'https://www.youtube.com', description: 'Enjoy the videos and music you love.', banner: 'https://picsum.photos/seed/yt_banner/1200/600', thumbnail: 'https://picsum.photos/seed/yt_thumb/600/400' },
  { id: 'ytmusic', type: 'app', name: 'YouTube Music', icon: Play, color: 'bg-red-500', category: 'Music', url: 'https://music.youtube.com', description: 'A new music service with official albums, singles, videos, remixes, live performances and more.', banner: 'https://picsum.photos/seed/ytm_banner/1200/600', thumbnail: 'https://picsum.photos/seed/ytm_thumb/600/400' },
  { id: 'instagram', type: 'app', name: 'Instagram', icon: Globe, color: 'bg-pink-600', category: 'Social', url: 'https://www.instagram.com', description: 'A simple, fun & creative way to capture, edit & share photos, videos & messages with friends & family.', banner: 'https://picsum.photos/seed/ig_banner/1200/600', thumbnail: 'https://picsum.photos/seed/ig_thumb/600/400' },
  { id: 'tiktok', type: 'app', name: 'TikTok', icon: Play, color: 'bg-black', category: 'Entertainment', url: 'https://www.tiktok.com', description: 'TikTok is the leading destination for short-form mobile video.', banner: 'https://picsum.photos/seed/tk_banner/1200/600', thumbnail: 'https://picsum.photos/seed/tk_thumb/600/400' },
  { id: 'discord', type: 'app', name: 'Discord', icon: Globe, color: 'bg-indigo-500', category: 'Social', url: 'https://discord.com/app', description: 'Discord is the easiest way to talk over voice, video, and text.', banner: 'https://picsum.photos/seed/dc_banner/1200/600', thumbnail: 'https://picsum.photos/seed/dc_thumb/600/400' },
  { id: 'spotify', type: 'app', name: 'Spotify', icon: Play, color: 'bg-green-500', category: 'Music', url: 'https://open.spotify.com', description: 'Spotify is a digital music service that gives you access to millions of songs.', banner: 'https://picsum.photos/seed/sp_banner/1200/600', thumbnail: 'https://picsum.photos/seed/sp_thumb/600/400' },
  { id: 'netflix', type: 'app', name: 'Netflix', icon: Play, color: 'bg-red-700', category: 'Entertainment', url: 'https://www.netflix.com', description: 'Watch Netflix movies & TV shows online or stream right to your smart TV, game console, PC, Mac, mobile, tablet and more.', banner: 'https://picsum.photos/seed/nf_banner/1200/600', thumbnail: 'https://picsum.photos/seed/nf_thumb/600/400' },
  { id: 'twitch', type: 'app', name: 'Twitch', icon: Play, color: 'bg-purple-600', category: 'Entertainment', url: 'https://www.twitch.tv', description: 'Twitch is the world\'s leading video platform and community for gamers.', banner: 'https://picsum.photos/seed/twc_banner/1200/600', thumbnail: 'https://picsum.photos/seed/twc_thumb/600/400' },
  { id: 'reddit', type: 'app', name: 'Reddit', icon: Globe, color: 'bg-orange-600', category: 'Social', url: 'https://www.reddit.com', description: 'Reddit is a network of communities where people can dive into their interests, hobbies and passions.', banner: 'https://picsum.photos/seed/rd_banner/1200/600', thumbnail: 'https://picsum.photos/seed/rd_thumb/600/400' },
  { id: 'maps', type: 'app', name: 'Google Maps', icon: Globe, color: 'bg-green-500', category: 'Utility', url: 'https://www.google.com/maps/embed', description: 'Navigate your world and discover new places.', banner: 'https://picsum.photos/seed/maps_banner/1200/600', thumbnail: 'https://picsum.photos/seed/maps_thumb/600/400' },
  { id: 'weather', type: 'app', name: 'Weather', icon: Globe, color: 'bg-blue-400', category: 'Utility', url: 'https://weather.com', description: 'Accurate and timely weather forecasts.', banner: 'https://picsum.photos/seed/weather_banner/1200/600', thumbnail: 'https://picsum.photos/seed/weather_thumb/600/400' },
  { id: 'calc', type: 'app', name: 'Desmos Calculator', icon: LayoutGrid, color: 'bg-orange-500', category: 'Utility', url: 'https://www.desmos.com/scientific', description: 'A beautiful, free scientific calculator.', banner: 'https://picsum.photos/seed/calc_banner/1200/600', thumbnail: 'https://picsum.photos/seed/calc_thumb/600/400' },
  { id: 'news', type: 'app', name: 'Hacker News', icon: Globe, color: 'bg-red-600', category: 'News', url: 'https://news.ycombinator.com/', description: 'The latest news in tech and startups.', banner: 'https://picsum.photos/seed/news_banner/1200/600', thumbnail: 'https://picsum.photos/seed/news_thumb/600/400' },
  { id: 'figma', type: 'app', name: 'Figma', icon: Palette, color: 'bg-purple-500', category: 'Design', url: 'https://www.figma.com', description: 'The collaborative interface design tool.', banner: 'https://picsum.photos/seed/figma_banner/1200/600', thumbnail: 'https://picsum.photos/seed/figma_thumb/600/400' },
  { id: 'github', type: 'app', name: 'GitHub', icon: Globe, color: 'bg-slate-800', category: 'Development', url: 'https://github.com', description: 'Where the world builds software.', banner: 'https://picsum.photos/seed/github_banner/1200/600', thumbnail: 'https://picsum.photos/seed/github_thumb/600/400' },
  { id: 'vscode', type: 'app', name: 'VS Code', icon: LayoutGrid, color: 'bg-blue-500', category: 'Development', url: 'https://vscode.dev', description: 'Code editing. Redefined.', banner: 'https://picsum.photos/seed/vscode_banner/1200/600', thumbnail: 'https://picsum.photos/seed/vscode_thumb/600/400' },
  { id: 'notion', type: 'app', name: 'Notion', icon: StickyNote, color: 'bg-slate-900', category: 'Productivity', url: 'https://www.notion.so', description: 'Your wiki, docs, & projects. Together.', banner: 'https://picsum.photos/seed/notion_banner/1200/600', thumbnail: 'https://picsum.photos/seed/notion_thumb/600/400' },
  { id: 'trello', type: 'app', name: 'Trello', icon: LayoutGrid, color: 'bg-blue-600', category: 'Productivity', url: 'https://trello.com', description: 'Manage your team’s projects from anywhere.', banner: 'https://picsum.photos/seed/trello_banner/1200/600', thumbnail: 'https://picsum.photos/seed/trello_thumb/600/400' },

  // Games
  { id: 'geforcenow', type: 'game', name: 'NVIDIA GeForce NOW', icon: Gamepad2, color: 'bg-green-600', category: 'Cloud Gaming', url: 'https://play.geforcenow.com', description: 'GeForce NOW transforms your device into a powerful PC gaming rig.', banner: 'https://picsum.photos/seed/gfn_banner/1200/600', thumbnail: 'https://picsum.photos/seed/gfn_thumb/600/400' },
  { id: 'xcloud', type: 'game', name: 'Xbox Cloud Gaming', icon: Gamepad2, color: 'bg-green-700', category: 'Cloud Gaming', url: 'https://www.xbox.com/play', description: 'Play Xbox games on your mobile phone or tablet from the cloud with Xbox Game Pass Ultimate.', banner: 'https://picsum.photos/seed/xcloud_banner/1200/600', thumbnail: 'https://picsum.photos/seed/xcloud_thumb/600/400' },
  { id: 'luna', type: 'game', name: 'Amazon Luna', icon: Gamepad2, color: 'bg-purple-700', category: 'Cloud Gaming', url: 'https://luna.amazon.com', description: 'Amazon Luna is a cloud gaming service that lets you play games on devices you already own.', banner: 'https://picsum.photos/seed/luna_banner/1200/600', thumbnail: 'https://picsum.photos/seed/luna_thumb/600/400' },
  { id: 'krunker', type: 'game', name: 'Krunker', icon: Gamepad2, color: 'bg-yellow-500', category: 'Shooter', url: 'https://krunker.io', description: 'Krunker is a fast-paced pixelated first-person shooter.', banner: 'https://picsum.photos/seed/krunker_banner/1200/600', thumbnail: 'https://picsum.photos/seed/krunker_thumb/600/400' },
  { id: 'minecraft', type: 'game', name: 'Minecraft Classic', icon: Gamepad2, color: 'bg-green-800', category: 'Sandbox', url: 'https://classic.minecraft.net', description: 'Play the original Minecraft right in your browser.', banner: 'https://picsum.photos/seed/mc_banner/1200/600', thumbnail: 'https://picsum.photos/seed/mc_thumb/600/400' },
  { id: 'venge', type: 'game', name: 'Venge.io', icon: Gamepad2, color: 'bg-blue-600', category: 'Shooter', url: 'https://venge.io', description: 'Venge is an objective-based first person shooter.', banner: 'https://picsum.photos/seed/venge_banner/1200/600', thumbnail: 'https://picsum.photos/seed/venge_thumb/600/400' },
  { id: 'shellshockers', type: 'game', name: 'Shell Shockers', icon: Gamepad2, color: 'bg-orange-400', category: 'Shooter', url: 'https://shellshock.io', description: 'The world\'s most popular egg-based multiplayer shooter.', banner: 'https://picsum.photos/seed/shell_banner/1200/600', thumbnail: 'https://picsum.photos/seed/shell_thumb/600/400' },
  { id: 'smashkarts', type: 'game', name: 'Smash Karts', icon: Gamepad2, color: 'bg-red-500', category: 'Racing', url: 'https://smashkarts.io', description: 'A 3D multiplayer kart battle game.', banner: 'https://picsum.photos/seed/smash_banner/1200/600', thumbnail: 'https://picsum.photos/seed/smash_thumb/600/400' },
  { id: '2048', type: 'game', name: '2048', icon: Gamepad2, color: 'bg-yellow-600', category: 'Puzzle', url: 'https://play2048.co/', description: 'Join the numbers and get to the 2048 tile!', banner: 'https://picsum.photos/seed/2048_banner/1200/600', thumbnail: 'https://picsum.photos/seed/2048_thumb/600/400' },
  { id: 'tetris', type: 'game', name: 'Tetris', icon: Gamepad2, color: 'bg-indigo-600', category: 'Puzzle', url: 'https://tetris.com/play-tetris', description: 'The iconic puzzle game that started it all.', banner: 'https://picsum.photos/seed/tetris_banner/1200/600', thumbnail: 'https://picsum.photos/seed/tetris_thumb/600/400' },
];

const StoreApp = () => {
  const { installedApps, installApp, uninstallApp, autoAddToDock, setAutoAddToDock } = useContext(SystemContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'apps' | 'games' | 'browse' | 'library' | 'settings'>('home');
  const [homeFilter, setHomeFilter] = useState<'all' | 'apps' | 'games'>('all');
  const [appCategoryFilter, setAppCategoryFilter] = useState<string>('All');
  const [gameCategoryFilter, setGameCategoryFilter] = useState<string>('All');

  const appCategories = ['All', ...Array.from(new Set(STORE_CATALOG.filter(a => a.type === 'app').map(a => a.category)))];
  const gameCategories = ['All', ...Array.from(new Set(STORE_CATALOG.filter(a => a.type === 'game').map(a => a.category)))];

  const [articles, setArticles] = useState([
    {
      id: 'a1',
      type: 'Review',
      title: 'The Future of Cloud Gaming is Here',
      subtitle: 'NVIDIA GeForce NOW brings desktop-class gaming to your browser.',
      content: 'Cloud gaming has reached an inflection point. With NVIDIA GeForce NOW, you can stream AAA titles directly to your Lumina OS workspace without needing a dedicated GPU. The latency is nearly imperceptible, and the visual fidelity is stunning. Whether you are playing Cyberpunk 2077 or Fortnite, the experience is seamless. This app is a must-have for any gamer looking to maximize their hardware.',
      image: 'https://picsum.photos/seed/gfn_mag/1200/800',
      appId: 'geforcenow',
      likes: 124,
      dislikes: 3,
      userAction: null as 'like' | 'dislike' | null,
      hidden: false
    },
    {
      id: 'a2',
      type: 'Spotlight',
      title: 'Unleash Your Creativity with Desmos',
      subtitle: 'More than just a calculator, it\'s a canvas for mathematics.',
      content: 'Desmos is redefining how we interact with math. It\'s not just about crunching numbers; it\'s about visualizing complex functions and exploring mathematical concepts in real-time. The intuitive interface makes it accessible for students, while the powerful graphing engine satisfies the needs of advanced mathematicians. Add it to your workflow today and see math in a whole new light.',
      image: 'https://picsum.photos/seed/desmos_mag/1200/800',
      appId: 'calc',
      likes: 89,
      dislikes: 1,
      userAction: null as 'like' | 'dislike' | null,
      hidden: false
    },
    {
      id: 'a3',
      type: 'Spotlight',
      title: 'Stay Connected with Discord',
      subtitle: 'The ultimate communication hub for communities and friends.',
      content: 'Discord has evolved far beyond its gaming roots. It is now the de facto platform for communities of all types to gather, chat, and collaborate. With robust voice channels, high-quality video streaming, and endless customization options through bots, Discord provides a tailored communication experience. Whether you are coordinating a raid or hosting a study group, Discord keeps you connected.',
      image: 'https://picsum.photos/seed/discord_mag/1200/800',
      appId: 'discord',
      likes: 256,
      dislikes: 12,
      userAction: null as 'like' | 'dislike' | null,
      hidden: false
    },
    {
      id: 'a4',
      type: 'How-To',
      title: 'Master Your Spotify Playlists',
      subtitle: 'Organize your music like a pro with these advanced tips.',
      content: 'Creating the perfect playlist is an art form. Start by utilizing Spotify\'s "Enhance" feature to discover tracks that match your vibe. Use folders to group playlists by genre or mood, keeping your library clutter-free. Did you know you can also search within a playlist to quickly find that one song? Master these tools, and you\'ll be the designated DJ for every occasion.',
      image: 'https://picsum.photos/seed/spotify_mag/1200/800',
      appId: 'spotify',
      likes: 412,
      dislikes: 8,
      userAction: null as 'like' | 'dislike' | null,
      hidden: false
    },
    {
      id: 'a5',
      type: 'Walkthrough',
      title: 'Xbox Cloud Gaming: The Ultimate Setup Guide',
      subtitle: 'Get the most out of your cloud gaming experience.',
      content: 'Ready to dive into Xbox Cloud Gaming? First, ensure you have a stable 5GHz Wi-Fi connection or a wired Ethernet setup to minimize latency. Pair a compatible controller—the Xbox Wireless Controller is highly recommended for the most authentic feel. Finally, explore the massive library of Game Pass titles available instantly. No downloads, no waiting, just pure gaming.',
      image: 'https://picsum.photos/seed/xcloud_mag/1200/800',
      appId: 'xcloud',
      likes: 890,
      dislikes: 45,
      userAction: null as 'like' | 'dislike' | null,
      hidden: false
    },
    {
      id: 'a6',
      type: 'Tips & Tricks',
      title: 'YouTube Creator Tips: Engaging Your Audience',
      subtitle: 'Learn how to build a loyal community on the world\'s largest video platform.',
      content: 'Building an audience on YouTube requires more than just uploading videos. Engage with your viewers by responding to comments and asking questions in your videos. Utilize the Community tab to share updates, polls, and behind-the-scenes content. Consistency is key—stick to a regular upload schedule so your audience knows when to expect new content. And always pay attention to your analytics to understand what resonates best.',
      image: 'https://picsum.photos/seed/youtube_mag/1200/800',
      appId: 'youtube',
      likes: 340,
      dislikes: 15,
      userAction: null as 'like' | 'dislike' | null,
      hidden: false
    }
  ]);

  const handleArticleAction = (id: string, action: 'like' | 'dislike' | 'hide') => {
    setArticles(prev => prev.map(article => {
      if (article.id !== id) return article;
      
      if (action === 'hide') {
        return { ...article, hidden: true };
      }

      let newLikes = article.likes;
      let newDislikes = article.dislikes;
      let newUserAction = action;

      if (article.userAction === action) {
        // Toggle off
        newUserAction = null;
        if (action === 'like') newLikes--;
        if (action === 'dislike') newDislikes--;
      } else {
        // Switch or set new
        if (action === 'like') {
          newLikes++;
          if (article.userAction === 'dislike') newDislikes--;
        } else if (action === 'dislike') {
          newDislikes++;
          if (article.userAction === 'like') newLikes--;
        }
      }

      return {
        ...article,
        likes: newLikes,
        dislikes: newDislikes,
        userAction: newUserAction
      };
    }));
  };

  const handleInstallToggle = (app: any) => {
    const isInstalled = installedApps.some(a => a.id === app.id);
    if (isInstalled) {
      uninstallApp(app.id);
    } else {
      installApp({
        id: app.id,
        name: app.name,
        icon: app.icon,
        color: app.color,
        component: () => <WebAppViewer url={app.url} />
      });
    }
  };

  const renderAppCard = (app: any) => {
    const isInstalled = installedApps.some(a => a.id === app.id);
    return (
      <div key={app.id} className="flex flex-col gap-3 group cursor-pointer">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-[#2a2a2a]">
          <img src={app.thumbnail} alt={app.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <button 
              onClick={(e) => { e.stopPropagation(); handleInstallToggle(app); }}
              className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 hover:scale-105 transition-all shadow-xl"
            >
              {isInstalled ? <Check size={24} /> : <Download size={24} />}
            </button>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-slate-100 truncate">{app.name}</h3>
          <p className="text-sm text-slate-400">{app.category}</p>
        </div>
      </div>
    );
  };

  const renderDetailedAppCard = (app: any) => {
    const isInstalled = installedApps.some(a => a.id === app.id);
    return (
      <div key={app.id} className="flex flex-col bg-[#1e1e1e] rounded-3xl overflow-hidden border border-white/5 group cursor-pointer hover:border-white/20 transition-all hover:shadow-2xl hover:-translate-y-1">
        <div className="relative h-48 bg-[#2a2a2a] overflow-hidden">
          <img src={app.banner} alt={app.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-[#1e1e1e]/50 to-transparent" />
          <div className="absolute bottom-4 left-6 flex items-center gap-4">
            <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg border border-white/10 shrink-0`}>
              <app.icon size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-xl leading-tight drop-shadow-md truncate">{app.name}</h3>
              <p className="text-sm text-slate-300 font-medium">{app.category}</p>
            </div>
          </div>
        </div>
        <div className="p-6 flex flex-col flex-1">
          <p className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1 leading-relaxed">{app.description}</p>
          <button 
            onClick={(e) => { e.stopPropagation(); handleInstallToggle(app); }}
            className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isInstalled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-blue-600 text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20'}`}
          >
            {isInstalled ? <Check size={20} /> : <Download size={20} />}
            {isInstalled ? 'Installed' : 'Install'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex bg-[#121212] text-slate-200 font-sans">
      {/* Sidebar */}
      <div className="w-60 bg-[#1e1e1e] flex flex-col border-r border-white/5 shrink-0">
        <div className="p-6 flex items-center gap-3 text-white">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">Store</span>
        </div>
        
        <div className="flex-1 px-3 py-2 space-y-1">
          <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activeTab === 'home' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <Home size={20} /> Home
          </button>
          <button onClick={() => setActiveTab('apps')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activeTab === 'apps' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <LayoutGrid size={20} /> Apps
          </button>
          <button onClick={() => setActiveTab('games')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activeTab === 'games' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <Gamepad2 size={20} /> Games
          </button>
          <button onClick={() => setActiveTab('browse')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activeTab === 'browse' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <Compass size={20} /> Browse
          </button>
          <button onClick={() => setActiveTab('library')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activeTab === 'library' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <Library size={20} /> Library
          </button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-white/10 text-white font-medium' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <SettingsIcon size={20} /> Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="h-20 px-8 flex items-center justify-between shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search games and apps" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#2a2a2a] border-transparent focus:bg-[#333] focus:ring-1 focus:ring-white/20 rounded-full py-2.5 pl-12 pr-4 outline-none text-sm text-white placeholder:text-slate-400 transition-all"
            />
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
            U
          </div>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 no-scrollbar">
          {searchQuery ? (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Search Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {STORE_CATALOG.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.category.toLowerCase().includes(searchQuery.toLowerCase())).map(renderAppCard)}
              </div>
            </div>
          ) : activeTab === 'home' ? (
            <div className="space-y-12">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-8">
                  <h1 className="text-4xl font-black text-white tracking-tight font-serif italic">Discover</h1>
                  <div className="flex bg-[#2a2a2a] rounded-full p-1">
                    <button 
                      onClick={() => setHomeFilter('all')}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${homeFilter === 'all' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setHomeFilter('apps')}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${homeFilter === 'apps' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      Apps
                    </button>
                    <button 
                      onClick={() => setHomeFilter('games')}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${homeFilter === 'games' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      Games
                    </button>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI Curated</span>
              </div>
              
              <div className="flex flex-col gap-16">
                {articles.filter(a => !a.hidden).filter(article => {
                  const app = STORE_CATALOG.find(a => a.id === article.appId);
                  if (!app) return false;
                  if (homeFilter === 'all') return true;
                  if (homeFilter === 'games') return app.type === 'game';
                  if (homeFilter === 'apps') return app.type === 'app';
                  return true;
                }).map((article, index) => {
                  const app = STORE_CATALOG.find(a => a.id === article.appId);
                  if (!app) return null;
                  const isInstalled = installedApps.some(a => a.id === app.id);
                  
                  return (
                    <article key={article.id} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
                      <div className="w-full md:w-1/2 relative aspect-[4/3] rounded-3xl overflow-hidden group">
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                      </div>
                      
                      <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
                        <div className="space-y-2">
                          {article.type && (
                            <span className="inline-block px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">
                              {article.type}
                            </span>
                          )}
                          <h2 className="text-4xl font-black text-white leading-tight tracking-tight">{article.title}</h2>
                          <h3 className="text-xl text-slate-400 font-serif italic">{article.subtitle}</h3>
                        </div>
                        
                        <p className="text-slate-300 leading-relaxed text-lg">
                          {article.content}
                        </p>
                        
                        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl flex-1">
                            <div className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center shadow-md`}>
                              <app.icon size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-white text-sm">{app.name}</h4>
                              <p className="text-xs text-slate-400">{app.category}</p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleInstallToggle(app); }}
                              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-colors shadow-sm shrink-0 mr-2"
                            >
                              {isInstalled ? <Check size={18} /> : <Download size={18} />}
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => handleArticleAction(article.id, 'like')}
                              className={`p-3 rounded-full transition-colors ${article.userAction === 'like' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                            >
                              <ThumbsUp size={18} />
                            </button>
                            <button 
                              onClick={() => handleArticleAction(article.id, 'dislike')}
                              className={`p-3 rounded-full transition-colors ${article.userAction === 'dislike' ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                            >
                              <ThumbsDown size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                // Simulate share
                                alert(`Shared article: ${article.title}`);
                              }}
                              className="p-3 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <Share2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleArticleAction(article.id, 'hide')}
                              className="p-3 rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              <EyeOff size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'browse' ? (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">All Apps & Games</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {STORE_CATALOG.map(renderAppCard)}
              </div>
            </div>
          ) : activeTab === 'apps' ? (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Apps</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {appCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setAppCategoryFilter(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        appCategoryFilter === cat 
                          ? 'bg-white text-black' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {STORE_CATALOG
                  .filter(a => a.type === 'app' && (appCategoryFilter === 'All' || a.category === appCategoryFilter))
                  .map(renderDetailedAppCard)}
              </div>
            </div>
          ) : activeTab === 'games' ? (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Games</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {gameCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setGameCategoryFilter(cat)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        gameCategoryFilter === cat 
                          ? 'bg-white text-black' 
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {STORE_CATALOG
                  .filter(a => a.type === 'game' && (gameCategoryFilter === 'All' || a.category === gameCategoryFilter))
                  .map(renderDetailedAppCard)}
              </div>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Store Settings</h2>
              <div className="bg-[#1e1e1e] rounded-2xl p-6 border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Add to Dock</h3>
                    <p className="text-sm text-slate-400">Automatically add new apps to the dock upon install</p>
                  </div>
                  <div 
                    onClick={() => setAutoAddToDock(!autoAddToDock)}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${autoAddToDock ? 'bg-blue-600' : 'bg-[#333]'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoAddToDock ? 'right-1' : 'left-1'}`} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Auto-update apps</h3>
                    <p className="text-sm text-slate-400">Automatically install updates when available</p>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">Notifications</h3>
                    <p className="text-sm text-slate-400">Get notified about new apps and updates</p>
                  </div>
                  <div className="w-12 h-6 bg-[#333] rounded-full relative cursor-pointer">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Your Library</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {STORE_CATALOG.filter(app => installedApps.some(a => a.id === app.id)).map(renderAppCard)}
                {STORE_CATALOG.filter(app => installedApps.some(a => a.id === app.id)).length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-500">
                    <Library size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Your library is empty.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Desktop Components ---

const DEFAULT_APPS: AppDefinition[] = [
  { id: 'store', name: 'Store', icon: ShoppingBag, color: 'bg-blue-600', component: StoreApp },
  { id: 'profile', name: 'Profile', icon: User, color: 'bg-rose-500', component: ProfileApp },
  { id: 'note', name: 'Note', icon: StickyNote, color: 'bg-yellow-500', component: NoteApp },
  { id: 'camera', name: 'Camera', icon: CameraIcon, color: 'bg-red-500', component: CameraApp },
  { id: 'files', name: 'Files', icon: Folder, color: 'bg-blue-500', component: FilesApp },
  { id: 'calendar', name: 'Calendar', icon: Calendar, color: 'bg-indigo-500', component: CalendarApp },
  { id: 'power', name: 'Power', icon: Battery, color: 'bg-emerald-500', component: PowerApp },
  { id: 'settings', name: 'Settings', icon: SettingsIcon, color: 'bg-gray-500', component: SettingsApp },
  { id: 'gallery', name: 'Gallery', icon: Folder, color: 'bg-emerald-500', component: GalleryApp },
  { id: 'registry', name: 'Registry', icon: Database, color: 'bg-purple-600', component: RegistryApp },
];

function Desktop() {
  const { policies } = useKernel();
  const [openWindows, setOpenWindows] = useState<string[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const [dockSize, setDockSize] = useState(4.5);
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [powerMode, setPowerMode] = useState<PowerMode>('balanced');
  const [installedApps, setInstalledApps] = useState<AppDefinition[]>(DEFAULT_APPS);
  const [autoAddToDock, setAutoAddToDock] = useState(true);
  const [dockApps, setDockApps] = useState<string[]>(DEFAULT_APPS.map(a => a.id));
  const workspaceRef = useRef<HTMLDivElement>(null);

  const installApp = (app: AppDefinition) => {
    if (!installedApps.some(a => a.id === app.id)) {
      setInstalledApps([...installedApps, app]);
      if (autoAddToDock && !dockApps.includes(app.id)) {
        setDockApps([...dockApps, app.id]);
      }
    }
  };

  const uninstallApp = (appId: string) => {
    setInstalledApps(installedApps.filter(a => a.id !== appId));
    setDockApps(dockApps.filter(id => id !== appId));
    if (openWindows.includes(appId)) {
      closeWindow(appId);
    }
  };

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('lumina_posts');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: '1',
        authorId: 'user1',
        authorName: 'Jordan Smith',
        authorAvatar: 'https://picsum.photos/seed/jordan/200/200',
        type: 'text',
        content: 'Just launched my new open-source project! Check it out on GitHub.',
        timestamp: Date.now() - 3600000,
        likes: ['user2'],
        comments: []
      },
      {
        id: '2',
        authorId: 'user2',
        authorName: 'Elena Rodriguez',
        authorAvatar: 'https://picsum.photos/seed/elena/200/200',
        type: 'photo',
        content: 'https://picsum.photos/seed/art/800/600',
        timestamp: Date.now() - 7200000,
        likes: ['me', 'user1'],
        comments: [
          { id: 'c1', authorId: 'me', authorName: 'Aya Kalimah Satya Ruane', authorAvatar: 'https://picsum.photos/seed/aya/200/200', text: 'This is beautiful!', timestamp: Date.now() - 3600000 }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('lumina_posts', JSON.stringify(posts));
  }, [posts]);

  const [profiles, setProfiles] = useState<Record<string, UserProfile>>(() => {
    const saved = localStorage.getItem('lumina_profiles');
    if (saved) return JSON.parse(saved);
    return {
      'me': {
        id: 'me',
        name: 'Aya Kalimah Satya Ruane',
        bio: 'Visionary and Creator of Lumina OS. Passionate about building the future of digital experiences.',
        location: 'San Francisco, CA',
        avatar: 'https://picsum.photos/seed/aya/200/200',
        coverPhoto: 'https://picsum.photos/seed/cover/800/300',
        experience: [
          { id: '1', company: 'Lumina Corp', role: 'Chief Architect', period: '2024 - Present', description: 'Leading the design and development of the Lumina OS ecosystem.' }
        ],
        education: [
          { id: '1', school: 'MIT', degree: 'Computer Science', year: '2023' }
        ],
        skills: ['React', 'TypeScript', 'System Design', 'UI/UX'],
        connections: ['user1', 'user2']
      },
      'user1': {
        id: 'user1',
        name: 'Jordan Smith',
        bio: 'Full-stack developer and open-source enthusiast.',
        location: 'New York, NY',
        avatar: 'https://picsum.photos/seed/jordan/200/200',
        coverPhoto: 'https://picsum.photos/seed/cover1/800/300',
        experience: [],
        education: [],
        skills: ['Node.js', 'Python', 'Docker'],
        connections: ['me']
      },
      'user2': {
        id: 'user2',
        name: 'Elena Rodriguez',
        bio: 'Digital artist and creative director.',
        location: 'Barcelona, Spain',
        avatar: 'https://picsum.photos/seed/elena/200/200',
        coverPhoto: 'https://picsum.photos/seed/cover2/800/300',
        experience: [],
        education: [],
        skills: ['Photoshop', 'Illustrator', '3D Modeling'],
        connections: ['me']
      },
      'user3': {
        id: 'user3',
        name: 'Sam Wilson',
        bio: 'Product Manager at TechFlow.',
        location: 'London, UK',
        avatar: 'https://picsum.photos/seed/sam/200/200',
        coverPhoto: 'https://picsum.photos/seed/cover3/800/300',
        experience: [],
        education: [],
        skills: ['Agile', 'Product Strategy'],
        connections: []
      }
    };
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('lumina_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('lumina_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('lumina_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addPost = (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'comments' | 'authorId' | 'authorName' | 'authorAvatar'>) => {
    const me = profiles['me'];
    const newPost: Post = {
      ...post,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      authorId: 'me',
      authorName: me.name,
      authorAvatar: me.avatar,
      likes: [],
      comments: []
    };
    setPosts([newPost, ...posts]);
  };

  const likePost = (postId: string, userId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.likes.includes(userId);
        const newLikes = isLiked ? post.likes.filter(id => id !== userId) : [...post.likes, userId];
        
        if (!isLiked && post.authorId !== userId) {
          const user = profiles[userId];
          addNotification({
            type: 'like',
            fromId: userId,
            fromName: user.name,
            fromAvatar: user.avatar,
            postId: postId
          });
        }
        
        return { ...post, likes: newLikes };
      }
      return post;
    }));
  };

  const addComment = (postId: string, comment: Omit<Comment, 'id' | 'timestamp'>) => {
    const newComment: Comment = {
      ...comment,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        if (post.authorId !== comment.authorId) {
          addNotification({
            type: 'comment',
            fromId: comment.authorId,
            fromName: comment.authorName,
            fromAvatar: comment.authorAvatar,
            postId: postId
          });
        }
        return { ...post, comments: [...post.comments, newComment] };
      }
      return post;
    }));
  };

  const updateProfile = (profile: UserProfile) => {
    setProfiles(prev => ({ ...prev, [profile.id]: profile }));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const sendConnectionRequest = (fromId: string, toId: string) => {
    const user = profiles[fromId];
    addNotification({
      type: 'connection_request',
      fromId: fromId,
      fromName: user.name,
      fromAvatar: user.avatar
    });
  };

  const acceptConnectionRequest = (fromId: string, toId: string) => {
    setProfiles(prev => {
      const fromProfile = prev[fromId];
      const toProfile = prev[toId];
      if (!fromProfile || !toProfile) return prev;
      
      return {
        ...prev,
        [fromId]: { ...fromProfile, connections: [...new Set([...fromProfile.connections, toId])] },
        [toId]: { ...toProfile, connections: [...new Set([...toProfile.connections, fromId])] }
      };
    });
    
    const user = profiles[toId];
    addNotification({
      type: 'connection_accepted',
      fromId: toId,
      fromName: user.name,
      fromAvatar: user.avatar
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleApp = (appId: string) => {
    if (openWindows.includes(appId)) {
      setActiveWindow(appId);
    } else {
      const maxWindows = Number(policies['max_windows']?.value) || 10;
      if (openWindows.length >= maxWindows) {
        alert(`System Policy restricts opening more than ${maxWindows} windows.`);
        return;
      }
      setOpenWindows([...openWindows, appId]);
      setActiveWindow(appId);
    }
    setIsDrawerOpen(false);
  };

  const closeWindow = (appId: string) => {
    setOpenWindows(openWindows.filter(id => id !== appId));
    if (activeWindow === appId) {
      const remaining = openWindows.filter(id => id !== appId);
      setActiveWindow(remaining[remaining.length - 1] || null);
    }
  };

  const isBatterySaver = powerMode === 'battery-saver';
  const isPerformance = powerMode === 'performance';

  const isAnyMaximized = true;
  const isAnyActive = activeWindow !== null;
  const dockOpacity = isBatterySaver ? 'rgba(255, 255, 255, 0.05)' : ((isAnyMaximized || isAnyActive) ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.1)');
  const dockBlur = isBatterySaver ? 'none' : ((isAnyMaximized || isAnyActive) ? 'blur(60px)' : 'blur(40px)');

  const animationConfig = isBatterySaver ? { duration: 0 } : (isPerformance ? { type: 'spring', stiffness: 400, damping: 30 } : { type: 'spring', stiffness: 300, damping: 30 });

  return (
    <SystemContext.Provider value={{ accentColor, setAccentColor, powerMode, setPowerMode, installedApps, installApp, uninstallApp, autoAddToDock, setAutoAddToDock, dockApps, setDockApps }}>
      <SocialContext.Provider value={{ 
      posts, 
      addPost, 
      likePost, 
      addComment, 
      profiles, 
      updateProfile, 
      notifications, 
      addNotification, 
      markNotificationsAsRead,
      sendConnectionRequest,
      acceptConnectionRequest
    }}>
      <WallpaperContext.Provider value={{ wallpaper, setWallpaper }}>
        <div className="relative w-screen h-screen overflow-hidden bg-[#e2e8f0] flex flex-col">
          {/* Background Wallpaper */}
          {wallpaper ? (
            <img src={wallpaper} alt="Wallpaper" className="absolute inset-0 z-0 w-full h-full object-cover pointer-events-none" />
          ) : (
            <div 
              className="absolute inset-0 z-0 opacity-80 blur-[120px] scale-150 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 15% 15%, #2563eb 0%, transparent 45%), radial-gradient(circle at 85% 85%, #db2777 0%, transparent 45%), radial-gradient(circle at 50% 50%, #7c3aed 0%, transparent 55%), radial-gradient(circle at 80% 20%, #06b6d4 0%, transparent 40%)'
              }}
            />
          )}
          <div className="absolute inset-0 z-0 bg-slate-900/5 pointer-events-none" />

      {/* Workspace Layer - Windows are constrained here */}
      <div ref={workspaceRef} className="relative z-10 w-full flex-1 overflow-hidden">
        <AnimatePresence>
          {openWindows.map((appId) => {
            const app = installedApps.find(a => a.id === appId);
            if (!app) return null;
            const isActive = activeWindow === appId;
            const isMaximized = true;
            return (
              <motion.div
                key={appId}
                drag={!isMaximized}
                dragConstraints={workspaceRef}
                dragMomentum={false}
                dragElastic={0}
                whileDrag={{ scale: 1.02, opacity: 0.95 }}
                initial={{ 
                  opacity: 0, 
                  scale: 0.3, 
                  filter: 'blur(50px)',
                  top: 'calc(50% + 15rem)', 
                  left: 'calc(50% - 22.5rem)' 
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  filter: 'blur(0px)',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '0px',
                  boxShadow: isActive ? '0 25px 50px -12px rgba(0, 0, 0, 0.15)' : '0 0 0 0 rgba(0,0,0,0)'
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 1.2, 
                  filter: 'blur(50px)',
                  top: 'calc(50% - 45rem)', 
                  left: 'calc(50% - 22.5rem)' 
                }}
                transition={animationConfig}
                onClick={() => setActiveWindow(appId)}
                className={`absolute glass overflow-hidden flex flex-col ${isActive ? 'z-30' : 'z-20 opacity-80'}`}
                style={{ 
                  backdropFilter: isBatterySaver ? 'none' : 'blur(40px)',
                  boxShadow: isActive ? `0 0 0 2px ${accentColor}, 0 25px 50px -12px rgba(0, 0, 0, 0.15)` : '0 0 0 0 rgba(0,0,0,0)'
                }}
              >
                {/* Window Header */}
                <div 
                  className="h-12 flex items-center justify-between px-4 bg-white/20 border-b border-white/20 select-none cursor-grab active:cursor-grabbing"
                  onPointerDown={() => setActiveWindow(appId)}
                >
                  <div className="flex items-center gap-3">
                    <app.icon size="1.125rem" className="text-slate-600" />
                    <span className="text-sm font-bold text-slate-800">{app.name}</span>
                  </div>
                  <div className="flex items-center gap-1 cursor-default" onPointerDown={e => e.stopPropagation()}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); closeWindow(appId); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-slate-600"
                    >
                      <Minus size="1rem" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); closeWindow(appId); }}
                      className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-500/20 transition-colors text-red-600"
                    >
                      <X size="1rem" />
                    </button>
                  </div>
                </div>
                {/* Window Content */}
                <div className="flex-1 overflow-auto cursor-default" onPointerDown={e => e.stopPropagation()}>
                  <app.component isMaximized={isMaximized} />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* App Drawer Overlay */}
      <AnimatePresence>
        {isDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-center justify-center p-8 bg-slate-900/10 backdrop-blur-md"
            onClick={() => setIsDrawerOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-4xl glass rounded-[40px] p-12 flex flex-col items-center gap-12"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-full max-w-md relative flex flex-col items-center gap-2">
                <div className="w-full relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size="1.25rem" />
                  <input 
                    type="text" 
                    placeholder="Search apps, files, and more..."
                    className="w-full bg-white/10 border border-white/20 rounded-full py-4 pl-12 pr-6 outline-none focus:bg-white/20 focus:ring-4 focus:ring-white/10 transition-all text-lg text-slate-900 placeholder:text-slate-500"
                    autoFocus
                  />
                </div>
                <span className="text-xs text-slate-500">Right-click an app to pin/unpin from the dock</span>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 gap-12">
                {installedApps.map(app => (
                  <button
                    key={app.id}
                    onClick={() => toggleApp(app.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (dockApps.includes(app.id)) {
                        setDockApps(dockApps.filter(id => id !== app.id));
                      } else {
                        setDockApps([...dockApps, app.id]);
                      }
                    }}
                    className="flex flex-col items-center gap-3 group relative"
                  >
                    <div className={`w-20 h-20 ${app.color} rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-active:scale-95 transition-all duration-300`}>
                      <app.icon size="2.5rem" className="text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{app.name}</span>
                    {dockApps.includes(app.id) && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock Area - Unpassable by windows */}
      <div 
        className="relative z-50 flex justify-center items-end pointer-events-none"
        style={{ height: `${dockSize + 1}rem`, paddingBottom: '1rem' }}
      >
        <motion.div 
          layout
          className="mac-dock flex items-end pointer-events-auto transition-colors duration-500"
          style={{ 
            height: `${dockSize}rem`,
            padding: `0 ${dockSize * 0.2}rem`,
            gap: `${dockSize * 0.1}rem`,
            borderRadius: `${dockSize * 0.4}rem`,
            backgroundColor: dockOpacity,
            backdropFilter: dockBlur
          }}
        >
          {/* Launcher Button */}
          <button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className={`flex items-center justify-center transition-all duration-300 ${isDrawerOpen ? 'bg-white/40 shadow-inner' : 'hover:bg-white/30 hover:-translate-y-1'}`}
            style={{ 
              width: `${dockSize * 0.7}rem`, 
              height: `${dockSize * 0.7}rem`,
              borderRadius: `${dockSize * 0.2}rem`,
              marginBottom: `${dockSize * 0.1}rem`
            }}
          >
            <Grid size={`${dockSize * 0.35}rem`} className={isDrawerOpen ? 'text-slate-900' : 'text-slate-700'} />
          </button>

          <div className="bg-black/10" style={{ width: '1px', height: `${dockSize * 0.6}rem`, margin: `0 ${dockSize * 0.05}rem`, marginBottom: `${dockSize * 0.15}rem` }} />

          {/* App Icons */}
          {dockApps.map(appId => {
            const app = installedApps.find(a => a.id === appId);
            if (!app) return null;
            const isOpen = openWindows.includes(app.id);
            const isActive = activeWindow === app.id;
            return (
              <motion.button
                key={app.id}
                onClick={() => toggleApp(app.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setDockApps(dockApps.filter(id => id !== app.id));
                }}
                whileHover={{ scale: 1.2, marginBottom: `${dockSize * 0.2}rem` }}
                className="relative flex items-center justify-center transition-all group"
                style={{ 
                  width: `${dockSize * 0.7}rem`, 
                  height: `${dockSize * 0.7}rem`,
                  marginBottom: `${dockSize * 0.1}rem`
                }}
              >
                <div 
                  className={`w-full h-full ${app.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all`}
                  style={{ borderRadius: `${dockSize * 0.2}rem` }}
                >
                  <app.icon size={`${dockSize * 0.35}rem`} className="text-white" />
                </div>
                
                {isOpen && (
                  <div 
                    className={`absolute rounded-full ${isActive ? 'bg-slate-900' : 'bg-slate-400'}`} 
                    style={{
                      bottom: `-${dockSize * 0.1}rem`,
                      width: isActive ? `${dockSize * 0.1}rem` : `${dockSize * 0.06}rem`,
                      height: isActive ? `${dockSize * 0.1}rem` : `${dockSize * 0.06}rem`
                    }}
                  />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 px-3 py-1.5 glass rounded-xl text-xs font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                     style={{ top: `-${dockSize * 0.8}rem` }}>
                  {app.name}
                </div>
              </motion.button>
            );
          })}

          <div className="bg-black/10" style={{ width: '1px', height: `${dockSize * 0.6}rem`, margin: `0 ${dockSize * 0.05}rem`, marginBottom: `${dockSize * 0.15}rem` }} />

          {/* Resizer Handle */}
          <div 
            className="rounded-full bg-black/10 hover:bg-black/30 cursor-row-resize transition-colors"
            style={{ 
              width: `${dockSize * 0.1}rem`,
              height: `${dockSize * 0.6}rem`,
              margin: `0 ${dockSize * 0.05}rem`,
              marginBottom: `${dockSize * 0.15}rem`
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              const startY = e.clientY;
              const startSize = dockSize;
              const remInPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
              const onMove = (moveEvent: PointerEvent) => {
                const deltaPx = startY - moveEvent.clientY;
                const deltaRem = deltaPx / remInPx;
                setDockSize(Math.max(3, Math.min(8, startSize + deltaRem)));
              };
              const onUp = () => {
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
              };
              window.addEventListener('pointermove', onMove);
              window.addEventListener('pointerup', onUp);
            }}
          />

          <div className="bg-black/10" style={{ width: '1px', height: `${dockSize * 0.6}rem`, margin: `0 ${dockSize * 0.05}rem`, marginBottom: `${dockSize * 0.15}rem` }} />

          {/* System Tray */}
          <div 
            className="flex items-center"
            style={{ 
              height: `${dockSize * 0.7}rem`,
              gap: `${dockSize * 0.05}rem`,
              marginBottom: `${dockSize * 0.1}rem`
            }}
          >
            <div 
              className="flex items-center hover:bg-white/20 transition-colors"
              style={{ 
                padding: `0 ${dockSize * 0.15}rem`, 
                height: '100%', 
                borderRadius: `${dockSize * 0.2}rem`,
                gap: `${dockSize * 0.1}rem` 
              }}
            >
              <button onClick={() => toggleApp('power')} className="hover:text-slate-900 text-slate-500 transition-colors flex items-center h-full cursor-pointer">
                <Battery size={`${dockSize * 0.25}rem`} />
              </button>
            </div>
            <button 
              onClick={() => toggleApp('calendar')}
              className="font-bold text-slate-800 hover:bg-white/20 transition-colors flex items-center justify-center cursor-pointer" 
              style={{ 
                height: '100%',
                padding: `0 ${dockSize * 0.2}rem`,
                borderRadius: `${dockSize * 0.2}rem`,
                fontSize: `${Math.max(0.7, dockSize * 0.2)}rem` 
              }}
            >
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
    </WallpaperContext.Provider>
    </SocialContext.Provider>
    </SystemContext.Provider>
  );
}

export default function App() {
  return (
    <KernelProvider>
      <Desktop />
    </KernelProvider>
  );
}

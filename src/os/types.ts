export type Permission = 'camera' | 'microphone' | 'storage' | 'network' | 'notifications' | 'location';

export interface AppManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  permissions: Permission[];
  publisher: string;
}

export interface SystemPolicy {
  id: string;
  name: string;
  description: string;
  value: boolean | string | number;
  readonly?: boolean;
}

export interface UserRecord {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: number;
}

export interface OSState {
  policies: Record<string, SystemPolicy>;
  registry: Record<string, AppManifest>;
  users: Record<string, UserRecord>;
}

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SystemDB } from './Database';
import { SystemPolicy, AppManifest, UserRecord, OSState, Permission } from './types';

const defaultPolicies: Record<string, SystemPolicy> = {
  'allow_camera': { id: 'allow_camera', name: 'Allow Camera', description: 'Global camera access', value: true },
  'allow_telemetry': { id: 'allow_telemetry', name: 'Allow Telemetry', description: 'Send anonymous usage data', value: false },
  'require_auth': { id: 'require_auth', name: 'Require Authentication', description: 'Require login on startup', value: false },
  'max_windows': { id: 'max_windows', name: 'Max Open Windows', description: 'Maximum number of concurrent windows', value: 10 },
  'developer_mode': { id: 'developer_mode', name: 'Developer Mode', description: 'Enable advanced system tools', value: false },
};

const defaultUsers: Record<string, UserRecord> = {
  'admin': { id: 'admin', username: 'Administrator', role: 'admin', createdAt: Date.now() },
};

const defaultRegistry: Record<string, AppManifest> = {
  'settings': { id: 'settings', name: 'Settings', version: '1.0.0', description: 'System Configuration', permissions: ['storage'], publisher: 'Lumina OS' },
  'profile': { id: 'profile', name: 'Profile', version: '1.0.0', description: 'User Profile & Social', permissions: ['storage', 'network'], publisher: 'Lumina OS' },
  'note': { id: 'note', name: 'Notes', version: '1.0.0', description: 'Text Editor', permissions: ['storage'], publisher: 'Lumina OS' },
  'camera': { id: 'camera', name: 'Camera', version: '1.0.0', description: 'Photo & Video Capture', permissions: ['camera', 'storage'], publisher: 'Lumina OS' },
  'files': { id: 'files', name: 'Files', version: '1.0.0', description: 'File Manager', permissions: ['storage'], publisher: 'Lumina OS' },
  'registry': { id: 'registry', name: 'Registry Editor', version: '1.0.0', description: 'System Registry & Governance', permissions: ['storage', 'network'], publisher: 'Lumina OS' },
};

interface KernelContextType {
  policies: Record<string, SystemPolicy>;
  registry: Record<string, AppManifest>;
  users: Record<string, UserRecord>;
  updatePolicy: (id: string, value: boolean | string | number) => void;
  registerApp: (manifest: AppManifest) => void;
  checkPermission: (appId: string, permission: Permission) => boolean;
  resetToDefaults: () => void;
}

export const KernelContext = createContext<KernelContextType | null>(null);

export const KernelProvider = ({ children }: { children: ReactNode }) => {
  const [policies, setPolicies] = useState<Record<string, SystemPolicy>>(defaultPolicies);
  const [registry, setRegistry] = useState<Record<string, AppManifest>>(defaultRegistry);
  const [users, setUsers] = useState<Record<string, UserRecord>>(defaultUsers);

  useEffect(() => {
    const savedPolicies = SystemDB.read<Record<string, SystemPolicy>>('policies');
    const savedRegistry = SystemDB.read<Record<string, AppManifest>>('registry');
    const savedUsers = SystemDB.read<Record<string, UserRecord>>('users');

    if (savedPolicies) setPolicies({ ...defaultPolicies, ...savedPolicies });
    if (savedRegistry) setRegistry({ ...defaultRegistry, ...savedRegistry });
    if (savedUsers) setUsers({ ...defaultUsers, ...savedUsers });
  }, []);

  const updatePolicy = (id: string, value: boolean | string | number) => {
    setPolicies(prev => {
      const next = { ...prev, [id]: { ...prev[id], value } };
      SystemDB.write('policies', next);
      return next;
    });
  };

  const registerApp = (manifest: AppManifest) => {
    setRegistry(prev => {
      const next = { ...prev, [manifest.id]: manifest };
      SystemDB.write('registry', next);
      return next;
    });
  };

  const checkPermission = (appId: string, permission: Permission): boolean => {
    const app = registry[appId];
    if (!app) return false;
    
    // Check global policy overrides
    if (permission === 'camera' && policies['allow_camera']?.value === false) return false;
    
    return app.permissions.includes(permission);
  };

  const resetToDefaults = () => {
    SystemDB.clearAll();
    setPolicies(defaultPolicies);
    setRegistry(defaultRegistry);
    setUsers(defaultUsers);
  };

  return (
    <KernelContext.Provider value={{
      policies,
      registry,
      users,
      updatePolicy,
      registerApp,
      checkPermission,
      resetToDefaults
    }}>
      {children}
    </KernelContext.Provider>
  );
};

export const useKernel = () => {
  const context = useContext(KernelContext);
  if (!context) throw new Error('useKernel must be used within a KernelProvider');
  return context;
};

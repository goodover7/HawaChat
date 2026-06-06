// Powered by OnSpace.AI
// Updated AuthContext: fixes session persistence + supports new user fields
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  User, getSession, logoutUser, updateUser, getAllUsers, transferCoins,
  deleteUserAvatar, changeDisplayName, toggleHiddenStatus,
} from '@/services/authService';

interface AuthContextType {
  currentUser: User | null;
  allUsers: User[];
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshAllUsers: () => Promise<void>;
  updateCurrentUser: (updates: Partial<User>) => Promise<void>;
  sendCoins: (toId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  deleteAvatar: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  renameUser: (targetId: string, newName: string) => Promise<{ success: boolean; error?: string }>;
  toggleHidden: () => Promise<{ success: boolean; isHidden?: boolean }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initSession();
  }, []);

  async function initSession() {
    setIsLoading(true);
    try {
      const [user, users] = await Promise.all([getSession(), getAllUsers()]);
      setAllUsers(users);
      setCurrentUser(user);
    } catch (e) {
      console.error('Session init error', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAllUsers() {
    const users = await getAllUsers();
    setAllUsers(users);
  }

  async function logout() {
    if (currentUser) await logoutUser(currentUser.id);
    setCurrentUser(null);
  }

  async function refreshUser() {
    if (!currentUser) return;
    const users = await getAllUsers();
    setAllUsers(users);
    const updated = users.find(u => u.id === currentUser.id);
    if (updated) setCurrentUser({ ...updated });
  }

  async function refreshAllUsers() {
    await loadAllUsers();
    // Also refresh current user from storage
    if (currentUser) {
      const users = await getAllUsers();
      const updated = users.find(u => u.id === currentUser.id);
      if (updated) setCurrentUser({ ...updated });
    }
  }

  async function updateCurrentUser(updates: Partial<User>) {
    if (!currentUser) return;
    const updated = await updateUser(currentUser.id, updates);
    if (updated) {
      setCurrentUser({ ...updated });
    }
    await loadAllUsers();
  }

  async function sendCoins(toId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    if (!currentUser) return { success: false, error: 'غير مسجل الدخول' };
    const result = await transferCoins(currentUser.id, toId, amount);
    if (result.success) {
      await refreshUser();
      await loadAllUsers();
    }
    return result;
  }

  async function deleteAvatar(targetId: string): Promise<{ success: boolean; error?: string }> {
    if (!currentUser) return { success: false, error: 'غير مسجل الدخول' };
    const result = await deleteUserAvatar(targetId, currentUser.id);
    if (result.success) await loadAllUsers();
    return result;
  }

  async function renameUser(targetId: string, newName: string): Promise<{ success: boolean; error?: string }> {
    if (!currentUser) return { success: false, error: 'غير مسجل الدخول' };
    const result = await changeDisplayName(targetId, currentUser.id, newName);
    if (result.success) {
      await loadAllUsers();
      if (targetId === currentUser.id) {
        const users = await getAllUsers();
        const updated = users.find(u => u.id === currentUser.id);
        if (updated) setCurrentUser({ ...updated });
      }
    }
    return result;
  }

  async function toggleHidden(): Promise<{ success: boolean; isHidden?: boolean }> {
    if (!currentUser || currentUser.rank !== 'owner') return { success: false };
    const result = await toggleHiddenStatus(currentUser.id);
    if (result.success) {
      await refreshUser();
      await loadAllUsers();
    }
    return result;
  }

  return (
    <AuthContext.Provider value={{
      currentUser, allUsers, isLoading, setCurrentUser,
      logout, refreshUser, refreshAllUsers, updateCurrentUser,
      sendCoins, deleteAvatar, renameUser, toggleHidden,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

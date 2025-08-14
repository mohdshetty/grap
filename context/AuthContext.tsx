
import React, { createContext, useState, useCallback, useMemo, useContext } from 'react';
import { User, UserRole } from '../types';
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password_unused: string) => boolean;
  logout: () => void;
  registerHod: (name: string, username: string, password_unused: string, departmentId: number) => { success: boolean, message: string };
  registerDean: (name: string, username: string, password_unused: string, facultyId: number) => { success: boolean, message: string };
  deleteUser: (userId: number) => void;
  restoreUser: (userId: number) => void;
  updateUserProfile: (userId: number, profileData: Partial<Pick<User, 'name' | 'phone' | 'profilePictureUrl'>>) => void;
  changePassword: (userId: number, oldPassword_unused: string, newPassword_unused: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((username: string, password_unused: string) => {
    // In a real app, you'd verify the password against a backend.
    const foundUser = users.find(u => u.username === username && !u.isDeleted);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const registerHod = useCallback((name: string, username: string, password_unused: string, departmentId: number) => {
    if (users.some(u => u.username === username)) {
        return { success: false, message: 'Username (email) already exists.' };
    }
    if (users.some(u => u.departmentId === departmentId && !u.isDeleted)) {
        return { success: false, message: 'That department already has an HOD assigned.' };
    }
    const newHod: User = {
        id: Math.max(...users.map(u => u.id)) + 1,
        username,
        password: password_unused,
        role: UserRole.HOD,
        name,
        departmentId,
        staffId: `BOSU/HOD/NEW/${String(departmentId).slice(-3)}`,
        isDeleted: false,
    };
    setUsers(prevUsers => [...prevUsers, newHod]);
    return { success: true, message: 'HOD registered successfully!' };
  }, [users]);

  const registerDean = useCallback((name: string, username: string, password_unused: string, facultyId: number) => {
    if (users.some(u => u.username === username)) {
        return { success: false, message: 'Username (email) already exists.' };
    }
    if (users.some(u => u.role === UserRole.DEAN && u.facultyId === facultyId && !u.isDeleted)) {
        return { success: false, message: 'That faculty already has a Dean assigned.' };
    }
    const newDean: User = {
        id: Math.max(...users.map(u => u.id)) + 1,
        username,
        password: password_unused,
        role: UserRole.DEAN,
        name,
        facultyId,
        staffId: `BOSU/DEAN/NEW/${String(facultyId).slice(-3)}`,
        isDeleted: false,
    };
    setUsers(prevUsers => [...prevUsers, newDean]);
    return { success: true, message: 'Dean registered successfully!' };
  }, [users]);

  const deleteUser = useCallback((userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isDeleted: true } : u));
  }, []);
  
  const restoreUser = useCallback((userId: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isDeleted: false } : u));
  }, []);

  const updateUserProfile = useCallback((userId: number, profileData: Partial<Pick<User, 'name' | 'phone' | 'profilePictureUrl'>>) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...profileData } : u));
    if (user?.id === userId) {
        setUser(prevUser => prevUser ? { ...prevUser, ...profileData } : null);
    }
  }, [user]);

  const changePassword = useCallback((userId: number, oldPassword_unused: string, newPassword_unused: string) => {
    // This is a mock, in a real app, this would be an API call and would check the old password.
    const userToUpdate = users.find(u => u.id === userId);
    // In a real app: if (userToUpdate && userToUpdate.password === oldPassword) { ... }
    if (userToUpdate) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword_unused } : u));
        return true;
    }
    return false;
  }, [users]);


  const value = useMemo(() => ({ user, users, login, logout, registerHod, registerDean, deleteUser, restoreUser, updateUserProfile, changePassword }), [user, users, login, logout, registerHod, registerDean, deleteUser, restoreUser, updateUserProfile, changePassword]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
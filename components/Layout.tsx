
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { BOSU_LOGO_BASE64 } from '../constants';

const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-800';
      case UserRole.DEAN: return 'bg-blue-100 text-blue-800';
      case UserRole.HOD: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <img src={BOSU_LOGO_BASE64} alt="BOSU Logo" className="h-12 w-auto" />
              <div className="ml-4">
                 <h1 className="text-xl font-bold text-bosu-blue">Employment Gap Analysis</h1>
                 <p className="text-sm text-gray-500">Borno State University</p>
              </div>
            </div>
            {user && (
              <div className="flex items-center">
                <div className="text-right mr-4">
                  <p className="font-semibold text-gray-800">{user.name}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  aria-label="Logout"
                >
                  <LogoutIcon className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

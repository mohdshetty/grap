
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { User, Notification, UserRole } from '../types';
import {
    ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, BellIcon, GraduationCapIcon,
    LogOutIcon, MenuIcon, QuestionMarkCircleIcon, UserCircleIcon, UserPlusIcon, Settings2Icon
} from './Icons';

const timeSince = (dateStr: string): string => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 86400;
    if (interval > 1) return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

interface NavItem {
    name: string;
    icon: React.FC<{ className?: string }>;
    title?: string;
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    user: User | null;
    pageTitle: string;
    userRoleName: string;
    navItems: NavItem[];
    utilityNavItems?: NavItem[];
    managementNavItems?: NavItem[];
    systemNavItems?: NavItem[];
    activePage: string;
    setActivePage: (page: string, title?: string) => void;
    onLogout: () => void;
    onCreateUser?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children, user, pageTitle, userRoleName, navItems, utilityNavItems, managementNavItems,
    systemNavItems, activePage, setActivePage, onLogout, onCreateUser
}) => {
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const notificationDropdownRef = useRef<HTMLDivElement>(null);
    
    const { notifications, unreadCount, markAllAsRead, handleNotificationClick } = useNotifications();
    
    const handleNavClick = (page: string, title?: string) => {
        const newTitle = title || page;
        setActivePage(page, newTitle);
    };

    const handleSupportClick = () => {
        const supportPage = user?.role === UserRole.ADMIN ? 'Support Center' : 'Support';
        handleNavClick(supportPage);
        setIsProfileDropdownOpen(false);
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
            setIsProfileDropdownOpen(false);
        }
        if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node)) {
            setIsNotificationDropdownOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    const getNavLinkClasses = (pageName: string) => {
        const base = `w-full flex items-center gap-3 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out text-left text-sm ${isSidebarExpanded ? 'px-3' : 'justify-center'}`;
        const active = "bg-blue-600 text-white shadow-lg shadow-blue-500/20";
        const inactive = "text-slate-600 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white";
        return `${base} ${activePage === pageName ? active : inactive}`;
    }
    
    if (!user) {
        return null;
    }
    
    const profilePicBg = user.role === UserRole.ADMIN ? 'FEE2E2' : user.role === UserRole.DEAN ? 'E0E7FF' : 'EBF4FF';
    const profilePicColor = user.role === UserRole.ADMIN ? '991B1B' : user.role === UserRole.DEAN ? '4F46E5' : '003366';

    return (
        <div className={`flex h-screen bg-slate-100 font-sans text-slate-800 dark:bg-slate-900 dark:text-slate-200`}>
            <aside className={`flex-shrink-0 flex flex-col bg-white/95 dark:bg-slate-800/95 backdrop-blur-lg border-r dark:border-slate-700/50 transition-all duration-300 ${isSidebarExpanded ? 'w-[260px]' : 'w-20'}`}>
                <div className={`h-20 flex items-center gap-3 shrink-0 border-b dark:border-slate-700/50 ${isSidebarExpanded ? 'px-6' : 'px-0 justify-center'}`}>
                    <div className="bg-bosu-blue p-2.5 rounded-lg shadow-md"><GraduationCapIcon className="w-6 h-6 text-white"/></div>
                    <div className={`transition-opacity duration-200 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                        <h1 className="font-bold text-bosu-blue dark:text-white text-lg">EGAS Portal</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.role} Panel</p>
                    </div>
                </div>

                 <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                    <nav className="space-y-1">
                        {navItems.map(item => <button key={item.name} onClick={() => handleNavClick(item.name, item.title)} className={getNavLinkClasses(item.name)}><item.icon className="w-5 h-5"/> <span className={isSidebarExpanded ? 'inline' : 'hidden'}>{item.name}</span></button>)}
                    </nav>
                    {managementNavItems && (
                        <div className="space-y-1">
                            <h3 className={`px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${isSidebarExpanded ? '' : 'text-center'}`}>{isSidebarExpanded ? 'Management' : 'Mgmt'}</h3>
                            {managementNavItems.map(item => <button key={item.name} onClick={() => handleNavClick(item.name, item.title)} className={getNavLinkClasses(item.name)}><item.icon className="w-5 h-5"/> <span className={isSidebarExpanded ? 'inline' : 'hidden'}>{item.name}</span></button>)}
                        </div>
                    )}
                     {systemNavItems && (
                        <div className="space-y-1">
                            <h3 className={`px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ${isSidebarExpanded ? '' : 'text-center'}`}>{isSidebarExpanded ? 'System' : 'Sys'}</h3>
                            {systemNavItems.map(item => <button key={item.name} onClick={() => handleNavClick(item.name, item.title)} className={getNavLinkClasses(item.name)}><item.icon className="w-5 h-5"/> <span className={isSidebarExpanded ? 'inline' : 'hidden'}>{item.name}</span></button>)}
                        </div>
                    )}
                     {utilityNavItems && (
                        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
                            {utilityNavItems.map(item => <button key={item.name} onClick={() => handleNavClick(item.name, item.title)} className={getNavLinkClasses(item.name)}><item.icon className="w-5 h-5"/> <span className={isSidebarExpanded ? 'inline' : 'hidden'}>{item.name}</span></button>)}
                        </div>
                    )}
                </div>

                <div className="p-3 border-t dark:border-slate-700/50">
                    <button onClick={onLogout} className={`${getNavLinkClasses('Logout')} text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20`}>
                        <LogOutIcon className="w-5 h-5" /> <span className={isSidebarExpanded ? 'inline' : 'hidden'}>Logout</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex-shrink-0 h-20 flex items-center justify-between px-8 border-b dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarExpanded(prev => !prev)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 -ml-4 dark:text-slate-400 dark:hover:bg-slate-700">
                           {isSidebarExpanded ? <ChevronLeftIcon /> : <MenuIcon />}
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white hidden sm:block">{pageTitle}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {onCreateUser && (
                             <button onClick={onCreateUser} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700">
                                <UserPlusIcon className="w-5 h-5"/>
                                <span className="hidden md:inline">Add Staff</span>
                            </button>
                        )}
                        <div className="relative" ref={notificationDropdownRef}>
                            <button onClick={() => setIsNotificationDropdownOpen(p => !p)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 relative">
                                <BellIcon className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] ring-2 ring-white dark:ring-slate-800/80">{unreadCount}</span>
                                )}
                            </button>
                            {isNotificationDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-40">
                                    <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">Notifications</h4>
                                        {unreadCount > 0 && <button onClick={markAllAsRead} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Mark all as read</button>}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? notifications.map(n => (
                                            <div key={n.id} onClick={() => handleNotificationClick(n, (page) => handleNavClick(page, page), () => setIsNotificationDropdownOpen(false))} className={`flex items-start gap-3 p-4 cursor-pointer transition-colors ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-slate-800'} hover:bg-slate-50 dark:hover:bg-slate-700/50`}>
                                                {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>}
                                                <div className={n.isRead ? 'pl-5' : ''}>
                                                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{n.title}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeSince(n.timestamp)}</p>
                                                </div>
                                            </div>
                                        )) : <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-12">No notifications yet.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={profileDropdownRef}>
                            <button onClick={() => setIsProfileDropdownOpen(p => !p)} className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-700/50">
                                <img src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${user.name.replace(' ', '+')}&background=${profilePicBg}&color=${profilePicColor}`} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                <div className="text-sm text-left hidden md:block">
                                    <p className="font-semibold text-slate-800 dark:text-white">{user.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{userRoleName}</p>
                                </div>
                                <ChevronDownIcon className="w-5 h-5 text-slate-400 hidden md:block" />
                            </button>
                            {isProfileDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-700 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 py-1.5 z-40">
                                    <div className="px-3.5 py-2.5 border-b dark:border-slate-600"><p className="font-bold text-sm text-slate-800 dark:text-white">{user.name}</p><p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.username}</p></div>
                                    <div className="p-1.5">
                                        <button onClick={() => { handleNavClick('My Profile', 'My Profile'); setIsProfileDropdownOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-600"><UserCircleIcon /> My Profile</button>
                                        <button onClick={() => { handleNavClick('Settings', 'Settings'); setIsProfileDropdownOpen(false); }} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-600"><Settings2Icon className="w-5 h-5" /> Settings</button>
                                        <button onClick={handleSupportClick} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-600"><QuestionMarkCircleIcon /> Support</button>
                                    </div>
                                    <div className="py-1.5 border-t dark:border-slate-600 px-1.5">
                                        <button onClick={onLogout} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg"><LogOutIcon /> Logout</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8">{children}</main>
            </div>
        </div>
    );
};

export default DashboardLayout;

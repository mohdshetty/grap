import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { MOCK_HISTORY_LOGS, NUC_REQUIREMENTS as INITIAL_NUC_REQUIREMENTS, ACADEMIC_RANKS, MOCK_SUPPORT_TICKETS, MOCK_KB_ARTICLES, EMPLOYMENT_TYPES } from '../constants';
import { Submission, SubmissionStatus, StaffCount, Department, Faculty, UserRole, User, HistoryLog, AcademicRank, SupportTicket, TicketStatus, TicketPriority, TicketCategory, KnowledgeBaseArticle, EmploymentType, Announcement, DepartmentStaffing } from '../types';
import Card, { CardHeader, CardContent, CardFooter } from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import {
    DashboardIcon, SubmissionsIcon, ReportsIcon, AnalyticsIcon, StaffManagementIcon, BuildingOfficeIcon,
    RoleManagementIcon, AnnouncementIcon, SupportIcon, HistoryIcon, SettingsIcon, SearchIcon, RecycleBinIcon,
    XIcon, CheckCircle2Icon, XCircleIcon, RefreshIcon, UserPlusIcon, TrashIcon, CalendarDaysIcon, ShieldCheckIcon,
    TicketIcon, BookOpenIcon, CameraIcon, ClockIcon, UsersIcon, SendIcon, EyeIcon, PencilIcon, DownloadIcon,
    ClipboardDocumentListIcon, UserCircleIcon, SunIcon, MoonIcon, ChevronDownIcon
} from '../components/Icons';


// --- TYPES for Role Management ---
export type Permissions = {
    [key: string]: {
        hod: boolean;
        dean: boolean;
    }
};

const INITIAL_PERMISSIONS: Permissions = {
    dashboard: { hod: true, dean: true },
    dataSubmission: { hod: true, dean: false },
    submissionHistory: { hod: true, dean: false },
    departmentAnalytics: { hod: true, dean: false },
    reviewSubmissions: { hod: false, dean: true },
    facultyAnalytics: { hod: false, dean: true },
    facultyReports: { hod: false, dean: true },
    manageStructure: { hod: false, dean: true },
    contactDirectory: { hod: true, dean: true },
    settings: { hod: true, dean: true },
};

type FeatureDefinition = {
    key: string;
    name: string;
    description: string;
    appliesTo: ('HOD' | 'DEAN')[];
};

const CONTROLLABLE_FEATURES: FeatureDefinition[] = [
    { key: 'dashboard', name: 'View Dashboard', description: 'Access the main dashboard view with stats and summaries.', appliesTo: ['HOD', 'DEAN'] },
    { key: 'dataSubmission', name: 'Submit Staffing Data', description: 'Allows creating, editing, and submitting departmental staffing data.', appliesTo: ['HOD'] },
    { key: 'submissionHistory', name: 'View Submission History', description: 'Access to view past submissions for their department.', appliesTo: ['HOD'] },
    { key: 'departmentAnalytics', name: 'View Department Analytics', description: 'Access to view analytics specific to their department.', appliesTo: ['HOD'] },
    { key: 'reviewSubmissions', name: 'Review Submissions', description: 'Allows approving or rejecting submissions from HODs within the faculty.', appliesTo: ['DEAN'] },
    { key: 'facultyAnalytics', name: 'View Faculty Analytics', description: 'Access to view analytics for the entire faculty.', appliesTo: ['DEAN'] },
    { key: 'facultyReports', name: 'Generate Faculty Reports', description: 'Allows generating summary and gap analysis reports for the faculty.', appliesTo: ['DEAN'] },
    { key: 'manageStructure', name: 'Manage Departments & HODs', description: 'Allows adding new departments and registering new HODs within the faculty.', appliesTo: ['DEAN'] },
    { key: 'contactDirectory', name: 'Use Contact Directory', description: 'Access to the support/contact page to message other staff.', appliesTo: ['HOD', 'DEAN'] },
    { key: 'settings', name: 'Access Own Settings', description: 'Allows users to change their own profile information and password.', appliesTo: ['HOD', 'DEAN'] },
];


// --- HELPER & UTILITY COMPONENTS ---

const timeSince = (dateStr: string) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
};

const ProgressBar: React.FC<{ value: number, color?: string, className?: string }> = ({ value, color = 'bg-blue-600', className='' }) => (
    <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 ${className}`}>
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }}></div>
    </div>
);

const getStatusChipStyle = (status: SubmissionStatus | TicketStatus) => {
    switch (status) {
        case SubmissionStatus.APPROVED:
             return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 ring-1 ring-inset ring-green-200 dark:ring-green-700';
        case SubmissionStatus.PENDING:
             return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-700';
        case SubmissionStatus.REJECTED:
             return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 ring-1 ring-inset ring-red-200 dark:ring-red-700';
        case SubmissionStatus.DRAFT:
             return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-600';
        case TicketStatus.OPEN:
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-inset ring-blue-200 dark:ring-blue-700';
        case TicketStatus.IN_PROGRESS:
            return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 ring-1 ring-inset ring-purple-200 dark:ring-purple-700';
        case TicketStatus.RESOLVED:
            return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 ring-1 ring-inset ring-green-200 dark:ring-green-700';
        case TicketStatus.CLOSED:
            return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-600';
        default: return 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 ring-1 ring-inset ring-sky-200 dark:ring-sky-700';
    }
};

const getPriorityChipStyle = (priority: TicketPriority) => {
    switch (priority) {
        case TicketPriority.URGENT: return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
        case TicketPriority.HIGH: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
        case TicketPriority.MEDIUM: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
        case TicketPriority.LOW: return 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300';
        default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
};

const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}> = ({ enabled, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      className={`${
        enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
      role="switch"
      aria-checked={enabled}
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  );
};

const ExportButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(prev => !prev)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                <DownloadIcon className="w-4 h-4" />
                Export
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <button onClick={() => alert('Exporting as PDF...')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">Export as PDF</button>
                        <button onClick={() => alert('Exporting as CSV...')} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">Export as CSV</button>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- MODAL COMPONENTS ---

const RankInputGroup: React.FC<{
    rank: AcademicRank;
    staffingData: DepartmentStaffing;
    onChange: (rank: AcademicRank, type: EmploymentType, value: number) => void;
}> = ({ rank, staffingData, onChange }) => {
    const rankData = staffingData[rank] || {};
    const total = useMemo(() => Object.values(rankData).reduce((sum: number, count: number) => sum + (count || 0), 0), [rankData]);

    return (
        <div className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <h4 className="font-semibold text-slate-800 dark:text-slate-200">{rank}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {EMPLOYMENT_TYPES.map(type => (
                    <div key={type}>
                        <label className="text-xs text-slate-500 dark:text-slate-400">{type}</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full p-2 mt-1 border border-slate-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            value={rankData[type] || ''}
                            onChange={(e) => onChange(rank, type, parseInt(e.target.value, 10) || 0)}
                            placeholder="0"
                        />
                    </div>
                ))}
            </div>
            <div className="text-right mt-2 font-bold text-slate-600 dark:text-slate-300">Total: {total}</div>
        </div>
    );
};

const AdminEditDataModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (departmentId: number, data: DepartmentStaffing) => void;
    department: Department | null;
    initialSubmission: Submission | undefined;
}> = ({ isOpen, onClose, onSave, department, initialSubmission }) => {
    const [staffingData, setStaffingData] = useState<DepartmentStaffing>({});

    useEffect(() => {
        if (isOpen && department) {
            setStaffingData(initialSubmission?.data ? JSON.parse(JSON.stringify(initialSubmission.data)) : {});
        }
    }, [isOpen, department, initialSubmission]);

    const handleDataChange = (rank: AcademicRank, type: EmploymentType, value: number) => {
        setStaffingData(prev => ({
            ...prev,
            [rank]: { ...prev[rank], [type]: value >= 0 ? value : 0, }
        }));
    };

    const handleSave = () => {
        if (department) {
            onSave(department.id, staffingData);
        }
    };

    if (!isOpen || !department) return null;

    return (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all shadow-2xl">
                <CardHeader className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Staffing Data for {department.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Modify the staff counts for this department.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
                </CardHeader>

                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="space-y-4 animate-fade-in">
                        {ACADEMIC_RANKS.map(rank => <RankInputGroup key={rank} rank={rank} staffingData={staffingData} onChange={handleDataChange} />)}
                    </div>
                </div>

                <CardFooter className="flex justify-end items-center gap-3">
                    <button onClick={onClose} className="py-2.5 px-6 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 transition-all dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">Cancel</button>
                    <button onClick={handleSave} className="py-2.5 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all">Save Changes</button>
                </CardFooter>
            </Card>
        </div>
    );
};


const ChangePasswordModal: React.FC<{ isOpen: boolean, onClose: () => void, userId: number }> = ({ isOpen, onClose, userId }) => {
    const { changePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        const success = changePassword(userId, currentPassword, newPassword);
        if (success) {
            alert("Password changed successfully!");
            onClose();
        } else {
            setError("Could not change password. Please check your current password.");
        }
    }

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-center px-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm sm:text-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm sm:text-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 text-slate-900 dark:bg-slate-700 dark:text-white shadow-sm sm:text-sm"/>
                        </div>
                    </div>
                    <div className="flex justify-end items-center p-5 border-t bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 rounded-b-xl gap-3">
                         <button type="button" onClick={onClose} className="py-2.5 px-6 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500 dark:hover:bg-slate-500">Cancel</button>
                        <button type="submit" className="py-2.5 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const RecycleBinModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    tabs: { name: string, items: any[], onRestore: (id: number) => void }[],
    title: string
}> = ({ isOpen, onClose, tabs, title }) => {
    const [activeTab, setActiveTab] = useState(tabs[0]?.name || '');

    useEffect(() => {
        if(isOpen && tabs.length > 0) {
            setActiveTab(tabs[0].name);
        }
    }, [isOpen, tabs]);

    if (!isOpen) return null;

    const currentTabData = tabs.find(t => t.name === activeTab);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-5 h-5"/></button>
                </div>

                {tabs.length > 1 && (
                    <div className="border-b border-slate-200 dark:border-slate-700">
                        <nav className="-mb-px flex space-x-6 px-5">
                            {tabs.map(tab => (
                                <button key={tab.name} onClick={() => setActiveTab(tab.name)} className={`${activeTab === tab.name ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>
                                    {tab.name}
                                </button>
                            ))}
                        </nav>
                    </div>
                )}
                
                <div className="p-5 max-h-[60vh] overflow-y-auto">
                    {currentTabData && currentTabData.items.length > 0 ? (
                        <ul className="space-y-2">
                            {currentTabData.items.map(item => (
                                <li key={item.id} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg">
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                                    <button onClick={() => currentTabData.onRestore(item.id)} className="flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                                        <RefreshIcon className="w-4 h-4"/>
                                        Restore
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <RecycleBinIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                            <p className="mt-2 font-medium">The recycle bin is empty.</p>
                        </div>
                    )}
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 flex justify-end gap-3 rounded-b-xl border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-700 dark:border-slate-600 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Close</button>
                </div>
            </div>
        </div>
    );
};

const UpdateStatusModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    submission: Submission | null,
    onUpdate: (departmentId: number, status: SubmissionStatus, notes?: string) => void,
    getDepartmentName: (id: number) => string
}> = ({ isOpen, onClose, submission, onUpdate, getDepartmentName }) => {
    const [status, setStatus] = useState<SubmissionStatus>(SubmissionStatus.PENDING);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (submission) {
            setStatus(submission.status);
            setNotes(submission.notes || '');
        }
    }, [submission]);

    if (!isOpen || !submission) return null;

    const handleUpdate = () => {
        onUpdate(submission.departmentId, status, notes);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg transform" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Update Submission Status</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">For department: <span className="font-semibold">{getDepartmentName(submission.departmentId)}</span></p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value as SubmissionStatus)} className="w-full px-3 py-2 border border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                <option value={SubmissionStatus.PENDING}>Pending</option>
                                <option value={SubmissionStatus.APPROVED}>Approved</option>
                                <option value={SubmissionStatus.REJECTED}>Needs Correction</option>
                            </select>
                        </div>
                        {status === SubmissionStatus.REJECTED && (
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Feedback / Reason for Correction</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 border border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Provide clear feedback for the HOD..."></textarea>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white dark:bg-slate-700 border dark:border-slate-600 border-slate-300 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                    <button type="button" onClick={handleUpdate} className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

const CreateUserModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { users, registerHod, registerDean } = useAuth();
    const { departments, faculties } = useData();
    
    const [accountType, setAccountType] = useState('HOD');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [assignmentId, setAssignmentId] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if(isOpen) {
            setAccountType('HOD');
            setFullName('');
            setUsername('');
            setPassword('');
            setAssignmentId('');
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const availableDepartments = useMemo(() => {
        const assignedDeptIds = new Set(users.filter(u => u.role === UserRole.HOD && u.departmentId && !u.isDeleted).map(u => u.departmentId));
        return departments.filter(d => !d.isDeleted && !assignedDeptIds.has(d.id));
    }, [users, departments]);

    const availableFaculties = useMemo(() => {
        const assignedFacultyIds = new Set(users.filter(u => u.role === UserRole.DEAN && u.facultyId && !u.isDeleted).map(u => u.facultyId));
        return faculties.filter(f => !f.isDeleted && !assignedFacultyIds.has(f.id));
    }, [users, faculties]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!fullName || !username || !password || !assignmentId) {
            setError('All fields are required.');
            return;
        }

        let result;
        if (accountType === 'HOD') {
            result = registerHod(fullName, username, password, Number(assignmentId));
        } else {
            result = registerDean(fullName, username, password, Number(assignmentId));
        }

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => onClose(), 2000);
        } else {
            setError(result.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="flex justify-between items-start">
                           <div>
                             <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Staff</h2>
                             <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create an account for a new HOD or Dean.</p>
                           </div>
                           <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-5 h-5"/></button>
                        </div>
                        
                        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded-md text-sm"><p>{error}</p></div>}
                        {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 rounded-md text-sm"><p>{success}</p></div>}

                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Account Type</label>
                                <div className="flex gap-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 p-1">
                                    <button type="button" onClick={() => { setAccountType('HOD'); setAssignmentId(''); }} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${accountType === 'HOD' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>HOD</button>
                                    <button type="button" onClick={() => { setAccountType('DEAN'); setAssignmentId(''); }} className={`w-full py-2 text-sm font-semibold rounded-md transition-colors ${accountType === 'DEAN' ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>Dean</button>
                                </div>
                             </div>
                            
                            <hr className="border-slate-200 dark:border-slate-700" />

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username (Email)</label>
                                <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    {accountType === 'HOD' ? 'Assign to Department' : 'Assign to Faculty'}
                                </label>
                                <select value={assignmentId} onChange={e => setAssignmentId(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                    <option value="" disabled>Select an option</option>
                                    {accountType === 'HOD' ? (
                                        availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                                    ) : (
                                        availableFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)
                                    )}
                                    {(accountType === 'HOD' && availableDepartments.length === 0) && <option disabled>No available departments</option>}
                                    {(accountType === 'DEAN' && availableFaculties.length === 0) && <option disabled>No available faculties</option>}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white dark:bg-slate-700 border dark:border-slate-600 border-slate-300 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                        <button type="submit" disabled={!!success} className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400">Add Staff Member</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ViewStaffModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    submission: Submission | null,
    getDepartmentName: (id: number) => string
}> = ({ isOpen, onClose, submission, getDepartmentName }) => {
    if (!isOpen || !submission) return null;

    const departmentName = getDepartmentName(submission.departmentId);

    const staffData = ACADEMIC_RANKS.map(rank => {
        const rankData = submission.data[rank] || {};
        const permanent = rankData[EmploymentType.PERMANENT] || 0;
        const sabbatical = rankData[EmploymentType.SABBATICAL] || 0;
        const visiting = rankData[EmploymentType.VISITING] || 0;
        const total = permanent + sabbatical + visiting;
        return { rank, permanent, sabbatical, visiting, total };
    });

    const grandTotalPermanent = staffData.reduce((acc, curr) => acc + curr.permanent, 0);
    const grandTotalSabbatical = staffData.reduce((acc, curr) => acc + curr.sabbatical, 0);
    const grandTotalVisiting = staffData.reduce((acc, curr) => acc + curr.visiting, 0);
    const grandTotal = staffData.reduce((acc, curr) => acc + curr.total, 0);


    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl transform" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Staff Details</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Department of {departmentName} - Submitted on {new Date(submission.lastUpdated).toLocaleDateString()}
                    </p>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {grandTotal > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Academic Rank</th>
                                        <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Permanent</th>
                                        <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Sabbatical</th>
                                        <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Visiting</th>
                                        <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {staffData.map(({ rank, permanent, sabbatical, visiting, total }) => (
                                        <tr key={rank}>
                                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{rank}</td>
                                            <td className="p-3 text-center text-slate-600 dark:text-slate-300">{permanent}</td>
                                            <td className="p-3 text-center text-slate-600 dark:text-slate-300">{sabbatical}</td>
                                            <td className="p-3 text-center text-slate-600 dark:text-slate-300">{visiting}</td>
                                            <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">{total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <td className="p-3 font-bold text-lg text-slate-800 dark:text-slate-200">Grand Total</td>
                                        <td className="p-3 text-center font-bold text-lg text-slate-800 dark:text-slate-200">{grandTotalPermanent}</td>
                                        <td className="p-3 text-center font-bold text-lg text-slate-800 dark:text-slate-200">{grandTotalSabbatical}</td>
                                        <td className="p-3 text-center font-bold text-lg text-slate-800 dark:text-slate-200">{grandTotalVisiting}</td>
                                        <td className="p-3 text-center font-bold text-lg text-slate-800 dark:text-slate-200">{grandTotal}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                         <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <p className="mt-2 font-medium">No staff data recorded in this submission.</p>
                        </div>
                    )}
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white dark:bg-slate-700 border dark:border-slate-600 border-slate-300 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Close</button>
                </div>
            </div>
        </div>
    );
};

const TicketDetailModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    ticket: SupportTicket | null,
}> = ({ isOpen, onClose, ticket }) => {
    if (!isOpen || !ticket) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{ticket.subject}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ticket #{ticket.id} &middot; Opened {timeSince(ticket.createdAt)}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto">
                    <div className="md:col-span-2 space-y-4">
                        <Card>
                            <CardHeader><h3 className="font-semibold text-slate-800 dark:text-slate-200">Description</h3></CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{ticket.description}</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><h3 className="font-semibold text-slate-800 dark:text-slate-200">Conversation</h3></CardHeader>
                            <CardContent>
                                <div className="text-center text-sm text-slate-400 dark:text-slate-500 py-8">Chat functionality coming soon.</div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-1 space-y-4">
                        <Card>
                           <CardContent className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
                                    <select defaultValue={ticket.status} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                        {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Priority</label>
                                    <select defaultValue={ticket.priority} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                        {Object.values(TicketPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Category</label>
                                    <p className="text-sm font-semibold mt-1 dark:text-slate-200">{ticket.category}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader><h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Requester</h3></CardHeader>
                             <CardContent>
                                <p className="text-sm font-semibold dark:text-slate-200">{ticket.requesterName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{ticket.requesterRole}</p>
                                {ticket.requesterDepartment && <p className="text-xs text-slate-500 dark:text-slate-400">{ticket.requesterDepartment}</p>}
                             </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t dark:border-slate-700">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white dark:bg-slate-700 border dark:border-slate-600 border-slate-300 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                    <button type="button" onClick={() => { alert('Changes saved!'); onClose(); }} className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

// --- PAGE CONTENT COMPONENTS ---

const DashboardContent: React.FC<{
    submissions: Submission[],
    departments: Department[],
    faculties: Faculty[],
    onNavigate: (page: string) => void
}> = ({ submissions, departments, faculties, onNavigate }) => {
    
    const calculateNucCompliance = useCallback((submission: Submission | undefined) => {
        if (!submission) return 0;
        const requiredRanks = Object.keys(INITIAL_NUC_REQUIREMENTS) as AcademicRank[];
        if (requiredRanks.length === 0) return 100;
        let metRanks = 0;
        requiredRanks.forEach(rank => {
            const requiredCount = INITIAL_NUC_REQUIREMENTS[rank] ?? 0;
            const currentCount = Object.values(submission.data[rank] || {}).reduce((sum: number, count: number) => sum + (count || 0), 0);
            if (currentCount >= requiredCount) metRanks++;
        });
        return (metRanks / requiredRanks.length) * 100;
    }, []);

    const performanceScores = useMemo(() => {
        const latestSubmissions = new Map<number, Submission>();
        submissions.forEach(sub => {
            if (!latestSubmissions.has(sub.departmentId) || new Date(sub.lastUpdated) > new Date(latestSubmissions.get(sub.departmentId)!.lastUpdated)) {
                latestSubmissions.set(sub.departmentId, sub);
            }
        });

        const deptScores = departments.filter(d => !d.isDeleted).map(dept => {
            const sub = latestSubmissions.get(dept.id);
            const nucCompliance = sub ? calculateNucCompliance(sub) : 0;
            let statusScore = 0;
            if (sub?.status === SubmissionStatus.APPROVED) statusScore = 100;
            else if (sub?.status === SubmissionStatus.PENDING) statusScore = 50;
            const overallScore = (nucCompliance * 0.7) + (statusScore * 0.3);
            return { id: dept.id, name: dept.name, score: overallScore };
        });

        const facultyScores = faculties.filter(f => !f.isDeleted).map(faculty => {
            const facultyDepts = departments.filter(d => d.facultyId === faculty.id && !d.isDeleted);
            if (facultyDepts.length === 0) return { id: faculty.id, name: faculty.name, score: 0 };
            
            const facultyDeptIds = new Set(facultyDepts.map(d => d.id));
            const submissionCount = Array.from(latestSubmissions.values()).filter(s => facultyDeptIds.has(s.departmentId)).length;
            const submissionCompliance = (submissionCount / facultyDepts.length) * 100;
            const facultyDeptScores = deptScores.filter(ds => facultyDeptIds.has(ds.id));
            const avgDeptPerformance = facultyDeptScores.reduce((acc, curr) => acc + curr.score, 0) / (facultyDeptScores.length || 1);
            const overallScore = (submissionCompliance * 0.5) + (avgDeptPerformance * 0.5);
            return { id: faculty.id, name: faculty.name, score: overallScore };
        });

        return {
            departments: deptScores.sort((a,b) => b.score - a.score).slice(0, 5),
            faculties: facultyScores.sort((a,b) => b.score - a.score),
        }
    }, [submissions, departments, faculties, calculateNucCompliance]);

    const stats = useMemo(() => ({
        totalSubmissions: submissions.length,
        approved: submissions.filter(s => s.status === SubmissionStatus.APPROVED).length,
        pending: submissions.filter(s => s.status === SubmissionStatus.PENDING).length,
        rejected: submissions.filter(s => s.status === SubmissionStatus.REJECTED).length,
    }), [submissions]);

    const recentHistory = useMemo(() => MOCK_HISTORY_LOGS.slice(0, 5), []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card><CardContent className="dark:bg-slate-800"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/50"><SubmissionsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300"/></div><div><h3 className="text-sm text-slate-500 dark:text-slate-400">Total Submissions</h3><p className="text-2xl font-bold dark:text-white">{stats.totalSubmissions}</p></div></div></CardContent></Card>
                 <Card><CardContent className="dark:bg-slate-800"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50"><CheckCircle2Icon className="w-6 h-6 text-green-600 dark:text-green-300"/></div><div><h3 className="text-sm text-slate-500 dark:text-slate-400">Approved</h3><p className="text-2xl font-bold dark:text-white">{stats.approved}</p></div></div></CardContent></Card>
                 <Card><CardContent className="dark:bg-slate-800"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/50"><ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-300"/></div><div><h3 className="text-sm text-slate-500 dark:text-slate-400">Pending</h3><p className="text-2xl font-bold dark:text-white">{stats.pending}</p></div></div></CardContent></Card>
                 <Card><CardContent className="dark:bg-slate-800"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/50"><XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-300"/></div><div><h3 className="text-sm text-slate-500 dark:text-slate-400">Corrections</h3><p className="text-2xl font-bold dark:text-white">{stats.rejected}</p></div></div></CardContent></Card>
            </div>
            
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader><h3 className="text-lg font-semibold text-slate-900 dark:text-white">Overall Performance by Faculty</h3></CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={performanceScores.faculties} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis domain={[0, 100]} tickFormatter={val => `${val}%`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(238,242,255,0.6)' }}
                                        contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '12px' }}
                                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Performance']}
                                    />
                                    <Bar dataKey="score" name="Performance Score" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
                            <button onClick={() => onNavigate('System History')} className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">View All</button>
                        </CardHeader>
                        <CardContent>
                           <ul className="space-y-4">
                                {recentHistory.map(log => (
                                    <li key={log.id} className="flex items-start gap-3">
                                        <div className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full">
                                            <CalendarDaysIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-tight">{log.details}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{timeSince(log.timestamp)} by {log.user}</p>
                                        </div>
                                    </li>
                                ))}
                           </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

const SubmissionsContent: React.FC<{
    submissions: Submission[],
    faculties: Faculty[],
    departments: Department[],
    getFacultyName: (facultyId: number) => string,
    getDepartmentName: (deptId: number) => string,
    onView: (submission: Submission) => void,
    onUpdate: (submission: Submission) => void
}> = ({ submissions, faculties, departments, getFacultyName, getDepartmentName, onView, onUpdate }) => {
    const [facultyFilter, setFacultyFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSubmissions = useMemo(() => {
        const latestSubmissionsMap = new Map<number, Submission>();
        submissions.forEach(sub => {
            if (!latestSubmissionsMap.has(sub.departmentId) || new Date(sub.lastUpdated) > new Date(latestSubmissionsMap.get(sub.departmentId)!.lastUpdated)) {
                latestSubmissionsMap.set(sub.departmentId, sub);
            }
        });
        const latestSubmissions = Array.from(latestSubmissionsMap.values());

        return latestSubmissions
            .map(sub => {
                const department = departments.find(d => d.id === sub.departmentId);
                return {
                    ...sub,
                    departmentName: department?.name || 'N/A',
                    facultyId: department?.facultyId || 0,
                    facultyName: getFacultyName(department?.facultyId || 0),
                };
            })
            .filter(sub => {
                const facultyMatch = facultyFilter === 'all' || sub.facultyId === Number(facultyFilter);
                const statusMatch = statusFilter === 'all' || sub.status === statusFilter;
                const searchMatch = !searchQuery || sub.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) || sub.facultyName.toLowerCase().includes(searchQuery.toLowerCase());
                return facultyMatch && statusMatch && searchMatch;
            })
            .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    }, [submissions, facultyFilter, statusFilter, searchQuery, getDepartmentName, getFacultyName, departments]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All Submissions</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">View and manage submissions from all departments.</p>
                    </div>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search department..." className="w-full md:w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"/>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                    <select value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)} className="border-slate-300 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600">
                        <option value="all">All Faculties</option>
                        {faculties.filter(f=>!f.isDeleted).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="border-slate-300 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600">
                        <option value="all">All Statuses</option>
                        {Object.values(SubmissionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50/75 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Department</th>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Faculty</th>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Status</th>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Last Updated</th>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredSubmissions.map(sub => (
                                <tr key={sub.departmentId}>
                                    <td className="p-4 font-medium">{sub.departmentName}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">{sub.facultyName}</td>
                                    <td className="p-4"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusChipStyle(sub.status)}`}>{sub.status}</span></td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">{timeSince(sub.lastUpdated)}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onView(sub)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"><EyeIcon className="w-5 h-5 text-slate-500"/></button>
                                            <button onClick={() => onUpdate(sub)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700"><PencilIcon className="w-5 h-5 text-slate-500"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

const ReportsContent: React.FC<{
    submissions: Submission[],
    departments: Department[],
    faculties: Faculty[],
    nucRequirements: { [key in AcademicRank]?: number }
}> = ({ submissions, departments, faculties, nucRequirements }) => {
    const [reportType, setReportType] = useState('gap-analysis');
    const [academicYear, setAcademicYear] = useState('2024-2025');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<{ headers: string[], rows: (string|number)[][], title: string } | null>(null);

    const handleGenerateReport = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setGeneratedReport(null);

        setTimeout(() => {
            let reportData: { headers: string[], rows: (string|number)[][], title: string };

            if (reportType === 'gap-analysis') {
                const approvedSubmissions = submissions.filter(s => s.status === SubmissionStatus.APPROVED && s.academicYear === academicYear);
                const staffTotals: { [key in AcademicRank]?: number } = {};

                approvedSubmissions.forEach(sub => {
                    for (const rank in sub.data) {
                        const academicRank = rank as AcademicRank;
                        const rankData = sub.data[academicRank];
                        if (rankData) {
                            const totalForRank = Object.values(rankData).reduce((sum: number, count) => sum + (count || 0), 0);
                            staffTotals[academicRank] = (staffTotals[academicRank] || 0) + totalForRank;
                        }
                    }
                });

                reportData = {
                    title: `Gap Analysis Report for ${academicYear}`,
                    headers: ['Academic Rank', 'Required (NUC)', 'Actual Staff', 'Gap'],
                    rows: ACADEMIC_RANKS.map(rank => {
                        const required = nucRequirements[rank] || 0;
                        const actual = staffTotals[rank] || 0;
                        const gap = Math.max(0, required - actual);
                        return [rank, required, actual, gap];
                    })
                };
            } else { // summary report
                reportData = {
                    title: `University Staff Summary for ${academicYear}`,
                    headers: ['Faculty', 'Department', 'Total Staff', 'Status'],
                    rows: departments.filter(d => !d.isDeleted).map(dept => {
                        const facultyName = faculties.find(f => f.id === dept.facultyId)?.name || 'N/A';
                        const submission = submissions
                            .filter(s => s.departmentId === dept.id && s.academicYear === academicYear)
                            .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())[0];
                            
                        const totalStaff = submission ? Object.values(submission.data).reduce((acc: number, rankData) => {
                            return acc + Object.values(rankData as StaffCount).reduce((sum, count) => sum + (count || 0), 0);
                        }, 0) : 0;

                        return [facultyName, dept.name, totalStaff, submission?.status || 'Not Submitted'];
                    })
                };
            }

            setGeneratedReport(reportData);
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Generate University Reports</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Select parameters to generate a detailed report.</p>
                </CardHeader>
                <form onSubmit={handleGenerateReport}>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="md:col-span-1">
                            <label htmlFor="report-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Report Type</label>
                            <select id="report-type" value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500/50">
                                <option value="gap-analysis">Gap Analysis Report</option>
                                <option value="summary">Staff Summary Report</option>
                            </select>
                        </div>
                         <div className="md:col-span-1">
                            <label htmlFor="academic-year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                            <select id="academic-year" value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500/50">
                                <option value="2024-2025">2024-2025</option>
                                <option value="2023-2024">2023-2024</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full justify-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 transition duration-150 disabled:bg-slate-400 flex items-center gap-2">
                            {isLoading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </CardContent>
                </form>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Report Preview</h3>
                        {generatedReport && (
                            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                                <DownloadIcon className="w-5 h-5"/>
                                Download
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="min-h-[300px] flex items-center justify-center bg-slate-50/70 dark:bg-slate-800/50 rounded-b-lg">
                    {isLoading ? (
                        <div className="text-center text-slate-500 dark:text-slate-400">
                            <div role="status">
                                <svg aria-hidden="true" className="inline w-8 h-8 text-slate-200 animate-spin dark:text-slate-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                                </svg>
                            </div>
                            <p className="mt-2 font-medium">Crunching the numbers...</p>
                        </div>
                    ) : generatedReport ? (
                        <div className="w-full overflow-x-auto">
                            <h4 className="font-bold mb-4 text-slate-800 dark:text-slate-200">{generatedReport.title}</h4>
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-100 dark:bg-slate-700">
                                    <tr>
                                        {generatedReport.headers.map((h: string) => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {generatedReport.rows.map((row: any[], i: number) => (
                                        <tr key={i}>
                                            {row.map((cell, j) => <td key={j} className="px-3 py-2 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{cell}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    ) : (
                        <div className="text-center text-slate-500 dark:text-slate-400">
                            <ReportsIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                            <p className="mt-2 font-medium">Your generated report will appear here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};


const AnalyticsContent: React.FC<{ submissions: Submission[]; faculties: Faculty[], departments: Department[] }> = ({ submissions, faculties, departments }) => {
    const approvedSubmissions = useMemo(() => submissions.filter(s => s.status === SubmissionStatus.APPROVED), [submissions]);
    
    const stats = useMemo(() => {
        const totalStaff = approvedSubmissions.reduce((acc, sub) => acc + Object.values(sub.data).reduce((subAcc, rankData) => subAcc + Object.values(rankData as StaffCount).reduce((rAcc, count) => rAcc + count, 0), 0), 0);
        return {
            totalStaff,
            totalFaculties: faculties.filter(f=>!f.isDeleted).length,
            totalDepartments: departments.filter(d=>!d.isDeleted).length,
        };
    }, [approvedSubmissions, faculties, departments]);

    const staffByFacultyData = useMemo(() => {
        return faculties.filter(f => !f.isDeleted).map(faculty => {
            const facultyDeptIds = departments.filter(d => d.facultyId === faculty.id).map(d => d.id);
            const totalStaff = approvedSubmissions
                .filter(s => facultyDeptIds.includes(s.departmentId))
                .reduce((acc, sub) => acc + Object.values(sub.data).reduce((subAcc, rankData) => subAcc + Object.values(rankData as StaffCount).reduce((rAcc, count) => rAcc + count, 0), 0), 0);
            return { name: faculty.name, staff: totalStaff };
        });
    }, [approvedSubmissions, faculties, departments]);

    const staffByTypeData = useMemo(() => {
        const data = Object.fromEntries(Object.values(EmploymentType).map(type => [type, 0]));
        approvedSubmissions.forEach(sub => {
            Object.values(sub.data).forEach(rankData => {
                Object.entries(rankData as StaffCount).forEach(([type, count]) => {
                    data[type as EmploymentType] += count;
                });
            });
        });
        return Object.entries(data).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [approvedSubmissions]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card><CardContent><h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Staff (Approved)</h4><p className="text-3xl font-bold">{stats.totalStaff}</p></CardContent></Card>
                <Card><CardContent><h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Faculties</h4><p className="text-3xl font-bold">{stats.totalFaculties}</p></CardContent></Card>
                <Card><CardContent><h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Departments</h4><p className="text-3xl font-bold">{stats.totalDepartments}</p></CardContent></Card>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><h3 className="font-semibold">Staff Count by Faculty</h3></CardHeader>
                    <CardContent className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={staffByFacultyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}}/>
                                <Tooltip />
                                <Bar dataKey="staff" fill="#2563eb" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><h3 className="font-semibold">Staff by Employment Type</h3></CardHeader>
                    <CardContent className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={staffByTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                                    {staffByTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#1d4ed8', '#3b82f6', '#93c5fd'][index % 3]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const StaffManagementContent: React.FC<{
    users: User[];
    faculties: Faculty[];
    departments: Department[];
    onDelete: (userId: number) => void;
    onRestore: (userId: number) => void;
    onOpenRecycleBin: () => void;
}> = ({ users, faculties, departments, onDelete, onOpenRecycleBin }) => {
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    
    const getAssignment = (user: User) => {
        if (user.role === UserRole.HOD) {
            return departments.find(d => d.id === user.departmentId)?.name || 'N/A';
        }
        if (user.role === UserRole.DEAN) {
            return faculties.find(f => f.id === user.facultyId)?.name || 'N/A';
        }
        return 'N/A';
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => !u.isDeleted && (roleFilter === 'all' || u.role === roleFilter) && u.role !== UserRole.ADMIN);
    }, [users, roleFilter]);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                     <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Staff Management</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage all user accounts in the system.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as any)} className="border-slate-300 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600">
                            <option value="all">All Roles</option>
                            <option value={UserRole.DEAN}>Deans</option>
                            <option value={UserRole.HOD}>HODs</option>
                        </select>
                        <button onClick={onOpenRecycleBin} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                            <RecycleBinIcon className="w-5 h-5"/>
                            Recycle Bin
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50/75 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Name</th>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Role</th>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Assignment</th>
                                <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Action</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredUsers.map(user => (
                                <tr key={user.id}>
                                    <td className="p-4 font-medium">{user.name}</td>
                                    <td className="p-4">{user.role}</td>
                                    <td className="p-4">{getAssignment(user)}</td>
                                    <td className="p-4">
                                        <button onClick={() => window.confirm(`Are you sure you want to delete ${user.name}?`) && onDelete(user.id)} className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const StructureContent: React.FC<{
    faculties: Faculty[];
    departments: Department[];
    onAddFaculty: (name: string) => { success: boolean, message: string },
    onAddDepartment: (name: string, facultyId: number) => { success: boolean, message: string },
    onDeleteFaculty: (id: number) => void,
    onDeleteDepartment: (id: number) => void,
    onOpenRecycleBin: () => void,
}> = ({ faculties, departments, onAddFaculty, onAddDepartment, onDeleteFaculty, onDeleteDepartment, onOpenRecycleBin }) => {
    const [newFacultyName, setNewFacultyName] = useState('');
    const [newDeptName, setNewDeptName] = useState('');
    const [selectedFacultyForNewDept, setSelectedFacultyForNewDept] = useState<string>('');
    const activeFaculties = useMemo(() => faculties.filter(f => !f.isDeleted), [faculties]);

    const handleAddFaculty = (e: React.FormEvent) => {
        e.preventDefault();
        const result = onAddFaculty(newFacultyName);
        if (result.success) {
            setNewFacultyName('');
        } else {
            alert(result.message);
        }
    };
    
    const handleAddDepartment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFacultyForNewDept) {
            alert("Please select a faculty.");
            return;
        }
        const result = onAddDepartment(newDeptName, Number(selectedFacultyForNewDept));
        if (result.success) {
            setNewDeptName('');
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">University Structure</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage faculties and their corresponding departments.</p>
                </div>
                <button onClick={onOpenRecycleBin} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                    <RecycleBinIcon className="w-5 h-5"/>
                    Recycle Bin
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader><h3 className="font-semibold">Faculties ({activeFaculties.length})</h3></CardHeader>
                    <CardContent className="space-y-3">
                        {activeFaculties.map(faculty => (
                            <div key={faculty.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                                <span>{faculty.name}</span>
                                <button onClick={() => window.confirm(`Deleting a faculty will also delete its departments. Are you sure?`) && onDeleteFaculty(faculty.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <form onSubmit={handleAddFaculty} className="flex gap-2">
                            <input value={newFacultyName} onChange={e => setNewFacultyName(e.target.value)} placeholder="New faculty name" required className="flex-grow p-2 border border-slate-300 rounded-md text-sm dark:bg-slate-700 dark:border-slate-600"/>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold">Add</button>
                        </form>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader><h3 className="font-semibold">Departments</h3></CardHeader>
                    <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                        {activeFaculties.map(faculty => (
                            <div key={faculty.id}>
                                <h4 className="font-bold">{faculty.name}</h4>
                                <ul className="mt-2 space-y-2 pl-4">
                                    {departments.filter(d => d.facultyId === faculty.id && !d.isDeleted).map(dept => (
                                        <li key={dept.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                                            <span>{dept.name}</span>
                                            <button onClick={() => window.confirm(`Are you sure you want to delete ${dept.name}?`) && onDeleteDepartment(dept.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4"/></button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <form onSubmit={handleAddDepartment} className="space-y-2">
                             <select value={selectedFacultyForNewDept} onChange={e => setSelectedFacultyForNewDept(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md text-sm dark:bg-slate-700 dark:border-slate-600">
                                <option value="">Select Faculty</option>
                                {activeFaculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <input value={newDeptName} onChange={e => setNewDeptName(e.target.value)} placeholder="New department name" required className="flex-grow p-2 border border-slate-300 rounded-md text-sm dark:bg-slate-700 dark:border-slate-600"/>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-semibold">Add</button>
                            </div>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

const RoleManagementContent: React.FC<{
    nucRequirements: { [key in AcademicRank]?: number };
    setNucRequirements: React.Dispatch<React.SetStateAction<{ [key in AcademicRank]?: number }>>;
    permissions: Permissions;
    setPermissions: React.Dispatch<React.SetStateAction<Permissions>>;
}> = ({ nucRequirements, setNucRequirements, permissions, setPermissions }) => {
    const [localNuc, setLocalNuc] = useState(nucRequirements);
    const [isEditingNuc, setIsEditingNuc] = useState(false);
    
    const [localPermissions, setLocalPermissions] = useState(permissions);
    const [isEditingPermissions, setIsEditingPermissions] = useState(false);

    useEffect(() => {
        if (!isEditingNuc) setLocalNuc(nucRequirements);
    }, [nucRequirements, isEditingNuc]);
    
    useEffect(() => {
        if (!isEditingPermissions) setLocalPermissions(permissions);
    }, [permissions, isEditingPermissions]);

    const handleNucChange = (rank: AcademicRank, value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setLocalNuc(prev => ({...prev, [rank]: numValue }));
        }
    };

    const handleSaveNuc = () => {
        setNucRequirements(localNuc);
        setIsEditingNuc(false);
        alert("NUC requirements updated.");
    };

    const handleCancelNuc = () => {
        setLocalNuc(nucRequirements);
        setIsEditingNuc(false);
    };

    const handlePermissionChange = (featureKey: string, role: 'hod' | 'dean', enabled: boolean) => {
        setLocalPermissions(prev => ({
            ...prev,
            [featureKey]: {
                ...prev[featureKey],
                [role]: enabled
            }
        }));
    };

    const handleSavePermissions = () => {
        setPermissions(localPermissions);
        setIsEditingPermissions(false);
        alert("Permissions updated successfully.");
    };

    const handleCancelPermissions = () => {
        setLocalPermissions(permissions);
        setIsEditingPermissions(false);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">User Role Permissions</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Enable or disable access to features for HODs and Deans.</p>
                        </div>
                        {!isEditingPermissions && <button onClick={() => setIsEditingPermissions(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Edit Permissions</button>}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-4 w-1/3 text-left font-semibold text-slate-600 dark:text-slate-300">Feature</th>
                                    <th className="p-4 text-center font-semibold text-slate-600 dark:text-slate-300">HOD Access</th>
                                    <th className="p-4 text-center font-semibold text-slate-600 dark:text-slate-300">Dean Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {CONTROLLABLE_FEATURES.map(feature => {
                                    const canHodAccess = feature.appliesTo.includes('HOD');
                                    const canDeanAccess = feature.appliesTo.includes('DEAN');
                                    return (
                                        <tr key={feature.key}>
                                            <td className="p-4">
                                                <p className="font-medium text-slate-800 dark:text-slate-200">{feature.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{feature.description}</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                {canHodAccess ? (
                                                    <ToggleSwitch
                                                        enabled={localPermissions[feature.key]?.hod ?? false}
                                                        onChange={(enabled) => handlePermissionChange(feature.key, 'hod', enabled)}
                                                        disabled={!isEditingPermissions}
                                                    />
                                                ) : <span className="text-slate-400 dark:text-slate-500">-</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                {canDeanAccess ? (
                                                    <ToggleSwitch
                                                        enabled={localPermissions[feature.key]?.dean ?? false}
                                                        onChange={(enabled) => handlePermissionChange(feature.key, 'dean', enabled)}
                                                        disabled={!isEditingPermissions}
                                                    />
                                                ) : <span className="text-slate-400 dark:text-slate-500">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                {isEditingPermissions && (
                    <CardFooter className="flex justify-end gap-3">
                        <button onClick={handleCancelPermissions} className="px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm font-semibold">Cancel</button>
                        <button onClick={handleSavePermissions} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Permissions</button>
                    </CardFooter>
                )}
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">NUC Requirement Settings</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Define minimum staff numbers for key academic ranks.</p>
                        </div>
                        {!isEditingNuc && <button onClick={() => setIsEditingNuc(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Edit Requirements</button>}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Academic Rank</th>
                                    <th className="p-4 text-left font-semibold text-slate-600 dark:text-slate-300">Minimum Required Staff</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {ACADEMIC_RANKS.map(rank => (
                                    <tr key={rank}>
                                        <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{rank}</td>
                                        <td className="p-4">
                                            {isEditingNuc ? (
                                                <input 
                                                    type="number" 
                                                    value={localNuc[rank] || ''}
                                                    onChange={e => handleNucChange(rank, e.target.value)}
                                                    className="w-24 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600"
                                                    placeholder="0"
                                                />
                                            ) : (
                                                <span className="font-semibold">{nucRequirements[rank] || 'Not Set'}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
                {isEditingNuc && (
                    <CardFooter className="flex justify-end gap-3">
                        <button onClick={handleCancelNuc} className="px-4 py-2 bg-white dark:bg-slate-600 border border-slate-300 dark:border-slate-500 rounded-lg text-sm font-semibold">Cancel</button>
                        <button onClick={handleSaveNuc} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold">Save Requirements</button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
};


const MyProfileContent: React.FC<{
    user: User;
    updateUserProfile: (userId: number, profileData: Partial<Pick<User, 'name' | 'phone' | 'profilePictureUrl'>>) => void;
}> = ({ user, updateUserProfile }) => {
    const [name, setName] = useState(user.name);
    const [phone, setPhone] = useState(user.phone || '');
    const [isEditing, setIsEditing] = useState(false);
    const [profilePic, setProfilePic] = useState(user.profilePictureUrl || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        updateUserProfile(user.id, { name, phone, profilePictureUrl: profilePic });
        setIsEditing(false);
        alert('Profile updated successfully!');
    };

    const handleCancel = () => {
        setName(user.name);
        setPhone(user.phone || '');
        setProfilePic(user.profilePictureUrl || '');
        setIsEditing(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setProfilePic(event.target.result as string);
                    setIsEditing(true);
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const profilePicBg = 'FEE2E2';
    const profilePicColor = '991B1B';
    const defaultProfilePic = `https://ui-avatars.com/api/?name=${user.name.replace(' ', '+')}&background=${profilePicBg}&color=${profilePicColor}&size=128`;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
                <Card>
                    <CardHeader><h3 className="text-lg font-bold text-slate-800 dark:text-white">Profile Picture</h3></CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <img 
                            src={profilePic || defaultProfilePic}
                            alt="Profile"
                            className="w-32 h-32 rounded-full object-cover ring-4 ring-slate-200 dark:ring-slate-700"
                        />
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
                            <CameraIcon className="w-5 h-5" /> Change Photo
                        </button>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader><h3 className="text-lg font-bold text-slate-800 dark:text-white">Personal Information</h3></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Full Name</label>
                            <input type="text" value={name} onChange={e => { setName(e.target.value); setIsEditing(true); }} className="mt-1 w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white sm:text-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Phone Number</label>
                            <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); setIsEditing(true); }} className="mt-1 w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white sm:text-sm" placeholder="e.g. 08012345678"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Username / Email</label>
                            <p className="mt-1 text-slate-700 dark:text-slate-300 sm:text-sm">{user.username}</p>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Role</label>
                            <p className="mt-1 text-slate-700 dark:text-slate-300 sm:text-sm">{user.role}</p>
                        </div>
                    </CardContent>
                    {isEditing && (
                         <CardFooter className="flex justify-end gap-3">
                            <button onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">Cancel</button>
                            <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Changes</button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
};

const SettingsContent: React.FC<{
    onOpenChangePassword: () => void;
}> = ({ onOpenChangePassword }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDark);
    }, []);

    const toggleTheme = () => {
        setIsDarkMode(prev => {
            const nextState = !prev;
            if (nextState) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
            return nextState;
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Appearance Settings</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Customize the look and feel of the application.</p>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">Theme</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark modes.</p>
                        </div>
                        <div className="flex items-center gap-2 p-1 rounded-full bg-slate-100 dark:bg-slate-700">
                             <button onClick={() => isDarkMode && toggleTheme()} className={`p-2 rounded-full transition-all ${!isDarkMode ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-500'}`}>
                                 <SunIcon className="w-5 h-5"/>
                             </button>
                             <button onClick={() => !isDarkMode && toggleTheme()} className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-500'}`}>
                                 <MoonIcon className="w-5 h-5"/>
                             </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Notification Preferences</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Control how you are notified.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">New Support Tickets</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when a new support ticket is created.</p>
                        </div>
                        <ToggleSwitch enabled={true} onChange={() => {}} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">High-Priority Alerts</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Receive alerts for urgent system events.</p>
                        </div>
                        <ToggleSwitch enabled={true} onChange={() => {}} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Security</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account's security settings.</p>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                     <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200">Password</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Change your password regularly to keep your account secure.</p>
                    </div>
                    <button onClick={onOpenChangePassword} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Change Password</button>
                </CardContent>
            </Card>
        </div>
    );
};

const AnnouncementsContent: React.FC = () => {
    const { user } = useAuth();
    const { announcements, addAnnouncement, deleteAnnouncement } = useData();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || !user) return;
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            addAnnouncement(title, content, user.name);
            setTitle('');
            setContent('');
            setIsSubmitting(false);
        }, 500);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                <Card className="sticky top-28">
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Create New Announcement</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">This will be visible to all Deans and HODs.</p>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div>
                                <label htmlFor="ann-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
                                <input id="ann-title" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="e.g. Portal Maintenance" />
                            </div>
                            <div>
                                <label htmlFor="ann-content" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                                <textarea id="ann-content" value={content} onChange={e => setContent(e.target.value)} required rows={5} className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Enter the full announcement details..."/>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
            <div className="lg:col-span-3">
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Published Announcements ({announcements.length})</h3>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {announcements.length > 0 ? (
                            announcements.map(ann => (
                                <div key={ann.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg relative group">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{ann.title}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{ann.content}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                        By <span className="font-medium">{ann.authorName}</span> &middot; {timeSince(ann.timestamp)}
                                    </p>
                                    <button
                                        onClick={() => window.confirm('Are you sure you want to delete this announcement?') && deleteAnnouncement(ann.id)}
                                        className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-600 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-red-500/20 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        aria-label="Delete announcement"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                <AnnouncementIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                                <p className="mt-2 font-medium">No announcements published yet.</p>
                                <p className="text-sm">Use the form on the left to create one.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const SystemHistoryContent: React.FC = () => {
    return (
        <Card>
            <CardHeader>
                 <h3 className="text-lg font-semibold text-slate-900 dark:text-white">System & Audit Logs</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400">A detailed history of all actions performed in the system.</p>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                   {MOCK_HISTORY_LOGS.map(log => (
                       <li key={log.id} className="flex items-start gap-4 p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/50">
                            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-1">
                                <CalendarDaysIcon className="w-5 h-5 text-slate-500 dark:text-slate-400"/>
                            </div>
                            <div>
                                <p className="font-medium text-slate-800 dark:text-slate-200">{log.action.replace(/_/g, ' ')}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{log.details}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {new Date(log.timestamp).toLocaleString()} by <span className="font-semibold">{log.user} ({log.role})</span>
                                </p>
                            </div>
                       </li>
                   ))}
                </ul>
            </CardContent>
        </Card>
    )
}

const SupportCenterContent: React.FC = () => {
    const [activeTab, setActiveTab] = useState('tickets');
    const [tickets, setTickets] = useState(MOCK_SUPPORT_TICKETS);
    const [articles, setArticles] = useState(MOCK_KB_ARTICLES);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

    // For Contact Center Tab
    const { users } = useAuth();
    const { faculties, departments } = useData();
    const [targetRole, setTargetRole] = useState<UserRole.DEAN | UserRole.HOD>(UserRole.HOD);
    const [selectedFacultyId, setSelectedFacultyId] = useState<string>('all');
    const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    
    const availableDepartments = useMemo(() => {
        if (selectedFacultyId === 'all') return [];
        return departments.filter(d => d.facultyId === Number(selectedFacultyId) && !d.isDeleted);
    }, [selectedFacultyId, departments]);

    useEffect(() => {
        setSelectedDeptId('all');
    }, [selectedFacultyId, targetRole]);
    
    const recipientDescription = useMemo(() => {
        if (targetRole === UserRole.DEAN) {
            if (selectedFacultyId === 'all') return 'All Deans';
            const faculty = faculties.find(f => f.id === Number(selectedFacultyId));
            return `Dean of ${faculty?.name || '...'}`;
        } else { // HOD
            if (selectedFacultyId === 'all') return 'All HODs (University-wide)';
            const faculty = faculties.find(f => f.id === Number(selectedFacultyId));
            if (selectedDeptId === 'all') return `All HODs in ${faculty?.name || '...'}`;
            const dept = departments.find(d => d.id === Number(selectedDeptId));
            return `HOD of ${dept?.name || '...'}`;
        }
    }, [targetRole, selectedFacultyId, selectedDeptId, faculties, departments]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Message sent to ${recipientDescription}:\n\nSubject: ${subject}\nMessage: ${message}`);
        setSubject('');
        setMessage('');
    };

    const openTickets = useMemo(() => tickets.filter(t => t.status === TicketStatus.OPEN || t.status === TicketStatus.IN_PROGRESS), [tickets]);

    return (
        <div className="space-y-6">
            <TicketDetailModal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} ticket={selectedTicket} />
            
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('tickets')} className={`${activeTab === 'tickets' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        <TicketIcon /> Support Tickets
                        {openTickets.length > 0 && <span className="ml-2 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">{openTickets.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('kb')} className={`${activeTab === 'kb' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        <BookOpenIcon /> Knowledge Base
                    </button>
                    <button onClick={() => setActiveTab('contact')} className={`${activeTab === 'contact' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'} flex items-center gap-2 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        <SendIcon /> Contact Center
                    </button>
                </nav>
            </div>
            
            {activeTab === 'tickets' && (
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Support Tickets</h3>
                    </CardHeader>
                    <CardContent className="p-0">
                         <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50/75 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Subject</th>
                                        <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Requester</th>
                                        <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Status</th>
                                        <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Priority</th>
                                        <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Last Update</th>
                                        <th className="p-4 text-left font-semibold text-slate-500 dark:text-slate-300">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {tickets.map(ticket => (
                                        <tr key={ticket.id}>
                                            <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{ticket.subject}</td>
                                            <td className="p-4">{ticket.requesterName}</td>
                                            <td className="p-4"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusChipStyle(ticket.status)}`}>{ticket.status}</span></td>
                                            <td className="p-4"><span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityChipStyle(ticket.priority)}`}>{ticket.priority}</span></td>
                                            <td className="p-4 text-slate-500 dark:text-slate-400">{timeSince(ticket.lastUpdatedAt)}</td>
                                            <td className="p-4"><button onClick={() => setSelectedTicket(ticket)} className="font-semibold text-blue-600 hover:underline">View</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'kb' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {articles.map(article => (
                        <Card key={article.id}>
                            <CardHeader>
                                <h4 className="font-semibold text-lg text-slate-800 dark:text-slate-200">{article.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Category: {article.category}</p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{article.content}</p>
                            </CardContent>
                             <CardFooter className="flex justify-between items-center">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Updated {timeSince(article.lastUpdated)}</span>
                                <button className="font-semibold text-blue-600 text-sm hover:underline">Read more</button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            {activeTab === 'contact' && (
                 <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Contact Center</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Send messages to specific roles or groups.</p>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-2xl mx-auto space-y-6">
                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-4">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Select Recipient(s)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Role</label>
                                        <select value={targetRole} onChange={e => setTargetRole(e.target.value as any)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                            <option value={UserRole.HOD}>HOD</option>
                                            <option value={UserRole.DEAN}>Dean</option>
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Faculty</label>
                                        <select value={selectedFacultyId} onChange={e => setSelectedFacultyId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                                            <option value="all">All Faculties</option>
                                            {faculties.filter(f => !f.isDeleted).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
                                        <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} disabled={targetRole === UserRole.DEAN || selectedFacultyId === 'all'} className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-700/50 disabled:cursor-not-allowed">
                                            <option value="all">All Departments</option>
                                            {availableDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSend} className="space-y-4">
                                 <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                                    <span className="font-semibold">To:</span> {recipientDescription}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                                    <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={6} className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                        <SendIcon className="w-4 h-4" /> Send Message
                                    </button>
                                </div>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

const AcademicStaffSummaryContent: React.FC<{
    submissions: Submission[],
    departments: Department[],
    faculties: Faculty[],
    onEdit: (departmentId: number) => void,
}> = ({ submissions, departments, faculties, onEdit }) => {
    
    // NUC Requirements for this specific report (can be moved to constants if needed)
    const nucRequirements = {
        profReader: 2,
        sl: 4,
        l2Below: 8,
    };

    const latestApprovedSubmissionsMap = useMemo(() => {
        const approvedSubmissions = submissions.filter(s => s.status === SubmissionStatus.APPROVED);
        const map = new Map<number, Submission>();
        approvedSubmissions.forEach(sub => {
            if (!map.has(sub.departmentId) || new Date(sub.lastUpdated) > new Date(map.get(sub.departmentId)!.lastUpdated)) {
                map.set(sub.departmentId, sub);
            }
        });
        return map;
    }, [submissions]);
    
    const facultyData = useMemo(() => {
        return faculties
            .filter(f => !f.isDeleted)
            .map(faculty => {
                const facultyDepts = departments.filter(d => d.facultyId === faculty.id && !d.isDeleted);
                
                const departmentData = facultyDepts.map(dept => {
                    const submission = latestApprovedSubmissionsMap.get(dept.id);
                    
                    const profReaderCount = (submission?.data[AcademicRank.PROFESSOR] ? Object.values(submission.data[AcademicRank.PROFESSOR]).reduce((s, c) => s + (c || 0), 0) : 0) +
                                            (submission?.data[AcademicRank.READER] ? Object.values(submission.data[AcademicRank.READER]).reduce((s, c) => s + (c || 0), 0) : 0);
                    
                    const slCount = submission?.data[AcademicRank.SENIOR_LECTURER] ? Object.values(submission.data[AcademicRank.SENIOR_LECTURER]).reduce((s, c) => s + (c || 0), 0) : 0;
                    
                    const l2BelowCount = (submission?.data[AcademicRank.LECTURER_II] ? Object.values(submission.data[AcademicRank.LECTURER_II]).reduce((s, c) => s + (c || 0), 0) : 0) +
                                         (submission?.data[AcademicRank.ASSISTANT_LECTURER] ? Object.values(submission.data[AcademicRank.ASSISTANT_LECTURER]).reduce((s, c) => s + (c || 0), 0) : 0) +
                                         (submission?.data[AcademicRank.GRADUATE_ASSISTANT] ? Object.values(submission.data[AcademicRank.GRADUATE_ASSISTANT]).reduce((s, c) => s + (c || 0), 0) : 0);
                    
                    const profReaderGap = Math.max(0, nucRequirements.profReader - profReaderCount);
                    const slGap = Math.max(0, nucRequirements.sl - slCount);
                    const l2BelowGap = Math.max(0, nucRequirements.l2Below - l2BelowCount);

                    return {
                        id: dept.id,
                        name: dept.name,
                        profReader: { req: nucRequirements.profReader, current: profReaderCount, gap: profReaderGap, percentGap: nucRequirements.profReader > 0 ? (profReaderGap / nucRequirements.profReader) * 100 : 0 },
                        sl: { req: nucRequirements.sl, current: slCount, gap: slGap },
                        l2Below: { req: nucRequirements.l2Below, current: l2BelowCount, gap: l2BelowGap },
                    };
                });

                return {
                    id: faculty.id,
                    name: faculty.name,
                    departments: departmentData,
                };
            });
    }, [faculties, departments, latestApprovedSubmissionsMap, nucRequirements]);

    let sNo = 0;

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Summary of Academic Staff - NUC GAP ANALYSIS</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analysis of staff numbers against NUC minimum requirements for each department.</p>
                </div>
                <ExportButton />
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm align-middle">
                        <thead className="bg-slate-100 dark:bg-slate-700/50">
                            <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                                <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">S/No.</th>
                                <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Faculty/Dept.</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-600 whitespace-nowrap">NUC No. of Prof./readers</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Current Status</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">% GAP</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Rec.</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-600 whitespace-nowrap">NUC No. of S/L</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Current Status</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">GAP</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Rec.</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-600 whitespace-nowrap">NUC No. of L II & below</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">Current Status</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">GAP</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Rec.</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-600">Actions</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                             {facultyData.map(faculty => {
                                if (faculty.departments.length === 0) return null;
                                sNo++;
                                return (
                                    <React.Fragment key={faculty.id}>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50">
                                            <td className="p-3 font-bold">{sNo}</td>
                                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200" colSpan={14}>{faculty.name}</td>
                                        </tr>
                                        {faculty.departments.map((dept) => (
                                            <tr key={dept.id}>
                                                <td></td>
                                                <td className="p-3 pl-8 text-slate-700 dark:text-slate-300">{dept.name}</td>
                                                
                                                <td className="p-3 text-center border-l border-slate-200 dark:border-slate-600">{dept.profReader.req}</td>
                                                <td className="p-3 text-center">{dept.profReader.current}</td>
                                                <td className="p-3 text-center">{dept.profReader.percentGap.toFixed(1)}%</td>
                                                <td className="p-3 text-center font-bold text-red-500">{dept.profReader.gap > 0 ? dept.profReader.gap : '-'}</td>
                                                
                                                <td className="p-3 text-center border-l border-slate-200 dark:border-slate-600">{dept.sl.req}</td>
                                                <td className="p-3 text-center">{dept.sl.current}</td>
                                                <td className="p-3 text-center">{dept.sl.gap > 0 ? dept.sl.gap : '-'}</td>
                                                <td className="p-3 text-center font-bold text-red-500">{dept.sl.gap > 0 ? dept.sl.gap : '-'}</td>
                                                
                                                <td className="p-3 text-center border-l border-slate-200 dark:border-slate-600">{dept.l2Below.req}</td>
                                                <td className="p-3 text-center">{dept.l2Below.current}</td>
                                                <td className="p-3 text-center">{dept.l2Below.gap > 0 ? dept.l2Below.gap : '-'}</td>
                                                <td className="p-3 text-center font-bold text-red-500">{dept.l2Below.gap > 0 ? dept.l2Below.gap : '-'}</td>
                                                <td className="p-3 text-center border-l border-slate-200 dark:border-slate-600">
                                                    <button onClick={() => onEdit(dept.id)} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
                                                        <PencilIcon className="w-4 h-4 text-blue-600" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                )
                             })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};


const AdminDashboard: React.FC = () => {
    const { user, users, logout, deleteUser, restoreUser, changePassword, updateUserProfile } = useAuth();
    const { submissions, departments, faculties, updateSubmissionStatus, addDepartment, addFaculty, deleteFaculty, restoreFaculty, deleteDepartment, restoreDepartment, announcements, addAnnouncement, deleteAnnouncement, updateSubmission, getSubmissionForDepartment } = useData();
    
    const [activePage, setActivePage] = useState('Dashboard');
    const [pageTitle, setPageTitle] = useState('Admin Dashboard');
    const [nucRequirements, setNucRequirements] = useState(INITIAL_NUC_REQUIREMENTS);
    const [permissions, setPermissions] = useState<Permissions>(INITIAL_PERMISSIONS);
    
    // Modals
    const [isCreateUserOpen, setCreateUserOpen] = useState(false);
    const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
    const [recycleBinContext, setRecycleBinContext] = useState<'staff' | 'structure'>('staff');
    const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
    const [isViewStaffOpen, setIsViewStaffOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [isEditDataModalOpen, setIsEditDataModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

    const getDepartmentName = useCallback((id: number) => departments.find(d => d.id === id)?.name || 'N/A', [departments]);
    const getFacultyName = useCallback((id: number) => faculties.find(f => f.id === id)?.name || 'N/A', [faculties]);

    const handleOpenRecycleBin = (context: 'staff' | 'structure') => {
        setRecycleBinContext(context);
        setIsRecycleBinOpen(true);
    };

    const handleOpenEditDataModal = (departmentId: number) => {
        const dept = departments.find(d => d.id === departmentId);
        if(dept) {
            setEditingDepartment(dept);
            setIsEditDataModalOpen(true);
        }
    };

    const handleCloseEditDataModal = () => {
        setIsEditDataModalOpen(false);
        setEditingDepartment(null);
    };

    const handleSaveData = (departmentId: number, data: DepartmentStaffing) => {
        updateSubmission(departmentId, data, SubmissionStatus.APPROVED, "Updated by Administrator");
        handleCloseEditDataModal();
        alert('Staffing data updated successfully.');
    };

    const submissionForEditModal = useMemo(() => {
        if (!editingDepartment) return undefined;
        return getSubmissionForDepartment(editingDepartment.id);
    }, [editingDepartment, getSubmissionForDepartment]);


    const recycleBinTabs = useMemo(() => {
        if (recycleBinContext === 'staff') {
            return [{
                name: 'Staff',
                items: users.filter(u => u.isDeleted),
                onRestore: restoreUser
            }];
        }
        // else context is 'structure'
        return [
            { name: 'Faculties', items: faculties.filter(f => f.isDeleted), onRestore: restoreFaculty },
            { name: 'Departments', items: departments.filter(d => d.isDeleted), onRestore: restoreDepartment },
        ];
    }, [recycleBinContext, users, faculties, departments, restoreUser, restoreFaculty, restoreDepartment]);

    const navItems = [
        { name: 'Dashboard', icon: DashboardIcon },
        { name: 'Analytics', icon: AnalyticsIcon },
        { name: 'Reports', icon: ReportsIcon },
        { name: 'Submissions', icon: SubmissionsIcon, title: "All Submissions" },
        { name: 'Summary of Academic Staff', icon: ClipboardDocumentListIcon, title: 'Summary of Academic Staff' },
    ];
    
    const managementNavItems = [
        { name: 'Staff Management', icon: StaffManagementIcon },
        { name: 'Structure', icon: BuildingOfficeIcon, title: 'Manage Faculties & Departments' },
        { name: 'Role Management', icon: RoleManagementIcon, title: 'NUC Settings' },
    ];
    
    const systemNavItems = [
        { name: 'Announcements', icon: AnnouncementIcon },
        { name: 'Support Center', icon: SupportIcon },
        { name: 'System History', icon: HistoryIcon },
        { name: 'My Profile', icon: UserCircleIcon },
        { name: 'Settings', icon: SettingsIcon },
    ];

    const renderContent = () => {
        switch(activePage) {
            case 'Dashboard':
                return <DashboardContent submissions={submissions} departments={departments} faculties={faculties} onNavigate={setActivePage} />;
            case 'Submissions':
                return <SubmissionsContent 
                    submissions={submissions}
                    faculties={faculties}
                    departments={departments}
                    getFacultyName={getFacultyName}
                    getDepartmentName={getDepartmentName}
                    onView={(sub) => { setSelectedSubmission(sub); setIsViewStaffOpen(true); }}
                    onUpdate={(sub) => { setSelectedSubmission(sub); setIsUpdateStatusOpen(true); }}
                />;
            case 'Reports':
                return <ReportsContent 
                    submissions={submissions}
                    departments={departments}
                    faculties={faculties}
                    nucRequirements={nucRequirements}
                />;
            case 'Analytics':
                return <AnalyticsContent submissions={submissions} faculties={faculties} departments={departments}/>;
            case 'Summary of Academic Staff':
                return <AcademicStaffSummaryContent
                    submissions={submissions}
                    departments={departments}
                    faculties={faculties}
                    onEdit={handleOpenEditDataModal}
                />;
            case 'Staff Management':
                return <StaffManagementContent 
                    users={users}
                    faculties={faculties}
                    departments={departments}
                    onDelete={deleteUser}
                    onRestore={restoreUser}
                    onOpenRecycleBin={() => handleOpenRecycleBin('staff')}
                />;
            case 'Structure':
                return <StructureContent
                    faculties={faculties}
                    departments={departments}
                    onAddFaculty={addFaculty}
                    onAddDepartment={addDepartment}
                    onDeleteFaculty={deleteFaculty}
                    onDeleteDepartment={deleteDepartment}
                    onOpenRecycleBin={() => handleOpenRecycleBin('structure')}
                />;
            case 'Role Management':
                return <RoleManagementContent 
                    nucRequirements={nucRequirements}
                    setNucRequirements={setNucRequirements}
                    permissions={permissions}
                    setPermissions={setPermissions}
                />;
            case 'My Profile':
                return user ? <MyProfileContent user={user} updateUserProfile={updateUserProfile} /> : null;
            case 'Settings':
                return <SettingsContent onOpenChangePassword={() => setIsChangePasswordOpen(true)} />;
            case 'Announcements':
                return <AnnouncementsContent />;
            case 'System History':
                return <SystemHistoryContent />;
            case 'Support Center':
                return <SupportCenterContent />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                        <div className="text-6xl mb-4">🚧</div>
                        <h2 className="text-2xl font-bold">Under Construction</h2>
                        <p className="mt-2">The "{activePage}" page is not yet implemented.</p>
                    </div>
                );
        }
    };
    
    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <CreateUserModal isOpen={isCreateUserOpen} onClose={() => setCreateUserOpen(false)} />
            <RecycleBinModal isOpen={isRecycleBinOpen} onClose={() => setIsRecycleBinOpen(false)} tabs={recycleBinTabs} title="Recycle Bin"/>
            <UpdateStatusModal isOpen={isUpdateStatusOpen} onClose={() => setIsUpdateStatusOpen(false)} submission={selectedSubmission} onUpdate={updateSubmissionStatus} getDepartmentName={getDepartmentName}/>
            <ViewStaffModal isOpen={isViewStaffOpen} onClose={() => setIsViewStaffOpen(false)} submission={selectedSubmission} getDepartmentName={getDepartmentName} />
            {isChangePasswordOpen && <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} userId={user.id} />}
            <AdminEditDataModal
                isOpen={isEditDataModalOpen}
                onClose={handleCloseEditDataModal}
                onSave={handleSaveData}
                department={editingDepartment}
                initialSubmission={submissionForEditModal}
            />


            <DashboardLayout
                user={user}
                pageTitle={pageTitle}
                userRoleName="Administrator"
                navItems={navItems}
                managementNavItems={managementNavItems}
                systemNavItems={systemNavItems}
                activePage={activePage}
                setActivePage={(page, title) => { setActivePage(page); setPageTitle(title || page); }}
                onLogout={logout}
                onCreateUser={() => setCreateUserOpen(true)}
            >
              {renderContent()}
            </DashboardLayout>
        </>
    );
};

export default AdminDashboard;
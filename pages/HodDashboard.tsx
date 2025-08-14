
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ACADEMIC_RANKS, EMPLOYMENT_TYPES, NUC_REQUIREMENTS } from '../constants';
import { DepartmentStaffing, SubmissionStatus, Department, AcademicRank, EmploymentType, Submission, User, UserRole, Announcement, Faculty } from '../types';
import Card, { CardHeader, CardContent, CardFooter } from '../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, PieLabelRenderProps, Cell } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import {
    LayoutDashboardIcon, FileTextIcon, BarChart3Icon, LifebuoyIcon, Settings2Icon, UploadCloudIcon, Users2Icon, GraduationCapIcon,
    AlertTriangleIcon, CheckCircle2Icon, ClockIcon, XCircleIcon, XIcon, CameraIcon, SunIcon, MoonIcon, AnnouncementIcon, MessageSquareIcon, SendIcon,
    ClipboardDocumentListIcon, UserCircleIcon, DownloadIcon, ChevronDownIcon
} from '../components/Icons';


// --- UTILITY & HELPER FUNCTIONS ---

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

const getStatusChipStyle = (status: SubmissionStatus) => {
    switch (status) {
        case SubmissionStatus.APPROVED: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/20';
        case SubmissionStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/20';
        case SubmissionStatus.REJECTED: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20';
        case SubmissionStatus.DRAFT: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20';
        default: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
    }
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: (enabled: boolean) => void; }> = ({ enabled, onChange }) => (
    <button
      type="button"
      className={`${
        enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
    >
      <span
        aria-hidden="true"
        className={`${
          enabled ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
);


// --- PAGE-SPECIFIC COMPONENTS ---

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

const SupportContent: React.FC<{
    user: User;
    department: Department;
    faculties: Faculty[];
    departments: Department[];
    users: User[];
}> = ({ user, department, faculties, departments, users }) => {
    const [selectedContactId, setSelectedContactId] = useState<string | number | null>(null);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const userFaculty = useMemo(() => faculties.find(f => f.id === department.facultyId), [faculties, department]);

    const facultyContacts = useMemo(() => {
        if (!userFaculty) return [];

        const dean = users.find(u => u.role === UserRole.DEAN && u.facultyId === userFaculty.id && !u.isDeleted);
        const deanContact = {
            id: dean ? dean.id : `dean-${userFaculty.id}`,
            name: `Dean's Office, ${userFaculty.name}`,
            person: dean ? dean.name : 'Not Assigned',
            role: 'Dean',
            isAvailable: !!dean,
        };

        const hodContacts = departments
            .filter(d => d.facultyId === userFaculty.id && d.id !== user.departmentId && !d.isDeleted)
            .map(dept => {
                const hod = users.find(u => u.role === UserRole.HOD && u.departmentId === dept.id && !u.isDeleted);
                return {
                    id: hod ? hod.id : `hod-${dept.id}`,
                    name: `HOD, ${dept.name}`,
                    person: hod ? hod.name : 'Not Assigned',
                    role: 'HOD',
                    isAvailable: !!hod,
                };
            });

        return [deanContact, ...hodContacts];
    }, [userFaculty, departments, users, user.departmentId]);

    const handleContactClick = (contactId: string | number) => {
        if (selectedContactId === contactId) {
            setSelectedContactId(null); // Toggle off if already selected
        } else {
            setSelectedContactId(contactId);
            setSubject('');
            setMessage('');
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const contact = facultyContacts.find(c => c.id === selectedContactId);
        alert(`Message sent to ${contact?.person}:\n\nSubject: ${subject}\nMessage: ${message}`);
        setSelectedContactId(null);
        setSubject('');
        setMessage('');
    };

    if (!userFaculty) return <p>Could not determine your faculty.</p>;

    return (
        <Card>
            <CardHeader>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Faculty Directory & Contact</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Contact your Dean or other HODs in {userFaculty.name}.</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {facultyContacts.map(contact => (
                        <div key={contact.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg transition-all duration-300">
                            <div className="flex items-center justify-between p-4">
                                <div>
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{contact.name}</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{contact.person} ({contact.role})</p>
                                </div>
                                <button
                                    onClick={() => handleContactClick(contact.id)}
                                    disabled={!contact.isAvailable}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <MessageSquareIcon className="w-4 h-4" />
                                    Contact
                                </button>
                            </div>
                            {selectedContactId === contact.id && (
                                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 animate-fade-in rounded-b-lg">
                                    <form onSubmit={handleSend} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={e => setSubject(e.target.value)}
                                                required
                                                className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                placeholder={`Regarding...`}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                                            <textarea
                                                value={message}
                                                onChange={e => setMessage(e.target.value)}
                                                required
                                                rows={4}
                                                className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                placeholder="Your message..."
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3">
                                            <button type="button" onClick={() => setSelectedContactId(null)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500">
                                                Cancel
                                            </button>
                                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                                <SendIcon className="w-4 h-4" />
                                                Send Message
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
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

const SubmitDataModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: DepartmentStaffing, notes: string, status: SubmissionStatus) => void;
    initialSubmission: Submission | null;
}> = ({ isOpen, onClose, onSave, initialSubmission }) => {
    const [staffingData, setStaffingData] = useState<DepartmentStaffing>({});
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStaffingData(initialSubmission?.data ? JSON.parse(JSON.stringify(initialSubmission.data)) : {});
            setRemarks(initialSubmission?.notes || '');
        }
    }, [isOpen, initialSubmission]);

    const handleDataChange = (rank: AcademicRank, type: EmploymentType, value: number) => {
        setStaffingData(prev => ({
            ...prev,
            [rank]: { ...prev[rank], [type]: value >= 0 ? value : 0, }
        }));
    };

    const handleSave = (status: SubmissionStatus) => {
        onSave(staffingData, remarks, status);
        onClose();
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all shadow-2xl">
                <CardHeader className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Update Staffing Data</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Submit current academic staff information</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
                </CardHeader>

                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="space-y-4 animate-fade-in">
                        {ACADEMIC_RANKS.map(rank => <RankInputGroup key={rank} rank={rank} staffingData={staffingData} onChange={handleDataChange} />)}
                    </div>
                     <div className="mt-6">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">Additional Remarks</h3>
                        <textarea className="w-full p-3 border border-slate-300 rounded-md shadow-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white" rows={4} placeholder="Any additional remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                    </div>
                </div>

                <CardFooter className="flex justify-end items-center">
                    <div className="flex gap-3">
                         <button onClick={() => handleSave(SubmissionStatus.DRAFT)} className="py-2.5 px-6 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 transition-all dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">Save as Draft</button>
                         <button onClick={() => handleSave(SubmissionStatus.PENDING)} className="py-2.5 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-all flex items-center gap-2"><UploadCloudIcon className="w-5 h-5" /> Submit for Review</button>
                    </div>
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
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-center items-center px-4" aria-modal="true" role="dialog">
            <Card className="w-full max-w-md transform transition-all shadow-2xl">
                <CardHeader className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"><XIcon className="w-5 h-5" /></button>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current Password</label>
                            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm sm:text-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm sm:text-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirm New Password</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm sm:text-sm"/>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="py-2.5 px-6 border border-slate-300 text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-100 dark:bg-slate-600 dark:text-slate-200 dark:border-slate-500 dark:hover:bg-slate-500">Cancel</button>
                        <button type="submit" className="py-2.5 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">Update Password</button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

const UniversityAnnouncements: React.FC = () => {
    const { announcements } = useData();
    const recentAnnouncements = useMemo(() => announcements.slice(0, 3), [announcements]);

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">University Announcements</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Latest news from the administration.</p>
            </CardHeader>
            <CardContent className="flex-grow">
                {recentAnnouncements.length > 0 ? (
                    <ul className="space-y-4">
                        {recentAnnouncements.map(ann => (
                            <li key={ann.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200">{ann.title}</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{ann.content}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{timeSince(ann.timestamp)} by {ann.authorName}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 dark:text-slate-500">
                        <AnnouncementIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                        <p className="mt-2 font-medium">No new announcements.</p>
                    </div>
                )}
            </CardContent>
            {announcements.length > 3 && (
                <CardFooter>
                    <button className="text-sm font-semibold text-blue-600 dark:text-blue-400 w-full text-center hover:underline">View All Announcements</button>
                </CardFooter>
            )}
        </Card>
    );
};

const DashboardContent: React.FC<{
    submission: Submission | undefined;
    departmentName: string;
    onOpenSubmitModal: () => void;
}> = ({ submission, departmentName, onOpenSubmitModal }) => {
    const totalStaff = useMemo(() => {
        if (!submission) return 0;
        return Object.values(submission.data).reduce((acc: number, rankData) => acc + Object.values(rankData || {}).reduce((sum, count) => sum + (count || 0), 0), 0);
    }, [submission]);

    const nucCompliance = useMemo(() => {
        if (!submission) return 0;
        const requiredRanks = Object.keys(NUC_REQUIREMENTS) as AcademicRank[];
        if(requiredRanks.length === 0) return 100;

        let metRanks = 0;
        requiredRanks.forEach(rank => {
            const requiredCount = NUC_REQUIREMENTS[rank] ?? 0;
            const currentCount = Object.values(submission.data[rank] || {}).reduce((sum: number, count: number) => sum + (count || 0), 0);
            if (currentCount >= requiredCount) {
                metRanks++;
            }
        });
        return (metRanks / requiredRanks.length) * 100;
    }, [submission]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Submission Status</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Department of {departmentName}</p>
                            </div>
                            <button onClick={onOpenSubmitModal} className="py-2 px-5 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 transition-all">Update Data</button>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col justify-center items-center p-6 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <span className={`text-sm font-bold px-4 py-1.5 rounded-full ${getStatusChipStyle(submission?.status || SubmissionStatus.NOT_SUBMITTED)}`}>
                                    {submission?.status || SubmissionStatus.NOT_SUBMITTED}
                                </span>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Last Updated: {submission ? timeSince(submission.lastUpdated) : 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-3">
                                {submission?.status === SubmissionStatus.REJECTED && (
                                    <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                                        <h4 className="font-semibold text-sm text-red-800 dark:text-red-300">Correction Notes from Dean:</h4>
                                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{submission.notes}</p>
                                    </div>
                                )}
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">Total Staff Submitted:</h4>
                                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalStaff}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">NUC Requirement Analysis</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Comparison of current staff against NUC minimums.</p>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4">
                                {(Object.keys(NUC_REQUIREMENTS) as AcademicRank[]).map(rank => {
                                    const required = NUC_REQUIREMENTS[rank] || 0;
                                    const actual = submission ? Object.values(submission.data[rank] || {}).reduce((sum: number, count: number) => sum + count, 0) : 0;
                                    const isMet = actual >= required;
                                    return (
                                        <div key={rank}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{rank}</span>
                                                <span className={`text-sm font-bold ${isMet ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{actual} / {required}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                                <div className={`${isMet ? 'bg-green-500' : 'bg-red-500'} h-2.5 rounded-full`} style={{width: `${Math.min(100, (actual/required)*100)}%`}}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                           </div>
                        </CardContent>
                    </Card>

                </div>

                <div className="lg:col-span-2">
                    <UniversityAnnouncements />
                </div>
            </div>
        </div>
    );
};

const MySubmissionsContent: React.FC<{
    allSubmissions: Submission[];
    onOpenSubmitModal: (submission: Submission) => void;
}> = ({ allSubmissions, onOpenSubmitModal }) => {
    return (
        <Card>
            <CardHeader><h3 className="text-lg font-bold text-slate-800 dark:text-white">Submission History</h3></CardHeader>
            <CardContent>
                {allSubmissions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="border-b dark:border-slate-700">
                                <tr>
                                    <th className="font-semibold p-3">Academic Year</th>
                                    <th className="font-semibold p-3">Status</th>
                                    <th className="font-semibold p-3">Last Updated</th>
                                    <th className="font-semibold p-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allSubmissions.map((sub, idx) => (
                                    <tr key={idx} className="border-b dark:border-slate-700">
                                        <td className="p-3">{sub.academicYear}</td>
                                        <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipStyle(sub.status)}`}>{sub.status}</span></td>
                                        <td className="p-3">{new Date(sub.lastUpdated).toLocaleString()}</td>
                                        <td className="p-3"><button onClick={() => onOpenSubmitModal(sub)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">View/Edit</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-slate-500 dark:text-slate-400">No submission history found.</p>}
            </CardContent>
        </Card>
    );
};

const DepartmentAnalyticsContent: React.FC<{ submission: Submission | undefined }> = ({ submission }) => {
    const pieData = useMemo(() => {
        if (!submission) return [];
        const data: { [key in EmploymentType]?: number } = {};
        EMPLOYMENT_TYPES.forEach(type => data[type] = 0);
        Object.values(submission.data).forEach(rankData => {
            Object.entries(rankData || {}).forEach(([type, count]) => {
                data[type as EmploymentType]! += count;
            });
        });
        return EMPLOYMENT_TYPES.map(type => ({ name: type, value: data[type]! })).filter(item => item.value > 0);
    }, [submission]);

    const barData = useMemo(() => {
        if (!submission) return [];
        return ACADEMIC_RANKS.map(rank => ({
            name: rank.split(' ').map(w => w[0]).join(''),
            fullName: rank,
            value: Object.values(submission.data[rank] || {}).reduce((sum, count) => sum + count, 0)
        }));
    }, [submission]);

    const COLORS = ['#1d4ed8', '#3b82f6', '#93c5fd'];
    
    if (!submission) {
        return <div className="text-center p-12 text-slate-500 dark:text-slate-400">No data submitted yet to generate analytics.</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><h3 className="text-lg font-bold text-slate-800 dark:text-white">Staff Distribution by Rank</h3></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{fill: 'rgba(238,242,255,0.6)'}} contentStyle={{backgroundColor: 'white', borderRadius: '0.5rem'}} formatter={(value, name, props) => [value, props.payload.fullName]} />
                            <Bar dataKey="value" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><h3 className="text-lg font-bold text-slate-800 dark:text-white">Staff by Employment Type</h3></CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={120} fill="#8884d8" dataKey="value">
                                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

const DepartmentSummaryContent: React.FC<{
    submission: Submission | undefined;
    departmentName: string;
}> = ({ submission, departmentName }) => {
    const nucRequirements = NUC_REQUIREMENTS;

    const staffData = useMemo(() => {
        return ACADEMIC_RANKS.map(rank => {
            const required = nucRequirements[rank as AcademicRank] ?? 0;
            const current = submission?.data[rank] ? Object.values(submission.data[rank]).reduce((s, c) => s + (c || 0), 0) : 0;
            const gap = Math.max(0, required - current);
            return { rank, required, current, gap };
        });
    }, [submission, nucRequirements]);

    if (!submission) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Department Summary</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-slate-500 dark:text-slate-400">No data has been submitted yet. Please submit your department's staffing data to view the summary.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Department Summary for {departmentName}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analysis of staff numbers against NUC minimum requirements.</p>
                </div>
                <ExportButton />
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-700/50">
                            <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                                <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Academic Rank</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">NUC Minimum</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Current Staff</th>
                                <th className="p-3 text-center font-semibold text-slate-600 dark:text-slate-300">Gap</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {staffData.map(data => (
                                <tr key={data.rank}>
                                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{data.rank}</td>
                                    <td className="p-3 text-center">{data.required || '-'}</td>
                                    <td className="p-3 text-center">{data.current}</td>
                                    <td className={`p-3 text-center font-bold ${data.gap > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {data.gap > 0 ? data.gap : '✓'}
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

const MyProfileContent: React.FC<{
    user: User;
    departmentName: string;
    updateUserProfile: (userId: number, profileData: Partial<Pick<User, 'name' | 'phone' | 'profilePictureUrl'>>) => void;
}> = ({ user, departmentName, updateUserProfile }) => {
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
    
    const profilePicBg = 'EBF4FF';
    const profilePicColor = '003366';
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
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Staff ID</label>
                            <p className="mt-1 text-slate-700 dark:text-slate-300 sm:text-sm">{user.staffId || 'Not Assigned'}</p>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Department</label>
                            <p className="mt-1 text-slate-700 dark:text-slate-300 sm:text-sm">{departmentName}</p>
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
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">Submission Updates</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when your submission is approved or rejected.</p>
                        </div>
                        <ToggleSwitch enabled={true} onChange={() => {}} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">University Announcements</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Receive major announcements from the university admin.</p>
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


// --- MAIN COMPONENT ---

const HodDashboard: React.FC = () => {
    const { user, users, logout, changePassword, updateUserProfile } = useAuth();
    const { departments, faculties, getSubmissionForDepartment, updateSubmission, submissions } = useData();

    const [department, setDepartment] = useState<Department | null>(null);
    const [submission, setSubmission] = useState<Submission | undefined>(undefined);
    const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);

    const [activePage, setActivePage] = useState('Dashboard');
    const [pageTitle, setPageTitle] = useState('HOD Dashboard');
    
    // Modals
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [submissionToEdit, setSubmissionToEdit] = useState<Submission | null>(null);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, []);

    useEffect(() => {
        if (user?.departmentId) {
            const userDept = departments.find(d => d.id === user.departmentId);
            setDepartment(userDept || null);
            const userSub = getSubmissionForDepartment(user.departmentId);
            setSubmission(userSub);

            const userAllSubs = submissions
                .filter(s => s.departmentId === user.departmentId)
                .sort((a,b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
            setAllSubmissions(userAllSubs);
        }
    }, [user, departments, getSubmissionForDepartment, submissions]);

    const handleSaveData = (data: DepartmentStaffing, notes: string, status: SubmissionStatus) => {
        if (department) {
            updateSubmission(department.id, data, status, notes);
        }
    };
    
    const handleOpenSubmitModal = (subToEdit: Submission | null = null) => {
        setSubmissionToEdit(subToEdit || submission || null);
        setIsSubmitModalOpen(true);
    };

    const handleCloseSubmitModal = () => setIsSubmitModalOpen(false);

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboardIcon },
        { name: 'My Submissions', icon: FileTextIcon, title: 'Submission History' },
        { name: 'Analytics', icon: BarChart3Icon, title: 'Department Analytics' },
        { name: 'Summary', icon: ClipboardDocumentListIcon, title: 'Department Summary' }
    ];

    const utilityNavItems = [
        { name: 'Support', icon: LifebuoyIcon },
        { name: 'My Profile', icon: UserCircleIcon, title: 'My Profile' },
        { name: 'Settings', icon: Settings2Icon },
    ];

    const renderContent = () => {
        if (!user || !department) return null;
        switch (activePage) {
            case 'Dashboard':
                return <DashboardContent submission={submission} departmentName={department?.name || 'N/A'} onOpenSubmitModal={() => handleOpenSubmitModal()} />;
            case 'My Submissions':
                return <MySubmissionsContent allSubmissions={allSubmissions} onOpenSubmitModal={(sub) => handleOpenSubmitModal(sub)} />;
            case 'Analytics':
                return <DepartmentAnalyticsContent submission={submission} />;
            case 'Summary':
                return <DepartmentSummaryContent submission={submission} departmentName={department.name} />;
            case 'My Profile':
                return <MyProfileContent user={user} departmentName={department.name} updateUserProfile={updateUserProfile} />;
            case 'Settings':
                return <SettingsContent onOpenChangePassword={() => setIsChangePasswordOpen(true)} />;
            case 'Support':
                 return (
                    <SupportContent
                        user={user}
                        department={department}
                        faculties={faculties}
                        departments={departments}
                        users={users}
                    />
                );
            default:
                return <div>Page not found.</div>;
        }
    };
    
    if (!user || !department) {
        return <div className="flex justify-center items-center h-screen bg-slate-100 dark:bg-slate-900">Loading user data...</div>;
    }

    return (
        <>
            <SubmitDataModal
                isOpen={isSubmitModalOpen}
                onClose={handleCloseSubmitModal}
                onSave={handleSaveData}
                initialSubmission={submissionToEdit}
            />
            {isChangePasswordOpen && <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} userId={user.id} />}

            <DashboardLayout
                user={user}
                pageTitle={pageTitle}
                userRoleName={`HOD, ${department.name}`}
                navItems={navItems}
                utilityNavItems={utilityNavItems}
                activePage={activePage}
                setActivePage={(page, title) => { setActivePage(page); setPageTitle(title || page); }}
                onLogout={logout}
            >
              {renderContent()}
            </DashboardLayout>
        </>
    );
};

export default HodDashboard;


import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ACADEMIC_RANKS, EMPLOYMENT_TYPES, NUC_REQUIREMENTS } from '../constants';
import { Department, Submission, SubmissionStatus, Faculty, StaffCount, AcademicRank, User, UserRole, DepartmentStaffing, EmploymentType, Announcement } from '../types';
import Card, { CardHeader, CardContent, CardFooter } from '../components/Card';
import { StaffDistributionChart, EmploymentTypePieChart } from '../components/Charts';
import DashboardLayout from '../components/DashboardLayout';
import {
    DashboardIcon, DocumentCheckIcon, ChartBarIcon, DocumentChartBarIcon, BuildingOfficeIcon, UserPlusIcon,
    PencilIcon, DownloadIcon, AlertTriangleIcon, CheckCircle2Icon, ClockIcon, UsersIcon, LifebuoyIcon, Settings2Icon, XIcon,
    AnnouncementIcon, GraduationCapIcon, MessageSquareIcon, SendIcon, ClipboardDocumentListIcon, TrashIcon, CameraIcon,
    UserCircleIcon, SunIcon, MoonIcon, ChevronDownIcon
} from '../components/Icons';


// --- Helper Functions & Components ---
type SubmissionStatusFilter = SubmissionStatus | "All" | "Corrections" | "Submitted";

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

const ReviewSubmissionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    submission: Submission | null;
    departmentName: string;
    onUpdateStatus: (departmentId: number, status: SubmissionStatus, notes: string) => void;
}> = ({ isOpen, onClose, submission, departmentName, onUpdateStatus }) => {
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if(submission) {
            setNotes(submission.notes || '');
        }
    }, [submission]);
    
    if (!isOpen || !submission) return null;

    const handleUpdate = (newStatus: SubmissionStatus) => {
        onUpdateStatus(submission.departmentId, newStatus, notes);
        onClose();
    };

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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Submission</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Department of {departmentName}</p>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <Card>
                        <CardHeader><h3 className="font-semibold text-gray-800 dark:text-white">Submitted Staffing Details</h3></CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                    <div>
                        <label htmlFor="review-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes for HOD (Optional)</label>
                        <textarea id="review-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Provide feedback if requesting corrections..."/>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t dark:border-gray-700">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                    <button type="button" onClick={() => handleUpdate(SubmissionStatus.REJECTED)} className="px-5 py-2.5 bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50">Request Corrections</button>
                    <button type="button" onClick={() => handleUpdate(SubmissionStatus.APPROVED)} className="px-5 py-2.5 bg-green-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-green-700">Approve Submission</button>
                </div>
            </div>
        </div>
    )
}

const AddDepartmentModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAdd: (name: string) => Promise<{ success: boolean; message: string }>;
}> = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setError('');
            setSuccess('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);
        const result = await onAdd(name);
        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => {
                onClose();
            }, 1500);
        } else {
            setError(result.message);
        }
        setIsSubmitting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Department</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create a new department within your faculty.</p>

                        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert"><p>{error}</p></div>}
                        {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded" role="alert"><p>{success}</p></div>}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="dept-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department Name</label>
                                <input id="dept-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Software Engineering" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white dark:bg-gray-700 dark:border-gray-600 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !!success} className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            {isSubmitting ? 'Adding...' : 'Add Department'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RegisterHodModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    facultyDepartments: Department[];
}> = ({ isOpen, onClose, facultyDepartments }) => {
    const { users, registerHod } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [departmentId, setDepartmentId] = useState<number | ''>('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const availableDepartments = useMemo(() => {
        const assignedDeptIds = new Set(users.filter(u => u.role === UserRole.HOD && u.departmentId && !u.isDeleted).map(u => u.departmentId));
        return facultyDepartments.filter(dept => !assignedDeptIds.has(dept.id));
    }, [users, facultyDepartments]);

    useEffect(() => {
        if (isOpen) {
            setFullName('');
            setEmail('');
            setPassword('');
            setDepartmentId('');
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!fullName || !email || !password || !departmentId) {
            setError('All fields are required.');
            return;
        }
        const result = registerHod(fullName, email, password, Number(departmentId));
        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => {
                onClose();
            }, 2000);
        } else {
            setError(result.message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md transform transition-all" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Register New HOD</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Create an account and assign a Head of Department to a department.</p>

                        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert"><p>{error}</p></div>}
                        {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert"><p>{success}</p></div>}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (as Username)</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                                <select value={departmentId} onChange={e => setDepartmentId(e.target.value === '' ? '' : Number(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="" disabled>Select a department</option>
                                    {availableDepartments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
                                    {availableDepartments.length === 0 && <option disabled>No available departments</option>}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white dark:bg-gray-700 dark:border-gray-600 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">Cancel</button>
                        <button type="submit" disabled={!!success} className="px-5 py-2.5 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400">Register HOD</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const getStatusChipStyle = (status: SubmissionStatusFilter) => {
    switch (status) {
        case SubmissionStatus.APPROVED: return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 ring-1 ring-inset ring-green-200 dark:ring-green-700';
        case SubmissionStatus.PENDING: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-700';
        case "Corrections":
        case SubmissionStatus.REJECTED: return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 ring-1 ring-inset ring-red-200 dark:ring-red-700';
        case SubmissionStatus.DRAFT: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 ring-1 ring-inset ring-gray-200 dark:ring-gray-600';
        case "Submitted":
        case "All":
        default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-inset ring-blue-200 dark:ring-blue-700';
    }
};

const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
};

// --- CONTENT COMPONENTS ---

const DashboardContent: React.FC<{ 
    facultySubmissions: Submission[], 
    facultyDepartments: Department[], 
    onNavigate: (page: string) => void, 
    getDepartmentName: (id: number) => string,
    announcements: Announcement[],
}> = ({ facultySubmissions, facultyDepartments, onNavigate, getDepartmentName, announcements }) => {
    
    const stats = useMemo(() => {
        const approvedSubmissions = facultySubmissions.filter(s => s.status === SubmissionStatus.APPROVED);
        let totalStaff = 0;
        if(approvedSubmissions.length > 0) {
            approvedSubmissions.forEach(sub => {
                totalStaff += Object.values(sub.data).reduce((acc: number, rankData) => {
                    return acc + Object.values(rankData as StaffCount).reduce((sum: number, count: number) => sum + (count || 0), 0);
                }, 0);
            });
        }

        return {
            totalDepts: facultyDepartments.length,
            pendingReviews: facultySubmissions.filter(s => s.status === SubmissionStatus.PENDING).length,
            approved: facultySubmissions.filter(s => s.status === SubmissionStatus.APPROVED).length,
            totalStaff,
        };
    }, [facultySubmissions, facultyDepartments]);

    const recentSubmissions = useMemo(() => {
        return facultySubmissions
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
            .slice(0, 5);
    }, [facultySubmissions]);
    
    const departmentsWithNoStaff = useMemo(() => {
        return facultyDepartments.filter(dept => {
            const latestSubmissionForDept = facultySubmissions
                .filter(s => s.departmentId === dept.id)
                .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                [0]; 

            if (!latestSubmissionForDept) {
                return true;
            }
            
            const totalStaff = Object.values(latestSubmissionForDept.data).reduce((acc: number, rankData) => {
                return acc + Object.values(rankData as StaffCount).reduce((sum: number, count: number) => sum + (count || 0), 0);
            }, 0);
            
            return totalStaff === 0;
        });
    }, [facultyDepartments, facultySubmissions]);


    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <Card><CardContent className="dark:bg-gray-800"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/50"><BuildingOfficeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300"/></div><div><h3 className="text-sm text-gray-500 dark:text-gray-400">Total Depts</h3><p className="text-2xl font-bold dark:text-white">{stats.totalDepts}</p></div></div></CardContent></Card>
                 <Card><CardContent className="dark:bg-gray-800"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/50"><ClockIcon className="w-6 h-6 text-amber-600 dark:text-amber-300"/></div><div><h3 className="text-sm text-gray-500 dark:text-gray-400">Pending</h3><p className="text-2xl font-bold dark:text-white">{stats.pendingReviews}</p></div></div></CardContent></Card>
                 <Card><CardContent className="dark:bg-gray-800"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50"><CheckCircle2Icon className="w-6 h-6 text-green-600 dark:text-green-300"/></div><div><h3 className="text-sm text-gray-500 dark:text-gray-400">Approved</h3><p className="text-2xl font-bold dark:text-white">{stats.approved}</p></div></div></CardContent></Card>
                 <Card><CardContent className="dark:bg-gray-800"><div className="flex items-center gap-4"><div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/50"><UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-300"/></div><div><h3 className="text-sm text-gray-500 dark:text-gray-400">Faculty Staff</h3><p className="text-2xl font-bold dark:text-white">{stats.totalStaff}</p></div></div></CardContent></Card>
            </div>

            {departmentsWithNoStaff.length > 0 && (
                <Card className="border-l-4 border-yellow-400 dark:border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20">
                    <CardHeader className="flex items-center gap-3">
                        <AlertTriangleIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Attention Required</h3>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">The following departments have no staff members recorded in their latest submission. Please follow up with the respective HODs.</p>
                        <ul className="space-y-2">
                            {departmentsWithNoStaff.map(dept => (
                                <li key={dept.id} className="p-2.5 bg-slate-100 dark:bg-slate-700/50 rounded-md font-medium text-slate-800 dark:text-slate-200 text-sm">
                                    {dept.name}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader className="flex justify-between items-center"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Submissions</h3><button onClick={() => onNavigate('Review Submissions')} className="font-semibold text-blue-600 dark:text-blue-400 text-sm hover:underline">View All</button></CardHeader>
                        <CardContent className="p-0"><div className="overflow-x-auto"><table className="min-w-full text-sm">
                            <thead className="bg-gray-50/75 dark:bg-gray-700/50"><tr>
                                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">DEPARTMENT</th>
                                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">STATUS</th>
                                <th className="p-4 text-left font-semibold text-gray-600 dark:text-gray-300">LAST UPDATED</th>
                            </tr></thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {recentSubmissions.map(sub => (<tr key={`${sub.departmentId}-${sub.lastUpdated}`}>
                                    <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{getDepartmentName(sub.departmentId)}</td>
                                    <td className="p-4"><span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusChipStyle(sub.status === SubmissionStatus.PENDING ? "Submitted" : sub.status)}`}>{sub.status === SubmissionStatus.PENDING ? "Submitted" : sub.status}</span></td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{formatDate(sub.lastUpdated)}</td>
                                </tr>))}
                                {recentSubmissions.length === 0 && (<tr><td colSpan={4} className="p-4 text-center text-gray-500 dark:text-gray-400">No recent submissions.</td></tr>)}
                            </tbody>
                        </table></div></CardContent>
                    </Card>
                </div>

                 <div className="lg:col-span-1">
                    <Card>
                        <CardHeader><h3 className="text-lg font-semibold text-gray-900 dark:text-white">University Announcements</h3></CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[450px] overflow-y-auto">
                                {announcements.length > 0 ? announcements.map((ann, index) => (
                                    <div key={ann.id} className={`p-4 ${index < announcements.length - 1 ? 'border-b border-slate-100 dark:border-slate-700/50' : ''}`}>
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{ann.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{ann.content}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                                            By <span className="font-medium">{ann.authorName}</span> &middot; {timeSince(ann.timestamp)}
                                        </p>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                        <AnnouncementIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
                                        <p className="mt-2 font-medium">No new announcements.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const SubmissionsContent: React.FC<{
    facultySubmissions: Submission[],
    getDepartmentName: (id: number) => string,
    onOpenReviewModal: (submission: Submission) => void;
}> = ({ facultySubmissions, getDepartmentName, onOpenReviewModal }) => {
    const [activeFilter, setActiveFilter] = useState('All');
    const filters = ['All', 'Submitted', 'Approved', 'Corrections'];

    const filteredSubmissions = useMemo(() => {
        const sorted = facultySubmissions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
        if (activeFilter === 'All') return sorted;
        if (activeFilter === 'Submitted') return sorted.filter(s => s.status === SubmissionStatus.PENDING);
        if (activeFilter === 'Approved') return sorted.filter(s => s.status === SubmissionStatus.APPROVED);
        if (activeFilter === 'Corrections') return sorted.filter(s => s.status === SubmissionStatus.REJECTED);
        return sorted;
    }, [facultySubmissions, activeFilter]);


    return (
        <div className="space-y-6">
            <Card className="overflow-hidden">
                <CardHeader>
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white">All Submissions ({filteredSubmissions.length})</h3>
                </CardHeader>
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6 px-6">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`${
                                    activeFilter === filter
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                            >
                                {filter}
                            </button>
                        ))}
                    </nav>
                </div>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50/75 dark:bg-gray-700/50">
                                <tr>
                                    <th className="p-4 text-left font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Department</th>
                                    <th className="p-4 text-left font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-left font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                                    <th className="p-4 text-left font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredSubmissions.length > 0 ? filteredSubmissions.map(sub => (
                                    <tr key={`${sub.departmentId}-${sub.lastUpdated}`}>
                                        <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{getDepartmentName(sub.departmentId)}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusChipStyle(sub.status === SubmissionStatus.PENDING ? "Submitted" : sub.status === SubmissionStatus.REJECTED ? "Corrections" : sub.status)}`}>
                                                {sub.status === SubmissionStatus.PENDING ? "Submitted" : sub.status === SubmissionStatus.REJECTED ? "Corrections" : sub.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400">{formatDate(sub.lastUpdated)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => onOpenReviewModal(sub)} className="flex items-center gap-1.5 text-green-600 dark:text-green-300 hover:text-green-700 dark:hover:text-green-200 font-semibold ring-1 ring-green-200 dark:ring-green-600 bg-green-50/50 dark:bg-green-900/50 hover:bg-green-100/50 dark:hover:bg-green-900/80 rounded-md px-2 py-1">
                                                    <PencilIcon className="w-4 h-4" /> Review
                                                </button>
                                                <button onClick={() => alert('Download feature coming soon')} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                                                    <DownloadIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={5} className="text-center p-10 text-gray-500 dark:text-gray-400">No submissions found for this filter.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

const FacultyAnalyticsContent: React.FC<{ facultySubmissions: Submission[], facultyDepartments: Department[] }> = ({ facultySubmissions, facultyDepartments }) => {
    const approvedSubmissions = useMemo(() => facultySubmissions.filter(s => s.status === SubmissionStatus.APPROVED), [facultySubmissions]);
    
    const analytics = useMemo(() => {
        let totalStaff = 0;
        let seniorRanks = 0;
        const ranks = new Set<AcademicRank>();
        approvedSubmissions.forEach(s => {
            Object.entries(s.data).forEach(([rank, rankData]) => {
                ranks.add(rank as AcademicRank);
                const staffCount = Object.values(rankData as StaffCount).reduce((sum, count) => sum + count, 0);
                totalStaff += staffCount;
                if (rank === AcademicRank.PROFESSOR || rank === AcademicRank.READER) {
                    seniorRanks += staffCount;
                }
            });
        });

        const totalDepartmentsInFaculty = facultyDepartments.length;
        const submittedDepartmentIds = new Set(facultySubmissions.map(s => s.departmentId));

        const submissionCompliance = totalDepartmentsInFaculty > 0 ? (submittedDepartmentIds.size / totalDepartmentsInFaculty) * 100 : 0;
        
        return { totalStaff, academicRanks: ranks.size, departmentCount: totalDepartmentsInFaculty, submissionCompliance };
    }, [approvedSubmissions, facultySubmissions, facultyDepartments]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div><h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Faculty level staff analysis and insights.</p></div>
                <button className="flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"><DownloadIcon /> Export Analytics</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card><CardContent className="dark:bg-gray-800"><div className="flex justify-between items-start"><div><h3 className="font-semibold text-gray-600 dark:text-gray-400">Total Staff</h3><p className="text-3xl font-bold dark:text-white">{analytics.totalStaff}</p><p className="text-sm text-green-500 mt-1">+10% from last year</p></div><div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg"><UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-300"/></div></div></CardContent></Card>
                <Card><CardContent className="dark:bg-gray-800"><div className="flex justify-between items-start"><div><h3 className="font-semibold text-gray-600 dark:text-gray-400">Academic Ranks</h3><p className="text-3xl font-bold dark:text-white">{analytics.academicRanks}</p><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Professor to GA</p></div><div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg"><GraduationCapIcon className="w-6 h-6 text-green-600 dark:text-green-300"/></div></div></CardContent></Card>
                <Card><CardContent className="dark:bg-gray-800"><div className="flex justify-between items-start"><div><h3 className="font-semibold text-gray-600 dark:text-gray-400">Departments</h3><p className="text-3xl font-bold dark:text-white">{analytics.departmentCount}</p><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">In Faculty</p></div><div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg"><BuildingOfficeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-300"/></div></div></CardContent></Card>
                <Card><CardContent className="dark:bg-gray-800"><div className="flex justify-between items-start"><div><h3 className="font-semibold text-gray-600 dark:text-gray-400">Compliance</h3><p className="text-3xl font-bold dark:text-white">{analytics.submissionCompliance.toFixed(0)}%</p><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submission rate</p></div><div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg"><ChartBarIcon className="w-6 h-6 text-amber-600 dark:text-amber-300"/></div></div></CardContent></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card><CardHeader><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Staff by Department</h3></CardHeader><CardContent className="h-80">{approvedSubmissions.length > 0 ? <StaffDistributionChart submissions={approvedSubmissions} departments={facultyDepartments} /> : <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400'>No approved data to display.</div>}</CardContent></Card>
                <Card><CardHeader><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Staff Type Distribution</h3></CardHeader><CardContent className="h-80">{approvedSubmissions.length > 0 ? <EmploymentTypePieChart submissions={approvedSubmissions} /> : <div className='flex items-center justify-center h-full text-gray-500 dark:text-gray-400'>No approved data to display.</div>}</CardContent></Card>
            </div>
        </div>
    );
};

const FacultyReportsContent: React.FC = () => {
    const [reportType, setReportType] = useState('staff-summary');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<any>(null);
    
    const handleGenerateReport = (e: React.FormEvent) => { 
        e.preventDefault();
        setIsLoading(true); 
        setGeneratedReport(null);
        setTimeout(() => { 
            setIsLoading(false);
            // Mock data for preview
            if (reportType === 'staff-summary') {
                setGeneratedReport({
                    headers: ['Department', 'Professors', 'Senior Lecturers', 'Total Staff'],
                    rows: [
                        ['Computer Science', 2, 4, 15],
                        ['Physics', 1, 2, 8],
                        ['Biochemistry', 1, 3, 12]
                    ]
                });
            } else { // Gap Analysis
                setGeneratedReport({
                    headers: ['Rank', 'Required', 'Actual', 'Gap'],
                    rows: [
                        [AcademicRank.PROFESSOR, 2, 1, 1],
                        [AcademicRank.SENIOR_LECTURER, 4, 3, 1],
                        [AcademicRank.LECTURER_I, 6, 6, 0]
                    ]
                });
            }
        }, 1200);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><h3 className="font-semibold text-lg text-gray-800 dark:text-white">Report Configuration</h3></CardHeader>
                <form onSubmit={handleGenerateReport}>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div className="md:col-span-2">
                            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
                            <select id="report-type" value={reportType} onChange={e => setReportType(e.target.value)} className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500/50">
                                <option value="staff-summary">Staff Summary Report</option>
                                <option value="gap-analysis">Gap Analysis Report</option>
                            </select>
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full justify-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-5 py-2.5 transition duration-150 disabled:bg-gray-400 flex items-center gap-2">
                            {isLoading ? 'Generating...' : 'Generate Report'}
                        </button>
                    </CardContent>
                </form>
            </Card>

            <Card>
                <CardHeader><h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Preview</h3></CardHeader>
                <CardContent className="min-h-[250px] flex items-center justify-center bg-gray-50/70 dark:bg-gray-800/50 rounded-b-lg">
                    {isLoading ? 
                        <div className="text-center text-gray-500 dark:text-gray-400">
                             <div role="status"> <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/> <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0492C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5424 39.6781 93.9676 39.0409Z" fill="currentFill"/> </svg> <span className="sr-only">Loading...</span> </div>
                            <p className="mt-2 font-medium">Generating report...</p>
                        </div>
                        : generatedReport ?
                         <div className="w-full">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-100 dark:bg-gray-700"><tr>{generatedReport.headers.map((h: string) => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{h}</th>)}</tr></thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {generatedReport.rows.map((row: any[], i: number) => <tr key={i}>{row.map((cell, j) => <td key={j} className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{cell}</td>)}</tr>)}
                                </tbody>
                            </table>
                         </div>
                        : <div className="text-center text-gray-500 dark:text-gray-400"><DocumentChartBarIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" /><p className="mt-2 font-medium">Your generated report will appear here.</p></div>
                    }
                </CardContent>
            </Card>
        </div>
    );
};

const FacultySummaryContent: React.FC<{
    facultySubmissions: Submission[],
    facultyDepartments: Department[],
}> = ({ facultySubmissions, facultyDepartments }) => {
    
    const nucRequirements = {
        profReader: 2,
        sl: 4,
        l2Below: 8,
    };

    const latestApprovedSubmissionsMap = useMemo(() => {
        const approvedSubmissions = facultySubmissions.filter(s => s.status === SubmissionStatus.APPROVED);
        const map = new Map<number, Submission>();
        approvedSubmissions.forEach(sub => {
            if (!map.has(sub.departmentId) || new Date(sub.lastUpdated) > new Date(map.get(sub.departmentId)!.lastUpdated)) {
                map.set(sub.departmentId, sub);
            }
        });
        return map;
    }, [facultySubmissions]);
    
    const departmentData = useMemo(() => {
        return facultyDepartments.map(dept => {
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
            const profReaderPercentGap = nucRequirements.profReader > 0 ? (profReaderGap / nucRequirements.profReader) * 100 : 0;

            return {
                id: dept.id,
                name: dept.name,
                profReader: { req: nucRequirements.profReader, current: profReaderCount, gap: profReaderGap, percentGap: profReaderPercentGap },
                sl: { req: nucRequirements.sl, current: slCount, gap: slGap },
                l2Below: { req: nucRequirements.l2Below, current: l2BelowCount, gap: l2BelowGap },
            };
        });
    }, [facultyDepartments, latestApprovedSubmissionsMap, nucRequirements]);

    let sNo = 0;

    return (
        <Card>
            <CardHeader className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Summary of Academic Staff - NUC GAP ANALYSIS</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Analysis of staff numbers against NUC minimum requirements for each department in your faculty.</p>
                </div>
                <ExportButton />
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm align-middle">
                        <thead className="bg-slate-100 dark:bg-slate-700/50">
                            <tr className="border-b-2 border-slate-300 dark:border-slate-600">
                                <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">S/No.</th>
                                <th className="p-3 text-left font-semibold text-slate-600 dark:text-slate-300">Dept.</th>
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
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                             {departmentData.map((dept) => {
                                 sNo++;
                                 return (
                                     <tr key={dept.id}>
                                         <td className="p-3 font-medium">{sNo}</td>
                                         <td className="p-3 text-slate-700 dark:text-slate-300">{dept.name}</td>
                                         
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
                                     </tr>
                                 );
                             })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const ManageDepartmentsContent: React.FC<{
    facultyDepartments: Department[];
    users: User[];
    onAddDepartment: () => void;
    onRegisterHod: () => void;
    onDeleteDepartment: (id: number) => void;
}> = ({ facultyDepartments, users, onAddDepartment, onRegisterHod, onDeleteDepartment }) => {
    
    const getHodForDepartment = (deptId: number) => {
        return users.find(u => u.role === UserRole.HOD && u.departmentId === deptId && !u.isDeleted);
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Departments & HODs</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add, view, or remove departments and assign HODs.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onAddDepartment} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"><BuildingOfficeIcon className="w-5 h-5" />Add Department</button>
                    <button onClick={onRegisterHod} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"><UserPlusIcon className="w-5 h-5" />Register HOD</button>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Departments in Faculty</h3>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50/75 dark:bg-gray-700/50">
                                <tr>
                                    <th className="p-4 text-left font-semibold text-gray-500 dark:text-gray-300">Department Name</th>
                                    <th className="p-4 text-left font-semibold text-gray-500 dark:text-gray-300">Assigned HOD</th>
                                    <th className="p-4 text-left font-semibold text-gray-500 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {facultyDepartments.map(dept => {
                                    const hod = getHodForDepartment(dept.id);
                                    return (
                                        <tr key={dept.id}>
                                            <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{dept.name}</td>
                                            <td className="p-4">{hod ? hod.name : <span className="text-yellow-600 dark:text-yellow-400">Not Assigned</span>}</td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => {
                                                        if (window.confirm(`Are you sure you want to delete "${dept.name}"? This action cannot be undone.`)) {
                                                            onDeleteDepartment(dept.id);
                                                        }
                                                    }} 
                                                    className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                                                >
                                                    <TrashIcon className="w-5 h-5"/>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {facultyDepartments.length === 0 && (
                                    <tr><td colSpan={3} className="text-center p-8 text-gray-500 dark:text-gray-400">No departments found in this faculty.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


const DeanSupportContent: React.FC<{
    facultyDepartments: Department[];
    users: User[];
    faculty: Faculty | null;
}> = ({ facultyDepartments, users, faculty }) => {
    
    const [recipientDeptId, setRecipientDeptId] = useState<string>('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    const getRecipientInfo = () => {
        if (!recipientDeptId) return null;
        if (recipientDeptId === 'all') {
            return { name: `All HODs in ${faculty?.name}` };
        }
        const dept = facultyDepartments.find(d => d.id === parseInt(recipientDeptId, 10));
        if (!dept) return null;
        const hod = users.find(u => u.departmentId === dept.id && u.role === UserRole.HOD && !u.isDeleted);
        return { name: `HOD, ${dept.name}`, person: hod ? hod.name : 'Not Assigned' };
    };
    
    const recipientInfo = getRecipientInfo();

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Message sent to ${recipientInfo?.name}:\n\nSubject: ${subject}\nMessage: ${message}`);
        setRecipientDeptId('');
        setSubject('');
        setMessage('');
    };

    return (
        <Card>
            <CardHeader>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Contact Departments</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Send a message to HODs in {faculty?.name}.</p>
            </CardHeader>
            <CardContent>
                <div className="max-w-xl mx-auto">
                    <div className="mb-4">
                        <label htmlFor="dept-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Select Recipient
                        </label>
                        <select
                            id="dept-select"
                            value={recipientDeptId}
                            onChange={e => setRecipientDeptId(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        >
                            <option value="" disabled>Choose a department...</option>
                            <option value="all">All Departments in Faculty</option>
                            {facultyDepartments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>

                    {recipientDeptId && (
                        <div className="mt-6 animate-fade-in">
                            <form onSubmit={handleSend} className="p-4 border dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 space-y-4">
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    To: <span className="font-bold">{recipientInfo?.name}</span>
                                    {recipientInfo?.person && <span className="text-slate-500"> ({recipientInfo.person})</span>}
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        required
                                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                                    <textarea
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        required
                                        rows={5}
                                        className="w-full p-2 border border-slate-300 rounded-md shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <button type="submit" className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                        <SendIcon className="w-4 h-4" />
                                        Send
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

const MyProfileContent: React.FC<{
    user: User;
    facultyName: string;
    updateUserProfile: (userId: number, profileData: Partial<Pick<User, 'name' | 'phone' | 'profilePictureUrl'>>) => void;
}> = ({ user, facultyName, updateUserProfile }) => {
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
    
    const profilePicBg = 'E0E7FF';
    const profilePicColor = '4F46E5';
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
                            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400">Faculty</label>
                            <p className="mt-1 text-slate-700 dark:text-slate-300 sm:text-sm">{facultyName}</p>
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
                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">New Submissions</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Get notified when an HOD submits data for review.</p>
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

const DeanDashboard: React.FC = () => {
    const { user, users, logout, updateUserProfile, changePassword } = useAuth();
    const { submissions, departments, faculties, updateSubmissionStatus, addDepartment, announcements, deleteDepartment } = useData();

    const [faculty, setFaculty] = useState<Faculty | null>(null);
    const [facultyDepartments, setFacultyDepartments] = useState<Department[]>([]);
    const [facultySubmissions, setFacultySubmissions] = useState<Submission[]>([]);
    const [activePage, setActivePage] = useState('Dashboard');
    const [pageTitle, setPageTitle] = useState('Dean Dashboard');

    // Modals
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isAddDeptModalOpen, setIsAddDeptModalOpen] = useState(false);
    const [isRegisterHodModalOpen, setIsRegisterHodModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    useEffect(() => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, []);

    useEffect(() => {
        if (user?.facultyId) {
            const currentFaculty = faculties.find(f => f.id === user.facultyId);
            setFaculty(currentFaculty || null);

            const depts = departments.filter(d => d.facultyId === user.facultyId && !d.isDeleted);
            setFacultyDepartments(depts);

            const deptIds = depts.map(d => d.id);
            const subs = submissions.filter(s => deptIds.includes(s.departmentId));
            setFacultySubmissions(subs);
        }
    }, [user, faculties, departments, submissions]);

    const getDepartmentName = useCallback((id: number) => {
        return facultyDepartments.find(d => d.id === id)?.name || 'Unknown Department';
    }, [facultyDepartments]);
    
    const handleOpenReviewModal = (submission: Submission) => {
        setSelectedSubmission(submission);
        setIsReviewModalOpen(true);
    };

    const handleAddDepartment = async (name: string) => {
        if (!faculty) return { success: false, message: 'Faculty not found.' };
        return addDepartment(name, faculty.id);
    };

    const navItems = [
        { name: 'Dashboard', icon: DashboardIcon },
        { name: 'Review Submissions', icon: DocumentCheckIcon },
        { name: 'Faculty Analytics', icon: ChartBarIcon },
        { name: 'Faculty Reports', icon: DocumentChartBarIcon },
        { name: 'Summary', icon: ClipboardDocumentListIcon, title: 'Faculty Staff Summary' },
    ];
    
    const utilityNavItems = [
        { name: 'Manage Departments', icon: BuildingOfficeIcon, title: 'Manage Departments & HODs' },
        { name: 'Support', icon: LifebuoyIcon },
        { name: 'My Profile', icon: UserCircleIcon, title: 'My Profile' },
        { name: 'Settings', icon: Settings2Icon },
    ];

    const renderContent = () => {
        if (!user || !faculty) return null;
        switch (activePage) {
            case 'Dashboard':
                return <DashboardContent facultySubmissions={facultySubmissions} facultyDepartments={facultyDepartments} onNavigate={setActivePage} getDepartmentName={getDepartmentName} announcements={announcements} />;
            case 'Review Submissions':
                return <SubmissionsContent facultySubmissions={facultySubmissions} getDepartmentName={getDepartmentName} onOpenReviewModal={handleOpenReviewModal} />;
            case 'Faculty Analytics':
                return <FacultyAnalyticsContent facultySubmissions={facultySubmissions} facultyDepartments={facultyDepartments} />;
            case 'Faculty Reports':
                return <FacultyReportsContent />;
            case 'Summary':
                return <FacultySummaryContent facultySubmissions={facultySubmissions} facultyDepartments={facultyDepartments} />;
            case 'Manage Departments':
                return (
                    <ManageDepartmentsContent
                        facultyDepartments={facultyDepartments}
                        users={users}
                        onAddDepartment={() => setIsAddDeptModalOpen(true)}
                        onRegisterHod={() => setIsRegisterHodModalOpen(true)}
                        onDeleteDepartment={deleteDepartment}
                    />
                );
            case 'Support':
                return <DeanSupportContent facultyDepartments={facultyDepartments} users={users} faculty={faculty} />;
            case 'My Profile':
                 return <MyProfileContent user={user} facultyName={faculty.name} updateUserProfile={updateUserProfile} />;
            case 'Settings':
                 return <SettingsContent onOpenChangePassword={() => setIsChangePasswordOpen(true)} />;
            default:
                return <div>Page not found</div>;
        }
    };

    if (!user || !faculty) {
        return <div className="flex justify-center items-center h-screen bg-slate-100 dark:bg-slate-900">Loading Dean's data...</div>;
    }

    return (
        <>
            <ReviewSubmissionModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} submission={selectedSubmission} departmentName={getDepartmentName(selectedSubmission?.departmentId || 0)} onUpdateStatus={updateSubmissionStatus} />
            <AddDepartmentModal isOpen={isAddDeptModalOpen} onClose={() => setIsAddDeptModalOpen(false)} onAdd={handleAddDepartment} />
            <RegisterHodModal isOpen={isRegisterHodModalOpen} onClose={() => setIsRegisterHodModalOpen(false)} facultyDepartments={facultyDepartments} />
            {isChangePasswordOpen && <ChangePasswordModal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} userId={user.id} />}
            
            <DashboardLayout
                user={user}
                pageTitle={pageTitle}
                userRoleName={`Dean, ${faculty.name}`}
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

export default DeanDashboard;

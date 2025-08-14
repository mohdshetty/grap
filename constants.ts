

import { 
    AcademicRank, Department, Faculty, Submission, SubmissionStatus, User, UserRole, EmploymentType, HistoryLog,
    SupportTicket, TicketCategory, TicketPriority, TicketStatus,
    LeaveRequest, LeaveType, RequestStatus,
    RecruitmentRequest, RecruitmentStage,
    KnowledgeBaseArticle,
    Notification,
    Announcement
} from './types';

export const BOSU_LOGO_BASE64 = "data:image/png;base64,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";

export const ACADEMIC_RANKS: AcademicRank[] = Object.values(AcademicRank);
export const EMPLOYMENT_TYPES: EmploymentType[] = Object.values(EmploymentType);

export const NUC_REQUIREMENTS: { [key in AcademicRank]?: number } = {
  [AcademicRank.PROFESSOR]: 2,
  [AcademicRank.SENIOR_LECTURER]: 4,
  [AcademicRank.LECTURER_I]: 6,
};

export const INITIAL_FACULTIES: Faculty[] = [
  { id: 1, name: 'Faculty of Management' },
  { id: 2, name: 'Faculty of Science' },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  // Faculty 1: Management
  { id: 101, name: 'Accounting', facultyId: 1 },
  { id: 102, name: 'Business Administration', facultyId: 1 },
  { id: 103, name: 'Economics', facultyId: 1 },
  { id: 104, name: 'Mass Communication', facultyId: 1 },
  { id: 105, name: 'Political Science', facultyId: 1 },
  { id: 106, name: 'Sociology', facultyId: 1 },
  { id: 107, name: 'Public Administration', facultyId: 1 },
  { id: 108, name: 'Marketing', facultyId: 1 },
  // Faculty 2: Science
  { id: 201, name: 'Computer Science', facultyId: 2 },
  { id: 202, name: 'Physics', facultyId: 2 },
  { id: 203, name: 'Biochemistry', facultyId: 2 },
  { id: 204, name: 'Biology', facultyId: 2 },
  { id: 205, name: 'Chemistry', facultyId: 2 },
  { id: 206, name: 'Mathematics', facultyId: 2 },
  { id: 207, name: 'Statistics', facultyId: 2 },
];

export const MOCK_USERS: User[] = [
  { id: 1, username: 'admin', password: 'password', role: UserRole.ADMIN, name: 'Dr. Admin', phone: '08012345678', profilePictureUrl: '' },
  { id: 2, username: 'dean', password: 'password', role: UserRole.DEAN, name: 'Bukar Mallam', facultyId: 1, phone: '08012345678', profilePictureUrl: 'https://i.pravatar.cc/150?u=dean_management' },
  { id: 3, username: 'dean.sci', password: 'password', role: UserRole.DEAN, name: 'Prof. Musa Garba', facultyId: 2, phone: '08012345678', profilePictureUrl: 'https://i.pravatar.cc/150?u=dean_science' },
  // HODs - Faculty of Management
  { id: 101, username: 'hod', password: 'password', role: UserRole.HOD, name: 'Dr. Bala Mohammed', departmentId: 101, staffId: 'BOSU/HOD/ACC/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 102, username: 'hod.bus', password: 'password', role: UserRole.HOD, name: 'Dr. Fatima Ali', departmentId: 102, staffId: 'BOSU/HOD/BUS/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 103, username: 'hod.eco', password: 'password', role: UserRole.HOD, name: 'Dr. Ibrahim Yusuf', departmentId: 103, staffId: 'BOSU/HOD/ECO/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 104, username: 'hod.mcom', password: 'password', role: UserRole.HOD, name: 'Dr. Hadiza Bello', departmentId: 104, staffId: 'BOSU/HOD/MCOM/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 105, username: 'hod.psc', password: 'password', role: UserRole.HOD, name: 'Prof. Sani Ahmed', departmentId: 105, staffId: 'BOSU/HOD/PSC/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 106, username: 'hod.soc', password: 'password', role: UserRole.HOD, name: 'Dr. Maryam Isa', departmentId: 106, staffId: 'BOSU/HOD/SOC/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 107, username: 'hod.pub', password: 'password', role: UserRole.HOD, name: 'Dr. Aisha Aliyu', departmentId: 107, staffId: 'BOSU/HOD/PUB/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 108, username: 'hod.mkt', password: 'password', role: UserRole.HOD, name: 'Mr. David Okon', departmentId: 108, staffId: 'BOSU/HOD/MKT/001', phone: '08012345678', profilePictureUrl: '' },
  // HODs - Faculty of Science
  { id: 201, username: 'hod.csc', password: 'password', role: UserRole.HOD, name: 'Dr. Amina Sani', departmentId: 201, staffId: 'BOSU/HOD/CSC/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 202, username: 'hod.phy', password: 'password', role: UserRole.HOD, name: 'Prof. Emeka Okafor', departmentId: 202, staffId: 'BOSU/HOD/PHY/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 203, username: 'hod.bch', password: 'password', role: UserRole.HOD, name: 'Dr. Femi Adebayo', departmentId: 203, staffId: 'BOSU/HOD/BCH/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 204, username: 'hod.bio', password: 'password', role: UserRole.HOD, name: 'Prof. Helen Eze', departmentId: 204, staffId: 'BOSU/HOD/BIO/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 205, username: 'hod.che', password: 'password', role: UserRole.HOD, name: 'Dr. Chinedu Obi', departmentId: 205, staffId: 'BOSU/HOD/CHE/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 206, username: 'hod.mat', password: 'password', role: UserRole.HOD, name: 'Dr. Fatima Umar', departmentId: 206, staffId: 'BOSU/HOD/MAT/001', phone: '08012345678', profilePictureUrl: '' },
  { id: 207, username: 'hod.stat', password: 'password', role: UserRole.HOD, name: 'Dr. Lanre Bakare', departmentId: 207, staffId: 'BOSU/HOD/STAT/001', phone: '08012345678', profilePictureUrl: '' },
];

export const INITIAL_SUBMISSIONS: Submission[] = [
  {
    departmentId: 101,
    status: SubmissionStatus.APPROVED,
    lastUpdated: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    academicYear: '2023-2024',
    data: {
      [AcademicRank.PROFESSOR]: { [EmploymentType.PERMANENT]: 1, [EmploymentType.VISITING]: 1 },
      [AcademicRank.SENIOR_LECTURER]: { [EmploymentType.PERMANENT]: 2 },
      [AcademicRank.LECTURER_I]: { [EmploymentType.PERMANENT]: 3 },
      [AcademicRank.LECTURER_II]: { [EmploymentType.PERMANENT]: 2 },
      [AcademicRank.ASSISTANT_LECTURER]: { [EmploymentType.PERMANENT]: 4 },
    },
    notes: "Good to go."
  },
  {
    departmentId: 102,
    status: SubmissionStatus.PENDING,
    lastUpdated: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: {
      [AcademicRank.READER]: { [EmploymentType.PERMANENT]: 1 },
      [AcademicRank.SENIOR_LECTURER]: { [EmploymentType.PERMANENT]: 1, [EmploymentType.SABBATICAL]: 1 },
      [AcademicRank.LECTURER_I]: { [EmploymentType.PERMANENT]: 5 },
      [AcademicRank.GRADUATE_ASSISTANT]: { [EmploymentType.PERMANENT]: 2 },
    },
  },
  {
    departmentId: 103,
    status: SubmissionStatus.APPROVED,
    lastUpdated: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: { [AcademicRank.LECTURER_I]: { [EmploymentType.PERMANENT]: 1 } },
    notes: "Approved."
  },
   {
    departmentId: 104,
    status: SubmissionStatus.REJECTED,
    lastUpdated: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: { [AcademicRank.LECTURER_I]: { [EmploymentType.PERMANENT]: 5 } },
    notes: "Data seems incomplete. Please review and resubmit."
  },
  {
    departmentId: 105,
    status: SubmissionStatus.APPROVED,
    lastUpdated: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: { [AcademicRank.PROFESSOR]: { [EmploymentType.PERMANENT]: 2 } },
  },
  {
    departmentId: 107,
    status: SubmissionStatus.PENDING,
    lastUpdated: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: {
      [AcademicRank.READER]: { [EmploymentType.PERMANENT]: 2 },
      [AcademicRank.SENIOR_LECTURER]: { [EmploymentType.PERMANENT]: 3 },
    },
  },
  {
    departmentId: 201,
    status: SubmissionStatus.APPROVED,
    lastUpdated: new Date().toISOString(),
    academicYear: '2024-2025',
    data: {
      [AcademicRank.PROFESSOR]: { [EmploymentType.PERMANENT]: 2 },
      [AcademicRank.SENIOR_LECTURER]: { [EmploymentType.PERMANENT]: 4 },
      [AcademicRank.LECTURER_I]: { [EmploymentType.PERMANENT]: 6 },
    },
    notes: "Approved."
  },
  {
    departmentId: 202,
    status: SubmissionStatus.PENDING,
    lastUpdated: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: { [AcademicRank.PROFESSOR]: { [EmploymentType.SABBATICAL]: 1 } },
  },
  {
    departmentId: 203,
    status: SubmissionStatus.APPROVED,
    lastUpdated: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: {
      [AcademicRank.SENIOR_LECTURER]: { [EmploymentType.PERMANENT]: 3 },
      [AcademicRank.LECTURER_II]: { [EmploymentType.PERMANENT]: 5 },
    },
  },
  {
    departmentId: 204,
    status: SubmissionStatus.REJECTED,
    lastUpdated: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: { [AcademicRank.LECTURER_I]: { [EmploymentType.VISITING]: 10 } },
    notes: "Number of visiting lecturers seems high. Please verify."
  },
  {
    departmentId: 205,
    status: SubmissionStatus.APPROVED,
    lastUpdated: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    academicYear: '2024-2025',
    data: {
      [AcademicRank.READER]: { [EmploymentType.PERMANENT]: 1 },
      [AcademicRank.ASSISTANT_LECTURER]: { [EmploymentType.PERMANENT]: 4 },
    },
  },
  {
    departmentId: 206,
    status: SubmissionStatus.PENDING,
    lastUpdated: new Date().toISOString(),
    academicYear: '2024-2025',
    data: {
      [AcademicRank.PROFESSOR]: { [EmploymentType.PERMANENT]: 1 },
      [AcademicRank.LECTURER_I]: { [EmploymentType.PERMANENT]: 3 },
    },
  },
];

export const MOCK_HISTORY_LOGS: HistoryLog[] = [
    { id: 1, user: 'Dr. Admin', role: UserRole.ADMIN, action: 'CREATE_USER', details: 'Registered new dean: Prof. Musa Garba for Faculty of Science', timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() },
    { id: 2, user: 'Bukar Mallam', role: UserRole.DEAN, action: 'APPROVE_SUBMISSION', details: 'Approved submission for Accounting', timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
    { id: 3, user: 'Dr. Bala Mohammed', role: UserRole.HOD, action: 'SUBMIT_DATA', details: 'Submitted staff data for Accounting', timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
    { id: 4, user: 'Dr. Admin', role: UserRole.ADMIN, action: 'ADD_FACULTY', details: 'Created new faculty: Faculty of Arts', timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    { id: 5, user: 'Bukar Mallam', role: UserRole.DEAN, action: 'REJECT_SUBMISSION', details: 'Requested corrections for Mass Communication submission', timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    { id: 6, user: 'Dr. Admin', role: UserRole.ADMIN, action: 'ADD_DEPARTMENT', details: 'Created new department: History (Faculty of Arts)', timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    { id: 7, user: 'Dr. Hadiza Bello', role: UserRole.HOD, action: 'UPDATE_DRAFT', details: 'Saved draft for Mass Communication', timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
    { id: 8, user: 'Dr. Admin', role: UserRole.ADMIN, action: 'CREATE_USER', details: 'Registered new HOD: Dr. John Doe for History', timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
];

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
    { id: 1, subject: 'Cannot login to portal', requesterName: 'Dr. Fatima Ali', requesterRole: UserRole.HOD, requesterDepartment: 'Business Administration', category: TicketCategory.TECHNICAL, priority: TicketPriority.HIGH, status: TicketStatus.OPEN, createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), lastUpdatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), description: 'My credentials for the gap analysis portal are not working. I have tried resetting the password but did not receive an email. Please assist.' },
    { id: 2, subject: 'Question about NUC requirements', requesterName: 'Prof. Musa Garba', requesterRole: UserRole.DEAN, requesterDepartment: 'Faculty of Science', category: TicketCategory.ACADEMIC, priority: TicketPriority.MEDIUM, status: TicketStatus.IN_PROGRESS, createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), lastUpdatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), description: 'Are the NUC requirements for Professors based on permanent staff only or do visiting professors count towards the total?' },
    { id: 3, subject: 'Staff ID Card Request', requesterName: 'Dr. Amina Sani', requesterRole: UserRole.HOD, requesterDepartment: 'Computer Science', category: TicketCategory.ADMINISTRATIVE, priority: TicketPriority.LOW, status: TicketStatus.RESOLVED, createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), lastUpdatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), description: 'A new lecturer has joined our department and requires a staff ID card. I have attached the necessary forms.' },
    { id: 4, subject: 'Error when submitting data', requesterName: 'Dr. Hadiza Bello', requesterRole: UserRole.HOD, requesterDepartment: 'Mass Communication', category: TicketCategory.TECHNICAL, priority: TicketPriority.URGENT, status: TicketStatus.OPEN, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), lastUpdatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), description: 'The system is showing a "500 Internal Server Error" whenever I try to submit my department\'s data. This is holding up our review process.' }
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
    { id: 1, userName: 'Bukar Mallam', userRole: UserRole.DEAN, departmentName: 'Faculty of Management', leaveType: LeaveType.ANNUAL, startDate: '2024-08-01', endDate: '2024-08-15', status: RequestStatus.PENDING, reason: 'Annual vacation.' },
    { id: 2, userName: 'Dr. Bala Mohammed', userRole: UserRole.HOD, departmentName: 'Accounting', leaveType: LeaveType.SICK, startDate: '2024-07-20', endDate: '2024-07-22', status: RequestStatus.APPROVED, reason: 'Medical procedure.' },
    { id: 3, userName: 'Dr. Chinedu Obi', userRole: UserRole.HOD, departmentName: 'Chemistry', leaveType: LeaveType.STUDY_LEAVE, startDate: '2024-09-01', endDate: '2025-08-31', status: RequestStatus.PENDING, reason: 'Postdoctoral research fellowship in Germany.' },
    { id: 4, userName: 'Prof. Helen Eze', userRole: UserRole.HOD, departmentName: 'Biology', leaveType: LeaveType.SABBATICAL, startDate: '2025-01-01', endDate: '2025-06-30', status: RequestStatus.REJECTED, reason: 'Request conflicts with department accreditation schedule. Please re-apply for a later date.'}
];

export const MOCK_RECRUITMENT_REQUESTS: RecruitmentRequest[] = [
    { id: 1, departmentName: 'Computer Science', facultyName: 'Faculty of Science', position: AcademicRank.LECTURER_I, status: RecruitmentStage.PENDING_APPROVAL, dateSubmitted: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    { id: 2, departmentName: 'Business Administration', facultyName: 'Faculty of Management', position: AcademicRank.SENIOR_LECTURER, status: RecruitmentStage.INTERVIEW, dateSubmitted: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
    { id: 3, departmentName: 'Physics', facultyName: 'Faculty of Science', position: AcademicRank.PROFESSOR, status: RecruitmentStage.HIRED, dateSubmitted: new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString() },
    { id: 4, departmentName: 'Accounting', facultyName: 'Faculty of Management', position: AcademicRank.ASSISTANT_LECTURER, status: RecruitmentStage.REJECTED, dateSubmitted: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
    { id: 5, departmentName: 'Economics', facultyName: 'Faculty of Management', position: AcademicRank.READER, status: RecruitmentStage.OFFER, dateSubmitted: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() },
];

export const MOCK_KB_ARTICLES: KnowledgeBaseArticle[] = [
    { id: 1, title: 'How to Reset Your Portal Password', content: 'To reset your password, please click the "Forgot Password" link on the main login page. You will be prompted to enter your registered email address. A link to reset your password will be sent to your email. Please check your spam folder if you do not see it within a few minutes.', tags: [UserRole.HOD, UserRole.DEAN, UserRole.ADMIN], category: TicketCategory.TECHNICAL, lastUpdated: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    { id: 2, title: 'Understanding the Staff Submission Workflow', content: 'The workflow is as follows: 1. HOD saves a draft or submits data. 2. Dean reviews the "Pending" submission. 3. Dean can either "Approve" it or send it back for "Needs Correction" with notes. 4. Approved data is used for university-wide reports.', tags: [UserRole.HOD], category: TicketCategory.ACADEMIC, lastUpdated: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
    { id: 3, title: 'Procedure for Leave Requests', content: 'All leave requests must be submitted through the portal with a minimum of two weeks notice for annual leave. Sick leave should be reported as soon as possible. All requests will be routed to the appropriate approving authority.', tags: [UserRole.HOD, UserRole.DEAN], category: TicketCategory.ADMINISTRATIVE, lastUpdated: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  // For HOD of Accounting (user id: 101)
  { id: 1, userId: 101, title: "Submission Needs Correction", message: "Your submission for the 2024-2025 academic year was sent back for correction by the Dean.", timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), isRead: false, link: 'My Submissions' },
  { id: 2, userId: 101, title: "Reminder: Update Data", message: "Please remember to update your department's staffing data for the new quarter.", timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), isRead: true, link: 'Dashboard' },
  
  // For Dean of Management (user id: 2)
  { id: 3, userId: 2, title: "New Submission Pending", message: "The Department of Business Administration has submitted their staffing data for your review.", timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), isRead: false, link: 'Review Submissions' },
  { id: 4, userId: 2, title: "New HOD Registered", message: "Dr. Aisha Aliyu has been registered as the HOD for Public Administration.", timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), isRead: false, link: 'Dashboard' },
  { id: 5, userId: 2, title: "Faculty Report Generated", message: "The annual report for the Faculty of Management is ready for download.", timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), isRead: true, link: 'Faculty Reports' },

  // For Admin (user id: 1)
  { id: 6, userId: 1, title: "New Dean Registered", message: "Prof. Musa Garba has been registered as the new Dean for the Faculty of Science.", timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), isRead: false, link: 'Staff Management' },
  { id: 7, userId: 1, title: "High Priority Ticket", message: "A new high priority support ticket has been opened by Dr. Hadiza Bello.", timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), isRead: false, link: 'Support Center' },
  { id: 8, userId: 1, title: "System Update Scheduled", message: "A system update is scheduled for this Sunday at 2 AM. Expect brief downtime.", timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), isRead: true, link: 'Announcements' },
  { id: 9, userId: 1, title: "Database Backup Complete", message: "The weekly database backup completed successfully.", timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), isRead: true, link: 'System History' },
  { id: 10, userId: 1, title: "New Support Ticket", message: "A new support ticket has been received.", timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), isRead: false, link: 'Support Center' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 1, title: 'System Maintenance Scheduled', content: 'The portal will be down for scheduled maintenance on Saturday from 2:00 AM to 4:00 AM. We apologize for any inconvenience.', timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), authorName: 'Admin Office' },
    { id: 2, title: 'Reminder: Academic Year Submissions', content: 'All Heads of Department are reminded to complete their staff submissions for the 2024-2025 academic year by the end of the month.', timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), authorName: 'VC Office' },
    { id: 3, title: 'Welcome to the New Employment Gap Analysis System', content: 'We are pleased to launch the new system. Please familiarize yourself with the features and report any issues to the support center.', timestamp: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(), authorName: 'Admin Office' },
];
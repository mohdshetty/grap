

export enum UserRole {
  HOD = 'HOD',
  DEAN = 'DEAN',
  ADMIN = 'ADMIN',
}

export enum AcademicRank {
  PROFESSOR = 'Professor',
  READER = 'Reader',
  SENIOR_LECTURER = 'Senior Lecturer',
  LECTURER_I = 'Lecturer I',
  LECTURER_II = 'Lecturer II',
  ASSISTANT_LECTURER = 'Assistant Lecturer',
  GRADUATE_ASSISTANT = 'Graduate Assistant',
}

export enum EmploymentType {
  PERMANENT = 'Permanent',
  SABBATICAL = 'Sabbatical',
  VISITING = 'Visiting',
}

export enum SubmissionStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Needs Correction',
  NOT_SUBMITTED = 'Not Submitted',
}

export type StaffCount = {
  [key in EmploymentType]?: number;
};

export type DepartmentStaffing = {
  [key in AcademicRank]?: StaffCount;
};

export interface User {
  id: number;
  username: string;
  password?: string; // Should not be stored in client-side state in a real app
  role: UserRole;
  name: string;
  facultyId?: number;
  departmentId?: number;
  staffId?: string;
  isDeleted?: boolean;
  profilePictureUrl?: string;
  phone?: string;
}

export interface Department {
  id: number;
  name:string;
  facultyId: number;
  isDeleted?: boolean;
}

export interface Faculty {
  id: number;
  name: string;
  isDeleted?: boolean;
}

export interface Submission {
  departmentId: number;
  data: DepartmentStaffing;
  status: SubmissionStatus;
  lastUpdated: string;
  notes?: string;
  academicYear: string;
}

export interface HistoryLog {
    id: number;
    user: string;
    role: UserRole;
    action: string;
    details: string;
    timestamp: string;
}

// --- NEW TYPES FOR ADMIN DASHBOARD ---

export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export enum TicketCategory {
  TECHNICAL = 'Technical',
  ACADEMIC = 'Academic',
  ADMINISTRATIVE = 'Administrative',
}

export enum LeaveType {
  ANNUAL = 'Annual',
  SICK = 'Sick',
  MATERNITY = 'Maternity',
  SABBATICAL = 'Sabbatical',
  STUDY_LEAVE = 'Study Leave',
}

export enum RequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum RecruitmentStage {
    PENDING_APPROVAL = 'Pending Approval',
    INTERVIEW = 'Interview',
    OFFER = 'Offer',
    HIRED = 'Hired',
    REJECTED = 'Rejected',
}

export interface SupportTicket {
  id: number;
  subject: string;
  requesterName: string;
  requesterRole: UserRole;
  requesterDepartment?: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  lastUpdatedAt: string;
  description: string;
}

export interface LeaveRequest {
  id: number;
  userName: string;
  userRole: UserRole;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  reason: string;
}

export interface RecruitmentRequest {
    id: number;
    departmentName: string;
    facultyName: string;
    position: AcademicRank;
    status: RecruitmentStage;
    dateSubmitted: string;
}

export interface KnowledgeBaseArticle {
  id: number;
  title: string;
  content: string;
  tags: UserRole[];
  category: TicketCategory;
  lastUpdated: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  authorName: string;
}
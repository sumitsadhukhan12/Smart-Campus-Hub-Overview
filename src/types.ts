export type UserRole = 'student' | 'faculty' | 'admin';

export interface User {
  _id: string;
  fullName: string;
  collegeId: string;
  email: string;
  phone: string;
  department: string;
  semester?: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export type NoticeCategory =
  | 'General'
  | 'Examination'
  | 'Academic'
  | 'Holiday'
  | 'Placement'
  | 'Scholarship'
  | 'Department'
  | 'Emergency';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface Notice {
  _id: string;
  title: string;
  description: string;
  category: NoticeCategory;
  department: string;
  publishedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  publishDate: string;
  expiryDate?: string;
  attachment?: {
    name: string;
    url: string;
    size: string;
  };
  priority: PriorityLevel;
  isPinned: boolean;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
}

export type EventCategory =
  | 'Workshop'
  | 'Seminar'
  | 'Cultural'
  | 'Sports'
  | 'Technical'
  | 'Hackathon'
  | 'Club'
  | 'Placement';

export interface EventItem {
  _id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  organizer: string;
  department: string;
  category: EventCategory;
  banner?: string;
  registrationDeadline: string;
  maxParticipants: number;
  registeredCount: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  isUserRegistered?: boolean;
}

export type ComplaintCategory =
  | 'Infrastructure'
  | 'Hostel'
  | 'Library'
  | 'Internet'
  | 'Classroom'
  | 'Electricity'
  | 'Cleanliness'
  | 'Transport'
  | 'Academic'
  | 'Other';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export interface ComplaintTimelineEntry {
  status: ComplaintStatus;
  note: string;
  updatedBy: string;
  timestamp: string;
}

export interface ComplaintResponse {
  id: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  timestamp: string;
}

export interface Complaint {
  _id: string;
  complaintId: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  location: string;
  priority: PriorityLevel;
  image?: string;
  status: ComplaintStatus;
  submittedBy: {
    id: string;
    name: string;
    email: string;
    collegeId: string;
    department: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    role: UserRole;
  };
  responses: ComplaintResponse[];
  timeline: ComplaintTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export type LostFoundType = 'lost' | 'found';
export type LostFoundStatus = 'Active' | 'Claim Requested' | 'Returned';

export interface LostFoundItem {
  _id: string;
  type: LostFoundType;
  itemName: string;
  description: string;
  category: string;
  date: string;
  location: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
    roomOrDesk?: string;
  };
  image?: string;
  status: LostFoundStatus;
  postedBy: {
    id: string;
    name: string;
    email: string;
  };
  claimedBy?: {
    id: string;
    name: string;
    email: string;
    message: string;
    claimedAt: string;
  };
  createdAt: string;
}

export type ResourceType =
  | 'Notes'
  | 'PDF'
  | 'Syllabus'
  | 'Previous Year Questions'
  | 'Lab Manual'
  | 'Assignment'
  | 'Study Material'
  | 'E-Book';

export interface AcademicResource {
  _id: string;
  title: string;
  description: string;
  subject: string;
  department: string;
  semester: string;
  resourceType: ResourceType;
  uploadedBy: {
    id: string;
    name: string;
    role: UserRole;
  };
  fileUrl: string;
  fileName: string;
  fileSize: string;
  downloadCount: number;
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'notice' | 'event' | 'complaint' | 'resource' | 'lostfound' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AnalyticsData {
  counts: {
    totalStudents: number;
    totalFaculty: number;
    totalNotices: number;
    upcomingEvents: number;
    pendingComplaints: number;
    resolvedComplaints: number;
    lostItems: number;
    foundItems: number;
    totalResources: number;
    eventRegistrations: number;
  };
  complaintsByCategory: { name: string; count: number }[];
  complaintsByStatus: { name: string; count: number }[];
  eventsRegistrationStats: { name: string; registered: number; capacity: number }[];
  noticesByCategory: { name: string; count: number }[];
  resourcesByDepartment: { name: string; count: number }[];
  recentActivity: {
    id: string;
    type: string;
    title: string;
    user: string;
    time: string;
  }[];
}

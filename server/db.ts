import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Notice,
  EventItem,
  Complaint,
  LostFoundItem,
  AcademicResource,
  NotificationItem,
  AnalyticsData,
} from '../src/types.ts';

export interface EventRegistration {
  _id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  collegeId: string;
  registeredAt: string;
  status: 'confirmed' | 'cancelled';
}

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  notices: Notice[];
  events: EventItem[];
  eventRegistrations: EventRegistration[];
  complaints: Complaint[];
  lostFound: LostFoundItem[];
  resources: AcademicResource[];
  notifications: (NotificationItem & { userId: string | 'all' | 'student' | 'faculty' })[];
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'campus_db.json');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: DatabaseSchema | null = null;

export function getDatabase(): DatabaseSchema {
  if (dbInstance) return dbInstance;

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbInstance = JSON.parse(data);
      if (dbInstance && dbInstance.users && dbInstance.users.length > 0) {
        return dbInstance;
      }
    } catch (err) {
      console.warn('Failed to parse database file, reseeding...', err);
    }
  }

  // Seed default database
  dbInstance = createSeedDatabase();
  saveDatabase();
  return dbInstance;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbInstance, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file:', err);
  }
}

export function resetDatabase(): DatabaseSchema {
  dbInstance = createSeedDatabase();
  saveDatabase();
  return dbInstance;
}

function createSeedDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const studentPassword = bcrypt.hashSync('student123', salt);
  const facultyPassword = bcrypt.hashSync('faculty123', salt);
  const adminPassword = bcrypt.hashSync('admin123', salt);

  const users: (User & { passwordHash: string })[] = [
    {
      _id: 'usr_admin_1',
      fullName: 'Dr. Arthur Vance',
      collegeId: 'ADM-1001',
      email: 'admin@campus.edu',
      phone: '+1 (555) 019-2834',
      department: 'Campus Administration',
      semester: 'N/A',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2025-01-10T08:00:00.000Z',
      passwordHash: adminPassword,
    },
    {
      _id: 'usr_faculty_1',
      fullName: 'Prof. Elena Rostova',
      collegeId: 'FAC-2045',
      email: 'faculty@campus.edu',
      phone: '+1 (555) 018-9122',
      department: 'Computer Science & Engineering',
      semester: 'N/A',
      role: 'faculty',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2025-01-15T09:30:00.000Z',
      passwordHash: facultyPassword,
    },
    {
      _id: 'usr_student_1',
      fullName: 'Alex Rivera',
      collegeId: 'CS-2023-089',
      email: 'student@campus.edu',
      phone: '+1 (555) 012-7845',
      department: 'Computer Science & Engineering',
      semester: 'Semester 6',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2025-02-01T10:15:00.000Z',
      passwordHash: studentPassword,
    },
    {
      _id: 'usr_student_2',
      fullName: 'Sarah Chen',
      collegeId: 'IT-2024-034',
      email: 'sarah.c@campus.edu',
      phone: '+1 (555) 014-9988',
      department: 'Information Technology',
      semester: 'Semester 4',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2025-02-05T14:20:00.000Z',
      passwordHash: studentPassword,
    },
  ];

  const notices: Notice[] = [
    {
      _id: 'not_001',
      title: 'Spring Semester End-Term Examination Schedule Released',
      description: 'The controller of examinations has officially published the draft schedule for all B.Tech and MCA 4th & 6th semester subjects. Students are advised to verify course codes and report any conflicts by Friday, 5:00 PM.',
      category: 'Examination',
      department: 'All',
      publishedBy: {
        id: 'usr_admin_1',
        name: 'Dr. Arthur Vance',
        role: 'admin',
      },
      publishDate: '2026-09-20T09:00:00.000Z',
      expiryDate: '2026-10-15T23:59:59.000Z',
      priority: 'urgent',
      isPinned: true,
      status: 'published',
      attachment: {
        name: 'Exam_Schedule_Spring_2026.pdf',
        url: 'https://example.com/attachments/exam_schedule.pdf',
        size: '1.4 MB',
      },
      createdAt: '2026-09-20T09:00:00.000Z',
    },
    {
      _id: 'not_002',
      title: 'Campus Placement Drive: Cloudscale Technologies for 2026 Batch',
      description: 'Cloudscale Technologies will conduct an on-campus placement drive for final year B.Tech (CSE, IT, ECE) and MCA students. Eligible criteria: CGPA 7.5 and above without standing backlogs. Register via the placement portal.',
      category: 'Placement',
      department: 'Computer Science & Engineering',
      publishedBy: {
        id: 'usr_faculty_1',
        name: 'Prof. Elena Rostova',
        role: 'faculty',
      },
      publishDate: '2026-09-21T11:30:00.000Z',
      expiryDate: '2026-10-05T18:00:00.000Z',
      priority: 'high',
      isPinned: true,
      status: 'published',
      attachment: {
        name: 'Cloudscale_Job_Description.pdf',
        url: 'https://example.com/attachments/cloudscale_jd.pdf',
        size: '890 KB',
      },
      createdAt: '2026-09-21T11:30:00.000Z',
    },
    {
      _id: 'not_003',
      title: 'Annual Merit & Need-Based Scholarship Applications Open',
      description: 'The Academic Council invites applications for the 2026-27 Merit Scholarship. Eligible students with family annual income under threshold and semester CGPA >= 8.5 must submit supporting income tax and mark sheets at Dean Office.',
      category: 'Scholarship',
      department: 'All',
      publishedBy: {
        id: 'usr_admin_1',
        name: 'Dr. Arthur Vance',
        role: 'admin',
      },
      publishDate: '2026-09-18T14:00:00.000Z',
      expiryDate: '2026-10-20T17:00:00.000Z',
      priority: 'medium',
      isPinned: false,
      status: 'published',
      createdAt: '2026-09-18T14:00:00.000Z',
    },
    {
      _id: 'not_004',
      title: 'Scheduled Campus WiFi Maintenance & Core Router Upgrades',
      description: 'The Network Operations Center will conduct high-capacity optical switch maintenance on Saturday night from 11:00 PM to Sunday 06:00 AM. Intermittent network disruptions may occur in South Block and Boys Hostel 3.',
      category: 'Emergency',
      department: 'All',
      publishedBy: {
        id: 'usr_admin_1',
        name: 'Dr. Arthur Vance',
        role: 'admin',
      },
      publishDate: '2026-09-22T08:00:00.000Z',
      expiryDate: '2026-09-25T08:00:00.000Z',
      priority: 'high',
      isPinned: false,
      status: 'published',
      createdAt: '2026-09-22T08:00:00.000Z',
    },
    {
      _id: 'not_005',
      title: 'National Innovation Day: Project Demonstration Call for Proposals',
      description: 'Department of Research & Innovation is welcoming hardware and software student project submissions for the upcoming Innovation Expo. Selected prototypes receive mini-grants of up to $2,000.',
      category: 'Academic',
      department: 'All',
      publishedBy: {
        id: 'usr_faculty_1',
        name: 'Prof. Elena Rostova',
        role: 'faculty',
      },
      publishDate: '2026-09-17T10:00:00.000Z',
      expiryDate: '2026-10-12T17:00:00.000Z',
      priority: 'low',
      isPinned: false,
      status: 'published',
      createdAt: '2026-09-17T10:00:00.000Z',
    },
  ];

  const events: EventItem[] = [
    {
      _id: 'eve_001',
      title: 'HackCampus 2026: 36-Hour National Collegiate Hackathon',
      description: 'Assemble your team of 2-4 members for the premier annual university hackathon! Tracks include AI for Education, Sustainable Smart Cities, Healthcare IoT, and Web3 Infrastructure. Mentors from top tech firms will guide teams through night sprints.',
      date: '2026-10-12',
      startTime: '09:00 AM',
      endTime: '09:00 PM',
      venue: 'Main Auditorium & Innovation Incubator Wing',
      organizer: 'CSE Developer Club & IEEE Student Branch',
      department: 'Computer Science & Engineering',
      category: 'Hackathon',
      banner: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
      registrationDeadline: '2026-10-08',
      maxParticipants: 200,
      registeredCount: 142,
      status: 'upcoming',
      createdAt: '2026-09-15T10:00:00.000Z',
      isUserRegistered: true,
    },
    {
      _id: 'eve_002',
      title: 'Hands-on Workshop: Deep Learning with PyTorch & Gemini Models',
      description: 'Intensive workshop covering neural network architectures, attention mechanisms, fine-tuning pretrained vision models, and building multimodal applications with modern AI APIs. Hands-on coding exercises provided.',
      date: '2026-10-02',
      startTime: '02:00 PM',
      endTime: '05:30 PM',
      venue: 'Turing Computer Lab (Lab Block 3, 2nd Floor)',
      organizer: 'Prof. Elena Rostova',
      department: 'Computer Science & Engineering',
      category: 'Workshop',
      banner: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      registrationDeadline: '2026-09-30',
      maxParticipants: 60,
      registeredCount: 48,
      status: 'upcoming',
      createdAt: '2026-09-18T12:00:00.000Z',
      isUserRegistered: false,
    },
    {
      _id: 'eve_003',
      title: 'Inter-Departmental Football Championship (Fall League)',
      description: 'The annual sports league kicks off with football tournament rounds among engineering and management departments. Cheer for your team or represent your squad. Refreshments provided.',
      date: '2026-10-18',
      startTime: '04:00 PM',
      endTime: '07:30 PM',
      venue: 'University Central Sports Stadium',
      organizer: 'Department of Physical Education',
      department: 'All',
      category: 'Sports',
      banner: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
      registrationDeadline: '2026-10-14',
      maxParticipants: 120,
      registeredCount: 94,
      status: 'upcoming',
      createdAt: '2026-09-19T09:00:00.000Z',
      isUserRegistered: false,
    },
    {
      _id: 'eve_004',
      title: 'Guest Lecture: Sustainable Architecture & Green Computing',
      description: 'Distinguished lecture by Dr. Marcus Sterling on energy-efficient data center architectures and building low-power distributed systems for future carbon-neutral campuses.',
      date: '2026-10-22',
      startTime: '11:00 AM',
      endTime: '01:00 PM',
      venue: 'Seminar Hall B, Science Complex',
      organizer: 'Dean of Academic Affairs',
      department: 'All',
      category: 'Seminar',
      banner: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
      registrationDeadline: '2026-10-20',
      maxParticipants: 150,
      registeredCount: 82,
      status: 'upcoming',
      createdAt: '2026-09-20T10:00:00.000Z',
      isUserRegistered: false,
    },
  ];

  const eventRegistrations: EventRegistration[] = [
    {
      _id: 'reg_001',
      eventId: 'eve_001',
      userId: 'usr_student_1',
      userName: 'Alex Rivera',
      userEmail: 'student@campus.edu',
      collegeId: 'CS-2023-089',
      registeredAt: '2026-09-16T11:20:00.000Z',
      status: 'confirmed',
    },
  ];

  const complaints: Complaint[] = [
    {
      _id: 'cmp_001',
      complaintId: 'CMP-2026-0182',
      title: 'Frequent high-latency and disconnects in Lab 3 WiFi Access Point',
      description: 'During practical coding sessions, the access point in CS Lab 3 repeatedly drops connections or experiences packet loss over 40%, causing git clones and package installs to fail.',
      category: 'Internet',
      location: 'Block C, Lab 3, 2nd Floor',
      priority: 'high',
      status: 'In Progress',
      submittedBy: {
        id: 'usr_student_1',
        name: 'Alex Rivera',
        email: 'student@campus.edu',
        collegeId: 'CS-2023-089',
        department: 'Computer Science & Engineering',
      },
      assignedTo: {
        id: 'usr_admin_1',
        name: 'Dr. Arthur Vance',
        role: 'admin',
      },
      responses: [
        {
          id: 'res_1',
          authorName: 'Dr. Arthur Vance',
          authorRole: 'admin',
          message: 'Campus IT Network Team has dispatched a technician to inspect the switch port and swap the Cisco AP transceiver.',
          timestamp: '2026-09-21T14:30:00.000Z',
        },
      ],
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint registered by student',
          updatedBy: 'Alex Rivera',
          timestamp: '2026-09-20T11:00:00.000Z',
        },
        {
          status: 'Under Review',
          note: 'Assigned to IT Infrastructure Department',
          updatedBy: 'Dr. Arthur Vance',
          timestamp: '2026-09-21T09:15:00.000Z',
        },
        {
          status: 'In Progress',
          note: 'Hardware technician on-site checking optical link',
          updatedBy: 'Dr. Arthur Vance',
          timestamp: '2026-09-21T14:30:00.000Z',
        },
      ],
      createdAt: '2026-09-20T11:00:00.000Z',
      updatedAt: '2026-09-21T14:30:00.000Z',
    },
    {
      _id: 'cmp_002',
      complaintId: 'CMP-2026-0179',
      title: 'Ceiling projector flickering and low bulb brightness in Lecture Hall 402',
      description: 'The overhead HDMI projector lamp flickers intermittently in purple hues and cuts out during faculty slides presentation.',
      category: 'Classroom',
      location: 'Academic Block B, Room 402',
      priority: 'medium',
      status: 'Resolved',
      submittedBy: {
        id: 'usr_student_1',
        name: 'Alex Rivera',
        email: 'student@campus.edu',
        collegeId: 'CS-2023-089',
        department: 'Computer Science & Engineering',
      },
      assignedTo: {
        id: 'usr_admin_1',
        name: 'Dr. Arthur Vance',
        role: 'admin',
      },
      responses: [
        {
          id: 'res_2',
          authorName: 'Dr. Arthur Vance',
          authorRole: 'admin',
          message: 'Projector lamp module replaced and HDMI cable securely rerouted. Tested fine at 1080p 60Hz.',
          timestamp: '2026-09-19T16:45:00.000Z',
        },
      ],
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint registered by student',
          updatedBy: 'Alex Rivera',
          timestamp: '2026-09-18T10:00:00.000Z',
        },
        {
          status: 'In Progress',
          note: 'AV Support assigned ticket',
          updatedBy: 'Dr. Arthur Vance',
          timestamp: '2026-09-18T13:00:00.000Z',
        },
        {
          status: 'Resolved',
          note: 'Lamp replaced, issue closed',
          updatedBy: 'Dr. Arthur Vance',
          timestamp: '2026-09-19T16:45:00.000Z',
        },
      ],
      createdAt: '2026-09-18T10:00:00.000Z',
      updatedAt: '2026-09-19T16:45:00.000Z',
    },
    {
      _id: 'cmp_003',
      complaintId: 'CMP-2026-0185',
      title: 'Water dispenser cooler leakage on 3rd floor corridor',
      description: 'The cold water dispenser opposite Room 310 is leaking water onto the tile hallway, creating a slip hazard.',
      category: 'Cleanliness',
      location: 'Block A, 3rd Floor Corridor',
      priority: 'urgent',
      status: 'Submitted',
      submittedBy: {
        id: 'usr_student_2',
        name: 'Sarah Chen',
        email: 'sarah.c@campus.edu',
        collegeId: 'IT-2024-034',
        department: 'Information Technology',
      },
      responses: [],
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint registered by student',
          updatedBy: 'Sarah Chen',
          timestamp: '2026-09-22T08:15:00.000Z',
        },
      ],
      createdAt: '2026-09-22T08:15:00.000Z',
      updatedAt: '2026-09-22T08:15:00.000Z',
    },
  ];

  const lostFound: LostFoundItem[] = [
    {
      _id: 'lf_001',
      type: 'found',
      itemName: 'Blue Sony WH-1000XM4 Noise-Cancelling Headphones',
      description: 'Found inside a gray protective case on desk row 4 in Central Library 1st floor quiet study area. Left with the circulation desk librarian.',
      category: 'Electronics',
      date: '2026-09-21',
      location: 'Central Library, 1st Floor Study Wing',
      contactInfo: {
        name: 'Circulation Desk Staff (Mr. David)',
        phone: '+1 (555) 019-4400',
        email: 'library.help@campus.edu',
        roomOrDesk: 'Central Library Desk #2',
      },
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
      status: 'Active',
      postedBy: {
        id: 'usr_student_2',
        name: 'Sarah Chen',
        email: 'sarah.c@campus.edu',
      },
      createdAt: '2026-09-21T16:00:00.000Z',
    },
    {
      _id: 'lf_002',
      type: 'lost',
      itemName: 'Brown Leather Fossil Wallet with Student ID Card',
      description: 'Contains university ID card (Alex Rivera CS-2023-089), public transit pass, and student library card. Misplaced between cafeteria and South Lawn benches.',
      category: 'Keys & Wallets',
      date: '2026-09-20',
      location: 'Cafeteria Lawn / Pathway to Science Block',
      contactInfo: {
        name: 'Alex Rivera',
        phone: '+1 (555) 012-7845',
        email: 'student@campus.edu',
        roomOrDesk: 'Boys Hostel 2, Room 214',
      },
      status: 'Active',
      postedBy: {
        id: 'usr_student_1',
        name: 'Alex Rivera',
        email: 'student@campus.edu',
      },
      createdAt: '2026-09-20T17:30:00.000Z',
    },
    {
      _id: 'lf_003',
      type: 'found',
      itemName: 'Silver Parker Fountain Pen with Engraving',
      description: 'Picked up on the lectern in Auditorium B after the guest seminar on Friday afternoon.',
      category: 'Books & Stationery',
      date: '2026-09-19',
      location: 'Auditorium B Lectern',
      contactInfo: {
        name: 'Prof. Elena Rostova',
        phone: '+1 (555) 018-9122',
        email: 'faculty@campus.edu',
        roomOrDesk: 'Faculty Cabin #312',
      },
      status: 'Returned',
      postedBy: {
        id: 'usr_faculty_1',
        name: 'Prof. Elena Rostova',
        email: 'faculty@campus.edu',
      },
      createdAt: '2026-09-19T18:00:00.000Z',
    },
  ];

  const resources: AcademicResource[] = [
    {
      _id: 'res_001',
      title: 'Advanced Operating Systems: Virtual Memory & CPU Scheduling Complete Notes',
      description: 'Comprehensive handwritten & typed lecture notes covering page replacement algorithms, TLB translation, synchronization primitives, and Unix kernel internals.',
      subject: 'Operating Systems (CS-501)',
      department: 'Computer Science & Engineering',
      semester: 'Semester 5',
      resourceType: 'Notes',
      uploadedBy: {
        id: 'usr_faculty_1',
        name: 'Prof. Elena Rostova',
        role: 'faculty',
      },
      fileUrl: 'https://example.com/resources/os_notes_complete.pdf',
      fileName: 'OS_Unit1_to_4_Complete_Notes.pdf',
      fileSize: '4.8 MB',
      downloadCount: 312,
      createdAt: '2026-08-25T10:00:00.000Z',
    },
    {
      _id: 'res_002',
      title: 'Database Management Systems: 5-Year Previous Exam Solved Papers',
      description: 'Compilation of university end-term question papers with model answers, ER diagrams, normalization steps (BCNF/3NF), and query optimization examples.',
      subject: 'Database Systems (CS-403)',
      department: 'Computer Science & Engineering',
      semester: 'Semester 4',
      resourceType: 'Previous Year Questions',
      uploadedBy: {
        id: 'usr_faculty_1',
        name: 'Prof. Elena Rostova',
        role: 'faculty',
      },
      fileUrl: 'https://example.com/resources/dbms_pyq_solved.pdf',
      fileName: 'DBMS_Solved_PYQ_2021_2025.pdf',
      fileSize: '6.2 MB',
      downloadCount: 450,
      createdAt: '2026-09-02T14:30:00.000Z',
    },
    {
      _id: 'res_003',
      title: 'Full Stack Web Development Lab Manual (React, Node, Express, MongoDB)',
      description: 'Official university lab manual with step-by-step problem statements, boilerplate code references, API routing guides, and viva questions.',
      subject: 'Web Technologies Lab (IT-602)',
      department: 'Information Technology',
      semester: 'Semester 6',
      resourceType: 'Lab Manual',
      uploadedBy: {
        id: 'usr_faculty_1',
        name: 'Prof. Elena Rostova',
        role: 'faculty',
      },
      fileUrl: 'https://example.com/resources/web_tech_lab_manual.pdf',
      fileName: 'MERN_WebTech_Lab_Manual_2026.pdf',
      fileSize: '3.1 MB',
      downloadCount: 278,
      createdAt: '2026-09-08T09:15:00.000Z',
    },
    {
      _id: 'res_004',
      title: 'Official Academic Curriculum & Syllabus 2024-2028 (B.Tech CSE & IT)',
      description: 'Official academic regulation booklet detailing course credits, prerequisites, grading rubrics, and elective bucket allocations.',
      subject: 'Curriculum & Scheme',
      department: 'Computer Science & Engineering',
      semester: 'All Semesters',
      resourceType: 'Syllabus',
      uploadedBy: {
        id: 'usr_admin_1',
        name: 'Dr. Arthur Vance',
        role: 'admin',
      },
      fileUrl: 'https://example.com/resources/syllabus_cse_it_2026.pdf',
      fileName: 'Academic_Syllabus_Scheme_2026.pdf',
      fileSize: '2.5 MB',
      downloadCount: 680,
      createdAt: '2026-08-10T12:00:00.000Z',
    },
  ];

  const notifications: (NotificationItem & { userId: string | 'all' | 'student' | 'faculty' })[] = [
    {
      _id: 'notif_001',
      userId: 'all',
      title: 'Exam Schedule Announced',
      message: 'Draft schedule for Spring Semester End-Term Examination has been published.',
      type: 'notice',
      link: '/notices',
      isRead: false,
      createdAt: '2026-09-20T09:05:00.000Z',
    },
    {
      _id: 'notif_002',
      userId: 'usr_student_1',
      title: 'HackCampus Registration Confirmed',
      message: 'Your registration for HackCampus 2026 has been successfully verified.',
      type: 'event',
      link: '/events',
      isRead: true,
      createdAt: '2026-09-16T11:21:00.000Z',
    },
    {
      _id: 'notif_003',
      userId: 'usr_student_1',
      title: 'Complaint Status Updated',
      message: 'Your grievance CMP-2026-0182 has moved to "In Progress". Hardware technician on-site.',
      type: 'complaint',
      link: '/complaints',
      isRead: false,
      createdAt: '2026-09-21T14:31:00.000Z',
    },
    {
      _id: 'notif_004',
      userId: 'all',
      title: 'New Study Resource Uploaded',
      message: 'Prof. Elena Rostova uploaded "DBMS 5-Year Solved Papers".',
      type: 'resource',
      link: '/resources',
      isRead: false,
      createdAt: '2026-09-02T14:35:00.000Z',
    },
  ];

  return {
    users,
    notices,
    events,
    eventRegistrations,
    complaints,
    lostFound,
    resources,
    notifications,
  };
}

// Analytics builder helper
export function getAnalyticsData(): AnalyticsData {
  const db = getDatabase();

  const totalStudents = db.users.filter((u) => u.role === 'student').length;
  const totalFaculty = db.users.filter((u) => u.role === 'faculty').length;
  const totalNotices = db.notices.length;
  const upcomingEvents = db.events.filter((e) => e.status === 'upcoming').length;
  const pendingComplaints = db.complaints.filter((c) => c.status !== 'Resolved' && c.status !== 'Closed').length;
  const resolvedComplaints = db.complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length;
  const lostItems = db.lostFound.filter((l) => l.type === 'lost').length;
  const foundItems = db.lostFound.filter((l) => l.type === 'found').length;
  const totalResources = db.resources.length;
  const eventRegistrations = db.eventRegistrations.filter((r) => r.status === 'confirmed').length;

  // Complaints by category
  const catMap: Record<string, number> = {};
  db.complaints.forEach((c) => {
    catMap[c.category] = (catMap[c.category] || 0) + 1;
  });
  const complaintsByCategory = Object.entries(catMap).map(([name, count]) => ({ name, count }));

  // Complaints by status
  const statusMap: Record<string, number> = {
    Submitted: 0,
    'Under Review': 0,
    'In Progress': 0,
    Resolved: 0,
    Closed: 0,
  };
  db.complaints.forEach((c) => {
    statusMap[c.status] = (statusMap[c.status] || 0) + 1;
  });
  const complaintsByStatus = Object.entries(statusMap).map(([name, count]) => ({ name, count }));

  // Event registration stats
  const eventsRegistrationStats = db.events.slice(0, 5).map((e) => ({
    name: e.title.length > 20 ? e.title.substring(0, 18) + '...' : e.title,
    registered: e.registeredCount,
    capacity: e.maxParticipants,
  }));

  // Notices by category
  const noticeCatMap: Record<string, number> = {};
  db.notices.forEach((n) => {
    noticeCatMap[n.category] = (noticeCatMap[n.category] || 0) + 1;
  });
  const noticesByCategory = Object.entries(noticeCatMap).map(([name, count]) => ({ name, count }));

  // Resources by Department
  const resDeptMap: Record<string, number> = {};
  db.resources.forEach((r) => {
    const dept = r.department.includes('Computer') ? 'CSE' : r.department.includes('Information') ? 'IT' : 'Other';
    resDeptMap[dept] = (resDeptMap[dept] || 0) + 1;
  });
  const resourcesByDepartment = Object.entries(resDeptMap).map(([name, count]) => ({ name, count }));

  const recentActivity = [
    {
      id: 'act_1',
      type: 'Notice',
      title: 'Spring Semester Exam Schedule Released',
      user: 'Dr. Arthur Vance',
      time: '2 hours ago',
    },
    {
      id: 'act_2',
      type: 'Complaint',
      title: 'WiFi AP latency in CS Lab 3 updated to In Progress',
      user: 'Dr. Arthur Vance',
      time: '4 hours ago',
    },
    {
      id: 'act_3',
      type: 'Event',
      title: 'HackCampus 2026 reached 142 registrations',
      user: 'Alex Rivera',
      time: 'Yesterday',
    },
    {
      id: 'act_4',
      type: 'Resource',
      title: 'DBMS 5-Year Solved Papers downloaded 450 times',
      user: 'Prof. Elena Rostova',
      time: '2 days ago',
    },
  ];

  return {
    counts: {
      totalStudents,
      totalFaculty,
      totalNotices,
      upcomingEvents,
      pendingComplaints,
      resolvedComplaints,
      lostItems,
      foundItems,
      totalResources,
      eventRegistrations,
    },
    complaintsByCategory,
    complaintsByStatus,
    eventsRegistrationStats,
    noticesByCategory,
    resourcesByDepartment,
    recentActivity,
  };
}

# Smart Campus Hub

> **"One Campus. One Platform. Everything Connected."**

Smart Campus Hub is a full-stack, production-grade digital campus web platform designed for modern universities and colleges. It unifies academic bulletins, event registration, student grievance redressal, lost & found retrieval, syllabus repository access, campus administrative analytics, and an AI-powered campus assistant into a single cohesive, role-protected interface.

---

## 🚀 Key Features & Modules

### 1. Role-Based Access Control (RBAC)
- **Student**: View notices, RSVP for campus events & workshops, file and track grievances in real time, report and claim lost/found property, download lecture notes & previous year papers, and view their official institutional Digital Student ID Card.
- **Faculty**: Publish academic notices with official document attachments, host department seminars and hackathons, review student complaints assigned to their department, upload curriculum resources, and manage classroom logistics.
- **Admin**: Full oversight over university operations, grievance resolution velocity, event attendance telemetry, user role assignment, user activation/suspension, and platform-wide broadcast notices.

### 2. Digital Notice Board
- Priority classifications: **Low**, **Medium**, **High**, and **Urgent Alert** (pulsing badge).
- Filter by category: *General, Examination, Academic, Holiday, Placement, Scholarship, Department, Emergency*.
- Real-time search by title, department, or keyword.
- Pinned institutional notices pinned to the top.
- Document preview and download simulation.

### 3. Campus Event Management
- Comprehensive schedule for workshops, hackathons, guest lectures, sports meets, and cultural fests.
- Live seat availability tracker with real-time capacity progress indicators.
- Instant 1-click event seat registration and cancellation.
- Calendar-based filtering (*All, Today, This Week, Upcoming, Completed*).

### 4. Student Grievance & Complaint Redressal
- Unique tracking IDs (e.g. `CMP-8241`).
- 5-stage progress lifecycle: **Submitted → Under Review → In Progress → Resolved → Closed**.
- Priority tagging (*Low, Medium, High, Urgent*).
- Photo attachment previews and categorized by facility (*Hostel, Library, Classroom, Electricity, Internet, Cleanliness, Transport, Academic*).
- Official administration audit timeline with timestamped notes.

### 5. Campus Lost & Found Marketplace
- Dual-track categorization: **Lost Item Report** vs. **Found Item Report**.
- Location, date, and contact details with verified claiming workflow.
- Status transitions: **Active → Claim Requested → Returned**.

### 6. Academic Resource Repository
- Categorized notes, syllabi, previous year exam papers, lab manuals, and assignments.
- Filter by Department (CSE, IT, ECE, ME, CE, MBA) and Semester (Sem 1 to Sem 8).
- Real-time download counter incrementation.

### 7. AI Campus Assistant (Gemini-Powered)
- Server-side integration with Google's `@google/genai` SDK using `gemini-2.5-flash`.
- Ingests real-time campus data (active notices, scheduled events, grievance status, resource directories) as dynamic context grounding.
- Answers student inquiries with conversational, contextual accuracy and reference tags.

### 8. Institutional Analytics & Operational Governance (Admin)
- Telemetry dashboard powered by **Recharts** charts.
- Resolution rate metrics, grievance category distribution, and event booking percentages.
- User management table with quick search, department filtering, role upgrading, and account suspension toggle.

### 9. Digital Student Identity Card & Profile
- Modern university card design featuring college roll number, academic department, validity cycle, and bar/QR code simulation.
- Tabbed history of registered events, submitted complaints, and personal lost & found listings.

---

## 🔑 Demo Credentials

To test the application immediately across different roles, use the quick role switcher in the top navigation bar or log in with these pre-seeded accounts:

| Role | Email / College ID | Password | Department |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campus.edu` (or `STU-2024-001`) | `student123` | Computer Science & Engineering |
| **Faculty** | `faculty@campus.edu` (or `FAC-2024-102`) | `faculty123` | Computer Science & Engineering |
| **Administrator** | `admin@campus.edu` (or `ADM-2024-001`) | `admin123` | Campus Administration |

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS 4 with custom university palette
- **Icons**: Lucide React (`lucide-react`)
- **Data Visualization**: Recharts (`recharts`)
- **Animations**: CSS fluid transitions and `motion`

### Backend
- **Runtime**: Node.js with TypeScript (`tsx` in dev, `esbuild` bundled for production)
- **Framework**: Express 4
- **Security**: JWT authentication (`jsonwebtoken`), password hashing simulation, RBAC middleware (`requireAuth`, `requireRole`)
- **AI Service**: Google Gen AI SDK (`@google/genai`) on server-side `/api/ai/assistant`
- **Database Layer**: MongoDB-compatible persistent JSON document store with collections for Users, Notices, Events, Complaints, LostFound, Resources, and Notifications.

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new student or faculty account
- `POST /api/auth/login` - Authenticate with email/collegeId and password
- `GET /api/auth/me` - Fetch authenticated user profile

### Notices (`/api/notices`)
- `GET /api/notices` - List notices with filtering (category, department, priority, search)
- `GET /api/notices/:id` - Fetch notice detail
- `POST /api/notices` - Create new notice *(Faculty & Admin only)*
- `PUT /api/notices/:id` - Update notice *(Faculty & Admin only)*
- `DELETE /api/notices/:id` - Delete notice *(Admin only)*

### Events (`/api/events`)
- `GET /api/events` - List campus events
- `GET /api/events/:id` - Get event details
- `POST /api/events` - Create event *(Faculty & Admin only)*
- `POST /api/events/:id/register` - Register seat for student
- `POST /api/events/:id/cancel-registration` - Cancel student seat

### Complaints (`/api/complaints`)
- `GET /api/complaints` - List complaints (students view own, admins view all)
- `GET /api/complaints/:id` - Get complaint timeline & responses
- `POST /api/complaints` - Submit new grievance
- `PUT /api/complaints/:id/status` - Update ticket status & append timeline remark *(Admin/Faculty)*
- `POST /api/complaints/:id/responses` - Post official reply message

### Lost & Found (`/api/lost-found`)
- `GET /api/lost-found` - List active items
- `POST /api/lost-found` - Report lost or found article
- `POST /api/lost-found/:id/claim` - Submit claim request
- `PUT /api/lost-found/:id/status` - Mark as returned or active

### Academic Resources (`/api/resources`)
- `GET /api/resources` - Search study materials by department and semester
- `POST /api/resources` - Upload resource *(Faculty & Admin)*
- `GET /api/resources/:id/download` - Increment download counter and retrieve link

### Admin & Analytics (`/api/analytics`, `/api/users`)
- `GET /api/analytics` - Operational KPIs, grievance funnel, and enrollment statistics
- `GET /api/users` - List all registered campus members
- `PUT /api/users/:id/role` - Update member role (`student` | `faculty` | `admin`)
- `PUT /api/users/:id/status` - Toggle account status (`active` | `suspended`)

### AI Campus Assistant (`/api/ai`)
- `POST /api/ai/assistant` - Natural language query processed by Gemini using real-time campus data context

---

## 💻 Running the Project

### Development
```bash
npm run dev
```
The Express server boots on port `3000` with Vite integration.

### Production Build
```bash
npm run build
npm start
```
Compiles client assets to `dist/` and backend code to `dist/server.cjs`.

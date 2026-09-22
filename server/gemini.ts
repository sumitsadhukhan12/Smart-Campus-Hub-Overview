import { GoogleGenAI } from '@google/genai';
import { getDatabase } from './db.ts';
import { User } from '../src/types.ts';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function askCampusAssistant(
  prompt: string,
  currentUser?: User
): Promise<{ answer: string; references?: string[] }> {
  const db = getDatabase();

  // Assemble real campus context from the active database
  const activeNotices = db.notices
    .filter((n) => n.status === 'published')
    .map((n) => `[Notice] "${n.title}" (Category: ${n.category}, Priority: ${n.priority}, Dept: ${n.department}, Date: ${n.publishDate.split('T')[0]})\n${n.description}`)
    .join('\n\n');

  const upcomingEvents = db.events
    .filter((e) => e.status === 'upcoming')
    .map((e) => `[Event] "${e.title}" (Date: ${e.date} ${e.startTime} - ${e.endTime}, Venue: ${e.venue}, Category: ${e.category}, Deadline: ${e.registrationDeadline}, Registered: ${e.registeredCount}/${e.maxParticipants})\n${e.description}`)
    .join('\n\n');

  const resourcesList = db.resources
    .map((r) => `[Resource] "${r.title}" (Subject: ${r.subject}, Dept: ${r.department}, Semester: ${r.semester}, Type: ${r.resourceType}, File: ${r.fileName}, Downloads: ${r.downloadCount})`)
    .join('\n');

  const lostFoundList = db.lostFound
    .map((l) => `[Lost & Found - ${l.type.toUpperCase()}] "${l.itemName}" (Status: ${l.status}, Location: ${l.location}, Category: ${l.category}, Date: ${l.date})\n${l.description}`)
    .join('\n\n');

  // Filter complaints relevant to this user if logged in
  let userComplaints = 'No user is logged in or user has no complaints submitted.';
  if (currentUser) {
    const userCmp = db.complaints.filter((c) => c.submittedBy.id === currentUser._id || c.submittedBy.email === currentUser.email);
    if (userCmp.length > 0) {
      userComplaints = userCmp
        .map((c) => `[Complaint ID: ${c.complaintId}] "${c.title}" (Category: ${c.category}, Status: ${c.status}, Priority: ${c.priority}, Location: ${c.location}, Latest update: ${c.timeline[c.timeline.length - 1]?.note || 'N/A'})`)
        .join('\n');
    }
  }

  const campusContext = `
CURRENT CAMPUS DATA:
User Asking: ${currentUser ? `${currentUser.fullName} (${currentUser.role}, ${currentUser.department}, ${currentUser.collegeId})` : 'Guest / Prospective Student'}

ACTIVE NOTICES:
${activeNotices || 'No notices published currently.'}

UPCOMING EVENTS:
${upcomingEvents || 'No upcoming events.'}

ACADEMIC RESOURCES:
${resourcesList || 'No resources available.'}

LOST & FOUND ITEMS:
${lostFoundList || 'No lost or found items recorded.'}

USER'S SUBMITTED COMPLAINTS:
${userComplaints}
`;

  const ai = getGenAI();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are the Smart Campus Hub AI Assistant for the college university.
Your job is to assist students, faculty, and campus visitors with precise, factual answers based strictly on the provided CAMPUS DATA.

Rules:
1. Answer directly and concisely with a helpful, friendly collegiate tone.
2. If the user asks about notices, events, complaints, academic resources, or lost & found, extract details directly from the provided data.
3. If the answer or requested item is NOT available in the database, clearly and politely say that the information is currently not available or not found in the campus records. DO NOT invent, hallucinate, or assume fake notices, dates, or files.
4. Format your answer nicely with bullet points or bold titles when appropriate.

${campusContext}
`,
          temperature: 0.3,
        },
      });

      const text = response.text?.trim();
      if (text) {
        return { answer: text };
      }
    } catch (err) {
      console.warn('Gemini API call failed or timed out, using intelligent local campus search fallback:', err);
    }
  }

  // Resilient fallback logic when API key isn't provided or offline
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('notice') || lowerPrompt.includes('announcement')) {
    const list = db.notices.slice(0, 3).map((n) => `• **${n.title}** (${n.category} - ${n.publishDate.split('T')[0]}): ${n.description.substring(0, 120)}...`).join('\n\n');
    return {
      answer: `Here are the latest active campus notices:\n\n${list}\n\nYou can view all details in the **Notices** tab.`,
    };
  }

  if (lowerPrompt.includes('event') || lowerPrompt.includes('hackathon') || lowerPrompt.includes('workshop')) {
    const list = db.events.slice(0, 3).map((e) => `• **${e.title}** on ${e.date} (${e.startTime} - ${e.endTime}) at ${e.venue}. Category: ${e.category}. Deadline: ${e.registrationDeadline}.`).join('\n\n');
    return {
      answer: `Here are the upcoming campus events:\n\n${list}\n\nYou can register directly in the **Events** tab!`,
    };
  }

  if (lowerPrompt.includes('complaint') || lowerPrompt.includes('grievance') || lowerPrompt.includes('status')) {
    if (!currentUser) {
      return { answer: 'Please log in to your student or faculty account to track your submitted complaints and their live resolution status.' };
    }
    const myCmp = db.complaints.filter((c) => c.submittedBy.id === currentUser._id || c.submittedBy.email === currentUser.email);
    if (myCmp.length === 0) {
      return { answer: `No active complaints registered under your account (${currentUser.fullName}). You can submit a new grievance in the **Complaints** section.` };
    }
    const list = myCmp.map((c) => `• **${c.complaintId}**: ${c.title} — Current Status: **${c.status}** (${c.timeline[c.timeline.length - 1]?.note || 'In review'}).`).join('\n');
    return {
      answer: `Here is the status of your complaints:\n\n${list}`,
    };
  }

  if (lowerPrompt.includes('resource') || lowerPrompt.includes('note') || lowerPrompt.includes('bca') || lowerPrompt.includes('cse') || lowerPrompt.includes('syllabus') || lowerPrompt.includes('pyq')) {
    const matches = db.resources.filter((r) =>
      lowerPrompt.includes('bca') ? r.subject.toLowerCase().includes('bca') || r.department.toLowerCase().includes('computer') : true
    );
    const list = (matches.length > 0 ? matches : db.resources).slice(0, 3).map((r) => `• **${r.title}** (${r.subject} - ${r.resourceType}, ${r.fileSize})`).join('\n');
    return {
      answer: `Here are matching academic resources available in the digital library:\n\n${list}\n\nYou can preview or download them from the **Academic Resources** tab.`,
    };
  }

  if (lowerPrompt.includes('lost') || lowerPrompt.includes('found')) {
    const list = db.lostFound.slice(0, 3).map((l) => `• **${l.itemName}** [${l.type.toUpperCase()}] at ${l.location} (Status: ${l.status})`).join('\n');
    return {
      answer: `Here are recent campus Lost & Found items:\n\n${list}\n\nCheck the **Lost & Found** section to claim or post an item.`,
    };
  }

  return {
    answer: `I am the Smart Campus Assistant. You can ask me about:
• Today's latest campus notices and urgent announcements
• Upcoming workshops, hackathons, and sports events
• Your personal complaint status and timeline
• Academic notes, syllabus, lab manuals, and previous year exam papers
• Lost & Found item listings and contacts

How can I help you navigate the campus today?`,
  };
}

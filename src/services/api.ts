import {
  User,
  Notice,
  EventItem,
  Complaint,
  LostFoundItem,
  AcademicResource,
  NotificationItem,
  AnalyticsData,
  ComplaintStatus,
  UserRole,
} from '../types.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('campus_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Authentication
  auth: {
    login: async (identifier: string, password: string): Promise<{ token: string; user: User }> => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      return handleResponse(res);
    },
    register: async (payload: any): Promise<{ token: string; user: User }> => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    me: async (): Promise<{ user: User }> => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    forgotPassword: async (email: string): Promise<{ message: string; mockResetCode?: string }> => {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return handleResponse(res);
    },
    resetPassword: async (email: string, newPassword: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });
      return handleResponse(res);
    },
  },

  // Notices
  notices: {
    list: async (params?: { category?: string; department?: string; priority?: string; search?: string }): Promise<{ notices: Notice[] }> => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/notices?${query}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    get: async (id: string): Promise<{ notice: Notice }> => {
      const res = await fetch(`${API_BASE}/notices/${id}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    create: async (payload: Partial<Notice>): Promise<{ notice: Notice; message: string }> => {
      const res = await fetch(`${API_BASE}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    update: async (id: string, payload: Partial<Notice>): Promise<{ notice: Notice; message: string }> => {
      const res = await fetch(`${API_BASE}/notices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE}/notices/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
  },

  // Events
  events: {
    list: async (params?: { category?: string; filter?: string; search?: string }): Promise<{ events: EventItem[] }> => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/events?${query}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    get: async (id: string): Promise<{ event: EventItem }> => {
      const res = await fetch(`${API_BASE}/events/${id}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    create: async (payload: Partial<EventItem>): Promise<{ event: EventItem; message: string }> => {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    update: async (id: string, payload: Partial<EventItem>): Promise<{ event: EventItem; message: string }> => {
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    register: async (id: string): Promise<{ message: string; event: EventItem }> => {
      const res = await fetch(`${API_BASE}/events/${id}/register`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    cancelRegistration: async (id: string): Promise<{ message: string; event: EventItem }> => {
      const res = await fetch(`${API_BASE}/events/${id}/cancel-registration`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
  },

  // Complaints / Grievances
  complaints: {
    list: async (params?: { category?: string; status?: string; priority?: string; search?: string; scope?: string }): Promise<{ complaints: Complaint[] }> => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/complaints?${query}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    get: async (id: string): Promise<{ complaint: Complaint }> => {
      const res = await fetch(`${API_BASE}/complaints/${id}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    create: async (payload: Partial<Complaint>): Promise<{ complaint: Complaint; message: string }> => {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    updateStatus: async (id: string, status: ComplaintStatus, note?: string): Promise<{ complaint: Complaint; message: string }> => {
      const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status, note }),
      });
      return handleResponse(res);
    },
    postResponse: async (id: string, message: string): Promise<{ complaint: Complaint; message: string }> => {
      const res = await fetch(`${API_BASE}/complaints/${id}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ message }),
      });
      return handleResponse(res);
    },
  },

  // Lost & Found
  lostFound: {
    list: async (params?: { type?: string; category?: string; status?: string; search?: string }): Promise<{ items: LostFoundItem[] }> => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/lost-found?${query}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    get: async (id: string): Promise<{ item: LostFoundItem }> => {
      const res = await fetch(`${API_BASE}/lost-found/${id}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    create: async (payload: Partial<LostFoundItem>): Promise<{ item: LostFoundItem; message: string }> => {
      const res = await fetch(`${API_BASE}/lost-found`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    claim: async (id: string, message?: string): Promise<{ item: LostFoundItem; message: string }> => {
      const res = await fetch(`${API_BASE}/lost-found/${id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ message }),
      });
      return handleResponse(res);
    },
    markReturned: async (id: string): Promise<{ item: LostFoundItem; message: string }> => {
      const res = await fetch(`${API_BASE}/lost-found/${id}/return`, {
        method: 'POST',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE}/lost-found/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
  },

  // Academic Resources
  resources: {
    list: async (params?: { department?: string; semester?: string; type?: string; search?: string }): Promise<{ resources: AcademicResource[] }> => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/resources?${query}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    download: async (id: string): Promise<{ downloadUrl: string; fileName: string; resource: AcademicResource }> => {
      const res = await fetch(`${API_BASE}/resources/${id}/download`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    upload: async (payload: Partial<AcademicResource>): Promise<{ resource: AcademicResource; message: string }> => {
      const res = await fetch(`${API_BASE}/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      return handleResponse(res);
    },
    delete: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE}/resources/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
  },

  // Notifications
  notifications: {
    list: async (): Promise<{ notifications: NotificationItem[]; unreadCount: number }> => {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    markRead: async (id: string): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    markAllRead: async (): Promise<{ message: string }> => {
      const res = await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PUT',
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
  },

  // Analytics
  analytics: {
    get: async (): Promise<{ analytics: AnalyticsData }> => {
      const res = await fetch(`${API_BASE}/analytics`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
  },

  // Users (Admin)
  users: {
    list: async (params?: { role?: string; department?: string; search?: string }): Promise<{ users: User[] }> => {
      const query = new URLSearchParams(params as any).toString();
      const res = await fetch(`${API_BASE}/users?${query}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
    updateRole: async (id: string, role: UserRole): Promise<{ user: User; message: string }> => {
      const res = await fetch(`${API_BASE}/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ role }),
      });
      return handleResponse(res);
    },
    updateStatus: async (id: string, status: 'active' | 'suspended'): Promise<{ user: User; message: string }> => {
      const res = await fetch(`${API_BASE}/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },
  },

  // Global Search
  search: {
    global: async (q: string): Promise<{
      results: {
        notices: Notice[];
        events: EventItem[];
        complaints: any[];
        lostFound: LostFoundItem[];
        resources: AcademicResource[];
      };
      totalResults: number;
    }> => {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, {
        headers: { ...getAuthHeader() },
      });
      return handleResponse(res);
    },
  },

  // AI Campus Assistant
  ai: {
    ask: async (prompt: string): Promise<{ answer: string; references?: string[] }> => {
      const res = await fetch(`${API_BASE}/ai/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ prompt }),
      });
      return handleResponse(res);
    },
  },
};

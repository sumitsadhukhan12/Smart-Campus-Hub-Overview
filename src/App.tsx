import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import Navbar from './components/layout/Navbar.tsx';
import Sidebar from './components/layout/Sidebar.tsx';
import ToastContainer from './components/common/ToastContainer.tsx';
import GlobalSearchModal from './components/common/GlobalSearchModal.tsx';
import AuthModal from './pages/AuthModal.tsx';
import CampusAssistantModal from './components/ai/CampusAssistantModal.tsx';

// Pages
import DashboardPage from './pages/DashboardPage.tsx';
import NoticesPage from './pages/NoticesPage.tsx';
import EventsPage from './pages/EventsPage.tsx';
import ComplaintsPage from './pages/ComplaintsPage.tsx';
import LostFoundPage from './pages/LostFoundPage.tsx';
import ResourcesPage from './pages/ResourcesPage.tsx';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';

function MainLayout() {
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);

  // Close mobile drawer on Escape key press
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const handleNavigate = (tab: string, itemId?: string) => {
    setCurrentTab(tab);
    setSelectedItemId(itemId || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSidebarNavigate = (tab: string) => {
    handleNavigate(tab);
    // On mobile/tablet, close drawer automatically on tab selection
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'notices':
        return <NoticesPage initialNoticeId={selectedItemId} />;
      case 'events':
        return <EventsPage initialEventId={selectedItemId} />;
      case 'complaints':
        return <ComplaintsPage initialComplaintId={selectedItemId} />;
      case 'lost-found':
        return <LostFoundPage initialItemId={selectedItemId} />;
      case 'resources':
        return <ResourcesPage initialResourceId={selectedItemId} />;
      case 'admin':
        return <AdminAnalyticsPage />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        onOpenSearch={() => setShowSearchModal(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onNavigate={handleNavigate}
        isSidebarOpen={sidebarOpen}
      />

      {/* Main Content Area with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentTab={currentTab}
          onNavigate={handleSidebarNavigate}
        />

        {/* Dynamic Page Workspace */}
        <main className="flex-1 min-w-0 pb-12">
          {renderContent()}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Smart Campus Hub</span>
            <span>•</span>
            <span>One Campus. One Platform. Everything Connected.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>MERN-Architecture Prototype</span>
            <span>•</span>
            <span>Powered by Gemini AI</span>
            <span>•</span>
            <button
              onClick={() => handleNavigate('complaints')}
              className="text-blue-600 hover:underline"
            >
              Support Helpdesk
            </button>
          </div>
        </div>
      </footer>

      {/* Modals and Floating Widgets */}
      <AuthModal />
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={handleNavigate}
      />
      <CampusAssistantModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </AuthProvider>
  );
}

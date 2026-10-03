import { Home, Activity, MessageSquare, Briefcase, User } from 'lucide-react';
import { router } from '@/lib/router';

interface BottomNavProps {
  activeTab: number;
  unreadNotifications?: number;
  unreadMessages?: number;
}

const tabs = [
  { name: 'Home', icon: Home },
  { name: 'Activity', icon: Activity },
  { name: 'Messages', icon: MessageSquare },
  { name: 'Jobs', icon: Briefcase },
  { name: 'Me', icon: User },
];

export function BottomNav({ activeTab, unreadMessages = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-cream-white border-t border-olive-light/20 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto h-16">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === index;
          const showBadge = tab.name === 'Messages' && unreadMessages > 0;

          return (
            <button
              key={tab.name}
              onClick={() => router.switchTab(index)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors"
              aria-label={tab.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-olive-deep' : 'text-kaam-muted'
                  }`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-kaam-warning text-cream-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-olive-deep' : 'text-kaam-muted'
                }`}
              >
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

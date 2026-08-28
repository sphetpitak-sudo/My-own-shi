"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { createClient } from "@/lib/supabase/client";

interface ProfileData {
  display_name: string;
  avatar_url: string;
  points: number;
  is_admin: boolean;
}

interface ShellContextValue {
  profile: ProfileData | null;
  refreshProfile: () => Promise<void>;
}

const ShellContext = createContext<ShellContextValue>({
  profile: null,
  refreshProfile: async () => {},
});

export function useShell() {
  return useContext(ShellContext);
}

interface DashboardShellProps {
  children?: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, points, is_admin")
        .eq("id", user.id)
        .single();

      if (p) setProfile(p);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadProfile();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") loadProfile();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [loadProfile]);

  return (
    <ShellContext.Provider value={{ profile, refreshProfile: loadProfile }}>
      <div className="app-shell">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isAdmin={profile?.is_admin}
        />

        <div className="main-area">
          <Topbar
            userName={profile?.display_name}
            userAvatar={profile?.avatar_url}
            points={profile?.points ?? 0}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="content" style={{ padding: 0 }}>
            {children}
          </main>
        </div>

        <BottomNav />
      </div>
    </ShellContext.Provider>
  );
}

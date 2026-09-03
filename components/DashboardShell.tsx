"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import SealoChatFAB from "./chat/SealoChatFAB";
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
  const [userId, setUserId] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

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

  // Realtime points — keeps Topbar/Sidebar in sync across tabs and after admin grants
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`points-${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload: { new: unknown }) => {
          const next = payload.new as { points?: number; display_name?: string; avatar_url?: string } | undefined;
          if (next && typeof next.points === "number") {
            setProfile((prev) =>
              prev
                ? {
                    ...prev,
                    points: next.points as number,
                    display_name: (next.display_name as string) ?? prev.display_name,
                    avatar_url: (next.avatar_url as string) ?? prev.avatar_url,
                  }
                : prev
            );
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <ShellContext.Provider value={{ profile, refreshProfile: loadProfile }}>
      <div className="app-shell">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isAdmin={profile?.is_admin}
          userPoints={profile?.points}
        />

        <div className="main-area">
          <Topbar
            userName={profile?.display_name}
            userAvatar={profile?.avatar_url}
            points={profile?.points}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <main className="content" style={{ padding: 0 }}>
            {children}
          </main>
        </div>

        <BottomNav />
        <SealoChatFAB />
      </div>
    </ShellContext.Provider>
  );
}

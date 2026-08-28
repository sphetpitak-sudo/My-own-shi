"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DashboardShell from "@/components/DashboardShell";
import ReadingHistory from "@/components/ReadingHistory";

export default function HistoryPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      setUserId(data.user?.id ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardShell>
        <div className="p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-[72px] w-full" />
            ))}
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!userId) {
    return (
      <DashboardShell>
        <div className="p-4 md:p-8">
          <div className="empty">
            <div className="empty-title">กรุณาเข้าสู่ระบบ</div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="px-4 pt-4 pb-28 md:px-8 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="page-header">
            <h1 className="page-title">ประวัติการทำนาย</h1>
            <p className="page-sub">ดูการทำนายทั้งหมดของคุณ</p>
          </div>
          <ReadingHistory userId={userId} />
        </div>
      </div>
    </DashboardShell>
  );
}
